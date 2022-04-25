/*\
title: test/wikimethods/default.js
type: application/javascript
tags: $:/tags/test-spec

Tests the getCyoaDefaultPage wiki method.

\*/

var defaultConfig = "$:/config/mythos/cyoa/default";

describe("wikimethod: default",function() {

function test(tiddlers,expected) {
	var wiki = new $tw.Wiki()
	wiki.addTiddlers(tiddlers);
	var output = wiki.getCyoaDefaultPage();
	expect(output).toBe(expected);
};

it("with config",function() {
	test([{title: defaultConfig,text: "Go here on missing page"}],
	     "Go here on missing page");
});

it("blank or missing config, but start available",function() {
	test([{title: "$:/config/mythos/cyoa/start",text: "start"}],"start");
	test([
		{title: defaultConfig,text: ""},
		{title: "$:/config/mythos/cyoa/start",text: "start"}],"start");
});

it("blank or missing config",function() {
	test([],null);
	test([{title: defaultConfig,text: ""}],null);
});

});
