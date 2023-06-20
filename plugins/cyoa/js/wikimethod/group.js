/*\
title: $:/plugins/mythos/cyoa/js/wikimethod/group.js
type: application/javascript
module-type: wikimethod

Wikimethods regarding getting page sets, and getting all pages in a set.

\*/

const utils = require("$:/plugins/mythos/cyoa/js/utils");
const pageSetField = "cyoa.group";
const defaultPageSet = "$:/plugins/mythos/cyoa/groups/default";

var Handler = require("$:/plugins/mythos/cyoa/js/groupHandlers/handler.js");
const groupModules = $tw.modules.createClassesFromModules("cyoagrouphandler",null,Handler);

exports.getCyoaDefaultGroup = function() { return defaultPageSet; };

/*
Returns an array of all group titles.
*/
exports.getCyoaGroups = function() {
	const self = this;
	return this.getGlobalCache("cyoa-groups",function() {
		const groups = Object.create(null),
			array = self.getTagMap()["$:/tags/cyoa/Type"];
		// The default Group currently has that tag too, so it doesn't have to be added explicitly
		if(array) {
			for(var index = 0; index < array.length; index++) {
				var title = array[index];
				groups[title] = self.getTiddler(title);
			}
		}
		return groups;
	});
};

exports.getCyoaGroupHandler = function(group) {
	var wiki = this;
	return this.getGlobalCache("cyoa-group-" + group,function() {
		if(group === undefined) {
			return undefined;
		}
		var groupTiddler = wiki.getTiddler(group);
		var handler = groupTiddler.fields["cyoa.handler"];
		var Module = groupModules[handler];
		if(Module === undefined) {
			var message = (handler)?
				("Group Handler '"+handler+"' for group '"+group+"' does not exist."):
				("Group '"+group+"' does not specify a group handler.");
			utils.warn("GroupHandler warning: "+message);
			return undefined;
		}
		var data = Object.create(groupTiddler.fields);
		data.handler = handler;
		data.style = groupTiddler.fields["cyoa.style"];
		var tiddlers = wiki.getTiddlersInCyoaGroup(group);
		var newHandler = new Module();
		newHandler.init(wiki,group,data,tiddlers);
		return newHandler;
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
		changed = changed || handler.changed;
		if(!dryRun) {
			handler.commit(this)
		} else if(changed) {
			// Since we're not changing anything, we might as well break.
			break;
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

exports.getCyoaGroupVariable = function(title,field) {
	var tiddler = this.getTiddler(title);
	var key = (field && tiddler && tiddler.fields[field]) || title.substr(title.lastIndexOf("/")+1);
	key = key.replaceAll(/[^a-zA-Z_]/g, "");
	try {
		// This is not a security risk because key can only be alpha characters by now.
		eval("var " + key + "=1");
	} catch {
		key = "_" + key;
	}
	return key;
};

exports.getCyoaGroupData = function() {
	var groups = this.getCyoaGroups();
	var output = Object.create(null);
	for(var group in groups) {
		var handler = this.getCyoaGroupHandler(group);
		if(handler && handler.groupData) {
			var key = this.getCyoaGroupVariable(group,"cyoa.key");
			output[key] = handler.groupData();
		}
	}
	return output;
};

/*
Returns group for given tiddler.
*/
exports.getTiddlerCyoaGroup = function(title) {
	const self = this;
	var tiddler = this.getTiddler(title);
	// No tiddler, no group.
	if(!tiddler || tiddler.isDraft()) {
		return undefined;
	}
	if(tiddler.fields[pageSetField]) {
		var group = tiddler.fields[pageSetField];
		var groupTiddler = this.getTiddler(group);
		if(groupTiddler === undefined) {
			utils.warn("Page set '"+group+"' specified in tiddler '"+title+"' does not exist.");
			return undefined;
		}
		if(!groupTiddler.hasTag("$:/tags/cyoa/Type")) {
			utils.warn("Page set '"+group+"' specified in tiddler '"+title+"' is not actually a group. It lacks the necessary $:/tags/cyoa/Type tag.");
			return undefined;
		}
		return group;
	}
	// If it didn't specify a group, we must check and see if it's in the default group.
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
	var results = Object.create(null);
	results[defaultPageSet] = Object.create(null);
	wiki.each(function(tiddler,title) {
		var key = tiddler.fields[pageSetField];
		if(key && !tiddler.isDraft()) {
			results[key] = results[key] || Object.create(null);
			results[key][title] = tiddler;
		}
	});
	for(var page in pageMap) {
		var tracks = wiki.getTiddlerTracks(page);
		for(var index = 0; index < tracks.length; index++) {
			var title = tracks[index];
			var tiddler = wiki.getTiddler(title);
			if(tiddler && !tiddler.isDraft() && !tiddler.hasField(pageSetField) && !tiddler.hasTag("$:/tags/cyoa/Type")){
				results[defaultPageSet][title] = tiddler;
			}
		}
	};
	return results;
};
