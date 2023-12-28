/*\
title: test/logic/push.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa push mechanic.

\*/

describe("Logic: push",function() {

const utils = require("test/utils.js");
const stackTiddler = $tw.wiki.getCyoaGroups().stack;

function testBook(expectedOpenPages /*,tiddlerArrays... */) {
	var tiddlerArrays = Array.prototype.slice.call(arguments,1);
	var core = utils.testBook([[stackTiddler]].concat(tiddlerArrays));
	expect(core.openPages).toEqual(expectedOpenPages);
	return core.cyoa.vars;
};

function node(name,attributes) {
	return Object.assign({title: name},attributes);
};

it("prioritizes pushed pages",function() {
	var tiddlers = [node("A"),node("B",{"cyoa.if": "false"}),node("C"),
		{title: "Main","cyoa.push": "B","cyoa.append": "A B C"}];
	var vars = testBook(["Main","B"],tiddlers);
	expect(vars.stack.toString()).toBe("");
});

it("works with other variables",function() {
	var tiddlers = [
		{title: "$:/config/mythos/cyoa/stack", text: "other"},
		node("A"),node("B",{"cyoa.if": "false", "cyoa.push": "D"}),node("C"),node("D"),
		{title: "Main","cyoa.push": "B","cyoa.append": "A B C"}];
	var core = utils.testBook([tiddlers]);
	expect(core.openPages).toEqual(["Main","B"]);
	expect(core.cyoa.vars.other.toString()).toBe("D");
});

it("takes top of stack only",function() {
	var tiddlers = [node("A"),node("B"),node("C"),
		{title: "Main","cyoa.append": "Main2","cyoa.push": "B"},
		{title: "Main2","cyoa.append": "Main3","cyoa.push": "C"},
		{title: "Main3","cyoa.append": "A B C"}];
	var vars = testBook(["Main","Main2","Main3","C"],tiddlers);
	expect(vars.stack.toString()).toBe("B");
});

it("ignores push stack if top not in append list",function() {
	var tiddlers = [node("A"),node("B"),node("C"),node("notThere"),
		{title: "Main","cyoa.append": "A B C","cyoa.push": "notThere"}];
	var vars = testBook(["Main","A"],tiddlers);
	expect(vars.stack.toString()).toBe("notThere");
});

it("provides warning when pushing nonexistent tiddler",function() {
	var vars;
	utils.warnings(spyOn);
	//field
	vars = testBook(["Main","A"],[node("A"),node("B"),node("C"),
		{title: "Main","cyoa.append": "A B C","cyoa.push": "notThere"}]);
	expect(vars.stack.toString()).toBe("");
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'Main': pushes non-page tiddler 'notThere'");

	// widget
	utils.warnings().calls.reset();
	vars = testBook(["Main","A"],[node("A"),node("B"),node("C"),
		{title: "Main","cyoa.append": "A B C",text: "<$cyoa push='notThere' />"}]);
	expect(vars.stack.toString()).toBe("");
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'Main': $cyoa widget pushes non-page tiddler 'notThere'");
});

it("provides details when non-page is pushed in tiddlywiki",function() {
	utils.warnings(spyOn);
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "Main",text: "<$cyoa push='noexists'>Content</$cyoa>"});
	var dom = utils.renderTiddler(wiki,"Main");
	expect(utils.warnings()).not.toHaveBeenCalled();
	var state = dom.getElementsByClassName("cyoa-state")[0];
	expect(state.className).toContain("cyoa-error");
	// Reaching into Info node
	var links = state.firstElementChild.getElementsByTagName("a");
	// The link in the info should have the error class
	expect(links[0].className).toContain("cyoa-error");
});

it("can return to pushed pages",function() {
	// I put the test in an appended page to make sure it's not taking <<currentTiddler>> by mistake.
	var core = utils.testBook([[
		$tw.wiki.getCyoaGroups().stack,
		{title: "Main","cyoa.append": "Main2"},
		{title: "Main2",text: "<$cyoa id=link1 onclick push=Main to=menu />","cyoa.append": "Main3"},
		{title: "Main3",text: "<$cyoa id=link3 to=menu />"},
		{title: "defpage"},
		{title: "menu",text: "<$cyoa id=link2 to=defPage return>Return</$cyoa>"}]]);
	utils.click(core,"link1");
	expect(core.manager.getPage()).toBe("menu");
	utils.click(core,"link2");
	expect(core.manager.getPage()).toBe("Main");
	// Click 3 doesn't push a page, so the stack should be empty.
	utils.click(core,"link3");
	utils.click(core,"link2");
	expect(core.manager.getPage()).toBe("defPage");
});

/*
it("can use custom variable",function() {
	var customStack = {
		title: stackTiddler.fields.title,
		type: stackTiddler.fields.type,
		text: stackTiddler.fields.text.replace(/^variable: .*$/m,"variable: custom")};
	var tiddlers = [customStack,node("A"),node("B"),node("C"),
		{title: "Main","cyoa.push": "junk","cyoa.append": "Main2"},
		{title: "Main2","cyoa.push": "B","cyoa.append": "A B C"}];
	var vars = testBook(["Main","Main2","B"],tiddlers);
	expect(vars.custom.toString()).toBe("junk");
});
*/

});
