/*\
title: $:/plugins/mythos/cyoa/js/filters/appendsort.js
type: application/javascript
module-type: filteroperator

Filter operator for sorting tiddlers so that any tiddlers that list another in a field are guaranteed to come before the tiddler they listed.

\*/

"use strict";

var snippets = require("$:/plugins/mythos/cyoa/js/logic");
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
				requirements[child].push(title);
			}
		}
	});
	return reorder(titles,requirements);
};

exports.appendsort = appendsort;

function reorder(titles,requirements) {
	var status = {};
	var results = [];
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
				throw "Filter Error: Circular dependency detected within tiddlers: " + badTitles.join(", ");
			// case 2: Already written. Do nothing.
		}
	};
	try {
		$tw.utils.each(titles,write);
	} catch(err) {
		return [err];
	}
	return results;
};
