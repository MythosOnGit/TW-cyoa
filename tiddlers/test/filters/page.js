/*\
title: test/filters/page.js
type: application/javascript
tags: $:/tags/test-spec

Tests the [is[cyoa-page]] filter operator.

\*/

describe("page filter",function() {

var utils = require("test/utils.js");

function testFilter(wiki,input,output,options) {
	options = options || {};
	const filter = options.negated? "[!cyoa:page[]]" : "[cyoa:page[]]";
	expect(wiki.filterTiddlers(filter,null,input)).toEqual(output);
};

var pageConfig = "$:/config/mythos/cyoa/page-filter";
/*
doesn't matter which tiddler this is, as long as it's a shadow.
*/
var shadow = "$:/core/modules/filters.js";

it("with config",function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: pageConfig,text: "A B"},
		{title: "A"},
		{title: "B"}]);
	var list = ["A","no","B"];
	testFilter(wiki,list,["A","B"]);
	testFilter(wiki,list,["no"],{negated: true});
});

it("blank config",function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: pageConfig},
		{title: "A"},
		{title: "B"}]);
	var list = ["A","noexist","B","$:/page",shadow]
	testFilter(wiki,list,["A","B"]);
	testFilter(wiki,list,["noexist","$:/page",shadow],{negated: true});
});

it("added system tiddlers",function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: pageConfig,text: "[all[]] [[$:/page]]"},
		{title: "A"},
		{title: "B"},
		{title: "$:/page"},
		{title: "$:/tagged"}]);
	var list = ["A","B","C",shadow,"$:/page","$:/tagged"];
	testFilter(wiki,list,["A","B","$:/page"]);
});

it("exclusive",function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: pageConfig,text: "[all[]] -[tag[exclude]]"},
		{title: "A"},
		{title: "B",tags: "exclude"},
		{title: "C"},
		{title: "$:/system"}]);
	testFilter(wiki,wiki.getTiddlers(),["A","C"]);
	wiki.addTiddler({title: pageConfig,text: "[!tag[exclude]]"});
	testFilter(wiki,wiki.getTiddlers(),["A","C"]);
});

it("excludes all drafts, even when pulling tag list",function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "A","tags": "testPage"},
		{title: "Draft of 'A'",
			"draft.of": "A",
			"draft.title": "A",
			"tags": "testPage"},
		{title: "$:/tagged",
			"tags": "$:/tags/cyoa/SystemPage testPage"},
		{title: "Draft of '$:/tagged'",
			"draft.of": "$:/tagged",
			"draft.title": "$:/tagged",
			"tags": "$:/tags/cyoa/SystemPage testPage"},
		{title: pageConfig,text:  "[is[]] [all[tiddlers]tag[testPage]]"}]);
	var list = wiki.getTiddlersWithTag("testPage");
	testFilter(wiki,list,["$:/tagged","A"]);
});

it("provides warning when used in page-filter",function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: pageConfig,text: "[[A]cyoa:page[]]"},
		{title: "A"}]);
	var error = ["Filter Error: cyoa:page filter operator cannot be used in the cyoa Page Filter"];
	testFilter(wiki,[],error);
	// Check that the error doesn't cause it to lock up permanently
	wiki.addTiddler({title: pageConfig,text: "A"});
	testFilter(wiki,["A","B"],["A"]);
});

it("fires exception when used in page-filture during compile",function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: pageConfig,text: "[[A]cyoa:page[]]"},
		{title: "A"}]);
	var widget = utils.createWidget();
	widget.setVariable("cyoa-render","yes");
	function method() {
		wiki.filterTiddlers("[cyoa:page[]]",widget,["A"]);
	};
	expect(method).toThrowError("Filter Error: cyoa:page filter operator cannot be used in the cyoa Page Filter");
	// Check that the error doesn't cause it to lock up permanently
	wiki.addTiddler({title: pageConfig,text: "A"});
	testFilter(wiki,["A","B"],["A"]);
});

});
