/*\
title: $:/plugins/mythos/cyoa/js/wikimethod/group.js
type: application/javascript
module-type: wikimethod

Wikimethods regarding getting page sets, and getting all pages in a set.

\*/

const utils = require("$:/plugins/mythos/cyoa/js/utils");
const pageSetPrefix = "$:/plugins/mythos/cyoa/groups/";
const pageSetField = "cyoa.group";
const defaultPageSet = "default";

const groupModules = $tw.modules.applyMethods("cyoagrouphandler");

exports.getCyoaDefaultGroup = function() { return defaultPageSet; };

/*
Returns an array of all group titles.
*/
exports.getCyoaGroups = function() {
	const self = this;
	return this.getGlobalCache("cyoa-groups",function() {
		const groups = Object.create(null),
			checkIfSet = function(tiddler,title) {
				if(title.startsWith(pageSetPrefix)) {
					groups[title.substr(pageSetPrefix.length)] = tiddler;
				}
			};
		self.eachShadowPlusTiddlers(checkIfSet);
		return groups;
	});
};

/*
Returns an array of group handlers by their handle. This list is independent of the groups. It represents the modules.
*/
exports.getCyoaGroupHandlers = function() {
	return Object.keys(groupModules);
};

exports.getCyoaGroupHandler = function(group,options) {
	var groupTiddler = this.getCyoaGroups()[group];
	var wiki = this;
	var options = Object.create(options || null);
	options.wiki = wiki;
	return this.getGlobalCache("cyoa-group-" + group,function() {
		var data = wiki.getTiddlerData(groupTiddler,{});
		if(data) {
			var Module = groupModules[data.handler];
			if(Module === undefined) {
				var message = (data.handler)?
					("Group Handler '"+data.handler+"' for group '"+group+"' does not exist."):
					("Group '"+group+"' does not specify a group handler.");
				utils.warn("GroupHandler warning: "+message);
				return undefined;
			}
			data.title = group;
			var tiddlers = wiki.getTiddlersInCyoaGroup(group);
			return new Module(group,data,tiddlers,options);
		}
		return undefined;
	});
};

/*
This writes any new tracked pages to the cyoa ledgers. There isn't much need to call this manually outside of the testing framework.
Generating a CYOA does this automatically (assuming versioning is on).
*/
exports.commitCyoaGroups = function(dryRun) {
	var groups = this.getCyoaGroups();
	var changed = false;
	for(var group in groups) {
		var handler = this.getCyoaGroupHandler(group);
		var recordData = handler.getRecord();
		if(recordData.changed) {
			changed = true;
			if(!dryRun) {
				handler.commitRecord(recordData.record);
			} else {
				// Since we're not changing anything, we might as well break.
				break;
			}
		}
	}
	return changed;
}

const versionPrefix = "$:/config/mythos/cyoa/records/";

exports.clearCyoaGroups = function() {
	var toClear = [];
	// Gather all the records that must be deleted
	this.each(function(tiddler,title) {
		if(title.slice(0,versionPrefix.length) === versionPrefix) {
			toClear.push(title);
		}
	});
	// Then delete them.
	for(var index = 0; index < toClear.length; index++) {
		this.deleteTiddler(toClear[index]);
	}
};

exports.getCyoaGroupData = function() {
	var groups = this.getCyoaGroups();
	var output = Object.create(null);
	for(var group in groups) {
		var handler = this.getCyoaGroupHandler(group);
		if(handler && handler.groupData) {
			output[group] = handler.groupData();
		}
	}
	return output;
};

/*
Returns group for given tiddler.
*/
exports.getTiddlerCyoaGroup = function(title) {
	const self = this;
	// The reason this reverse lookups all the tiddlers instead of just looking at the "cyoa.group" field is because that won't tell us when a tiddler is in the default group, or no group, nor will it tells us for non-existent tiddlers.
	const tiddlerMap =  this.getGlobalCache("cyoa-grouptiddlermap",function() {
		const groupMap = getCyoaGroupMap(self);
		const tiddlerMap = Object.create(null);
		$tw.utils.each(groupMap,function(titles,group) {
			for(var title in titles) {
				tiddlerMap[title] = group;
			}
		});
		return tiddlerMap;
	});
	return tiddlerMap[title];
};

/*
Returns an array of titles.  If no group is specified, the default group is assumed.
*/
exports.getTiddlersInCyoaGroup = function(set) {
	return getCyoaGroupMap(this)[set || defaultPageSet] || Object.create(null);
};

var computing = false;

/*
Returns a map of { "groupTitle" => [titles...] }
*/
function getCyoaGroupMap(wiki) {
	return wiki.getGlobalCache("cyoa-groupmap",function() {
		if(computing == true) {
			return Object.create(null);
		}
		computing = true;
		try {
			return getGroupsMap(wiki);
		} finally {
			computing = false;
		}
	});
};

/*
Returns map of groups, whose values are maps of tiddler titles, who values are the tiddlers.
{"default": {"tiddlerA": A, ...}, ...}
*/
function getGroupsMap(wiki) {
	var pageMap = wiki.getCyoaPageMap();
	var groups = wiki.getCyoaGroups();
	var results = Object.create(null);
	results[defaultPageSet] = Object.create(null);
	for(var group in groups) {
		results[group] = Object.create(null);
	}
	wiki.each(function(tiddler,title) {
		var key = tiddler.fields[pageSetField];
		if(key && !tiddler.isDraft()) {
			if(!results[key]) {
				utils.warn("Page set '"+key+"' specified in tiddler '"+title+"' does not exist.");
				key = defaultPageSet;
			}
			results[key][title] = tiddler;
		}
	});
	for(var page in pageMap) {
		var tracks = wiki.getTiddlerTracks(page);
		for(var index = 0; index < tracks.length; index++) {
			var title = tracks[index];
			var tiddler = wiki.getTiddler(title);
			if(tiddler && !tiddler.isDraft() && !tiddler.fields[pageSetField] && !tiddler.fields.title.startsWith(pageSetPrefix)){
				results[defaultPageSet][title] = tiddler;
			}
		}
	};
	return results;
};
