/*\
title: $:/plugins/mythos/cyoa/js/filters/depends.js
type: application/javascript
module-type: cyoa.filteroperator

Filter operator for returning the tiddlers the given tiddler depends on in cyoa. This processes all possible custom append modules too.

This dominantly appends items.
\*/
(function(){

"use strict";

var snippetManager = require("$:/plugins/mythos/cyoa/js/logic");
var utils = require("$:/plugins/mythos/cyoa/js/utils");

/*
Export our filter function
*/
exports.depends = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		if(tiddler) {
			var widget = utils.createDummyWidget(title,options);
			var appends = snippetManager.getPageDependList(tiddler,widget,options);
			$tw.utils.pushTop(results,appends);
		}
	});
	return results;
};

})();
