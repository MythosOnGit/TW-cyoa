/*\
title: test/filters/variable.js
type: application/javascript
tags: $:/tags/test-spec

Tests the [cyoa:variable[]] filter operator.

\*/

describe("variable filter",function() {

function test(wiki,filter,expected) {
	expect(wiki.filterTiddlers(filter)).toEqual(expected);
};

it("uses title as default",function() {
	const wiki = new $tw.Wiki();
	test(wiki,
	     "default var track number +[cyoa:variable[]]",
	     ["default","var","track","number"]);
});

it("assumes cyoa.key",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler({title: "var", "cyoa.key": "output"});
	test(wiki,"[[var]cyoa:variable[]]", ["output"]);
});

it("works with other fields",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler({title: "var", field: "output"});
	test(wiki,"[[var]cyoa:variable[field]]", ["output"]);
});

});
