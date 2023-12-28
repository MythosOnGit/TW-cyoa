/*\
title: test/filters/appendsort.js
type: application/javascript
tags: $:/tags/test-spec

Tests the [appendsort] filter operator.

\*/

describe("appendsort",function() {

var utils = require("test/utils.js");

function makeTiddlers(list,appends) {
	var tiddlers = [];
	appends = appends || {};
	$tw.utils.each(list,function(title) {
		var append = appends[title] || [];
		var appendStr = $tw.utils.stringifyList(append);
		tiddlers.push({"title": title,"cyoa.append": appendStr});
	});
	return tiddlers;
};

/*
tests a list against rules.
list: an array of titles.
rules: an object {"A" => ["B", "C"], ...} such that B and C come after A
It ignores rules where either title isn't in the list.
*/
function testRules(list,rules) {
	for(var first in rules) {
		var followers = rules[first];
		var fIndex = list.indexOf(first);
		for(var i = 0; i < followers.length; i++) {
			var index = list.indexOf(followers[i]);
			if(index < 0 || fIndex < 0 || fIndex >= index) {
				var ruleStr = `${first} before ${followers.join(",")}`;
				expect(false).withContext(`expected ${list} to follow rule: ${ruleStr}`).toBeTruthy();
			}
		}
	}
};

function filter(wiki,list,widget) {
	const listStr = $tw.utils.stringifyList(list);
	return wiki.filterTiddlers(listStr + " +[appendsort[]]",widget);
};

function test(list,rules,rulesForTesting) {
	rulesForTesting = rulesForTesting || rules;
	const wiki = new $tw.Wiki();
	wiki.addTiddlers(makeTiddlers(list,rules));
	const results = filter(wiki,list);
	expect(results.length).toBe(list.length);
	for(var i = 0; i < list.length; i++) {
		expect(results).toContain(list[i]);
	}
	testRules(results,rulesForTesting);
	return results;
};

it("works with no dependencies",function() {
	test(["a","b","c"],{});
});

it("works with one dependencies",function() {
	test(["a","b","c","d"],{"c": ["a"]});
});

it("in reverse",function() {
	test(["c","b","a"],{ "a": ["b"],"b": ["c"]});
});

it("handles when missing tiddlers are appended",function() {
	utils.warnings(spyOn);
	test(["a","b","c"],{ "b": ["x","a","c"] },{ "b": ["a","c"]});
	expect(utils.warnings()).not.toHaveBeenCalled();
});

it("keeps first item close to front as possible",function() {
	const list = "abcdefghijklmnopqrstuvwxyz".split("");
	list.unshift("start");
	const rules = {"z": ["start"],"y": ["z"]};
	const output = test(list,rules);
	expect(output).toContain("y");
	expect(output.indexOf("z")).toBeGreaterThan(output.indexOf("y"));
	expect(output.indexOf("start")).toBeGreaterThan(output.indexOf("z"));
});

it("handles circular dependencies",function() {
	const list = ["x0","x1","x2","x3","x4"];
	const rules = { "x3": ["x2"],"x2": ["x1"],"x1": ["x3"]};
	const wiki = new $tw.Wiki();
	wiki.addTiddlers(makeTiddlers(list,rules));
	const results = filter(wiki,list);
	expect(results.length).toBe(1);
	const msg = results[0];
	expect(msg).toContain("Filter Error: Circular dependency detected within tiddlers");
	expect(msg).toContain("x1")
	expect(msg).toContain("x2")
	expect(msg).toContain("x3")
	expect(msg).not.toContain("x0")
	expect(msg).not.toContain("x4")
});

it("handles append sets",function() {
	const list = ["a1","a2","a","b1","b2","b","c"];
	const rules = {"a":["a1","a2"],"b":["b1","b2"],"b2":["b1","a"]};
	test(list,rules);
});

it("handles appends using self-referencing filters",function() {
	const list = ["a1","a2","ref-after","ref","c1"];
	const rules = {"ref": ["[{!!title}addsuffix[-after]]"]};
	const testRules = {"ref": ["ref-after"]};
	test(list,rules,testRules);
});

it("passes <<currentTiddler>> along through the widget",function() {
	const list = ["m/b","m/a"];
	const rules = {"m/a":["[<currentTiddler>removesuffix[a]addsuffix[b]]"]};
	const testRules = {"m/a": ["m/b"]};
	test(list,rules,testRules);
});

it("properly passes along non-existent pages in source",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "A"},
		{title: "C", "cyoa.append": "A"},
		{title: "D"}]);
	const results = filter(wiki,["A","B","C","D"]);
	expect(results).toEqual(["C","A","B","D"]);
});

it("properly ignores non-existent pages in append lists",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "A"},
		{title: "B", "cyoa.append": "A X"},
		{title: "C"}]);
	const results = filter(wiki,["A","B","C"]);
	expect(results).toEqual(["B","A","C"]);
});

it("properly sorts non-existent pages in append lists and source",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "B", "cyoa.append": "A"},
		{title: "C"}]);
	// "A" does not exist in this case, but there are directives for it. Obey them.
	const results = filter(wiki,["A","B","C"]);
	expect(results).toEqual(["B","A","C"]);
});

});
