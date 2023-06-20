/*\
title: $:/plugins/mythos/cyoa/js/groupHandlers/set.js
type: application/javascript
module-type: cyoagrouphandler

\*/

"use strict";

exports.name = "set";

exports.groupData = function() {
	var data = {
		exList: this.generateExclusionList(),
		up: this.generateUpTree()
	};
	this.style.exportData(data);
	return data;
};

exports.touch = function(title) {
	return this.variable + ".add(" + this.strIdFor(title) + ")";
};

exports.reset = function(title) {
	return this.variable + ".remove(" + this.strIdFor(title) + ")";
};

exports.resetAll = function() {
	return this.variable + ".clear()";
};

exports.after = function(title) {
	return this.variable + ".has(" + this.strIdFor(title) + ")";
};

exports.do = function(title) {
	return this.variable + ".flag(" + this.strIdFor(title) + ").val";
};
