/*\

Handles a map of integers which increment when touched.

\*/

'use strict';

var utils = require('../utils');

exports.name = 'numbermap';

exports.touch = function(index) {
	this.set[index] = (this.set[index] || 0)+1;
	this.beExclusiveFor(index);
};

function Value(set,index) {
	this.numbers = set;
	this.index = index;
};

Object.defineProperty(Value.prototype,'val',{
	get: function() { return this.numbers.set[this.index] || 0;},
	set: function(value) { this.numbers.assign(this.index,value);}
});

// A short-named method for getting a getter/setter for a specific index
exports.x = function(index) {
	return new Value(this,index);
};

exports.is = function(index) {
	var value = this.set[index];
	return value != undefined && value != null;
};

exports.get = function(index) {
	return this.set[index] || 0;
};

exports.assign = function(index,number) {
	this.set[index] = number;
	// If index is set to any number, we need to flip off exclusives.
	if(number !== undefined && number !== null) {
		this.beExclusiveFor(index);
	}
};

exports.reset = function(index) {
	this.assign(index,undefined);
};

exports.clear = function() {
	this.value = Object.create(null);
};

exports.any = function() {
	for(var index in this.set) {
		if(this.set[index] !== undefined) {
			return true;
		}
	}
	return false;
};

exports.beExclusiveFor = function(index) {
	var exclusives = this.data.exMap[index];
	if(exclusives) {
		for(var i = 0; i < exclusives.length; i++) {
			if (exclusives[i] !== index) {
				this.set[exclusives[i]] = undefined;
			}
		}
	}
};
