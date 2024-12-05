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
		var disqualifiers = getDisqualifyingTagMap(wiki);
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
				if(t && !t.isDraft()) {
					var tags = t.getFieldList('tags');
					for(var index = 0; index < tags.length; index++) {
						if(disqualifiers[tags[index]]) {
							return false;
						}
					}
					return true;
				}
				return false;
			});
			rtn = utils.toHashMap(list);
			// The start page is always an included page
			var startPage = wiki.getTiddlerText("$:/config/mythos/cyoa/start");
			if(startPage) {
				rtn[startPage] = true;
			}
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
		var text = (config && config.getFieldString("text")) || "[!tag[Virtual Page]]";
		return wiki.compileFilter(text);
	});
};

function getDisqualifyingTagMap(wiki) {
	var map = Object.create(null);
	// All layout tags are disqualifying, because those pages show up elsewhere in the DOM.
	var layoutTags = wiki.getTiddlersWithTag('$:/tags/cyoa/Layout');
	for(var index = 0; index < layoutTags.length; index++) {
		map[layoutTags[index]] = true;
		
	}
	// Types are disqualified too, because they render with other info that shouldn't be in the final file.
	map["$:/tags/cyoa/Type"] = true;
	return map;
}

})();
