/*\
title: $:/plugins/mythos/cyoa/js/groupHandlers/handler.js
type: application/javascript
module-type: library

This is the page group that all pages are in if they
don't have any page group tags.

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var utils = require("$:/plugins/mythos/cyoa/js/utils.js");
var styleModules = $tw.modules.getModulesByTypeAsHashmap('cyoagrouphandlerstyle');

const versionPrefix = "$:/config/mythos/cyoa/records/";
const autoVersioningTitle = "$:/config/mythos/cyoa/autoVersioning";

/*
group: string of group name
*/
module.exports = function(group,data,pages,options) {
	this.data = data || Object.create(null);
	this.pages = pages;
	this.group = group;
	this.wiki = options && options.wiki;
	this.variable = data.variable || group;
};

var Hp = module.exports.prototype;

/*
Should be overridden
*/
Hp.after = function(title) {
	return null;
};

/*
Should be overridden
*/
Hp.touch = function(title) {
	return null;
};

/*
Should be overridden
*/
Hp.reset = function(title) {
	return null;
};

/*
Can be overridden
*/
Hp.before = function(title) {
	var rtn = this.after(title);
	if(rtn) {
		return "!" + rtn;
	}
	return rtn;
};

/*
Can be overridden
*/
Hp.afterAll = function(title) {
	return null;
}

/*
Can be overridden
*/
Hp.touchAll = function(title) {
	return null;
}

/*
Should be overridden?
*/
Hp.resetAll = function(title) {
	return null;
}

/*
Can be overridden
*/
Hp.beforeAll = function(title) {
	var rtn = this.afterAll(title);
	if(rtn) {
		return "!" + rtn;
	}
	return rtn;
}

Hp.first = function(title) {
	return this.before(title);
};

Hp.visited = function(title) {
	return this.after(title);
};

Hp.idFor = function(title) {
	var info = this.getPageMap()[title];
	return info && info.id;
};

Hp.strIdFor = function(title) {
	var value = this.idFor(title);
	if(typeof value === "string") {
		return utils.enquote(value);
	} else {
		return value;
	}
};

Hp.strIndexerFor = function(title) {
	var value = this.idFor(title);
	if(/^[a-zA-Z$][\w$]*$/.test(value)) {
		return this.variable + "." + value;
	}
	return this.variable + "[" + this.strIdFor(title) + "]";
};

Hp.getExclusionLists = function() {
	var excludeMap = Object.create(null);
	for(var page in this.pages) {
		var excludes = this.wiki.getTiddlerList(page,"cyoa.exclude");
		for (var index = 0; index < excludes.length; index++) {
			var groupName = excludes[index];
			excludeMap[groupName] = excludeMap[groupName] || Object.create(null);
			excludeMap[groupName][page] = true;
		}
	}
	var relevantGroups = [];
	for(var groupName in excludeMap) {
		var group = excludeMap[groupName];
		var relevantIds = [];
		// Scan for any in the group that imply another.
		for(var title in group) {
			var implied = impliesAny(this.wiki,title,group);
			if(implied) {
				utils.warnForTiddler(title,"Implies page '"+implied+"' which is in the same exclusion group '"+groupName+"'",{wiki: this.wiki});
			} else {
				relevantIds.push(this.getPageMap()[title].id);
			}
		}
		// >1 because an exclude group is pointless if it only has one item
		if(relevantIds.length > 1) {
			relevantGroups.push(relevantIds);
		}
	}
	return relevantGroups;
};

Hp.convertToIds = function(map) {
	var idMap = Object.create(null);
	for(var item in map) {
		var values = map[item];
		if(values !== undefined && values.length > 0) {
			var newVals = [];
			for(var index = 0; index < values.length; index++) {
				newVals.push(this.idFor(values[index]));
			}
			idMap[this.idFor(item)] = newVals;
		}
	}
	return idMap;
};

