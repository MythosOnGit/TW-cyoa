/*\
title: $:/plugins/mythos/cyoa/js/groupHandlers/map.js
type: application/javascript
module-type: cyoagrouphandler

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "map";

exports.touch = function(title) {
	return this.strIndexerFor(title) + "=(" + this.strIndexerFor(title) + "||0)+1";
};

exports.reset = function(title) {
	return this.strIndexerFor(title) + "=undefined";
};

exports.after = function(title) {
	return this.strIndexerFor(title);
};
