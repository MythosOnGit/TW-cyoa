/*\
cyoa.module-type: state

An object for storing a single value state variable.

\*/

exports.value = function(valueString,setData) {
	if(valueString) {
		this.value = valueString;
	}
	if(setData) {
		this.tree = setData;
	}
};

var Vp = exports.value.prototype;

Vp.tree = Object.create(null);

Vp.toString = function() {
	return (this.value === undefined)? "": this.value;
};

Vp.is = function(item) {
	return check(this.tree,this.value,item.toString());
};

function check(tree,value,item) {
	if(value === item) {
		return true;
	}
	var parents = tree[value];
	if(parents) {
		for(var index = 0; index < parents.length; index++) {
			if(check(tree,parents[index],item)) {
				return true;
			}
		}
	}
	return false;
};

Vp.set = function(item) {
	this.value = item.toString();
};

Vp.unset = function(item) {
	if(this.value === item.toString()) {
		this.value = undefined;
	}
};

Vp.clear = function() {
	this.value = undefined;
};

Vp.any = function() {
	return this.value !== undefined;
};
