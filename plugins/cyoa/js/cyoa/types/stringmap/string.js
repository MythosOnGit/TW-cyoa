/*\
description: string (e.g. tiddlerA.value.tiddlerB.value)
\*/

'use strict';

var utils = require('../../utils');

var delimiter = '.';

exports.name = 'string';

exports.serialize = function(map, setData) {
	var array = [];
	for(var index in map) {
		if(parseInt(index) >= 0) {
			var key = setData.keys[index];
			if(key !== undefined && map[index] !== undefined && map[index] !== null) {
				array.push(key,map[index]);
			}
		}
	}
	return utils.stringifyList(array,delimiter);
};

exports.deserialize = function(string, setData) {
	var list = utils.parseStringList(string,'.'),
		map = Object.create(null),
		index;
	if(!setData.indexFor) {
		setData.indexFor = Object.create(null);
		for(var index = 0; index < setData.keys.length; index++) {
			setData.indexFor[setData.keys[index]] = index;
		}
	}
	for(var i = 0; i < list.length; i++) {
		var value = list[i];
		if(index === undefined) {
			index = setData.indexFor[value];
		} else {
			map[index] = value;
			index = undefined;
		}
	}
	return map;
};
