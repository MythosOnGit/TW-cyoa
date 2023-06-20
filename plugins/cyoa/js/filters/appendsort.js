/*\
title: $:/plugins/mythos/cyoa/js/filters/appendsort.js
type: application/javascript
module-type: filteroperator

Filter operator for sorting tiddlers so that any tiddlers that list another in a field are guaranteed to come before the tiddler they listed.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var snippets = require("$:/plugins/mythos/cyoa/js/snippets");
var utils = require("$:/plugins/mythos/cyoa/js/utils");

function appendsort(source,operator,options) {
	var titles = [],
		requirements = {};
	options = options || {};
	options.parentWidget = options.widget;
	source(function(tiddler,title) {
		titles.push(title);
		// We only look for append information on this if it's
		// actually a tiddler. string items are just passed through.
		if(tiddler) {
			var dummyWidget = utils.createDummyWidget(title,options);
			dummyWidget.page = true;
			var appendSet = snippets.getPageAppendList(tiddler,dummyWidget);
			for(var index = 0; index < appendSet.length; index++) {
				var child = appendSet[index];
				requirements[child] = requirements[child] || [];
				requirements[child].push(title); }
		}
	});
	return reorder(titles,requirements);
};

exports.appendsort = appendsort;

function reorder(titles,requirements) {
	var status = {};
	var results = []
	var write = function(title) {
		switch (status[title]) {
		case undefined:
			status[title] = 1; // 1 for pending
			var parents = requirements[title] || [];
			// write all this title's parents first
			for(var index = 0; index < parents.length; index++) {
				write(parents[index]);
			}
			results.push(title);
			status[title] = 2; // 2 for already written
			break;
		case 1:
			// This one is already pending. We have a circle
			var badTitles = [];
			for(var t in status) {
				if(status[t] == 1) { // pending
					badTitles.push(t);
				}
			}
			throw new cderr(badTitles);
		// case 2: Already written. Do nothing.
		}
	};
	for(var index = 0; index < titles.length; index++) {
		write(titles[index]);
	}
	// Lets do a quick check and make sure there were no requirements
	// for bogus, non-existent tiddlers
	for(var title in requirements) {
		if(status[title] != 2) {
			utils.warn("appendsort warning: tiddlers "+requirements[title]+" append non-existent "+title);
		}
	}
	return results;
};

var cderr = exports.appendsort.CircularDependencyError = function(tiddlers,filename,lineNumber) {
	tiddlers = tiddlers || [];
	var message = "Circular dependency detected with tiddlers: " + tiddlers.join(", ");
	var instance = new Error(message,filename,lineNumber);
	instance.name = "CircularDependencyError";
	instance.tiddlers = tiddlers || [];
	Object.setPrototypeOf(instance,Object.getPrototypeOf(this));
	if(Error.captureStackTrace) {
		Error.captureStackTrace(instance,cderr);
	}
	return instance;
}

cderr.prototype = Object.create(Error.prototype,{
	constructor: {
		value: Error,
		enumerable: false,
		writable: true,
		configurable: true
	}
});

if(Object.setPrototypeOf) {
	Object.setPrototypeOf(cderr,Error);
} else {
	cderr.__proto__ = Error;
}

})();
