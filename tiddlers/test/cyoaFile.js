/*\
title: test/cyoaFile.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoaFile template and subsections

These tests rely on the tiddlers in "tiddlywiki/tiddlers/meta"

\*/


describe("cyoaFile",function() {

var utils = require("test/utils.js");

var dir = "$:/config/mythos/cyoa/meta/";

var head = "$:/plugins/mythos/cyoa/compile/head";
var metaElement = "$:/plugins/mythos/cyoa/compile/meta-element";
var tiddlerCyoaHead = $tw.wiki.getTiddler(head);
var tiddlerMetaElem = $tw.wiki.getTiddler(metaElement);

function makeWiki() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([tiddlerCyoaHead,tiddlerMetaElem]);
	return wiki;
};

function extractMeta(wiki) {
	var head = "$:/plugins/mythos/cyoa/compile/head",
		text = wiki.renderTiddler("text/vnd.tiddlywiki",head,{}),
		match,
		regex = /<meta (\w+)="([^"]*)"\s+content="([^"]*)"\s*>/g,
		metas = Object.create(null);
	while((match = regex.exec(text)) !== null) {
		metas[match[2]] = {attr: match[1],value: match[3]};
	}
	return metas;
};

function getMetaTiddlers(wiki) {
	var tiddlers = Object.create(null);
	var list = wiki.filterTiddlers("[all[tiddlers+shadows]prefix["+dir+"]]");
	for(var i = 0; i < list.length; i++) {
		var t = wiki.getTiddler(list[i]);
		var title = t.fields["draft.title"] || list[i];
		var name = title.replace(dir,"");
		tiddlers[name] = t;
	}
	return tiddlers;
};

/** <head> section **/

it("has meta 'generator' built in",function() {
	var metaTags = extractMeta($tw.wiki);
	expect(metaTags["generator"].value).toBe("TiddlyWiki: Cyoa plugin");
	expect(metaTags["generator"].attr).toBe("name");
});

it("can accept custom meta",function() {
	var wiki = makeWiki();
	wiki.addTiddler({title: dir+"custom",text: "custom meta value" });
	var metaTags = extractMeta(wiki);
	expect(metaTags["custom"].value).toBe("custom meta value");
	expect(metaTags["custom"].attr).toBe("name");
});

it("uses proper meta attributes for specific tags",function() {
	var wiki = makeWiki();
	wiki.addTiddler({title: dir+"og:type",text: "website" });
	var metaTags = extractMeta(wiki);
	expect(metaTags["og:type"].value).toBe("website");
	expect(metaTags["og:type"].attr).toBe("property");
});

it("ignores empty metadata",function() {
	var wiki = makeWiki();
	wiki.addTiddler({title: dir+"empty",text: "" });
	var metaTags = extractMeta(wiki);

	var metaTiddlers = getMetaTiddlers(wiki);
	expect(Object.keys(metaTiddlers)).toContain("empty");
	var empty = metaTiddlers["empty"];
	expect(empty.getFieldString("text")).toBeEmpty;
	// Everything above was just to ensure that "empty" actually exists for this test. If it didn't, this test would erroneously pass.
	expect(Object.keys(metaTags)).not.toContain("empty");
});

it("handles inline transclusion",function() {
	var wiki = makeWiki();
	wiki.addTiddler({title: dir+"transclude",text: "{{!!test}}",test: "value"});
	var metaTags = extractMeta(wiki);
	var metaTiddlers = getMetaTiddlers(wiki);

	var tiddler = metaTiddlers["transclude"];
	var value = tiddler.getFieldString("test")
	expect(metaTags["transclude"].value).toBe(value);
});

it("ignores draft tiddlers",function() {
	var wiki = makeWiki();
	wiki.addTiddler(utils.draft({title: dir+"ignored",text: "don't render"}));
	var metaTags = extractMeta(wiki);
	expect(Object.keys(metaTags)).not.toContain("ignored");
});

/** <body> section **/

it("can have alternate content sections",function() {
	var core = utils.testBook([
		{title: "Main"},
		{title: "$:/tags/cyoa/Top", tags: "$:/tags/cyoa/Layout", class: "cyoa-top"},
		{title: "PageTop", tags: "$:/tags/cyoa/Top", text: "INCLUDED TEXT"}]);
	expect(core.document.documentElement.innerHTML).toContain("INCLUDED TEXT");
	var pageTop = core.document.getElementById("PageTop");
	expect(pageTop).not.toBeUndefined();
	expect(pageTop.className).not.toContain('cyoa-page');
	expect(pageTop.className).toContain('cyoa-top');
	// Make sure there isn't a copy of it in the article body
	var contentElems = core.document.getElementsByClassName('cyoa-content');
	expect(contentElems.length).toBe(1);
	expect(contentElems[0].innerHTML).not.toContain('INCLUDED TEXT');
});

});
