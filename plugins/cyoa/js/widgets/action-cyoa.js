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
	checkStatus(this);
	this.makeChildWidgets();
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
ActionWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(checkStatus(this) || $tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
ActionWidget.prototype.invokeAction = function(triggeringWidget,event) {
	switch(this.job) {
		case "commit":
			this.wiki.commitCyoaGroups();
			// Set the state flag to not-dirty
			this.wiki.addTiddler({title: dirtyStateTiddler,text: "no"});
			break;
		case "clear":
			this.wiki.clearCyoaGroups();
			break;
		case "checkStatus":
		default:
			return false;
	}
	return true;
};

function checkStatus(widget) {
	if(widget.job === "checkStatus") {
		// This action is the one that updates the state tiddler
		var wasDirty = widget.wiki.getTiddlerText(dirtyStateTiddler,"yes") === "yes";
		if(!wasDirty) {
			// If it is currently dirty...
			if(widget.wiki.commitCyoaGroups(true)) { // true = dryRun
				widget.wiki.addTiddler({title: dirtyStateTiddler,text: "yes"});
				return true;
			}
		}
	}
	return false;
};

exports["action-cyoa"] = ActionWidget;
