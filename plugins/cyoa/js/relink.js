/*\
title: $:/plugins/mythos/cyoa/js/relink.js
type: application/javascript
module-type: relinkfieldtype

This module allows relink to recognize and relink cyoa snippets.

\*/

var utils = require("./utils");

exports.name = "snippet";
var CONTEXT = 5;

exports.report = function(value,callback,options) {
	utils.processJavascript(value,function(title,start,end) {
		// This block gives context to the snippet, but having tried it, it looks a little cluttered. I'll keep this around for now anyway.
		/*
		var blurb = "";
		var tail = end + CONTEXT;
		var head = start - CONTEXT;
		if(tail > value.length) {
			head -= tail - value.length;
		}
		// Let's get a little surrounding context
		if(head <= 0) {
			tail -= head;
			head = 0;
		} else {
			blurb = "..."
		}
		blurb += value.substring(head,start) + "#{}" + value.substring(end,tail);
		if(tail < value.length) {
			blurb += "...";
		}
		*/
		callback(title,"#{}");
	});
};

exports.relink = function(value,fromTitle,toTitle,options) {
	var index = 0;
	var result = "";
	var entry;
	utils.processJavascript(value,function(title,start,end) {
		if(title === fromTitle) {
			entry = entry || {};
			if(!canBeSnippetItem(toTitle)) {
				entry.impossible = true;
			} else {
				result += value.substring(index,start+2);
				result += toTitle;
				index = end-1;
			}
		}
	});
	if (result) {
		result += value.substring(index);
		entry.output = result;
	}
	return entry;
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
