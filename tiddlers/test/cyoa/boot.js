/*\
title: test/cyoa/boot.js
type: application/javascript
tags: $:/tags/test-spec

\*/

var cyoa = require("$:/plugins/mythos/cyoa/js/boot")();
var boot = cyoa.boot;
var modules = cyoa.modules;
var domParser = require("test/dom-parser");
var MockWindow = require("test/cyoa/mock/window");

describe("Boot",function() {

it("#boot can load scripts",function() {
	var coreFile = encodeURIComponent("$:/plugins/mythos/cyoa/js/cyoa/cyoa.js");
	var testpage = `<!doctype html>
	<html><body>
	  <div class="cyoa-scripts">
		<div id="${coreFile}">
	<pre>exports.Core = function(win) {};
	exports.State = function(){};
	exports.Book = function(){};
	exports.declare = function(){};
	exports.Core.prototype.openPage = function() {
		$tw.test.bookOpened = true;
	};
	</pre>
		</div>
		<div id="saver" module-type="cyoasaver">
		 <pre>exports.uri = function() {};</pre>
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

	function testReqs(mods,source,expected) {
		modules.titles = mods;
		expect(modules.execute(source).reqs).toEqual(expected);
	};

	it("can load with or without extension",function() {
		var mods = generateMods({
			"test.js": {},
			"file.js": {},
			"file": {},
			"nested/deep/file.js": {},
		});
		function test(input,output) {
			modules.titles = mods;
			var mod = modules.execute(input);
			expect(mod.file).toBe(output);
		};
		test("file","file");
		test("file.js","file.js");
		test("test","test.js");
		test("test.js","test.js");
		test("nested/deep/file","nested/deep/file.js");
		test("nested/deep/file.js","nested/deep/file.js");
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
				try {
					modules.titles = mods;
					modules.execute("file.js");
				} catch(e) {
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
			modules.titles = mods;
			modules.execute("a.js");
		}).toThrowError("Error importing 'a.js': Error importing 'b.js': Error importing 'c.js': Cyclic dependency encountered importing 'a.js'");

	});
}); // #require

}); // Boot