Hp.getImplicationTree = function() {
	var output = Object.create(null);
	var pages = this.pages;
	var downTree = new Map();
	var self = this;
	function processTitle(tiddler,title) {
		if(!downTree.has(title)) {
			var implications = $tw.utils.parseStringArray(tiddler.fields["cyoa.imply"]);
			downTree.set(title,{});
			if(implications) {
				output[title] = null;
				var results = [];
				for(var index = 0; index < implications.length; index++) {
					var implication = implications[index];
					if(!pages[implication]) {
						utils.warnForTiddler(title,"Implies page '"+implication+"' which is not in the same group",{wiki: self.wiki});
					} else if(implication === title || output[implication] === null) {
						utils.warnForTiddler(title,"Detected cyclic dependency in 'cyoa.imply' chain",{wiki: self.wiki});
					} else {
						// Set this to null first, so we can tell if we're treading over the same ground if it cycles.
						processTitle(pages[implication],implication);
						results.push(implication);
						downTree.get(implication)[title] = true;
					}
				}
				output[title] = results;
			}
		}
	}
	$tw.utils.each(pages,processTitle);
	purgeRedundantImplications(output,downTree);
	return output;
};

function purgeRedundantImplications(tree,downMap) {
	var path = [];
	function trace(node) {
		var parents = tree[node],
			index,
			parentIndex;
		for(index = path.length-2; index >= 0; index--) {
			for(parentIndex = parents.length-1; parentIndex >= 0; parentIndex--) {
				if(parents[parentIndex] == path[index]) {
					// This parent was already an ancestor. Remove it.
					parents.splice(parentIndex,1);
				}
			}
		}
		path.push(node);
		for(var child in downMap.get(node)) {
			trace(child);
		}
		path.pop();
	};
	downMap.forEach(function(children,node) {
		// We start with root nodes only
		if(tree[node] === undefined) {
			trace(node);
		}
	});
};

/*
This calls one of the sub getIdMap methods, this allows sub classes to add new styles, or change existing ones.
*/
Hp.generateIdFor = function(page,counter) {
	var map = Object.create(null);
	var styleModule = styleModules[this.data.style || "string"];
	if(!styleModule) {
		utils.warn("Grouphandler warning: In "+this.data.title+", style '"+this.data.style+"' not recognized.");
		styleModule = styleModules.string;
	}
	return styleModule.getIdFor(this,page,counter);
};

/*
Updates and returns the written versioning record for this group.
*/
Hp.getRecord = function() {
	var infoArray = this.wiki.getTiddlerData(versionPrefix + this.group,[]);
	var pageMap = Object.create(null);
	var idMap = Object.create(null);
	var groupNumber = 0;
	var collisions = Object.create(null);
	var empty = [];
	var newPages = [];
	var changed = false;
	var self = this;
	var totalCount = 0;
	for(var blockIndex = 0; blockIndex < infoArray.length; blockIndex++) {
		var infoBlock = infoArray[blockIndex];
		for(var index = 0; index < infoBlock.length; index++,totalCount++) {
			var info = infoBlock[index];
			var newId = this.generateIdFor(info.title,totalCount);
			idMap[newId] = info.title;
			pageMap[info.title] = info;
			if((newId !== info.id) && !info.warned) {
				utils.warnForTiddler(info.title,"Tiddler would now use id '"+newId+"' instead of '"+info.id+"', which would be a backward-incompatible change. CYOA will retain the use of '"+info.id+"' until the version history is next cleared.",{wiki: self.wiki});
				info.warned = true;
				changed = true;
			}
		}
	}
	for(var page in this.pages) {
		// If this page isn't in the pageMap, it must be new
		if(pageMap[page] === undefined) {
			var id = this.generateIdFor(page,totalCount);
			var info = {id: id,title: page};
			if(!id && id !== 0) {
				// If the id was null, undefined, or emptystring, bad.
				empty.push(page);
			} else if(idMap[id]) {
				// This id already existed in the versioned data. We have a collision
				if(!collisions[id]) {
					collisions[id] = [idMap[id]];
				}
				collisions[id].push(page);
			} else {
				// put it in the original array for posterity.
				newPages.push(info);
			}
			idMap[id] = page;
			pageMap[page] = info;
			++totalCount;
			changed = true;
		}
	}
	if(newPages.length > 0) {
		infoArray.push(newPages);
	}
	// If we had collsions, we need to warn about them.
	for(var collision in collisions) {
		utils.warn("GroupHandler warning: In "+this.data.title+" group, the following tiddlers all resolved to variable '"+collision+"': " + collisions[collision].join(", "));
	}
	// Issue warning for null tiddler if it wasn't covered in the
	// collision warnings.
	if(empty.length > 0) {
		utils.warn("GroupHandler warning: In "+this.data.title+" group, the following tiddlers all resolved to an empty variable: "+empty.join(", "));
	}
	return {record: infoArray,changed: changed};
};

