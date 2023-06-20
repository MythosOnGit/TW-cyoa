/*\
title: $:/plugins/mythos/cyoa/js/groupHandlers/value.js
type: application/javascript
module-type: cyoagrouphandler

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "value";

exports.groupData = function() {
	return this.generateUpTree();
};

exports.touch = function(title) {
	return this.variable + ".set(" + this.strIdFor(title) + ")";
};

exports.reset = function(title) {
	return this.variable + ".unset(" + this.strIdFor(title) + ")";
};

exports.resetAll = function(title) {
	return this.variable + ".clear()";
};

exports.after = function(title) {
	return this.variable + ".is(" + this.strIdFor(title) + ")";
};

exports.afterAll = function(title) {
	return this.variable + ".any()";
};
