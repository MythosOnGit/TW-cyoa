/*\
title: $:/plugins/mythos/cyoa/js/relink/snippets.js
type: application/javascript
module-type: relinkfieldtype

This module allows relink to recognize and relink cyoa snippets.

\*/

"use strict";

var utils = require("../utils");
var relinkUtils = require("$:/plugins/flibbles/relink/js/utils.js");

exports.name = "snippet";

exports.report = function(script,callback,options) {
	utils.processJavascript(script,function(placeholder,module,start,end) {
		var relinker = getRelinker(module);
		var front = "#" + module.prefix + "{";
		var back = "}";
		if(script.length + start - end <= 10) {
			front = script.substr(0,start) + front;
			back = back + script.substr(end);
		}
		relinker.report(placeholder,function(title,blurb) {
			callback(title,front + (blurb || "") + back);
		},options);
	});
};

exports.relink = function(script,fromTitle,toTitle,options) {
	var index = 0;
	var result = "";
	var entry;
	var impossible = false;
	utils.processJavascript(script,function(title,module,start,end) {
		var relinker = getRelinker(module);
		var entry = relinker.relink(title,fromTitle,toTitle,options);
		if(entry) {
			if(entry.output) {
				if(!canBeSnippetItem(entry.output)) {
					impossible = true;
				} else {
					result += script.substring(index,start+module.prefix.length+2);
					result += entry.output;
					index = end-1;
				}
			}
			if(entry.impossible) {
				impossible = true;
			}
		}
	});
	if(result || impossible) {
		entry = {};
		if(result) {
			result += script.substring(index);
			entry.output = result;
		}
		if(impossible) {
			entry.impossible = true;
		}
	}
	return entry;
};

function getRelinker(module) {
	return relinkUtils.getType(module.type);
};

function canBeSnippetItem(value) {
	var start = 0;
	var nesting = 0;
	for(;start < value.length; ++start) {
		switch(value[start]) {
			case "{":
				++nesting;
				break;
			case "}":
				if(--nesting < 0) {
					// Too many closing braces
					return false;
				}
				break;
		}
	}
	return nesting == 0;
};
