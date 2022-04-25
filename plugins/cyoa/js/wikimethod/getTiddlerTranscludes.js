/*\
title: $:/plugins/mythos/cyoa/js/wikimethod/getTiddlerTranscludes.js
type: application/javascript
module-type: wikimethod

GetTidderTranscludes method. Fetches all transcludes within a given tiddler.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Return an array of tiddler titles that are directly transcluded in the specified tiddler
*/
exports.getTiddlerTranscludes = function(title) {
	return this.traverseTiddlerWidgets(title,"transcludes",function(ptn) {
		if(ptn.type === "transclude" &&
			ptn.attributes.tiddler &&
			ptn.attributes.tiddler.type === "string") {
				return [ptn.attributes.tiddler.value];
		}
	});
};

})();
