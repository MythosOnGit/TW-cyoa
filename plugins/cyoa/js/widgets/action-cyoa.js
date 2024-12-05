/*\
title: $:/plugins/mythos/cyoa/js/widgets/action-cyoa.js
type: application/javascript
module-type: widget

Action widget for performing various cyoa actions.

\*/

var Widget = require("$:/core/modules/widgets/widget.js").widget;
const dirtyStateTiddler = "$:/state/mythos/cyoa/dirty";

var ActionWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ActionWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ActionWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	// Render children
	this.renderChildren(parent,nextSibling);
};

ActionWidget.prototype.execute = function() {
	this.job = this.getAttribute("$job");
	//this.wiki.commitCyoaGroups();
	this.makeChildWidgets();
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
ActionWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
ActionWidget.prototype.invokeAction = function(triggeringWidget,event) {
	this.wiki.commitCyoaGroups();
};

exports["action-cyoa"] = ActionWidget;
