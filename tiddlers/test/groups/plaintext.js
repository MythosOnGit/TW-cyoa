/*\
title: test/groups/plaintext.js
type: application/javascript
tags: $:/tags/test-spec

Tests the plaintext serializer (which may still be called string).
uses a set to do most testing.

\*/

const utils = require("test/utils.js");

describe("Plaintext Serializer",function() {

function defaultGroup(filter) {
	var group = utils.defaultGroup("set",{"cyoa.serializer": "string"})
	if(filter) {
		group.filter = filter;
	}
	return group;
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

it("handles default string style with strange names",function() {
	var weird = "sp ce ap\'s qu\"te";
	var rtn = testBook([weird],[
		defaultGroup(),
		{title: weird},
		{title: weird+"B"},
		{title: "Main",text: `<$cyoa touch="[prefix[sp]]" reset="[suffix[B]]"/>`}]);
	expect(firstOf(rtn.state)).toBe(weird);
});

it("handles string style with filter",function() {
	var rtn = testBook(["page/Apples","page/Dogs"],[
		defaultGroup("[removeprefix[page/]]"),
		node("page/Apples"),node("page/Dogs"),
		{title: "Main","cyoa.touch": "[prefix[page]]"}]);
	expect(firstOf(rtn.state)).toBe("Apples.Dogs");
});

it("handles string filter collisions",function() {
	utils.warnings(spyOn);
	testBook(['page-C'],[
		defaultGroup("[splitbefore[-]]"),
		node("page-A"),node("page-B"),node("page-C"),
		{title: "Main","cyoa.touch": "[prefix[page]]"}]);
	expect(utils.warnings()).toHaveBeenCalledWith("GroupHandler warning: In default group, the following tiddlers all resolved to variable 'page-': page-A, page-B, page-C");
});

it("handles string filter empty strings",function() {
	utils.warnings(spyOn);
	testBook(["bad/B","page/A","page/B"],[
		defaultGroup("[prefix[page/]]"),
		node("bad/A"),node("bad/B"),node("page/A"),node("page/B"),
		{title: "Main","cyoa.touch": "[prefix[page]] [prefix[bad]]"}]);
	expect(utils.warnings()).toHaveBeenCalledWith("GroupHandler warning: In default group, the following tiddlers all resolved to an empty variable: bad/A, bad/B");
});

it("keeps clean serial string in implication chain with excludes",function() {
	var rtn = testBook(["B","root"],[
		node("A","root",{"cyoa.exclude":"X"}),
		node("B","root",{"cyoa.exclude":"X"}),
		node("root"),
		defaultGroup(),
		{title: "Main","cyoa.touch": "A B"}]);
	expect(firstOf(rtn.state)).toBe("B");
});

});
