/*\
title: $:/plugins/mythos/cyoa/js/groupHandlers/stack.js
type: application/javascript
module-type: cyoagrouphandler

This group handler utilizes a stack method of tracking pages

For now, the way to pop the stack is to reset the page on the top.
Not sure if this is a good system or not. Maybe resetting any should
pop the stack?
\*/

"use strict";

exports.name = "stack";

exports.touch = function(title) {
	return this.variable + ".push(" + this.strIdFor(title) + ")";
};

exports.reset = function(title) {
	return this.variable + ".pop(" + this.strIdFor(title) + ")";
};

exports.after = function(title) {
	return this.variable + ".top()===" + this.strIdFor(title);
};

exports.before = function(title) {
	return this.variable + ".top()!==" + this.strIdFor(title);
};

exports.resetAll = function(title) {
	return this.variable + ".clear()";
};
