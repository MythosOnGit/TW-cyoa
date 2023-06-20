/*\
title: test/utils.js
type: application/javascript
module-type: library

Test utilities for the cyoa tiddlywiki testing framework.

\*/

var utils = require("$:/plugins/mythos/cyoa/js/utils");
var Widget = require("$:/core/modules/widgets/widget").widget;
var MockWindow = require("test/cyoa/mock/window");
const domParser = require("test/dom-parser");
const Cyoa = require("cyoa");
const State = Cyoa.State;
const Core = Cyoa.Core;
const Book = Cyoa.Book;
const MockManager = require("test/cyoa/mock/manager");

/*
This prepares stateClasses with all the modules used as cyoa variables.
*/
exports.stateClasses = assignModulesOfType("state");
exports.cyoa = assignModulesOfType("cyoamethod");

function assignModulesOfType(type) {
	var output = Object.create(null);
	const stateClassModules = $tw.wiki.filterTiddlers("[all[shadows+tiddlers]field:cyoa.module-type["+type+"]]");
	for(var i = 0; i < stateClassModules.length; i++) {
		var module = require(stateClassModules[i]);
		for(var member in module) {
			output[member] = module[member];
		}
	}
	return output;
};

function cyoaRenderWidget(widget) {
	var container = $tw.fakeDocument.createElement("div");
	widget.render(container,null);
	return domParser.parseBodyAndHead(container.innerHTML);
};

/*
A shortcut to utils.warn for jasmine spy manipulation
*/
exports.warnings = function(spyOn) {
	return (spyOn !== undefined) ? spyOn(utils,"warn") : utils.warn;
};

exports.renderTiddler = function(wiki,title) {
	var parser = wiki.parseTiddler(title);
	var widgetNode = wiki.makeWidget(parser);
	widgetNode.setVariable("currentTiddler",title);
	return cyoaRenderWidget(widgetNode);
};

exports.renderText = function(wiki,text) {
	if(text === undefined) {
		text = wiki;
		wiki = $tw.wiki;
	}
	var parser = wiki.parseText("text/vnd.tiddlywiki",text);
	var widgetNode = wiki.makeWidget(parser);
	return cyoaRenderWidget(widgetNode);
};

exports.draft = function(fields) {
	const newFields = Object.assign({},fields);
	newFields.title = `Draft of '${fields.title}'`;
	newFields["draft.of"] = fields.title;
	newFields["draft.title"] = fields.title;
	return newFields;
};

exports.activeNodes = function(core) {
	var results = [];
	var actives = core.document.getElementsByClassName("cyoa-active");
	for(var i = 0; i < actives.length; i++) {
		var active = actives[i];
		if(active.id && active.id !== "Main") {
			results.push(decodeURIComponent(active.id));
		}
	}
	results.sort();
	return results;
};

exports.defaultGroup = function(handler,fields) {
	handler = handler || "set";
	fields = Object.assign({caption:"default","cyoa.style": "bitfield"},fields);
	return exports.group("$:/plugins/mythos/cyoa/groups/default",handler,fields);
};

exports.group = function(title,handler,fields) {
	const tiddler = Object.assign({title: title,type: "application/x-tiddler-dictionary",tags: "$:/tags/cyoa/Type"},fields);
	const indices = [];
	if(handler !== undefined) {
		tiddler["cyoa.handler"] = handler;
	}
	tiddler.text = indices.join("\n");
	return tiddler;
};

exports.testBook = function(tiddlerArrays,options) {
	options = options || {};
	const wiki = options.wiki || new $tw.Wiki();
	// Load in tiddlers we need to operate this test
	wiki.addTiddlers([
		$tw.wiki.getTiddler("$:/plugins/mythos/cyoa/templates/page"),
		$tw.wiki.getTiddler("$:/plugins/mythos/cyoa/templates/cyoaFile/pages"),
		$tw.wiki.getTiddler("$:/plugins/mythos/cyoa/templates/html-tiddler-inline"),
		{title: "$:/config/mythos/cyoa/start", text: "Main"}]);
	// Then load in tiddlers specific to this particular test
	for(var i = 0; i < tiddlerArrays.length; i++) {
		var tiddlers = tiddlerArrays[i];
		if(Array.isArray(tiddlers)) {
			wiki.addTiddlers(tiddlers);
			wiki.commitCyoaGroups();
		} else {
			wiki.addTiddler(tiddlers);
		}
	}

	// Create the actual book.
	var html = wiki.renderText("text/plain","text/vnd.tiddlywiki","\\define cyoa-render() yes\n\\rules only filteredtranscludeinline transcludeinline\n<div class='cyoa-content'>{{$:/plugins/mythos/cyoa/templates/cyoaFile/pages|| $:/plugins/mythos/cyoa/templates/html-tiddler-inline}}</div><div class='cyoa-footer'>{{$:/cyoaFooter|| $:/plugins/mythos/cyoa/templates/html-tiddler-inline }}</div>");
	var doc = domParser.parseBodyAndHead(html);
	var state = new State();
	// Generate the declarations for state
	var cyoa = Object.create(null);
	cyoa.stateClasses = exports.stateClasses;
	getGroupScript(wiki)(cyoa,function(){state.declare.apply(state,arguments)});
	// Declare any groups that exist in this tiddler
	var core = new Core(doc,state,new MockManager());
	core.cyoa = cyoa;
	// Open first the main page to touch stuff
	core.openPage("Main");
	return core;
};

