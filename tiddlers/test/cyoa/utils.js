/*\
title: test/cyoa/utils.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa utilities.

\*/

var utils = require("cyoa").utils;
var domParser = require("test/dom-parser");

describe("utils",function() {

describe("#getMetaContent",function() {
	it("can fetch meta content",function() {
		var meta =  "<meta name='test' content='best' />";
		var doc = domParser.parseBodyAndHead("",meta);
		expect(utils.getMetaContent("test",doc)).toBe("best");
	});

	it("bad lookup returns null",function() {
		var meta =  "<meta name='test' content='best' />";
		var doc = domParser.parseBodyAndHead("",meta);
		expect(utils.getMetaContent("not here",doc)).toBeNull();
	});
});

describe("#getSubpages",function() {
	var testString = `<div class="cyoa-content">
	  <div class="cyoa-page" id="populated" data-append="A B C" />
	  <div class="cyoa-page" id="complex/%26name"
	       data-append="space%20name" />
	  <div class="cyoa-page" id="empty" data-append="" />
	  <div class="cyoa-page" id="missing" />
	</div>`

	function getSubpages(pageName,document) {
		var doc = domParser.parseBodyAndHead(testString);
		return utils.getSubpages(pageName,doc);
	};

	it("can load a nonzero amount of subpages",function() {
		expect(getSubpages("populated")).toEqual(["A","B","C"]);
	});

	it("can load complex lists from complex pages",function() {
		expect(getSubpages("complex/&name")).toEqual(["space name"]);
	});

	it("can load a zero amount of subpages",function() {
		expect(getSubpages("empty")).toEqual([]);
	});

	it("can load a zero from a page without the attribute",function() {
		expect(getSubpages("missing")).toEqual([]);
	});
});

}); //utils
