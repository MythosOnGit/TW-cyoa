/*\
title: test/cyoa/uriManager.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa uriManager Class.

\*/

var Manager = require("cyoa").UriManager;
var TestWindow = require("./mock/window.js");

function parse(uri,expectedState,expectedHash) {
	var testWindow = new TestWindow();
	testWindow.setUri(uri);
	var manager = new Manager(testWindow);
	expect(manager.getState()).withContext("Incorrect state").toBe(expectedState);
	expect(manager.getPage()).withContext("Incorrect page").toBe(expectedHash);
}

function write(state,page,expectedUri,manager) {
	manager.onpageturn = null;
	manager.pushState(state,page);
	var uri = manager.location.search + manager.location.hash;
	expect(uri).toBe(expectedUri);
}

function write5(state,page,expectedUri,manager) {
	manager = manager || new Manager(new TestWindow())
	manager.html5 = true;
	write(state,page,expectedUri,manager);
}
function write4(state,page,expectedUri,prevUri,manager) {
	prevUri = prevUri || "";
	manager = manager || new Manager(new TestWindow())
	manager.window.setUri(prevUri);
	manager.html5 = false;
	write(state,page,expectedUri,manager);
}

describe("UriManager",function() {
	it("selects html5 parsing when it can",function() {
		var m = new Manager(new TestWindow());
		expect(m.html5).toBe(true);
		write("val=5","Page","?val=5#Page",m);
	});

	it("parses html5 uris",function() {
		parse("?val=5&car=2#Page","val=5&car=2","Page");
		parse("?val=5&car=2","val=5&car=2","");
		parse("#Page","","Page");
		parse("#","","");
		parse("","","");
	});

	it("parses html4 uris",function() {
		parse("#?val=5&car=2?Page","val=5&car=2","Page");
		parse("#?val=5&car=2","val=5&car=2","");
		parse("#Page","","Page");
		parse("#","","");
		parse("","","");
	});

	it("parses polluted html4 uris",function() {
		parse("?bad=w#?val=5&car=2?Page","val=5&car=2","Page");
		parse("?bad=w#?val=5&car=2","val=5&car=2","");
		parse("?bad=w#??Page","","Page");
		parse("?bad=w#?","","");
		parse("?bad=w#","bad=w","");
	});

	it("writes html 5",function() {
		write5("val=5&car=2","Page","?val=5&car=2#Page");
		write5("val=5&car=2","","?val=5&car=2#");
		write5("","Page","#Page");
		write5("","","#");
	});

	it("writes html 4",function() {
		write4("val=5&car=2","Page","#?val=5&car=2?Page");
		write4("val=5&car=2","","#?val=5&car=2");
		write4("","Page","#Page");
		write4("","","");
	});

	function flip4(state,page,expectedUri,prevUri) {
		// First try this.
		var manager = new Manager(new TestWindow())
		write4(state,page,expectedUri,prevUri,manager);
		// THEN flip.
		manager.window.setUri(prevUri);
		manager.html5 = false;
		manager.pushState(state,page);
		expect(manager.getState()).toBe(state);
		expect(manager.getPage()).toBe(page);
	}

	it("writes html 4 to polluted uri",function() {
		var pltnCP = "?bad=w&evil=5#BADPAGE";
		var pltnC = "?bad=w&evil=5";
		flip4("val=5&car=2","Page",pltnC + "#?val=5&car=2?Page",pltnCP);
		flip4("val=5&car=2","",pltnC + "#?val=5&car=2",pltnCP);
		flip4("","Page",pltnC + "#??Page",pltnCP);
		flip4("","",pltnC + "#?",pltnCP);
	});

	it("doesn't expect a hash",function() {
		write5("var=5","Page","?var=5#Page");
		write4("var=5","Page","#?var=5?Page");
	});
});
