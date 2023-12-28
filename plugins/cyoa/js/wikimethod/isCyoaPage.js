/*\
title: $:/plugins/mythos/cyoa/js/wikimethod/isCyoaPage.js
type: application/javascript
module-type: wikimethod

Given a title, will return true or false if that title is a cyoa page.

\*/
(function(){

"use strict";

var utils = require("$:/plugins/mythos/cyoa/js/utils");

var filterPage = "$:/config/mythos/cyoa/page-filter";

exports.isCyoaPage = function(title) {
	return this.getCyoaPageMap()[title] || false;
};

var fetchStack = 0;

/*
Returns a map of all cyoa pages. Keys are the pages, the values are all true.
*/
exports.getCyoaPageMap = function() {
	var wiki = this;
	return this.getGlobalCache("cyoa-pages",function() {
		var rtn;
		if(fetchStack++) {
			// This is being called recursively. Bail.
			return null;
		}
		try {
			var filter = getFilter(wiki);
			var list = filter(eachSource(wiki));
			list = list.filter((x) => {
				var t = wiki.getTiddler(x);
				return t && !t.isDraft() && !t.hasTag("$:/tags/cyoa/Type");
			});
			rtn = utils.toHashMap(list);
		} finally {
			if(--fetchStack) {
				// Stack went up and didn't come down, so turn it down now and return null.
				fetchStack--;
				rtn = null;
			}
		}
		return rtn;
	});
};

function eachSource(wiki) {
	return function(fn) {
		wiki.each(function(tiddler,title) {
			if(!wiki.isSystemTiddler(title)) {
				var tags = tiddler.fields.tags;
				if(tags === undefined
				|| (tags.indexOf("$:/tags/cyoa/Stylesheet") < 0
				 && tags.indexOf("$:/tags/cyoa/Javascript") < 0)) {
					fn(tiddler,title);
				}
			}
		});
	};
};

function getFilter(wiki) {
	return wiki.getCacheForTiddler(filterPage,"cyoa-filter",function() {
		var config = wiki.getTiddler(filterPage);
		var text = (config && config.getFieldString("text")) || "[all[]]";
		return wiki.compileFilter(text);
	});
};

})();