function getGroupScript(wiki) {
	var template = $tw.wiki.getTiddlerText("$:/plugins/mythos/cyoa/js/cyoa/groups.js");
	var javascript = wiki.renderText("text/plain","text/vnd.tiddlywiki",template);
	return eval("(function(cyoa,declare){"+javascript+"})");
};

exports.testBookDefaultVar = function(tiddlerArrays,group,options) {
	group = group || "$:/plugins/mythos/cyoa/groups/default";
	var core = exports.testBook([{title: "Results",text: "<$list filter='[cyoa:group["+group+"]]'>\n\n<$cyoa after='[all[current]]' >\n\n<$text text=<<currentTiddler>> />\n\n</$cyoa></$list>\n"}].concat(tiddlerArrays),options);
	var rtn = {};
	rtn.state = (options && options.state) || core.state.serialize();
	core.manager.getState = () => rtn.state;
	// Now open results so the core will load the serialized state.
	core.openPage("Results");
	// Lets collect those results in the only way I can figure out how
	var elem = core.book.getPage("Results").element;
	rtn.results = [];
	for(var child = elem.firstElementChild; child; child = child.nextElementSibling) {
		if(child.classList.contains("cyoa-active")) {
			rtn.results.push(child.textContent);
		}
	}
	return rtn;
};

/*
Creates a test widget with a parent with assigned currentTiddler. In most cases, this will simply be called with one argument.
*/
exports.createWidget = function(currentTiddler,Type,attributes,options) {
	options = options || {};
	var parentWidget = new Widget({});
	parentWidget.setVariable("currentTiddler",currentTiddler);

	Type = Type || Widget;
	var attrs = this.createAttributesFromHash(attributes);
	if(options.isBlock) {
		attrs.isBlock = true;
	}
	var newOptions = Object.assign({wiki: $tw.wiki,parentWidget: parentWidget},options);
	return new Type(attrs,newOptions);
};

exports.createAttributesFromHash = function(hash) {
	var a = Object.create(null);
	for(var k in hash) {
		var value = hash[k];
		if(typeof value === "object") {
			// This test custom made its own value to specify type.
			a[k] = value;
		} else {
			a[k] = {type: "string",value: value};
		}
	}
	return {attributes: a};
}

exports.renderTiddlerToDom = function(title,options) {
	options = options || {};
	options.wiki = options.wiki || $tw.wiki;
	var parser = options.wiki.parseTiddler(title,options);
	var parentWidget = new Widget({});
	parentWidget.setVariable("currentTiddler",title);
	options.parentWidget = parentWidget;
	var widgetNode = options.wiki.makeWidget(parser,options);
	var container = $tw.fakeDocument.createElement("div");
	widgetNode.render(container,null);
	return container;
};

function getWindow(document) {
	if($tw.browser) {
		return window;
	} else {
		return new MockWindow(document);
	}
};

exports.keydown = function(core,key,keycode,code,attributes) {
	var w = getWindow(core.document);
	var init = Object.assign({view: w,bubbles: true,cancelable: true,key: key,keycode: keycode,code: code},attributes);
	// The most hackiest of hacks. This is because we use our own custom window, which maybe we don't have to do anymore given the new jsdom version
	var event = new w.KeyboardEvent("keydown",init);
	core.document.dispatchEvent(event);
	return event;
};

exports.click = function(core,elemId) {
	var elem = core.document.getElementById(elemId);
	var w = getWindow(core.document);
	var fakeEvent = new w.KeyboardEvent("click",{});
	core.clicked_link(new Cyoa.Link(core.book,elem),fakeEvent);
};

