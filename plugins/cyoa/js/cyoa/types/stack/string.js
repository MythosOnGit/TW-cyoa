/*\
description: string (e.g. tiddlerA.tiddlerB)
\*/

'use strict';

var utils = require('../../utils');

var delimiter = '.';

exports.name = 'string';

exports.serialize = function(stack,setData) {
	if(setData && setData.keys) {
		stack = stack.map(index => setData.keys[index]);
	}
	return utils.stringifyList(stack,'.');
};

exports.deserialize = function(string, setData) {
	var stack = utils.parseStringList(string,'.');
	if(setData && setData.keys) {
		stack = stack.map(key => setData.keys.indexOf(key));
	}
	return stack;
};
