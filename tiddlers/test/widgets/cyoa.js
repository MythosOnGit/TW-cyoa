/*\
title: test/widgets/cyoa.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa widget.

This test file is slowly replacing tiddlywiki/widgets/cyoa.js, because this
file doesn't care about the minutia like the other file does.

\*/

const utils = require("test/utils.js");
var MockWindow = require("test/cyoa/mock/window");
var Cyoa = require("cyoa");

describe("widget: $cyoa",function() {

function getWindow(document) {
	if($tw.browser) {
		return window;
	} else {
		return new MockWindow(document);
	}
};

function click(core,elemId) {
	var elem = core.document.getElementById(elemId);
	var w = getWindow(core.document);
	var fakeEvent = new w.KeyboardEvent("click",{});
	core.clicked_link(new Cyoa.Link(core.book,elem),fakeEvent);
};

function keydown(core,key,keycode,code,attributes) {
	var w = getWindow(core.document);
	var init = Object.assign({view: w,bubbles: true,cancelable: true,key: key,keycode: keycode,code: code},attributes);
	// The most hackiest of hacks. This is because we use our own custom window, which maybe we don't have to do anymore given the new jsdom version
	var event = new w.KeyboardEvent("keydown",init);
	core.document.dispatchEvent(event);
	return event;
};

function nodeIsActive(core,id) {
	return core.document.getElementById(id).classList.contains("cyoa-active");
};

it("can handle filters for tracking attributes",function() {
	var core = utils.testBook([[
		utils.group("default","set",{variable: "state"}),
		{title: "Main",text: `<$cyoa touch="A B" />
			<$cyoa id="X" after="A B">A and B</$cyoa>
			<$cyoa id="Y" after="A B C">all three</$cyoa>`},
		{title: "A"},{title: "B"},{title: "C"}]]);
	expect(nodeIsActive(core,"X")).toBe(true);
	expect(nodeIsActive(core,"Y")).toBe(false);
});

it("can touch, reset, after, and before through cyoa widget",function() {
	var core = utils.testBook([
		utils.group("default","set",{variable: "test"}),
		{title: "X"},{title: "Y"},
		{title: "Main",field: "X",text: `
			// Touch A, but also make sure filter's have currentTiddler set
			<$cyoa id=A touch="[all[current]get[field]]"/>
			<$cyoa id=B after="Y" />
			<$cyoa id=C before="Y" />
			<$cyoa id=D after="[all[current]get[field]]" />
			<$cyoa id=E before="[all[current]get[field]]" />
			<$cyoa id=F reset="[all[current]get[field]]" />
			<$cyoa id=G before="X" />
			// Let's just make sure blank after attrs don't break things
			<$cyoa id=H after="" before="" touch="" reset=""/>`}]);
	expect(utils.activeNodes(core)).toEqual(["A","C","D","F","G","H"]);
});

it("can touch, reset, after, and before through tiddler",function() {
	var core = utils.testBook([
		utils.group("default","set",{variable: "test"}),
		{title: "A"},{title: "B"},{title: "C"},{title: "D"},
		{title: "E"},{title: "F"},{title: "G"},{title: "H"},
		{title: "Main","cyoa.append": "W1 W2"},
		// test before and after
		{title: "W1","cyoa.before": "Main","cyoa.touch": "A"},
		{title: "W2","cyoa.after": "Main","cyoa.touch": "B","cyoa.reset": "Main","cyoa.append": "X1 X2"},
		{title: "X1","cyoa.after": "Main","cyoa.touch": "C"},
		{title: "X2","cyoa.before": "Main","cyoa.touch": "D Y1","cyoa.append": "Y1 Y2"},
		// Test first
		{title: "Y1","cyoa.only": "first","cyoa.touch": "E"},
		{title: "Y2","cyoa.only": "first","cyoa.touch": "F Z2","cyoa.append": "Z1 Z2"},
		// Test visited
		{title: "Z1","cyoa.only": "visited","cyoa.touch": "G"},
		{title: "Z2","cyoa.only": "visited","cyoa.touch": "H","cyoa.append": "cleanup"},
		// we cleanup because we want a predictable order of our test results.
		{title: "cleanup","cyoa.reset": "Y1 Y2 Z2"}]);
	expect(core.state.serialize()).toBe("test=B.D.F.H");
});


it("can use if, do, and done",function() {
	var core = utils.testBook([
		utils.group("default","set",{variable: "test"}),
		{title: "A"},{title: "B"},{title: "C"},{title: "D"},{title: "E"},{title: "F"},
		{title: "Main",
		 "cyoa.do": "test.v = 1",
		 "cyoa.done": "test.v *= 10",
		 "cyoa.append": "Main2 Main3",
		 text: `
			<$cyoa do="test.v *= 5" done="test.v += 3">
				<$cyoa if="test.v == 5" touch="A"/>
				<$cyoa if="test.v == 8" touch="B"/>
			</$cyoa>
			<$cyoa if="test.v == 5" touch="C"/>
			<$cyoa if="test.v == 8" touch="D"/>`},
		{title: "Main2","cyoa.if": "test.v === 100","cyoa.touch": "E"},
		{title: "Main3","cyoa.if": "test.v === 80","cyoa.touch": "F"},
	]);
	expect(core.state.serialize()).toBe("test=A.D.F");
});

it("handles write",function() {
	var core = utils.testBook([
		{title: "Main", text: `
			<$cyoa id=A write="'test' + 'content'"/>
			<$cyoa id=B write="""'Outer <em id="C">Extra inner</em>'"""/>
	`}]);
	var doc = core.document;
	expect(doc.getElementById("A").innerHTML).toBe("testcontent");
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
		["Page 'Main5': $cyoa widget appends non-page tiddler noexist"],
		["Page 'Main6': $cyoa widget appends non-page tiddler excluded"]]);
	expect(utils.activeNodes(core)).toEqual(["Main 4","Main3","Main5","Main6","Main7"]);
});

