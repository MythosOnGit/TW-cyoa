/*\

An object for storing a single value state variable.

\*/

'use strict';

exports.name = 'value';
exports.hidden = true;

exports.is = function(item) {
	return check(this.data.up,this.set,item);
};

exports.get = function(item) {
	return this.is(item);
};

function check(tree,value,item) {
	if(value === item) {
		return true;
	}
	var parents = tree[value];
	if(parents) {
		for(var index = 0; index < parents.length; index++) {
			if(check(tree,parents[index],item)) {
				return true;
			}
		}
	}
	return false;
};

exports.touch = function(item) {
	this.set = item;
};

exports.reset = function(item) {
	if(this.set === item) {
		this.set = null;
	}
};

exports.clear = function() {
	this.set = null;
};

exports.any = function() {
	return this.set !== null;
};
