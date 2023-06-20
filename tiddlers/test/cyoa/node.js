/*\
title: test/cyoa/node.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa Process methods.

\*/

var Book = require("cyoa").Book;
var Node = require("cyoa").Node;
var Page = require("cyoa").Page;
var domParser = require("test/dom-parser");
const utils = require("test/utils.js");

describe("Node",function() {

function quoteattr(str) {
	return '"'+str.replace(/'/g,"&apos;").replace(/"/g,"&quot;")+'"';
}

function processElement(html) {
	var test = {};
	test.arr = [];
	test.links = undefined;
	test.p = function(v) { $tw.test.arr.push(v); };

	var doc = domParser.parseBodyAndHead(html);
	var cyoa = new Book(doc);
	var main = cyoa.getPage("Main");
	expect(main).toBeTruthy();
	$tw.test = test;
	main.execute();
	test.links = [];
	main.eachActiveLink(function(a) { test.links.push(a); });
	return doc;
}

function activeLinks(core) {
	if(core === undefined) {
		return $tw.test.links.map(function(e) {return parseInt(e.id);})
	} else {
		// Ignore 0 because that hotkey isn't used
		return core.loadedLinks.slice(1).map((e) => e.element.id);
	}
};

function touchedStates(core) {
	if(core === undefined) {
		return $tw.test.arr;
	} else {
		return Array.prototype.filter.call(core.book.document.getElementsByClassName("cyoa-active"), (elem) => elem.id && elem.id !== "Main").map((elem) => elem.id);
	}
};

function page(innerHTMLOrAttributes,innerHTML) {
	var attributes = {class: "cyoa-page"};
	if(innerHTML === undefined) {
		innerHTML = innerHTMLOrAttributes;
	} else {
		Object.assign(attributes,innerHTMLOrAttributes);
	}
	return node("Main",attributes,innerHTML);
};

function state(number,attributes,innerHTML) {
	attributes = Object.assign({class: "cyoa-state",do: `$tw.test.p(${number})`},attributes);
	return node(number.toString(),attributes,innerHTML);
};

function node(id,attributes,innerHTML) {
	var classStr = attributes["class"] || "";
	var tag = attributes.tag || "div";
	if(attributes.else) {
		classStr += " cyoa-else";
	}
	if(tag === "a") {
		classStr += " tc-tiddlylink";
	}
	var str =`<${tag} id="${id}" class="${classStr}" `;
	if(tag === "a") {
		str += " href='link'";
	}
	for(var a in attributes) {
		if(["else","tag","class"].indexOf(a) < 0) {
			var val = attributes[a];
			// I don't know why data-if'="false" fails, but it does
			if(val == false) { val = "0==1"; }
			str += " data-"+a+"='"+val+"'";
		}
	}
	str += ">";
	if(innerHTML) {
		str += (typeof innerHTML === "string"? innerHTML : innerHTML());
	}
	str += `</${tag}>`;
	return str;
};

function link(id, text) {
	return `<a id="${id}" href="link" class="tc-tiddlylink">${text}</a>`;
};

/*
Active state link
*/
function alink(id) {
	return state(id,{tag: "a"});
};

it("respects encapsulating states",function() {
	processElement(page(() => `
	  <div class="cyoa-state" data-if="true">
	    ${link(1)}
	  </div>
	  <div class="cyoa-state" data-if="false">
	    ${link(2)}
	  </div>`));
	expect(activeLinks()).toEqual([1]);
});

it("respects link states",function() {
	processElement(page(() => `
	  <a id="1" class="tc-tiddlylink cyoa-state"
	     data-if="false" href="link">link text</a>
	  <a id="2" class="tc-tiddlylink cyoa-state"
	     data-if="true" href="link">link text</a>`));
	expect(activeLinks()).toEqual([2]);
});

it("can get correct parents",function() {
	var doc = domParser.parseBodyAndHead(page(() => `<div>${state(0)}</div>`) + "<div class='cyoa-footer'>" + state(1) + "</div>");
	var book = new Book(doc);
	var node = new Node(book,doc.getElementById("0"));
	node = node.parent;
	// Should be the div
	expect(node instanceof Node).toBe(true);
	expect(node instanceof Page).toBe(false);
	node = node.parent;
	// Should be the page
	expect(node.title).toBe("Main");
	expect(node instanceof Page).toBe(true);
	node = new Node(book,doc.getElementById("1"));
	while(node) {
		// We should never make a Node with a bad element
		expect(node.element.classList).not.toBeUndefined();
		node = node.parent;
	}
	// Should turn to undefined naturally since footers have no page
	expect(node).toBeUndefined();
});

it("picks up non <a> links",function() {
	processElement(page(() => `
	  <path id="1" class="tc-tiddlylink"
		href="link" d="M400" />`));
	expect(activeLinks()).toEqual([1]);
});

it("in depth first order",function() {
	processElement(page(() => `
	  <div class="cyoa-state" data-if="true">
	    <a id="1" class="tc-tiddlylink"
	       href="link">link text</a>
	  </div>
	  <a id="2" class="cyoa-state tc-tiddlylink"
	     href="link">link text</a>`));
	expect(activeLinks()).toEqual([1,2]);
});

it("builds active links in order despite mixed elements",function() {
	var core = utils.testBook([[
		{title: "Main", text: `
			${link(1)}
			<$cyoa id=2 to=Target cyoa.if="true"/>
			${link(3)}
			<$cyoa id=4 to=Target cyoa.if="true"/>
			${link(5)}`}, {title: "Target"}]]);
	expect(activeLinks(core)).toEqual(['1','2','3','4','5']);
});

it("active links ordered despite mixed elements in index",function() {
	var core = utils.testBook([[
		{title: "Main", text: `
			<$cyoa index=1>
				${link(1)}
				<$cyoa id=2 to=Target if="true"/>
				${link(3)}
				<$cyoa id=4 to=Target if="true"/>
				${link(5)}
				<$cyoa id=6 to=Target if="true"/>
			</$cyoa>`}, {title: "Target"}]]);
	expect(activeLinks(core)).toEqual(['1','3','4','5']);
});

it("can depend on other pages",function() {
	processElement(page(() => `
	  <div class="cyoa-state" data-depend="A B">
	    ${link(1)}
	  </div>
	  <div class="cyoa-state" data-depend="A B C">
	    ${link(2)}
	  </div>`) + `
	  <div id="A" class="cyoa-page" data-if="false" />
	  <div id="B" class="cyoa-page" data-if="false" />
	  <div id="C" class="cyoa-page" data-if="true" />`
	);
	expect(activeLinks()).toEqual([2]);
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
			${link(1)}
			<$cyoa id=-2>${link(-3)}</$cyoa>
			${link(4)}
			<em><$cyoa id=5>
				${link(6)}
				<strong><$cyoa to=Other id=7/></strong>
				<$cyoa id=8>${link(9)}</$cyoa>
			</$cyoa></em>
			${link(10)}
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
