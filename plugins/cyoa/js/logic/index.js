/*\
title: $:/plugins/mythos/cyoa/js/logic.js
type: application/javascript
module-type: library

This takes care of managing all cyoa.condition modules and collecting
their results into a string.

\*/

"use strict";

var utils = require("./utils");

var snippetHandlers = Object.create(null);

$tw.modules.forEachModuleOfType("cyoalogic",function(title,module) {
	var tiddler = $tw.wiki.getTiddler(title);
	if(!tiddler.isDraft()) {
		for(var method in module) {
			snippetHandlers[method] = snippetHandlers[method] || [];
			snippetHandlers[method].push(module[method]);
		}
	}
});

/**
 * We check and remember the given title as a tiddler that is tracked. Later, we will recall them all when putting together the tracking information after the DOM tree.
 */
exports.rememberTrackedTiddler = function(wiki, title) {
	var tracked = wiki.getGlobalCache('cyoa-tracked',function() {
		// We create an empty cache if there wasn't one.
		return Object.create(null);
	});
	function remember(title) {
		if(!tracked[title]) {
			tracked[title] = true;
			var tiddler = wiki.getTiddler(title);
			if (tiddler && tiddler.fields['cyoa.imply']) {
				var implies = $tw.utils.parseStringArray(tiddler.fields['cyoa.imply']);
				$tw.utils.each(implies,remember);
			}
		};
	}
	remember(title);
};

exports.getWidgetString = function(attribute,tiddler,widget) {
	var strs = collectList(snippetHandlers[attribute],tiddler,widget);
	switch(attribute) {
		case "before":
		case "after":
		case "touch":
		case "reset":
		case "push":
			return strs.map(exports.encodePageForID).join(" ");
		case "append":
		case "depend":
			return strs.filter(title => {
				if(!widget.wiki.isCyoaPage(title)) {
					var current = widget.getVariable("currentPage");
					var warning = (!widget.page ? "$cyoa widget " : "") + attribute + " includes non-page tiddler '" + title + "'";
					utils.warnForTiddler(current,warning,{wiki: widget.wiki});
					return false;
				}
				return true;
			}).map(exports.encodePageForID).join(" ");
		default:
			return utils.pack(strs);
	}
};

/*
This returns an array of the appends. This will not filter out non-page titles, and it does not issue warnings.
*/
exports.getPageAppendList = function(tiddler,widget,options) {
	return collectList(snippetHandlers.append,tiddler,widget,options);
};

exports.getPageDependList = function(tiddler,widget,options) {
	return collectList(snippetHandlers.depend,tiddler,widget,options);
};

exports.getWidgetTracks = function(tiddler,widget,options) {
	return collectList(snippetHandlers.tracks,tiddler,widget,options);
};

exports.getInfoNodes = function(widget,options) {
	return collectList(snippetHandlers.infoTree,null,widget,options);
};

function collectList(scriptSet,tiddler,widget,options) {
	options = options || {};
	if(!options.wiki) { options.wiki = widget.wiki; }
	var strs = [];
	if(scriptSet) {
		for(var index = 0; index < scriptSet.length; index++) {
			var result = scriptSet[index](widget,tiddler,options);
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

exports.encodePageForID = function(idString) {
	// The spaces are encoded so these ids can be HTML legal. The curlies are encoded so they work in snippets.
	return idString.split("%").join("%25").split(" ").join("%20").split('{').join('%7B').split('}').join('%7D');
};
