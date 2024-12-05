/*\
description: string (e.g. tiddlerA.tiddlerB)
\*/

'use strict';

var utils = require('../../utils');

var delimiter = '.';

exports.name = 'string';

exports.serialize = function(set,data) {
	var array = [];
	for(var index in set) {
		// Find all the actives nodes that don't have any active children
		if(set[index]) {
			var children = data.down[index];
			if(children && children.some(child => set[child])) {
				continue;
			}
			array.push(index);
		}
	}
	// Translate it to the proper form
	if(data.keys) {
		array = array.map(x => data.keys[x]);
	}
	return utils.stringifyList(array,delimiter);
};

exports.deserialize = function(string,data) {
	var set = Object.create(null);
	var list = utils.parseStringList(string,delimiter);
	if(data.keys) {
		// We need to change these keys into indices
		if(!data.indexFor) {
			// But first we should make a reverse lookup table.
			data.indexFor = Object.create(null);
			for(var index = 0; index < data.keys.length; index++) {
				data.indexFor[data.keys[index]] = index;
			}
		}
		for(var index = 0; index < list.length; index++) {
			list[index] = data.indexFor[list[index]];
		}
	}
	for (var index = 0; index < list.length; index++) {
		if (list[index] !== undefined) {
			utils.addToTree(set,list[index],data.up,data.down,data.exMap);
		}
	}
	return set;
};
