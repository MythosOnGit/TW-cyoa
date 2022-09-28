/*\
description: string(e.g. tiddlerA,tiddlerB)
title: $:/plugins/mythos/cyoa/js/groupHandlers/styles/string.js
type: application/javascript
module-type: cyoagrouphandlerstyle

\*/

var utils = require("$:/plugins/mythos/cyoa/js/utils.js");

exports.name = "string";

exports.init = function(wiki,data) {
	this.idMap = Object.create(null);
	this.collisions = Object.create(null);
	this.empty = [];
	this.wiki = wiki;
	this.data = data;
	if (data.filter) {
		this.filter = wiki.compileFilter(data.filter);
	} else {
		this.filter = (x) => x;
	}
};

exports.getIdFor = function(entry,index) {
	return entry.id || entry.title;
};

exports.touch = function(groupHandler,info,index) {
	var id = this.filter([info.title])[0] || "";
	var changed = false;
	if(!info.id) {
		if(!id && id !== 0) {
			// If the id was null, undefined, or emptystring, bad.
			this.empty.push(info.title);
		} else if(this.idMap[id]) {
			// This id already existed in versioned data. We have a collision
			if(!this.collisions[id]) {
				this.collisions[id] = [this.idMap[id]];
			}
			this.collisions[id].push(info.title);
		} else {
			this.idMap[id] = info.title;
			info.id = id;
			changed = true;
		}
	} else if(info.id !== id && info.nextId !== id) {
		utils.warnForTiddler(info.title,"Tiddler would now use id '"+id+"' instead of '"+info.id+"', which would be a backward-incompatible change. CYOA will retain the use of '"+info.id+"' until the version history is next cleared.",{wiki: this.wiki});
		info.nextId = id;
		changed = true;
	}
	if(index == groupHandler.length-1) {
		// We're on the last entry. We can now issue any warnings concerning bad IDs.
		this.issueWarnings();
	}
	return changed;
};

exports.issueWarnings = function() {
	// If we had collsions, we need to warn about them.
	for(var collision in this.collisions) {
		utils.warn("GroupHandler warning: In "+this.data.title+" group, the following tiddlers all resolved to variable '"+collision+"': " + this.collisions[collision].join(", "));
	}
	// Issue warning for null tiddler if it wasn't covered in the
	// collision warnings.
	if(this.empty.length > 0) {
		utils.warn("GroupHandler warning: In "+this.data.title+" group, the following tiddlers all resolved to an empty variable: "+this.empty.join(", "));
	}
};
