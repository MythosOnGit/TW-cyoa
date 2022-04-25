var utils = require("./utils");

function State() {
	this.registry = {};
};

module.exports = State;

/*
Options include:
default: This is a default value for when the uri query doesn't specify a value.
data: This will be made available to the object when it's created.
*/
State.prototype.declare = function(destination,name,type,options) {
	options = options || {};
	type = type || String;
	switch (type.name) {
		// This is compensating for what I THINK is a NodeJS bug.
		case "Number": type = Number; break;
		case "Boolean": type = Boolean; break;
		case "Array": type = Array; break;
		case "String": type = String; break;
	}
	var def = (undefined !== options.default)?
		options.default:
		defaults(type);
	def = valueToString(def,type);
	this.registry[name] = {
		"dest": destination,
		"type": type,
		"def": def,
		"data": options.data};
}

/*
Deals with unique case where we want to alter a state string without instantiating anything else. This is used for opening menus on a new page without giving the existing state a chance to change.
*/
State.prototype.amend = function(stateString,statePairs) {
	var pack = parseStateString(stateString);
	pack = Object.assign(pack,statePairs);
	return  stringifyStateHash(pack);
};

State.prototype.deserialize = function(stateString) {
	var pack = parseStateString(stateString);
	this.unpack(pack);
}

State.prototype.unpack = function(stateTree) {
	for(var name in this.registry) {
		var obj = this.registry[name];
		var value = stateTree[name];
		if(undefined === value) {
			value = obj.def;
		}
		obj.dest[name] = fromString(value,obj.type,obj.data);
	}
}

State.prototype.serialize = function () {
	var pack = this.pack();
	return stringifyStateHash(pack);
}

State.prototype.pack = function() {
	var newState = {}
	for(var name in this.registry) {
		var obj = this.registry[name];
		var value = obj.dest[name];
		if(undefined !== value) {
			value = valueToString(value,obj.type);
			if(value !== obj.def) {
				newState[name] = value.toString();
			}
		}
	}
	return newState;
}

function parseStateString(stateString) {
	var array = stateString? stateString.split("&"): [];
	var pack = {};
	for(var index = 0; index < array.length; index++) {
		var pair = array[index];
		var equals = pair.indexOf("=");
		var key = utils.decodePage(pair.substring(0,equals));
		var val = utils.decodePage(pair.substring(equals+1));
		pack[key] = val;
	}
	return pack;
};

function stringifyStateHash(stateHash) {
	var array = [];
	for(var key in stateHash) {
		var encodedKey = utils.encodePage(key);
		var encodedVal = utils.encodePage(stateHash[key]);
		array.push(encodedKey+"="+encodedVal);
	}
	return array.join("&");
};

function valueToString(value,type) {
	if(Array.isArray(value)) {
		return utils.stringifyList(value,".");
	}
	if(Boolean === type) {
		var bool = parseBoolean(value);
		return bool ? "yes": "no";
	}
	return value.toString();
};

var defaults = function(type) {
	switch (type) {
		case Boolean: return false;
		case Number: return "0";
		case Array: return [];
		default: return "";
	}
}

function parseBoolean(bool) {
	if(typeof bool === "string") {
		var low = bool.toLowerCase();
		return low.length>0 && (low!="false") && (low!="0") && (low!="no");
	}
	return !!bool
};

var fromString = function(string,type,groupData) {
	switch (type) {
		case String:
			return string || "";
		case Boolean:
			return parseBoolean(string);
		case Number:
			return parseFloat(string || "0");
		case Array:
			return new utils.parseStringList(string,".");
		default:
			if(type.factory) {
				return type.factory(string,groupData);
			} else {
				return new type(string,groupData);
			}
	}
}
