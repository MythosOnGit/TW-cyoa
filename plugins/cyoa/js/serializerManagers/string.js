/*\
title: $:/plugins/mythos/cyoa/js/serializerManagers/string.js
type: application/javascript
module-type: cyoaserializermanager

\*/

var utils = require("$:/plugins/mythos/cyoa/js/utils.js");

exports.name = "string";

exports.init = function(wiki,data) {
	this.idMap = Object.create(null);
	this.wiki = wiki;
	this.keys = [];
	this.data = data;
	this.filter = (data.filter)? wiki.compileFilter(data.filter): (x) => x;
};

exports.amendRecord = function(entries) {
	var changed = false,
		collisions = Object.create(null),
		empties = [];
	for(var index = 0; index < entries.length; index++) {
		var info = entries[index];
		var id = "";
		// If there is no info.title, that probably means this tiddler was removed from the group, and we can ignore it.
		if(info.title) {
			id = this.filter([info.title])[0] || "";
			if(!info.id) {
				if(!id && id !== 0) {
					// If the id was null, undefined, or emptystring, bad.
					empties.push(info.title);
				} else if(this.idMap[id]) {
					// This id already existed in versioned data. We have a collision
					if(!collisions[id]) {
						collisions[id] = [this.idMap[id]];
					}
					collisions[id].push(info.title);
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
		}
		this.keys[index] = info.id || id;
	}
	// Now issue any warnings.
	// If we had collsions, we need to warn about them.
	for(var collision in collisions) {
		utils.warn("GroupHandler warning: In "+(this.data.caption || this.data.title)+" group, the following tiddlers all resolved to variable '"+collision+"': " + collisions[collision].join(", "));
	}
	// Issue warning for null tiddler if it wasn't covered in the
	// collision warnings.
	if(empties.length > 0) {
		utils.warn("GroupHandler warning: In "+(this.data.caption || this.data.title)+" group, the following tiddlers all resolved to an empty variable: "+empties.join(", "));
	}
	return changed;
};

exports.exportData = function(data) {
	data.keys = this.keys;
};
