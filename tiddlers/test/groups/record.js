/*\
title: test/groups/record.js
type: application/javascript
tags: $:/tags/test-spec

Tests the record's migration system.

\*/

const utils = require("test/utils.js");

const implyWarning = (from,to) => `Page '${from}': Tiddler no longer implies '${to}', which would be a backward-incompatible change. CYOA will retain the implication until the version history is next cleared.`;

function testBookDefaultVar(tiddlerArrays,group,options) {
	group = group || "$:/plugins/mythos/cyoa/groups/default";
	var core = utils.testBook([{title: "Results"}].concat(tiddlerArrays),options);
	var rtn = {};
	rtn.state = (options && options.state) || core.state.serialize();
	core.manager.getState = () => rtn.state;
	// Now open results so the core will load the serialized state.
	core.openPage("Results");
	// Lets collect those results in the only way I can figure out how
	rtn.results = core.state.allVisited();
	return rtn;
};

function as(/* suites, ... */) {
	var self = this;
	return {
		suites: Array.prototype.slice.call(arguments),
		call: function(method,test,callback) {
			this.suites.forEach(function(suite) {
				var str = "as " + suite + " " + test;
				method.call(self,str,function() {
					return callback(suite);
				});
			});
		},
		it: function(name,callback) { this.call(it,name,callback); },
		fit: function(name,callback) { this.call(fit,name,callback); },
		xit: function(name,callback) { this.call(xit,name,callback); }
	};
};

describe("Record",function() {

function test(wiki,expected,options) {
	options = Object.create(options || null);
	options.wiki = wiki;
	var rtn = testBookDefaultVar([],"grp",options);
	expect(rtn.results).toEqual(expected);
	return rtn.state;
};

function bitfieldGroup() {
	return utils.group("grp","set",{"cyoa.serializer": "bitfield"});
};

const groups = {
	bitfield: bitfieldGroup(),
	index10: utils.group("grp","set",{"cyoa.serializer": "index10"}),
// The removeprefix here crashes if it's given undefined, making it good for testing
	string: utils.group("grp","set",{"cyoa.serializer": "string"})
};

function node(name,parent,attributes) {
	var n = Object.assign({title: name,"cyoa.group": "grp"},attributes);
	if(parent) { n["cyoa.imply"] = parent; }
	return n;
};

function autoVersioning(state) {
	return {title: "$:/config/mythos/cyoa/autoVersioning", text: state || "enabled"};
};

it("handles renaming of tiddlers after a commit",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		bitfieldGroup(),
		autoVersioning(),
		node("A"),
		node("B","A"),node("C","A"),node("D","A"),
		node("E"),
		{title: "Unrelated"},
		{title: "Main","cyoa.touch": "C E"}]);
	wiki.commitCyoaGroups();
	var prevSerialized = test(wiki,["A","C","E"]);
	spyOn(console,"log");
	wiki.renameTiddler("C","X");
	wiki.renameTiddler("Unrelated","Still unrelated");
	wiki.addTiddler({title: "Main","cyoa.touch": "X E"});
	var nextSerialized = test(wiki,["A","E","X"]);
	expect(nextSerialized).toEqual(prevSerialized);
});

/** Nodes and implications added **/

as("bitfield").
it("handles implied nodes introduced in later versions", function(group) {
	const wiki = new $tw.Wiki()
	wiki.addTiddlers([
		groups[group],autoVersioning(),
		node("A"), node("B","A"),node("C"), // C acts as a buffer
		{title: "Main", "cyoa.touch": "B"}]);
	var serialized = test(wiki,["A","B"]);
	wiki.addTiddlers([
		node("B","A X"), node("X"), {title: "Main"}]);
	test(wiki,["A","B","X"],{state: serialized});
});

