/*\
description: indices (e.g. 1.value.15.value)
\*/

'use strict';

var utils = require('../../utils');

var delimiter = '.';

exports.name = 'index10';

exports.serialize = function(map, setData) {
	var array = [];
	for(var index in map) {
		if(parseInt(index) >= 0
		&& map[index] !== undefined
		&& map[index] !== null) {
			array.push(index,map[index]);
		}
	}
	return utils.stringifyList(array,delimiter);
};

exports.deserialize = function(string, setData) {
	var list = utils.parseStringList(string,'.'),
		map = Object.create(null),
		index;
	for(var i = 0; i < list.length; i++) {
		var value = list[i];
		if(index === undefined) {
			index = parseInt(value);
		} else {
			if(index >= 0) {
				map[index] = value;
			}
			index = undefined;
		}
	}
	return map;
};
