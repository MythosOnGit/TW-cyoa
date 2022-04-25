/*\
title: test/wikimethods/start.js
type: application/javascript
tags: $:/tags/test-spec

Tests the getCyoaStartPage wiki method.

\*/

var startConfig = "$:/config/mythos/cyoa/start";
var defaultTiddlersConfig = "$:/DefaultTiddlers";

describe("wikimethod: start",function() {

function test(tiddlers,expected) {
	var wiki = new $tw.Wiki()
	wiki.addTiddlers(tiddlers);
	var output = wiki.getCyoaStartPage();
	expect(output).toBe(expected);
};

it("with start config",function() {
	test([{title: startConfig,text: "target"}],"target");
});

/*
Uses the tiddlywiki's default tiddlers if $:/config/mythos/cyoa/start empty.
*/
it("missing or blank start config",function() {
	test([
		{title: defaultTiddlersConfig,text: "[[Dash board]]"},
		{title: "Dash board"}],
	           "Dash board");
	test([
		{title: startConfig,text: ""},
		{title: defaultTiddlersConfig,text: "[[Dash board]]"},
		{title: "Dash board"}],
	           "Dash board");
});

it("no start and blank dashboard,expect null",function() {
	test([{title: defaultTiddlersConfig,text: ""}],null);
	test([],null);
});

it("missing start config multiple dashboards",function() {
	test([
		{title: defaultTiddlersConfig,text: "Dash Extra Options"},
		{title: "Extra"}],
	           "Extra");
	test([{title: defaultTiddlersConfig,text: "Dash Extra Options"}],null);
});

it("missing start config filter dashboards",function() {
	test([{title: defaultTiddlersConfig,text: "[[Dash]addsuffix[board]]"},
		{title: "Dashboard"}],
	           "Dashboard");
	test([{title: defaultTiddlersConfig,text: "[tag[nonexistent]]"},
		{title: "[tag[nonexistent]]"}],
	           null);
	test([{title: defaultTiddlersConfig,text: "[[Dash]addsuffix<currentTiddler>]"},
		{title: "Dash"}],
	           "Dash");
});

it("first DefaultTiddler option is not in page-filter",function() {
	test([
		{title: defaultTiddlersConfig,text: "Dashboard Start"},
		{title: "$:/config/mythos/cyoa/page-filter",text: "[!tag[exclude]]"},
		{title: "Dashboard",tags: "exclude"},
		{title: "Start",text: "Anything"}],"Start");
});

});
