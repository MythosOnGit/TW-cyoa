/*\
title: test/groups/stringmap.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa String-hashable Map.

\*/

const utils = require("test/utils.js");

describe("String map",function() {

function forEachCodec(jasmineCall) {
	return utils.forEachNamedModule("cyoastringmapserializer",jasmineCall);
};

function defaultGroup(codec) {
	return utils.defaultGroup("stringmap",{"cyoa.serializer": codec});
};

function testBook(expected,tiddlerArray) {
	var rtn = utils.testBookDefaultVar(tiddlerArray);
	expect(rtn.results).toEqual(expected);
	return rtn;
};

function node(name,implies,attributes) {
	var fields = Object.assign({title: name},attributes);
	if (implies) {
		fields['cyoa.imply'] = implies;
	}
	return fields;
};

function firstOf(state) {
	// Just get the first item. There should only be one
	for(var item in state) {
		return state[item];
	}
};

/////////// UNIT TESTS /////////////

forEachCodec(codec =>
it(codec + " doesn't use escape characters that URIencode poorly",function() {
	var encodeSafeChars = ["_","-","!",".","'","(",")","*","~"];
	var tiddlers = encodeSafeChars.map(ch => node(ch, null, {tags: 'grouped', "cyoa.only": "first"}));
	tiddlers.push(
		defaultGroup(codec),
		{title: "Main", text: "<$list variable=title filter='[tag[grouped]]'><$cyoa done=`#{$(title)$}=\"expected-$(title)$\"` /><$list>"});
	var results = testBook(encodeSafeChars, tiddlers);
	expect(firstOf(results.state)).toContain('expected');
	// Four of those characters must be escaped, but what they're
	// escaped by should not explode in size when uriEncoded.
	expect(results.state).not.toContain('%');
}));

it("defaults to string codec",function() {
	var results = testBook(['TestTiddler'],[
		utils.defaultGroup("stringmap"),
		node('TestTiddler'),
		{title: "Main", "cyoa.do": "#{TestTiddler} = 'TestResult'"}]);
	expect(firstOf(results.state)).toContain("TestTiddler");
	expect(firstOf(results.state)).toContain("TestResult");
});

forEachCodec(codec =>
it(codec + " handles mix of set and unset flags",function() {
	// The VLQ codec in particular has to behave differently depending on distance between set flag indices
	var results = testBook(['TestB', 'TestC', 'TestF'],[
		defaultGroup(codec),
		node('TestA'),node('TestB'),node('TestC'),node('TestD'),node('TestE'),node('TestF'),
		// This tiddler is just to put all test tiddlers in the group.
		{title: "Init", "cyoa.after": "[prefix[Test]]"},
		{title: "Main", "cyoa.do": "#{TestB}='X', #{TestC}='X', #{TestF}='X'"}]);
}));

forEachCodec(codec =>
it(codec + " supports empty strings",function() {
	var results = testBook(['Confirm','TestA1','TestA2','TestB1','TestB2'],[
		defaultGroup(codec),
		node('Confirm'),
		node('TestA1'),node('TestA2','TestA1'),
		node('TestB1'),node('TestB2','TestB1'),
		{title: "Main", text: `
			<$cyoa do="#{TestA2}=''" touch=TestB2 />
			<$cyoa do="#{Confirm}='{'+[#{TestA1},#{TestA2},#{TestB1},#{TestB2}].join('+')+'}'" />`}]);
	expect(firstOf(results.state)).toContain('{+++}');
}));

forEachCodec(codec =>
it(codec + " can reset",function() {
	testBook(['TestC'],[
		defaultGroup(codec),
		node('TestA'),node('TestB','TestA'),node('TestC'),
		{title: "Main", text: `
			<$cyoa do="#{TestA}='X',#{TestB}='Y',#{TestC}='Z'" />
			<$cyoa reset=TestA />`}]);
}));

forEachCodec(codec =>
it(codec + " writes empty string when not set",function() {
	var results = testBook(["Confirm"],[
		defaultGroup(codec),
		node('Confirm'),
		node('TestA'),node('TestB'),
		{title: "Main", text: `
			<$cyoa touch=TestB reset=TestB/>
			<$cyoa do="#{Confirm} = 'X'+#{TestA}+'X Y'+#{TestB}+'Y'" />`}]);
	// This should not have "undefined" or "null" sandwiched between those letter pairs.
	expect(firstOf(results.state)).toContain('XX YY');
}));

forEachCodec(codec =>
it(codec + " supports exclusions",function() {
	var results = testBook(["Confirm","TestB1","TestB2","TestD1","TestD2"],[
		defaultGroup(codec),
		node('Confirm'),
		// We do the test once, first to test manual setting
		node('TestA1',null,{"cyoa.exclude":"X"}),
		node('TestA2',"TestA1"),
		node('TestB1',null,{"cyoa.exclude":"X"}),
		node('TestB2',"TestB1"),
		// We do the test again, but this time test touching
		node('TestC1',null,{"cyoa.exclude":"Y"}),
		node('TestC2',"TestC1"),
		node('TestD1',null,{"cyoa.exclude":"Y"}),
		node('TestD2',"TestD1"),
		{title: "Main", text: `
			<$cyoa do="#{TestA2}='Aval',#{TestB2}='Bval'" touch="TestC2 TestD2"/>
			<$cyoa do="#{Confirm}= '{' + [#{TestA1},#{TestA2},#{TestB1},#{TestB2},#{TestC1},#{TestC2},#{TestD1},#{TestD2}].join('+') + '}'" />`}]);
	expect(firstOf(results.state)).toContain("{+++Bval++++}");

}));

}); //Cyoa map
