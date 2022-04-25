/*\
cyoa.module-type: state

An object for storing a set of pages.

\*/

var utils = require("./utils");

function IntMap(mapString,setData) {
	var key = undefined,
		list = utils.parseStringList(mapString,".");
	if(setData) {
		for(var index = 0; index < setData.length; index++) {
			this[setData[index]] = 0;
		}
	}
	for(var index = 0; index < list.length; index++) {
		var value = list[index];
		if(key === undefined) {
			key = value;
		} else {
			this[key] = parseInt(value);
			key = undefined;
		}
	}
};

IntMap.prototype = Object.create(null);

Object.defineProperty(IntMap.prototype,"toString",{
	enumerable: false,
	writable: true,
	value: function() {
		var array = [];
		for(var key in this) {
			if(this[key]) {
				array.push(key,this[key]);
			}
		}
		return utils.stringifyList(array,".");
}});

exports.intmap = IntMap;
