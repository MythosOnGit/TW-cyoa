/*\
title: $:/plugins/mythos/cyoa/js/wikimethod/getTiddlerStateLinks.js
type: application/javascript
module-type: wikimethod

GetTidderStateLinks method. Fetches all tiddlers specified as the link in
cyoa widgets.

This is very repetitive compared to getTiddlerTracks and getTiddlerLinks.

\*/
(function(){

"use strict";

var utils = require("../utils");

/*
Return an array of tiddler titles that are specified in cyoa widgets
*/
exports.getTiddlerStateLinks = function(title) {
	var self = this;
	var cyoas = this.traverseTiddlerStateWidgets(title,"cyoa.links",function(ptn) {
		if(ptn.attributes.to && ptn.attributes.to.type === "string") {
			return [ptn.attributes.to.value];
		}
	});
	var optionCache = this.getGlobalCache("options_widgets",function() {
		return Object.create(null);
	});
	if(!$tw.utils.hop(optionCache,title)) {
		var options = getOptionsWidgets(this,title);
		var results = [];
		for(var index = 0; index < options.length; index++) {
			var filter = options[index].attributes.filter;
			if(filter) {
				if(filter.type === "string") {
					var widget = utils.createDummyWidget(title);
					$tw.utils.pushTop(results,self.filterTiddlers(filter.value,widget));
				}
			} else {
				var givenTitle = options[index].attributes.tiddler;
				if(!givenTitle || givenTitle.type !== "string") {
					givenTitle = title;
				} else {
					givenTitle = givenTitle.value;
				}
				var titles = utils.getOptionsList(givenTitle,self);
				$tw.utils.pushTop(results,titles);
			}
		}
		optionCache[title] = results;
	}
	var rtn = cyoas.slice();
	return $tw.utils.pushTop(rtn,optionCache[title]);
};

function getOptionsWidgets(wiki,title) {
	return wiki.traverseTiddlerWidgets(title,"options_widgets",function(ptn) {
		if(ptn.type === "options") {
			return [ptn];
		}
	});
};

})();
