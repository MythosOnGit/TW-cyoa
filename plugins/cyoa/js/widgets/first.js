/*\
title: $:/plugins/mythos/cyoa/js/widgets/first.js
type: application/javascript
module-type: widget-subclass

This creates shortcut widget $first for self-referencing tracking attributes.

I.E.

<$cyoa first /> can be written as <$first>

\*/

exports.baseClass = "cyoa";

exports.name = "first";

exports.constructor = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

exports.prototype = {
	_keyword: "first",
	execute: function() {
		this.attributes.only = "first";
		Object.getPrototypeOf(Object.getPrototypeOf(this)).execute.call(this);
	}
};
