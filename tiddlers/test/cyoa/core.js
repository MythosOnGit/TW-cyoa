/*\
title: test/cyoa/core.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa Book class, which runs everything.

\*/
var Cyoa = require("cyoa");
const utils = require("test/utils.js");
var domParser = require("test/dom-parser");
var MockWindow = require("test/cyoa/mock/window");
var MockManager = require("test/cyoa/mock/manager");

function test_element_list(element_list,expected_ids) {
	var ids = element_list.map(function(e) {return e.id; });
	expect(ids).toEqual(expected_ids);
};

function newCore(html,state) {
	state = state || new Cyoa.State();
	var doc = domParser.parseBodyAndHead(html);
	var manager = new MockManager();
	var core = new Cyoa.Core(doc,state,manager);
	core.cyoa = {vars: Object.create(null)};
	return core;
};

function getWindow(document) {
	if($tw.browser) {
		return window;
	} else {
		return new MockWindow(document);
	}
};

function sendKeyboardEvent(document,keyboardEventInit) {
	var w = getWindow(document);
	var init = Object.assign({view: w,bubbles: true,cancelable: true},
	                         keyboardEventInit);
	// The most hackiest of hacks. This is because we use our
	// own custom window, which maybe we don't have to do anymore
	// given the new jsdom version
	var event = new w.KeyboardEvent("keydown",init);
	document.dispatchEvent(event);
	return event;
};

describe("Book",function() {

it("deactivates nodes and pages once they're closed", function() {
	var core = utils.testBook([
		utils.defaultGroup("set",{variable: "test"}),
		{title: "flag"},
		{title: "Main", "cyoa.append": "Main2"},
		{title: "Main2", "cyoa.append": "Main3"},
		{title: "Main3", text: `
			<$cyoa to=Main3 id=nA before=flag />
			<$cyoa id=nB after=flag />
			<!-- indexes use their own system. We make sure all false indices shut off -->
			<$cyoa index="#{flag}"><$cyoa id=tA before=flag/><$cyoa id=tB/></$cyoa>
			<!-- We also shut off true nodes that come earlier -->
			<$cyoa index="#{flag}"><$cyoa id=iA/><$cyoa id=iB/></$cyoa>
			<!-- We also shut off true nodes that come later -->
			<$cyoa index="1-#{flag}"><$cyoa id=rA/><$cyoa id=rB/></$cyoa>
		`, "cyoa.append": "pA pB"},
		{title: "pA", "cyoa.before": "flag", "cyoa.touch": "flag"},
		{title: "pB", "cyoa.after": "flag"}]);
	expect(utils.activeNodes(core)).toEqual(["Main2","Main3","iA","nA","pA","rB","tA"]);
	utils.click(core,"nA");
	expect(utils.activeNodes(core)).toEqual(["Main3","iB","nB","pB","rA","tB"]);
	// We didn't check the start page yet. Make sure it turned off.
});

it("deactivates the start page after it closes", function() {
	var core = utils.testBook([
		{title: "$:/config/mythos/cyoa/start", text: "Start"},
		{title: "Start"},
		{title: "Main"}]);
	expect(core.document.getElementById("Start").classList.contains("cyoa-active")).toBe(false);
	// Let's just confirm that Start actually is a start page.
	core.openPage();
	expect(core.document.getElementById("Start").classList.contains("cyoa-active")).toBe(true);
});

/*
This test requires the $cyoa.document property to exist. Otherwise, I'll just fill up my code with document arguments.
*/
describe("#openPage",function() {
	var sample_html = `<div class="cyoa-header">
	  <a id="Hl" class="tc-tiddlylink" href="nowhere">link text</a>
	</div>
	<div class="cyoa-content">
	  <div id="A" class="cyoa-page cyoa-start" data-append="C">
	    <a id="Al" class="tc-tiddlylink" href="#nowhere">link text</a>
	  </div>
	  <div id="B" class="cyoa-page">
	    <a id="Bl" class="tc-tiddlylink" href="#A">link text</a>
	  </div>
	  <div id="C" class="cyoa-page">
	    <a id="Cl" class="tc-tiddlylink" href="#D">link text</a>
	  </div>
	  <div id="D" class="cyoa-page">
	    <a id="Dl" class="tc-tiddlylink" href="#nowhere">link text</a>
	  </div>
	</div>
	<div class="cyoa-footer">
	  <a id="Fl" class="tc-tiddlylink" href="#nowhere">link text</a>
	</div>`;

	it("finds the start page",function() {
		var core = newCore(sample_html);
		core.openPage();
		expect(core.topPage).toBe("A");
	});
});

it("sets body title",function() {
	var title = "Dir/&title name%";
	var core = utils.testBook([{title: "Main"}, {title: title}]);
	core.openPage(title);
	var body = core.document.getElementsByTagName("body")[0];
	expect(body.getAttribute("data-title")).toBe(title);
});

it("handles titles with odd characters",function() {
	var title = "D?ir#/&title% name";
	var core = utils.testBook([{title: "Main"}, {title: title}]);
	core.openPage(title);
	expect(core.topPage).toBe(title);
});

describe("#resolveNextPage",function() {
	var href = "Misty's \"dark\" revenge/rampage/teaparty";
	var hrefEnc = encodeURIComponent(href);
	var hrefPageEnc = Cyoa.utils.encodePage(href);
	var badPage = "Don't go to \"the scary place\"";
	var badPage2 = "Bad stack";

	function core() {
		return new Book(window);
	};

	function flipv(newCyoa,expected,html) {
		var cyoa = Object.create(null);
		var state = new Cyoa.State();
		cyoa.stack = newCyoa.stack;

		var core = newCore(html,state);
		core.topPage = newCyoa.mainPage;
		var elem = new Cyoa.Link(core,core.document.getElementById("a"));
		var result = core.resolveNextPage(elem,cyoa);
		expect(result).toBe(expected);
	};

	it("resolves page from href",function() {
		flipv({stack: [],mainPage: badPage},href,`
		<div id="Main" class="cyoa-page cyoa-start">
		  <a id="a" class="cyoa-state" href="#${hrefEnc}">Link text</a>
		</div>`);
	});

	it("resolves page from cyoa.mainPage",function() {
		flipv({stack: [],mainPage: href},href,`
		<div id="Main" class="cyoa-page cyoa-start">
		  <a id="a" class="cyoa-state" href="#">Link text</a>
		</div>`);
	});
});

}); // Book
