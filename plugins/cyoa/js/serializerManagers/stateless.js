/*\
title: $:/plugins/mythos/cyoa/js/serializerManagers/stateless.js
type: application/javascript
module-type: cyoaserializermanager

manager for state serialization. It's only job is to specify that no ledger is ever necessary.
\*/

exports.name = "stateless";
exports.keepRecord = false;

exports.init = function(wiki,data) {
	this.downTree = Object.create(null);
	this.wiki = wiki;
};

exports.amendRecord = function(entries) {
	for(var index = 0; index < entries.length; index++) {
		// Because the rule's entries are always fresh, no worry about title not being there.
		var title = entries[index].title;
		var impliers = this.wiki.findListingsOfTiddler(title,"cyoa.imply");
		if(impliers.length > 0) {
			this.downTree[title] = impliers;
		}
	}
};

exports.exportData = function(data) {
	data.downTree = this.downTree;
};
