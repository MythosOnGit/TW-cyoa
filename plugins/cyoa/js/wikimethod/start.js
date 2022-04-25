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
		var startPage = null;
		var cfg = wiki.getTiddler("$:/config/mythos/cyoa/start");
		if(cfg && $tw.utils.hop(cfg.fields,"text")
		&& !(cfg.fields.text==="" || cfg.fields.text.length===0)){
			startPage = cfg.getFieldString("text");
		} else {
			var def = wiki.getTiddler("$:/DefaultTiddlers");
			if(def && $tw.utils.hop(def.fields,"text")
			&& !(def.fields.text==="" || def.fields.text.length===0)){
				var filter = def.getFieldString("text");
				var options = wiki.filterTiddlers(filter);
				for(var index = 0; index < options.length; index++) {
					if(wiki.isCyoaPage(options[index])) {
						startPage = options[index];
						break;
					}
				}
			}
		}
		return startPage;
	});
};

