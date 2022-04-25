/*\
title: $:/plugins/mythos/cyoa/js/groupHandlers/map.js
type: application/javascript
module-type: cyoagrouphandler

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Handler = require("$:/plugins/mythos/cyoa/js/groupHandlers/handler.js");

function MapHandler() {
	Handler.apply(this,arguments);
};

MapHandler.prototype = Object.create(Handler.prototype);

MapHandler.prototype.touch = function(title) {
	return this.strIndexerFor(title) + "=(" + this.strIndexerFor(title) + "||0)+1";
};

MapHandler.prototype.reset = function(title) {
	return this.strIndexerFor(title) + "=undefined";
};

MapHandler.prototype.after = function(title) {
	return this.strIndexerFor(title);
};

exports.map = MapHandler