it("can index subwidgets",function() {
	var core = utils.testBook([
		utils.group("default","set",{variable: "test"}),
		{title: "A"},
		{title: "Main",formula: "1+1",text: `
			<$cyoa index={{!!formula}}>
				<$cyoa id="0" after="A" />
				<$cyoa id="1" />
				<$cyoa id="2" />
				<$cyoa id="3" />
				<$cyoa id="4" />
			</$cyoa>`}]);
	expect(utils.activeNodes(core)).toEqual(["3"]);
});

it("handles index weights",function() {
	var core = utils.testBook([
		{title: "Main",text: `<$cyoa index=3>
			<$cyoa id=A weight=3/>
			<$cyoa id=B/>
			<$cyoa id=C/>
		</$cyoa>`,"cyoa.append": "X Y Z","cyoa.index": "3"},
		{title: "X","cyoa.weight": "3"},
		{title: "Y"},
		{title: "Z"}]);
	expect(utils.activeNodes(core)).toEqual(["B","Y"]);
});

it("can perform onclick with or without destination",function() {
	// I put the stay link in the appended page to make sure it's not taking <<currentTiddler>> by mistake.
	var core = utils.testBook([[
		utils.group("test","set"),
		{title: "A","cyoa.group": "test"},{title: "B","cyoa.group": "test"},
		{title: "C","cyoa.group": "test"},{title: "D","cyoa.group": "test"},
		{title: "Main",text: "<$cyoa touch=A />","cyoa.append": "Main2"},
		{title: "Main2",text: "<$cyoa id=linkStay onclick touch=B />","cyoa.append": "Main3"},
		{title: "Main3",text: "<$cyoa id=linkGo onclick to=other touch=C />"},
		{title: "other",text: "<$cyoa touch=D />"}]]);
	expect(core.state.serialize()).toBe("test=A");
	click(core,"linkStay");
	expect(core.manager.getPage()).toBe("Main");
	expect(core.state.serialize()).toBe("test=A.B");
	click(core,"linkGo");
	expect(core.manager.getPage()).toBe("other");
	expect(core.state.serialize()).toBe("test=A.B.C.D");
});

