/*\
title: $:/plugins/mythos/cyoa/js/logic/exclude.js
type: application/javascript
module-type: cyoalogic

This handles the tracking estimation for exclude

\*/

"use strict";

var logic = require("../logic");

exports.tracks = function(widget,tiddler) {
	if(widget.attributes.exclude) {
		// If this is in an exclusion group, it must be tracked.
		return tiddler.fields.title;
	}
};

// We don't produce any `if` snippets, but we do need to remember this page.
exports.if = function(widget,tiddler) {
	if(widget.attributes.exclude) {
		logic.rememberTrackedTiddler(widget.wiki,tiddler.fields.title);
	}
};
