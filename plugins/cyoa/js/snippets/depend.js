/*\
title: $:/plugins/mythos/cyoa/js/snippets/depend.js
type: application/javascript
module-type: cyoasnippets

This specifies that filter expressions in field "cyoa.depend" will be used
to create a depend list. These are pages that must evaulate to true for
_this_ page to evaulate to true.
It's the built in way to specify dependency pages.

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var utils = require("$:/plugins/mythos/cyoa/js/utils");

exports.depend = function(tiddler,widget) {
	var filterStr = widget.getAttribute("depend");
	if(filterStr) {
		var dependList = $tw.wiki.filterTiddlers(filterStr+ " +[!has[draft.of]]",widget);
		return utils.filterNonPageTiddlers(dependList,widget,(!widget.page ? "$cyoa widget " : "") + "depends on non-page tiddler");
	}
	return undefined;
};
