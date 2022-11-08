/*\
The scriptor module is responsible for all script evalation. This includes
packing and unpacking scripts, and executing them safely.
\*/

'use strict'

var utils = require("./utils");

exports.unpack = function(pack) {
	return utils.parseStringList(pack,";");
};

/*
Evaluates a pack of javascript snippets.
state: is a hash of variables that will be globally available during snippet execution.
returns: an array of values corresponding to the returned values from each snippet.
*/
exports.eval = function(pack,state,thisVar) {
	state = state || {};
	var keys = Object.keys(state);
	keys.unshift("__script__");
	keys.push("return eval(__script__)");
	var caller = Function.apply(Object.create(Function.prototype),keys);
	var packArray = exports.unpack(pack);
	var args = [null];
	for(var st in state) {
		args.push(state[st]);
	}
	var rtn = [];
	for(var index = 0; index < packArray.length; index++) {
		args[0] = packArray[index];
		rtn.push(caller.apply(thisVar,args));
	}
	return rtn;
};

exports.evalAll = function(pack,state,thisVar) {
	return exports.eval(pack,state,thisVar).reduce(function(a,b) {
		return a && b;
	},true);
}
