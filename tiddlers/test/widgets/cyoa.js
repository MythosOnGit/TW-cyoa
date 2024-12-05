/*\
title: test/widgets/cyoa.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa widget.

This test file is slowly replacing tiddlywiki/widgets/cyoa.js, because this
file doesn't care about the minutia like the other file does.

\*/

const utils = require("test/utils.js");

describe("widget: $cyoa",function() {

it("handles multiple conditions on if",function() {
	// If multiple afters exist, we must make sure we test all of them, not just the last one, which can happen if the underlying conditionals are separated by ";" instead of "&&".
	var core = utils.testBook([
		utils.defaultGroup(),
		{title: "A"},{title: "B"},{title: "C"},
		{title: "Main", text: `<$cyoa touch=B/><$cyoa after="A B" touch=C/>`}
	]);
	expect(core.state.allVisited()).toEqual(["B"]);
});

it("handles write",function() {
	var core = utils.testBook([
		utils.defaultGroup(),
		{title: "A"},
		{title: "B"},
		{title: "Main",text: `
			<$cyoa touch="A"/>
			<$cyoa id=A write="'test ' + #{A} + #{B}"/>
			<$cyoa id=B write="""'Outer <em id="C">Extra inner</em>'"""/>
	`}]);
	var doc = core.document;
	expect(doc.getElementById("A").innerHTML).toBe("test truefalse");
	expect(doc.getElementById("B").innerHTML).toBe("Outer <em id=\"C\">Extra inner</em>");
	expect(doc.getElementById("C").innerHTML).toBe("Extra inner");
});

it("handles appends",function() {
	utils.warnings(spyOn);
	var core = utils.testBook([
		{title: "$:/config/mythos/cyoa/page-filter",text: "[!tag[exclude]]"},
		// Can jump to middle of a list of appends
		{title: "Main","cyoa.append": "Main2 Main3 [[Main 4]]"},
		{title: "Main2","cyoa.if": "false"},
		// Can handles titles with spaces
		{title: "Main3","cyoa.append": "[[Main 4]]"},
		// ignores drafts
		{title: "Main 4","cyoa.append": "[tag[X]]"},
		utils.draft({title: "Main5",tags: "X"}),
		// Non existent tiddlers give warnings
		{title: "Main5","cyoa.append": "noexist Main6",tags: "X"},
		// Non page tiddlers give warnings
		{title: "Main6","cyoa.append": "excluded Main7"},
		{title: "excluded",tags: "exclude"},
		// empty value raises no errors
		{title: "Main7","cyoa.append": ""}]);
	expect(utils.warnings().calls.allArgs()).toEqual([
		["Page 'Main5': append includes non-page tiddler 'noexist'"],
		["Page 'Main6': append includes non-page tiddler 'excluded'"]]);
	expect(utils.activeNodes(core)).toEqual(["Main 4","Main3","Main5","Main6","Main7"]);
});

it("handles append with circular dependency",function() {
	utils.warnings(spyOn);
	try {
		var core = utils.testBook([
			{title: "Main"},
			{title: "pageA","cyoa.append":"pageB"},
			{title: "pageB","cyoa.append":"pageA"},
			{title: "other"}]);
		fail("Expected cyoa story failure from no start page");
	} catch(err) {
		expect(utils.warnings().calls.allArgs()).toEqual([
			["Filter Error: Circular dependency detected within tiddlers: pageA, pageB"]]);
	}
});

it("can index subwidgets",function() {
	var core = utils.testBook([
		utils.defaultGroup(),
		{title: "A"},
		{title: "B"},
		{title: "C"},
		{title: "D"},
		{title: "Main",formula: "#{A}+#{B}+#{C}+#{D}",text: `
			<$cyoa touch="A B" />
			<$cyoa index={{!!formula}}>
				<$cyoa id="y" after="C" />
				<$cyoa id="x" after="C" />
				<$cyoa id="0" after="C" />
				<$cyoa id="1" />
				<$cyoa id="2" />
				<$cyoa id="3" />
				<$cyoa id="4" />
			</$cyoa>`}]);
	expect(utils.activeNodes(core)).toEqual(["3"]);
});

it("does not use page indexes for inner nodes",function() {
	var core = utils.testBook([
		{title: "Main","cyoa.index": 1, text: "<$cyoa id=A/><$cyoa id=B/>"}]);
	expect(utils.activeNodes(core)).toEqual(["A","B"]);
});

it("handles index with no options",function() {
	var core = utils.testBook([
		{title: "Main",text: `<$cyoa id=A index=3>
			<$cyoa id=B if=false />
		</$cyoa>`,"cyoa.append": "C","cyoa.index": "3"},
		{title: "C","cyoa.if": "false"}]);
	expect(utils.activeNodes(core)).toEqual(["A"]);
	// None to begin with
	core = utils.testBook([
		{title: "Main",text: `<$cyoa id=A index=3>
		</$cyoa>`,"cyoa.append": "","cyoa.index": "3"}]);
	expect(utils.activeNodes(core)).toEqual(["A"]);
});

it("can perform onclick with or without destination",function() {
	// I put the stay link in the appended page to make sure it's not taking <<currentTiddler>> by mistake.
	var core = utils.testBook([[
		utils.defaultGroup(),
		{title: "A"},{title: "B"},{title: "C"},{title: "D"},
		{title: "Main",text: "<$cyoa touch=A />","cyoa.append": "Main2"},
		{title: "Main2",text: "<$cyoa id=linkStay onclick touch=B />","cyoa.append": "Main3"},
		{title: "Main3",text: "<$cyoa id=linkGo onclick to=other touch=C />"},
		{title: "other",text: "<$cyoa touch=D />"}]]);
	expect(core.state.allVisited()).toEqual(["A"]);
	utils.click(core,"linkStay");
	expect(core.manager.getPage()).toBe("Main");
	expect(core.state.allVisited()).toEqual(["A","B"]);
	utils.click(core,"linkGo");
	expect(core.manager.getPage()).toBe("other");
	expect(core.state.allVisited()).toEqual(["A","B","C","D"]);
});

it("executes onclick with replace flag properly",function() {
	// First, without the replace flag
	var core = utils.testBook([[
		utils.defaultGroup("set",{"cyoa.serializer": "string"}),
		{title: "A"},{title: "B"},{title: "C"},{title: "D"},{title: "E"},
		{title: "Main",text: "<$cyoa touch=A /><$cyoa id=link1 onclick touch=B to=second />"},
		{title: "second",text: "<$cyoa touch=C /><$cyoa id=link2 onclick replace touch=D to=third />"},
		{title: "third",text: "<$cyoa touch=E />"}]]);
	expect(core.state.allVisited()).toEqual(["A"]);
	utils.click(core,"link1");
	expect(core.state.allVisited()).toEqual(["A","B","C"]);
	utils.click(core,"link2");
	expect(core.state.allVisited()).toEqual(["A","B","D","E"]);
});

it("can dynamically set the 'to' destination",function() {
	var core = utils.testBook([[
		utils.defaultGroup(),
		{title: "bad"},
		{title: "confirmed"},
		{title:"Main",text:`<$cyoa id=link to=bad do='this.to="good page"' />`},
		{title: "good page","cyoa.touch": "confirmed"}]]);
	utils.click(core,"link");
	expect(core.manager.getPage()).toBe("good page");
	expect(core.state.allVisited()).toEqual(["confirmed"]);
});

it("can have custom attributes",function() {
	var core = utils.testBook([
		{title: "Main",text:"<$cyoa id=A $data-test=value/>"}]);
	var elem = core.document.getElementById("A");
	expect(elem.getAttribute("data-test")).toBe("value");
});

it("can have custom style even given css info variable",function() {
	var text;
	function render(text) {
		var wiki = new $tw.Wiki();
		wiki.addTiddler({title: "Main",text: "<$tiddler tiddler=Main>" + text + "</$tiddler>"});
		return wiki.renderTiddler("text/html","Main");
	};

	// Test with info and style
	text = render("<$first style='color: red'>Content</$first>");
	expect(text).toMatch(/color: ?red/);
	expect(text).toContain("cyoa-info");
	expect(text).toContain("Only first");

	// Test with no info, only style
	text = render("<$cyoa style='color: red'>Content</$cyoa>");
	expect(text).toMatch(/color: ?red/);
	expect(text).toContain("cyoa-info");

	// Test with info,  style, but no content
	text = render("<$first style='color: red'>  \n\t  </$first>");
	expect(text).toMatch(/color: ?red/);
	expect(text).toContain("cyoa-info");
	expect(text).toContain("Only first");

	// Test that varioius types of constraints get pretty messages
});

it("displays nice messages for various constraints and actions",function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "Main",text: "<$tiddler tiddler=Main>\n\n<$cyoa only=first push=xpush depend=xdepend before=xbefore after=xafter touch=xtouch reset=xreset write='#{xwrite}' index='#{xindex}' weight='#{xweight}'/>\n\n</$tiddler>"});
	var text = wiki.renderTiddler("text/html","Main");
	expect(text).toContain("Only first");
	expect(text).toContain("xpush</a>");
	expect(text).toContain("xbefore</a>");
	expect(text).toContain("xafter</a>");
	expect(text).toContain("xtouch</a>");
	expect(text).toContain("xreset</a>");
	expect(text).toContain("xwrite</a>");
	expect(text).toContain("xindex</a>");
	expect(text).toContain("xweight</a>");
});

