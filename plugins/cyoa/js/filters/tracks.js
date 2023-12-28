/*\
title: $:/plugins/mythos/cyoa/js/filters/tracks.js
type: application/javascript
module-type: filteroperator

Filter operator for returning all the tiddlers the given tiddler tracks in cyoa. That means uses of macros $first, $before, and $after.

\*/
(function(){

"use strict";

/*
Export our filter function
*/
exports.tracks = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		$tw.utils.pushTop(results,options.wiki.getTiddlerTracks(title));
	});
	return results;
};

})();
