/*\
title: test/logic/imply.js
type: application/javascript
tags: $:/tags/test-spec

Type-generic tests for implications
\*/

const utils = require("test/utils.js");

describe("Logic: imply",function() {

// Full implication chains get tracked, even if they're not used and virtual
it("recognizes virtual pages as tracked down implication chain",function() {
	var core = utils.testBook([
		utils.defaultGroup(),
		{title: "$:/config/mythos/cyoa/page-filter", text: "[!tag[Virtual]]"},
		{title: "A", tags: "Virtual"},
		{title: "B", tags: "Virtual"},
		{title: "C", tags: "Virtual", "cyoa.imply": "A B"},
		{title: "Main", text: "<$cyoa touch=C/><$cyoa reset=C/>"}]);
	expect(core.state.allVisited()).toEqual(["A","B"]);
	expect(core.document.getElementsByClassName('cyoa-page').length).toBe(1);
});

// Full implication chains get tracked, even if they're not used and virtual
it("implication alone is enough to cause a page to be tracked",function() {
	var core = utils.testBook([
		utils.defaultGroup(),
		{title: "$:/config/mythos/cyoa/page-filter", text: "[!tag[Virtual]]"},
		{title: "Root", tags: "Virtual"},
		{title: "Main", "cyoa.imply": "Root"}]);
	expect(core.state.allVisited()).toEqual(["Main","Root"]);
	expect(core.document.getElementsByClassName('cyoa-page').length).toBe(1);
});

});
