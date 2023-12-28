/*\
title: $:/plugins/mythos/cyoa/js/widgets/options.js
type: application/javascript
module-type: widget

Options widget.
Inherits attrs: filter, emptyMessage, variable
Adds attrs: tag, all

``tag`` specifies what tag each block will be. Unspecified, it's div or a.
``all`` if set to a truthy value, will cause all options to render, regardless of whatever conditions are attached to them.

\*/
(function(){

"use strict";

var ListWidget = require("$:/core/modules/widgets/list.js").list;
var utils = require("../utils");

var OptionsWidget = function(parseTreeNode,options) {
	ListWidget.call(this,parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
OptionsWidget.prototype = Object.create(ListWidget.prototype);
OptionsWidget.prototype.constructor = OptionsWidget;

OptionsWidget.prototype.execute = function() {
	this.all = this.getAttribute("all");
	this.listTag = this.getAttribute("tag" /*,"span" or "a"*/);
	this.title = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	ListWidget.prototype.execute.call(this);
}

OptionsWidget.prototype.makeItemTemplate = function(title) {
	var tiddler = this.wiki.getTiddler(title),
		templateTree;

	if(this.template) {
		templateTree = [{
			type: "cyoa",
			attributes: this.stateAttributes(title,tiddler),
			children: [{
				type: "transclude",
				attributes: {tiddler: {
					type: "string",
					value: this.template}}}]}];
	} else if(this.hasChildren()) {
		templateTree = [{
			type: "cyoa",
			attributes: this.stateAttributes(title,tiddler),
			children: this.parseTreeNode.children
		}];
	} else {
		// Default template is a link using cyoa.caption
		templateTree = [{
			type: "cyoa",
			attributes:this.stateAttributes(title,tiddler),
			children: [{
				type: "link",
				attributes: { to: {
					type: "string",
					value: title}},
				children: [{
					type: "transclude",
					attributes: { field: {
						type: "string",
						value: "cyoa.caption"}},
					children: [{
						type: "text",
						text: title}]
				}]
			}]
		}];
	}
	return {
		type: "listitem",
		itemTitle: title,
		variableName: this.variableName,
		children: templateTree};
}

/*
argument tiddler is not used in this version, but override methods in conversation do.
*/
OptionsWidget.prototype.stateAttributes = function(title,tiddler) {
	// This version doesn't work, which means changes to cyoa.if will not properly update cyoa-lists.
	//var attrs ={"if":{type: "indirect",textReference: "cyoa.if"}};
	var attrs = {};
	var tiddler = this.wiki.getTiddler(title);
	if(!this.all) {
		attrs["depend"] = {type: "string",value: "[all[current]]"};
	}
	if(tiddler && tiddler.fields["cyoa.weight"]) {
		attrs["weight"] = {type: "string",value: tiddler.fields["cyoa.weight"]};
	}
	if(this.template) {
		var chosenTag = this.parseTreeNode.isBlock ? "div" : "span";
		attrs["tag"] = {type: "string",value: chosenTag};
	} else if(this.hasChildren()) {
		var chosenTag = this.parseTreeNode.isBlock ? "div" : "span";
		attrs["tag"] = {type: "string",value: chosenTag};
	} else {
		var chosenTag = this.parseTreeNode.isBlock ? "p" : "span";
		attrs["tag"] = {type: "string",value: chosenTag};
	}
	if(this.listTag && $tw.config.htmlUnsafeElements.indexOf(this.listTag) == -1) {
		attrs["tag"] = {type:  "string",value: this.listTag};
	}
	return attrs;
}

OptionsWidget.prototype.hasChildren = function() {
	return (this.parseTreeNode.children && this.parseTreeNode.children.length > 0);
}

OptionsWidget.prototype.getTiddlerList = function() {
	var filter = this.getAttribute("filter"),
		wiki = this.wiki;
	if(filter) {
		return wiki.filterTiddlers(filter + " +[!is[draft]]",this);
	} else {
		return utils.getOptionsList(this.title,wiki);
	}
}


/*
If <$options /> isn't refreshing properly, then it may be time to reimplement this, otherwise, let's hope the ListWidget implementation is enough
*/
//OptionsWidget.prototype.refresh = function(changedTiddlers) {

exports.options = OptionsWidget;

})();
