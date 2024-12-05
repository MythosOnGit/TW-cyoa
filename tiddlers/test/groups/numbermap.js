/*\
title: test/groups/numbermap.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa String-hashable Map.

\*/

const utils = require("test/utils.js");

describe("Number map",function() {

function forEachCodec(jasmineCall) {
	return utils.forEachNamedModule("cyoanumbermapserializer",jasmineCall);
};

function defaultGroup(codec) {
	return utils.defaultGroup("numbermap",{"cyoa.serializer": codec, "cyoa.key": "output"});
};

function testBook(expected,tiddlerArray) {
	var core = utils.testBook(tiddlerArray);
	expect(core.state.allVisited()).toEqual(expected);
	return core;
};

function node(name,attributes) {
	var n = Object.assign({title: name},attributes);
	return n;
};

forEachCodec(codec =>
it("increments",function() {
	testBook(["A","B","C"],[
		defaultGroup(codec),
		node("A"),node("B"),node("C"),
		{title: "Main",text: `
			<$cyoa touch='A B =B =B'/>
			<$cyoa if='#{A} == 1 && #{B} == 3' touch=C/>`}]);
}));

forEachCodec(codec =>
it("can reset",function() {
	testBook(["B"],[
		defaultGroup(codec),
		node("A"),node("B"),node("C"),
		{title: "Main",text: "<$cyoa touch='A B'/><$cyoa reset=A/>"}]);
}));

forEachCodec(codec =>
it("can test before",function() {
	testBook(["A","B"],[
		defaultGroup(codec),
		node("A"),node("B"),node("C"),
		{title: "Main",text: `
			<$cyoa before=A touch=B />
			<$cyoa touch=A />
			<$cyoa before=A touch=C />`}]);
}));

forEachCodec(codec =>
it("can handle strange characters",function() {
	var titles = ["27","B$@","C*.=","D&!_-"].sort();
	var tiddlers = titles.map(title => node(title, {tags: 'grouped'}));
	tiddlers.push(
		defaultGroup(codec),
		{title: "Main", "cyoa.touch": "[tag[grouped]]"});
	var results = testBook(titles,tiddlers);
}));

forEachCodec(codec =>
it(codec + "can test against numbers",function() {
	testBook(["A","eq-3","gte-3"],[
		defaultGroup(codec),
		node("A"),
		node("gte-4"),node("gte-3"),
		node("eq-7"),node("eq-3"),
		{title: "Main",text: `
			<$cyoa touch="=A =A =A" />
			<$cyoa if="#{A} >= 4" touch="gte-4" />
			<$cyoa if="#{A} >= 3" touch="gte-3" />
			<$cyoa if="#{A} == 7" touch="eq-7" />
			<$cyoa if="#{A} == 3" touch="eq-3" />`}]);
}));

forEachCodec(codec =>
it(codec + " can use negative numbers",function() {
	testBook(["B","C","Test"],[
		defaultGroup(codec),
		node("A"),node("B"),node("C"),node("Test"),
		{title: "Main",text: `
			<$cyoa do="#{B}=-3, #{C}=-4" />
			<$cyoa if="#{B}+#{C} === -7" touch=Test />`}]);
}));

forEachCodec(codec =>
it(codec + " handles fractional numbers",function() {
	var core = testBook(["A","B","C","E"],[
		defaultGroup(codec),
		node("A"),node("B"),node("C"),node("D"),node("E"),
		{title: "Main",text: `
			<$cyoa do="#{A}=0, #{B}=-2.3, #{C}=(50/7), #{D}=6, #{E}=(1/512)" />
			<$cyoa reset=D />`}]);
	expect(core.state.query("A")).toBe(0);
	expect(core.state.query("B")).toBe(-2.3);
	expect(core.state.query("C")).toBe(50/7);
	expect(core.state.query("E")).toBe(1/512);
}));

it("vlq keeps the state string small",function() {
	function test(number,length) {
		var core = testBook(["A","B"],[
			defaultGroup("vlq"),node("A"),node("B"),
			{title: "Main", text: "<$cyoa do='#{A}=0.5, #{B}="+number+"' />"}]);
		expect(core.state.query("B")).toBe(number);
		// The first three bytes go to {A}, which forces rational mode
		var state = core.state.serialize().output;
		expect(state.length-3).toBe(length, number + " => " + state);
	};
	test(15,2);
	test(1/512,4);
	test((2**14)-1,4);
	test(2**14,4);
	test(-(2**14),4);
	test(0.001,5);
});

forEachCodec(codec =>
it(codec + " manages near zero",function() {
	var core = testBook(["A","B"],[
		defaultGroup(codec),node("A"),node("B"),
		{title: "Main", text: `
			<$cyoa do='#{A}=1/2**25' />
			<$cyoa do='#{B}=0.001' />`}]);
	expect(core.state.query("A")).toBe(1/2**25);
	expect(core.state.query("B")).toBe(0.001);
}));

forEachCodec(codec =>
it(codec + " manages large numbers",function() {
	var core = testBook(["A","B"],[
		defaultGroup(codec),node("A"),node("B"),
		{title: "Main", text: `
			<$cyoa do='#{A}=Number.MAX_SAFE_INTEGER*4' />
			<$cyoa do='#{B}=Number.MIN_SAFE_INTEGER*4' />`}]);
	expect(core.state.query("A")).toBe(Number.MAX_SAFE_INTEGER*4);
	expect(core.state.query("B")).toBe(Number.MIN_SAFE_INTEGER*4);
}));

forEachCodec(codec =>
it(codec + " manages humongous numbers",function() {
	var core = testBook(["A","B"],[
		defaultGroup(codec),node("A"),node("B"),
		{title: "Main", text: `
			<$cyoa do='#{A}=Number.MAX_SAFE_INTEGER*(2**900)' />
			<$cyoa do='#{B}=Number.MIN_SAFE_INTEGER*(2**900)' />`}]);
	expect(core.state.query("A")).toBe((Number.MAX_SAFE_INTEGER*(2**900)));
	expect(core.state.query("B")).toBe((Number.MIN_SAFE_INTEGER*(2**900)));
	expect(core.state.serialize().output.length).toBeLessThan(55);
}));

forEachCodec(codec =>
it(codec + " ignores -0 but does not choke",function() {
	var core = testBook(["A","Confirm"],[
		defaultGroup(codec),
		node("A"),node("Confirm"),
		{title: "Main",text: `
			<$cyoa do="#{A}=(-3*0)" />
			<$cyoa if="1/#{A}> 0" touch=Confirm />`}]);
	expect(core.state.query("A")).toBe(0);
}));

forEachCodec(codec =>
it("unset values are treated as zero",function() {
	testBook(["B","D"],[
		defaultGroup(codec),
		node("Test"),node("A"),node("B"),node("C"),node("D"),
		{title: "Main",text: `
			<$cyoa if="#{Test} == 3" touch=A />
			<$cyoa if="#{Test} != 3" touch=B />
			<$cyoa if="#{Test} > 3" touch=C />
			<$cyoa if="#{Test} < 3" touch=D />`}]);
}));

forEachCodec(codec =>
it("can modify values directly",function() {
	testBook(["A","Test"],[
		defaultGroup(codec),
		node("Test"),node("A"),
		{title: "Main",text: `
			<$cyoa do="#{Test} += 3"/>
			<$cyoa if="#{Test} == 3" touch=A />`}]);
}));

forEachCodec(codec =>
it("can be used for indexes",function() {
	// append indexing
	testBook(["A","goal"],[
		defaultGroup(codec),
		node("A"),node("goal"),node("badtouch"),
		{title: "Main","cyoa.touch": "A =A","cyoa.append": "X Y Main2","cyoa.index": "#{A}"},
		{title: "X","cyoa.touch": "badtouch"},{title: "Y"},
		{title: "Main2","cyoa.touch": "goal"}]);
	// widget indexing
	testBook(["A","goal"],[
		defaultGroup(codec),
		node("A"),node("goal"),node("badtouch"),
		{title: "Main","cyoa.touch": "A =A","cyoa.append": "Main2"},
		{title: "Main2",text: `<$cyoa index="#{A}">
			<$cyoa touch="badtouch" />
			<$cyoa touch="badtouch" />
			<$cyoa touch="goal" />
		</$cyoa>`}]);
}));

forEachCodec(codec =>
it("can handle exclusion groups",function() {
	testBook(["A2","A3","B2","C2","D1"],[
		defaultGroup(codec),
		// These test that touching can trigger exclusion groups
		node("A1",{"cyoa.exclude":"A"}),
		node("A2"),
		node("A3",{"cyoa.exclude":"A"}),
		// These test that setting can trigger exclusion groups
		node("B1",{"cyoa.exclude":"B"}),
		node("B2",{"cyoa.exclude":"B"}),
		// These test that setting to zero triggers exclusion groups
		node("C1",{"cyoa.exclude":"C"}),
		node("C2",{"cyoa.exclude":"C"}),
		// These test that resetting does not trigger exclusion groups
		node("D1",{"cyoa.exclude":"D"}),
		node("D2",{"cyoa.exclude":"D"}),
		{title: "Main", text: `
			<$cyoa touch='A1 A2 A3' />
			<$cyoa do='#{B1}=5, #{B2}=6' />
			<$cyoa do='#{C1}=5, #{C2}=0' />
			<$cyoa touch=D1 reset=D2 />
		`}]);
}));

});
