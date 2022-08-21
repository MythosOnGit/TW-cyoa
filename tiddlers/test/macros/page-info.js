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

it("line breaks using <p>",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "test","cyoa.after": "other","cyoa.depend": "other",text: "<<cyoa-page-info test>>"},
		{title: "other"}]);
	var results = wiki.renderTiddler("text/html","test");
	expect(results).toContain("</p><p>");
});

it("passes along currentTiddler to $cyoa widget",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "test","cyoa.only": "first",text: "<$tiddler tiddler=test><<cyoa-page-info test>></$tiddler>"}]);
	var results = wiki.renderTiddler("text/html","test");
	expect(results).toContain("First");
});

it("properly links titles",function() {
	function testString(title) {
		const wiki = new $tw.Wiki();
		wiki.addTiddlers([
			{title: title},
			{title: "test","cyoa.if": "#{"+title+"}",text: "<<cyoa-page-info test>>"}]);
		var results = wiki.renderTiddler("text/plain","test");
		expect(results).toBe("If: " + title);
	};
	testString("Simple");
	testString("With [brackets]");
	testString("With [brackets] in middle");
	testString("With [[doubles]]");
	testString("With [[doubles]] in middle");
	testString("With 'apos'");
	testString("[[With]] 'apos'");
	testString("With \"quotes\"");
	testString("[[With]] \"quotes\"");
	testString("[[With]] \"quotes n' apos\"");
	// Duplication between brackets to make sure the filter attribute aren't removing duplicates
	testString("With]With]]With] \"quotes n' apos\"");
});

it("escapes surrounding snippet parts as text",function() {
	function testString(string,expected) {
		const wiki = new $tw.Wiki();
		wiki.addTiddlers([
			{title: "test","cyoa.if": string,text: "<<cyoa-page-info test>>"}]);
		var results = wiki.renderTiddler("text/plain","test");
		expect(results).toBe("If: " + expected);
	};
	testString("Simple #{test} first","Simple test first");
	testString("'Quote' #{test} \"next\"","'Quote' test \"next\"");
	testString("<$text text=widget/> #{test}","<$text text=widget/> test");
	// The double apostrophe is tough to escape, but it must be, or it will be interpreted as the start of bold text.
	testString("\"apos\" + '' + \"quotes\"","\"apos\" + '' + \"quotes\"");
});

});