it("correctly identifies control nodes for proper info display",function() {
	function test(id, isControl, isBlock, info='') {
		var element = core.document.getElementById(id);
		expect(element.classList.contains("cyoa-control")).toBe(isControl, "Control Node");
		expect(element.localName).toBe(isBlock? "div": "span");
		var child = element.firstChild;
		expect(child.classList.contains("cyoa-info")).toBe(true);
		expect(child.localName).toBe("span");
		// Remove namespaces before testing, because we don't care about those.
		expect(child.innerHTML.replaceAll(/ xmlns="[^"]+"/g,'').replaceAll(/<br\/>/g,'<br>')).toBe(info);
		return element.innerHTML;
	};
	var core = utils.testBook([
		utils.defaultGroup(),
		{title: "Main",text: `\\define cyoa-render() no
			<$cyoa id=A />
			<$first else id=B />
			<$cyoa id=C></$cyoa>
			<$cyoa id=D><a href=#other>value</a></$cyoa>
			<$cyoa id=E>text content</$cyoa>
			<$cyoa id=F><$list filter=""></$list></$cyoa>
			<$cyoa id=G>

</$cyoa><$else id=H>

</$else><$cyoa id=I>

Block text
</$cyoa>
		`}]);
	//   ID   isCtrl, isBlock
	test("A", true,   false);
	test("B", true,   false, "<strong>Else</strong><br><strong>Only first time</strong>");
	// C should be a control node even though it's not self-closing
	test("C", true,   false);
	// Containing an element makes it a content node
	test("D", false,  false);
	// Containing text makes it a content node
	test("E", false,  false);
	// Containing widgets that evaluate to nothing turns it into a control
	test("F", true,   false);
	// G is a block control node that contains nothing.
	test("G", true,   true);
	// H is a block control node that contains two or more conditions.
	test("H", true,   true, "<strong>Else</strong>");
	//expect(get("H").innerHTML).toContain("</p><p>");
	// I is a block content node with no conditions
	test("I", false,  true);
});

it("executes nested onclick dos and dones in correct order",function() {
	var core = utils.testBook([[
		utils.group("test","stringmap"),
		{title: "value","cyoa.group": "test"},
		{title: "Main",text: `
			<$cyoa do="#{value} = ''" />Set the value to simple string
			<$cyoa onclick do="#{value} += 'b'" done="#{value} += 'z'">
				<$cyoa do="#{value} += 'START'" >
					<$cyoa onclick do="#{value} += 'c'" done="#{value} +='y'">
						<$cyoa id="link" onclick do="#{value} += 'd'" done="#{value} +='x'" to="other"/>
						<$cyoa onclick do="#{value} += 'm'" done="#{value} +='n'" to="other"/>
					</$cyoa>
				</$cyoa>
			</$cyoa>
		`},
		{title: "other"}]]);
	expect(core.state.serialize().test).toBe("value.START");
	utils.click(core,"link");
	expect(core.state.serialize().test).toBe("value.STARTbcdxyz");
});

it("can take auto-assigned number hotkeys",function() {
	var core = utils.testBook([[
		{title: "bad"},
		{title: "Main",text: `
			<$cyoa to="bad" />
			<$cyoa to="bad" if="false" />
			[[Other link|Main2]]`},
		{title: "Main2","cyoa.append": "Main2b",text: `
			[[bad]] [[bad]] [[bad]]`},
		{title: "Main2b",text: `[[Main3]]`},
		{title: "Main3",text: `[[bad]] [[bad]]`}
	]]);
	// Main tests that inactive links don't claim a number, and that basic pretty links do.
	var event = utils.keydown(core,"2",50,"Digit2");
	expect(core.manager.getPage()).toBe("Main2");
	expect(event.defaultPrevented).toBe(true);
	// The next tests confirms that numbering spans through appends
	var event = utils.keydown(core,"4",52,"Digit4");
	expect(core.manager.getPage()).toBe("Main3");
	expect(event.defaultPrevented).toBe(true);
	// The next test confirms that out-of-range numbers aren't captured
	var event = utils.keydown(core,"3",51,"Digit3");
	expect(core.manager.getPage()).toBe("Main3");
	expect(event.defaultPrevented).toBe(false);
	// The next confirms that modifier keys on autonumbers doesn't work
	$tw.utils.each(["ctrlKey","shiftKey","altKey","metaKey"],function(a) {
		var event = utils.keydown(core,"1",49,"Digit1",{[a]: true});
		expect(event.defaultPrevented).toBe(false);
		expect(core.manager.getPage()).toBe("Main3");
	});
});

it("can take custom hotkeys",function() {
	var core = utils.testBook([[
		{title: "Main",text: "<$cyoa to=Main2 hotkey=c />"},
		{title: "Main2",text: "<$cyoa to=Main3 hotkey='w ArrowUp' />"},
		{title: "Main3"},
		{title: "$:/tags/cyoa/Footer", tags: "$:/tags/cyoa/Layout", class: "cyoa-footer"},
		{title: "Footer",tags:"$:/tags/cyoa/Footer",text: "<$cyoa to=Main4 hotkey=i />"},
		{title: "Main4"}
	]]);
	var event = utils.keydown(core,"c",67,"KeyC");
	expect(core.manager.getPage()).toBe("Main2");
	expect(event.defaultPrevented).toBe(true);
	// multiple hotkeys can be assigned to one node
	var event = utils.keydown(core,"ArrowUp",38,"ArrowUp");
	expect(core.manager.getPage()).toBe("Main3");
	expect(event.defaultPrevented).toBe(true);
	// hotkeys are accessable from a footer
	var event = utils.keydown(core,"i",73,"KeyI");
	expect(core.manager.getPage()).toBe("Main4");
	expect(event.defaultPrevented).toBe(true);
});

it("can handle hotkeys with identical keys and code",function() {
	var core = utils.testBook([[
		{title: "Main",text: "<$cyoa to=Main2 hotkey=ArrowUp />"},
		{title: "Main2",text: "<$cyoa to=Main3 hotkey=ArrowUp />"},
		{title: "Main3"}]]);
	var event = utils.keydown(core,"ArrowUp",38,"ArrowUp");
	expect(core.manager.getPage()).toBe("Main2");
});

it("can take alt and ctrl hotkeys",function() {
	var core = utils.testBook([[
		{title: "Main",text: "<$cyoa to=Main2 hotkey='ctrl-c' />"},
		{title: "Main2",text: "<$cyoa to=Main3 hotkey='alt-c' />"},
		{title: "Main3",text: "<$cyoa to=Main4 hotkey='ctrl-alt-c' />"},
		{title: "Main4"},
		{title: "$:/cyoaFooter",text: "<$cyoa to=Main5 hotkey=c />"},
		{title: "Main5"}
	]]);
	// ctrl-alt doesn't trigger ctrl
	var event = utils.keydown(core,"c",67,"KeyC",{ctrlKey: true,altKey: true});
	expect(core.openPages).toEqual(["Main"]);
	expect(event.defaultPrevented).toBe(false);
	// works with ctrl
	var event = utils.keydown(core,"c",67,"KeyC",{ctrlKey: true});
	expect(core.manager.getPage()).toBe("Main2");
	expect(event.defaultPrevented).toBe(true);
	// It also works with alt
	var event = utils.keydown(core,"c",67,"KeyC",{altKey: true});
	expect(core.manager.getPage()).toBe("Main3");
	expect(event.defaultPrevented).toBe(true);
	// It also works with both
	var event = utils.keydown(core,"c",67,"KeyC",{ctrlKey: true,altKey: true});
	expect(core.manager.getPage()).toBe("Main4");
	expect(event.defaultPrevented).toBe(true);
});

it("can take meta keys in any order",function() {
	var core = utils.testBook([[
		{title: "Main",text: "<$cyoa to=Main2 hotkey='alt-ctrl-c' />"},
		{title: "Main2",text: "<$cyoa to=Main3 hotkey='ctrl-alt-c' />"},
		{title: "Main3"},
	]]);
	var event = utils.keydown(core,"c",67,"KeyC",{ctrlKey: true,altKey: true});
	expect(core.manager.getPage()).toBe("Main2");
	expect(event.defaultPrevented).toBe(true);
	// and in the other order
	var event = utils.keydown(core,"c",67,"KeyC",{ctrlKey: true,altKey: true});
	expect(core.manager.getPage()).toBe("Main3");
	expect(event.defaultPrevented).toBe(true);
});

/*
Not sure if I actually want to support both like this.
*/
it("can use key codes and key values",function() {
	var core = utils.testBook([[
		{title: "Main",text: "<$cyoa to=Main2 hotkey='ctrl-c' />"},
		{title: "Main2",text: "<$cyoa to=Main3 hotkey='ctrl-KeyD' />"},
		{title: "Main3"},
	]]);
	var event = utils.keydown(core,"c",67,"KeyC",{ctrlKey: true});
	expect(core.manager.getPage()).toBe("Main2");
	expect(event.defaultPrevented).toBe(true);
	// and in the other order
	var event = utils.keydown(core,"d",68,"KeyD",{ctrlKey: true});
	expect(core.manager.getPage()).toBe("Main3");
	expect(event.defaultPrevented).toBe(true);
});

it("assumes correct tag",function() {
	var core = utils.testBook([
		{title: "Main",text: `
			<$cyoa id=A/>

			<$cyoa id=B to=page/>

			<$cyoa id=C onclick/>

			<$cyoa id=D replace/>

			<$cyoa id=E replace onclick/>

			<$cyoa id=F tag=svg/>
		`,"cyoa.append": "Main_inline"},
		{title: "Main_inline",text: `
			<$cyoa id=G/>
			<$cyoa id=H to=page/>
			<$cyoa id=I onclick/>
			<$cyoa id=J replace/>
			<$cyoa id=K replace onclick/>
			<$cyoa id=L tag=svg/>
		`}]);
	var expectations = {
		A:"div",B:"a",C:"div",D:"a",E:"a",F:"svg",
		G:"span",H:"a",I:"span",J:"a",K:"a",L:"svg"};
	$tw.utils.each(expectations,function(expected,id) {
		var results = core.document.getElementById(id);
		expect(results.tagName.toLowerCase()).toBe(expected,id);
	});
});

});
