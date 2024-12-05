/*\
title: test/filters/links.js
type: application/javascript
tags: $:/tags/test-spec

Tests the [cyoa:links[]] filter operator.

\*/

describe("appends",function() {

it("works",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "A",text: "<$cyoa to='B'/>"},
		{title: "B"}]);
	expect(wiki.filterTiddlers("[[A]cyoa:links[]]")).toEqual(["B"]);
});

});
