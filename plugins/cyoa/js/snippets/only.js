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
	visited: "''On later visits only''"
};

exports["if"] = function(tiddler,widget,options) {
	var value = widget.attributes.only;
	if(prettyStrings[value]) {
		var page = tiddler.fields.title;
		if(widget.hasVariable("cyoa-render","yes")) {
			return utils.getGroupScript(page,value,options.wiki);
		} else {
			return prettyStrings[value];
		}
	}
};