it("executes onclick with replace flag properly",function() {
	// First, without the replace flag
	var core = utils.testBook([[
		utils.group("default","set",{variable: "test"}),
		{title: "A"},{title: "B"},
		{title: "C"},{title: "D"},
		{title: "E"},
		{title: "Main",text: "<$cyoa touch=A /><$cyoa id=link1 onclick touch=B to=second />"},
		{title: "second",text: "<$cyoa touch=C /><$cyoa id=link2 onclick replace touch=D to=third />"},
		{title: "third",text: "<$cyoa touch=E />"}]]);
	expect(core.state.serialize()).toBe("test=A");
	click(core,"link1");
	expect(core.state.serialize()).toBe("test=A.B.C");
	click(core,"link2");
	expect(core.state.serialize()).toBe("test=A.B.D.E");
});

it("can dynamically set the 'to' destination",function() {
	var core = utils.testBook([[
		utils.group("test","value"),
		{title: "confirmed","cyoa.group": "test"},
		{title:"Main",text:`<$cyoa id=link to=bad do='this.to="good page"' />`},
		{title: "bad"},{title: "good page","cyoa.touch": "confirmed"}]]);
	click(core,"link");
	expect(core.manager.getPage()).toBe("good page");
	expect(core.state.serialize()).toBe("test=confirmed");
});

it("can handle depends",function() {
	utils.warnings(spyOn);
	var core = utils.testBook([[
		{title: "$:/config/mythos/cyoa/page-filter",text: "[!tag[exclude]]"},
		{title: "false page","cyoa.if": "false"},
		{title: "true page","cyoa.if": "true"},
		{title: "excluded",tags: "exclude"},
		{title: "child","cyoa.depend":"[[false page]]"},
		{title: "Main","cyoa.append": "Main2 Main3",text: `
			<$cyoa id=A depend="[[false page]]" />
			<$cyoa id=B depend="[[true page]]" />
			<$cyoa id=C depend="[[true page]] [[false page]]" />
			<!-- Empty depends comes out true -->
			<$cyoa id=D depend="" />
			<!-- non existent pages issue warning -->
			<$cyoa id=E depend="noexist" />
			<!-- existing tiddlers that are not pages also issue warning -->
			<$cyoa id=F depend="excluded [[false page]]" />`},
		// depends works fine with tiddler-level $cyoa
		{title: "Main2","cyoa.depend": "[[false page]]"},
		// doesn't cache depend results. (child results can be accessed twice)
		{title: "Main3","cyoa.depend": "[[false page]] [[true page]]","cyoa.append": "Main4 Main5 Main6"},
		{title: "Main4","cyoa.depend": "child"},
		{title: "Main5","cyoa.depend": "child"},
		// Handles infinite loops which logically come out as false
		{title: "Main6","cyoa.append": "Main7 Main8"},
		{title: "Main7","cyoa.depend": "Main7-b [[false page]]"},
		{title: "Main7-b","cyoa.depend": "Main7"},
		// Handles infinite loops which logically come out as true
		{title: "Main8","cyoa.depend": "Main8-b [[true page]]"},
		{title: "Main8-b","cyoa.depend": "Main8"}]]);
	expect(utils.warnings().calls.allArgs()).toEqual([
		["Page 'Main': $cyoa widget depends on non-page tiddler noexist"],
		["Page 'Main': $cyoa widget depends on non-page tiddler excluded"]]);
	expect(utils.activeNodes(core)).toEqual(["B","C","D","E","Main3","Main6","Main8"]);
});

it("doesn't issue depend list warnings when not cyoa-rendering",function() {
	utils.warnings(spyOn);
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "Main",text: "<$cyoa depend='apple $:/sys' />"});
	wiki.renderTiddler("text/html","Main");
	expect(utils.warnings()).not.toHaveBeenCalled();
});

it("warns when tracking non-existent tiddler",function() {
	utils.warnings(spyOn);
	var core = utils.testBook([
		{title: "Main"},
		// it should test even if it isn't opened
		{title: "Main2","cyoa.before": "non-existent"}]);
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'Main2': before page 'non-existent' does not exist");
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
	expect(text).toContain("color: red");
	expect(text).toContain("--cyoa-info");
	expect(text).toContain("'First");

	// Test with no info, only style
	text = render("<$cyoa style='color: red'>Content</$cyoa>");
	expect(text).toContain("color: red");
	expect(text).not.toContain("--cyoa-info");

	// Test with info,  style, but no content
	text = render("<$first style='color: red'>  \n\t  </$first>");
	expect(text).toContain("color: red");
	expect(text).toContain("--cyoa-info");
	expect(text).toContain("'First");

	// Test that varioius types of constraints get pretty messages
});

