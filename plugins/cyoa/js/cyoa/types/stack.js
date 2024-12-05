/*\

An object for storing a stack of pages, where only the top one is 'touched'

\*/

'use strict';

var utils = require('../utils');

exports.name = 'stack';

exports.hidden = 'true';

exports.push = function(value) {
	this.set.push(value);
};

exports.pop = function(value) {
	if(value === undefined || (this.top() === value)) {
		return this.set.pop();
	}
};

exports.unassign = exports.pop;

exports.top = function() {
	return this.set[this.set.length-1];
};

exports.is = function(index) {
	return this.top() === index;
};

exports.value = exports.is;

exports.touch = function(index) {
	this.push(index);
};

exports.clear = function() {
	this.set.length = 0;
};

exports.any = function() {
	return this.set.length > 0;
};