Hp.commitRecord = function(newRecord) {
	var recordString = stringifyRecord(newRecord);
	this.wiki.addTiddler({
		title: versionPrefix + this.group,
		text: recordString,
		type: "application/json"});
};

/*
Here's a hook which will update the names inside a record during a rename.
*/
$tw.hooks.addHook("th-renaming-tiddler",function(newTiddler,oldTiddler) {
	var wiki = $tw.wiki;
	var oldName = oldTiddler.fields.title;
	var group = wiki.getTiddlerCyoaGroup(oldName);
	if(group) {
		// This renamed tiddler belongs to a group. We may have to  rename it.
		var recordName = versionPrefix + group;
		var infoArray = wiki.getTiddlerData(recordName);
		if(infoArray) {
			// A record exists for this group. We must go through it and find the tiddler.
			for(var blockIndex = 0; blockIndex < infoArray.length; blockIndex++) {
				var group = infoArray[blockIndex];
				for(var index = 0; index < group.length; index++) {
					var info = group[index];
					// We found it.
					if(info.title === oldName) {
						info.title = newTiddler.fields.title;
						// Record the update now
						wiki.addTiddler({
							title: recordName,
							text: stringifyRecord(infoArray),
							type: "application/json"});
						// We're done. There should only be one entry.
						return newTiddler;
					}
				}
			}
		}
	}
	return newTiddler;
});

Hp.getPageMap = function() {
	if(this.pageMap === undefined) {
		// Okay. Now that we've updated the record, lets pull out the pageMap
		var recordInfo = this.getRecord();
		var record = recordInfo.record;
		var self = this;
		if(recordInfo.changed) {
			if(this.wiki.getTiddlerText(autoVersioningTitle,"disable") !== "disable") {
				$tw.utils.nextTick(function() {
					self.commitRecord(record);
				});
			}
		}
		var pageMap = Object.create(null);
		for(var groupNumber = 0; groupNumber < record.length; groupNumber++) {
			var infoBlock = record[groupNumber];
			for(var index = 0; index < infoBlock.length; index++) {
				var info = infoBlock[index];
				pageMap[info.title] = Object.create(info);
				pageMap[info.title].group = groupNumber;
			}
		}
		this.pageMap = pageMap;
	}
	return this.pageMap;
};

/*
I'm very particular about how this JSON file gets written. I want it to be git friendly
*/
function stringifyRecord(record) {
	var newRecord = [];
	for(var index = 0; index < record.length; index++) {
		var blockRecord = [];
		for(var blockIndex = 0; blockIndex < record[index].length; blockIndex++) {
			blockRecord.push(JSON.stringify(record[index][blockIndex]));
		}
		newRecord.push(blockRecord.join(",\n"));
	}
	return "[[\n" + newRecord.join("\n],[\n") + "\n]]";
}

function impliesAny(wiki,title,titleSet) {
	while(title) {
		var tiddler = wiki.getTiddler(title);
		if(tiddler) {
			title = tiddler.fields["cyoa.imply"];
			if(titleSet[title]) {
				return title;
			}
		} else {
			break;
		}
	}
	return null;
};
