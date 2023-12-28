/*\
title: $:/plugins/mythos/cyoa/js/logic/append.js
type: application/javascript
module-type: cyoalogic

This specifies that filter expressions in field "cyoa.append" will be used
to create an append list. It's the built in way to specify appended pages.

\*/

"use strict";

var utils = require("$:/plugins/mythos/cyoa/js/utils");

exports.append = function(widget,tiddler) {
	if(widget.page) {
		var filterStr = tiddler.getFieldString("cyoa.append");
		if(filterStr) {
			return widget.wiki.filterTiddlers(filterStr+ " +[!has[draft.of]]",widget);
		}
	}
};
