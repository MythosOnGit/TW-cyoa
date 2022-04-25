/*\
title: test/cyoa/mock/window.js
type: application/javascript
module-type: library

A mock window class which pretends like we're in a browser.
\*/

var MockHistory = require("./history");

function Window(document) {
	var loc = this.location = {
		search: "",
		hash: ""
	};
	this.document = document;
	loc.protocol = "http:";
	loc.host="www.site.com";
	loc.pathname="/path";
	this.history = new MockHistory(this);
};

Window.prototype.dummySite = function() {
	var loc = this.location;
	return loc.protocol + "//" + loc.host + loc.pathname;
};

Window.prototype.setUri = function(string) {
	var hash = string.indexOf("#");
	var loc = this.location;
	if(hash >= 0) {
		loc.hash = string.slice(hash);
		loc.search = string.slice(0,hash);
	} else {
		loc.hash = "";
		loc.search = string;
	}
};

Window.prototype.KeyboardEvent = MockKeyboardEvent;

function MockKeyboardEvent(typeArg,keyboardEventInit) {
	this.type = typeArg;
	this.bubbles = true;
	this.cancelable = true;
	this.isTrusted = true;
	this.defaultPrevented = false;
	for(var i in keyboardEventInit) {
		this[i] = keyboardEventInit[i];
	}
};

MockKeyboardEvent.prototype.preventDefault = function() {
	this.defaultPrevented = true;
};

module.exports = Window;
