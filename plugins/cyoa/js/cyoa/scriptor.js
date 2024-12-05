/*\
The scriptor module is responsible for all script evalation. This includes
packing and unpacking scripts, and executing them safely.
\*/

'use strict'

var utils = require('./utils');
// Defining a function in this way limits its scope to global and its own arguments
var caller = new Function("script", "_s_", "return eval(script)");

exports.unpack = function(pack) {
	return utils.parseStringList(pack,';');
};

/*
Evaluates a pack of javascript snippets.
state: is a hash of variables that will be globally available during snippet execution.
returns: an array of values corresponding to the returned values from each snippet.
*/
exports.eval = function(pack, state, thisVar) {
	var packArray = exports.unpack(pack);
	var rtn = [];
	for(var index = 0; index < packArray.length; index++) {
		var script = packArray[index].replace(/#{([^ {}]+)}/g, function(match, title) {
			var decoded = decodeURIComponent(title);
			return "_s_.query(" + JSON.stringify(decoded) + ",'x').val";
		});
		rtn.push(caller.call(thisVar, script, state));
	}
	return rtn;
};

exports.evalAll = function(pack, state, thisVar) {
	return exports.eval(pack,state,thisVar).reduce(function(a,b) {
		return a && b;
	},true);
}