it("displays nice messages for various constraints and actions",function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "Main",text: "<$tiddler tiddler=Main>\n\n<$cyoa only=first push=push depend=depend before=before after=after touch=touch reset=reset/>\n\n</$tiddler>"});
	var text = wiki.renderTiddler("text/html","Main");
	expect(text).toContain("First");
	expect(text).toContain("Pushes: 'push'");
	expect(text).toContain("Before: 'before'");
	expect(text).toContain("After: 'after'");
	expect(text).toContain("Touches: 'touch'");
	expect(text).toContain("Resets: 'reset'");
});

it("handles errors being thrown by snippet modules",function() {
	var tiddlers = [{title: "Main",text: "<$cyoa testThrow='error msg'/>\n"}];
	// Replaces widget body in Tiddlywiki
	var wiki = new $tw.Wiki();
	wiki.addTiddlers(tiddlers);
	var text = wiki.renderTiddler("text/html","Main");
	expect(text).toContain(">error msg</div>");
	//Throws error in Cyoa
	utils.warnings(spyOn);
	var core = utils.testBook(tiddlers);
	expect(utils.warnings()).toHaveBeenCalledWith("Error in tiddler 'Main': error msg");
});

it("executes nested onclick dos and dones in correct order",function() {
	var core = utils.testBook([[
		utils.group("test","value"),
		{title: "Main",text: `
			<$cyoa do="test.value = ''" />Set the value to simple string
			<$cyoa onclick do="test.value += 'b'" done="test.value += 'z'">
				<$cyoa do="test.value += 'a'" >
					<$cyoa onclick do="test.value += 'c'" done="test.value +='y'">
						<$cyoa id="link" onclick do="test.value += 'd'" done="test.value +='x'" to="other"/>
						<$cyoa onclick do="test.value += 'm'" done="test.value +='n'" to="other"/>
					</$cyoa>
				</$cyoa>
			</$cyoa>
		`},
		{title: "other"}]]);
	expect(core.state.serialize()).toBe("test=a");
	click(core,"link");
	expect(core.state.serialize()).toBe("test=abcdxyz");
});

it("executes touch and reset in specified order",function() {
	var core = utils.testBook([
		utils.group("default","set",{variable: "test"}),
		{title: "A1"},
			{title: "B1","cyoa.imply": "A1"},
			{title: "C1","cyoa.imply": "B1"},
			{title: "D1","cyoa.imply": "B1"},
		{title: "A2"},
			{title: "B2","cyoa.imply": "A2"},
			{title: "C2","cyoa.imply": "B2"},
			{title: "D2","cyoa.imply": "B2"},
		{title: "Main",text: `
			<$cyoa touch="C1 C2" />
			<$cyoa touch="D1" reset="B1" />
			<$cyoa reset="B2" touch="D2" />`}]);
	// the touch and reset are swapped on those last two, which should result in different outcomes.
	expect(core.state.serialize()).toBe("test=A1.D2");
});

it("can return to pushed pages",function() {
	// I put the test in an appended page to make sure it's not taking <<currentTiddler>> by mistake.
	var core = utils.testBook([[
		$tw.wiki.getCyoaGroups().stack,
		{title: "Main","cyoa.append": "Main2"},
		{title: "Main2",text: "<$cyoa id=link1 onclick push=Main to=menu />","cyoa.append": "Main3"},
		{title: "Main3",text: "<$cyoa id=link3 to=menu />"},
		{title: "defpage"},
		{title: "menu",text: "<$cyoa id=link2 to=defPage return>Return</$cyoa>"}]]);
	click(core,"link1");
	expect(core.manager.getPage()).toBe("menu");
	click(core,"link2");
	expect(core.manager.getPage()).toBe("Main");
	// Click 3 doesn't push a page, so the stack should be empty.
	click(core,"link3");
	click(core,"link2");
	expect(core.manager.getPage()).toBe("defPage");
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
	var event = keydown(core,"2",50,"Digit2");
	expect(core.manager.getPage()).toBe("Main2");
	expect(event.defaultPrevented).toBe(true);
	// The next tests confirms that numbering spans through appends
	var event = keydown(core,"4",52,"Digit4");
	expect(core.manager.getPage()).toBe("Main3");
	expect(event.defaultPrevented).toBe(true);
	// The next test confirms that out-of-range numbers aren't captured
	var event = keydown(core,"3",51,"Digit3");
	expect(core.manager.getPage()).toBe("Main3");
	expect(event.defaultPrevented).toBe(false);
	// The next confirms that modifier keys on autonumbers doesn't work
	$tw.utils.each(["ctrlKey","shiftKey","altKey","metaKey"],function(a) {
		var event = keydown(core,"1",49,"Digit1",{[a]: true});
		expect(event.defaultPrevented).toBe(false);
		expect(core.manager.getPage()).toBe("Main3");
	});
});

