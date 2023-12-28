/*\
title: test/groups/value.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa String-hashable value.

\*/

const Cyoa = require("cyoa");
const utils = require("test/utils.js");

describe("Value Group",function() {

function forEachCodec(jasmineCall) {
	return utils.forEachNamedModule("cyoavalueserializer",jasmineCall);
};

function defaultGroup(codec) {
	return utils.defaultGroup("value",{"cyoa.serializer": codec});
};

function testBook(expected,tiddlerArray) {
	var rtn = utils.testBookDefaultVar(tiddlerArray);
	expect(rtn.results).toEqual(expected);
	return rtn;
};

function node(name,parent,attributes) {
	var n = Object.assign({title: name},attributes);
	if(parent) { n["cyoa.imply"] = parent; }
	return n;
};

function firstOf(state) {
	// Just get the first item. There should only be one
	for(var item in state) {
		return state[item];
	}
};

it("defaults to string codec",function() {
	var results = testBook(['TestTiddler'],[
		utils.defaultGroup("value"),
		node('TestTiddler'),
		{title: "Main", "cyoa.touch": "TestTiddler"}]);
	expect(firstOf(results.state)).toEqual("TestTiddler");
});

forEachCodec(codec =>
it("works",function() {
	testBook(["B"],[
		defaultGroup(codec),
		node("A"),node("B"),
		{title: "Main","cyoa.touch": "A B"}]);
}));

forEachCodec(codec =>
it("specific resets work only on active",function() {
	testBook(["A"],[
		defaultGroup(codec),
		node("A"),node("B"),
		{title: "Main","cyoa.touch": "A","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "B"}]);
	testBook([], [
		defaultGroup(codec),
		node("A"),node("B"),
		{title: "Main","cyoa.touch": "A","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "A"}]);
}));

forEachCodec(codec =>
it("implication chains work",function() {
	var result = testBook(["A","B","C"],[
		defaultGroup(codec),
		node("A"),node("B","A"),node("C","B"),node("D"),
		{title: "Main","cyoa.touch": "C"}]);
	// There should only be a single character written
	expect(firstOf(result.state).length).toBe(1);
}));

/*
I'm not positive I want this functionality, but we'll go with it for now.
*/
forEachCodec(codec =>
it("behaves differently than sets with regard to implications",function() {
	// touching an implied page still changes selection to it
	testBook(["A"],[
		defaultGroup(codec),
		node("A"),node("B","A"),node("C","B"),
		{title: "Main","cyoa.touch": "C A"}]);
	// Also, reseting clears. It doesn't downgrade.
	testBook([],[
		defaultGroup(codec),
		node("A"),node("B","A"),node("C","B"),
		{title: "Main",text: "<$cyoa touch=C reset=C />"}]);
	// Also, reseting an implied does nothing
	testBook(["A","B","C"],[
		defaultGroup(codec),
		node("A"),node("B","A"),node("C","B"),
		{title: "Main",text: "<$cyoa touch=C reset=A />"}]);
}));

forEachCodec(codec =>
it(codec + " clearing works",function() {
	var group = defaultGroup(codec);
	var title = group.title;
	var state = testBook([],[
		group,node("A"),node("B","A"),node("C"),
		{title: "Main",text: `<$cyoa touch='C B' reset='${title}' />`}]);
}));

forEachCodec(codec =>
it("testing variable tests if set or not",function() {
	var group = defaultGroup(codec);
	var title = group.title;
	// can positively test for after
	testBook(["B"],[
		group,
		node("A"),node("B"),
		{title: "Main",text: `<$cyoa touch=A/><$cyoa after='${title}' touch=B/>`}]);
	// can negatively test for after
	testBook([],[
		group,
		node("A"),node("B"),
		// We'll touch and reset the group, because that might mess things up.
		{title: "Main",text: `<$cyoa touch=A reset=A/><$cyoa after='${title}' touch=B/>`}]);
	// can positively test for before
	testBook(["A"],[
		group,
		node("A"),node("B"),
		{title: "Main",text: `<$cyoa touch=A/><$cyoa before='${title}' touch=B/>`}]);
	// can negatively test for before
	testBook(["A"],[
		group,
		node("A"),
		{title: "Main",text: `<$cyoa before='${title}' touch=A/>`}]);
}));

it("handles base64 mode",function() {
	var index10 = utils.defaultGroup("value",{"cyoa.serializer": "index64"});
	// 0 isn't treated as falsey
	var result = testBook(["A"],[
		index10,
		node("A"),
		{title: "Main","cyoa.touch": "A"}]);
	expect(firstOf(result.state)).toBe("0");

	// Can identify proper time to reset
	result = testBook([],[
		index10,
		node("A"),
		{title: "Main",text: "<$cyoa touch=A reset=A/>"}]);
	expect(result.state).toEqual({});
});

});
