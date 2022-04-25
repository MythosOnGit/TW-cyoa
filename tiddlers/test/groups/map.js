/*\
title: test/groups/map.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa String-hashable Map.

\*/

const utils = require("test/utils.js");
const Map = utils.stateClasses.map;

describe("Cyoa Map",function() {

/////////// UNIT TESTS /////////////

function newMap(hash) {
	var a = new Map();
	for(var i in hash) {
		a[i] = hash[i];
	}
	return a;
}

function flip(input,delimiter) {
	var map = new Map();
	Object.assign(map,input);
	var str = map.toString(delimiter);
	var output = new Map(str,null,delimiter);
	expect(output).toEqual(input);
	return output;
}

it("is not equal to a vanilla array",function() {
	expect(new Map()).not.toEqual([]);
	expect(new Map()).toEqual(new Map());
});

it("can handle empty parameters",function() {
	var t = flip({});
	expect(t.toString()).toEqual("");
});

it("enumerates correctly",function() {
	var t = new Map("a.3.b.x.c.5");
	var a = [];
	for(var i in t) { a.push([i,t[i]]); };
	expect(a).toEqual([["a","3"],["b","x"],["c","5"]]);
});

it("is arbitrary enough to be called on ordinary objects",function() {
	var obj = Object.assign(new Map(),{"a":"5","b":"3"});
	var str = obj.toString();
	var output = {};
	Map.call(output,str);
	expect(output).toEqual(obj);
});

it("doesn't use escape characters that URIencode poorly",function() {
	var encodeSafeChars = [".","!","~","*","'","(",")","-","_"];
	// Four of those characters must be escaped, but what they're
	// escaped by should not explode in size when uriEncoded.
	var t = new Map();
	encodeSafeChars.forEach((x,i) => t[i] = x);
	var result = encodeURIComponent(t.toString());
	expect(result).not.toContain("%");
	flip(t);
});

it("handles the empty empty pairs",function() {
	expect(new Map().toString()).toBe("");
	flip({"a": ""});
	flip({"": "values"});
	flip({"": ""});
});

it("prunes out undefined values",function() {
	var map = new Map();
	Object.assign(map,{a: "value",b: undefined});
	var str = map.toString();
	expect(str).toBe("a.value");
	var output = new Map(str);
	expect(output.b).toBeUndefined();
});

it("ignores unfinished input strings",function() {
	expect(new Map("~")).toEqual({});
	expect(new Map(".~")).toEqual({});
	var legal = "with.content";
	expect(new Map(legal+"~")).toEqual(new Map(legal));
});

it("handles escape characters",function() {
	flip({"split.by.periods": "another.split."});
	flip({".": "..","~": "\\","~n": "~n"});
	flip({"split\\by\.slashes": "stuff"});
	flip({"another\\.split\\": "actually\\a\\blackslash\\\\"});
	flip({"out(in)out": "in)out(in"});
	flip({"all_in(the key)": "((lo.ve))"});
});

it("handles nonstrings as values",function() {
	var obj = Object.assign(new Map(),{integer: 45});
	var str = obj.toString();
	expect(new Map(str)).toEqual({integer: "45"});
});

it("handles falsy types",function() {
	flip({"a": ""});
});

}); //Cyoa map
