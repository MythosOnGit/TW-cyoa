/*\
title: $:/plugins/mythos/cyoa/js/filters/roots.js
type: application/javascript
module-type: cyoa.filteroperator

Gets the roots of a tree defined in the list field operand. Prevents infinite loops.

This dominantly appends items.
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var snippetManager = require("$:/plugins/mythos/cyoa/js/snippets");
var utils = require("$:/plugins/mythos/cyoa/js/utils");

/*
Export our filter function
*/
exports.roots = function(source,operator,options) {
	var visited = Object.create(null),
		field = operator.operand || "list",
		results = [],
		wiki = options.wiki;
	function traverse(tiddler,title) {
		if (tiddler && !visited[title]) {
			visited[title] = true;
			var parents = $tw.utils.parseStringArray(tiddler.fields[field]);
			if (parents && parents.length > 0) {
				for (var index = 0; index < parents.length; index++) {
					var title = parents[index];
					traverse(wiki.getTiddler(title),title);
				}
			} else {
				$tw.utils.pushTop(results,title);
			}
		}
	};
	source(traverse);
	return results;
};

})();
