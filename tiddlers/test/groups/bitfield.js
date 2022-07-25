/*\
title: test/groups/bitfield.js
type: application/javascript
tags: $:/tags/test-spec

Tests the bitfield tracked types.

\*/

const utils = require("test/utils.js");
const BitField = utils.stateClasses.bitfield;

describe("bitfield",function() {

function testBook(expected /*. tiddlerArrays */) {
	var arrays = Array.prototype.slice.call(arguments,1);
	arrays.unshift(bitfieldGroup("t"));
	var rtn = utils.testBookDefaultVar(arrays);
	expect(rtn.results).toEqual(expected);
	return rtn.state;
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

function bitfieldGroup(variable,group) {
	return utils.group(group || "default","set",{variable: variable || "s",style: "bitfield"});
};

it("separates nodes in different version blocks",function() {
	var tiddlers = [
		node("A"),node("B","A"),node("C","B"),
		node("X"),node("Y") // Y might pull D into the V1 block
	];
	var extras = [ node("D","C"),node("Y","D")];
	var serialized = testBook(["X"],tiddlers,extras,{title: "Main","cyoa.touch": "X"});
	// Mostly, I don't care about the serialized form, but I must make sure versioned nodes don't get lumped in with lower version trees.
	// If this is 8, it means X is in the 4th position, but the tree before it should only take up 2 bits.
	expect(serialized).toBe("t=4");

	// Make sure touches propogate through version blocks
	testBook(["A","B","C","D","Y"],tiddlers,extras,{title: "Main","cyoa.touch": "Y"});

	// Make sure resets propogate through version blocks too
	testBook(["A","X"],tiddlers,extras,{title: "Main",text:"<$cyoa touch='[all[]regexp[^.$]]' reset=B/>"});
});

it("bridges with multiple connections work",function() {
	var tiddlers = [
		node("1"),
		node("3")];
	var extra = node("2","1 3");
	var prevSerialized = testBook(["1","3"],tiddlers,{title: "Main","cyoa.touch": "1 3"});
	var newSerialized = testBook(["1","3"],tiddlers,extra,{title: "Main","cyoa.touch": "1 3"});
	// The addition of a new versioned tiddler shouldn't change things
	expect(newSerialized).toBe(prevSerialized);
	var newSerialized = testBook(["1"],tiddlers,extra,
		{title: "Main",text: "<$cyoa touch=2 reset=3/>"});
});

it("setting smaller branch sets to root",function() {
	// B2 is the one we touch, it's alphabetically between two larger branches, either of which will claim A2 as part of its branch.
	var tiddlers = [
		node("root"),
			node("A2","root"),
				node("B2","A2"),
					node("C2","B2"),
						node("D1","C2"),
							node("E1","D1"),
						node("D2","C2"),
						node("D3","C2"),
							node("E3","D3"),
			// X branch claims root. But root must still be touched
			node("X1","root"),
				node("X2","X1"),
					node("X3","X2"),
						node("X4","X3"),
							node("X5","X4"),
								node("X6","X5")]
	// Test that we can touch one and it"ll set stuff appropriately.
	testBook(["A2","B2","C2","D2","root"],tiddlers.concat(
		{title: "Main","cyoa.touch": "D2"}));
	// Test that we can reset one and it'll unset stuff appropriately.
	testBook(["A2","root","X1","X2","X3","X4","X5","X6"],tiddlers.concat(
		{title: "Main",text:"<$cyoa touch='[all[]regexp[^..$]]' reset=B2/>"}));
});

it("can touch and reset with surrounding nodes",function() {
	var tiddlers = [
		node("A1"),
			node("B1","A1"),
			node("B2","A1"),
				node("C1","B2"),
				node("C2","B2"),
				node("C3","B2"),
				node("D3","C3"),
			node("B3","A1")];
	testBook(["A1","B2","C2"],tiddlers.concat(
		{title: "Main","cyoa.touch": "C2"}));
	testBook(["A1","B1","B2","B3","C1","C3","D3"],tiddlers.concat(
		{title: "Main",text:"<$cyoa touch='[all[]regexp[^..$]]' reset=C2/>"}));
});

it("compresses trees to an acceptably small bitfield",function() {
	var serialized = testBook(["X"],[
				node("A"),
		node("B1","A"),node("B2","A"),
		node("C1","B1"),node("C2","B2"),
		node("D1","C1"),
		node("X"),
		{title: "Main","cyoa.touch": "X"}]);
	// If it's larger than that, then the tree isn't compressing as much as it can. It shouldn't be "w". That's 32, not 16.
	expect(serialized).toBe("t=d");
});

it("can clear",function() {
	testBook([],[node("A"),node("B","A"),node("C"),
		{title: "Main",text: "<$cyoa touch='A B C' reset='[cyoa:var[default]]'/>"}]);
});

it("does not print if empty",function() {
	var serialized = testBook([],[node("A"),
		{title: "Main",text: "<$cyoa reset='A'/>"}]);
	// It should not be t=0, or anything=0
	expect(serialized).toBe("");
});

it("handles cyclic graphs gracefully",function() {
	utils.warnings(spyOn);
	testBook([],[node("loopA","loopB"),node("loopB","loopA")]);
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'loopB': Detected cyclic dependency in 'cyoa.imply' chain");
	utils.warnings().calls.reset();

	testBook([],[node("Z","X"),node("X","X"),node("Y","X")]);
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'X': Detected cyclic dependency in 'cyoa.imply' chain");
});

it("creating tree with irrelevant tiddlers is ignored",function() {
	utils.warnings(spyOn);
	testBook(["C","D"],[
		bitfieldGroup("other","other"),
		node("A",undefined,{"cyoa.group": "other"}),
		node("B","A",{"cyoa.group": "other"}),
		node("C","B"),
		node("D","nothing"),
		{title: "Main","cyoa.touch": "C D"}
	]);
	expect(utils.warnings().calls.allArgs()).toEqual([
		["Page 'C': Implies page 'B' which is not in the same group"],
		["Page 'D': Implies page 'nothing' which is not in the same group"]]);
});

it("compresses multiple implications well",function() {
	// These states can be represented in exactly 64 bits, or one character. If it's any more, it's not being packed right.
	var tiddlers= [
		         node("A1"),               node("A2"),
		         node("B1","A1"),         node("B2","A2"),
		node("C1"),        node("C2","B1 B2"),      node("C3","B2"),
		        node("D1","C1 C2"),node("D2","C2"),node("D3","C3"),
		        node("E","D1"),
		              node("F","E D2"),
		                    node("G","F D3"),
		               node("H1","G"),node("H2","G"),
		               node("I","H1"),
		                    node("J","I H2")];
	var serialized = testBook(
		["A1","A2","B1","B2","C1","C2","C3","D1","D2","D3","E","F","G","H1","H2","I","J"],
		tiddlers.concat({title: "Main","cyoa.touch": "J"}));
	expect(serialized.length).toBe(3,serialized + " was too long"); // t=!
	testBook(
		["A1","A2","B1","B2","C1","C2","C3","D1","D2","E","F"],
		tiddlers.concat({title: "Main",text: "<$cyoa touch=J reset=D3/>"}));
	serialized = testBook(
		["A1","B1","C1"],
		tiddlers.concat({title: "Main",text: "<$cyoa touch=J reset=A2/>"}));
});

it("handles multiple implication tricky cases",function() {
	var tiddlers= [
		node("A1"),node("A2"),
		     node("B","A1 A2"),
		     node("C","B"),node("D1","B"),node("D2","B"),node("E","B"),
		                        node("F","D1 D2")];
	testBook(
		["A1","A2","B","C","D1","E"],
		tiddlers.concat({title: "Main",text:"<$cyoa touch='C E F' reset=D2/>"}));
});

it("handles exclusion groups",function() {
	var tiddlers = [
		bitfieldGroup(),
		node("root",null),
		node("A"),node("B"),node("C"),
		node("D","root",{"cyoa.exclude": "X"}),
		node("E","root",{"cyoa.exclude": "X"}),
		node("F","root",{"cyoa.exclude": "X"}),
		node("G"),node("H"),
		{title: "Main","cyoa.touch": "A D F E G"}];
	// string
	testBook(["A","E","G","root"],tiddlers);

});

it("compresses exclusions well",function() {
	var tiddlers= [
		         node("A"),
		         node("B","A"),
		node("C1","B"),node("C2","B"),node("C3","B"),
		node("D1","C1",{"cyoa.exclude": "X"}),node("D2","C2",{"cyoa.exclude": "X Y"}),node("D3","C3",{"cyoa.exclude": "Y"}),
		node("E1","D1"),node("E2","D2"),node("E3","D3"),
		node("F1","E1"),node("F2","E2"),node("F3","E3")];
	var serialized = testBook(
		["A","B","C1","C2","C3","D1","D3","E1","E3","F1","F3"],
		tiddlers.concat({title: "Main","cyoa.touch": "F2 F1 F3"}));
	expect(serialized.length).toBe(3,serialized + " was too long");
	var serialized = testBook(
		["A","B","C1","C2","C3","D2","E2","F2"],
		tiddlers.concat({title: "Main","cyoa.touch": "F1 F3 F2"}));
	expect(serialized.length).toBe(3,serialized + " was too long");
});

it("handles exclusion of implied items",function() {
	testBook(["A","B","C"],[
		bitfieldGroup(),
		node("A",null,{"cyoa.exclude": "X"}),node("B","A"),node("C","B"),
			node("A1","A"),node("A2","A1"),node("A3","A2"),
		node("D",null,{"cyoa.exclude": "X"}),node("F","D"),
		node("D1","D"),node("D2","D1"),
		{title: "Main","cyoa.touch": "F C"}]);
});

it("handles exclusives in separate trees",function() {
	var tiddlers = [];
	for(var i = 0; i < 20; i++) {
		var title = "A" + i.toString().padStart(2,"0");
		tiddlers.push(node(title,undefined,{"cyoa.exclude": "X"}));
	}
	tiddlers.push({title: "Main","cyoa.touch": "[prefix[A]]"});
	var serialized = testBook(["A19"],tiddlers);
	expect(serialized.length).toBe(3,serialized + " was too long");
});

it("handles mixed exclusions interleaved together",function() {
	// Ordering and lettering is important here. A is a child of B and C but the pivot selecting algorithm might choose it first, when it shouldn"t.
	var tiddlers= [
		node("A1","A2",{"cyoa.exclude": "X"}),
		node("A2",undefined,{"cyoa.exclude": "Y"}),
		node("A3","A1"),
		node("A4",undefined,{"cyoa.exclude": "Y"}),
		node("A5",undefined,{"cyoa.exclude": "X"}),
		node("A6"),node("A7"),node("A8")];
	var serialized = testBook(["A1","A2","A3","A6","A7","A8"],tiddlers.concat({title: "Main","cyoa.touch": "[prefix[A]] A3"}));
	expect(serialized.length).toBe(3,serialized + " was too long");
	var serialized = testBook(["A4","A5","A6","A7","A8"],tiddlers.concat({title: "Main","cyoa.touch": "[prefix[A]]"}));
	expect(serialized.length).toBe(3,serialized + " was too long");
});

it("handles exclusion within the same tree",function() {
	testBook(["A","root","worksOneWay","worksTheOther"],[
		bitfieldGroup(),
		node("root",null),
		node("A","root",{"cyoa.exclude": "X"}),
		node("B","root",{"cyoa.exclude": "X"}),
		node("worksOneWay"),node("worksTheOther"),
		{title: "Main","cyoa.touch": "A B","cyoa.append": "Main2"},
		{title: "Main2","cyoa.before": "A","cyoa.after": "B","cyoa.touch": "worksOneWay A","cyoa.append": "Main3"},
		{title: "Main3","cyoa.before": "B","cyoa.after": "A","cyoa.touch": "worksTheOther"}]);
});

it("handles back-compat with exclusion across different versions",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		bitfieldGroup("t"),
		node("A1"),
		node("A3"),
		node("B1","A1 A3",{"cyoa.exclude": "X"}),
		node("B3","A3",{"cyoa.exclude": "X"}),
		{title: "Main","cyoa.touch": "B1 B3"}]);
	wiki.commitCyoaGroups();
	var prevSerialized = testPremadeBook(wiki,["A1","A3","B3"]);
	wiki.addTiddler(node("B2","A1",{"cyoa.exclude": "X"}));
	var newSerialized = testPremadeBook(wiki,["A1","A3","B3"]);
	// The addition of a new versioned tiddler shouldn"t change things
	expect(newSerialized).toBe(prevSerialized);
	wiki.addTiddler({title: "Main","cyoa.touch": "B1 B3 B2"});
	testPremadeBook(wiki,["A1","A3","B2"]);
});

