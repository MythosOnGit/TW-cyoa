/*\
title: $:/plugins/mythos/cyoa/js/snippets.js
type: application/javascript
module-type: library

This takes care of managing all cyoa.condition modules and collecting
their results into a string.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var scriptor = require("./cyoa/scriptor");
var utils = require("./utils");

var snippetHandlers = Object.create(null);

$tw.modules.forEachModuleOfType("cyoasnippets",function(title,module) {
	var tiddler = $tw.wiki.getTiddler(title);
	if(!tiddler.isDraft()) {
		for(var method in module) {
			snippetHandlers[method] = snippetHandlers[method] || [];
			snippetHandlers[method].push(module[method]);
		}
	}
});

exports.getWidgetString = function(attribute,tiddler,widget) {
	var strs = collectList(snippetHandlers[attribute],tiddler,widget);
	return scriptor.pack(strs);
};

/*
This returns a list of the appends. It still needs to be processed into a string before it can be put into data-append. That makes this inconsistent with the getPage*String methods above which use scriptor.pack and give an html-ready string. Maybe I'll change this later.
*/
exports.getPageAppendList = function(tiddler,widget,options) {
	return collectList(snippetHandlers.append,tiddler,widget,options);
};

exports.getPageDependList = function(tiddler,widget,options) {
	return collectList(snippetHandlers.depend,tiddler,widget,options);
};

function collectList(scriptSet,tiddler,widget,options) {
	options = options || {};
	if(!options.wiki) { options.wiki = widget.wiki; }
	var strs = [];
	if(scriptSet) {
		for(var index = 0; index < scriptSet.length; index++) {
			var result = scriptSet[index](tiddler,widget,options);
			if(result) {
				if(typeof result === "string") {
					result = [result];
				}
				strs = strs.concat(result);
			}
		}
	}
	return strs;
};

})();
