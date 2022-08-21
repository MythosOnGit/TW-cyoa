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
	tiddlerArrays.unshift([utils.group("default","set",{variable: "s",style: "string"})]);
	var rtn = utils.testBookDefaultVar(tiddlerArrays);
	expect(rtn.results).toEqual(expected);
	// Remove the "s=" and split by period
	return rtn.state.substr(2).split(".").sort().join(".");
};

function testPremadeBook(wiki,expected) {
	var rtn = utils.testBookDefaultVar([],undefined,{wiki: wiki});
	expect(rtn.results).toEqual(expected);
	return rtn.state;
};

function node(name,parent,attributes) {
	var n = Object.assign({title: name,"cyoa.group": "default"},attributes);
	if(parent) { n["cyoa.imply"] = parent; }
	return n;
};

it("manages long implication chains",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.group("default","set",{variable: "s",style: "string"}),
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
	var state = testBook([],[node("A"),node("B","A"),
		{title: "Main","cyoa.touch": "B","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "[cyoa:var[default]]"}]);
	expect(state).toBe("");
});

it("handles default string style with strange names",function() {
	var weird = "sp ce ap\'s qu\"te";
	var rtn = utils.testBookDefaultVar([[
		utils.group("def","set",{style: "string"}),
		{title: weird,"cyoa.group": "def"},
		{title: weird+"B","cyoa.group": "def"},
		{title: "Main","cyoa.touch": "[prefix[sp]]","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "[suffix[B]]"}]],"def");
	expect(rtn.results).toEqual([weird]);
	expect(rtn.state).toBe("def="+encodeURIComponent(weird));
});

it("handles string style with filter",function() {
	var rtn = utils.testBookDefaultVar([[
		utils.group("default","set",{variable: "s",style: "string",filter: "[removeprefix[page/]]"}),
		node("page/Apples"),node("page/Dogs"),
		{title: "Main","cyoa.touch": "[prefix[page]]"}]]);
	expect(rtn.results).toEqual(["page/Apples","page/Dogs"]);
	expect(rtn.state).toBe("s=Apples.Dogs");
});

it("handles string filter collisions",function() {
	utils.warnings(spyOn);
	var rtn = utils.testBookDefaultVar([[
		utils.group("default","set",{variable: "s",style: "string",filter: "[splitbefore[-]]"}),
		node("page-A"),node("page-B"),node("page-C"),
		{title: "Main","cyoa.touch": "[prefix[page]]"}]]);
	expect(utils.warnings()).toHaveBeenCalledWith("GroupHandler warning: In default group, the following tiddlers all resolved to variable 'page-': page-A, page-B, page-C");
});

it("handles string filter empty strings",function() {
	utils.warnings(spyOn);
	utils.testBookDefaultVar([[
		utils.group("default","set",{variable: "s",style: "string",filter: "[prefix[page/]]"}),
		node("page/A"),node("page/B"),node("dukes"),node("hazards"),
		{title: "Main","cyoa.touch": "[prefix[page]]"}]]);
	expect(utils.warnings()).toHaveBeenCalledWith("GroupHandler warning: In default group, the following tiddlers all resolved to an empty variable: dukes, hazards");
});

it("handles styles like index64 and index10",function() {
	var tiddlers = Array.prototype.map.call("ABCDEFGHIJ",(a) => node(a));
	tiddlers.push(node("X"),node("Y","X"),{title: "Main","cyoa.touch":"Y"});
	var wiki = new $tw.Wiki();
	wiki.addTiddlers(tiddlers);
	wiki.addTiddler(utils.group("default","set",{variable: "s",style: "index10"}));
	expect(testPremadeBook(wiki,["X","Y"])).toBe("s=11");

	// And it works for index64 too
	wiki = new $tw.Wiki();
	wiki.addTiddlers(tiddlers);
	wiki.addTiddler(utils.group("default","set",{variable: "s",style: "index64"}));
	expect(testPremadeBook(wiki,["X","Y"])).toBe("s=b");
});

it("can be manipulated with if, do, and done attributes", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.group("default","set",{variable: "s",style: "index10"}),
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
		utils.group("default","set",{variable: "s",style: "index10"}),
		node("X"),
		{title: "Main","cyoa.touch": "X"}]);
	var state = testPremadeBook(wiki,["X"]);
	expect(state).toBe("s=0");
});

it("isolates version blocks",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([node("A"),node("C"),node("D"),node("E"),
		utils.group("default","set",{variable: "s",style: "index64"}),
		{title: "Main","cyoa.touch":"E B"}]);
	wiki.commitCyoaGroups();
	// Node B comes in after the first stuff has been commited.
	wiki.addTiddler(node("B","A"));
	var state = testPremadeBook(wiki,["A","B","E"]);
	expect(state).toBe("s=3.4");
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
	wiki.addTiddler(utils.group("default","set",{variable: "s",style: "string"}));
	testPremadeBook(wiki,["B","D"]);
	// base10
	wiki = new $tw.Wiki();
	wiki.addTiddlers(tiddlers);
	wiki.addTiddler(utils.group("default","set",{variable: "s",style: "index10"}));
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
		node("A",null,{"cyoa.exclude":"X"}),node("B","A"),node("C","B",{"cyoa.exclude":"X"}),
		node("D",null,{"cyoa.exclude":"X"}),
		utils.group("default","set",{variable: "s",style: "index10"})];
	utils.warnings(spyOn);
	testBook(["A","B","C"],tiddlers,[{title: "Main","cyoa.touch": "C"}]);
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'C': Implies page 'A' which is in the same exclusion group 'X'");
	testBook(["D"],tiddlers,[{title: "Main","cyoa.touch": "C D"}]);
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
		utils.group("default","set",{variable:"s",style:"string"})];
	var state = testBook(["B","root"],tiddlers,[{title: "Main","cyoa.touch": "A B"}]);
	expect(state).toBe("B");
});

