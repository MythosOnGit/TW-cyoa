/*\
title: test/placeholders.js
type: application/javascript
tags: $:/tags/test-spec

Tests snippet placeholders

\*/

const utils = require("test/utils.js");

describe("placeholders",function() {

it("can handle not-quite-placeholders",function() {
	var core = utils.testBook([
		{title: "Main",text: `
			<$cyoa if='!!"#"' id="A"/>
			<$cyoa if='!!"#{"' id="B"/>
		`}]);
	expect(utils.activeNodes(core)).toEqual(["A","B"]);
});

it("handles spaces around simple placeholders",function() {
	var core = utils.testBook([
		utils.defaultGroup("set",{variable: "test"}),
		{title: "variable"},
		{title: "Main",text: `
			<$cyoa touch=variable />
			<$cyoa if='#{  variable  }' id="A"/>
			<$cyoa if='!#{  variable  }' id="B"/>
		`}]);
	expect(utils.activeNodes(core)).toEqual(["A"]);

	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "variable"},
		{title: "Main",text: `<$cyoa if='#{  variable  }' id=target />`}]);
	var text = wiki.renderTiddler("text/html","Main");
	// We're making sure that whitespace isn't unnecessarily added in the link.
	expect(text).toContain(">variable<");
});

it("handles macros in snippets in widgets",function() {
	var core = utils.testBook([
		{title: "Main", text:`\\define testvar() 5
\\define  othertestvar() 3
			<$cyoa if='2 + #<othertestvar> == #<testvar>' id="A" />
			<$cyoa if='3 + #<othertestvar> == #<testvar>' id="A" />
		`}]);
	expect(utils.activeNodes(core)).toEqual(["A"]);
});

it("handles macros in snippets in pages",function() {
	var core = utils.testBook([
		{title: "Macros", tags: "$:/tags/Macro", text: "\\define testvar() 8\n\\define other() 3"},
		{title: "Main", "cyoa.append": "A B"},
		{title: "A", "cyoa.if": "4 + #<other> == #<testvar>"},
		{title: "B", "cyoa.if": "5 + #<other> == #<testvar>"}]);
	expect(utils.activeNodes(core)).toEqual(["B"]);
});

it("handles missing pages in simple placeholders",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "Main",text: `<$cyoa if='#{missing} == 0' />`}]);
	var text = wiki.renderTiddler("text/html","Main");
	// The link should be present, but it should be a missing link
	expect(text).toContain(">missing<");
	expect(text).toContain("tc-tiddlylink-missing");

	utils.warnings(spyOn);
	var core = utils.testBook([
		utils.defaultGroup("set",{variable: "test"}),
		{title: "Main",text: `
			<$cyoa if='#{missing} == false' id="A"/>
			<$cyoa if='#{missing} == true' id="B"/>
		`}]);
	expect(utils.activeNodes(core)).toEqual(["A"]);
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'Main': If snippet page 'missing' does not exist");
});

it("handles missing pages in filter placeholders",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "T"},
		{title: "Main",text: `
			<$cyoa if='#A{missing T}' />`}]);
	var text = wiki.renderTiddler("text/html","Main");
	// The link should be present, but it should be a missing link
	expect(text).toContain(">missing<");
	expect(text).toContain("tc-tiddlylink-missing");

	utils.warnings(spyOn);
	var core = utils.testBook([
		utils.defaultGroup("set",{variable: "test"}),
		{title: "T"}, {title: "F"},
		{title: "Main",text: `
			<$cyoa touch=T />
			<$cyoa if='#A{missing T}' id="A"/>
			<$cyoa if='#A{missing F}' id="B"/>
		`}]);
	expect(utils.activeNodes(core)).toEqual(["A"]);
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'Main': If snippet page 'missing' does not exist");
});

it("can do 'all' filters",function() {
	var core = utils.testBook([
		utils.defaultGroup("set",{variable: "test"}),
		{title: "T"}, {title: "TT"}, {title: "F"},
		{title: "Main",field:"T",text: `
			<$cyoa touch="T TT" />
			<$cyoa if='#A{ [all[current]get[field]] TT}' id=A/>
			<$cyoa if='#A{ [all[current]get[field]] F}' id=B/>
	`}]);
	expect(utils.activeNodes(core)).toEqual(["A"]);

	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "T"}, {title: "F"},
		{title: "Main", field:"T",text: `
			<$cyoa if='#A{ [all[current]get[field]] F }' id=target />`}]);
	var text = wiki.renderTiddler("text/html","Main",{variables: {currentTiddler: "Main"}});
	// It should be "<a href=....>T</a> and <a ...". Let's not bother testing the whole thing. We ony care about the "and".
	expect(text).toContain("> and <");
});

it("can do 'any' filters",function() {
	var core = utils.testBook([
		utils.defaultGroup("set",{variable: "test"}),
		{title: "T"}, {title: "FF"}, {title: "F"},
		{title: "Main",getT:"T",getF: "F", text: `
			<$cyoa touch="T" />
			<$cyoa if='#a{ [all[current]get[getT]] FF}' id=A/>
			<$cyoa if='#a{ [all[current]get[getF]] FF}' id=B/>
	`}]);
	expect(utils.activeNodes(core)).toEqual(["A"]);

	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "T"}, {title: "F"},
		{title: "Main", field:"T",text: `
			<$cyoa if='#a{ [all[current]get[field]] F }' id=target />`}]);
	var text = wiki.renderTiddler("text/html","Main",{variables: {currentTiddler: "Main"}});
	// It should be "<a href=....>T</a> or <a ...". Let's not bother testing the whole thing. We ony care about the "or".
	expect(text).toContain("> or <");
});

it("can do 'sum' filters",function() {
	var core = utils.testBook([
		utils.defaultGroup("intmap",{variable: "test"}),
		{title: "t0"}, {title: "t1"}, {title: "t4"},
		{title: "Main", field:"t4", text: `
			<$cyoa touch=t1 do="#{t4} = 4" />
			<$cyoa if='#+{ [all[current]get[field]] t0 t1} == 5' id=A/>
			<$cyoa if='#+{ [all[current]get[field]] t0 t1} == 2' id=B/>
	`}]);
	expect(utils.activeNodes(core)).toEqual(["A"]);

	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "t0"}, {title: "t1"},
		{title: "Main", field:"t0",text: `
			<$cyoa if='#+{ [all[current]get[field]] t1 } == 2' id=target />`}]);
	var text = wiki.renderTiddler("text/html","Main",{variables: {currentTiddler: "Main"}});
	// It should be "<a href=....>T</a> + <a ...". Let's not bother testing the whole thing. We ony care about the "+".
	expect(text).toContain("> + <");
});

});
