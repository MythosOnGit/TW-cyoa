/*\
title: test/groups/intmap.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa String-hashable Map.

\*/

const utils = require("test/utils.js");

describe("Counters",function() {

function testBook(expected /*,tiddlerArrays... */) {
	var arrays = Array.prototype.slice.call(arguments,1);
	arrays.push([utils.group("default","intmap",{variable: "m",style: "string"})]);
	var rtn = utils.testBookDefaultVar(arrays);
	expect(rtn.results).toEqual(expected);
	return rtn.state;
};

function node(name,attributes) {
	var n = Object.assign({title: name,"cyoa.group": "default"},attributes);
	return n;
};

it("increments",function() {
	var state = testBook(["A","B"],[node("A"),node("B"),node("C"),
		{title: "Main","cyoa.touch": "A B =B"}]);
	expect(state).toBe("m=A.1.B.2");
});

it("can reset",function() {
	var state = testBook(["B"],[node("A"),node("B"),node("C"),
		{title: "Main","cyoa.touch": "A B","cyoa.append": "Main2"},
		{title: "Main2","cyoa.reset": "A"}]);
	expect(state).toBe("m=B.1");
});

it("can test before",function() {
	// negative before test
	var state = testBook(["A"],[node("A"),node("B"),
		{title: "Main","cyoa.touch": "A","cyoa.append": "Main2"},
		{title: "Main2","cyoa.before": "A","cyoa.touch": "B"}]);
	// positive before test
	var state = testBook(["B"],[node("A"),node("B"),
		{title: "Main","cyoa.append": "Main2"},
		{title: "Main2","cyoa.before": "A","cyoa.touch": "B"}]);
});

it("can handle strange characters",function() {
	var testTitle = function(t) {
		state = testBook([t],[node(t),{title: "Main","cyoa.touch": t}]);
	};
	testTitle("A");
	testTitle("27");
	testTitle("C4ts");
	testTitle("C$ts");
	testTitle("$ss");
	testTitle("C@ts");
});

it("can test against numbers",function() {
	var state = testBook(["A","eq-3","gte-3"],[node("A"),
			node("gte-4"),node("gte-3"),
			node("eq-7"),node("eq-3"),
		{title: "Main",text: `
			<$cyoa touch="=A =A =A" />
			<$cyoa if="#{A} >= 4" touch="gte-4" />
			<$cyoa if="#{A} >= 3" touch="gte-3" />
			<$cyoa if="#{A} == 7" touch="eq-7" />
			<$cyoa if="#{A} == 3" touch="eq-3" />
		`}]);
});

it("unset values are treated as zero",function() {
	var state = testBook(["B"],[node("A"),node("B"),
		{title: "Main","cyoa.append": "Main2"},
		{title: "Main2","cyoa.if": "#{A} < 3","cyoa.touch": "B"}]);
});

it("can modify values directly",function() {
	// Extra "C" here so I can make sure undefined remains undefined
	var state = testBook(["A","B"],[node("A"),node("B"),
		utils.group("default","intmap",{variable: "m"}),
		{title: "Main","cyoa.do": "#{A} += 3","cyoa.append": "Main2"},
		{title: "Main2","cyoa.if": "#{A} > 2","cyoa.touch": "B"}]);
	expect(state).toBe("m=A.3.B.1");
});

it("can be used for indexes",function() {
	// append indexing
	testBook(["A","goal"],[node("A"),node("goal"),node("badtouch"),
		{title: "Main","cyoa.touch": "A =A","cyoa.append": "X Y Main2","cyoa.index": "m.A"},
		{title: "X","cyoa.touch": "badtouch"},{title: "Y"},
		{title: "Main2","cyoa.touch": "goal"}]);
	// widget indexing
	testBook(["A","goal"],[node("A"),node("goal"),node("badtouch"),
		{title: "Main","cyoa.touch": "A =A","cyoa.append": "Main2"},
		{title: "Main2",text: `<$cyoa index="m.A">
			<$cyoa touch="badtouch" />
			<$cyoa touch="badtouch" />
			<$cyoa touch="goal" />
		</$cyoa>`}]);
});

});
