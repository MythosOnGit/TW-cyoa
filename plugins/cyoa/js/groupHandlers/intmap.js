/*\
title: $:/plugins/mythos/cyoa/js/groupHandlers/intmap.js
type: application/javascript
module-type: cyoagrouphandler

Handles a map of integers which increment when touched.

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "intmap";

exports.groupData = function() {
	var ids = [];
	for(var index = 0; index < this.entries.length; index++) {
		ids.push(this.idForIndex(index));
	}
	return ids;
};

exports.touch = function(title) {
	return this.strIndexerFor(title) + "+=1";
};

exports.reset = function(title) {
	return this.strIndexerFor(title) + "=0";
};

exports.after = function(title) {
	return this.strIndexerFor(title);
};