it("handles implications introduced in later versions",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		bitfieldGroup(),
		autoVersioning(),
		node("A1"),node("A2"),node("A3"),node("B2","A2"),node("C2","B2"),
		node("X","A1 A3"),
		node("M"),node("N"),node("O"),
		node("Z1"),node("Z2"), // We have these Z's to ensure no field growth
		{title: "Main","cyoa.touch": "X Z1"}]);
	var prevSerialized = test(wiki,["A1","A3","X","Z1"]);
	wiki.addTiddlers([
		// This is a node that already had implications before
		node("X","A1 B2 A3"),
		// These nodes never had implications, but now they do
		node("O","N"),node("N","M"),
		// Don't touch anything this time. Load from existing state;
		{title: "Main"}]);
	var newSerialized = test(wiki,["A1","A2","A3","B2","X","Z1"],
		{state: prevSerialized});
	expect(newSerialized).toBe(prevSerialized);
});

/** Tests for bug where bridges from complex DAGs would mess up array allocation for later-added nodes implying that DAG. **/
it("handles implying pages introduced in later versions",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		bitfieldGroup(),
		autoVersioning(),
		node("A1"), node("A2"),
		node("B","A1 A2"),
		{title: "Main"}]);
	// Commit the pages as is
	test(wiki,[]);
	wiki.addTiddlers([
		node("C","B"),
		node("D","C"),
		node("E"),
		{title: "Main", "cyoa.touch": "E"}]);
	var serialized = test(wiki,["E"]);
	wiki.addTiddler({title: "Main"});
	test(wiki,["E"],{state: serialized});
});

/** Same as above. DAGs with exclusion groups should not cross bridges when zeroing out exclusion groups. The setup for this is very specific. Don't change node names. **/
it("handles implying pages introduced in later versions",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		bitfieldGroup(),
		autoVersioning(),
		// This A1 will get set true when instantiated, and set false A2 and all children. (but hopefully won't mess up child  B, which is  in another group)
		node("A1",null,{"cyoa.exclude":"X"}), node("A2",null,{"cyoa.exclude":"X"}),
		{title: "Main", "cyoa.touch": "A1"}]);
	// Commit the pages as is
	test(wiki,["A1"]);
	wiki.addTiddlers([
		node("B","A2"),
		node("C","B"),
		node("D"),
		{title: "Main", "cyoa.touch": "A1 D"}]);
	var firstState = test(wiki,["A1","D"]);
	wiki.addTiddler({title: "Main"});
	test(wiki,["A1","D"],{state: firstState});
});

/** Deletion of implied pages **/

it('handles deletion of tiddlers after a commit',function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		bitfieldGroup(),
		autoVersioning(),
		node("A"), node("B"), node("C"), node("D"),
		{title: "Main","cyoa.touch": "A B C"}]);
	var serialized = test(wiki,["A","B","C"]);
	wiki.deleteTiddler("B");
	wiki.addTiddler({title: "Main"});
	test(wiki,["A","C"],{state:serialized});
});

it("allows implied pages to be removed",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		bitfieldGroup(),
		autoVersioning(),
		node("A1"),node("A2","A1"),
		// Bumper nodes to ensure edge of bitfield isn't corrupt
		node("Z1"),node("Z2"),
		{title: "Main","cyoa.touch": "A2 Z1"}]);
	var serialized = test(wiki,["A1","A2","Z1"]);
	wiki.deleteTiddler("A1");
	wiki.addTiddlers([
		node("A2"),
		{title: "Main"}]);
	test(wiki,["A2","Z1"],{state: serialized});
});

as("bitfield", "string").
it("allows removed implied pages to be routed around",function(group) {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		groups[group],
		autoVersioning(),
		node("A"),node("B","A"),node("C","B"),node("D","C"),
		{title: "Main","cyoa.touch": "D"}]);
	var serialized = test(wiki,["A","B","C","D"]);
	wiki.deleteTiddler("B");
	wiki.deleteTiddler("C");
	wiki.addTiddler(node("D","A"));
	// Works if D gets touched from a fresh state
	var laterSerialized = test(wiki,["A","D"]);
	// No matter the serializer, it should manage this with one character
	expect(laterSerialized.grp.length).toBe(1);
	// Works if D was already touched.
	wiki.addTiddler({title: "Main"});
	test(wiki,["A","D"],{state: serialized});
});

