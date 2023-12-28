/*\
description: string (e.g. tiddlerTitle or optionB)
\*/

'use strict';

exports.name = 'string';

exports.serialize = function(value,data) {
	return value === null? '': data.keys[value];
};

exports.deserialize = function(value,data) {
	var index = data.keys.indexOf(value);
	return index < 0? null: index;
};
