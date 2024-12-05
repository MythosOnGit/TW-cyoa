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
		// If there is no info.title, that probably means this tiddler was removed from the group. We must still remember its old id.
		var id = (info.title && this.filter([info.title])[0]) || info.id || "";
		if(!id && id !== 0) {
			// If the id was null, undefined, or emptystring, bad.
			empties.push(info.title);
		} else if(this.idMap[id] !== undefined) {
			// This id already existed in versioned data. We have a collision
			if(!collisions[id]) {
				reportCollision(collisions, id, this.idMap[id]);
			}
			reportCollision(collisions, id, info.title);
		} else {
			if(!info.id) {
				info.id = id;
				changed = true;
			} else if (info.id !== id) {
				if(info.nextId !== id) {
					utils.warnForTiddler(info.title,"Tiddler would now use id '"+id+"' instead of '"+info.id+"', which would be a backward-incompatible change. CYOA will retain the use of '"+info.id+"' until the version history is next cleared.",{wiki: this.wiki});
					info.nextId = id;
					changed = true;
				}
				// Now go with the old id
				id = info.id;
			}
			this.idMap[id] = info.title || null;
			this.keys[index] = id;
		}
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

function reportCollision(collisionMap, id, title) {
	if(!collisionMap[id]) {
		collisionMap[id] = [];
	}
	collisionMap[id].push(title?
		"'"+title+"'":
		"(removed page placeholder)");
};

exports.exportData = function(data) {
	data.keys = this.keys;
};
