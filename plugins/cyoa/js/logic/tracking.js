/*\
title: $:/plugins/mythos/cyoa/js/logic/tracking.js
type: application/javascript
module-type: cyoalogic

Sets up conditions for a page and widget that has any of the tracking keywords, like "before", "after", "visited".

\*/

"use strict";

var utils = require("$:/plugins/mythos/cyoa/js/utils.js")

/*
KEYWORDS
*/
var other = ["after","before"];
var touch = ["touch","reset"];
var trackers = other.concat(touch);

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
exports["if"] = function(widget) {
	var array = [];
	$tw.utils.each(widget.attributes,function(value,attr) {
		if(other.indexOf(attr) >= 0) {
			array.push.apply(array,filterAttributes(widget,value,attr));
		}
	});
	return array;
};

exports["done"] = function(widget,tiddler) {
	var array = [];
	// All tracked pages include a "touch" script because they're being touched simply be being loaded.
	if(widget.page) {
		var selfTouch = utils.getGroupScript(tiddler.fields.title,"touch",widget.wiki);
		if(selfTouch) {
			array.push(selfTouch);
		}
	}
	$tw.utils.each(widget.attributes,function(value,attr) {
		if(touch.indexOf(attr) >= 0) {
			array.push.apply(array,filterAttributes(widget,value,attr));
		}
	});
	return array;
};

/*
WIDGET TRACKING
*/
function filterAttributes(widget,value,attributeName) {
	var pages = widget.wiki.filterTiddlers(value,widget);
	for(var i = 0; i < pages.length; i++) {
		pages[i] = utils.getGroupScript(pages[i],attributeName,widget.wiki);
	}
	return pages;
};
