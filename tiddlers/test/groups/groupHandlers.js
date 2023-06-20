/*\
title: test/groups/groupHandlers.js
type: application/javascript
tags: $:/tags/test-spec

Tests the array setHandler.

\*/

describe("groupHandlers",function() {

const utils = require("test/utils.js");

it("issues warning if group does not exist",function() {
	utils.warnings(spyOn);
	var results = utils.testBook([
		{title: "Main","cyoa.group": "nonexistent", "cyoa.only": "first"},
		{title: "Other","cyoa.group": "nonexistent", "cyoa.only": "first"}]);
	expect(utils.warnings()).toHaveBeenCalledWith("Page set 'nonexistent' specified in tiddler 'Main' does not exist.");
	expect(utils.warnings()).toHaveBeenCalledWith("Page set 'nonexistent' specified in tiddler 'Other' does not exist.");
});

it("uses title for variable if no cyoa.key given",function() {
	const name = "subdirectory/1test. $-@%^Group";
	var results = utils.testBook([
		// The caption field should be ignored for evaluating the variable
		utils.group(name,"set"),
		{title: "Main", "cyoa.group": name}]);
	expect(results.state.serialize()).toContain("testGroup=");
});

it("uses title for variable if cyoa.key is blank",function() {
	var results = utils.testBook([
		// The caption field should be ignored for evaluating the variable
		utils.group("testGroup","set",{"cyoa.key":""}),
		{title: "Main", "cyoa.group": "testGroup"}]);
	expect(results.state.serialize()).toContain("testGroup=");
});

it("uses title even if caption exists",function() {
	var results = utils.testBook([
		// The caption field should be ignored for evaluating the variable
		utils.group("testGroup","set",{caption: "no"}),
		{title: "Main", "cyoa.group": "testGroup"}]);
	expect(results.state.serialize()).toContain("testGroup=");
});

it("uses variable field for variable if given",function() {
	const title = "subdirectory/testGroup";
	const variable = "test/ _$@!.^Var";
	var results = utils.testBook([
		utils.group(title,"set",{"cyoa.key":variable}),
		{title: "Main", "cyoa.group": title}]);
	expect(results.state.serialize()).toContain("test_Var=");
});

it("uses variable field even if it's a reserved word",function() {
	const title = "subdirectory/testGroup";
	const variable = "default";
	var results = utils.testBook([
		utils.group(title,"set",{"cyoa.key":variable}),
		{title: "Main", "cyoa.group": title}]);
	expect(results.state.serialize()).toContain("_default=");
});

it("warns when no handler is passed",function() {
	utils.warnings(spyOn);
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.group("testGroup"),
		{title: "A", "cyoa.group": "testGroup"}]);
	expect(wiki.getCyoaGroupHandler("testGroup")).toBeUndefined();
	expect(utils.warnings()).toHaveBeenCalledWith("GroupHandler warning: Group 'testGroup' does not specify a group handler.");
});

it("warns when invalid handler is passed",function() {
	utils.warnings(spyOn);
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.group("testGroup","invalid"),
		{title: "A", "cyoa.group": "testGroup"}]);
	expect(wiki.getCyoaGroupHandler("testGroup")).toBeUndefined();
	expect(utils.warnings()).toHaveBeenCalledWith("GroupHandler warning: Group Handler 'invalid' for group 'testGroup' does not exist.");
});

}); //groupHandlers
