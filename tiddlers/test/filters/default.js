/*\
title: test/filters/default.js
type: application/javascript
tags: $:/tags/test-spec

Tests the [cyoa:default[]] filter operator.

\*/

var defaultConfig = "$:/config/mythos/cyoa/default";

describe("filter: default",function() {

function test(tiddlers,filter,expected) {
	var wiki = new $tw.Wiki()
	wiki.addTiddlers(tiddlers);
	var output = wiki.filterTiddlers(filter);
	expect(output).toEqual(expected);
};

it("as filter",function() {
	test([{title: defaultConfig,text: "B"}],
	     "A B C +[cyoa:default[]]",["B"]);
	test([{title: defaultConfig,text: "B"}],
	     "A B C +[!cyoa:default[]]",["A","C"]);
});

it("as filter with null page",function() {
	test([],"A B C +[cyoa:default[]]",[]);
	test([],"A B C +[!cyoa:default[]]",["A","B","C"]);
});

});
