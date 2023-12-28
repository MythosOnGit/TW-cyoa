/*\
title: test/logic/depend.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa widget.

This test file is slowly replacing tiddlywiki/widgets/cyoa.js, because this
file doesn't care about the minutia like the other file does.

\*/

const utils = require("test/utils.js");

describe("Logic: depend",function() {

it("can handle depends",function() {
	var core = utils.testBook([[
		{title: "false page","cyoa.if": "false"},
		{title: "true page","cyoa.if": "true"},
		{title: "child","cyoa.depend":"[[false page]]"},
		{title: "Main","cyoa.append": "Main2 Main3",text: `
			<$cyoa id=A depend="[[false page]]" />
			<$cyoa id=B depend="[[true page]]" />
			<$cyoa id=C depend="[[true page]] [[false page]]" />
			<!-- Empty depends comes out true -->
			<$cyoa id=D depend="" />`},
		// depends works fine with tiddler-level $cyoa
		{title: "Main2","cyoa.depend": "[[false page]]"},
		// doesn't cache depend results. (child results can be accessed twice)
		{title: "Main3","cyoa.depend": "[[false page]] [[true page]]","cyoa.append": "Main4 Main5 Main6"},
		{title: "Main4","cyoa.depend": "child"},
		{title: "Main5","cyoa.depend": "child"},
		// Handles infinite loops which logically come out as false
		{title: "Main6","cyoa.append": "Main7 Main8"},
		{title: "Main7","cyoa.depend": "Main7-b [[false page]]"},
		{title: "Main7-b","cyoa.depend": "Main7"},
		// Handles infinite loops which logically come out as true
		{title: "Main8","cyoa.depend": "Main8-b [[true page]]"},
		{title: "Main8-b","cyoa.depend": "Main8"}]]);
	expect(utils.activeNodes(core)).toEqual(["B","C","D","Main3","Main6","Main8"]);
});

it("logs error when compiling",function() {
	utils.warnings(spyOn);
	var core = utils.testBook([
		{title: "$:/config/mythos/cyoa/page-filter",text: "[!tag[exclude]]"},
		{title: "false","cyoa.only": "never"},
		{title: "excluded",tags: "exclude"},
		{title: "Main","cyoa.append": "Skipped Main2",text: `
			<!-- non existent pages issue warning -->
			<$cyoa id=E depend="noexist" />
			<!-- existing tiddlers that are not pages also issue warning -->
			<$cyoa id=F depend="excluded false" />`},
		{title: "Skipped","cyoa.depend": "excluded false"},
		{title: "Main2"}]);
	expect(utils.warnings().calls.allArgs()).toEqual([
		["Page 'Main': $cyoa widget depend includes non-page tiddler 'noexist'"],
		["Page 'Main': $cyoa widget depend includes non-page tiddler 'excluded'"],
		["Page 'Skipped': depend includes non-page tiddler 'excluded'"]]);
	expect(utils.activeNodes(core)).toEqual(["E","Main2"]);
});

it("doesn't issue depend list warnings when not compiling",function() {
	utils.warnings(spyOn);
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "exists",text: "exists"});
	wiki.addTiddler({title: "Main",text: "<$cyoa depend='exists $:/sys' >Content</$cyoa>"});
	var dom = utils.renderTiddler(wiki,"Main");
	expect(utils.warnings()).not.toHaveBeenCalled();
	var state = dom.getElementsByClassName("cyoa-state")[0];
	expect(state.className).toContain("cyoa-error");
	// Reaching into Info node
	var links = state.firstElementChild.getElementsByTagName("a");
	expect(links[0].className).not.toContain("cyoa-error");
	expect(links[1].className).toContain("cyoa-error");
});

});
