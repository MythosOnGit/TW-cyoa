'use strict';

var utils = require('./utils');
var Page = require('./page');
var Node = require('./node');

function Book(document) {
	this.document = document;
	this.headers = makePages(this,'cyoa-header');
	this.footers = makePages(this,'cyoa-footer');
	var pages = this.document.getElementsByClassName('cyoa-page');
	this.pages = Object.create(null);
	for(var index=0; index<pages.length; index++) {
		var page = new Page(this,pages[index]);
		this.pages[page.id] = page;
		if(page.isDefault()) {
			this.defaultPage = page;
		}
	}
	this.namedNodes = Object.create(null);
	// Gets called whenever user clicks link.
	// Method style (link,event)
	this.onlinkclick = undefined;
	var links = this.document.getElementsByClassName('tc-tiddlylink');
	var self = this;
	var clickFunc = function(event){processClickedLink(self,this,event);};
	for(var index=0; index<links.length; index++) {
		links[index].onclick = clickFunc;
	}
};

module.exports = Book;

var Bp = Book.prototype;

function processClickedLink(book,domLink,event) {
	if(book.onlinkclick) {
		book.onlinkclick(domLink,event);
	};
};

function makePages(book,className) {
	var elements = book.document.getElementsByClassName(className);
	var pages = [];
	for(var index = 0; index < elements.length; index++) {
		pages.push(new Page(book,elements[index]));
	}
	return pages;
};

Bp.getPage = function(title) {
	return this.pages[title];
};

Bp.getPageOrDefault = function(title) {
	return this.getPage(title) || this.defaultPage;
}

Bp.getStartPage = function() {
	var starts = this.document.getElementsByClassName('cyoa-start');
	if(starts.length == 0) {
		throw 'No starting page exists.'
	}
	if(starts.length > 1) {
		var ids = []
		for(var index = 0; index < starts.length; index++) {
			ids.push(starts[index].id);
		}
		utils.warn('There are multiple starting pages: '+ids);
	}
	// Maybe it should just return the element?
	return this.getPage(decodeURIComponent(starts[0].id));
};

Bp.getNode = function(nodeTitle) {
	var node = this.namedNodes[nodeTitle];
	if(node === undefined) {
		var elem = this.document.getElementById(nodeTitle);
		if(elem === null) {
			throw new Exception('Node \'' + nodeTitle + '\' not found');
		}
		node = this.namedNodes[nodeTitle] = new Node(this,elem);
	}
	return node;
};

function onClickedLink() {
};
