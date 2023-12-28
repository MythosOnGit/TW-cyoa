/*\

An object for storing a set of pages.

\*/

'use strict';

var utils = require('../utils');

exports.name = 'stringmap';

exports.touch = function(index) {
	this.assign(index,this.set[index] || '');
};

function Value(set,index) {
	this.set = set;
	this.index = index;
};

Object.defineProperty(Value.prototype,'val',{
	get: function() { return this.set.set[this.index] || '';},
	set: function(value) { this.set.assign(this.index,value);}
});

// A short-named method for getting a getter/setter for a specific index
exports.x = function(index) {
	return new Value(this,index);
};

exports.is = function(index) {
	var explicit = this.set[index];
	if(explicit !== undefined && explicit !== null) {
		return true;
	}
	var children = this.data.down[index];
	if(children) {
		for(var i = 0; i < children.length; i++) {
			if(this.is(children[i])) {
				return true;
			}
		}
	}
	return false;
};

exports.get = function(index) {
	return this.set[index] || '';
};

exports.assign = function(index,string) {
	this.set[index] = string;
	// We now need to find what exclusives to shut off. We can cheat and use util methods to crawl a temporary tree.
	var setPlan = Object.create(null);
	utils.addToTree(setPlan,index,this.data.up,this.data.down,this.data.exMap);
	for(var node in setPlan) {
		if (setPlan[node] === false) {
			this.set[node] = null;
		}
	}
};

exports.reset = function(index) {
	var setPlan = Object.create(null);
	utils.removeFromTree(setPlan,index,this.data.down);
	for(var node in setPlan) {
		if (setPlan[node] === false) {
			this.set[node] = null;
		}
	}
};

exports.clear = function() {
	this.set = Object.create(null);
};

exports.any = function() {
	for(var index in this.set) {
		if(this.set[index] !== undefined && this.set[index] !== null) {
			return true;
		}
	}
	return false;
};
