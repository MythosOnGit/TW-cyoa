/*\
title: $:/plugins/mythos/cyoa/js/wikimethod/start.js
type: application/javascript
module-type: wikimethod

Wikimethods that gets the first page a cyoa will show given the tiddlywiki's
configuration.

\*/

exports.getCyoaStartPage = function() {
	var wiki = this;
	return this.getGlobalCache("cyoa-startpage",function() {
		return wiki.getTiddlerText("$:/config/mythos/cyoa/start")
		|| firstPageOf(defaultTiddlers(wiki), wiki);
	});
};

function defaultTiddlers(wiki) {
	return wiki.filterTiddlers(wiki.getTiddlerText("$:/DefaultTiddlers"));
};

function firstPageOf(options, wiki) {
	for(var index = 0; index < options.length; index++) {
		if(wiki.isCyoaPage(options[index])) {
			return options[index];
		}
	}
	return null;
};
