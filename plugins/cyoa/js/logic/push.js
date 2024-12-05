/*\
title: $:/plugins/mythos/cyoa/js/logic/push.js
type: application/javascript
module-type: cyoalogic

This condition allows for pages to be queued up to be returned to later on. Useful for interleaving pages, or to allow the storyflow to make a digression, and then get back on track later on.

The stack used by this condition can be manually manipulated with in order to create more exact behavior.

\*/

"use strict";

var utils = require("$:/plugins/mythos/cyoa/js/utils.js");

exports.infoTree = function(widget) {
	var target = widget.getAttribute("push");
	if(target) {
		return [[
			{type: "element", tag: "strong", children: [{type: "text", text: "Pushes: "}]},

			{type: "tiddler", attributes: {
					tiddler: {type: "string", value: target}},
				children: [{type: "link", attributes: { class: {type: "filtered", filter: "[all[current]!cyoa:page[]then[cyoa-error]]"}}}]}]];
	}
};

exports.push = function(widget,tiddler) {
	var target = widget.getAttribute("push");
	if(target) {
		if(target !== 'true' && !widget.wiki.isCyoaPage(target)) {
			utils.warnForTiddler(tiddler,(widget.page ? "" : "$cyoa widget ") + "pushes non-page tiddler '"+target+"'",{wiki: widget.wiki});
		} else {
			return target;
		}
	}
};
