/*\
title: test/cyoa/core.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa Book class, which runs everything.

\*/

const utils = require("test/utils.js");

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

it("can follow links with complicated titles",function() {
	var href = "Misty's \"dark\" revenge/rampage/teaparty";
	var core = utils.testBook([
		{title: "Main", text: '\\define link()'+href+'\n<a id="a" class="cyoa-state" href=<<link>> >Link text</a>'}]);
	utils.click(core,'a');
	expect(core.topPage).toBe(href);
});

it("deactivates the start page after it closes", function() {
	var core = utils.testBook([
		{title: "Target"},
		{title: "Main"}]);
	expect(core.document.getElementById("Target").classList.contains("cyoa-active")).toBe(false);
	// Let's just confirm that Start actually is a start page.
	core.openPage("Target");
	expect(core.document.getElementById("Target").classList.contains("cyoa-active")).toBe(true);
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

// This test exists because there were some cases were null and undefined were becoming tracked tiddlers when they weren't supposed to be.
it("can handle pages called null and undefined",function() {
	var core = utils.testBook([
		utils.defaultGroup(),
		{title: "Main", "cyoa.touch": "null undefined"},
		{title: "null"},
		{title: "undefined"}]);
	expect(core.state.allVisited()).toEqual(["null", "undefined"]);
});

}); // Book
