/*\
title: $:/plugins/mythos/cyoa/js/relink/record.js
type: application/javascript
module-type: relinkoperator

Handles the relinking of cyoa records.

\*/

"use strict";

var Record = require("$:/plugins/mythos/cyoa/js/groupHandlers/record.js");

var versionPrefix = "$:/config/mythos/cyoa/records/";

exports.name = "cyoarecord";

exports.report = function(tiddler,callback,options) {
	if($tw.utils.startsWith(tiddler.fields.title, versionPrefix)) {
		var record = new Record(options.wiki, tiddler.fields.title);
		var index = 0;
		record.forEachEntry(function(entry) {
			var blurb = entry.id?
				"Committed as: " + entry.id:
				"Committed as #" + index;

			callback(entry.title,blurb);
			index++;
		});
	}
};

exports.relink = function(tiddler,fromTitle,toTitle,changes,options) {
	if($tw.utils.startsWith(tiddler.fields.title, versionPrefix)) {
		var record = new Record(options.wiki, tiddler.fields.title);
		record.forEachEntry(function(entry) {
			if(entry.title === fromTitle) {
				entry.title = toTitle;
				record.changed = true;
			}
		});
		if(record.changed) {
			changes.text = {output: record.toString()};
		}
	}
};
