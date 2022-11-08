/*\
title: test/wikimethods/traversal.js
type: application/javascript
tags: $:/tags/test-spec

Tests the wikimethods used by cyoa for creating edge types.

\*/

const utils = require("test/utils.js");

var title = "traversal-tests";

function expectContainMembers(container,members) {
	expect(container.length).toBe(members.length);
	for(var i = 0; i < members.length; i++) {
		expect(container).toContain(members[i]);
	}
};

function testMethod(method,expected,tiddlers,text,extraFields) {
	const wiki = new $tw.Wiki();
	if(Object.prototype.toString.call(tiddlers) !== "[object Array]") {
		tiddlers = [tiddlers];
	}
	var t = tiddlers[0].title = tiddlers[0].title || title;
	wiki.addTiddlers(tiddlers);
	var list = wiki[method](t);
	expectContainMembers(list,expected);
	return wiki;
}

function testTranscludes(expected,text) {
	testMethod("getTiddlerTranscludes",expected,{text: text});
}

function testCyoaLinks(expected,tiddlers) {
	return testMethod("getTiddlerStateLinks",expected,tiddlers);
}

function testTracks(expected,text,extraFields) {
	testMethod("getTiddlerTracks",expected,Object.assign({text: text},extraFields));
}

describe("wikimethod: transclude",function() {

it("Finds syntax transcludes",function() {
	testTranscludes(["file A"],"Syntax transclude: {{file A}}");
});

it("Finds widget transcludes",function() {
	var text = "Widget: <$transclude tiddler='file A' />";
	testTranscludes(["file A"],text);
});

it("Finds nested transcludes",function() {
	testTranscludes(["file A","inner"],`
		<$set name="A" value="B">
			<$transclude tiddler="file A">
				<$transclude tiddler="inner" />
			</$transclude>
		</$set>`);
});

it("doesn't duplicate transcludes",function() {
	testTranscludes(
		["file A","file B"],
		"{{file A}}-{{file B}}-{{file A}}");
});

});

describe("wikimethod: Cyoa links",function() {

it("Finds nested cyoa widgets",function() {
	testCyoaLinks(["file A"],{text: `
		<$set name="A" value="B">
			<$cyoa to="file A">Link text</$cyoa>
		</$set>`});
});

it("even if not a cyoa widget",function() {
	testCyoaLinks(["file A","file B","file C"],{text: `
		<$else to="file A">Link text</$else>
		<$cyoa to="file B" push="other">Link text</$cyoa>
		<$first to="file C">More link text</$first>`});
});

it("finds tag links in <$options />",function() {
	testCyoaLinks(["fileA","fileB"],[
		{title: "main",text: "<$options />"},
		{title: "fileA",tags: "main"},
		{title: "fileB",tags: "main"},
		{title: "fileC"},
		// Non-page tiddlers are ignored.
		{title: "$:/fileD",tags: "main"},
		// Draft is ignored
		utils.draft({title: "fileE",tags: "main"})]);
});

it("finds list links in <$options />",function() {
	testCyoaLinks(["fileA","fileB"],[
		{title: "main",text: "<$options />",list: "fileA fileB"},
		{title: "fileA"},
		{title: "fileB"},
		{title: "fileC"}]);
});

it("finds links in <$options /> with filter",function() {
	testCyoaLinks(["fileA","fileC"],[
		{title: "main",text: "<$options filter='[list[]]' />",list: "fileA fileC"},
		{title: "fileA",tags: "main"},
		{title: "fileB",tags: "main"},
		{title: "fileC"}]);
});

it("finds link in <$options /> with tiddler arg",function() {
	testCyoaLinks(["fileA","fileC"],[
		{title: "main",text: "<$options tiddler='lister' />"},
		{title: "lister",list: "fileA fileC"},
		{title: "fileA",tags: "main"},
		{title: "fileB",tags: "main"},
		{title: "fileC"}]);
});

it("ignores drafts tagging <$options /> when preferring lists",function() {
	testCyoaLinks(["fileA","fileB"],[
		{title: "main",text: "<$options />",list: "fileA fileB"},
		{title: "fileA"},
		{title: "fileB"},
		utils.draft({title: "fileB",tags: "main"})]);
});

it("does not ignore non-page tiddlers when maybe prefer lists",function() {
	testCyoaLinks([],[
		{title: "main",text: "<$options />",list: "fileA fileB"},
		{title: "fileA"},
		{title: "fileB"},
		{title: "$:/fileC",tags: "main"}]);
});

it("refreshes cache when <$options /> would change",function() {
	var wiki = testCyoaLinks(["fileA"],[
		{title: "main",text: "<$options />",list: "fileA fileB"},
		{title: "fileA",tags: "main"},
		{title: "fileB"}]);
	wiki.addTiddler({title: "new",tags: "main"});
	expectContainMembers(wiki.getTiddlerStateLinks("main"),["fileA","new"]);

	// But what about when the list would get smaller...?
	wiki.addTiddler({title: "new",tags: "somethingElse"});
	expectContainMembers(wiki.getTiddlerStateLinks("main"),["fileA"]);

	// And when the last tagging tiddler is removed, it should resort to list?
	wiki.addTiddler({title: "fileA",tags: "somethingElse"});
	expectContainMembers(wiki.getTiddlerStateLinks("main"),["fileA","fileB"]);
});

it("doesn't duplicate cyoa.link hrefs",function() {
	testCyoaLinks( ["file A","file B"],{text: `
		<$cyoa to="file A" />
		<$cyoa to="file B" />
		<$cyoa to="file A" />`});
});

});

