/*\
title: $:/plugins/mythos/cyoa/js/snippets/only.js
type: application/javascript
module-type: cyoasnippets

Handles the "only" field and attribute.

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var utils = require("$:/plugins/mythos/cyoa/js/utils.js")

var prettyStrings = {
	first: "''First time only''",
	visited: "''On later visits only''",
	never: "''Only never''",
};

exports["if"] = function(tiddler,widget,options) {
	var value = widget.attributes.only;
	if(prettyStrings[value]) {
		var page = tiddler.fields.title;
		if(!widget.hasVariable("cyoa-render","yes")) {
			return prettyStrings[value];
		} else if(value === "never") {
			// Special case. "Never" pages don't need to be a part of any group, because they don't need tracking to know not to test true
			return "0";
		} else {
			return utils.getGroupScript(page,value,options.wiki);
		}
	}
};
