/*\
title: $:/plugins/mythos/cyoa/js/logic/depend.js
type: application/javascript
module-type: cyoalogic

This specifies that filter expressions in field "cyoa.depend" will be used
to create a depend list. These are pages that must evaulate to true for
_this_ page to evaulate to true.
It's the built in way to specify dependency pages.

\*/

"use strict";

var utils = require("$:/plugins/mythos/cyoa/js/utils");

exports.infoTree = function(widget) {
	var filterStr = widget.getAttribute("depend");
	if(filterStr) {
		return [[
			{type: "text", text: "Depends on: "},
			{type: "list", attributes: {
					filter: {type: "string", value: filterStr + " +[!has[draft.of]]"},
					join: {type: "string", value: " or "}},
				children: [
					{type: "link", attributes: {
							class: {type: "filtered", filter: "[all[current]!cyoa:page[]then[cyoa-error]]"}}}]}]];
	}
};

exports.depend = function(widget,tiddler) {
	var filterStr = widget.getAttribute("depend");
	if(filterStr) {
		return widget.wiki.filterTiddlers(filterStr+ " +[!has[draft.of]]",widget);
	}
};
