/*\
title: test/wikimethods/group.js
type: application/javascript
tags: $:/tags/test-spec

Tests the wikimethods used by cyoa for managing page groups.

\*/

describe("groups",function() {

const utils = require("test/utils.js");

const defaultGroupTiddler = utils.defaultGroup();
const defaultTitle = defaultGroupTiddler.title;

function getGroupMap(wiki) {
	var groupMap = Object.create(null);
	wiki.each(function(tiddler,title) {
		var group = wiki.getTiddlerCyoaGroup(title);
		if(group) {
			groupMap[group] = groupMap[group] || [];
			groupMap[group].push(title);
		}
	});
	return groupMap;
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
	var map = getGroupMap(wiki);
	expect(map[defaultTitle]).toEqual(["title"]);
	expect(map.S).toEqual(["S_title"]);
});

it("treats only correctly",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		defaultGroupTiddler,
		{title: "A", "cyoa.only": "first"},
		{title: "B", "cyoa.only": "visited"},
		{title: "C", "cyoa.only": "never"}]);
	expect(getGroupMap(wiki)[defaultTitle]).toEqual(["A","B"]);
});

it("allows nonexistent page set during wikimethod",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		defaultGroupTiddler,
		utils.group("setA"),
		{title: "A","cyoa.group": "setA"},
		{title: "B","cyoa.group": "setB"},
	]);
	var map = getGroupMap(wiki);
	expect(map.setA).toEqual(["A"]);
	expect(map.setB).toEqual(["B"]);
});

it("handles transclusion in widget",function() {
	const t = "transclude_target";
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		defaultGroupTiddler,
		{title: t},
		{title: "tt",text: "<$cyoa after={{"+t+"!!title}} />",pointer: t}
	]);
	expect(getGroupMap(wiki)[defaultTitle]).toEqual([t]);
});

it("handles transclusion in widget using self-reference",function() {
	const t = "transclude_target";
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		defaultGroupTiddler,
		{title: t},
		{title: "tt",text: "<$cyoa after={{!!pointer}} />",pointer: t}
	]);
	expect(getGroupMap(wiki)[defaultTitle]).toEqual([t]);
});

it("borrows info from default record if available",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		defaultGroupTiddler,
		{title: "Always", "cyoa.only": "first"},
		{title: "Main", text: "<$vars X=After><$cyoa after=<<X>> />"},
		{title: "After"}
	]);
	expect(getGroupMap(wiki)[defaultTitle]).toEqual(["Always"]);
	utils.testBook([], {wiki: wiki});
	wiki.commitCyoaGroups();
	expect(getGroupMap(wiki)[defaultTitle]).toEqual(["After","Always"]);
});

it("ignores list-before & list-after directives",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.group("S"),
		{title: "a","cyoa.group": "S"},
		{title: "b","cyoa.group": "S","list-before": "a"},
		{title: "c","cyoa.group": "S"}
	]);
	expect(getGroupMap(wiki).S).toEqual(["a","b","c"]);
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
	var map = getGroupMap(wiki);
	expect(map[defaultTitle]).toEqual(["a","c"]);
	expect(map.Q).toEqual(["qa","qb"]);
});

it("does not allow non-existent tiddlers",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		defaultGroupTiddler,
		{title: "1","cyoa.after": "zzz"},
		{title: "2","cyoa.after": "1"},
	]);
	expect(getGroupMap(wiki)[defaultTitle]).toEqual(["1"]);
});
});
