/*\
title: $:/plugins/mythos/cyoa/js/logic/relationships.js
type: application/javascript
module-type: cyoalogic

This handles some aspects of imply and exclude

\*/

"use strict";

exports.tracks = function(widget,tiddler) {
	var list = [];
	if(widget.attributes.imply) {
		list.push(tiddler.fields.title);
		var implicationString = widget.attributes.imply;
		$tw.utils.pushTop(list,$tw.utils.parseStringArray(implicationString));
	}
	if(widget.attributes.exclude) {
		// If this is in an exclusion group, it must be tracked.
		$tw.utils.pushTop(list,tiddler.fields.title);
	}
	return list;
};
