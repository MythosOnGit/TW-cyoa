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
		utils.defaultGroup(),
		utils.group("number", "numbermap"),
		{title: "test", "cyoa.group": "number"},
		{title: "A"},{title: "B"},{title: "C"},{title: "D"},{title: "E"},{title: "F"},
		// We'll use this as a variable to manipulate
		{title: "v"},
		{title: "Main",
		 "cyoa.do": "#{test} = 1",
		 "cyoa.done": "#{test} *= 10",
		 "cyoa.append": "Main2 Main3",
		 text: `
			<$cyoa do="#{test} *= 5" done="#{test} += 3">
				<$cyoa if="#{test} == 5" touch="A"/>
				<$cyoa if="#{test} == 8" touch="B"/>
			</$cyoa>
			<$cyoa if="#{test} == 5" touch="C"/>
			<$cyoa if="#{test} == 8" touch="D"/>`},
		{title: "Main2","cyoa.if": "#{test} === 100","cyoa.touch": "E"},
		{title: "Main3","cyoa.if": "#{test} === 80","cyoa.touch": "F"},
	]);
	expect(core.state.allVisited()).toEqual(["A","D","F","test"]);
});

it("can't attack exports to cause damage",function() {
	var core = utils.testBook([
		{title: "Main", "cyoa.do": "if(typeof exports !== 'undefined') {for (var ex in exports) { exports[ex] = null; }}", "cyoa.append": "Next"},
		// Then run another page with a snippet. It just needs to run successfully
		{title: "Next", "cyoa.if": "true"}]);

	expect(utils.activeNodes(core)).toEqual(['Next']);
});

it("ignores blank falsy strings",function() {
	var core = utils.testBook([
		{title: "Main", "cyoa.append": "Next"},
		// If snippet doesn't return a falsy empty string. It gets ignored.
		{title: "Next", "cyoa.if": ""}]);

	expect(utils.activeNodes(core)).toEqual(['Next']);
});

it('handles evals that functions could not handle',function() {
	var core = utils.testBook([
		utils.group("number", "numbermap"),
		// Get all the semicolons in there. Those might be tricky.
		{title: "Main", "cyoa.do": "var a=5,b=0; while(a>0) {b+=a--; }; #{Output} = b;"},
		{title: "Output", "cyoa.group": "number"}]);
	expect(core.state.query("Output")).toBe(15);
});

it('can access global libraries',function() {
	var core = utils.testBook([
		utils.group("number", "numbermap"),
		{title: "Main", "cyoa.do": "#{Output} = Math.max(7,11)"},
		{title: "Output", "cyoa.group": "number"}]);
	expect(core.state.query("Output")).toBe(11);
});

/* Placeholders */

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

it("handles index weights",function() {
	var core = utils.testBook([
		{title: "Main",text: `<$cyoa index=3>
			<$cyoa id=A weight=3/>
			<$cyoa id=B/>
			<$cyoa id=C/>
		</$cyoa>`,"cyoa.append": "X Y Z","cyoa.index": "3"},
		{title: "X","cyoa.weight": "3"},
		{title: "Y"},
		{title: "Z"}]);
	expect(utils.activeNodes(core)).toEqual(["B","Y"]);
});

it("handles index weights modulo",function() {
	var core = utils.testBook([
		{title: "Main",text: `<$cyoa index=13>
			<$cyoa id=A weight=3/>
			<$cyoa id=B/>
			<$cyoa id=C/>
		</$cyoa>`,"cyoa.append": "X Y Z","cyoa.index": "13"},
		{title: "X","cyoa.weight": "3"},
		{title: "Y"},
		{title: "Z"}]);
	expect(utils.activeNodes(core)).toEqual(["B","Y"]);
});

it("handles snippet weights",function() {
	var core = utils.testBook([
		utils.defaultGroup(),
		{title: "A"},
		{title: "B"},
		{title: "C"},
		{title: "Main",text:`<$cyoa touch="A C"/>
			<$cyoa index=52>
				<$cyoa id=X weight="#{A}+#{B}+#{C}+50"/>
				<$cyoa id=Y />
				<$cyoa id=Z />
			</$cyoa>`}]);
		expect(utils.activeNodes(core)).toEqual(["Y"]);
});

it("handles non-integer weights",function() {
	// It should round down
	var core = utils.testBook([
		utils.defaultGroup(),
		{title: "Main",text:`<$cyoa index=3>
				<$cyoa id=X weight="2.6"/>
				<$cyoa id=Y weight="1.4"/>
				<$cyoa id=Z />
			</$cyoa>`}]);
		expect(utils.activeNodes(core)).toEqual(["Z"]);
});

});
