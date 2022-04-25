/*\
title: test/cyoa/page.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa Page class.

\*/

var Book = require("cyoa").Book;
var domParser = require("test/dom-parser");
var utils = require("test/utils.js");
var cyoa = utils.cyoa;

describe("Page",function() {

function createDoc(elementArray) {
	var pageElements = elementArray.map(page);
	var html = `<div class="cyoa-content">${pageElements.join("")}</div>`;
	return domParser.parseBodyAndHead(html);
};

function page(attrs) {
	attrs = attrs || {};
	array = [];
	if(attrs.id) { array.push(` id='${attrs.id}'`); }
	array.push(" class='cyoa-page'");
	for(var key in attrs) {
		if(key !== "id") {
			array.push(` data-${key}=${quoteattr(attrs[key])}`);
		}
	}
	return `<div${array.join("")}></div>`;
};

function quoteattr(str) {
	return '"'+str.replace(/'/g,"&apos;").replace(/"/g,"&quot;")+'"';
}

	function flip(document,mainPage,expectedPage,options) {
		options = options || {};
		var index = options.index;
		var book = new Book(document);
		var main = book.getPage(mainPage);
		expect(main).toBeTruthy();
		var resultPage = main.selectAppend({},"noStackVar",index);
		var id = resultPage? resultPage.id: undefined;
		expect(id).withContext(`index ${index} points to unexpected append option`).toBe(expectedPage);
		return {cyoa: null,selected: id,book: book};
	}

	it("works with specified indices",function() {
		var doc = createDoc([
			{id: "Main",append: "A B C D E"},
			{id: "A",if: "0==1"},
			{id: "B",if: "1==1"},
			{id: "C",if: "1==1"},
			{id: "D",if: "1==1"},
			{id: "E",if: "0==1"}]);
		flip(doc,"Main","B",{index: 0});
		flip(doc,"Main","C",{index: 1});
		flip(doc,"Main","B",{index: 6});
		flip(doc,"Main","D",{index: 8});
	});

	it("gracefully handles negative indices",function() {
		var doc = createDoc([
			{id: "Main1",index: "-1",append: "A B"},
			{id: "Main2",append: "A B"},
			{id: "A",if: "1==1"},
			{id: "B",if: "1==1"}]);
		expect(function() {
			flip(doc,"Main1","B");
		}).toThrowError("index cannot be less than zero (-1)");
		expect(function() {
			flip(doc,"Main2","B",{index: -1});
		}).toThrowError("index cannot be less than zero (-1)");
	});

	it("can take functions as indexes",function() {
		var doc = createDoc([
			{id: "Main1",index: "ind",append: "A B C D E F"},
			{id: "Main2",index: "ind",append: "A B C D E"},
			{id: "A"},{id: "B"},{id: "C"},
			{id: "D"},{id: "E"},{id: "F"}]);
		function midSelect(deckSize) { return Math.floor(deckSize/2); }
		flip(doc,"Main1","D",{index: midSelect})
		flip(doc,"Main2","C",{index: midSelect})
	});

	it("doesn't evaluate more pages than needed",function() {
		var doc = createDoc([
			{id: "Main",append: "A B"},
			{id: "A",if: "1==1"},
			{id: "B",if: "$tw.sideEffect=true; 1==1"}]);
		$tw.sideEffect = false;
		flip(doc,"Main","A",{index: 0});
		expect($tw.sideEffect).toBe(false);

		$tw.sideEffect = false;
		flip(doc,"Main","B",{index: 1});
		expect($tw.sideEffect).toBe(true);

		$tw.sideEffect = false;
		flip(doc,"Main","A",{index: 2});
		expect($tw.sideEffect).toBe(true);
	});

	it("hashes string indexes (and abs them)",function() {
		const str = "0";
		expect(cyoa.hash(str)).withContext("Uh oh. The hash method must have changed. This tests needs a string which hashes to less than 0 to ensure that something using it handles negatives.").toBeLessThanOrEqual(-1);
		var doc = createDoc([
			{id: "Main",index: `'${str}'`,append: "A"},
			{id: "A"}]);
		flip(doc,"Main","A");
	});

	it("weighted indices",function() {
		var doc = createDoc([
			{id: "Main",append: "A B C D"},
			{id: "A",if: "1==1"},
			{id: "B",if: "0==1",weight: "5"},
			{id: "C",if: "1==1",weight: "2"},
			{id: "D",if: "1==1"}]);
		var expected = ["A","C","C","D","A","C","C","D"];
		for(var i = 0; i < expected.length; i++) {
			flip(doc,"Main",expected[i],{index: i});
		}
	});
});
