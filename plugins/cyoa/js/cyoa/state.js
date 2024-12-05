'use strict';

var utils = require('./utils');
var stateClasses;

function State(data, book) {
	this.book = book;
	this.data = data;
	this.registry = Object.create(null);
	this.tracked = Object.create(null);
	this.vars = Object.create(null);
	for(var variable in (data && data.groups)) {
		var dataSet = data.groups[variable];
		this.registry[variable] = declare(dataSet.type, dataSet);
		if(dataSet.tracked) {
			for(var index = 0; index < dataSet.tracked.length; index++) {
				var title = dataSet.tracked[index];
				// We ignore deleted fill-ins, which will be "undefined" in the list. Must be there, but we won't track them here.
				if(title) {
					this.tracked[title] = {
						variable: variable,
						index: index
					};
				}
			}
		}
		this.tracked[dataSet.title] = { variable: variable };
	}
};

module.exports = State;

State.prototype.deserialize = function(stateStrings,receivingObject) {
	for(var name in this.registry) {
		var obj = this.registry[name];
		var value = stateStrings[name];
		// Currently, empty strings do not get persisted
		if(!value) {
			value = '';
		}
		this.vars[name] = new obj.type();
		this.vars[name].initialize(value, this, obj.data, obj.codec);
	}
}

State.prototype.serialize = function() {
	var stateTree = Object.create(null);
	for(var name in this.registry) {
		var obj = this.registry[name];
		var value = this.vars[name];
		if(undefined !== value) {
			value = value.toString();
			// Currently, empty strings do not get persisted
			if(value) {
				stateTree[name] = value;
			}
		}
	}
	return stateTree;
}

/*
Debugging tool. Returns all pages which are currently set.
Optionally pass a groupVariable to get pages only for the group corresponding to that variable.
*/
State.prototype.allVisited = function(groupVariable) {
	var visited = [];
	for(var title in this.tracked) {
		var info = this.tracked[title];
		if(info.index !== undefined) {
			if(!groupVariable || groupVariable === info.variable) {
				if(this.query(title,"is")) {
					visited.push(title);
				}
			}
		}
	}
	return visited.sort();
};

State.prototype.isTracked = function(pageTitle) {
	return !!this.tracked[pageTitle];
};

Object.defineProperty(State.prototype, 'stack', {
	get: function() {
		return this.vars[this.data.stackVariable]
	}
});

State.prototype.query = function(pageTitle, queryType) {
	queryType = queryType || 'value';
	var entry = this.tracked[pageTitle];
	if(!entry) {
		throw new Error("'" + pageTitle + "' is not actually a tracked page.");
	}
	return this.vars[entry.variable][queryType](entry.index, pageTitle);
};

// This method is mainly intended for debugging. Can be used to assign a value to a state variable.
State.prototype.set = function(pageTitle, value) {
	var entry = this.tracked[pageTitle];
	if(!entry) {
		throw new Error("'" + pageTitle + "' is not actually a tracked page.");
	}
	return this.vars[entry.variable].x(entry.index, pageTitle).val = value;
};

/** Private methods **/

function declare(type,data) {
	if(stateClasses === undefined) {
		stateClasses = $cyoa.modules.createClassesFromModule('cyoatype',Type);
	}
	var codecs = $cyoa.modules.getModulesByTypeAsHashmap('cyoa' + data.type + 'serializer');
	return {
		'type': stateClasses[type],
		'data': data,
		'codec': codecs[data.encoder]};
}

function Type(stringPack,data,codec) {};

Type.prototype.initialize = function(stringPack,state,data,codec) {
	if(data.down === undefined) {
		data.down = utils.generateDownTree(data.up);
		// presumably this hasn't been made either
		if(data.exList) {
			data.exMap = utils.generateExclusiveMap(data.exList);
		}
	}
	this.data = data;
	this.state = state;
	this.serializer = codec;
	this.set = this.serializer.deserialize(stringPack,this.data);
};

Type.prototype.toString = function() {
	return this.serializer.serialize(this.set,this.data);
};

Type.prototype.after = function(index, pageTitle) {
	return (index !== undefined)? this.is(index, pageTitle): this.any();
};

Type.prototype.before = function(index, pageTitle) {
	return (index !== undefined)? !this.is(index, pageTitle): !this.any();
};

Type.prototype.reset = function(index, pageTitle) {
	index !== undefined? this.unassign(index, pageTitle): this.clear();
}

// Visits are the same as touches for nearly everything (except rules).
Type.prototype.visit = function(index) {
	return this.touch(index);
};

function Value(set,index,pageTitle) {
	this.set = set;
	this.index = index;
	this.pageTitle = pageTitle;
};

Object.defineProperty(Value.prototype,'val',{
	get: function() { return this.index !== undefined? this.set.value(this.index, this.pageTitle): this.set.toString();},
	set: function(value) { this.set.assign(this.index,value);}
});

Type.prototype.x = function(index,pageTitle) {
	return new Value(this,index,pageTitle);
};
