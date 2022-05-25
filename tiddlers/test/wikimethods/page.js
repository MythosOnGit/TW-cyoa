/*\
title: test/wikimethods/page.js
type: application/javascript
tags: $:/tags/test-spec

Tests the isCyoaPage and getCyoaPageMap wikimethods.

\*/

var filterConfig = "$:/config/mythos/cyoa/page-filter";

describe("wikimethod: getCyoaPageMap",function() {

function test(tiddlers,expected) {
	const wiki = new $tw.Wiki()
	wiki.addTiddlers(tiddlers);
	const output = wiki.getCyoaPageMap();
	expect(Object.keys(output)).toEqual(expected);
};

it("without config",function() {
	test([{title: "A"},{title: "B",tags: "exclude"}],["A","B"]);
	// no system tiddlers
	test([{title: "A"},{title: "B"},{title: "$:/system"}],["A","B"]);
	// no cyoa css tiddlers
	test([{title: "A"},{title: "B.css",type: "text/css",tags: "$:/tags/cyoa/Stylesheet",text: "/* contains no actual css */"}],["A"]);
	// no cyoa javascript tiddlers
	test([{title: "A"},{title: "B.js",type: "application/javascript",tags: "$:/tags/cyoa/Javascript",text: "/* contains no actual javascript */"}],["A"]);
	// no drafts
	test([{title: "A"},{title: "B"},{title: "Draft of 'B'","draft.of": "B","draft.title": "B"}],["A","B"]);
});

it("with config",function() {
	const config = {title: filterConfig,text: "[!tag[exclude]]"};
	test([config,{title: "A"},{title: "B",tags: "exclude"},{title: "$:/system"}],["A"]);
	test([config,{title: "A"},{title: "B",tags: "exclude"},{title: "C.css",type: "text/css",tags: "$:/tags/cyoa/Stylesheet",text: "/* contains no actual css */"}],["A"]);
	test([config,{title: "A"},{title: "B",tags: "exclude"},{title: "C.js",type: "application/javascript",tags: "$:/tags/cyoa/Javascript",text: "/* contains no actual javascript */"}],["A"]);
	test([config,{title: "A"},{title: "B"},{title: "Draft of 'B'","draft.of": "B","draft.title": "B"},{title: "C",tags: "exclude"}],["A","B"]);
});

it("empty config",function() {
	const config = {title: filterConfig,text: ""};
	test([config,{title: "A"},{title: "B",tags: "exclude"},{title: "$:/system"}],["A","B"]);
});

it("non-existent tiddlers",function() {
	const config = {title: filterConfig,text: "A B C"};
	test([{title: "A"},{title: "C"}],["A","C"]);
});

});

describe("wikimethod: isCyoaPage",function() {

it("functions",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler({title: "A"});
	expect(wiki.isCyoaPage("A")).toBe(true);
	expect(wiki.isCyoaPage("B")).toBe(false);
});

});
