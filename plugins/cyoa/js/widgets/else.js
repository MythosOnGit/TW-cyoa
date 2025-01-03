/*\
title: $:/plugins/mythos/cyoa/js/widgets/else.js
type: application/javascript
module-type: widget-subclass

Else widget: Short hand for <$cyoa else></$cyoa>

\*/

"use strict";

exports.baseClass = "cyoa";

exports.name = "else";

exports.constructor = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

exports.prototype = {
	"else": true
};
