/*\
description: indices (e.g. 1,5,15)
\*/

'use strict';

var utils = require('../../utils');

var delimiter = '.';

exports.name = 'index10';

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
	return utils.stringifyList(array,delimiter);
};

exports.deserialize = function(string,data) {
	var set = Object.create(null);
	var list = utils.parseStringList(string,delimiter);
	var maxLength = data.tracked.length;
	for (var index = 0; index < list.length; index++) {
		var value = parseFloat(list[index]);
		// Add it, only if it's in range
		if(value < maxLength) {
			utils.addToTree(set,value,data.up,data.down,data.exMap);
		}
	}
	return set;
};