as("bitfield", "string").
it("remembers removed pages enough for implications",function(group) {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		groups[group],
		autoVersioning(),
		node("A"),node("B","A"),node("C","B"),
		{title: "Main","cyoa.touch": "B"}]);
	var serialized = test(wiki,["A","B"]);
	wiki.deleteTiddler("B");
	wiki.addTiddler(node("C","A"));
	wiki.addTiddler({title: "Main"});
	test(wiki,["A"],{state: serialized});
});

it("warns when existing imply is unlinked",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		bitfieldGroup(),
		autoVersioning(),
		node("A"),node("B"),node("C","A B"),node("D","C"),
		// Bumper nodes to ensure bitfield fits correctly
		node("X1"),node("X2"),
		{title: "Main","cyoa.touch": "D X2"}]);
	var serialized = test(wiki,["A","B","C","D","X2"]);
	wiki.addTiddlers([node("D"),{title:"Main"}]);
	utils.warnings(spyOn);
	test(wiki,["A","B","C","D","X2"],{state: serialized});
	expect(utils.warnings()).toHaveBeenCalledWith(implyWarning("D","C"));
});

// We test as a string group here because some titles will get set to undefined in the record, which a string handler might struggle with.
as("bitfield","string").
it("warns when existing imply is removed from group",function(group) {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		groups[group],
		autoVersioning(),
		node("A1"),node("A2"),node("A","A1 A2"),node("B"),node("C","A B"),node("D","C"),
		// Bumper nodes to ensure bitfield fits correctly
		node("X1"),node("X2"),
		{title: "Main","cyoa.touch": "D X2"}]);
	var serialized = test(wiki,["A","A1","A2","B","C","D","X2"]);
	wiki.addTiddlers([node("D"),{title:"A"},{title:"C"},{title:"Main"}]);
	utils.warnings(spyOn);
	test(wiki,["A1","A2","B","D","X2"],{state: serialized});
	// D must still imply all these, even though the chain to them broke
	expect(utils.warnings()).toHaveBeenCalledWith(implyWarning("D","A1"));
	expect(utils.warnings()).toHaveBeenCalledWith(implyWarning("D","A2"));
	expect(utils.warnings()).toHaveBeenCalledWith(implyWarning("D","B"));
	expect(utils.warnings()).toHaveBeenCalledTimes(3);
});

it("doesn't warn about severed implications multiple times", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		bitfieldGroup(),
		autoVersioning(),
		node("A"),node("B"),node("X","A B"),
		{title: "Main","cyoa.touch": "X"}]);
	test(wiki,["A","B","X"]);
	wiki.addTiddler(node("X","A"));
	utils.warnings(spyOn);
	test(wiki,["A","B","X"]);
	expect(utils.warnings()).toHaveBeenCalledWith(implyWarning("X","B"));
	expect(utils.warnings()).toHaveBeenCalledTimes(1);
	// Now we remove the other implication. We should get a warning for the new one, but not the old.
	wiki.addTiddler(node("X"));
	utils.warnings().calls.reset();
	test(wiki,["A","B","X"]);
	expect(utils.warnings()).toHaveBeenCalledWith(implyWarning("X","A"));
	expect(utils.warnings()).toHaveBeenCalledTimes(1);
	// And now we test again. Nothing should be called.
	utils.warnings().calls.reset();
	test(wiki,["A","B","X"]);
	expect(utils.warnings()).not.toHaveBeenCalled();
});

it("warns when existing imply is deleted from tiddlywiki",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		bitfieldGroup(),
		autoVersioning(),
		node("A"),node("B"),node("C","A B"),node("D","C"),
		// Bumper nodes to ensure bitfield fits correctly
		node("X1"),node("X2"),
		{title: "Main","cyoa.touch": "D X2"}]);
	var serialized = test(wiki,["A","B","C","D","X2"]);
	wiki.addTiddlers([node("D"),{title:"Main"}]);
	wiki.deleteTiddler("C");
	utils.warnings(spyOn);
	test(wiki,["A","B","D","X2"],{state: serialized});
	expect(utils.warnings()).toHaveBeenCalledWith(implyWarning("D","A"));
	expect(utils.warnings()).toHaveBeenCalledWith(implyWarning("D","B"));
	expect(utils.warnings()).toHaveBeenCalledTimes(2);
});

