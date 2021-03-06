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
	var pageMap = this.getPageMap();
	for(var title in pageMap) {
		ids.push(this.pageMap[title].id);
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
