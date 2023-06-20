/*\
title: $:/plugins/mythos/cyoa/js/snippets/push.js
type: application/javascript
module-type: cyoasnippets

This condition allows for pages to be queued up to be returned to later on. Useful for interleaving pages, or to allow the storyflow to make a digression, and then get back on track later on.

The stack used by this condition can be manually manipulated with in order to create more exact behavior.

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var utils = require("$:/plugins/mythos/cyoa/js/utils.js");

var snippetPush = (variable,a) => (variable +".push("+utils.enquote(a)+")");

exports["do"] = function(tiddler,widget) {
	var target = widget.getAttribute("push");
	if(target) {
		if(widget.hasVariable("cyoa-render","yes")) {
			if(!widget.wiki.isCyoaPage(target)) {
				utils.warnForTiddler(tiddler,(widget.page ? "" : "widget-") + "pushed page '"+target+"' does not exist",{wiki: widget.wiki});
			} else {
				return snippetPush(getVar(widget),target);
			}
		} else {
			return "Pushes: " + utils.enlink(target);
		}
	}
};

function getVar(widget) {
	return widget.wiki.getTiddlerText("$:/config/mythos/cyoa/stack","stack");
};
