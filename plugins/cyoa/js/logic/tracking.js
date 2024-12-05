/*\
title: $:/plugins/mythos/cyoa/js/logic/tracking.js
type: application/javascript
module-type: cyoalogic

Sets up conditions for a page and widget that has any of the tracking keywords, like "before", "after", "visited".

\*/

"use strict";

var logic = require("../logic");

/*
KEYWORDS
*/
var trackers = ["after","before", "touch","reset"];

var prettyStrings = {
	after: "After: ",
	before: "Before: ",
	reset: "Resets: ",
	touch: "Touches: "
};

exports.infoTree = function(widget) {
	var list = [];
	$tw.utils.each(trackers,function(keyword) {
		var value = widget.getAttribute(keyword);
		if(value) {
			list.push([
				{type: "element", tag: "strong", children: [{type: "text", text: prettyStrings[keyword]}]},
				{type: "list", attributes: {
						filter: {type: "string", value: value},
						join: {type: "string", value: " and "}},
					children: [
						{type: "link", attributes: {
								class: {type: "filtered", filter: "[all[current]!is[tiddler]then[cyoa-error]]"}}}]}]);
		}
	});
	return list;
};

exports.tracks = function(widget) {
	var list = [];
	$tw.utils.each(trackers,function(keyword) {
		// We don't want to parse macros, because more often than not, it's <<currentTiddler>> and it's being used in a template tiddler that shouldnt be tracked.
		var node = widget.parseTreeNode.attributes[keyword];
		if(node && node.type === "macro") {
			return;
		}
		var items = widget.attributes[keyword];
		var pageArray = widget.wiki.filterTiddlers(items,widget);
		$tw.utils.pushTop(list,pageArray);
	});
	return list;
};

/*
Snippet methods
*/
exports.after = function(widget) {
	return makeList(widget,'after');
};

exports.before = function(widget) {
	return makeList(widget,'before');
};

exports.touch = function(widget) {
	return makeList(widget,'touch');
};

exports.reset = function(widget) {
	return makeList(widget,'reset');
};

function makeList(widget,attribute) {
	var filterStr = widget.attributes[attribute];
	if(filterStr) {
		return widget.wiki.filterTiddlers(filterStr,widget).filter(function(title) {
			var tiddler = widget.wiki.getTiddler(title);
			if(!tiddler) {
				throw attribute + " page '" + title + "' does not exist";
			}
			logic.rememberTrackedTiddler(widget.wiki,title);
			return true;
		});
	}
	return null;
};