it("warns and refuses when a page would have a different id",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([node("A"),node("B"),node("C"),
		utils.group("default","set",{variable: "s",style: "string",filter: "[addsuffix[z]]"}),
		{title: "Main","cyoa.touch":"B C"}]);
	wiki.commitCyoaGroups();
	var oldState = testPremadeBook(wiki,["B","C"]);
	var mainWiki = $tw.wiki;
	try {
		$tw.wiki = wiki;
		wiki.renameTiddler("B","X");
		wiki.addTiddler({title: "Main","cyoa.touch": "X C"});
		utils.warnings(spyOn);
		// We need to commit manually, since the save would otherwise be delayed until the next tick.
		wiki.commitCyoaGroups();
		var newState = testPremadeBook(wiki,["C","X"]);
		// We will issue a warning and retain the old id.
		expect(utils.warnings()).toHaveBeenCalledWith("Page 'X': Tiddler would now use id 'Xz' instead of 'Bz', which would be a backward-incompatible change. CYOA will retain the use of 'Bz' until the version history is next cleared.");
		expect(newState).toBe(oldState);
		utils.warnings().calls.reset();
		wiki.commitCyoaGroups();
		newState = testPremadeBook(wiki,["C","X"]);
		// It warns, but it only warns once.
		expect(utils.warnings()).not.toHaveBeenCalled();
		expect(newState).toBe(oldState);
	} finally {
		$tw.wiki = mainWiki;
	}
});

it("can clear the version history and repack",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		node("A"),node("C"),
		utils.group("default","set",{variable: "s",style: "index10"}),
		{title: "Main","cyoa.touch": "C"}]);
	wiki.commitCyoaGroups();
	var oldState = testPremadeBook(wiki,["C"]);
	// Now add a new page which would ordinarily offset "C"
	wiki.addTiddler(node("B"));
	wiki.commitCyoaGroups();
	var newState = testPremadeBook(wiki,["C"]);
	// This is already expected.
	expect(newState).toBe(oldState);
	// But after we clear the groups, all the pages should be repacked.
	wiki.clearCyoaGroups();
	var changedState = testPremadeBook(wiki,["C"]);
	// Now it should be different
	expect(changedState).not.toBe(newState);
});

});
