/*\
title: $:/plugins/mythos/cyoa/js/snippets/tracking.js
type: application/javascript
module-type: cyoasnippets

Sets up conditions for a page and widget that has any of the tracking keywords, like "before", "after", "visited".

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var utils = require("$:/plugins/mythos/cyoa/js/utils.js")
var gates = require("$:/plugins/mythos/cyoa/js/snippets/tracking/gates");

/*
KEYWORDS
*/
exports.other = ["before","after"];
exports.touch = ["touch","reset"];
exports.snippets = ["if","do","done","index","write"];
exports.trackers = exports.other.concat(exports.touch);

var prettyStrings = {
	after: "''After'': ",
	before: "''Before'': ",
	reset: "''Resets'': ",
	touch: "''Touches'': "
};

/*
Snippet methods
*/
exports["if"] = function(tiddler,widget,options) {
	var array = [];
	$tw.utils.each(widget.attributes,function(value,attr) {
		if(exports.other.indexOf(attr) >= 0) {
			array.push(filterAttributes(tiddler,widget,value,attr,"all",options));
		}
	});
	return array;
};

exports["done"] = function(tiddler,widget,options) {
	var array = [];
	// All tracked pages include a "touch" script because they're being touched simply be being loaded.
	if(widget.page) {
		var selfTouch = utils.getGroupScript(tiddler.fields.title,"touch",options.wiki);
		if(selfTouch) {
			array.push(selfTouch);
		}
	}
	$tw.utils.each(widget.attributes,function(value,attr) {
		if(exports.touch.indexOf(attr) >= 0) {
			array.push(filterAttributes(tiddler,widget,value,attr,"exec",options));
		}
	});
	return array;
};

/*
WIDGET TRACKING
*/
function filterAttributes(tiddler,widget,value,attributeName,defaultScriptState,options) {
	var pages = options.wiki.filterTiddlers(value,widget);
	if(widget.hasVariable("cyoa-render","yes")) {
		return addScripts(tiddler,attributeName,pages,defaultScriptState,options);
	} else {
		return niceMessage(pages,attributeName);
	};
};

/*
Internal methods
*/
function niceMessage(pages,attribute) {
	var string = prettyStrings[attribute];
	if(pages) {
		string += pages.map(utils.enlink).join(" and ");
	}
	return string;
};

function addScripts(tiddler,keyword,pages,defaultGate,options) {
	return gates.compile(pages,keyword,defaultGate,function(page,keyword) {
		return utils.getGroupScript(page,keyword,options.wiki);
	});
};
