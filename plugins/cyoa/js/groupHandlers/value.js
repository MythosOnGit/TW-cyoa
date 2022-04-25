/*\
title: $:/plugins/mythos/cyoa/js/groupHandlers/value.js
type: application/javascript
module-type: cyoagrouphandler

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Handler = require("$:/plugins/mythos/cyoa/js/groupHandlers/handler.js");

function ValueHandler() {
	Handler.apply(this,arguments);
};

ValueHandler.prototype = Object.create(Handler.prototype);


ValueHandler.prototype.groupData = function() {
	return this.convertToIds(this.getImplicationTree());
};

ValueHandler.prototype.touch = function(title) {
	return this.variable + ".set(" + this.strIdFor(title) + ")";
};

ValueHandler.prototype.reset = function(title) {
	return this.variable + ".unset(" + this.strIdFor(title) + ")";
};

ValueHandler.prototype.resetAll = function(title) {
	return this.variable + ".clear()";
};

ValueHandler.prototype.after = function(title) {
	return this.variable + ".is(" + this.strIdFor(title) + ")";
};

ValueHandler.prototype.afterAll = function(title) {
	return this.variable + ".any()";
};

exports.value = ValueHandler;
