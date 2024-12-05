/*\
title: $:/plugins/mythos/cyoa/js/logic/imply.js
type: application/javascript
module-type: cyoalogic

This handles the tracking estimating for imply

\*/

"use strict";

var logic = require("../logic");

exports.tracks = function(widget,tiddler) {
	if(widget.attributes.imply) {
		var list = $tw.utils.parseStringArray(widget.attributes.imply);
		list.push(tiddler.fields.title);
		return list;
	}
	return undefined;
};

// We don't produce any `if` snippets, but we do need to remember this page.
exports.if = function(widget,tiddler) {
	if(widget.attributes.page && tiddler.fields['cyoa.imply']) {
		logic.rememberTrackedTiddler(widget.wiki,tiddler.fields.title);
	}
};
