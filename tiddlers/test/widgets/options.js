/*\
title: test/widgets/options.js
type: application/javascript
tags: $:/tags/test-spec

Tests the <$options> and <$conversation> widgets

These tests rely on the tiddlers in "tiddlywiki/tiddlers/options"

\*/

describe("widget: $options",function() {


/*
Don't remove these includes, even though we don't use them. They test to make sure they can be loaded multiple times without fucking up, which has been an issue before.
*/
require("$:/plugins/mythos/cyoa/js/widgets/options");
var CyoaWidget = require("$:/plugins/mythos/cyoa/js/widgets/cyoa").cyoa;
var utils = require("test/utils.js");

function defaultWiki() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
	// Default. Normal behavior
	{title: "options/A",tags: "testOptions","cyoa.caption": "Opt A"},
	// Default, but repeatable
	{title: "options/B",tags: "testOptions $:/tags/cyoa/repeatable","cyoa.caption": "Opt B"},
	// Default form, but draft that should be ignored
	utils.draft({title: "options/A",tags: "testOptions","cyoa.caption": "Opt A"}),
	// Template to render the options
	{title: "options/template",text: "# If\n# <$link to=<<currentTiddler>>>Item: <<currentTiddler>></$link>"}]);
	return wiki;
};

var filter = "[tag[testOptions]sort[]]";
var filterAttr = " filter='"+filter+"' ";
var template = "options/template";
var templateAttr = " template='"+template+"' ";

	function testNoTemplate(text,expectedTag,expectedAText) {
		var wiki = defaultWiki();
		wiki.addTiddler({title: "Main",text: text});
		var node = utils.renderTiddler(wiki,"Main");
		var infoNodes = removeInfo(node);
		var states = node.getElementsByClassName("cyoa-state");
		var encoded2 = encodeURIComponent("options/B");
		expect(states.length).toBe(2);
		for(var i=0; i<states.length; i++) {
			expect(states[i].tagName.toLowerCase()).toBe(expectedTag.toLowerCase());
		}
		expect(infoNodes[0].textContent).toBe("Depends on: options/A");
		// equivalent to query: ".cyoa-state a"
		var links = [];
		$tw.utils.each(states,function(state) {
			links.push.apply(links,state.getElementsByTagName("a"));
		});
		expect(links.length).toBe(2);
		expectedAText = expectedAText || "Opt A";
		expect(links[0].textContent.trim()).toBe(expectedAText);
		expect(links[1].textContent.trim()).toBe(expectedAText.replace("A","B"));
		expect(links[1].getAttribute("href")).toBe("#"+encoded2);
		return node;
	};

	// All cyoa-state elemetns have info inside them. Remove them all.
	function removeInfo(node) {
		var states = node.getElementsByClassName("cyoa-state");
		var infoNodes = [];
		$tw.utils.each(states,function(state) {
			if (state.firstElementChild.classList.contains('cyoa-info')) {
				infoNodes.push(state.firstElementChild);
				state.removeChild(state.firstElementChild);
			}
		});
		return infoNodes;
	};

	it("handles 'all' attribute correctly",function() {
		var text = "<$options all "+filterAttr+" />";
		var wiki = defaultWiki();
		var node = utils.renderText(wiki,text);
		var states = node.getElementsByClassName("cyoa-state");
		expect(states.length).toBe(2);
		expect(states[0].getAttribute("data-depend")).toBeFalsy();
	});

	it("works inline without template or block",function() {
		var text = "<$options "+filterAttr+" />";
		testNoTemplate(text,"SPAN");
	});

	it("works using unsafe elements",function() {
		var text = "<$options "+filterAttr+" tag='script' />";
		testNoTemplate(text,"SPAN");
	});

	it("works as block without template or block",function() {
		var text = "<$options "+filterAttr+" />\n\n";
		testNoTemplate(text,"P");
	});

	it("works as <li> list without template or block",function() {
		var text="<ul>\n\n<$options "+filterAttr+" tag=li/>\n\n</ul>";
		var node = testNoTemplate(text,"LI");
		expect(node.getElementsByTagName("li").length).toBe(2);
	});

	it("works with block as inline",function() {
		var text = "<$options" + filterAttr + ">\n" +
		           " <$link to=<<currentTiddler>>>\n" +
		           "  Link to <<currentTiddler>>\n" +
		           " </$link>\n" +
		           "</$options>";
		testNoTemplate(text,"SPAN","Link to options/A");
	});

	it("works with block as block",function() {
		var text = "<$options" + filterAttr + ">\n\n" + // two newlines
		           " <$link to=<<currentTiddler>>>\n" +
		           "  Link to <<currentTiddler>>\n" +
		           " </$link>\n" +
		           "</$options>";
		testNoTemplate(text,"DIV","Link to options/A");
	});

	it("works with template attribute as inline",function() {
		var text = "<$options " + filterAttr + templateAttr + " />";
		testNoTemplate(text,"SPAN","Item: options/A");
	});

	it("works with template attribute as block",function() {
		var text = "<$options " + filterAttr + templateAttr + " />\n\n";
		testNoTemplate(text,"DIV","Item: options/A");
	});

	it("handles titles with spaces",function() {
		utils.warnings(spyOn);
		var core = utils.testBook([[
			{title: "Main",text: "<$options/>\n"},
			{title: "has space",tags: "Main"}]])
		expect(utils.warnings()).not.toHaveBeenCalled();
		var main = core.document.getElementById("Main")
		var links = main.getElementsByTagName("a")
		expect(links.length).toBe(1);
		expect(links[0].parentNode.getAttribute("data-depend")).toBe("has%20space");
		expect(links[0].getAttribute("href")).toBe("#has%20space");
	});

	it("handles non-existent tiddlers passed by filter",function() {
		utils.warnings(spyOn);
		var core = utils.testBook([[
			{title: "Main",text: "<$options filter=grapefruit/>\n"}]])
		expect(utils.warnings()).toHaveBeenCalledTimes(1);
		var message = utils.warnings().calls.argsFor(0)[0];
		expect(message).toBe("Page 'Main': $cyoa widget depend includes non-page tiddler 'grapefruit'");
	});

	it("handles non-page tiddlers passed by filter",function() {
		utils.warnings(spyOn);
		var core = utils.testBook([[
			{title: "Main",text: "<$options filter='$:/sysTiddler'/>\n"},
			{title: "$:/sysTiddler",text: "text"}]])
		expect(utils.warnings()).toHaveBeenCalledTimes(1);
		var message = utils.warnings().calls.argsFor(0)[0];
		expect(message).toBe("Page 'Main': $cyoa widget depend includes non-page tiddler '$:/sysTiddler'");
	});

	it("doesn't issues warnings when it's not cyoa-rendering",function() {
		var wiki = new $tw.Wiki();
		wiki.addTiddler({title: "Main",text: "<$options filter=apple />"});
		utils.warnings(spyOn);
		wiki.renderTiddler("text/html","Main");
		expect(utils.warnings()).not.toHaveBeenCalled();
	});

	it("uses title as text when cyoa.caption missing",function(){
		const wiki = new $tw.Wiki();
		wiki.addTiddler({title: "no/tags"});
		var doc = utils.renderText(wiki,"<$options filter='no/tags' />");
		removeInfo(doc);
		var list = doc.getElementsByTagName("a");
		expect(list.length).toBe(1);
		var a = list[0];
		expect(a.getAttribute("href")).toBe("#no%2Ftags");
		expect(a.textContent).toBe("no/tags");
	});

	it("resorts to using tagging if no filter is given",function() {
		var wiki = new $tw.Wiki();
		wiki.addTiddlers([
			{title:"A",text:"",tags:"target"},
			{title:"B",text:"",tags:"target","list-before":"A"},
			{title:"C",text:"",tags:"target"},
			utils.draft({title:"C",text:"",tags:"target"}),
			{title:"D",text:"",tags:"target"},
			{title:"E",text:"",tags:"target exclude"},
			{title:"$:/config/mythos/cyoa/page-filter",text:"[all[]] -[tag[exclude]]"},
			{title:"target",text: "<$options>\n",list: "D"}]);
		var doc = utils.renderTiddler(wiki,"target");
		removeInfo(doc);
		expect(doc.documentElement.textContent).toBe("DBAC");
	});

	it("resorts to using list if tagging not given",function() {
		var wiki = new $tw.Wiki();
		wiki.addTiddlers([
			{title:"A",text:""},
			{title:"B",text:"","list-before":"A"},
			{title:"C",text:""},
			{title:"D",text:"",tags:"exclude"},
			// Ignore drafts
			utils.draft({title: "E",tags: "target"}),
			{title:"$:/config/mythos/cyoa/page-filter",text:"[all[]] -[tag[exclude]]"},
			{title:"target",text: "<$options>\n",list: "A B C D"}]);
		var doc = utils.renderTiddler(wiki,"target");
		removeInfo(doc);
		expect(doc.documentElement.textContent).toBe("ABC");
	});

	it("can list options for another tiddler",function() {
		var wiki = new $tw.Wiki();
		wiki.addTiddlers([
			{title:"A"},{title:"B"},{title:"C"},
			{title:"target",text: "<$options tiddler=list />",list: "B"},
			{title:"list",list: "A C"}]);
		var doc = utils.renderTiddler(wiki,"target");
		removeInfo(doc);
		expect(doc.documentElement.textContent).toBe("AC");
	});

	it("can list options from within the draft tiddler",function() {
		var wiki = new $tw.Wiki();
		wiki.addTiddlers([
			{title:"A",tags:"target"},
			{title:"B",tags:"target"},
			{title:"target",text: "<$options/>\n"},
			utils.draft({title:"target",text: "<$options/>\n"})]);
		var doc = utils.renderTiddler(wiki,"Draft of 'target'");
		removeInfo(doc);
		expect(doc.documentElement.textContent).toBe("AB");
	});

	it("embeds weight into options",function() {
		var core = utils.testBook([
			{title: "A","cyoa.weight": "5"},
			{title: "B"},
			{title: "C","cyoa.weight": "1000"},
			{title: "Main",text: "<$cyoa class=wrapper index=5>\n\n<$options filter='A B C' />\n"}])
		var wrapper = core.document.getElementsByClassName("wrapper")[0];
		var active = wrapper.getElementsByClassName("cyoa-active")[0];
		expect(active.textContent).toBe("B");
	});

	// I'm not actually sure I want this behavior. It could confuse end users, and it's simple enough to exclude in each use case.
	// This behavior now occurs when option filters aren't specified
	it("ignores options excluded from build",function() {
		const wiki = new $tw.Wiki();
		wiki.addTiddlers([
			{title: "options/included",tags: "main"},
			{title: "options/excluded",tags: "main"},
			{title: "main",text: "<$options />"},
			{title: "$:/config/mythos/cyoa/page-filter",text: "[all[]] -[[options/excluded]]"}]);
		var node = utils.renderTiddler(wiki,"main");
		var states = node.getElementsByClassName("cyoa-state");
		expect(states.length).toBe(1);
		expect(states[0].firstElementChild.textContent).toBe("Depends on: options/included");
	});
});
