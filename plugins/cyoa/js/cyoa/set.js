/*\
cyoa.module-type: state

An object for storing a set of pages.

\*/

"use strict";

var utils = require("./utils");
var Bitfield = require("./bitfield").bitfield;

exports.set = function(setString,setData,delimiter) {
	if(setData) {
		if(setData.down === undefined) {
			setData.down = utils.generateDownTree(setData.up);
			// presumably this hasn't been made either
			setData.exMap = utils.generateExclusiveMap(setData.exList);
		}
		this.data = setData;
	}
	if(delimiter) {
		this.delimiter = delimiter;
	}
	var set = Object.create(null);
	var list = utils.parseStringList(setString,this.delimiter);
	for (var index = 0; index < list.length; index++) {
		set[list[index]] = true;
	}
	this.set = set;
}

var Sp = exports.set.prototype;

exports.set.factory = function(setString,setData) {
	// only bitfields have bridges
	var type = (setData && setData.bridges) ? Bitfield : exports.set;
	return new type(setString,setData);
};

Sp.delimiter = ".";

Sp.data = {
	up: Object.create(null),
	down: Object.create(null),
	exMap: Object.create(null)};

Sp.toString = function(delimiter) {
	return utils.stringifyList(Object.keys(this.set),delimiter || this.delimiter);
};

Sp.has = function(item) {
	if(this.set[item]) {
		return true;
	}
	var children = this.data.down[item];
	if(children) {
		for(var index = 0; index < children.length; index++) {
			if(this.has(children[index])) {
				return true;
			}
		}
	}
	return false;
};

function Flag(set,index) {
	this.set = set;
	this.index = index;
};

Object.defineProperty(Flag.prototype,"val",{
	get: function() { return this.set.has(this.index); },
	set: function(value) { return (value ? this.set.add(this.index): this.set.remove(this.index)); }
});

Sp.flag = function(index) {
	return new Flag(this,index);
};

Sp.add = function() {
	var upTree = this.data.up;
	for(var index = 0; index < arguments.length; index++) {
		var item = arguments[index];
		if(!this.has(item)) {
			this.set[item] = true;
			purgeOtherExclusives(this,item);
			purgeUptreeItems(this,item);
		}
	}
};

function purgeUptreeItems(set,item) {
	var parents = set.data.up[item];
	if(parents) {
		for(var index = 0; index < parents.length; index++) {
			var item = parents[index];
			if(set.set[item]) {
				delete set.set[item];
				// If this set is properly maintained, we shouldn't have to traverse higher.
			} else {
				// because technically it's being added too
				purgeOtherExclusives(set,item);
				purgeUptreeItems(set,item);
			}
		}
	}
};

Sp.remove = function() {
	for(var index=0; index<arguments.length; index++) {
		var item = arguments[index];
		var children = this.data.down[item];
		if(children) {
			Sp.remove.apply(this,children);
		}
		if(this.set[item]) {
			delete this.set[item];
			var up = this.data.up[item];
			if(up) {
				for(var upIndex = 0; upIndex < up.length; upIndex++) {
					if(!this.has(up[upIndex])) {
						this.set[up[upIndex]] = true;
					}
				}
			}
		}
	}
};

Sp.clear = function() {
	this.set = Object.create(null);
};

function purgeOtherExclusives(set,item) {
	var excludes = set.data.exMap[item];
	if(excludes) {
		Sp.remove.apply(set,excludes.filter((a) => a !== item));
	}
};
