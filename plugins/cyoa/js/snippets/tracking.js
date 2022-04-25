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
var prefix = "$:/plugins/mythos/cyoa/groups/";

/*
KEYWORDS
*/
exports.field = "cyoa.only";
exports.self = ["visited","first"];
exports.other = ["before","after"];
exports.touch = ["touch","reset"];
exports.trackers = exports.other.concat(exports.touch);

var prettyStrings = {
	after: "After: ",
	before: "Before: ",
	first: "First time only",
	reset: "Resets: ",
	touch: "Touches: ",
	visited: "On later visits only"
};

/*
Snippet methods
*/
exports["if"] = function(tiddler,widget,options) {
	var array = [];
	$tw.utils.each(widget.attributes,function(value,attr) {
		var method = ifs[attr];
		if(method) {
			var string = method(tiddler,widget,value,options);
			if(attr === "only") {
				// I'd like the Only constraints to appear first
				array.unshift(string);
			} else {
				array.push(string);
			}
		}
	});
	return array;
};

exports["done"] = function(tiddler,widget,options) {
	var array = [];
	// All tracked pages include a "touch" script because they're being touched simply be being loaded.
	if(widget.page) {
		var selfTouch = addScript(tiddler,"touch",tiddler.fields.title,options);
		if(selfTouch) {
			array.push(selfTouch);
		}
	}
	$tw.utils.each(widget.attributes,function(value,attr) {
		var method = dos[attr];
		if(method) {
			array.push(method(tiddler,widget,value,options));
		}
	});
	return array;
};

/*
WIDGET TRACKING
*/
function functionForFilterAttributes(attributeName,defaultScriptState) {
	return function(tiddler,widget,value,options) {
		var pages = options.wiki.filterTiddlers(value,widget);
		if(widget.hasVariable("cyoa-render","yes")) {
			return addScripts(tiddler,attributeName,pages,defaultScriptState,options);
		} else {
			return niceMessage(pages,attributeName);
		};
	};
};

function functionForValuelessAttributes(attributeName) {
	return function(tiddler,widget,value,options) {
		var page = tiddler.fields.title;
		if(widget.hasVariable("cyoa-render","yes")) {
			return addScript(tiddler,value,page,options);
		} else {
			return niceMessage(null,value);
		};
	}
};

var ifs = {
	before: functionForFilterAttributes("before","all"),
	after: functionForFilterAttributes("after","all"),
	only: functionForValuelessAttributes("only")
};

var dos = {
	reset: functionForFilterAttributes("reset","exec"),
	touch: functionForFilterAttributes("touch","exec")
};

/*
Internal methods
*/
function niceMessage(pages,attribute) {
	var string = prettyStrings[attribute];
	if(pages) {
		string += "'" + pages.join("' and '") + "'";
	}
	return string;
};

function addScript(tiddler,keyword,page,options) {
	var groupModules = getCyoaGroupModules(options.wiki);
	var group;
	if(page.startsWith(prefix)) {
		group = page.substr(prefix.length);
	} else {
		group = options.wiki.getTiddlerCyoaGroup(page);
	}
	var module = groupModules[group];
	if(module && module[keyword]) {
		if(page.startsWith("$:/plugins/mythos/cyoa/groups/")) {
			keyword = keyword + "All";
		}
		return module[keyword](page);
	} else {
		if(!options.wiki.tiddlerExists(page)) {
			utils.warnForTiddler(tiddler,keyword+" page '"+page+"' does not exist",{wiki: options.wiki});
		}
		return "";
	}
}

function addScripts(tiddler,keyword,pages,defaultGate,options) {
	return gates.compile(pages,keyword,defaultGate,function(page,keyword) {
		return addScript(tiddler,keyword,page,options);
	});
};

function getCyoaGroupModules(wiki) {
	return wiki.getGlobalCache("cyoa-group-modules",function() {
		var map = Object.create(null);
		$tw.utils.each(wiki.getCyoaGroups(),function(t,group) {
			// assemble set object here
			map[group] = wiki.getCyoaGroupHandler(group);
		});
		return map;
	});
};
