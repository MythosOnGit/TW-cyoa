/*\
title: $:/plugins/mythos/cyoa/js/groupHandlers/record.js
type: application/javascript
module-type: library

Object to manage the versioning record for a group.

\*/

var utils = require("$:/plugins/mythos/cyoa/js/utils.js");

function Style(){};
Style.prototype.amendRecord = function(){};
Style.prototype.init = function(){};
Style.prototype.exportData = function(){};
Style.prototype.keepRecord = true;
var styleClasses = $tw.modules.createClassesFromModules("cyoaserializermanager",null,Style);

const versionPrefix = "$:/config/mythos/cyoa/records/";
const autoVersioningTitle = "$:/config/mythos/cyoa/autoVersioning";
var cyoaTypes = $tw.modules.getModulesByTypeAsHashmap("cyoatype");

function Record(wiki,title) {
	this.wiki = wiki;
	this.title = title;
	this.changed = false;
	this.name = wiki.getCyoaGroupVariable(title, "cyoa.key");
	var record = wiki.getTiddlerData(versionPrefix + this.name,{});
	this.entries = record.entries || [];
};

module.exports = Record;

var Rp = Record.prototype;

Rp.update = function(pages) {
	var groupTiddler = this.wiki.getTiddler(this.title);
	var data = groupTiddler && groupTiddler.fields || {};
	this.fields = data;
	var handler = data["cyoa.type"];
	this.styleString = data["cyoa.serializer"] || 'string';
	if(!cyoaTypes[handler]) {
		var message = (handler)?
			("Type '"+handler+"' for group '"+this.title+"' does not exist."):
			("Group '"+this.title+"' does not specify a type.");
		utils.warn("GroupHandler warning: "+message);
		// Perhaps I should default to something instead. I don't think I should fail here.
		return undefined;
	}

	this.pages = pages;
	this.variable = this.wiki.getCyoaGroupVariable(this.title,"cyoa.key");
	this.updateRecord();
	this.style = getStyle(this.wiki, this.styleString, data);
	this.changed = this.style.amendRecord(this.entries) || this.changed;
	return true;
};

Rp.groupData = function() {
	var data = {
		exList: generateExclusionList(this),
		up: generateUpTree(this),
		type: this.fields['cyoa.type'],
		encoder: this.styleString
	};
	this.style.exportData(data);
	return data;
};

module.exports.versioningEnabled = function(wiki) {
	return wiki.getTiddlerText(autoVersioningTitle,"disable") !== "disable";
};

Rp.forEachEntry = function(callback) {
	for(var index = 0; index < this.entries.length; index++) {
		var entry = this.entries[index];
		callback(entry,this);
	}
};

Object.defineProperty(Rp,"length",{
	get: function() { return this.entries.length; }
});

/*
I'm particular about how this JSON file gets written. I want it git friendly.
*/
Rp.toString = function() {
	var newRecord = [];
	this.forEachEntry(function(entry) {
		newRecord.push(JSON.stringify(entry));
	});
	return "{\"entries\":[\n" + newRecord.join(",\n") + "\n]}";
};

Rp.commit = function() {
	if(this.style.keepRecord && this.changed) {
		this.wiki.addTiddler({
			title: versionPrefix + this.name,
			text: this.toString(),
			type: "application/json"});
	}
};

/*
Updates and returns the written versioning record for this group.
*/
Rp.updateRecord = function() {
	var pageMap = Object.create(null);
	this.indexMap = Object.create(null);
	var newPages = [];
	var self = this;
	var counter = 0;
	var implicationTree = getImplicationTree(this.wiki,this.pages);
	this.exclusionArray = getExclusionArray(this.wiki,this.pages);
	var exclusionMap = createExclusionMap(this.exclusionArray);
	// Run through the existing records, test for validity, and build maps
	this.forEachEntry(function(info) {
		self.indexMap[info.title] = counter;
		pageMap[info.title] = info;
		// If the corresponding tiddler has since been deleted or removed...
		if(info.title && !self.pages[info.title]) {
			info.title = undefined;
			self.changed = true;
		}
		++counter;
	});
	// Add pages that weren't already there
	for(var page in this.pages) {
		// If this page isn't in the pageMap, it must be new
		if(pageMap[page] === undefined) {
			var info = {title: page};
			// put it in the original array for posterity.
			newPages.push(info);
			this.indexMap[page] = counter;
			pageMap[page] = info;
			++counter;
		}
	}
	if(newPages.length > 0) {
		this.entries = this.entries.concat(newPages);
		this.changed = true;
	}
	// Now we need to populate the new pages' implication and exclusion fields
	this.forEachEntry(function(info) {
		if(!info.title) {
			// This was a deleted or removed tiddler. Skip it. Nothing to update.
			return;
		}
		var newImply = [];
		if(implicationTree[info.title] && implicationTree[info.title].length > 0) {
			newImply = implicationTree[info.title].map((title) => self.indexMap[title]);
		}
		// Now we look through for any implications that were removed.
		if(info.imply) {
			for(var index = 0; index < info.imply.length; index++) {
				var parent = info.imply[index];
				if(newImply.indexOf(parent) < 0) {
					function checkIfMustBeImplied(index) {
						var title = self.entries[index].title;
						// If this is still an active page, it must still be implied. If not, we must force it.

						if(title && !implies(implicationTree,info.title,title)) {
							// oldImply is where legacy implies go. This way we don't issue this warning multiple times.
							if(!info.oldImply || info.oldImply.indexOf(index) < 0) {
								utils.warnForTiddler(info.title,"Tiddler no longer implies '"+title+"', which would be a backward-incompatible change. CYOA will retain the implication until the version history is next cleared.",{wiki: self.wiki});
								info.oldImply = info.oldImply || [];
								info.oldImply.push(index);
								self.changed = true;
							}
						} else {
							var parents = self.entries[index].imply;
							// Else check the parents.
							if(parents) {
								for(var p = 0; p < parents.length; p++) {
									checkIfMustBeImplied(parents[p]);
								}
							}
						}
					}
					checkIfMustBeImplied(parent);
					// Ultimately, there's no reason to ever drop old implications
					newImply.push(parent);
				}
			}
		}
		info.imply = newImply.length > 0 ? newImply : undefined;
		var newExclude = [];
		if(exclusionMap[info.title] && exclusionMap[info.title].length > 0) {
			newExclude = exclusionMap[info.title].map((title) => self.indexMap[title]);
			info.exclude = newExclude;
		}
	});
};

