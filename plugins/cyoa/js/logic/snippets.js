/*\
title: $:/plugins/mythos/cyoa/js/logic/snippets.js
type: application/javascript
module-type: cyoalogic

The most fundamental snippet fields are handled here.

For widgets, this directly transcribes scripts from the attribute:
	if, do, onclick, write

For tiddlers, this directly transcribes scripts from the fields:
	cyoa.if
	cyoa.do

The result returned from these can be a string, a list of strings, or something falsy (which means nothing will be transcribe). Each string in a list is executed independently, but in order.
\*/

"use strict";

var utils = require("../utils");

var fields = {
	"do": "do",
	"done": "do",
	"if": "if",
	"write": "write",
	"index": "index",
	"weight": "weight"};

exports.tracks = function(widget) {
	var list = [];
	$tw.utils.each(fields,function(_,keyword) {
		if(widget.attributes[keyword]) {
			utils.processJavascript(widget.attributes[keyword],function(placeholder,module) {
				$tw.utils.pushTop(list,module.getTitles(placeholder,widget));
			});
		}
	});
	return list;
};

$tw.utils.each(fields,function(keyword,field) {
	exports[field] = function(widget) {
		return replaceWildcards(widget.getAttribute(field),keyword,field,widget);
	};
});

function replaceWildcards(script,keyword,msg,widget) {
	var wiki = widget.wiki;
	if(script) {
		var ptr = 0;
		var output = [];
		var error = false;
		function exists(title) {
			if(!wiki.tiddlerExists(title)) {
				var errorMsg = msg + " snippet page '" + title + "' does not exist";
				utils.warnForTiddler(widget.getVariable("currentTiddler"),errorMsg,{wiki:wiki});
				error = true;
				return false;
			}
			return true;
		};
		function processTitle(title) {
			return utils.getGroupScript(title,keyword,wiki);
		};
		utils.processJavascript(script,function(placeholder,module,start,end) {
			output.push(script.substring(ptr,start));
			if (module.type === "filter") {
				var titles = wiki.filterTiddlers(placeholder,widget);
				var outputs = titles.filter(exists).map(processTitle);
				output.push(module.script(outputs));
			} else {
				placeholder = placeholder.trim();
				if (exists(placeholder)) {
					output.push(processTitle(placeholder));
				}
			}
			ptr = end;
		});
		if(error) {
			// An error was encountered. the script will be malformed
			return undefined;
		}
		// Push the rest of the string
		output.push(script.substring(ptr));
		script = output.join("");
		//Now we replace macros
		script = script.replace(/#<([^>]+)>/g, function(match, variable) {
			return widget.getVariable(variable);
		});
	}
	return script;
};

exports.infoTree = function(widget) {
	var list = [];
	var linkNode = {type: "link", attributes: { class: {type: "filtered", filter: "[all[current]!is[tiddler]then[cyoa-error]]"}}};
	for(var field in fields) {
		var attr = widget.getAttribute(field);
		if(attr) {
			var ptr = 0;
			var caps = field.charAt(0).toUpperCase() + field.slice(1) + ": ";
			var parseTreeNode = [{type: "element", tag: "strong", children: [{type: "text", text: caps}]}];
			utils.processJavascript(attr,function(placeholder,module,start,end) {
				pushTreeForInbetweenText(parseTreeNode,attr,ptr,start);
				if(module.type === "filter") {
					parseTreeNode.push({type: "list", attributes: {
							filter: {type: "string", value: placeholder},
							join: {type: "string", value: module.join}},
						children: [linkNode]})
				} else {
					parseTreeNode.push({type: "tiddler", attributes: {
							tiddler: {type: "string", value: placeholder.trim()}},
						children: [linkNode]});
				}
				ptr = end;
			});
			// Push the rest of the string
			pushTreeForInbetweenText(parseTreeNode,attr,ptr);
			list.push(parseTreeNode);
		}
	}
	return list;
};

function pushTreeForInbetweenText(list,string,start,end) {
	if(end === undefined) {
		end = string.length;
	}
	if(end > start) {
		var substring = string.substring(start,end);
		var regexp = /#<([^>]+)>/g;
		var match;
		var ptr = 0;
		while(match = regexp.exec(substring)) {
			if(ptr !== match.index) {
				list.push({type: "text", text: substring.substring(ptr,match.index)});
			}
			list.push({type: "text", attributes: {
					"text": {type: "macro", value: match[1]}}});
			ptr = regexp.lastIndex;
		}
		if(ptr < substring.length) {
			list.push({type: "text", text: substring.substr(ptr)});
		}
	}
};

