/*\
title: $:/plugins/mythos/cyoa/js/wikimethod/group.js
type: application/javascript
module-type: wikimethod

Wikimethods regarding getting page sets, and getting all pages in a set.

\*/

const pageSetField = "cyoa.group";
const defaultPageSet = "$:/plugins/mythos/cyoa/groups/default";

var Record = require("$:/plugins/mythos/cyoa/js/groupHandlers/record.js");

exports.getCyoaDefaultGroup = function() { return defaultPageSet; };

/*
This writes any new tracked pages to the cyoa ledgers. There isn't much need to call this manually outside of the testing framework.
Generating a CYOA does this automatically (assuming versioning is on).
*/
exports.commitCyoaGroups = function() {
	// Render the entire body, so all tracked pages have a chance to declare themselves.
	var output = this.renderTiddler("text/vnd.tiddlywiki", "$:/plugins/mythos/cyoa/compile/body",{variables:{'cyoa-render':'yes'}});
	// then we run the macro which actually generates and commits the records.
	$tw.macros['cyoa-data'].run.call({wiki: this}, true);
}

exports.getCyoaGroupVariable = function(title,field) {
	// This exists, instead of always having it be cyoa.key, so that the filter operator can know what the placeholder would be if the key wasn't set. Otherwise TW can thrash whenever the Variable field is updated.
	field = field || "cyoa.key";
	var tiddler = this.getTiddler(title);
	var key = tiddler && tiddler.fields[field] || title.substr(title.lastIndexOf("/")+1);
	return key.replaceAll(/[^a-zA-Z_]/g, "");
};

/*
Returns group for given tiddler.
The information returend by this is approximate.
It's not used during compiling, only for tiddlerInfo and TiddlyMap.
*/
exports.getTiddlerCyoaGroup = function(title) {
	var tiddler = this.getTiddler(title);
	// No tiddler, no group.
	if(!tiddler || tiddler.isDraft()) {
		return undefined;
	}
	if(tiddler.fields[pageSetField]) {
		return tiddler.fields[pageSetField];
	}
	// If it didn't specify a group, we must check and see if it's in the default group.
	// Returns a map of { "tiddlerA" => "groupName", ... }
	var wiki = this;
	var groupMap = this.getGlobalCache('cyoa-defaultgroup', function() {
		var results = Object.create(null);
		var pageMap = wiki.getCyoaPageMap();
		// Collect together undeclared default tiddlers from crawling pages
		for(var page in pageMap) {
			var tracks = wiki.getTiddlerTracks(page);
			for(var index = 0; index < tracks.length; index++) {
				var title = tracks[index];
				var tiddler = wiki.getTiddler(title);
				if(tiddler
				&& !tiddler.isDraft()
				&& !tiddler.hasField(pageSetField)
				&& !tiddler.hasTag("$:/tags/cyoa/Type")){
					results[title] = defaultPageSet;
				}
			}
		};
		// If there is a record, use that to fill out any straggling titles
		var defaultRecord = new Record(wiki,defaultPageSet);
		defaultRecord.forEachEntry(function(entry) {
			if(entry.title) {
				results[entry.title] = defaultPageSet;
			}
		});
		return results;
	});
	return groupMap[title];
};
