/*\
title: test/cyoa/boot.js
type: application/javascript
tags: $:/tags/test-spec

\*/

var cyoa = require("$:/plugins/mythos/cyoa/js/boot")();
var boot = cyoa.boot;
var utils = require("cyoa").utils;
var domParser = require("test/dom-parser");
var MockWindow = require("test/cyoa/mock/window");

describe("Boot",function() {

describe("#utils",function() {
	//encodeURIComponent: encodes all but: a-zA-Z0-9_.!~*'()-
	//html4 ids: /[a-zA-Z][a-zA-Z0-9_:.-]*/
	//html5 ids: /[^\s]+/
	//URI
	//  fragment    = *( pchar / "/" / "?" )
	//  pchar       = unreserved / ptc-encoded / sub-delims / ":" / "@"
	//  ureserved   = ALPHA / DIGIT / "-" / "." / "_" / "~"
	//  pct-encoded = "%" HEXDIG HEXDIG
	//  sub-delims  = "!"/ "$"/ "&"/ "'"/ "("/ ")"/ "*"/ "+"/ ","/ ";"/ "="
	//    or basically anything but: #^[]{}\"<> and raw %
	// because of html5 ids, we also forbid spaces.
	// because of the uri search requirements, we also forbid: "?", "&", "="
	// What we do differently from encodeURI:  $'/+,;
	var forbidden = "?&=#^[]{}\\ \"<>";

	function assertEncoded(encoded) {
		for(var c = 0; c < forbidden.length; c++) {
			expect(encoded).not.toContain(forbidden[c]);
		}
		expect(encoded).not.toMatch(/%[^0-9A-F]/);
		expect(encoded).not.toMatch(/%.[^0-9A-F]/);
	};

	function flip(str) {
		var enc = utils.encodePage(str);
		assertEncoded(enc);
		var dec = utils.decodePage(enc);
		expect(dec).toBe(str);

		var vanillaEnc = encodeURIComponent(str);
		expect(utils.decodePage(vanillaEnc)).toBe(str);
	};

	it("encodes and decodes page strings",function() {
		flip("this with spaces%and%percents");
		flip("path/to/something interesting.jpg");
		flip("anything?+something else=something&nothing");
		flip(forbidden);
	});
});

describe("#boot",function() {
	it("can load scripts",function() {
		var coreFile = encodeURIComponent("$:/plugins/mythos/cyoa/js/cyoa/cyoa.js");
		var testpage = `<!doctype html>
		<html><body>
		  <div class="cyoa-scripts">
		    <div id="${coreFile}">
		<pre>exports.Core = function(win) {};
		exports.State = function(){};
		exports.declare = function(){};
		exports.UriManager = function(){};
		exports.Core.prototype.openPage = function() {
			$tw.test.bookOpened = true;
		};
		</pre>
		    </div>
		  </div>
		</body> </html>`;
		$tw.test = $tw.test || Object.create(null);
		$tw.test.bookOpened = false;
		var doc = domParser.parseBodyAndHead(testpage);
		var window = new MockWindow(doc);
		boot.boot(window);
		expect($tw.test.bookOpened).toBe(true);
	});
});

describe("#require",function() {
	function generateMods(testFiles) {
		var modules = {};
		for(var file in testFiles) {
			var data = testFiles[file];
			modules[file] = {
				text: "exports.file='"+file+"';\nexports.reqs=[];",
				type: data.module};
			for(var i=0; i<(data.req || []).length; i++) {
				modules[file].text += "\nexports.reqs.push( require('"+data.req[i]+"').file);";
			}
			// Add extra text if any
			if(data.text) {
				modules[file].text += "\n" + data.text;
			}
		}
		return modules;
	};

	function testReqs(modules,source,expected) {
		expect(boot.execute(modules,source).reqs).toEqual(expected);
	};

	it("can load with or without extension",function() {
		var modules = generateMods({
			"test.js": {},
			"file.js": {},
			"file": {},
			"nested/deep/file.js": {},
		});
		function test(input,output) {
			var mod = boot.execute(modules,input);
			expect(mod.file).toBe(output);
		};
		test("file","file");
		test("file.js","file.js");
		test("test","test.js");
		test("test.js","test.js");
		test("nested/deep/file","nested/deep/file.js");
		test("nested/deep/file.js","nested/deep/file.js");
	});

	it("can load by module-type",function() {
		var mods = generateMods({
			"test/A.js": {text: "exports.A = 5;",module: "test"},
			"test/B.js": {text: "exports.B = 6;"},
			"test/C.js": {text: "exports.C = 7;",module: "test"},
		});
		var obj = boot.assignModulesOfType(mods,"test");
		expect(obj.A).toBe(5);
		expect(obj.B).toBeUndefined();
		expect(obj.C).toBe(7);
	});

	it("can load locally and globally",function() {
		var mods = generateMods({
			"root/dir/include.js": {},
			"root/dir/global.js": {req: ["root/dir/include.js"]},
			"root/dir/local.js": {req: ["./include.js"]},
		});
		testReqs(mods,"root/dir/global.js",["root/dir/include.js"]);
		testReqs(mods,"root/dir/local.js",["root/dir/include.js"]);
	});

	function testNestedToRoot(requirementString) {
		var mods = generateMods({
			"file.js": {},
			"path/dir/source.js": {req: [requirementString]},
		});
		testReqs(mods,"path/dir/source.js",["file.js"]);
	};

	it("can navigate nested to root",function() {
		testNestedToRoot("../../file.js");
		testNestedToRoot("./../../file.js");
		testNestedToRoot("file.js");
		testNestedToRoot("../dir/.././../file.js");
	});

	it("throws error when given empty string",function() {
		expect(function() {
			testNestedToRoot("");
		}).toThrowError("Error importing 'path/dir/source.js': require requires a non-empty string ()");
	});

	function testRootToNested(requirementString) {
		var mods = generateMods({
			"source.js": {req: [requirementString]},
			"path/dir/file.js": {},
		});
		testReqs(mods,"source.js",["path/dir/file.js"]);
	};

	it("can navigate root to nested",function() {
		testRootToNested("path/dir/file.js");
		testRootToNested("./path/dir/file.js");
		testRootToNested("path/../path/./dir/file.js");
		testRootToNested("./path/../path/./dir/file.js");
	});

	function testNestToNest(requirementString,expected) {
		var mods = generateMods({
			"start/from/source.js": {req: [requirementString]},
			"go/to/file.js": {},
			"start/from/go/to/file.js": {},
		});
		testReqs(mods,"start/from/source.js",[expected]);
	}

	it("can navigate nested to nested",function() {
		testNestToNest("go/to/file.js","go/to/file.js");
		testNestToNest("go/to/file","go/to/file.js");
		testNestToNest("go/to/../to/file","go/to/file.js");
		testNestToNest("./go/to/file.js","start/from/go/to/file.js");
		testNestToNest("./go/to/file","start/from/go/to/file.js");
		testNestToNest("./go/../go/to/file","start/from/go/to/file.js");
	});

	it("gets correct line numbers during errors",function() {
		function testError(text,lineNumber) {
			var mods = {"file.js": {text: text}};
			var err;
			expect(function() {
				try { boot.execute(mods,"file.js"); }
				catch(e) {
					err = e;
					throw e;
				}
			}).toThrowError("Error importing 'file.js': err");
			var match = /file\.js:(\d+):/.exec(err.stack);
			expect(match).withContext("Could not find file.js in the stacktrace:\n" + err.stack).toBeTruthy();
			expect(parseInt(match[1])).toBe(lineNumber);
		}
		testError("throw new Error('err')",1);
		testError("\nthrow new Error('err')",2);
		testError("/*\nA comment.\n*/\nthrow new Error('err')",4);
	});

	it("handles circular dependencies gracefully",function() {
		var mods = generateMods({
			"a.js": {req: ["b.js"]},
			"b.js": {req: ["c.js"]},
			"c.js": {req: ["a.js"]},
		});
		expect(function() {
			boot.execute(mods,"a.js");
		}).toThrowError("Error importing 'a.js': Error importing 'b.js': Error importing 'c.js': Cyclic dependency encountered importing 'a.js'");

	});
}); // #require

}); // Boot