it("can take custom hotkeys",function() {
	var core = utils.testBook([[
		{title: "Main",text: "<$cyoa to=Main2 hotkey=c />"},
		{title: "Main2",text: "<$cyoa to=Main3 hotkey='w ArrowUp' />"},
		{title: "Main3"},
		{title: "$:/cyoaFooter",text: "<$cyoa to=Main4 hotkey=i />"},
		{title: "Main4"}
	]]);
	var event = keydown(core,"c",67,"KeyC");
	expect(core.manager.getPage()).toBe("Main2");
	expect(event.defaultPrevented).toBe(true);
	// multiple hotkeys can be assigned to one node
	var event = keydown(core,"ArrowUp",38,"ArrowUp");
	expect(core.manager.getPage()).toBe("Main3");
	expect(event.defaultPrevented).toBe(true);
	// hotkeys are accessable from the footer
	var event = keydown(core,"i",73,"KeyI");
	expect(core.manager.getPage()).toBe("Main4");
	expect(event.defaultPrevented).toBe(true);
});

it("can handle hotkeys with identical keys and code",function() {
	var core = utils.testBook([[
		{title: "Main",text: "<$cyoa to=Main2 hotkey=ArrowUp />"},
		{title: "Main2",text: "<$cyoa to=Main3 hotkey=ArrowUp />"},
		{title: "Main3"}]]);
	var event = keydown(core,"ArrowUp",38,"ArrowUp");
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
	var event = keydown(core,"c",67,"KeyC",{ctrlKey: true,altKey: true});
	expect(core.openPages).toEqual(["Main"]);
	expect(event.defaultPrevented).toBe(false);
	// works with ctrl
	var event = keydown(core,"c",67,"KeyC",{ctrlKey: true});
	expect(core.manager.getPage()).toBe("Main2");
	expect(event.defaultPrevented).toBe(true);
	// It also works with alt
	var event = keydown(core,"c",67,"KeyC",{altKey: true});
	expect(core.manager.getPage()).toBe("Main3");
	expect(event.defaultPrevented).toBe(true);
	// It also works with both
	var event = keydown(core,"c",67,"KeyC",{ctrlKey: true,altKey: true});
	expect(core.manager.getPage()).toBe("Main4");
	expect(event.defaultPrevented).toBe(true);
});

it("can take meta keys in any order",function() {
	var core = utils.testBook([[
		{title: "Main",text: "<$cyoa to=Main2 hotkey='alt-ctrl-c' />"},
		{title: "Main2",text: "<$cyoa to=Main3 hotkey='ctrl-alt-c' />"},
		{title: "Main3"},
	]]);
	var event = keydown(core,"c",67,"KeyC",{ctrlKey: true,altKey: true});
	expect(core.manager.getPage()).toBe("Main2");
	expect(event.defaultPrevented).toBe(true);
	// and in the other order
	var event = keydown(core,"c",67,"KeyC",{ctrlKey: true,altKey: true});
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
	var event = keydown(core,"c",67,"KeyC",{ctrlKey: true});
	expect(core.manager.getPage()).toBe("Main2");
	expect(event.defaultPrevented).toBe(true);
	// and in the other order
	var event = keydown(core,"d",68,"KeyD",{ctrlKey: true});
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
