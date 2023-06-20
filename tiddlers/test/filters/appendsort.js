/*\
title: test/filters/appendsort.js
type: application/javascript
tags: $:/tags/test-spec

Tests the [appendsort] filter operator.

\*/

describe("appendsort",function() {

var appendsort = require("$:/plugins/mythos/cyoa/js/filters/appendsort").appendsort;
var utils = require("test/utils.js");
var CircularDependencyError = appendsort.CircularDependencyError;

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

it("ensures cyoa-render is enabled",function() {
	// AAA should get placed after Main, even though it only comes up in the cyoa.append if cyoa-render is active
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "a", "cyoa.append": "c"},
		{title: "b", "cyoa.append": "[<cyoa-render>!match[]then[a]]"},
		{title: "c"}]);
	var widget = utils.createWidget();
	widget.setVariable("cyoa-render","yes");
	const results = filter(wiki,["a","b","c"],widget);
	testRules(results,{"b":["a"]});
});

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
	var thrown = false;
	// The chai throw assertion doesn't work for some reason.
	// It seems to do with the fact we're in a tiddler right now.
	try {
		test(list,rules);
	}
	catch (e) {
		expect(e instanceof CircularDependencyError).toBeTruthy();
		expect(e.message).toContain("Circular dependency");
		expect(e.message).toContain("x1")
		expect(e.message).toContain("x2")
		expect(e.message).toContain("x3")
		expect(e.message).not.toContain("x0")
		expect(e.message).not.toContain("x4")
		thrown = true;
	}
	expect(thrown).toBeTruthy();
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

it("properly ignores title-only items in stream",function() {
	const wiki = new $tw.Wiki();
	const list = ["titleA","titleB"];
	expect(filter(wiki,list)).toEqual(list);
});

});
