/*\
title: test/wikimethods/group.js
type: application/javascript
tags: $:/tags/test-spec

Tests the wikimethods used by cyoa for managing page groups.

\*/

describe("groups",function() {

const utils = require("test/utils.js");

const defaultGroupTiddler = utils.defaultGroup();

function test(wiki,expected,group) {
	expect(Object.keys(wiki.getTiddlersInCyoaGroup(group))).toEqual(expected);
};

it("ignores drafts",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		defaultGroupTiddler,
		utils.group("S"),
		{title: "S_title","cyoa.group": "S"},
		utils.draft({title: "S_title","cyoa.group": "S"}),
		{title: "title","cyoa.only": "first"},
		utils.draft({title: "title","cyoa.only": "first"}),
		utils.draft({title: "badPtr","cyoa.after": "XXX"}),
		{title: "XXX"}
	]);
	test(wiki,["title"]);
	test(wiki,["S_title"],"S");

});

it("warns if tiddler specifies unidentified page set",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		defaultGroupTiddler,
		utils.group("setA"),
		{title: "A","cyoa.group": "setA"},
		{title: "B","cyoa.group": "wut"},
	]);
	utils.warnings(spyOn);
	test(wiki,["A"],"setA");
	expect(utils.warnings()).toHaveBeenCalledWith("Page set 'wut' specified in tiddler 'B' does not exist.");
});

it("handles transclusion in widget",function() {
	const t = "transclude_target";
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		defaultGroupTiddler,
		{title: t},
		{title: "tt",text: "<$cyoa after={{"+t+"!!title}} />",pointer: t}
	]);
	test(wiki,[t]);
});

it("handles transclusion in widget using self-reference",function() {
	const t = "transclude_target";
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		defaultGroupTiddler,
		{title: t},
		{title: "tt",text: "<$cyoa after={{!!pointer}} />",pointer: t}
	]);
	test(wiki,[t]);
});

it("ignores list-before & list-after directives",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.group("S"),
		{title: "a","cyoa.group": "S"},
		{title: "b","cyoa.group": "S","list-before": "a"},
		{title: "c","cyoa.group": "S"}
	]);
	test(wiki,["a","b","c"],"S");
});

it("allows non-page tiddlers",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		defaultGroupTiddler,
		utils.group("Q"),
		{title: "$:/config/mythos/cyoa/page-filter",text: "[all[]!tag[notpage]]"},
		{title: "a","cyoa.only": "first"}, // control
		{title: "b","cyoa.only": "first",tags: "notpage"}, // no PAGE tracks this
		{title: "c-tracker","cyoa.after": "c"},
		{title: "c",tags: "notpage"},
		{title: "d-tracker","cyoa.after": "d",tags: "notpage"},
		{title: "d",tags: "notpage"},
		{title: "qa","cyoa.group": "Q"},
		{title: "qb","cyoa.group": "Q",tags: "notpage"},
	]);
	test(wiki,["a","c"]);
	test(wiki,["qa","qb"],"Q");
});

it("does not allow non-existent tiddlers",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		defaultGroupTiddler,
		{title: "1","cyoa.after": "zzz"},
		{title: "2","cyoa.after": "1"},
	]);
	test(wiki,["1"]);
});
});
