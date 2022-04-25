/*\
cyoa.module-type: state

An object for storing a stack of pages, where only the top one is "touched"

\*/

var utils = require("./utils");

var Stack = function(stackString) {
	this.array = utils.parseStringList(stackString,".");
}

exports.stack = Stack;

Stack.prototype = {
	toString: function() {
		return utils.stringifyList(this.array,".");
	},
	push: function(value) {
		this.array.push(value);
	},
	pop: function(value) {
		if(value === undefined || (this.top() === value)) {
			return this.array.pop();
		}
	},
	top: function() {
		return this.array[this.array.length-1];
	},
	clear: function() {
		this.array.length = 0;
	}
};
