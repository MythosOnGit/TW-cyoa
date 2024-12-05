/*\
title: $:/plugins/mythos/cyoa/js/filters/links.js
type: application/javascript
module-type: cyoa.filteroperator

Filter operator for returning the cyoa links the input tiddlers have to other tiddlers.

This dominantly appends items.
\*/

"use strict";

/*
Export our filter function
*/
exports.links = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		if(tiddler) {
			var links = options.wiki.getTiddlerStateLinks(title);
			$tw.utils.pushTop(results,links);
		}
	});
	return results;
};
