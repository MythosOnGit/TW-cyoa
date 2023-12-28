'use strict';

var utils = require('./utils');
var stateClasses;

function State() {
	this.registry = {};
};

function Type(stringPack,data,codec) {};

Type.prototype.initialize = function(stringPack,data,codec) {
	if(data.down === undefined) {
		data.down = utils.generateDownTree(data.up);
		// presumably this hasn't been made either
		if(data.exList) {
			data.exMap = utils.generateExclusiveMap(data.exList);
		}
	}
	this.data = data;
	this.serializer = codec;
	this.set = this.serializer.deserialize(stringPack,this.data);
};

Type.prototype.toString = function() {
	return this.serializer.serialize(this.set,this.data);
};

module.exports = State;

/*
Options include:
default: This is a default value for when the uri query doesn't specify a value.
data: This will be made available to the object when it's created.
*/
State.prototype.declare = function(name,type,data) {
	if(stateClasses === undefined) {
		stateClasses = $cyoa.modules.createClassesFromModule('cyoatype',Type);
	}
	var codecs = $cyoa.modules.getModulesByTypeAsHashmap('cyoa' + data.type + 'serializer');
	this.registry[name] = {
		'type': stateClasses[type],
		'data': data,
		'codec': codecs[data.encoder]};
}

State.prototype.deserialize = function(stateStrings,receivingObject) {
	var receivingObject = receivingObject || Object.create(null);
	for(var name in this.registry) {
		var obj = this.registry[name];
		var value = stateStrings[name];
		// Currently, empty strings do not get persisted
		if(!value) {
			value = '';
		}
		receivingObject[name] = new obj.type();
		receivingObject[name].initialize(value,obj.data,obj.codec);
	}
	return receivingObject;
}

State.prototype.serialize = function (stateObject) {
	var stateTree = Object.create(null);
	for(var name in this.registry) {
		var obj = this.registry[name];
		var value = stateObject[name];
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
