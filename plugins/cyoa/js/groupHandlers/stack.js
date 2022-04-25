/*\
title: $:/plugins/mythos/cyoa/js/groupHandlers/stack.js
type: application/javascript
module-type: cyoagrouphandler

This group handler utilizes a stack method of tracking pages

For now, the way to pop the stack is to reset the page on the top.
Not sure if this is a good system or not. Maybe resetting any should
pop the stack?
\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Handler = require("$:/plugins/mythos/cyoa/js/groupHandlers/handler.js");

function StackHandler() {
	Handler.apply(this,arguments);
};

StackHandler.prototype = Object.create(Handler.prototype);

StackHandler.prototype.touch = function(title) {
	return this.variable + ".push(" + this.strIdFor(title) + ")";
};

StackHandler.prototype.reset = function(title) {
	return this.variable + ".pop(" + this.strIdFor(title) + ")";
};

StackHandler.prototype.after = function(title) {
	return this.variable + ".top()===" + this.strIdFor(title);
};

StackHandler.prototype.before = function(title) {
	return this.variable + ".top()!==" + this.strIdFor(title);
};

StackHandler.prototype.resetAll = function(title) {
	return this.variable + ".clear()";
};

exports.stack = StackHandler;