it("handles tricky exclusion across different versions",function() {
	testBook(["A1","B","D","G"],
		{title: "Main","cyoa.touch": "C D A1 G"},
	// These bits get added in parts so they"re all in different groups.
		[	node("A1",null,{"cyoa.exclude": "X"}),
			node("A2",null,{"cyoa.exclude": "X"})],
		[	node("B"),
			node("C","B",{"cyoa.exclude": "X"}),
			node("D")],
		[	node("E",null,{"cyoa.exclude": "X"}),
			node("F")],
		[	node("G")]);
});

it("handles implication trees with huge numbers of states",function() {
	var children = [];
	for(var i = 0; i < 60; i++) {
		children.push("Y" + i.toString().padStart(2,"0"));
	}
	var tree = children.map((title) => node(title,"X"));
	tree.unshift(node("X"));
	tree.push(node("Z","Y01 Y02"));
	testBook(["X","Y00","Y59"],tree.concat(
		{title: "Main","cyoa.touch": "Y59 Y00"}));
	children[0] = "X"; // replace Y00 with X
	children.pop();//remove Y59
	children.push("Z");
	testBook(children,tree.concat(
		{title: "Main",text: "<$cyoa touch='[prefix[Y]] Z' reset='Y00 Y59'/>"}));
});

it("handles renaming of tiddlers after a commit",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		bitfieldGroup("t"),
		node("A"),
		node("B","A"),
		node("C","A"),
		node("D","A"),
		node("E"),
		{title: "Unrelated"},
		{title: "Main","cyoa.touch": "C E"}]);
	wiki.commitCyoaGroups();
	var prevSerialized = testPremadeBook(wiki,["A","C","E"]);
	var mainWiki = $tw.wiki;
	try {
		$tw.wiki = wiki;
		wiki.renameTiddler("C","X");
		wiki.renameTiddler("Unrelated","Still unrelated");
	} finally {
		$tw.wiki = mainWiki;
	}
	wiki.addTiddler({title: "Main","cyoa.touch": "X E"});
	var nextSerialized = testPremadeBook(wiki,["A","E","X"]);
	expect(nextSerialized).toBe(prevSerialized);
});

it('handles deletion of tiddlers after a commit',function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		bitfieldGroup("t"),
		node("A"),
		node("B"),
		node("C"),
		{title: "Main","cyoa.touch": "A C"}]);
	wiki.commitCyoaGroups();
	var prevSerialized = testPremadeBook(wiki,["A","C"]);
	wiki.deleteTiddler("B");
	var nextSerialized = testPremadeBook(wiki,["A","C"]);
	expect(nextSerialized).toBe(prevSerialized);
});

});