function getStyle(wiki,stringName,fields) {
	var styleClass = styleClasses[stringName];
	if(!styleClass) {
		// This doesn't have a codec stager, so we can use the default stager.
		styleClass = Style;
	}
	// And now the styles have a chance to write data however they want
	var style = new styleClass();
	style.init(wiki, fields);
	return style;
};

function generateUpTree(record) {
	var tree = Object.create(null);
	var index = 0;
	record.forEachEntry(function(info) {
		if(info.imply) {
			tree[index] = info.imply;
		}
		index++;
	});
	return tree;
};

function generateExclusionList(record) {
	return record.exclusionArray.map((set) => set.map((title) => record.indexMap[title]));
};

// returns [[indexA,indexB],[indexC,indexD]]
function getExclusionArray(wiki,pages) {
	var excludeMap = Object.create(null);
	for(var page in pages) {
		var excludes = wiki.getTiddlerList(page,"cyoa.exclude");
		for (var index = 0; index < excludes.length; index++) {
			var groupName = excludes[index];
			excludeMap[groupName] = excludeMap[groupName] || Object.create(null);
			excludeMap[groupName][page] = true;
		}
	}
	// Now that we have an exclude map, let's clean it up.
	var exclusionArray = [];
	for(var groupName in excludeMap) {
		var group = excludeMap[groupName];
		var titles = [];
		// Scan for any in the group that imply another.
		for(var title in group) {
			var implied = impliesAny(wiki,title,group);
			if(implied) {
				utils.warnForTiddler(title,"Implies page '"+implied+"' which is in the same exclusion group '"+groupName+"'",{wiki: wiki});
			} else {
				titles.push(title);
			}
		}
		// If the exclusion set isn't greater than 1, why bother?
		if(titles.length > 1) {
			exclusionArray.push(titles);
		}
	}
	return exclusionArray;
};

// This is a map of {titleA => [titles, exclusive, to, titleA],...}
function createExclusionMap(exclusionArray) {
	var exclusions = Object.create(null);
	for(var x = 0; x < exclusionArray.length; x++) {
		var titles = exclusionArray[x];
		for(var i = 0; i < titles.length; i++) {
			for(var j = 0; j < titles.length; j++) {
				// If there is only one item in the title array, nothing happens
				if(i !== j) {
					exclusions[titles[i]] = exclusions[titles[i]] || [];
					exclusions[titles[i]].push(titles[j]);
				}
			}
		}
	}
	return exclusions;
};

/*
Uses the implications tree to find out if "node" implies "possibleParent" through any path.
*/
function implies(implications,node,possibleParent) {
	return implications[node] && implications[node].some((parent) => (parent === possibleParent) || implies(implications,parent,possibleParent));
};

function impliesAny(wiki,title,titleSet) {
	var imps = wiki.getTiddlerList(title,"cyoa.imply");
	for(var index = 0; index < imps.length; index++) {
		var parent = imps[index];
		if (titleSet[parent]) {
			return parent;
		}
		var ancestors = impliesAny(wiki,parent,titleSet);
		if(ancestors !== null) {
			return ancestors;
		}
	}
	return null;
};

function getImplicationTree(wiki,pages) {
	var output = Object.create(null);
	var downTree = new Map();
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
						if(!isRule(wiki, implication)) {
							utils.warnForTiddler(title,"Implies page '"+implication+"' which is not in the same group",{wiki: wiki});
						}
					} else if(implication === title || output[implication] === null) {
						utils.warnForTiddler(title,"Detected cyclic dependency in 'cyoa.imply' chain",{wiki: wiki});
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

// Rules can be implied without warning.
function isRule(wiki, title) {
	var tiddler = wiki.getTiddler(title);
	if(!tiddler) {
		return false;
	}
	var group = wiki.getTiddler(tiddler.fields['cyoa.group']);
	return group && group.fields['cyoa.type'] === 'rule';
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
