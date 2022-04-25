/*\
title: $:/plugins/mythos/cyoa/js/snippets/append.js
type: application/javascript
module-type: cyoasnippets

This specifies that filter expressions in field "cyoa.append" will be used
to create an append list. It's the built in way to specify appended pages.

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var utils = require("$:/plugins/mythos/cyoa/js/utils");

exports.append = function(tiddler,widget,options) {
	if(widget.page) {
		var filterStr = tiddler.getFieldString("cyoa.append");
		if(filterStr) {
			var appendList = options.wiki.filterTiddlers(filterStr+ " +[!has[draft.of]]",widget);
			return utils.filterNonPageTiddlers(appendList,widget,"$cyoa widget appends non-page tiddler");
		}
	}
	return undefined;
};
