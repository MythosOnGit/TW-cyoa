/*\

An object for storing a single value state variable.

\*/

'use strict';

exports.name = 'value';
exports.hidden = true;

exports.is = function(item) {
	return check(this.data.up,this.set,item);
};

exports.value = exports.is;

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

exports.assign = function(index,value) {
	return value ? this.set.touch(this.index): this.set.reset(this.index);
};

exports.touch = function(item) {
	this.set = item;
};

exports.unassign = function(item) {
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
