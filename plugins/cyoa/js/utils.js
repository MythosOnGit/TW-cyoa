/*\
title: $:/plugins/mythos/cyoa/js/utils.js
type: application/javascript
module-type: library

Utils for the Tiddlywiki side of cyoa.

\*/

"use strict";

var cyoaUtils = require("./cyoa/utils");

exports.decodePage = cyoaUtils.decodePage;
exports.encodePage = cyoaUtils.encodePage;
exports.encodePageForID = cyoaUtils.encodePageForID;

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var logger,
	queue;

/*
Logs a warning to the console.
Cyoa uses this so that the testing framework can drop in another method that allows us to test that certain warning messages are printed.
*/
exports.warn = function(message) {
	console.warn(message);
	if($tw.browser) {
		if(!logger) {
			logger = new $tw.utils.Logger("Cyoa");
		}
		// This is all so the warning messages clump together and get published at the end, instead of having several different popups.
		if(queue === undefined) {
			queue = [];
			$tw.utils.nextTick(function() {
				if(queue) {
					logger.alert(queue.join("<br>"));
					queue = undefined;
				}
			});
		}
		queue.push(message);
	}
};

exports.warnForTiddler = function(tiddlerOrTitle,message,options) {
	var title = tiddlerOrTitle;
	if(typeof tiddlerOrTitle !== "string") {
		title = title && title.fields.title;
	}
	var warnCache = options.wiki.getGlobalCache("cyoa-warnings",function() {
		return Object.create(null);
	});
	var titleCache = warnCache[title] = warnCache[title] || Object.create(null);
	var count = titleCache[message] || 0;
	if(count == 0) {
		exports.warn("Page '" + title + "': " + message);
		titleCache[message] = count+1;
	}
};

exports.enquote = function(x,quote) {
	x = x || "";
	switch (quote) {
		case '"':
			return '"' + x.replace(/"/g,'\\"') + '"';
		default:
			return "'" + x.replace(/'/g,"\\'") + "'";
	}
};

exports.enlink = function(title) {
	if(title.indexOf("'") < 0) {
		return "<$link to='" + title + "'/>";
	} else if(title.indexOf('"""') < 0 && title[title.length-1] !== '"') {
		return '<$link to="""' + title + '"""/>';
	} else {
		// We need to get really sophisticated for this title
		return "<$link to={{{[[" + title.split("]").join(']] ="]" =[[') + "]] +[join[]]}}}/>";
	}
};

exports.toHashMap = function(list,truthValue) {
	truthValue = truthValue || true;
	var map = Object.create(null);
	for(var index = 0; index < list.length; index++) {
		map[list[index]] = truthValue;
	}
	return map;
};

/*
printf(" Replaces $1 and $2","this","that") -> "Replaces this and that"
*/
exports.printf = function(format /*,arguments */) {
	var output = format;
	for(var index = 1; index < arguments.length; index++) {
		output = output.replace("$"+index,arguments[index]);
	}
	return output;
};

exports.createDummyWidget = function(currentTiddler,options) {
	var parentWidget = new Widget({},options);
	parentWidget.setVariable("currentTiddler",currentTiddler);
	var pOptions = Object.assign({},options,{parentWidget: parentWidget});
	return new Widget({},pOptions);
};

exports.filterNonPageTiddlers = function(list,widget,warningString) {
	return list.filter(function(page) {
		if(widget.wiki.isCyoaPage(page)) {
			return true;
		}
		var rendering = widget.hasVariable("cyoa-render","yes");
		if(rendering) {
			var currentTiddler = widget.getVariable("currentTiddler");
			exports.warnForTiddler(currentTiddler,warningString + " " + page,{wiki: widget.wiki});
		}
		return false;
	});
};

/*
<$options/> follow these rules if they don't have a filter.
*/
exports.getOptionsList = function(title,wiki) {
	var results = [];
	var tiddler = wiki.getTiddler(title);
	// If this is a draft, we use the tiddler that this is a draft of for tags
	var actualTitle = (tiddler && tiddler.isDraft() && tiddler.fields['draft.of']) || title;
	var titles = wiki.getTiddlersWithTag(actualTitle);
	var tagsUsed = false;
	var pageMap = wiki.getCyoaPageMap();
	for(var index = 0; index < titles.length; index++) {
		// Remove drafts and non-pages
		var itemTiddler = wiki.getTiddler(titles[index]);
		if(!itemTiddler.isDraft()) {
			if(pageMap[titles[index]]) {
				results.push(titles[index]);
			}
			tagsUsed = true;
		}
	}
	if(!tagsUsed) {
		if(tiddler) {
			results = tiddler.getFieldList("list").filter(function(x) {
				return pageMap[x] && !wiki.getTiddler(x).isDraft();
			});
		}
	}
	return results;
};

var filterPlaceholders = $tw.modules.getModulesByTypeAsHashmap("cyoafilterplaceholder","prefix");
// This RegExp will locate "#{" "#a{" and "#A{", but not "#z{", because "z" is not a defined snippet placeholder prefix
var filterPlaceholderRegexp = new RegExp("#(" + Object.keys(filterPlaceholders).map($tw.utils.escapeRegExp).join("|") + "){", "g");

exports.getFilterPlaceholder = function(prefix) {
	return filterPlaceholders[prefix];
};

exports.pack = function(scripts) {
	if(typeof scripts === "string") {
		scripts = [scripts];
	}
	var reducedScripts = [];
	for (var index = 0; index < scripts.length; index++) {
		if(scripts[index]) {
			var cleaned = scripts[index].trim().replace(/;+$/, "");
			if(cleaned) {
				reducedScripts.push(cleaned);
			}
		}
	}
	if(reducedScripts.length == 0) { return null; }
	return cyoaUtils.stringifyList(reducedScripts,";");
};

exports.processJavascript = function(script, method) {
	var match;
	if(!script) {
		return;
	}
	filterPlaceholderRegexp.lastIndex = 0;
	while(match = filterPlaceholderRegexp.exec(script)) {
		var ptr = match.index + match[0].length;
		var placeholder = extractPlaceholder(script,ptr);
		if (placeholder === undefined) {
			// We hit a premature end. Quit out.
			return
		}
		ptr += placeholder.length+1;
		method(placeholder,filterPlaceholders[match[1]],match.index,ptr);
		//index = ptr;
	}
};

function extractPlaceholder(script,ptr) {
	var nesting = 1;
	var end = ptr;
	// Skip to the end of the curly braces
	while(nesting > 0) {
		if(end >= script.length) {
			// We hit a premature end. Quit out.
			return;
		}
		switch(script[end]) {
			case "{":
				nesting++;
				break;
			case "}":
				nesting--;
				break;
		}
		end++;
	}
	return script.substring(ptr,end-1);
};

exports.getGroupScript = function(page,keyword,wiki) {
	var group;
	if(!wiki.tiddlerExists(page)) {
		throw keyword+" page '"+page+"' does not exist";
	}
	if(wiki.getTiddler(page).hasTag("$:/tags/cyoa/Type")) {
		group = page;
		keyword = keyword + "All";
	} else {
		group = wiki.getTiddlerCyoaGroup(page);
	}
	var module = wiki.getCyoaGroupHandler(group);
	if(module) {
		return module[keyword](page);
	} else {
		return "";
	}
};
