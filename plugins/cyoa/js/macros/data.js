/*\
title: $:/plugins/mythos/cyoa/js/macros/data.js
type: application/javascript
module-type: macro

Returns the JSON data for all the groups.
\*/

exports.name = "cyoa-data"

exports.params = ["commit"];

exports.run = function(commit) {
	var obj = getCyoaGroupData(this.wiki,{commit: !!commit});
	return JSON.stringify(obj);
};

var Record = require("$:/plugins/mythos/cyoa/js/groupHandlers/record.js");
var utils = require("$:/plugins/mythos/cyoa/js/utils");
var defaultPageSet = "$:/plugins/mythos/cyoa/groups/default";

function getCyoaGroupData(wiki,options) {
	options = options || {};
	// We get the tiddlers we learned are tracked from generating. If this doesn't exist, then uh... make an empty list? That should never happen.
	var tracked = wiki.getGlobalCache("cyoa-tracked", function() { return Object.create(null); });
	var usedGroups = getGroupMap(wiki, tracked);
	var output = Object.create(null);
	for(var group in usedGroups) {
		var handler = getCyoaGroupHandler(wiki,group,usedGroups[group],options);
		if(handler && handler.groupData) {
			var key = wiki.getCyoaGroupVariable(group);
			var groupObj = output[key] = handler.groupData();
			groupObj.tracked = handler.entries.map(x => x.title);
			groupObj.title = group;
		}
	}
	return output;
};

/* Returns an object: {groupTitle: {pageTitle: pageTiddler, ...}, ...}
 * This information is based of what tiddler fields say, not the ledger.
 */
function getGroupMap(wiki, trackedPages) {
	var usedGroups = Object.create(null);
	wiki.each(function(tiddler,title) {
		var groupTitle = tiddler.fields['cyoa.group'] || (trackedPages[title] && defaultPageSet);
		// We don't track groups themselves. They have special behavior.
		if(groupTitle && !tiddler.hasTag('$:/tags/cyoa/Type')) {
			if(!usedGroups[groupTitle]) {
				var groupTiddler = wiki.getTiddler(groupTitle);
				if(!groupTiddler) {
					utils.warn("Page set '" + groupTitle + "' specified in tiddler '" + title + "' does not exist.");
					groupTitle = defaultPageSet;
					usedGroups[defaultPageSet] = usedGroups[defaultPageSet] || {};;
				} else if(!groupTiddler.hasTag("$:/tags/cyoa/Type")) {
					utils.warn("Page set '" + groupTitle + "' specified in tiddler '" + title + "' is not a group. Requires $:/tags/cyoa/Type tag.");
					groupTitle = defaultPageSet;
					usedGroups[defaultPageSet] = usedGroups[defaultPageSet] || {};;
				} else {
					usedGroups[groupTitle] = {};
				}
			}
			usedGroups[groupTitle][title] = tiddler;
		}
	});
	return usedGroups;
};

function getCyoaGroupHandler(wiki,group,pages,options) {
	var newHandler = new Record(wiki,group);
	if(!newHandler.update(pages)) {
		return undefined;
	}
	// Okay. Now that we've updated the record, lets pull out the pageMap
	if(options.commit || Record.versioningEnabled(wiki)) {
		newHandler.commit();
	}
	return newHandler;
};
