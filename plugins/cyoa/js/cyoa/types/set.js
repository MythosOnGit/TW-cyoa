/*\

An object for storing a set of pages.

\*/

'use strict';

var utils = require('../utils');

exports.name = 'set';

exports.is = function(item) {
	return this.set[item] || false;
};

exports.get = function(item) {
	return this.is(item);
};

function Flag(set,index) {
	this.set = set;
	this.index = index;
};

Object.defineProperty(Flag.prototype,'val',{
	get: function() { return this.set.is(this.index); },
	set: function(value) { return (value ? this.set.touch(this.index): this.set.reset(this.index)); }
});

exports.x = function(index) {
	return new Flag(this,index);
};

exports.touch = function(index) {
	utils.addToTree(this.set,index,this.data.up,this.data.down,this.data.exMap);
};

exports.reset = function(index) {
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
