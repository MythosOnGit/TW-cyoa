/*\
title: test/cyoa/uriManager.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa uriManager Class.

\*/

var savers = $tw.modules.applyMethods("cyoasaver");
var Manager = savers.uri;

var TestWindow = require("./mock/window.js");

function parse(uri,expectedPage,expectedState) {
	var testWindow = new TestWindow();
	testWindow.setUri(uri);
	var manager = new Manager(testWindow);
	expect(manager.getState()).withContext("Incorrect state").toEqual(expectedState);
	expect(manager.getPage()).withContext("Incorrect page").toBe(expectedPage);
}

function write(page,state,manager) {
	manager.onpageturn = null;
	manager.pushState(state,page);
	return manager.location.search + manager.location.hash;
}

function write5(page,state) {
	var manager = new Manager(new TestWindow())
	manager.html5 = true;
	return write(page,state,manager);
}

function write4(page,state) {
	var manager = new Manager(new TestWindow())
	manager.html5 = false;
	return write(page,state,manager);
}

describe("Uri saver",function() {

it("selects html5 parsing when it can",function() {
	var m = new Manager(new TestWindow());
	expect(m.html5).toBe(true);
	expect(write("Page",{val:"5"},m)).toBe("?val=5#Page");
});

it("parses html5 uris",function() {
	parse("?val=5&car=2#Page","Page",{val:"5",car:"2"});
	parse("?val=5&car=2","",{val:"5",car:"2"});
	parse("#Page","Page",{});
	parse("#","",{});
	parse("","",{});
});

it("parses html4 uris",function() {
	parse("#?val=5&car=2?Page","Page",{val:"5",car:"2"});
	parse("#?val=5&car=2","",{val:"5",car:"2"});
	parse("#Page","Page",{});
	parse("#","",{});
	parse("","",{});
});

it("parses polluted html4 uris",function() {
	parse("?bad=w#?val=5&car=2?Page","Page",{val:"5",car:"2"});
	parse("?bad=w#?val=5&car=2","",{val:"5",car:"2"});
	parse("?bad=w#??Page","Page",{});
	parse("?bad=w#?","",{});
	parse("?bad=w#","",{bad:"w"});
});

it("writes html 5",function() {
	expect(write5("Page",{val:"5",car:"2"})).toBe("?val=5&car=2#Page");
	expect(write5("",{val:"5",car:"2"})).toBe("?val=5&car=2#");
	expect(write5("Page",{})).toBe("#Page");
	expect(write5("",{})).toBe("#");
});

it("writes html 4",function() {
	expect(write4("Page",{val:"5",car:"2"})).toBe("#?val=5&car=2?Page");
	expect(write4("", {val:"5",car:"2"})).toBe("#?val=5&car=2");
	expect(write4("Page",{})).toBe("#Page");
	expect(write4("",{})).toBe("");
});

function flip4(page,state,expectedUri,prevUri) {
	// First try this.
	var manager = new Manager(new TestWindow())
	manager.window.setUri(prevUri);
	manager.html5 = false;
	expect(write(page,state,manager)).toBe(expectedUri);
	// THEN flip.
	manager.window.setUri(prevUri);
	manager.html5 = false;
	manager.pushState(state,page);
	expect(manager.getState()).toEqual(state);
	expect(manager.getPage()).toBe(page);
}

it("writes html 4 to polluted uri",function() {
	var pltnCPrev = "?bad=w&evil=5#BADPAGE";
	var pltnC = "?bad=w&evil=5";
	flip4("Page",{val:"5",car:"2"},pltnC + "#?val=5&car=2?Page",pltnCPrev);
	flip4("",{val:"5",car:"2"},pltnC + "#?val=5&car=2",pltnCPrev);
	flip4("Page",{},pltnC + "#??Page",pltnCPrev);
	flip4("",{},pltnC + "#?",pltnCPrev);
});

it("encodes and decodes page strings",function() {
	//encodeURIComponent: encodes all but: a-zA-Z0-9_.!~*'()-
	//html4 ids: /[a-zA-Z][a-zA-Z0-9_:.-]*/
	//html5 ids: /[^\s]+/
	//URI
	//  fragment    = *( pchar / "/" / "?" )
	//  pchar       = unreserved / ptc-encoded / sub-delims / ":" / "@"
	//  ureserved   = ALPHA / DIGIT / "-" / "." / "_" / "~"
	//  pct-encoded = "%" HEXDIG HEXDIG
	//  sub-delims  = "!"/ "$"/ "&"/ "'"/ "("/ ")"/ "*"/ "+"/ ","/ ";"/ "="
	//    or basically anything but: #^[]{}\"<> and raw %
	// because of html5 ids, we also forbid spaces.
	// because of the uri search requirements, we also forbid: "?", "&", "="
	// What we do differently from encodeURI:  $'/+,;
	var forbidden = "?&=#^[]{}\\ \"<>";
	function test(page,state) {
		var manager = new Manager(new TestWindow())
		manager.html5 = true;
		manager.onpageturn = null;
		manager.pushState({value: state},page);
		var uriState = manager.location.search;
		var startOfValue = uriState.indexOf("value=");
		expect(startOfValue).toBeGreaterThan(0);
		uriState = uriState.substr(startOfValue+6);
		var uriPage = manager.location.hash.substr(1);
		for(var c = 0; c < forbidden.length; c++) {
			expect(uriState).not.toContain(forbidden[c]);
			expect(uriPage).not.toContain(forbidden[c]);
		}
		expect(uriState).not.toMatch(/%[^0-9A-F]/);
		expect(uriPage).not.toMatch(/%.[^0-9A-F]/);
		expect(manager.getState().value).toBe(state);
		expect(manager.getPage()).toBe(page);
		return {state: uriState, page: uriPage};
	};
	test("","this with spaces%and%percents");
	var uri = test("path/to/interesting.jpg","state/with/slashes");
	// Slashes are allowed
	expect(uri.state).toContain('/');
	expect(uri.page).toContain('/');
	test("","anything?+something else=something&nothing");
	test(forbidden,forbidden);
});

});
