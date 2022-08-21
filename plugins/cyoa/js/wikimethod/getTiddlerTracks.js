/*\
title: $:/plugins/mythos/cyoa/js/wikimethod/getTiddlerTracks.js
type: application/javascript
module-type: wikimethod

GetTidderTracks method. Fetches all tracked tiddlers within a given tiddler.
This quite likely includes itself, as most tracking tiddlers will be tracking themselves and not other tiddlers.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var keywords = require("$:/plugins/mythos/cyoa/js/snippets/tracking.js");
var Widget = require("$:/core/modules/widgets/widget.js").widget;
var CyoaWidget = require("$:/plugins/mythos/cyoa/js/widgets/cyoa.js").cyoa;
var utils = require("../utils");

var ONLY_VALUES = {first:true,visited:true};

exports.getTiddlerTracks = function(title) {
	var tiddler = this.getTiddler(title);
	if(tiddler) {
		return this.getCacheForTiddler(title,"cyoa-tracks",() => {
			var list = getWidgetTracks(this,title);
			getFieldTracks(tiddler,this,list);
			return list;
		});
	} else {
		return [];
	}
};

function pushItem(list,item) {
	if(item && list.indexOf(item) === -1) {
		list.push(item);
	}
};

function pushListItems(list,listItems) {
	var items = $tw.utils.parseStringArray(listItems);
	if(items) {
		for(var index = 0; index < items.length; index++) {
			pushItem(list,items[index]);
		}
	}
};

/*
Return an array of tiddler titles that specified by the tracked widgets. I _would_ have this append to a list passed in for consistency with getFieldTracks, but I'm not sure how that would play out with the caching.
*/
function getWidgetTracks(wiki,title) {
	var parentWidget = new Widget({});
	parentWidget.setVariable("currentTiddler",title);
	var options = {parentWidget: parentWidget,wiki: wiki};
	return wiki.traverseTiddlerStateWidgets(title,"cyoa-widget-tracks",function(ptn) {
		var widget = new CyoaWidget(ptn,options);
		widget.computeAttributes();
		var list = [];
		if(ONLY_VALUES[ptn.type]) {
			list.push(title);
		}

		var only = widget.attributes.only;
		if(ONLY_VALUES[only]) {
			pushItem(list,title);
		}
		$tw.utils.each(keywords.snippets,function(keyword) {
			if(widget.attributes[keyword]) {
				utils.processJavascript(widget.attributes[keyword],function(title) {
					pushItem(list,title);
				});
			}
		});
		$tw.utils.each(keywords.trackers,function(keyword) {
			// We don't want to parse macros, because more often than not, it's <<currentTiddler>> and it's being used in a template tiddler that shouldnt be tracked.
			var node = ptn.attributes[keyword];
			if(node && node.type === "macro") {
				return
			}
			var items = widget.attributes[keyword];
			pushListItems(list,items);
		});
		return list;
	});
};

/*
This one appends instead of returns so we don't have to bother merging the lists later.
*/
function getFieldTracks(tiddler,wiki,listToAppendTo) {
	var parentWidget = new Widget({});
	parentWidget.setVariable("currentTiddler",tiddler.fields.title);
	var widget = new Widget({},{parentWidget: parentWidget});
	var list = listToAppendTo || [];
	if(tiddler.fields["cyoa.only"]) {
		pushItem(list,tiddler.fields.title);
	}
	if(tiddler.fields["cyoa.imply"]) {
		pushItem(list,tiddler.fields.title);
		pushListItems(list,tiddler.fields["cyoa.imply"]);
	}
	forEachField(tiddler,keywords.snippets,function(keyword,field) {
		utils.processJavascript(tiddler.fields[field],function(title) {
			pushItem(list,title);
		});
	});
	forEachField(tiddler,keywords.trackers,function(method,field) {
		var pageStr = tiddler.fields[field];
		var pageArray = wiki.filterTiddlers(pageStr,widget);
		pushListItems(list,pageArray);
	});
}

})();

function forEachField(tiddler,keywords,method) {
	$tw.utils.each(keywords,function(keyword) {
		var field = "cyoa."+keyword;
		if(tiddler.hasField(field)) {
			method(keyword,field);
		}
	});
}
