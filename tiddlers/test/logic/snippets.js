/*\
title: test/logic/snippets.js
type: application/javascript
tags: $:/tags/test-spec

Tests snippet placeholders

\*/

const utils = require("test/utils.js");

describe("Logic: snippets",function() {

it("can use if, do, and done",function() {
	var core = utils.testBook([
		utils.defaultGroup("set",{"cyoa.serializer": "string","cyoa.key":"test"}),
		{title: "A"},{title: "B"},{title: "C"},{title: "D"},{title: "E"},{title: "F"},
		// We'll use this as a variable to manipulate
		{title: "v"},
		{title: "Main",
		 "cyoa.do": "test.v = 1",
		 "cyoa.done": "test.v *= 10",
		 "cyoa.append": "Main2 Main3",
		 text: `
			<$cyoa do="test.v *= 5" done="test.v += 3">
				<$cyoa if="test.v == 5" touch="A"/>
				<$cyoa if="test.v == 8" touch="B"/>
			</$cyoa>
			<$cyoa if="test.v == 5" touch="C"/>
			<$cyoa if="test.v == 8" touch="D"/>`},
		{title: "Main2","cyoa.if": "test.v === 100","cyoa.touch": "E"},
		{title: "Main3","cyoa.if": "test.v === 80","cyoa.touch": "F"},
	]);
	expect(core.state.serialize(core.cyoa.vars)).toEqual({test: "A.D.F"});
});

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
	// Both nodes are active because the "if" conditions are removed
	expect(utils.activeNodes(core)).toEqual(["A","B"]);
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'Main': if snippet page 'missing' does not exist");
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
	expect(utils.activeNodes(core)).toEqual(["A","B"]);
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'Main': if snippet page 'missing' does not exist");
});

it("handles missing pages in tiddler mode",function() {
	utils.warnings(spyOn);
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "exists", text: "exists"},
		{title: "Main",text: "<$cyoa if='#{nonexistent} #A{missing exists}' >Content</$cyoa>"}]);
	var dom = utils.renderTiddler(wiki,"Main");
	expect(utils.warnings()).not.toHaveBeenCalled();
	var state = dom.getElementsByClassName("cyoa-state")[0];
	expect(state.className).toContain("cyoa-error");
	// Reaching into Info node
	var links = state.firstElementChild.getElementsByTagName("a");
	expect(links[0].className).toContain("cyoa-error");
	expect(links[1].className).toContain("cyoa-error");
	expect(links[2].className).not.toContain("cyoa-error");
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
		utils.defaultGroup("numbermap",{variable: "test"}),
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

it("escapes surrounding snippet parts as text",function() {
	function testString(string,expected) {
		const wiki = new $tw.Wiki();
		wiki.addTiddlers([
			{title: "test","if": string,text: "\\procedure currentTiddler() test\n<$cyoa if={{!!if}}/>\n"}]);
		var results = wiki.renderTiddler("text/plain","test");
		expect(results).toBe("If: " + expected);
	};
	testString("Simple #{test} first","Simple test first");
	testString("'Quote' #{test} \"next\"","'Quote' test \"next\"");
	testString("<$text text=widget/> #{test}","<$text text=widget/> test");
	// The double apostrophe is tough to escape, but it must be, or it will be interpreted as the start of bold text.
	testString("\"apos\" + '' + \"quotes\"","\"apos\" + '' + \"quotes\"");
});

});
