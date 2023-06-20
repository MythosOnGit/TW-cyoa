/*\
title: test/groups/set.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa String-hashable Set.

\*/

const utils = require("test/utils.js");

describe("Cyoa Set",function() {

function testBook(expected /*,tiddlerArrays... */) {
	var tiddlerArrays = Array.prototype.slice.call(arguments,1);
	tiddlerArrays.unshift([utils.defaultGroup("set",{"cyoa.style": "string"})]);
	var rtn = utils.testBookDefaultVar(tiddlerArrays);
	expect(rtn.results).toEqual(expected);
	// Remove the "s=" and split by period
	return valueOf(rtn.state).split(".").sort().join(".");
};

function testPremadeBook(wiki,expected) {
	var rtn = utils.testBookDefaultVar([],undefined,{wiki: wiki});
	expect(rtn.results).toEqual(expected);
	return rtn.state;
};

function node(name,parent,attributes) {
	var n = Object.assign({title: name},attributes);
	if(parent) { n["cyoa.imply"] = parent; }
	return n;
};

function valueOf(state) {
	return state.substr(state.indexOf("=")+1);
};

it("manages long implication chains",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.defaultGroup("set",{"cyoa.style": "string"}),
		node("A"),node("B","A"),node("C","B"),
		node("D","C"),node("E","D"),
		{title: "Main","cyoa.touch": "D C"}]);
	// Touching works
	var state = testPremadeBook(wiki,["A","B","C","D"]);
	expect(state).not.toContain("A");
	expect(state).not.toContain("B");
	expect(state).not.toContain("C");
	expect(state).toContain("D");
	expect(state).not.toContain("E");
	// Now test it's ability to reset
	wiki.addTiddler({title: "Main",text: "<$cyoa touch=E reset=C/>"});
	state = testPremadeBook(wiki,["A","B"]);
	expect(state).not.toContain("A");
	expect(state).toContain("B");
	expect(state).not.toContain("C");
	expect(state).not.toContain("D");
	expect(state).not.toContain("E");
});

