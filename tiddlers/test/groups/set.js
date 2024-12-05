/*\
title: test/groups/set.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa String-hashable Set.

\*/

const utils = require("test/utils.js");

describe("Cyoa Set",function() {

function forEachCodec(jasmineCall) {
	return utils.forEachNamedModule("cyoasetserializer",jasmineCall);
};

function defaultGroup(codec) {
	return utils.defaultGroup("set",{"cyoa.serializer": codec, "cyoa.key": "output"})
};

function turnToPage(core, page) {
	var state = core.state.serialize();
	core.manager.pushState(state, page);
};

function testBook(expected,tiddlerArray) {
	var core = utils.testBook(tiddlerArray);
	expect(core.state.allVisited()).toEqual(expected);
	return core;
};

function testStringBook(expected /*,tiddlerArrays... */) {
	var tiddlerArrays = Array.prototype.slice.call(arguments,1);
	tiddlerArrays.unshift([utils.defaultGroup("set",{"cyoa.serializer": "string", "cyoa.key": "output"})]);
	var core = utils.testBook(tiddlerArrays);
	expect(core.state.allVisited()).toEqual(expected);
	// Remove the "s=" and split by period
	return core;
};

function node(name,parent,attributes) {
	var n = Object.assign({title: name},attributes);
	if(parent) { n["cyoa.imply"] = parent; }
	return n;
};

it("manages long implication chains",function() {
	const tiddlers = [
		{title: "Main","cyoa.touch": "D C"},
		defaultGroup("string"),
		node("A"),node("B","A"),node("C","B"),
		node("D","C"),node("E","D")]
	// Touching works
	var state;
	state = testBook(["A","B","C","D"],tiddlers).state.serialize().output;
	expect(state).not.toContain("A");
	expect(state).not.toContain("B");
	expect(state).not.toContain("C");
	expect(state).toContain("D");
	expect(state).not.toContain("E");
	// Now test it's ability to reset
	tiddlers[0] = {title: "Main",text: "<$cyoa touch=E/><$cyoa reset=C/>"};
	state = testBook(["A","B"],tiddlers).state.serialize().output;
	expect(state).not.toContain("A");
	expect(state).toContain("B");
	expect(state).not.toContain("C");
	expect(state).not.toContain("D");
	expect(state).not.toContain("E");
});

// This test is expensive, don't do too many like it.
it("vlq is nice and compact",function() {
	var expected = [];
	var tiddlers = [];
	for (var i = 100; i <1000; i++) {
		tiddlers.push({title: i.toString(), "cyoa.only": "first"});
	}
	var touch = tiddlers[0];
	var increment = 0;
	for (var i = 100; i <1000; i+=increment) {
		// touch every one, spacing out by one more each time.
		expected.push(i.toString());
		increment++;
	}
	tiddlers.push(
		defaultGroup("vlq"),
		{title: "Main", "cyoa.touch": expected.join(" ")},
		{title: "Next"});
	var core = testBook(expected,tiddlers);
	var stateString = core.state.serialize().output;
	expect(stateString.length).toBe(61);
	// Now we turn the page. This will serialize and deserialize the state.
	turnToPage(core, "Next");
	expect(core.state.allVisited()).toEqual(expected);
});

forEachCodec(codec =>
it(codec + " handles unknown values in input",function() {
	var core = testBook([], [
		defaultGroup(codec),
		{title: "Main"},
		{title: "Only", "cyoa.only": "first"}]);
	core.manager.pushState({output: "2"}, "Main");
	expect(core.state.allVisited()).toEqual([]);
	expect(core.state.serialize()).toEqual({});
}));

forEachCodec(codec =>
it(codec + " handles sparce indices in a wide range",function() {
	var expected = ["15","33","50","51","53","56","60","65","71","78","86"];
	var tiddlers = [];
	for (var i = 10; i <99; i++) {
		tiddlers.push({title: i.toString(), "cyoa.only": "first"});
	}
	tiddlers.push(
		defaultGroup(codec),
		{title: "Main", "cyoa.touch": expected.join(" ")},
		{title: "Next"});
	var core = testBook(expected,tiddlers);
	// Now we turn the page. This will serialize and deserialize the state.
	turnToPage(core, "Next");
	expect(core.state.allVisited()).toEqual(expected);
}));

forEachCodec(codec =>
it(codec + " resets does not activate inactive parents",function() {
	testBook(["A"],[
		defaultGroup(codec),
		node("A"),node("B","A"),node("C","B"),
		{title: "Main",text: `<$cyoa touch=A/><$cyoa reset=C />`}]);
}));

it("manages forked chains",function() {
	var tiddlers = [node("A"),node("B1","A"),node("B2","A"),node("C1","B1"),node("C2","B2")];
	// If both branches touched, both must be listed, but no roots need be.
	var state = testStringBook(["A","B1","B2"],tiddlers,[{title: "Main","cyoa.touch": "B1 B2"}]).state.serialize().output;
	expect(state).not.toContain("A");
	expect(state).toContain("B1");
	expect(state).toContain("B2");

	// Resets affect all children
	state = testStringBook([],tiddlers,[
		{title: "Main","cyoa.touch": "C1 C2","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "A"}]).state.serialize().output;

	// branching nodes don't need listing if one of their branches is cut
	state = testStringBook(["A","B1","C1"],tiddlers,[
		{title: "Main","cyoa.touch": "C1 C2","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "B2"}]).state.serialize().output;
	expect(state).not.toContain("A");
	expect(state).toContain("C1");
});

forEachCodec(codec =>
it(codec + " can clear",function() {
	var core = testBook([],[
		utils.group("def","set",{"cyoa.serializer": codec}),
		{title: "A", "cyoa.group": "def"},
		{title: "B", "cyoa.group": "def", "cyoa.imply": "A"},
		{title: "Main",text: `<$cyoa touch=B /><$cyoa reset=def />`}]);
	expect(core.state.serialize()).toEqual({});
}));

// This is temporary behavior until better behavior is implemented.
forEachCodec(codec =>
it(codec + " group as a whole as a 'get' value",function() {
	var rtn = testBook(["A", "notEmpty"],[
		defaultGroup(codec),
		utils.group("def","set",{"cyoa.serializer": codec}),
		{title: "A", "cyoa.group": "def"},
		{title: "empty", "cyoa.group": "def"},
		{title: "notEmpty", "cyoa.group": "def"},
		{title: "Main",text: `<$cyoa if='#{def}' touch=empty /><$cyoa touch=A/><$cyoa if='#{def}' touch=notEmpty />`}], "def");
}));

forEachCodec(codec =>
it(codec + " has certain predictable outputs in state",function() {
	var expectedStates = {
		"bitfield": "w0",
		"index10": "11",
		"index64": "b",
		"string": "aY",
		"vlq": "7"};
	var tiddlers = Array.prototype.map.call("ABCDEFGHIJX",(a) => node("a"+a,null,{"cyoa.only":"first"}));
	tiddlers.push(
		node("aY","aX"),
		{title: "Main","cyoa.touch":"aY"},
		defaultGroup(codec));
	var core = testBook(["aX","aY"],tiddlers);
	expect(core.state.serialize().output).toBe(expectedStates[codec]);
}));

forEachCodec(codec =>
it(codec + " handles large states with many flipped options", function() {
	var tiddlers = [defaultGroup(codec)];
	var touches = [];
	var elements = [];
	for(var i = 0; i < 110; i++) {
		var title = "X" + i.toString().padStart(3,"0");
		tiddlers.push(node(title));
		if(i % 2) {
			touches.push(title);
			elements.push("<$cyoa touch="+title+"/>");
		} else {
			elements.push("<$cyoa reset="+title+"/>");
		}
	}
	// The reason for touching and reseting lik this is to ensure that the indices of the nodes interleave on and off.
	tiddlers.push({title: "Main", text: elements.join("")});
	testBook(touches,tiddlers);
}));

forEachCodec(codec =>
it(codec + " can be manipulated with if, do, and done attributes", function() {
	testBook(["A","D","F"],[
		defaultGroup(codec),
		node("A"),node("B","A"),node("C","B"),node("D"),node("E"),node("F"),
		{title: "Main",text: `
			<$cyoa do="#{C} = true" />
			<$cyoa do="#{D} = !#{E}" if="#{B} == true" />
			<$cyoa do="#{F} = 5" if="#{B}" />
			<$cyoa do="#{B} = false" />
	`}]);
}));

forEachCodec(codec =>
it(codec + "does not treat '0' ids as falsy",function() {
	var rtn = testBook(["X"],[
		defaultGroup(codec),
		node("X"),
		{title: "Main","cyoa.touch": "X"}]);
	expect(rtn.state.serialize().output.length).toBe(1);
}));

it("handles broken implications",function() {
	utils.warnings(spyOn);
	var state = testStringBook(["B","C"],[node("A"),node("B","Z"),node("C","B"),
		{title: "Main","cyoa.touch": "C"}]).state.serialize().output;
	expect(state).not.toContain("Z");
	expect(state).toContain("C");
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'B': Implies page 'Z' which is not in the same group");
});

it("handles cyclic implications gracefully",function() {
	utils.warnings(spyOn);
	testStringBook([],[node("A","C"),node("C","B"),node("B","A"),
		{title: "Main","cyoa.touch": "A","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "A B C"}]);
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'B': Detected cyclic dependency in 'cyoa.imply' chain");

	utils.warnings().calls.reset();
	testStringBook(["A","B"],[node("A","A"),node("B","A"),
		{title: "Main","cyoa.touch": "B"}]);
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'A': Detected cyclic dependency in 'cyoa.imply' chain");
});

it("handles multiple implications",function() {
	expect(testStringBook(["A","B","C","D"],
		[node("A"),node("B","A"),node("C","A"),node("D","B C"),
		{title: "Main","cyoa.touch": "D"}]).state.serialize().output).toBe("D");

	expect(testStringBook(["A","B"],
		[node("A"),node("B","A"),node("C","A"),node("D","B C"),
		{title: "Main","cyoa.touch": "D","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "C"}]).state.serialize().output).toBe("B");

	expect(testStringBook(["A","B","E"],
		[node("A"),node("B","A"),node("C","A"),node("D","B C"),
		 node("E","B"),
		{title: "Main","cyoa.touch": "D E","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "C"}]).state.serialize().output).toBe("E");

	expect(testStringBook(["A","B","E"],
		[node("A"),node("B","A"),node("C","A"),node("D","B C"),
		 node("E","B"),
		{title: "Main","cyoa.touch": "D E","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "C"}]).state.serialize().output).toBe("E");

	expect(testStringBook(["A","B","D"],
		[node("A"),node("B"),node("C","A B"),node("D"),node("E","C D"),
		{title: "Main","cyoa.touch": "E","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "C"}]).state.serialize().output).toBe("A.B.D");
});

it("handles redundant implications",function() {
	expect(testStringBook(["A","B","C","D"],
		[node("A"),node("B"),node("C","A B"),node("D","A C"),
		{title: "Main","cyoa.touch": "D"}]).state.serialize().output).toBe("D");

	expect(testStringBook(["A","B","C"],
		[node("A"),node("B"),node("C","A B"),node("D","A C"),
		{title: "Main","cyoa.touch": "D","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "D"}]).state.serialize().output).toBe("C");

	// Now same, except the chirality of the graph is switched
	expect(testStringBook(["A","B","C","D"],
		[node("A"),node("B"),node("C","A B"),node("D","C B"),
		{title: "Main","cyoa.touch": "D"}]).state.serialize().output).toBe("D");

	expect(testStringBook(["A","B","C"],
		[node("A"),node("B"),node("C","A B"),node("D","C B"),
		{title: "Main","cyoa.touch": "D","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "D"}]).state.serialize().output).toBe("C");
});

forEachCodec(codec =>
it(codec + " handles exclusion groups",function() {
	// We put all these nodes in so that base64 gets to letters
	var tiddlers = "ABCDEFGHIJKLMNO".split("").map(c => node(c,null,{"cyoa.only": "first"}));
	tiddlers[10]["cyoa.exclude"] = "X";
	tiddlers[11]["cyoa.exclude"] = "X";
	tiddlers[12]["cyoa.exclude"] = "X";
	tiddlers.push(
		{title: "Main","cyoa.touch": "K L N"},
		defaultGroup(codec));
	testBook(["L","N"],tiddlers);
}));

it("handles exclusion of implied items",function() {
	testStringBook(["A","B","C","D"],[
		node("A",null,{"cyoa.exclude": "X"}),node("B","A"),node("C","B"),
		node("D"),node("E","D",{"cyoa.exclude": "X"}),node("F","E"),
		{title: "Main","cyoa.touch": "F C"}]);
});

it("handles exclusion of items implying each other",function() {
	var tiddlers = [
		node("A",null,{"cyoa.exclude":"X"}),node("M"),node("B","A M"),node("C","B",{"cyoa.exclude":"X"}),
		node("D",null,{"cyoa.exclude":"X"}),
		utils.defaultGroup("set",{"cyoa.serializer": "index10"})];
	utils.warnings(spyOn);
	testStringBook(["A","B","C","M"],tiddlers,[{title: "Main","cyoa.touch": "C"}]);
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'C': Implies page 'A' which is in the same exclusion group 'X'");
	testStringBook(["D","M"],tiddlers,[{title: "Main","cyoa.touch": "C D"}]);
});

it("handles exclusion of items implying irrelevant tiddlers",function() {
	var tiddlers = [
		node("A","nonExistent",{"cyoa.exclude":"X"}),
		node("B","notIncluded",{"cyoa.exclude":"X"}),
		node("C",null,{"cyoa.exclude":"X"}),
		{title: "notIncluded"}];
	// Will emit warnings about bad implications. We ignore those for this test
	utils.warnings(spyOn);
	testStringBook(["A"],tiddlers,[{title: "Main","cyoa.touch": "A"}]);
});

it("handles exclusion with overlapping groups",function() {
	var tiddlers = [
		node("A",null,{"cyoa.exclude":"X"}),
		node("B",null,{"cyoa.exclude":"X Y"}),
		node("C",null,{"cyoa.exclude":"Y"})];
	testStringBook(["A","C"],tiddlers,[{title: "Main","cyoa.touch": "A C"}]);
	testStringBook(["B"],tiddlers,[{title: "Main","cyoa.touch": "A C B"}]);
	testStringBook(["A"],tiddlers,[{title: "Main","cyoa.touch": "B A"}]);
	testStringBook(["C"],tiddlers,[{title: "Main","cyoa.touch": "B C"}]);
});

});