describe("wikimethod: Tracks",function() {

it("Finds tracked widgets in all variations",function() {
	testTracks(["fileA","touchB",title],`
		<$set name="A" value="B">
		<$cyoa after="fileA">stuff</$cyoa>
		<$cyoa touch="touchB">stuff</$cyoa>
		<$cyoa only=visited>stuff</$cyoa>
	</$set>`);
});

it("Finds shorthand tracked widgets",function() {
	testTracks([title],"<$visited>stuff</$visited>");
	testTracks([title],"<$first>stuff</$first>");
});

it("tracks widgets are silent when misused",function() {
	// At least for getTiddlerTracks. Errors are caught during compilation
	testTracks([],"<$cyoa only=anything>stuff</$cyoa>");
	// returning true is the best it can do, since tiddlywiki doesn't differeiciate between an attribute value of 'true' and no value at all.
	testTracks(["true"],"<$cyoa before>stuff</$cyoa>");
});

it("track fields are silent when misused",function() {
	testTracks([],"S",{"cyoa.after": ""});
	testTracks([],"S",{"cyoa.before": ""});
});

it("picks up field values",function() {
	testTracks(["A","B","C",title],"stuff",{
		"cyoa.after": "A",
		"cyoa.before": "B",
		"cyoa.touch": "C",
		"cyoa.only": "first"});
});

it("picks up captions",function() {
	testTracks(["A",title],"text",{
		"cyoa.caption": "<$first after=A>x</$first>"});
});

it("handles lists-items",function() {
	testTracks(["A","B","C space","D","E"],"text",{
		"cyoa.after": "A B",
		"cyoa.before": "B [[C space]]",
		"cyoa.touch": "D E"});
});

it("widget handles list-items",function() {
	testTracks(["A","B","C space","D","E"],`
	<$cyoa after="A B" before="B [[C space]]" touch="D E"/>`);
});

it("widget with multiple tracks",function() {
	testTracks(["A","B",title],`
		<$first after="A" before="B" />`);
});

it("widget using filtered tracks",function() {
	testTracks(["A","B","C"],"<$cyoa after='A B C' />");
	testTracks(["A B","C"],"<$cyoa after='[[A B]] C' />");
});

it("picks up titles in snippets",function() {
	testTracks(["A","C{{5}D}"],"<$cyoa if='#{A} == #{C{{5}D}} + #{A}'/>");
	testTracks(["A","C{5}{6}D"],"text",{"cyoa.if":"#{A}==#{C{5}{6}D}+#{A}'/>"});
	testTracks(["A","C{{5}D}"],"<$cyoa do='#{A} = #{C{{5}D}} + #{A}'/>");
	testTracks(["A","C{5}{6}D"],"text",{"cyoa.do":"#{A}=#{C{5}{6}D}+#{A}'/>"});
	testTracks(["A","C{{5}D}"],"<$cyoa done='#{A} = #{C{{5}D}} + #{A}'/>");
	testTracks(["A","C{5}{6}D"],"text",{"cyoa.done":"#{A}=#{C{5}{6}D}+#{A}'/>"});
	// Spaces are trimmed
	testTracks(["A","C"],"<$cyoa if='#{   A   } == #{   C   }'/>");
});

it("picks up titles in snippet filter placeholder",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "simple",text: "<$cyoa if='#a{ \"A\" } == 5'/>"},
		{title: "currentTid", val: "B", text: "<$cyoa if='#a{ [all[current]get[val]] } == 5'/>"},
		{title: "field", val: "C","cyoa.if": "#a{ [all[current]get[val]] } == 5"}]);
	expect(wiki.getTiddlerTracks("simple")).toEqual(["A"]);
	expect(wiki.getTiddlerTracks("currentTid")).toEqual(["B"]);
	expect(wiki.getTiddlerTracks("field")).toEqual(["C"]);
});

it("doesn't return duplicates",function() {
	var text = "<$visited after='A'/><$first before='A'/>";
	testTracks(["A",title],text,{
		"cyoa.after": "A",
		"cyoa.before": "A",
		"cyoa.touch": "A",
		"cyoa.if": "#{A}",
		"cyoa.only": "first"});
});

it("handles filters in fields",function() {
	var fields = ["after","before","touch","reset"];
	var tiddler = {};
	$tw.utils.each(fields,function(field) {
		tiddler["cyoa."+field] = "[all[current]get["+field+"]]";
		tiddler[field] = field[0];
	})
	testTracks(["a","b","t","r"],"",tiddler);
});

it("handles undefined tiddlers",function() {
	utils.warnings(spyOn);
	var list = $tw.wiki.getTiddlerTracks("nonexistent");
	expect(list).toEqual([]);
	expect(utils.warnings()).not.toHaveBeenCalled();
});

});
