/*\
title: $:/plugins/mythos/cyoa/js/groupHandlers/set.js
type: application/javascript
module-type: cyoagrouphandler

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Handler = require("$:/plugins/mythos/cyoa/js/groupHandlers/handler.js");

function SetHandler() {
	Handler.apply(this,arguments);
};

var Sp = SetHandler.prototype = Object.create(Handler.prototype);

Sp.groupData = function() {
	var data = {
		exList: this.generateExclusionList(),
		up: this.generateUpTree()
	};
	this.style.exportData(data);
	return data;
};

Sp.touch = function(title) {
	return this.variable + ".add(" + this.strIdFor(title) + ")";
};

Sp.reset = function(title) {
	return this.variable + ".remove(" + this.strIdFor(title) + ")";
};

Sp.resetAll = function() {
	return this.variable + ".clear()";
};

Sp.after = function(title) {
	return this.variable + ".has(" + this.strIdFor(title) + ")";
};

Sp.do = function(title) {
	return this.variable + ".flag(" + this.strIdFor(title) + ").val";
};

exports.set = SetHandler;
