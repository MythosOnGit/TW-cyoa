/*\
title: $:/plugins/mythos/cyoa/js/utils.js
type: application/javascript
module-type: library

Utils for the Tiddlywiki side of cyoa.

\*/

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
	var pOptions = Object.assign({parentWidget: parentWidget},options);
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
	var titles = wiki.getTiddlersWithTag(title);
	var tagsUsed = false;
	var pageMap = wiki.getCyoaPageMap();
	for(var index = 0; index < titles.length; index++) {
		var tiddler = wiki.getTiddler(titles[index]);
		if(!tiddler.isDraft()) {
			if(pageMap[titles[index]]) {
				results.push(titles[index]);
			}
			tagsUsed = true;
		}
	}
	if(!tagsUsed) {
		var tiddler = wiki.getTiddler(title);
		if(tiddler) {
			results = tiddler.getFieldList("list").filter(function(x) {
				return pageMap[x] && !wiki.getTiddler(x).isDraft();
			});
		}
	}
	return results;
};
