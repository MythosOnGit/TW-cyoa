/*\
title: $:/plugins/mythos/cyoa/js/snippets/snippets.js
type: application/javascript
module-type: cyoasnippets

The most fundamental snippet fields are handled here.

For widgets, this directly transcribes scripts from the attribute:
	if, do, onclick, write

For tiddlers, this directly transcribes scripts from the fields:
	cyoa.if
	cyoa.do

The result returned from these can be a string, a list of strings, or something falsy (which means nothing will be transcribe). Each string in a list is executed independently, but in order.
\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var utils = require("../utils");

function replaceWildcards(script,keyword,msg,widget,wiki) {
	if(script) {
		var ptr = 0;
		var output = [];
		if(!widget.hasVariable("cyoa-render","yes")) {
			output.push("''",msg,"'': ");
		}
		function processTitle(title) {
			if(!widget.hasVariable("cyoa-render","yes")) {
				return utils.enlink(title);
			} if(!wiki.tiddlerExists(title)) {
				var error = msg + " snippet page '" + title + "' does not exist";
				utils.warnForTiddler(widget.getVariable("currentTiddler"),error,{wiki:wiki});
				return "false";
			} else {
				return utils.getGroupScript(title,keyword,wiki);
			}
		};
		utils.processJavascript(script,function(placeholder,module,start,end) {
			output.push(escapeText(script.substring(ptr,start),widget));
			if (module.type === "filter") {
				var titles = wiki.filterTiddlers(placeholder,widget);
				var outputs = titles.map(processTitle).filter((x) => x !== 'false');
				if(widget.hasVariable("cyoa-render","yes")) {
					output.push(module.script(outputs));
				} else {
					output.push(module.display(outputs));
				}
			} else {
				output.push(processTitle(placeholder.trim()));
			}
			ptr = end;
		});
		// Push the rest of the string
		output.push(escapeText(script.substring(ptr),widget));
		script = output.join("");
		//Now we replace macros
		script = script.replace(/#<([^>]+)>/g, function(match, variable) {
			return widget.getVariable(variable);
		});
	}
	return script;
};

function escapeText(text,widget) {
	if(text.length === 0 || widget.hasVariable("cyoa-render","yes")) {
		return text;
	} else if(text.indexOf("'") < 0) {
		return "<$text text='"+text+"'/>";
	} else if(text.indexOf('"""') < 0 && text[text.length-1] != '"') {
		return '<$text text="""'+text+'"""/>';
	} else {
		// Split on the first apos and rescurse.
		var apos = text.indexOf("'");
		return escapeText(text.substr(0,apos),widget) + "<$text text=\"'\"/>" + escapeText(text.substr(apos+1),widget);
	}
};

exports["do"] = function(tiddler,widget,options) {
	return replaceWildcards(widget.getAttribute("do"),"do","Do",widget,options.wiki);
};

exports["done"] = function(tiddler,widget,options) {
	return replaceWildcards(widget.getAttribute("done"),"do","Done",widget,options.wiki);
};

exports["if"] = function(tiddler,widget,options) {
	return replaceWildcards(widget.getAttribute("if"),"if","If",widget,options.wiki);
};

exports["onclick"] = function(tiddler,widget,options) {
	return widget.getAttribute("onclick");
};

exports["write"] = function(tiddler,widget,options) {
	return replaceWildcards(widget.getAttribute("write"),"write","Write",widget,options.wiki);
};

exports["index"] = function(tiddler,widget,options) {
	return replaceWildcards(widget.getAttribute("index"),"index","Index",widget,options.wiki);
};

exports["weight"] = function(tiddler,widget,options) {
	return replaceWildcards(widget.getAttribute("weight"),"weight","Weight",widget,options.wiki);
};
