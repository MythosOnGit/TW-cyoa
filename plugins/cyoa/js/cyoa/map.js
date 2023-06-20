/*\
cyoa.module-type: state

An object for storing a set of pages.

\*/

"use strict";

var utils = require("./utils");

function Map(mapString,setData) {
	var key = undefined,
		list = utils.parseStringList(mapString,".");
	for(var index = 0; index < list.length; index++) {
		var value = list[index];
		if(key === undefined) {
			key = value;
		} else {
			this[key] = value;
			key = undefined;
		}
	}
};

Map.prototype = Object.create(null);

function define(name,value) {
	Object.defineProperty(Map.prototype,name,{
		enumerable: false,
		writable: true,
		value: value});
};

define("toString",function() {
	var array = [];
	for(var key in this) {
		if(this[key] !== undefined) {
			array.push(key);
			array.push(this[key]);
		}
	}
	return utils.stringifyList(array,".");
});

exports.map = Map;
