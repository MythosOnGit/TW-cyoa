/*\
title: $:/plugins/mythos/cyoa/js/filters/appends.js
type: application/javascript
module-type: cyoa.filteroperator

Filter operator for returning the tiddlers the given tiddler appends in cyoa. This processes all possible custom append modules too.

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
exports.appends = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		if(tiddler) {
			var widget = utils.createDummyWidget(title,options);
			widget.page = true;
			var appends = snippetManager.getPageAppendList(tiddler,widget,options);
			$tw.utils.pushTop(results,appends);
		}
	});
	return results;
};

})();
