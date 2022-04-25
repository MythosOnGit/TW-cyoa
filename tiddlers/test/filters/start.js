/*\
title: test/filters/start.js
type: application/javascript
tags: $:/tags/test-spec

Tests the [cyoa:start[]] filter operator.

\*/

var startConfig = "$:/config/mythos/cyoa/start";
var defaultTiddlersConfig = "$:/DefaultTiddlers";

describe("filter: start",function() {

function test(tiddlers,filter,expected) {
	var wiki = new $tw.Wiki()
	wiki.addTiddlers(tiddlers);
	var output = wiki.filterTiddlers(filter);
	expect(output).toEqual(expected);
};

it("as filter",function() {
	test([{title: startConfig,text: "B"}],
	     "A B C +[cyoa:start[]]",
	     ["B"]);
});

it("as inverted filter",function() {
	test([{title: startConfig,text: "B"}],
	     "A B C +[!cyoa:start[]]",
	     ["A","C"]);
});

it("as filter with null page",function() {
	test([{title: defaultTiddlersConfig,text: ""}],
	     "A B C +[cyoa:start[]]",
	     []);
});

it("as inverted filter with null page",function() {
	test([{title: defaultTiddlersConfig,text: ""}],
	     "A B C +[!cyoa:start[]]",
	     ["A","B","C"]);
});

});
