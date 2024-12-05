/*\
title: test/logic/exclude.js
type: application/javascript
tags: $:/tags/test-spec

\*/

const utils = require("test/utils.js");

describe("Logic: exclude",function() {

// Being in an exclusion group is cause enough to be tracked.
it("recognizes pages as tracked if in exclusion",function() {
	var core = utils.testBook([
		utils.defaultGroup(),
		{title: "Other","cyoa.exclude": "X"},
		{title: "Main","cyoa.exclude": "X"}]);
	expect(core.state.allVisited()).toEqual(["Main"]);
});

});
