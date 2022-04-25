/*\
description: string(e.g. tiddlerA,tiddlerB)
title: $:/plugins/mythos/cyoa/js/groupHandlers/styles/string.js
type: application/javascript
module-type: cyoagrouphandlerstyle

\*/

exports.name = "string";

exports.getIdFor = function(groupHandler,page,index) {
	var filter = groupHandler.data.filter,
		wiki = groupHandler.wiki;
	if(!filter) {
		return page;
	} else {
		if(groupHandler.compiledIdFilter === undefined) {
			groupHandler.compiledIdFilter = wiki.compileFilter(filter);
		}
		return groupHandler.compiledIdFilter.call(wiki,[page])[0] || "";
	}
};
