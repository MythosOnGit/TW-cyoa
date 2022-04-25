/*\
title: test/macros/page-info.js
type: application/javascript
tags: $:/tags/test-spec

Tests the <<cyoa-page-info>> macro.

\*/

describe("macro: page-info",function() {

const settings = "$:/config/mythos/cyoa/filename";

it("works with currentTiddler",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "test","cyoa.after": "other",text: "<$tiddler tiddler=test><$text text=<<cyoa-page-info>> /></$tiddler>"},
		{title: "other"}]);
	var results = wiki.renderTiddler("text/plain","test");
	expect(results).toContain("other");
});

it("line breaks using <br>",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "test","cyoa.after": "other","cyoa.depend": "other",text: "<<cyoa-page-info test>>"},
		{title: "other"}]);
	var results = wiki.renderTiddler("text/html","test");
	expect(results).toContain("<br>");
});

it("passes along currentTiddler to $cyoa widget",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "test","cyoa.only": "first",text: "<$tiddler tiddler=test><<cyoa-page-info test>></$tiddler>"}]);
	var results = wiki.renderTiddler("text/html","test");
	expect(results).toContain("First");
});

});