it("resets does not activate inactive parents",function() {
	var state = testBook(["A"],
		[node("A"),node("B","A"),node("C","B"),
		{title: "Main","cyoa.touch": "A","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "C"}]);
});

it("manages forked chains",function() {
	var tiddlers = [node("A"),node("B1","A"),node("B2","A"),node("C1","B1"),node("C2","B2")];
	// If both branches touched, both must be listed, but no roots need be.
	var state = testBook(["A","B1","B2"],tiddlers,[{title: "Main","cyoa.touch": "B1 B2"}]);
	expect(state).not.toContain("A");
	expect(state).toContain("B1");
	expect(state).toContain("B2");

	// Resets affect all children
	state = testBook([],tiddlers,[
		{title: "Main","cyoa.touch": "C1 C2","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "A"}]);

	// branching nodes don't need listing if one of their branches is cut
	state = testBook(["A","B1","C1"],tiddlers,[
		{title: "Main","cyoa.touch": "C1 C2","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "B2"}]);
	expect(state).not.toContain("A");
	expect(state).toContain("C1");
});

it("can clear",function() {
	var state = testBook([],[
		utils.group("def","set",{"cyoa.style": "string"}),
		{title: "A", "cyoa.group": "def"},
		{title: "B", "cyoa.group": "def", "cyoa.imply": "A"},
		{title: "Main","cyoa.touch": "B","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "def"}]);
	expect(state).toBe("");
});

it("handles default string style with strange names",function() {
	var weird = "sp ce ap\'s qu\"te";
	var rtn = utils.testBookDefaultVar([[
		utils.group("def","set",{"cyoa.style": "string"}),
		{title: weird,"cyoa.group": "def"},
		{title: weird+"B","cyoa.group": "def"},
		{title: "Main","cyoa.touch": "[prefix[sp]]","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "[suffix[B]]"}]],"def");
	expect(rtn.results).toEqual([weird]);
	expect(rtn.state).toBe("def="+encodeURIComponent(weird));
});

it("handles string style with filter",function() {
	var rtn = utils.testBookDefaultVar([[
		utils.defaultGroup("set",{"cyoa.style": "string",filter: "[removeprefix[page/]]"}),
		node("page/Apples"),node("page/Dogs"),
		{title: "Main","cyoa.touch": "[prefix[page]]"}]]);
	expect(rtn.results).toEqual(["page/Apples","page/Dogs"]);
	expect(valueOf(rtn.state)).toBe("Apples.Dogs");
});

it("handles string filter collisions",function() {
	utils.warnings(spyOn);
	var rtn = utils.testBookDefaultVar([[
		utils.defaultGroup("set",{"cyoa.style": "string",filter: "[splitbefore[-]]"}),
		node("page-A"),node("page-B"),node("page-C"),
		{title: "Main","cyoa.touch": "[prefix[page]]"}]]);
	expect(utils.warnings()).toHaveBeenCalledWith("GroupHandler warning: In default group, the following tiddlers all resolved to variable 'page-': page-A, page-B, page-C");
});

it("handles string filter empty strings",function() {
	utils.warnings(spyOn);
	utils.testBookDefaultVar([[
		utils.defaultGroup("set",{"cyoa.style": "string",filter: "[prefix[page/]]"}),
		node("page/A"),node("page/B"),node("bad/A"),node("bad/B"),
		{title: "Main","cyoa.touch": "[prefix[page]] [prefix[bad]]"}]]);
	expect(utils.warnings()).toHaveBeenCalledWith("GroupHandler warning: In default group, the following tiddlers all resolved to an empty variable: bad/A, bad/B");
});

it("handles styles like index64 and index10",function() {
	var tiddlers = Array.prototype.map.call("ABCDEFGHIJX",(a) => node("a"+a,null,{"cyoa.only":"first"}));
	tiddlers.push(node("aY","aX"),{title: "Main","cyoa.touch":"aY"});
	var wiki = new $tw.Wiki();
	wiki.addTiddlers(tiddlers);
	wiki.addTiddler(utils.defaultGroup("set",{"cyoa.style": "index10"}));
	expect(valueOf(testPremadeBook(wiki,["aX","aY"]))).toBe("11");

	// And it works for index64 too
	wiki = new $tw.Wiki();
	wiki.addTiddlers(tiddlers);
	wiki.addTiddler(utils.defaultGroup("set",{"cyoa.style": "index64"}));
	expect(valueOf(testPremadeBook(wiki,["aX","aY"]))).toBe("b");
});

it("can be manipulated with if, do, and done attributes", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.defaultGroup("set",{"cyoa.style": "index10"}),
		node("A"),node("B","A"),node("C","B"),node("D"),node("E"),node("F"),
		{title: "Main",text: `
			<$cyoa do="#{C} = true" />
			<$cyoa do="#{D} = !#{E}" if="#{B} == true" />
			<$cyoa do="#{F} = 5" if="#{B}" />
			<$cyoa do="#{B} = false" />
	`}]);
	testPremadeBook(wiki,["A","D","F"]);
});

it("does not treat '0' ids as falsy",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.defaultGroup("set",{"cyoa.style": "index10"}),
		node("X"),
		{title: "Main","cyoa.touch": "X"}]);
	var state = testPremadeBook(wiki,["X"]);
	expect(valueOf(state)).toBe("0");
});

it("handles broken implications",function() {
	utils.warnings(spyOn);
	var state = testBook(["B","C"],[node("A"),node("B","Z"),node("C","B"),
		{title: "Main","cyoa.touch": "C"}]);
	expect(state).not.toContain("Z");
	expect(state).toContain("C");
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'B': Implies page 'Z' which is not in the same group");
});

it("handles cyclic implications gracefully",function() {
	utils.warnings(spyOn);
	testBook([],[node("A","C"),node("C","B"),node("B","A"),
		{title: "Main","cyoa.touch": "A","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "A B C"}]);
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'B': Detected cyclic dependency in 'cyoa.imply' chain");

	utils.warnings().calls.reset();
	testBook(["A","B"],[node("A","A"),node("B","A"),
		{title: "Main","cyoa.touch": "B"}]);
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'A': Detected cyclic dependency in 'cyoa.imply' chain");
});

it("handles multiple implications",function() {
	expect(testBook(["A","B","C","D"],
		[node("A"),node("B","A"),node("C","A"),node("D","B C"),
		{title: "Main","cyoa.touch": "D"}])).toBe("D");

	expect(testBook(["A","B"],
		[node("A"),node("B","A"),node("C","A"),node("D","B C"),
		{title: "Main","cyoa.touch": "D","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "C"}])).toBe("B");

	expect(testBook(["A","B","E"],
		[node("A"),node("B","A"),node("C","A"),node("D","B C"),
		 node("E","B"),
		{title: "Main","cyoa.touch": "D E","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "C"}])).toBe("E");

	expect(testBook(["A","B","E"],
		[node("A"),node("B","A"),node("C","A"),node("D","B C"),
		 node("E","B"),
		{title: "Main","cyoa.touch": "D E","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "C"}])).toBe("E");

	expect(testBook(["A","B","D"],
		[node("A"),node("B"),node("C","A B"),node("D"),node("E","C D"),
		{title: "Main","cyoa.touch": "E","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "C"}])).toBe("A.B.D");
});

it("handles redundant implications",function() {
	expect(testBook(["A","B","C","D"],
		[node("A"),node("B"),node("C","A B"),node("D","A C"),
		{title: "Main","cyoa.touch": "D"}])).toBe("D");

	expect(testBook(["A","B","C"],
		[node("A"),node("B"),node("C","A B"),node("D","A C"),
		{title: "Main","cyoa.touch": "D","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "D"}])).toBe("C");

	// Now same, except the chirality of the graph is switched
	expect(testBook(["A","B","C","D"],
		[node("A"),node("B"),node("C","A B"),node("D","C B"),
		{title: "Main","cyoa.touch": "D"}])).toBe("D");

	expect(testBook(["A","B","C"],
		[node("A"),node("B"),node("C","A B"),node("D","C B"),
		{title: "Main","cyoa.touch": "D","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "D"}])).toBe("C");
});

it("handles exclusion groups",function() {
	var tiddlers = [
		node("A",null,{"cyoa.exclude": "X"}),
		node("B",null,{"cyoa.exclude": "X"}),
		node("C",null,{"cyoa.exclude": "X"}),
		node("D"),node("E"),
		{title: "Main","cyoa.touch": "A B D"}];
	// string
	var wiki = new $tw.Wiki();
	wiki.addTiddlers(tiddlers);
	wiki.addTiddler(utils.defaultGroup("set",{"cyoa.style": "string"}));
	testPremadeBook(wiki,["B","D"]);
	// base10
	wiki = new $tw.Wiki();
	wiki.addTiddlers(tiddlers);
	wiki.addTiddler(utils.defaultGroup("set",{"cyoa.style": "index10"}));
	testPremadeBook(wiki,["B","D"]);
});

it("handles exclusion of implied items",function() {
	testBook(["A","B","C","D"],[
		node("A",null,{"cyoa.exclude": "X"}),node("B","A"),node("C","B"),
		node("D"),node("E","D",{"cyoa.exclude": "X"}),node("F","E"),
		{title: "Main","cyoa.touch": "F C"}]);
});

it("handles exclusion of items implying each other",function() {
	var tiddlers = [
		node("A",null,{"cyoa.exclude":"X"}),node("M"),node("B","A M"),node("C","B",{"cyoa.exclude":"X"}),
		node("D",null,{"cyoa.exclude":"X"}),
		utils.defaultGroup("set",{"cyoa.style": "index10"})];
	utils.warnings(spyOn);
	testBook(["A","B","C","M"],tiddlers,[{title: "Main","cyoa.touch": "C"}]);
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'C': Implies page 'A' which is in the same exclusion group 'X'");
	testBook(["D","M"],tiddlers,[{title: "Main","cyoa.touch": "C D"}]);
});

it("handles exclusion of items implying irrelevant tiddlers",function() {
	var tiddlers = [
		node("A","nonExistent",{"cyoa.exclude":"X"}),
		node("B","notIncluded",{"cyoa.exclude":"X"}),
		node("C",null,{"cyoa.exclude":"X"}),
		{title: "notIncluded"}];
	// Will emit warnings about bad implications. We ignore those for this test
	utils.warnings(spyOn);
	testBook(["A"],tiddlers,[{title: "Main","cyoa.touch": "A"}]);
});

it("handles exclusion with overlapping groups",function() {
	var tiddlers = [
		node("A",null,{"cyoa.exclude":"X"}),
		node("B",null,{"cyoa.exclude":"X Y"}),
		node("C",null,{"cyoa.exclude":"Y"})];
	testBook(["A","C"],tiddlers,[{title: "Main","cyoa.touch": "A C"}]);
	testBook(["B"],tiddlers,[{title: "Main","cyoa.touch": "A C B"}]);
	testBook(["A"],tiddlers,[{title: "Main","cyoa.touch": "B A"}]);
	testBook(["C"],tiddlers,[{title: "Main","cyoa.touch": "B C"}]);
});

it("keeps clean serial string in implication chain with excludes",function() {
	var tiddlers = [
		node("A","root",{"cyoa.exclude":"X"}),
		node("B","root",{"cyoa.exclude":"X"}),
		node("root"),
		utils.defaultGroup("set",{"cyoa.style":"string"})];
	var state = testBook(["B","root"],tiddlers,[{title: "Main","cyoa.touch": "A B"}]);
	expect(state).toBe("B");
});

});
