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

function activeLinks() {
	return $tw.test.links.map(function(e) {return parseInt(e.id);})
};

function touchedStates() {
	return $tw.test.arr;
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

function link(id) {
	return `<a id="${id}" href="link" class="tc-tiddlylink">text</a>`;
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
	processElement(page(() => `
	  ${link(1)}
	  ${alink(2)}
	  ${link(3)}
	  ${alink(4)}
	  ${link(5)}`));
	expect(activeLinks()).toEqual([1,2,3,4,5]);
	expect($tw.test.arr).toEqual([2,4]);
});

it("active links ordered despite mixed elements in index",function() {
	processElement(page(() => `
	  <div class="cyoa-state" data-index="1">
	  ${link(1)}
	  ${alink(-2)}
	  ${link(3)}
	  ${alink(4)}
	  ${link(5)}
	  ${alink(-6)}
	  </div>`));
	expect(activeLinks()).toEqual([1,3,4,5]);
	expect($tw.test.arr).toEqual([4]);
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

it("indexes can handle no options",function() {
	// None are truthy
	processElement(page(() => state(0,{index: "5"},() =>
		state(1,{if: false}))));
	expect(touchedStates()). toEqual([0]);
	// None to begin with
	processElement(page(() => state(0,{index: "5"})));
	expect(touchedStates()). toEqual([0]);
});

it("indexes support formulas",function() {
	processElement(page(
	  state(-1,{index: "1+1"},alink(0) + alink(1) + alink(2) )
	));
	expect(activeLinks()).toEqual([2]);
	expect(touchedStates()).toEqual([-1,2]);
});

it("low indexes don't compute later nodes unnecessarily",function() {
	processElement(page(() => state(-1,{index: 15,do: "$tw.test.sum = 0"},
	  state(1,{weight: 10,if: "$tw.test.sum += 1"}) +
	  state(2,{weight: 10,if: "($tw.test.sum += 2) && false"}) +
	  state(3,{weight: 10,if: "$tw.test.sum += 4"}) +
	  state(4,{weight: 10,if: "$tw.test.sum += 8"}) // This last one isn't touched
	)));
	expect(touchedStates()).toEqual([3]);
	expect($tw.test.sum).toEqual(7);
});

it("doesn't use page indexes for cyoa widgets",function() {
	processElement(page({index: "1"},state(0) + state(1)));
	expect(touchedStates()).toEqual([0,1]);
});

it("active links with nested indexing",function() {
	processElement(page(() => `
	<div class="cyoa-state" data-index="29">
	  ${link(1)}
	  ${state(-2,{},() =>
	  	link(-3))}
	  ${link(4)}
	  <em>`+state(5,{},() => `
	  	${link(6)}
	  	<strong>${state(7,{tag: "a"})}</strong>
	  	${state(8,{},() =>
	  		link(9))}
	  `)+`</em>
	  ${link(10)}
	  ${state(-11,{tag: "a",weight: "5"})}
	</div>`));
	expect(activeLinks()).toEqual([1,4,6,7,9,10]);
	expect($tw.test.arr).toEqual([5,7,8]);
});

it("works with index weights",function() {
	processElement(page(() =>
		`${state(0,{index: 5},() => `
		  ${state(1)}
		  ${state(2,{weight: 4})}
		  ${state(3)}`)}`
		+ // first index
		`${state(10,{index: 0},() => `
		  ${state(11)}
		  ${state(12,{weight: 4})}
		  ${state(13)}`)}`
		+ // skip middle index
		`${state(20,{index: 3},() => `
		  ${state(21,{weight: 3})}
		  ${state(22,{if: false,weight: 4})}
		  ${state(23)}`)}`
	));
	expect(touchedStates()).toEqual([0,3,10,11,20,23]);
});

it("works with bad weights",function() {
	processElement(page(() =>
		state(0,{index: 0},() =>
			state(1,{weight: 0}))));
	expect(touchedStates()).toEqual([0]);
	processElement(page(() =>
		state(0,{index: 0},() =>
			state(1,{weight: -5}) +
			state(2))));
	expect(touchedStates()).toEqual([0,2]);
	processElement(page(() =>
		state(0,{index: 0},() =>
			state(1) +
			state(2,{weight: -5}))));
	expect(touchedStates()).toEqual([0,1]);
});

it("indexing modulos to correct amount",function() {
	processElement(page(() =>
		`${state(-1,{index: 7},() => `
		  ${state(0)}
		  ${state(1)}
		  ${state(2,{if: false})}
		  ${state(3)}`)}`
		));
	expect(touchedStates()).toEqual([-1,1]);

	// with weights
	processElement(page(() => `
		${state(-1,{index: 501},() => `
		  ${state(0,{},() => `
		    state(4,{weight: 3})`)}
		  <em>${state(1,{},() => `
		    <strong>${state(5)}</strong>
		    ${state(6,{if: false,weight: 3})}`)}</em>
		  ${state(2,{if: false,weight: 3})}
		  ${state(3,{weight: 98})}`)}
		`));
	expect(touchedStates()).toEqual([-1,1,5]);
});

it("mundane links with inner state execute properly",function() {
	// Using <svg> element on the outside, because if you put <a> elements one within the other, the DOM assumes you meant to close the first
	processElement(page(() => `
		<svg class="tc-tiddlylink" id="0">
		  ${alink(1)} ${state(2)} <em id="em">text</em>
		</svg>`));
	expect(touchedStates()).toEqual([1,2]);
	expect(activeLinks()).toEqual([0,1]);
});

}); //Node
