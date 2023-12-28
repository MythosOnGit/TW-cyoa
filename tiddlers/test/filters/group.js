/*\
title: test/filters/group.js
type: application/javascript
tags: $:/tags/test-spec

Tests the [cyoa:tracked[]] filter operator.

\*/

const utils = require("test/utils.js");

const defaultSetTiddler = utils.defaultGroup("set", {"cyoa.serializer": "bitfield"});
const defTitle = defaultSetTiddler.title;

describe("group filter",function() {

function test(wiki,filter,expected) {
	expect(wiki.filterTiddlers(filter)).toEqual(expected);
};

it("filters out tiddlers in the default group set",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		defaultSetTiddler,
		{title: "a","cyoa.only": "first"},
		{title: "b"},
		{title: "c","cyoa.only": "first"},
		{title: "d","cyoa.after": "f"},
		{title: "e","cyoa.only": "first"},
		{title: "f"},
		utils.draft({title: "g","cyoa.only": "first"}),
		// "never" pages aren't tracked.
		{title: "h","cyoa.only": "never"},
		{title: "ex1","cyoa.exclude": "exgroup"},
		{title: "ex2","cyoa.exclude": "exgroup"},
		{title: "exgroup"}
	]);
	test(wiki,"[cyoa:group[]]",["a","c","e","ex1","ex2","f"]);
	test(wiki,"[!cyoa:group[]]",[defTitle,"b","d","Draft of 'g'","exgroup","h"]);
	test(wiki,"[cyoa:group["+defaultSetTiddler.title+"]]",["a","c","e","ex1","ex2","f"]);
	test(wiki,"[!cyoa:group["+defaultSetTiddler.title+"]]",[defTitle,"b","d","Draft of 'g'","exgroup","h"]);
	test(wiki,"[cyoa:group[noexist]]",[]);
	test(wiki,"[!cyoa:group[noexist]]",[defTitle,"a","b","c","d","Draft of 'g'","e","ex1","ex2","exgroup","f","h"]);
});

it("filters out tiddlers in custom groups",function() {
	const wiki = new $tw.Wiki();
	const Sgroup = utils.group("S");
	wiki.addTiddlers([
		defaultSetTiddler,
		Sgroup,
		{title: "s1","cyoa.group": "S"},
		{title: "n2"},
		{title: "s3","cyoa.group": "S"},
		{title: "d4","cyoa.only": "first"},
		{title: "s5","cyoa.group": "S"},
		utils.draft({title: "s6","cyoa.group": "S"})
	]);
	test(wiki,"[cyoa:group[]]",["d4","s1","s3","s5"]);
	test(wiki,"[!cyoa:group[]]",[defTitle,"Draft of 's6'","n2",Sgroup.title]);
	test(wiki,"[cyoa:group["+defaultSetTiddler.title+"]]",["d4"]);
	test(wiki,"[!cyoa:group["+defaultSetTiddler.title+"]]",[defTitle,"Draft of 's6'","n2",Sgroup.title,"s1","s3","s5"]);
	test(wiki,"[cyoa:group[S]]",["s1","s3","s5"]);
	test(wiki,"[!cyoa:group[S]]",[defTitle,"d4","Draft of 's6'","n2",Sgroup.title]);
});

it("doesn't bother with sorting",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		defaultSetTiddler,
		{title: "b","cyoa.only": "first","list-after": "d"},
		{title: "c","cyoa.only": "first"},
		{title: "d","cyoa.only": "first"}
	]);
	wiki.getCyoaGroupData({commitNow: true});
	wiki.addTiddler({title: "a","cyoa.only": "first"});
	test(wiki,"[cyoa:group[]]",["a","b","c","d"]);
});

/*
If cyoa.after calls cyoa:group, then group will call tracking to figure out what groups are what. Results in a recursive call. Instead, calls to cyao:group result in empty set while already evaulating cyoa:groups.
*/
it("handles nested cyoa:group without infinite recurse",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		defaultSetTiddler,
		{title: "a","cyoa.only": "first"},
		{title: "b","cyoa.after": "[cyoa:group[default]] d"},
		{title: "c","cyoa.only": "first"},
		{title: "d"},
		{title: "e"}
	]);
	test(wiki,"[cyoa:group[]]",["a","c","d"]);
});

it("doesn't include group tiddlers in default group ever",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		defaultSetTiddler,
		utils.group("S"),
		{title: "A"},
		{title: "B","cyoa.after": "A"},
		{title: "toucher","cyoa.before": "[cyoa:var[S]]","cyoa.touch": "[cyoa:var[S]]"}
	]);
	test(wiki,"[cyoa:group[]]",["A"]);
});

});

describe("getgroup filter",function() {

function test(input,expected,options) {
	var filter = $tw.utils.stringifyList(input) + " +[cyoa:getgroup[]]";
	expect(options.wiki.filterTiddlers(filter)).toEqual(expected);
};

it("fetches group of given tiddlers",function() {
	const wiki = new $tw.Wiki();
	const options = {wiki: wiki};
	wiki.addTiddlers([
		defaultSetTiddler,
		utils.group("S"),
		{title: "a","cyoa.only": "first"},
		{title: "b","cyoa.group": "S"},
		{title: "c"},
		{title: "d","cyoa.only": "first"}
	]);
	test(["a"],[defaultSetTiddler.title],options);
	test(["b"],["S"],options);
	test(["c"],[],options);
	test(["a","b","c","d"],["S",defaultSetTiddler.title],options);
});

});
