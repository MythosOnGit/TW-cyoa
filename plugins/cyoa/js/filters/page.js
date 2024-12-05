/*\
title: $:/plugins/mythos/cyoa/js/filters/page.js
type: application/javascript
module-type: cyoa.filteroperator

Filters tiddlers based on whether they'll be included in the compiled cyoa.

[!cyoa:page[]] returns everything that won't be included in the cyoa compile.

\*/
(function(){

"use strict";

var utils = require("$:/plugins/mythos/cyoa/js/utils");

exports["page"] = function(source,operator,options) {
	options = options || {};
	var pagesMap = options.wiki.getCyoaPageMap();
	if(pagesMap === null) {
		var w = options.widget;
		var msg = "Filter Error: cyoa:page filter operator cannot be used in the cyoa Page Filter";
		if(w && w.getVariable("cyoa-render") === "yes") {
			throw new TypeError(msg);
		}
		return [msg];
	}
	var results = [];
	if(operator.prefix === "!") {
		source(function(tiddler,title) {
			if(!pagesMap[title]) {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(pagesMap[title]) {
				results.push(title);
			}
		});
	}
	return results;
};

})();
