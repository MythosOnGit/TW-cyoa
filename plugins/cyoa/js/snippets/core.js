/*\
title: $:/plugins/mythos/cyoa/js/snippets/core.js
type: application/javascript
module-type: cyoasnippets

The most fundamental snippet fields are handled here.

For widgets, this directly transcribes scripts from the attribute:
	if, do, onclick, write

For tiddlers, this directly transcribes scripts from the fields:
	cyoa.if
	cyoa.do

The result returned from these can be a string, a list of strings, or something falsy (which means nothing will be transcribe). Each string in a list is executed independently, but in order.
\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["do"] = function(tiddler,widget,options) {
	return widget.getAttribute("do");
};

exports["done"] = function(tiddler,widget,options) {
	return widget.getAttribute("done");
};

exports["set"] = function(tiddler,widget,options) {
	return widget.getAttribute("set");
};

exports["if"] = function(tiddler,widget,options) {
	return widget.getAttribute("if");
};

exports["onclick"] = function(tiddler,widget,options) {
	return widget.getAttribute("onclick");
};

exports["write"] = function(tiddler,widget,options) {
	return widget.getAttribute("write");
};

exports["index"] = function(tiddler,widget,options) {
	return widget.getAttribute("index");
};
