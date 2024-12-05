/*\
title: test/logic/index.js
type: application/javascript
tags: $:/tags/test-spec

Tests indexes in pages and widgets

\*/

const utils = require("test/utils.js");

describe("Logic: index",function() {

it("gracefully handles negative indices",function() {
	expect(function() {
	var core = utils.testBook([
		{title: "Main","cyoa.index": "-1","cyoa.append": "A B"},
		{title: "A"},
		{title: "B"}]);
		flip(doc,"Main1","B");
	}).toThrowError("index cannot be less than zero (-1)");
});

it("can take functions as indexes",function() {
	// Size will be the pool size
	var func =  "(function half(size) { return Math.floor(size/2); })",
		core;
	core = utils.testBook([
		{title: "Main","cyoa.index": func ,"cyoa.append": "A B C D E F"},
		{title: "A"},{title: "B"},{title: "C"},
		{title: "D"},{title: "E"},{title: "F"}]);
	expect(utils.activeNodes(core)).toEqual(['D']);
	var core = utils.testBook([
		{title: "Main","cyoa.index": func ,"cyoa.append": "A B C D E F"},
		{title: "A"},{title: "B"},{title: "C"},
		{title: "D"},{title: "E"},{title: "F", "cyoa.if": "0"}]);
	expect(utils.activeNodes(core)).toEqual(['C']);
});

it("hashes string indexes (and abs them)",function() {
	const str = "0";
	var core = utils.testBook([
		{title: "Main","cyoa.index": `'${str}'`,"cyoa.append": "A"},
		{title: "A"}]);
	expect(core.cyoa.hash(str)).withContext("Uh oh. The hash method must have changed. This tests needs a string which hashes to less than 0 to ensure that something using it handles negatives.").toBeLessThanOrEqual(-1);
	expect(core.openPages).toEqual(['Main','A']);
});

it("doesn't evaluate more pages than needed",function() {
	var main = {title: "Main","cyoa.append": "A B", "cyoa.index": "0"};
	var tiddlers = [
		utils.defaultGroup("set", {"cyoa.key": "group"}),
		{title: "sideEffect"},
		main,
		{title: "A","cyoa.if": "1==1", "cyoa.append": "test"},
		{title: "B","cyoa.if": "#{sideEffect}=true", "cyoa.append": "test"},
		{title: "test", "cyoa.append": "affected"},
		{title: "affected", "cyoa.if": "#{sideEffect}==true"}];

	var core = utils.testBook(tiddlers);
	expect(core.openPages).toEqual(["Main", "A", "test"]);

	main["cyoa.index"] = "1";
	core = utils.testBook(tiddlers);
	expect(core.openPages).toEqual(["Main", "B", "test", "affected"]);

	main["cyoa.index"] = "2";
	core = utils.testBook(tiddlers);
	expect(core.openPages).toEqual(["Main", "A", "test", "affected"]);
});

});
