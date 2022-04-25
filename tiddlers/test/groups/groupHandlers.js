/*\
title: test/groups/groupHandlers.js
type: application/javascript
tags: $:/tags/test-spec

Tests the array setHandler.

\*/

describe("groupHandlers",function() {

const utils = require("test/utils.js");

function create(fields,titles,options) {
	options = options || {};
	const wiki = options.wiki || new $tw.Wiki();
	var handler = "array";
	if($tw.utils.hop(fields,"handler")) {
		handler = fields.handler;
		delete fields.handler;
	}
	wiki.addTiddler(utils.group("testGroup",handler,fields));
	$tw.utils.each(titles,function(title) {
		var tid = {"cyoa.group": "testGroup"};
		if(typeof title === "string") {
			tid.title = title;
		} else {
			tid = Object.assign(tid,title);
		}
		wiki.addTiddler(tid);
	});
	return wiki.getCyoaGroupHandler("testGroup");
};

it("warns when no handler is passed",function() {
	utils.warnings(spyOn);
	expect(create({handler: undefined},["A"])).toBeUndefined();
	expect(utils.warnings()).toHaveBeenCalledWith("GroupHandler warning: Group 'testGroup' does not specify a group handler.");
});

it("warns when invalid handler is passed",function() {
	utils.warnings(spyOn);
	expect(create({handler: "invalid"},["A"])).toBeUndefined();
	expect(utils.warnings()).toHaveBeenCalledWith("GroupHandler warning: Group Handler 'invalid' for group 'testGroup' does not exist.");
});

}); //groupHandlers
