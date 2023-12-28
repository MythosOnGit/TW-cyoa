/*\
description: string (e.g. tiddlerA.5.tiddlerB.34)
\*/

'use strict';

var utils = require('../../utils');

var delimiter = '.';

exports.name = 'string';

exports.serialize = function(set, setData) {
	var output = [];
	for(var index in set) {
		if(typeof set[index] == 'number') {
			var key = setData.keys[index];
			if(key !== undefined) {
				output.push(key,set[index]);
			}
		}
	}
	return utils.stringifyList(output,delimiter);
};

exports.deserialize = function(string, setData) {
	var list = utils.parseStringList(string,'.'),
		output = Object.create(null),
		index, i;
	for(i = 0; i < list.length; i++) {
		var value = list[i];
		if(index === undefined) {
			index = setData.keys.indexOf(value);
		} else {
			if(index >= 0) {
				output[index] = parseFloat(value);
			}
			index = undefined;
		}
	}
	return output;
};
