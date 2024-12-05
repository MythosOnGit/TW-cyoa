/*\

An object for storing a set of pages.

\*/

'use strict';

var utils = require('../utils');

exports.name = 'set';

exports.is = function(item) {
	return this.set[item] || false;
};

exports.value = exports.is

exports.assign = function(index,trueOrFalse) {
	return trueOrFalse ? this.touch(index) : this.reset(index);
};

exports.touch = function(index) {
	utils.addToTree(this.set,index,this.data.up,this.data.down,this.data.exMap);
	return true;
};

exports.unassign = function(index) {
	utils.removeFromTree(this.set,index,this.data.down);
};

exports.clear = function() {
	this.set = Object.create(null);
};

exports.any = function() {
	for(var index in this.values) {
		if(this.values[index] === true) {
			return true;
		}
	}
	return false;
};
