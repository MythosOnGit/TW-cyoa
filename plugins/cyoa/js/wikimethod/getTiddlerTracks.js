/*\
title: $:/plugins/mythos/cyoa/js/wikimethod/getTiddlerTracks.js
type: application/javascript
module-type: wikimethod

GetTidderTracks method. Fetches all tracked tiddlers within a given tiddler.
This quite likely includes itself, as most tracking tiddlers will be tracking themselves and not other tiddlers.

\*/

"use strict";

var logic = require("$:/plugins/mythos/cyoa/js/logic.js");
var Widget = require("$:/core/modules/widgets/widget.js").widget;
var CyoaWidget = require("$:/plugins/mythos/cyoa/js/widgets/cyoa.js").cyoa;

exports.getTiddlerTracks = function(title) {
	var tiddler = this.getTiddler(title);
	if(tiddler) {
		return this.getCacheForTiddler(title,"cyoa-tracks",() => {
			var parentWidget = new Widget({});
			parentWidget.setVariable("currentTiddler",title);
			var options = {parentWidget: parentWidget,wiki: this};
			var list = getWidgetTracks(this,title,options);
			getFieldTracks(tiddler,this,list,options);
			return list;
		});
	} else {
		return [];
	}
};

function pushListItems(list,items) {
	if(items) {
		for (var i = 0; i < items.length; i++) {
			$tw.utils.pushTop(list,items[i]);
		}
	}
};

/*
Return an array of tiddler titles that specified by the tracked widgets. I _would_ have this append to a list passed in for consistency with getFieldTracks, but I'm not sure how that would play out with the caching.
*/
function getWidgetTracks(wiki,title,options) {
	return wiki.traverseTiddlerStateWidgets(title,"cyoa-widget-tracks",function(ptn) {
		var widget = new CyoaWidget(ptn,options);
		widget.computeAttributes();
		var tiddler = wiki.getTiddler(title);
		return logic.getWidgetTracks(tiddler,widget,options);
	});
};

/*
This one appends instead of returns so we don't have to bother merging the lists later.
*/
function getFieldTracks(tiddler,wiki,list,options) {
	var widget = new CyoaWidget(parseTreeForTiddler(tiddler),options);
	widget.computeAttributes();
	pushListItems(list,logic.getWidgetTracks(tiddler,widget,options));
}

function parseTreeForTiddler(tiddler) {
	var attributes = {};
	for (var field in tiddler.fields) {
		if (field.indexOf("cyoa.") == 0) {
			var name = field.substr(5);
			attributes[name] = {name: name, type: "string", value: tiddler.fields[field]};
		}
	}
	return {type: 'cyoa', attributes: attributes};
};
