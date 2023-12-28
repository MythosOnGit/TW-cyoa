/*\
title: test/logic/declarations.js
type: application/javascript
tags: $:/tags/test-spec

\*/

const utils = require("test/utils.js");

describe("Logic: declarations",function() {

function nodeIsActive(core,id) {
	return core.document.getElementById(id).classList.contains("cyoa-active");
};

it("can touch, reset, after, and before through cyoa widget",function() {
	var core = utils.testBook([
		utils.defaultGroup(),
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

it("can handle filters for tracking attributes",function() {
	var core = utils.testBook([[
		utils.defaultGroup(),
		{title: "Main",text: `<$cyoa touch="A B" />
			<$cyoa id="X" after="A B">A and B</$cyoa>
			<$cyoa id="Y" after="A B C">all three</$cyoa>`},
		{title: "A"},{title: "B"},{title: "C"}]]);
	expect(nodeIsActive(core,"X")).toBe(true);
	expect(nodeIsActive(core,"Y")).toBe(false);
});

it("can touch, reset, after, and before through tiddler",function() {
	var core = utils.testBook([
		utils.defaultGroup("set",{"cyoa.serializer": "string", "cyoa.key":"test"}),
		{title: "A"},{title: "B"},{title: "C"},{title: "D"},
		{title: "E"},{title: "F"},{title: "G"},{title: "H"},
		{title: "I"},{title: "J"},
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
		{title: "Z2","cyoa.only": "visited","cyoa.touch": "H U2","cyoa.append": "U1 U2 cleanup"},
		// Test never
		{title: "U1","cyoa.only": "never","cyoa.touch": "I"},
		{title: "U2","cyoa.only": "never","cyoa.touch": "J"},
		// we cleanup because we want a predictable order of our test results.
		{title: "cleanup","cyoa.reset": "Y1 Y2 Z2"}]);
	expect(core.state.serialize(core.cyoa.vars)).toEqual({test: "B.D.F.H.U2"});
});

it("executes touch and reset in specified order",function() {
	var core = utils.testBook([
		utils.defaultGroup("set",{"cyoa.serializer": "string", "cyoa.key":"test"}),
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
	expect(core.state.serialize(core.cyoa.vars)).toEqual({test: "A1.D2"});
});

it("ignores macros when looking for tracking",function() {
	// We want to ignore macros in these cases because they're usually in loops, and currentTiddler isn't actually the current page.
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "Other", text: ""},
		{title: "Test", text: "<$cyoa after='Other'/>\n\n<$list filter='A B C'>\n\n<$cyoa after=<<currentTiddler>> />\n\n</$list>"}]);
	expect(wiki.getTiddlerTracks("Test")).toEqual(["Other"]);
});

it("warns when tracking non-existent tiddler",function() {
	utils.warnings(spyOn);
	var core = utils.testBook([
		{title: "Main"},
		// it should test even if it isn't opened
		{title: "Main2","cyoa.before": "non-existent"}]);
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'Main2': before page 'non-existent' does not exist");
});

it("displays errors when in tiddler mode",function() {
	utils.warnings(spyOn);
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "exists",text: "exists"});
	wiki.addTiddler({title: "Main",text: "<$cyoa after='exists A' before='B' >Content</$cyoa>"});
	var dom = utils.renderTiddler(wiki,"Main");
	expect(utils.warnings()).not.toHaveBeenCalled();
	var state = dom.getElementsByClassName("cyoa-state")[0];
	expect(state.className).toContain("cyoa-error");
	// Reaching into Info node
	var links = state.firstElementChild.getElementsByTagName("a");
	expect(links[0].className).not.toContain("cyoa-error");
	expect(links[1].className).toContain("cyoa-error");
	expect(links[2].className).toContain("cyoa-error");
});

it("properly links titles",function() {
	function testString(title) {
		const wiki = new $tw.Wiki();
		wiki.addTiddlers([
			{title: title},
			{title: "test",target: title,text: "\\procedure currentTiddler() test\n\\procedure target()" + title + "\n<$cyoa after='[<target>]' />\n"}]);
		var results = wiki.renderTiddler("text/plain","test");
		expect(results).toBe("After: " + title);
	};
	testString("Simple");
	testString("With [brackets]");
	testString("With [brackets] in middle");
	testString("With [[doubles]]");
	testString("With [[doubles]] in middle");
	testString("With 'apos'");
	testString("[[With]] 'apos'");
	testString("With \"quotes\"");
	testString("[[With]] \"quotes\"");
	testString("[[With]] \"quotes n' apos\"");
	// Duplication between brackets to make sure the filter attribute aren't removing duplicates
	testString("With]With]]With] \"quotes n' apos\"");
});

});