/** Exclusion **/

it("handles exclusion across different versions",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		bitfieldGroup(),
		autoVersioning(),
		node("A1"),
		node("A3"),
		node("B1","A1 A3",{"cyoa.exclude": "X"}),
		node("B3","A3",{"cyoa.exclude": "X"}),
		{title: "Main","cyoa.touch": "B1 B3"}]);
	var prevSerialized = test(wiki,["A1","A3","B3"]);
	wiki.addTiddler(node("B2","A1",{"cyoa.exclude": "X"}));
	var newSerialized = test(wiki,["A1","A3","B3"]);
	// The addition of a new versioned tiddler shouldn"t change things
	expect(newSerialized).toEqual(prevSerialized);
	wiki.addTiddler({title: "Main","cyoa.touch": "B1 B3 B2"});
	test(wiki,["A1","A3","B2"]);
});

/** Clearing **/

it("can clear the version history and repack",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		groups.index10, autoVersioning(),
		node("A"),node("C"),
		{title: "Main","cyoa.touch": "C"}]);
	var oldState = test(wiki,["C"]);
	// Now add a new page which would ordinarily offset "C"
	wiki.addTiddler(node("B"));
	var newState = test(wiki,["C"]);
	// This is already expected.
	expect(newState).toEqual(oldState);
	// But after we clear the groups, all the pages should be repacked.
	wiki.invokeActionString("<$action-deletetiddler $filter='[prefix[$:/config/mythos/cyoa/records/]]' />",null,null,{});
	var changedState = test(wiki,["C"]);
	// Now it should be different
	expect(changedState).not.toEqual(newState);
});

it("warns and refuses when a page would have a different id",function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([node("A"),node("B"),node("C"),
		utils.group("grp","set",{"cyoa.serializer": "string",filter: "[addsuffix[z]]"}),
		autoVersioning(),
		{title: "Main","cyoa.touch":"B C"}]);
	var oldState = test(wiki,["B","C"]);
	spyOn(console,"log");
	wiki.renameTiddler("B","X");
	wiki.addTiddler({title: "Main","cyoa.touch": "X C"});
	utils.warnings(spyOn);
	var newState = test(wiki,["C","X"]);
	// We will issue a warning and retain the old id.
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'X': Tiddler would now use id 'Xz' instead of 'Bz', which would be a backward-incompatible change. CYOA will retain the use of 'Bz' until the version history is next cleared.");
	expect(newState).toEqual(oldState);
	utils.warnings().calls.reset();
	newState = test(wiki,["C","X"]);
	// It warns, but it only warns once.
	expect(utils.warnings()).not.toHaveBeenCalled();
	expect(newState).toEqual(oldState);
	// But it warns again if renamed again
	wiki.renameTiddler("X","Y");
	wiki.addTiddler({title: "Main","cyoa.touch": "Y C"});
	test(wiki,["C","Y"]);
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'Y': Tiddler would now use id 'Yz' instead of 'Bz', which would be a backward-incompatible change. CYOA will retain the use of 'Bz' until the version history is next cleared.");
});

as("set","numbermap").
it('handles when a different page replaces an old id',function(type) {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.group("grp",type,{"cyoa.serializer": "string",filter: "[get[code]]"}),
		autoVersioning(),
		{title: "Main", "cyoa.touch": "[tag[touch]]"},
		{title: "First", "cyoa.group": "grp", code: "value", tags: "touch"}]);
	var oldState = test(wiki, ['First']);
	wiki.deleteTiddler("First");
	wiki.addTiddler({title: "Second", "cyoa.group": "grp", code: "value"});
	utils.warnings(spyOn);
	test(wiki,[],{state: oldState});
	expect(utils.warnings()).toHaveBeenCalledWith("GroupHandler warning: In grp group, the following tiddlers all resolved to variable 'value': (removed page placeholder), 'Second'");
});

});
