/*\
title: test/macros/filename.js
type: application/javascript
tags: $:/tags/test-spec

Tests the <<cyoa-filename>> macro.

\*/

describe("macro: filename",function() {

const settings = "$:/config/mythos/cyoa/filename";

function test(wiki,expected,options) {
	options = options || {};
	var results = wiki.renderText("text/plain",
		"text/vnd.tiddlywiki",
		options.text || "<$text text=<<cyoa-filename>> />");
	expect(results).toBe(expected,options.message);
};

it("no name",function() {
	const wiki = new $tw.Wiki();
	test(wiki,"cyoa.html");
});

it("basic name",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler({title: settings,text: "basic"});
	test(wiki,"basic.html");
});

it("markdown polluted name",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler({title: settings,text: "**file**"});
	test(wiki,"**file**.html");
});

it("transclude name",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: settings,text: "file_{{test}}"},
		{title: "test",text: "5"}
	]);
	test(wiki,"file_5.html");
});

it("filtered transclude name",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: settings,text: "file_{{{[[6]]}}}"}
	]);
	test(wiki,"file_6.html");
});

});
