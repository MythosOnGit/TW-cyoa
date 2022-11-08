/*\
title: test/cyoa/scriptor.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa script manager

\*/

var scriptor = require("cyoa").scriptor;
var utils = require("$:/plugins/mythos/cyoa/js/utils");

var reflection = Object.create(null);

reflection.stripComments = function(func) {
	var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
	return func.toString().replace(STRIP_COMMENTS,"");
};

reflection.getArguments = function(func) {
	var ARGUMENT_NAMES = /([^\s,]+)/g;
	var f = reflection.stripComments(func.toString());
	var argString = f.slice(f.indexOf("(")+1,f.indexOf(")"));
	var results = argString.match(ARGUMENT_NAMES);
	return results || [];
};

reflection.getVars = function(func) {
	// This does not get all vars in a chain of declarations.
	// In `var a =4, b=3`, It will miss b.
	var VARS = /var\s+[a-zA-Z_$][\w$]*/mg;
	var f = reflection.stripComments(func.toString());
	var results = f.match(VARS) || [];
	results = results.map((m) => m.replace(/^var\s+([\S+])/,"$1"));
	return results;
};

describe("scriptor",function() {

describe("#eval",function() {
	function test(scripts,state) {
		var pack = utils.pack(scripts);
		return scriptor.eval(pack,state)
	}

	it("can handle arbitrary state",function() {
		expect(test(["page"],{page: 5})).toEqual([5]);
		expect(test(["zoinks + 3"],{zoinks: 6})).toEqual([9]);
	});

	it("ignores blank falsy strings",function() {
		expect(utils.pack(["key",""])).toEqual("key");
		expect(utils.pack(["key",null])).toEqual("key");
		expect(utils.pack(["key",undefined])).toEqual("key");

		expect(utils.pack([""])).toBeNull();
		expect(utils.pack([null])).toBeNull();
		expect(utils.pack([undefined])).toBeNull();
	});

	it("doesn't let scripts mess up the state",function() {
		expect(test(["val=6","val+2"],{val:3})).toEqual([6,5]);
	});

	it("handles all eval variations for single scripts",function() {
		expect(test(["Math.max(4,5)"],{})).toEqual([5]);
		expect(test(["Math.max(4,5);"],{})).toEqual([5]);
		expect(test(["var a=5,b=0; while(a>0) { b+=a--; }; b"],{})).toEqual([15]);
		expect(test(["var a=2,b=3; a+b"],{})).toEqual([5]);
		expect(test(["(function(b){return b+2;})(4)"],{})).toEqual([6]);
	});

	it("handles all eval variations for multiple scripts",function() {
		expect(test(["3","Math.max(4,5)"],{})).toEqual([3,5]);
		expect(test(["3","Math.max(4,5);"],{})).toEqual([3,5]);
		expect(test(["3","var a=5,b=0; while(a>0) { b+=a--; }; b"],{})).toEqual([3,15]);
		expect(test(["var a=5; a+6","var a=2,b=3; a+b"],{})).toEqual([11,5]);
		expect(test(["3","(function(b){return b+2;})(4)"],{})).toEqual([3,6]);
	});

	it("can take a single string for a pack argument",function() {
		expect(test("6+7",{})).toEqual([13]);
	});

	it("handles strings",function() {
		expect(test(['"key"',"'val'"],{})).toEqual(["key","val"]);
	});

	it("handles multiple scripts",function() {
		expect(test(["5+6","val=4"],{val: 3})).toEqual([11,4]);
	});

	it("takes three arguments (and we can detect them)",function() {
		var argList = reflection.getArguments(scriptor.eval);
		expect(argList.length).toBe(3);
	});

	it("can't override arguments to cause damage",function() {
		// If scriptor did a simple "eval", then it might be possible to access some of the variables in the scope above eval, and changing them might cause undefined behavior.
		var args = reflection.getArguments(scriptor.eval);
		var scripts = args.map(function(arg) {
			return "typeof("+arg+")!=='undefined' ? "+arg+" = undefined: 5";
		});
		expect(() => test(scripts)).not.toThrow();
		expect(() =>test(scripts.reverse())).not.toThrow();
	});

	it("can't override vars to cause damage",function() {
		var vars = reflection.getVars(scriptor.eval);
		expect(vars.length).toBeGreaterThan(0);
		var expected = [];
		var scripts = vars.map(function(arg,index) {
			expected.push(index);
			return "typeof("+arg+")!=='undefined' ? "+arg+" = undefined: 5; "+index;
		});
		expect(test(scripts)).toEqual(expected);
		expect(test(scripts.reverse())).toEqual(expected.reverse());
	});
});

describe("#evalAll",function() {
	function test(scripts,state) {
		return scriptor.evalAll(utils.pack(scripts),state)
	}

	it("works with many scripts",function() {
		expect(test(["1==1","2==2","3==3"],{})).toBe(true);
		expect(test(["1==1","2!=2","3==3"],{})).toBe(false);
		expect(test(["1==1","2==2","3!=3"],{})).toBe(false);
	});

	it("works with one script",function() {
		expect(test(["1==1"],{})).toBe(true);
		expect(test(["1!=1"],{})).toBe(false);
	});

	it("works with no scripts",function() {
		expect(test([],{})).toBe(true);
	});

	it("also uses given state",function() {
		expect(test(["v==6"],{v: 6})).toBe(true);
	});

	it("treats 'true' and 'false' properly",function() {
		expect(test(["true"],{})).toBe(true);
		expect(test(["false"],{})).toBe(false);
	});
});

}); //scriptor

describe("Test Utils",function() {
	function testFunc(val0with0num,list/*,ignoredArg*/) {
		list = list || [];
		// var badVar
		var arg1 = Object.create(null);
		var $rtn;
		/*
		var badVar2
		*/
		for(var i = 0; i < list.length; i++) {
			var value = list[i];
			$rtn = $rtn || value.doSomething();
		}
		return $rtn;
	};

	it("gets function arguments",function() {
		var args = reflection.getArguments(testFunc);
		expect(args).toEqual(["val0with0num","list"]);
	});

	it("gets function vars",function() {
		var vars = reflection.getVars(testFunc);
		expect(vars).toEqual(["arg1","$rtn","i","value"]);
	});
}); //Test Utils
