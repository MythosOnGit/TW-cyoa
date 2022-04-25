/*\
title: $:/plugins/mythos/cyoa/js/wikimethod/default.js
type: application/javascript
module-type: wikimethod

Wikimethods that gets the default page a cyoa will show on a missing page
given the tiddlywiki's configuration.

\*/

exports.getCyoaDefaultPage = function() {
	var wiki = this;
	return this.getGlobalCache("cyoa-defaultpage",function() {
		var config = wiki.getTiddler("$:/config/mythos/cyoa/default");
		if(config && $tw.utils.hop(config.fields,"text")
		&& !(config.fields.text==="" || config.fields.text.length===0)) {
			return config.getFieldString("text");
		}
		return wiki.getCyoaStartPage();
	});
};

