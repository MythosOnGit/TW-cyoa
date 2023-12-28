/*\
title: test/cyoa/node.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa Process methods.

\*/

const utils = require("test/utils.js");

describe("Node",function() {

function activeLinks(core) {
	// Ignore 0 because that hotkey isn't used
	return core.loadedLinks.slice(1).map((e) => e.element.id);
};

function touchedStates(core) {
	return Array.prototype.filter.call(core.book.document.getElementsByClassName("cyoa-active"), (elem) => elem.id && elem.id !== "Main").map((elem) => elem.id);
};

it("respects encapsulating states",function() {
	var core = utils.testBook([
		{title: "Main", text: `
		  <$cyoa if=true><$cyoa id=1 to=link>link</$cyoa></$cyoa>
		  <!-- The presence of id=2 proves that they are ordered depth first -->
		  <$cyoa id=2 to=link>link</$cyoa>
		  <$cyoa if=false><$cyoa id=3 to=link if=true>link</$cyoa></$cyoa>`}]);
	expect(activeLinks(core)).toEqual(['1', '2']);
});

it("respects link states",function() {
	var core = utils.testBook([
		{title: "Main", text: `
		  <$cyoa id=1 to=link if=false>link text</$cyoa>
		  <$cyoa id=2 to=link if=true>link text</$cyoa>`}]);
	expect(activeLinks(core)).toEqual(['2']);
});

it("picks up non <a> links",function() {
	var core = utils.testBook([
		{title: "Main", text: `
	  <path id=1 class=tc-tiddlylink
		href=link d=M400 />`}]);
	expect(activeLinks(core)).toEqual(['1']);
});

it("builds active links in order despite mixed elements",function() {
	var core = utils.testBook([[
		{title: "Main", text: `
			<a id=1 href=link class=tc-tiddlylink>A</a>
			<$cyoa id=2 to=Target cyoa.if="true"/>
			<a id=3 href=link class=tc-tiddlylink>B</a>
			<$cyoa id=4 to=Target cyoa.if="true"/>
			<a id=5 href=link class=tc-tiddlylink>C</a>`}, {title: "Target"}]]);
	expect(activeLinks(core)).toEqual(['1','2','3','4','5']);
});

it("active links ordered despite mixed elements in index",function() {
	var core = utils.testBook([[
		{title: "Main", text: `
			<$cyoa index=1>
				<a id=1 href=link class=tc-tiddlylink/>
				<$cyoa id=2 to=Target if="true"/>
				<a id=3 href=link class=tc-tiddlylink/>
				<$cyoa id=4 to=Target if="true"/>
				<a id=5 href=link class=tc-tiddlylink/>
				<$cyoa id=6 to=Target if="true"/>
			</$cyoa>`}, {title: "Target"}]]);
	expect(activeLinks(core)).toEqual(['1','3','4','5']);
});

it("low indexes don't compute later nodes unnecessarily",function() {
	var core = utils.testBook([[
		utils.defaultGroup("set",{"cyoa.key":"test"}),
		{title: "Main",text: `
		<$cyoa index=15 do="test.sum = 0">
			<$cyoa id=1 weight=10 if="test.sum += 1" />
			<$cyoa id=2 weight=10 if="(test.sum += 2) && false" />
			<$cyoa id=3 weight=10 if="test.sum += 4" />
			<$cyoa id='not touched' weight=10 if="test.sum += 8" />
		</$cyoa>
		<$cyoa id=check if="test.sum === 7" />
	`}]]);
	expect(touchedStates(core)).toEqual(['3','check']);
});

it("active links with nested indexing",function() {
	var core = utils.testBook([[
		{title: "Main",text: `
		<$cyoa index=29>
			<a id=1 href=link class=tc-tiddlylink/>
			<$cyoa id=-2><a id=-3 href=link class=tc-tiddlylink/></$cyoa>
			<a id=4 href=link class=tc-tiddlylink/>
			<em><$cyoa id=5>
				<a id=6 href=link class=tc-tiddlylink/>
				<strong><$cyoa to=Other id=7/></strong>
				<$cyoa id=8><a id=9 href=link class=tc-tiddlylink/></$cyoa>
			</$cyoa></em>
			<a id=10 href=link class=tc-tiddlylink/>
			<$cyoa id=-11 to=Other weight=5 />
		</$cyoa>`}]]);
	expect(activeLinks(core)).toEqual(['1','4','6','7','9','10']);
	expect(touchedStates(core)).toEqual(['5','7','8']);
});

it("works with bad weights",function() {
	var core;
	core = utils.testBook([[
		{title: "Main",text: "<$cyoa id=0 index=0><$cyoa id=1 weight=0 /></$cyoa>"}]]);
	expect(touchedStates(core)).toEqual(['0']);
	core = utils.testBook([[
		{title: "Main", text: "<$cyoa id=0 index=0><$cyoa id=1 weight=-5 /><$cyoa id=2 /></$cyoa>"}]]);
	expect(touchedStates(core)).toEqual(['0','2']);
	core = utils.testBook([[
		{title: "Main", text: "<$cyoa id=0 index=0><$cyoa id=1 /><$cyoa id=2 weight=-5 /></$cyoa>"}]]);
	expect(touchedStates(core)).toEqual(['0','1']);
});

it("mundane links with inner state execute properly",function() {
	// Using <svg> element on the outside, because if you put <a> elements one within the other, the DOM assumes you meant to close the first
	var core = utils.testBook([[
		{title: "Main", text: `
			<$cyoa tag=svg to=Target id=0>
				<$cyoa id=1 to=Target/>
				<$cyoa id=2 />
				''text''
			</$cyoa>`}]]);
	expect(touchedStates(core)).toEqual(['0', '1', '2']);
	expect(activeLinks(core)).toEqual(['0','1']);
});

}); //Node
