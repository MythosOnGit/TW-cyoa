/*\
title: test/cyoa/state.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa State controller.

\*/

var Cyoa = require("cyoa");
var State = Cyoa.State;

var legalCharacters = /^([&-/$#!:;=?@\[\]~\w]|%[0-9a-fA-F]{2})*$/;

var flipWithDest = function(inputObj,method,expectedHash,outObj) {
	var s = new State();
	method(inputObj,function() {
		s.declare.apply(s,arguments);
	});
	var outString = s.serialize();
	expect(outString).toMatch(legalCharacters);
	expect(outString).not.toContain("?");
	expect(outString).not.toContain("#");
	if(undefined !== expectedHash) {
		expect(outString).toBe(expectedHash,"URI string not correct");
	}
	var newS = new State();
	var out = Object.create(null);
	method(out,function() {
		newS.declare.apply(newS,arguments);
	});
	newS.deserialize(outString);
	var expectedObj = outObj !== undefined? outObj: inputObj;
	expect(out).toEqual(expectedObj);
	return outString;
};

/*
This is a short version of flipWithDest, where the method no longer expects the destination object as a first argument
*/
var flip = function(inputObj,abridgedMethod,expectedHash,outObj) {
	var method = function(dest,declare) {
		abridgedMethod(function () {
			declare.apply(dest,[dest].concat(Array.from(arguments)));
		});
	};
	return flipWithDest(inputObj,method,expectedHash,outObj);
};

var Cl = function(str) {
	this.str = str || "";
}

Cl.prototype.toString = function() {
	return this.str;
}

describe("State",function() {
	it("works with strings",function() {
		var aTab = {"key": "value"};
		var aEmpty = {"key": ""};
		flip(aTab,   d => d("key"));
		flip(aTab,   d => d("key",String));
		flip(aEmpty, d => d("key",String),"");

		flip(aTab,   d => d("key",String,{default: "value"}),"");
		flip(aEmpty, d => d("key",String,{default: "value"}),"key=");
	});

	it("manages weird strings",function() {
		flip({str: "keys",str2: "values"},
		      d => {d("str"); d("str2")});
		flip({str: "something?odd",str2: "K&C",str3: "="},
		      d => {d("str"); d("str2"); d("str3")});
	});

	it("manages weird keys",function() {
		var obj = {
			"???": "a",
			"1+2=3": "b",
			"B&Q": "c",
			"B.Q": "c",
			"[bonk]": "d",
		};
		flip(obj,d => {for(var k in obj) { d(k); }});
	});

	it("works with booleans",function() {
		var dec =       (d) => d("b",Boolean);
		var dec_false = (d) => d("b",Boolean,{default: false});
		var dec_true =  (d) => d("b",Boolean,{default: true});

		var false_st = {"b": false};
		var true_st = {"b": true};
		flip({},dec_false,"",false_st);

		flip({},           dec,"",false_st);
		flip(false_st,     dec,"",false_st);
		flip({b: "false"}, dec,"",false_st);
		flip({b: "FALSE"}, dec,"",false_st);
		flip({b: "no"},    dec,"",false_st);
		flip({b: "NO"},    dec,"",false_st);
		flip({b: "true"},  dec,"b=yes",true_st);
		flip({b: "yes"},   dec,"b=yes",true_st);
		flip({b: "YES"},   dec,"b=yes",true_st);
		flip(true_st,      dec,"b=yes",true_st);
		flip({b: "TRUE"},  dec,"b=yes",true_st);
		flip({b: 1},       dec,"b=yes",true_st);

		flip({},           dec_true,"",true_st);
		flip(true_st,      dec_true,"",true_st);
		flip({b: "true"},  dec_true,"",true_st);
		flip({b: "TRUE"},  dec_true,"",true_st);
		flip({b: "yes"},   dec_true,"",true_st);
		flip({b: "YES"},   dec_true,"",true_st);
		flip({b: 1},       dec_true,"",true_st);
		flip(false_st,     dec_true,"b=no",false_st);
		flip({b: "false"}, dec_true,"b=no",false_st);
		flip({b: "no"},    dec_true,"b=no",false_st);
		flip({b: "NO"},    dec_true,"b=no",false_st);
		flip({b: 0},       dec_true,"b=no",false_st);
	});

	it("handles various inputted booleans",function() {
		var pairs = {
			"b=yes": true,
			"b=YES": true,
			"b=true": true,
			"b=TRUE": true,
			"b=1": true,
			"b=anything": true,
			"b=no": false,
			"b=NO": false,
			"b=FALSE": false,
			"b=false": false,
			"b=": false,
			"b=0": false};
		for(var key in pairs) {
			var state = new State();
			var out = Object.create(null);
			state.declare(out,"b",Boolean);
			state.deserialize(key);
			expect(out.b).toBe(pairs[key]);
		}
	});

	it("Works with arrays",function() {
		flip({arr: []},d => d("arr",Array));
		flip({arr: ["a"]},d => d("arr",Array));
		flip({arr: ["a","b"]},d => d("arr",Array));
		var dec = (d) => d("arr",Array,{default: ["a"]});
		flip({arr: ["a"]},dec);
		flip({},dec,undefined,{arr: ["a"]});
	});

	it("supports packing polymorphic types",function() {
		function A(str) { this.str = str.split("*")[1]; }
		A.prototype.toString = function() { return "A*"+this.str; }
		function B(str) { A.call(this,str); }
		B.prototype = Object.create(A.prototype);
		B.prototype.toString = function() { return "B*"+this.str; }
		var dec = (d) => d("arr",A);
		flip({arr: new B("B*v")},dec,"arr=B*v",{arr: new A("A*v")});
	});

	it("handles wrong value/type mismatches",function() {
		function Obj(str) { this.str = str; };
		Obj.prototype.toString = function() { return this.str; };
		var decObj = (d) => d("a",Obj);
		flip({a: 5},         decObj,"a=5",  {a: new Obj("5")});
		flip({a: "value"},     decObj,"a=value",{a: new Obj("value")});
		flip({a: ["a","b"]}, decObj,"a=a.b",{a: new Obj("a.b")});
		var decArr = (d) => d("a",Array);
		flip({a: 5},              decArr,"a=5",  {a: ["5"]});
		flip({a: "value"},          decArr,"a=value",{a: ["value"]});
		flip({a: new Obj("value")}, decArr,"a=value",{a: ["value"]});
		var decNum = (d) => d("a",Number);
		flip({a: "4"},          decNum,"a=4", {a: 4});
		flip({a: new Obj("7")}, decNum,"a=7", {a: 7});
		flip({a: ["13"]},       decNum,"a=13",{a: 13});
	});

	it("converts array values to string",function() {
		// because it's really impossible not to
		flip({arr: [5]},d => d("arr",Array),undefined,{arr: ["5"]});
	});

	it("converts default array values to string",function() {
		// because we should be consistent
		flip({},d => d("arr",Array,{default: [6]}),undefined,
		     {arr: ["6"]});
	});

	it("won't corrupt the array's default value",function() {
		// There was a problem with the State manager handing back
		// the actual default value, instead of a copy of it,
		// allowing the default to be tampered with.
		var dest = {};
		var s = new State();
		s.declare(dest,"a",Array);
		s.deserialize("");
		dest.a[2] = "SHOULD NOT SURVIVE";
		s.deserialize("");
		expect(dest).toEqual({a: []});
	});

	it("works with ints",function() {
		var dec = d => d("age",Number);
		var dec4 = d => d("age",Number,{default: 4});
		flip({},         dec,"",{age: 0})
		flip({age: 0},   dec,"")
		flip({age: 7},   dec,"age=7")
		flip({age: "0"}, dec,"",{age: 0})
		flip({age: 4},   dec4,"")
		flip({age: "4"}, dec4,"",{age: 4})
	});

	it("works with floats",function() {
		flip({num: -4.75},d => d("num",Number),"num=-4.75");
	});

	it("supports namespacing",function() {
		var tabbyCat = {key: "value"};
		flip(tabbyCat,
		     d => d("key",String,{namespace: "testns"}));
		flip(tabbyCat,
		     d => d("key",String,{namespace: "testns.something"}));
		var func = d => d("key",String,{
			default: "value",
			namespace: "thing.testns.something"});
		flip(tabbyCat,func,"");
		flip({},func,"",tabbyCat);
	});

	it("handles custom classes",function() {
		var dec =   d => d("key",Cl);
		var dec_t = d => d("key",Cl,{default: "val"});
		flip({key: new Cl("val")},dec);
		flip({key: new Cl()},     dec,"");
		flip({},                  dec,"",{key: new Cl()});

		flip({key: new Cl("val")},dec_t,"");
		flip({key: new Cl()},     dec_t);
		flip({},                  dec_t,"",{key: new Cl("val")});
	});

	it("takes 0 as default for objects without nullifying it",function() {
		var dec = d => d("i",Cl,{default: 0});
		flip({i: new Cl("0")},dec,"");
		flip({i: new Cl("")},dec,"i=");
	});

	it("can read from empty destinations",function() {
		var s= new State();
		var dest = {"num": 6};
		s.declare(dest,"emptyNum",Number);
		s.declare(dest,"num",Number);
		s.declare(dest,"emptyStr",String);
		s.declare(dest,"emptyCls",Cl);
		var outputPack = s.serialize();
		var expected ="num=6";
		expect(outputPack).toEqual(expected);
	});
});
