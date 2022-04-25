/*\
title: test/filters/appends.js
type: application/javascript
tags: $:/tags/test-spec

Tests the [cyoa:appends[]] filter operator.

\*/

describe("appends",function() {

function test(wiki,input,expected) {
	if(typeof input === "string") {
		input = [input];
	}
	var inputStr = $tw.utils.stringifyList(input);
	var filter = inputStr + " +[cyoa:appends[]]";
	expect(wiki.filterTiddlers(filter)).toEqual(expected);
};

it("works",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "A","cyoa.append": "B"},
		{title: "B"}]);
	test(wiki,"A",["B"]);
});

it("handles self referencing cyoa.appends",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "A","cyoa.append": "B [tag[A]]"},
		{title: "B"},
		{title: "taggy",tags: "A"}]);
	test(wiki,"A",["B","taggy"]);
});

});
