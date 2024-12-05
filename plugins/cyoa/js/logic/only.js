/*\
title: $:/plugins/mythos/cyoa/js/logic/only.js
type: application/javascript
module-type: cyoalogic

Handles the "only" field and attribute.

\*/

"use strict";

var logic = require("../logic");

var prettyStrings = {
	first: "Only first time",
	visited: "Only on later visits",
	never: "Only never",
};

var tracked = {first: true, visited: true};

exports.infoTree = function(widget) {
	var value = prettyStrings[widget.attributes.only];
	if(value) {
		return [[{type: "element", tag: "strong", children: [{type: "text", text: value}]}]];
	}
};

exports.tracks = function(widget,tiddler) {
	var list = [];
	// It's a shorthand, like $first or $visited
	if(tracked[widget.parseTreeNode.type]
	// It has an "only" attribute
	|| tracked[widget.attributes.only]) {
		return tiddler.fields.title;
	}
};

exports.after = function(widget,tiddler) {
	if(widget.attributes.only === "visited") {
		var title = tiddler.fields.title;
		logic.rememberTrackedTiddler(widget.wiki,title);
		return [title];
	}
	return null;
};

exports.before = function(widget,tiddler) {
	if(widget.attributes.only === "first") {
		var title = tiddler.fields.title;
		logic.rememberTrackedTiddler(widget.wiki,title);
		return [title];
	}
	return null;
};

// Special case. "Never" pages don't need to be a part of any group, because they don't need tracking to know not to test true
exports.if = function(widget,tiddler) {
	return (widget.attributes.only === "never")? "0": null;
};
