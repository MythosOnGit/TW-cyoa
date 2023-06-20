/*\
title: test/groups/value.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa String-hashable value.

\*/

const Cyoa = require("cyoa");
const utils = require("test/utils.js");

describe("Value Group",function() {

function testBook(expected /*,tiddlerArrays... */) {
	var tiddlerArrays = Array.prototype.slice.call(arguments,1);
	tiddlerArrays.unshift([utils.defaultGroup("value",{"cyoa.style": "string"})]);
	var rtn = utils.testBookDefaultVar(tiddlerArrays);
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

it("works",function() {
	var state = testBook(["B"],
		[node("A"),node("B"),
		{title: "Main","cyoa.touch": "A B"}]);
	expect(valueOf(state)).toBe("B");
});

it("resets work only on active",function() {
	testBook(["A"],
		[node("A"),node("B"),
		{title: "Main","cyoa.touch": "A","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "B"}]);
	var state = testBook([],
		[node("A"),node("B"),
		{title: "Main","cyoa.touch": "A","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "A"}]);
	expect(state).toBe("");
});

it("implication chains work",function() {
	var state = testBook(["A","B","C"],
		[node("A"),node("B","A"),node("C","B"),node("D"),
		{title: "Main","cyoa.touch": "C"}]);
	expect(valueOf(state)).toBe("C");
});

/*
I'm not positive I want this functionality, but we'll go with it for now.
*/
it("behaves differently than sets with regard to implications",function() {
	// touching an implied page still changes selection to it
	var state = testBook(["A"],
		[node("A"),node("B","A"),node("C","B"),
		{title: "Main","cyoa.touch": "C A"}]);
	expect(valueOf(state)).toBe("A");

	// Also, reseting clears. It doesn't downgrade.
	state = testBook([],
		[node("A"),node("B","A"),node("C","B"),
		{title: "Main","cyoa.touch": "C","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "C"}]);
	expect(state).toBe("");

	// Also, reseting an implied does nothing
	state = testBook(["A","B","C"],
		[node("A"),node("B","A"),node("C","B"),
		{title: "Main","cyoa.touch": "C","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "A"}]);
	expect(valueOf(state)).toBe("C");
});

it("clearing works",function() {
	var state = testBook([],
		[node("A"),node("B"),
		{title: "Main","cyoa.touch": "A","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "[cyoa:var[]]"}]);
	expect(state).toBe("");
});

it("testing variable tests if set or not",function() {
	// can positively test for after
	testBook(["B"],[node("A"),node("B"),
		{title: "Main","cyoa.touch": "A","cyoa.append": "Main2"},
		{title:"Main2","cyoa.touch":"B","cyoa.after":"[cyoa:var[]]"}]);

	// can negatively test for after
	testBook([],[node("A"),
		{title: "Main","cyoa.append": "Main2"},
		{title: "Main2","cyoa.touch":"A","cyoa.after":"[cyoa:var[]]"}]);

	// can positively test for before
	testBook(["A"],[node("A"),node("B"),
		{title: "Main","cyoa.touch": "A","cyoa.append": "Main2"},
		{title: "Main2","cyoa.touch":"B","cyoa.before":"[cyoa:var[]]"}]);

	// can negatively test for before
	testBook(["A"],[node("A"),
		{title: "Main","cyoa.append": "Main2"},
		{title: "Main2","cyoa.touch": "A","cyoa.before": "[cyoa:var[]]"}]);
});

it("handles base10 mode",function() {
	var index10 = utils.defaultGroup("value",{"cyoa.style": "index10"});
	// 0 isn't treated as falsey
	var state = testBook(["A"],
		[node("A"),index10,
		{title: "Main","cyoa.touch": "A"}]);
	expect(valueOf(state)).toBe("0");

	// Can identify proper time to reset
	state = testBook([],
		[node("A"),index10,
		{title: "Main","cyoa.touch": "A","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "A"}]);
	expect(state).toBe("");
});

});
