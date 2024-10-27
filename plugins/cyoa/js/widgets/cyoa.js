/*\
title: $:/plugins/mythos/cyoa/js/widgets/cyoa.js
type: application/javascript
module-type: widget

State widget

\*/
(function(){

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var utils = require("$:/plugins/mythos/cyoa/js/utils");
var snippets = require("$:/plugins/mythos/cyoa/js/logic");
const ATTRS = ["append","depend","if","do","done","write","index","weight","hotkey"];

var CyoaWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

exports.cyoa = CyoaWidget;

/*
Inherit from the base widget class
*/
CyoaWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
CyoaWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.domNode = this.createDomNode();
	parent.insertBefore(this.domNode,nextSibling);
	this.renderChildren(this.domNode,null);
	if(!this.compiling()) {
		if(this.domNode.childNodes.length <= 1) {
			// Make this a dedicated info node. This is because there's no easy way in CSS to tell if a node is empty (while also having an info element)
			// The length is tested against 1 because all nodes at least have an info node
			this.domNode.className += " cyoa-control";
		}
		this.infoNode = this.domNode.children[0];
		if(containsError(this.infoNode)) {
			// There's an error somewhere in info, make the infoNode itself errored so it can be more notifying.
			this.domNode.className += " cyoa-error";
		}
	}
	this.domNodes.push(this.domNode);
};

function containsError(node) {
	for(var index = 0; index < node.children.length; index++) {
		var child = node.children[index];
		if(child.nodeType === 1) { //ELEMENT_NODE
			if(child.className.indexOf("cyoa-error") >= 0
			|| containsError(child)) {
				return true;
			}
		}
	}
	return false;
};

CyoaWidget.prototype.createDomNode = function() {
	var tag = this.getTag();
	var domNode = this.document.createElement(tag);
	if(this.id) domNode.setAttribute("id",encodePageForID(this.id));
	domNode.className = this.getClassName();
	if(this.isLink() && tag === "a") {
		domNode.setAttribute("href",this.getLinkText());
	}
	if(this.style) {
		domNode.setAttribute("style",this.style);
	}
	for(var i in this.customAttributes) {
		domNode.setAttribute(i,this.customAttributes[i]);
	}
	if(this.compiling()) {
		$tw.utils.each(ATTRS,(attribute) => {
			if(this[attribute]) {
				domNode.setAttribute("data-"+attribute,this[attribute]);
			}
		});
	}
	return domNode;
};

CyoaWidget.prototype.makeInfoNode = function() {
	var array = [];
	if(this.caption) {
		array.push([
			{type: "element", tag: "strong", children: [{type: "text", text: "Caption: "}]},
			{type: "transclude", attributes: {"$field": {type: "string", value: "cyoa.caption"}}}]);
	}
	if(this.else) {
		array.push([{type: "element", tag: "strong", children: [{type: "text", text: "Else"}]}]);
	}
	array.push.apply(array,snippets.getInfoNodes(this));
	var br = {type: "element", tag: "br"};
	var children = array.length? array.reduce((result,x) => result.concat(br,x)): undefined;
	return {
		type: "element",
		tag: "span",
		attributes: {class: {type: "string", value: "cyoa-info"}},
		children: children};
};

CyoaWidget.prototype.compiling = function() {
	return this.getVariable("cyoa-render") === "yes";
};

CyoaWidget.prototype.getClassName = function() {
	var classes = this["class"] ? this["class"].split(" ") : [];
	if(!this.page) {
		classes.push("cyoa-state");
	}
	if(this.else) { classes.push("cyoa-else"); }
	if(this["return"]) { classes.push("cyoa-return"); }
	if(this["replace"]) { classes.push("cyoa-replace"); }
	if(this["onclick"]) { classes.push("cyoa-onclick"); }
	if(this.isLink()) {
		classes.push("tc-tiddlylink");
		if(this.isShadow) {
			classes.push("tc-tiddlylink-shadow");
		}
		if(this.isMissing && !this.isShadow) {
			classes.push("tc-tiddlylink-missing");
		} else if(!this.isMissing) {
			classes.push("tc-tiddlylink-resolves");
		}
	}
	if(this.noscript) {
		// Class should be visible without the presence of javascript
		classes.push("cyoa-active");
	}
	return classes.join(" ");
}

CyoaWidget.prototype.isLink = function() {
	if((this.replace || this.to || this["return"]) && (["p","div","span"].indexOf((this.stateTag || "").toLowerCase()) == -1)) {
		var wikiLinksMacro = this.getVariable("tv-wikilinks");
		return wikiLinksMacro ? (wikiLinksMacro.trim() !== "no") : true;
	}
	return false;
};

CyoaWidget.prototype.getTag = function() {
	var tag = this.parseTreeNode.isBlock ? "div" : "span";
	if(this.isLink()) {
		tag = "a";
	}
	if(this.stateTag &&
	   $tw.config.htmlUnsafeElements.indexOf(this.stateTag) === -1) {
		tag = this.stateTag;
	}
	return tag;
}

CyoaWidget.prototype.hasChildren = function() {
	return (this.parseTreeNode.children && this.parseTreeNode.children.length > 0);
}

CyoaWidget.prototype.makeContentTemplate = function(title) {
	return [{
		type: "transclude",
		attributes: {
			"field": {type: "string",value: "cyoa.caption"},
			"tiddler": {type: "string",value: title}
		}
	}]
}

/*
I'm not sure if I should be using the wikiLinkTemplate macro. I should disable it somehow if this is cyoa rendering.
*/
CyoaWidget.prototype.getLinkText = function() {
	var wikiLinkTemplateMacro = this.getVariable("tv-wikilink-template");
	var wikiLinkTemplate = wikiLinkTemplateMacro ? wikiLinkTemplateMacro.trim() : "#$uri_encoded$";
	var wikiLinkText = wikiLinkTemplate.replace("$uri_encoded$",encodePageForID(this.to));
	wikiLinkText = wikiLinkText.replace("$uri_doubleencoded$",encodePageForID(encodePageForID(this.to)));
	wikiLinkText = this.getVariable("tv-get-export-link",{params: [{name: "to",value: this.defaultTo}],defaultValue: wikiLinkText});
	return wikiLinkText;
}

/*
Compute the internal state of the widget
*/
CyoaWidget.prototype.execute = function() {
	// Get parameters from our attributes
	var currentTiddler = this.getVariable("currentTiddler");
	var tiddler = this.wiki.getTiddler(currentTiddler);
	this.page =      this.getAttribute("page");
	this.customAttributes = Object.create(null);
	for(var i in this.attributes) {
		if(i.startsWith("$")) {
			this.customAttributes[i.substring(1)] = this.attributes[i];
		}
	}
	this.to =        this.getAttribute("to") || "";
	this.defaultTo = this.to || currentTiddler;
	this.else =      this.getAttribute("else",this.else);
	this.noscript =  this.getAttribute("noscript");
	this["return"] = this.getAttribute("return");
	this["onclick"] =this.getAttribute("onclick");
	this["replace"] =this.getAttribute("replace");
	this.stateTag =  this.getAttribute("tag");
	this.caption =   this.getAttribute("caption");
	this["class"] =  this.getAttribute("class");
	this.id =        this.getAttribute("id");
	this.style =     this.getAttribute("style");

	if(this.onclick || this.to) {
		this.isMissing = !this.wiki.tiddlerExists(this.defaultTo);
		this.isShadow = this.wiki.isShadowTiddler(this.defaultTo);
	}
	var children;
	if(!this.hasChildren() && this.isLink()) {
		// Make up some children for this widget
		children = this.makeContentTemplate(this.defaultTo);
	} else if(this.parseTreeNode.children) {
		children = this.parseTreeNode.children.slice(0);
	} else {
		children = [];
	}
	if(!this.compiling()) {
		children.unshift(this.makeInfoNode());
	} else if (!this.page || tiddler) {
		// We're compiling, and everything looks fine
		// As in, we're a nameless node, or we're a page representing a tiddler.
		$tw.utils.each(ATTRS,(attribute) => {
			try {
				this[attribute] = snippets.getWidgetString(attribute,tiddler,this);
			} catch(e) {
				// We're compiling, so we'll log a warning message and proceed as best we can.
				utils.warnForTiddler(tiddler,e,{wiki: this.wiki});
			}
		});
	} else if(currentTiddler.indexOf("Error:") >= 0) {
		// The page itself is an error, probably from the filter
		utils.warn(currentTiddler);
	} else {
		utils.warnForTiddler(tiddler,"does not exist",{wiki: this.wiki});
	}
	this.makeChildWidgets(children);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
CyoaWidget.prototype.refresh = function(changedTiddlers) {
	// c = changed attributes
	var changedAttributes = this.computeAttributes();
	if($tw.utils.count(changedAttributes) > 0
	|| changedTiddlers[this.to]) {
		this.refreshSelf();
		return true;
	} else if(this.refreshChildren(changedTiddlers)) {
		// We might update the error state of the node if the info changed.
		this.domNode.classList.toggle('cyoa-error',containsError(this.infoNode));
		return true;
	}
	return false;
};

function encodePageForID(idStringOrArray) {
	function encode(idString) {
		return idString.split("%").join("%25").split(" ").join("%20")
	};
	if(typeof idStringOrArray === "string") {
		return encode(idStringOrArray);
	} else {
		return idStringOrArray.map(encode).join(" ");
	}
};


})();
