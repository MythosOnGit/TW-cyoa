/*\
title: $:/plugins/mythos/cyoa/js/widgets/visited.js
type: application/javascript
module-type: widget-subclass

This creates shortcut widget $visited for self-referencing tracking attributes.

I.E.

<$cyoa visited /> can be written as <$visited>

\*/

exports.baseClass = "cyoa";

exports.name = "visited";

exports.constructor = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

exports.prototype = {
	_keyword: "visited",
	execute: function() {
		this.attributes.only = "visited";
		Object.getPrototypeOf(Object.getPrototypeOf(this)).execute.call(this);
	}
};
