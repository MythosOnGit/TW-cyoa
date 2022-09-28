/*\
title: $:/plugins/mythos/cyoa/js/groupHandlers/intmap.js
type: application/javascript
module-type: cyoagrouphandler

Handles a map of integers which increment when touched.

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Handler = require("$:/plugins/mythos/cyoa/js/groupHandlers/handler.js");

function IntMapHandler() {
	Handler.apply(this,arguments);
};

var Ip = IntMapHandler.prototype = Object.create(Handler.prototype);

Ip.groupData = function() {
	var ids = [];
	for(var index = 0; index < this.entries.length; index++) {
		ids.push(this.idForIndex(index));
	}
	return ids;
};

Ip.touch = function(title) {
	return this.strIndexerFor(title) + "+=1";
};

Ip.reset = function(title) {
	return this.strIndexerFor(title) + "=0";
};

Ip.after = function(title) {
	return this.strIndexerFor(title);
};

exports.intmap = IntMapHandler;
