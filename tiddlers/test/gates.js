/*\
title: test/gates.js
type: application/javascript
tags: $:/tags/test-spec

Tests the gate operators in tracking snippets in conditional page fields.
This focuses on logic gate tiddlers which manipulate evaluation

\*/

var utils = require("test/utils.js");

describe("Snippets: Tracked filter control operands",function() {

function testConditionFilter(tests,options) {
	options = options || {};
	var field = options.field || "after";
	var widgets = "";
	for(var test in tests) {
		widgets += '<$cyoa id="'+test+'" '+field+'="'+test+'"/>\n';
	}
	var core = utils.testBook([[
		utils.defaultGroup(),
		utils.group("echo","echo"),
		{title: "t","cyoa.group": "echo","after": "true"},
		{title: "tt","cyoa.group": "echo","after": "true"},
		{title: "ttt","cyoa.group": "echo","after": "true"},
		{title: "f","cyoa.group": "echo","after": "false"},
		{title: "ff","cyoa.group": "echo","after": "false"},
		{title: "fff","cyoa.group": "echo","after": "false"},
		{title: "1","cyoa.group": "echo","after": "1"},
		{title: "2","cyoa.group": "echo","after": "2"},
		{title: "3","cyoa.group": "echo","after": "3"},
		{title: "4","cyoa.group": "echo","after": "4"},
		{title: "5","cyoa.group": "echo","after": "5"},
		{title: "Main",text: widgets}
	]]);
	for(var test in tests) {
		var active = core.document.getElementById(test).classList.contains("cyoa-active");
		expect(active).toEqual(tests[test]);
	}
};

function testFilterAndCompliment(tests) {
	var keys = Object.keys(tests);
	for(var i = 0; i < keys.length; i++) {
		tests[keys[i].replace(/cyoa:/g,"!cyoa:")] = !tests[keys[i]];
	}
	testConditionFilter(tests);
};

it("works without any controls",function() {
	testConditionFilter({
		"t": true,
		"f": false,
		"t f": false});
});

it("any",function() {
	testFilterAndCompliment({
		"[enlist[t tt]cyoa:any[]]": true,
		"[enlist[t f]cyoa:any[]]": true,
		"[enlist[ff f]cyoa:any[]]": false,

		"[enlist[3 5]cyoa:any:lt[4]]": true,
		"[enlist[3 5]cyoa:any:lt[2]]": false,
		"[enlist[3 5]cyoa:any:gt[4]]": true,
		"[enlist[3 5]cyoa:any:gt[6]]": false,
		"[enlist[3 5]cyoa:any:eq[3]]": true,
		"[enlist[3 5]cyoa:any:eq[4]]": false});
});

it("all",function() {
	testFilterAndCompliment({
		"[enlist[t tt]cyoa:all[]]": true,
		"[enlist[t f]cyoa:all[]]": false,
		"[enlist[ff f]cyoa:all[]]": false,

		"[enlist[3 5]cyoa:all:lt[6]]": true,
		"[enlist[3 5]cyoa:all:lt[5]]": false,
		"[enlist[3 5]cyoa:all:gt[2]]": true,
		"[enlist[3 5]cyoa:all:gt[3]]": false,
		"[enlist[3 3]cyoa:all:eq[3]]": true,
		"[enlist[3 5]cyoa:all:eq[3]]": false,

		"[enlist[3 5]cyoa:all:lte[5]]": true,
		"[enlist[3 5]cyoa:all:lte[4]]": false,
		"[enlist[3 5]cyoa:all:gte[3]]": true,
		"[enlist[3 5]cyoa:all:gte[4]]": false,
		"[enlist[5 5]cyoa:all:neq[3]]": true,
		"[enlist[3 5]cyoa:all:neq[3]]": false});
});

it("none",function() {
	testFilterAndCompliment({
		"[enlist[t tt]cyoa:none[]]": false,
		"[enlist[t f]cyoa:none[]]": false,
		"[enlist[ff f]cyoa:none[]]": true,

		"[enlist[3 5]cyoa:none:lt[3]]": true,
		"[enlist[3 5]cyoa:none:lt[4]]": false,
		"[enlist[3 5]cyoa:none:gt[5]]": true,
		"[enlist[3 5]cyoa:none:gt[4]]": false,
		"[enlist[3 5]cyoa:none:eq[4]]": true,
		"[enlist[3 5]cyoa:none:eq[3]]": false});
});

it("nall",function() {
	testFilterAndCompliment({
		"[enlist[t tt]cyoa:nall[]]": false,
		"[enlist[t f]cyoa:nall[]]": true,
		"[enlist[ff f]cyoa:nall[]]": true,

		"[enlist[3 5]cyoa:nall:lt[5]]": true,
		"[enlist[3 5]cyoa:nall:lt[6]]": false,
		"[enlist[3 5]cyoa:nall:gt[3]]": true,
		"[enlist[3 5]cyoa:nall:gt[2]]": false,
		"[enlist[3 5]cyoa:nall:eq[3]]": true,
		"[enlist[3 3]cyoa:nall:eq[3]]": false});
});

it("shorthands",function() {
	testFilterAndCompliment({
		"[[1]cyoa:eq[1]]": true,
		"[[1]cyoa:neq[1]]": false,
		"[[3]cyoa:gt[1]]": true,
		"[[3]cyoa:lt[1]]": false,

		"[enlist[3 5]cyoa:lt[6]]": true,
		"[enlist[3 5]cyoa:lt[4]]": false});
});

it("sum",function() {
	testConditionFilter({
		"[enlist[t tt f]cyoa:sum[]cyoa:all:eq[2]]": true,
		"[enlist[t tt f]cyoa:sum[]cyoa:all:eq[3]]": false,
		"[enlist[1 3 5]cyoa:sum[]cyoa:all:eq[9]]": true,
		"[enlist[1 3 5]cyoa:sum[]cyoa:all:eq[8]]": false,

		"[enlist[3 4 5]cyoa:sum:lt[5]cyoa:all:eq[2]]": true,
		"[enlist[3 4 5]cyoa:sum:gt[3]cyoa:all:eq[2]]": true,
		"[enlist[3 4 5]cyoa:sum:eq[3]cyoa:all:eq[1]]": true,

		"[enlist[3 4 5]cyoa:sum[]]": true, // 12

		// shorthand
		"[enlist[3 4 5]cyoa:sum[]cyoa:eq[12]]": true});
});

it("diff",function() {
	testConditionFilter({
		"[enlist[t tt]cyoa:diff[]cyoa:all:eq[0]]": true,
		"[enlist[t f]cyoa:diff[]cyoa:all:eq[1]]": true,
		"[enlist[5 3]cyoa:diff[]]": true,
		"[enlist[3 1 5]cyoa:sum[]] [enlist[4 2]cyoa:sum[]] +[cyoa:diff[]]":true,

		"[enlist[5 2]cyoa:diff[]cyoa:eq[3]]": true});
});


it("sum complicated",function() {
	testConditionFilter({
		"[enlist[t tt ttt f ff]cyoa:sum[]!cyoa:all:lt[3]]": true,
		"[enlist[t tt ttt f ff]cyoa:sum[]!cyoa:all:lt[4]]": false});
});

it("properly closes gate groups",function() {
	// an end-gate must flag the end of "any" for this to eval to false
	testConditionFilter({"[enlist[t f]cyoa:any[]] ff": false});
});

it("repeats aren't removed",function() {
	testConditionFilter({"[enlist[t f]cyoa:any[]] [enlist[t ff]cyoa:any[]]": true});
});

it("nesting",function() {
	testConditionFilter({
		"[[f]] [enlist[f fff]cyoa:none[]] +[cyoa:any[]]": true,
		"[[t]] [enlist[tt fff]cyoa:none[]] +[cyoa:any[]]": true});
});

it("are no ops when not rendering cyoa",function() {
	function test(filter,expected) {
		var wiki = new $tw.Wiki();
		var widget = utils.createWidget("testTiddler",null,{},{wiki: wiki});
		widget.parentWidget.setVariable("cyoa-render","no");
		var results = wiki.filterTiddlers(filter,widget);
		expect(results).toEqual(expected);
	};
	test("t f",["t","f"]);
	test("[all[current]] A",["testTiddler","A"]);
	test("[enlist[A B C]cyoa:any[]]",["A","B","C"]);
});

});
