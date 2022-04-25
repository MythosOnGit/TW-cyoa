/*\
title: test/cyoa/core.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa Book class, which runs everything.

\*/
var Cyoa = require("cyoa");
var utils = Cyoa.utils;
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

/*
This test requires the $cyoa.document property to exist. Otherwise, I'll just fill up my code with document arguments.
*/
describe("#focus_on_page",function() {
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
		core.focus_on_page();
		expect(core.topPage).toBe("A");
	});
});

describe("#resolveNextPage",function() {
	var href = "Misty's \"dark\" revenge/rampage/teaparty";
	var hrefEnc = encodeURIComponent(href);
	var hrefPageEnc = utils.encodePage(href);
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
