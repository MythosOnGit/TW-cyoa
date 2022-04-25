/*\
title: $:/plugins/mythos/cyoa/js/snippets/tracking/gates.js
type: application/javascript
module-type: library

This contains the compiler and tools for changing tracking filters into snippets.
\*/

var utils = require("$:/plugins/mythos/cyoa/js/utils.js");

var prefix = exports.prefix = "$:/plugins/mythos/cyoa/control/";
var end = prefix + "end";

var gates = exports.gates = Object.create(null);
gates.all = {
	delimiter: "&&",
	opposite: "nall"
};
gates.any ={
	delimiter: "||",
	opposite: "none"
};
gates.none = {
	delimiter: "&&",
	invert: true,
	opposite: "any"
};
gates.nall = {
	delimiter: "||",
	invert: true,
	opposite: "all"
};
gates.sum = {
	delimiter: ")+("
};
gates.diff = {
	delimiter: ")-("
};
gates.exec = {
	delimiter: "; "
};

var opposites = {
	after: "before",
	before: "after",
	touch: "reset",
	reset: "touch",
	first: "visited",
	visited: "first",
	lt: "gte",
	gt: "lte",
	eq: "neq",
	lte: "gt",
	gte: "lt",
	neq: "eq"
};

var operators = exports.operators = {
	lt: "<",
	gt: ">",
	eq: "==",
	lte: "<=",
	gte: ">=",
	neq: "!="
};

function makeCompareString(snippeter,keyword,state) {
	var invert = state.gate.invert;
	var suffix = state.suffix;
	if(invert) {
		suffix = opposites[suffix];
	}
	var operator = operators[suffix];
	if(!operator && invert) {
		keyword = opposites[keyword];
	}
	var output = snippeter(keyword);
	if(output && operator) {
		output = output + operator + state.operand;
	}
	return output;
};

/*
Compiles an array of individual snippets.
*/
exports.compile = function(array,initialKeyword,defaultGate,snippeter) {
	var index = 0;
	function process(state,keyword) {
		var builder = [];
		while (index < array.length) {
			var title = array[index];
			index++;
			if(title === (end + state.salt)) {
				break;
			}
			var newState = getState(title);
			var subSnippeter;
			if(newState) {
				subSnippeter = function(k) { return "(" + process(newState,k) + ")"};
			} else {
				if(!title.endsWith(state.salt)) {
					utils.warn("Malformed track filter results: " + array);
					return "";
				}
				var actualTitle = title.substring(0,title.length-state.salt.length);
				subSnippeter = function(k) { return snippeter(actualTitle,k); };
			}
			var output = makeCompareString(subSnippeter,keyword,state);
			if(output) {
				builder.push(output);
			}
		}
		return builder.join(state.gate.delimiter);
	};
	return process({gate: gates[defaultGate],salt: ""},initialKeyword);
};

var regexp = /(!?)([^\/]+)\/([^\/]*)\/(.*)(\.[^\.]*)$/g

function getState(title) {
	if(title.startsWith(prefix)) {
		regexp.lastIndex = prefix.length;
		var match = regexp.exec(title);
		if(match) {
			var gateString = match[2];
			var gate = gates[gateString];
			if(operators[gateString]) {
				gate = gates.all;
				match[3] = match[2];
			}
			if(match[1] === "!" && gate && gate.opposite) {
				gate = gates[gate.opposite];
			}
			if(gate) {
				return {gate: gate,suffix: match[3],operand: match[4],salt: match[5]};
			}
		}
	}
	return undefined;
};

