/*\
title: $:/plugins/mythos/cyoa/js/logic/only.js
type: application/javascript
module-type: cyoalogic

Handles the "only" field and attribute.

\*/

"use strict";

var utils = require("$:/plugins/mythos/cyoa/js/utils.js")

var prettyStrings = {
	first: "Only first time",
	visited: "Only on later visits",
	never: "Only never",
};

var tracked = {first: true, visited: true, never: false};

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

exports["if"] = function(widget,tiddler) {
	var value = widget.attributes.only;
	if(prettyStrings[value]) {
		var page = tiddler.fields.title;
		if(value === "never") {
			// Special case. "Never" pages don't need to be a part of any group, because they don't need tracking to know not to test true
			return "0";
		} else {
			return utils.getGroupScript(page,value,widget.wiki);
		}
	}
};
