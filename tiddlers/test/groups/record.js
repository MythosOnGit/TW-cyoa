/*\
title: test/groups/record.js
type: application/javascript
tags: $:/tags/test-spec

Tests the record's migration system.

\*/

const utils = require("test/utils.js");

const implyWarning = (from,to) => `Page '${from}': Tiddler no longer implies '${to}', which would be a backward-incompatible change. CYOA will retain the implication until the version history is next cleared.`;

function bitfieldGroup(variable,group) {
	return utils.group(group || "default","set",{variable: variable || "s",style: "bitfield"});
};

const bitfield = { name:"bitfield", group:bitfieldGroup("b") };
const index64 = { name:"index64", group:utils.group("default","set",{variable: "s",style: "index64"}) };
const index10 = { name:"index10", group:utils.group("default","set",{variable: "t",style: "index10"}) };

function as(/* suites, ... */) {
	var self = this;
	return {
		suites: Array.prototype.slice.call(arguments),
		call: function(method,test,callback) {
			this.suites.forEach(function(suite) {
				var str = "as " + suite.name + " " + test;
				method.call(self,str,async function() {
					return callback(suite.group);
				});
			});
		},
		it: function(name,callback) { this.call(it,name,callback); },
		fit: function(name,callback) { this.call(fit,name,callback); },
		xit: function(name,callback) { this.call(xit,name,callback); }
	};
};

describe("Record",function() {

async function test(wiki,expected,options) {
	options = Object.create(options || null);
	options.wiki = wiki;
	var rtn = utils.testBookDefaultVar([],undefined,options);
	expect(rtn.results).toEqual(expected);
	// We don't act again until after the pipeline has cleared.
	return new Promise(function(resolve,reject) {
		$tw.utils.nextTick(function() {
			resolve(rtn.state);
		});
	});
};

function node(name,parent,attributes) {
	var n = Object.assign({title: name,"cyoa.group": "default"},attributes);
	if(parent) { n["cyoa.imply"] = parent; }
	return n;
};

function autoVersioning(state) {
	return {title: "$:/config/mythos/cyoa/autoVersioning", text: state || "enabled"};
};

function renameTiddler(wiki,from,to) {
	var mainWiki = $tw.wiki;
	// We do this to force Relink to instantiate all of its modules bofore
	// we swap out $tw.wiki with a dummy. We have to swap out $tw.wiki because
	// the th-renaming-tiddler hook only works with $tw.wiki (issue #6536)
	$tw.wiki.renameTiddler("non-existent","also-non-existent");
	try {
		$tw.wiki = wiki;
		wiki.renameTiddler(from,to);
	} finally {
		$tw.wiki = mainWiki;
	}
};

it("handles renaming of tiddlers after a commit",async function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		bitfieldGroup("t"),
		autoVersioning(),
		node("A"),
		node("B","A"),node("C","A"),node("D","A"),
		node("E"),
		{title: "Unrelated"},
		{title: "Main","cyoa.touch": "C E"}]);
	wiki.commitCyoaGroups();
	var prevSerialized = await test(wiki,["A","C","E"]);
	renameTiddler(wiki,"C","X");
	renameTiddler(wiki,"Unrelated","Still unrelated");
	wiki.addTiddler({title: "Main","cyoa.touch": "X E"});
	var nextSerialized = await test(wiki,["A","E","X"]);
	expect(nextSerialized).toBe(prevSerialized);
});

/** Nodes and implications added **/

as(bitfield,index64).
it("handles implied nodes introduced in later versions", async function(group) {
	const wiki = new $tw.Wiki()
	wiki.addTiddlers([
		group,autoVersioning(),
		node("A"), node("B","A"),node("C"), // C acts as a buffer
		{title: "Main", "cyoa.touch": "B"}]);
	var serialized = await test(wiki,["A","B"]);
	wiki.addTiddlers([
		node("B","A X"), node("X"), {title: "Main"}]);
	await test(wiki,["A","B","X"],{state: serialized});
});

it("handles implications introduced in later versions",async function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		bitfieldGroup("t"),
		autoVersioning(),
		node("A1"),node("A2"),node("A3"),node("B2","A2"),node("C2","B2"),
		node("X","A1 A3"),
		node("M"),node("N"),node("O"),
		node("Z1"),node("Z2"), // We have these Z's to ensure no field growth
		{title: "Main","cyoa.touch": "X Z1"}]);
	var prevSerialized = await test(wiki,["A1","A3","X","Z1"]);
	wiki.addTiddlers([
		// This is a node that already had implications before
		node("X","A1 B2 A3"),
		// These nodes never had implications, but now they do
		node("O","N"),node("N","M"),
		// Don't touch anything this time. Load from existing state;
		{title: "Main"}]);
	var newSerialized = await test(wiki,["A1","A2","A3","B2","Z1","X"],
		{state: prevSerialized});
	expect(newSerialized).toBe(prevSerialized);
});

/** Deletion of implied pages **/

it('handles deletion of tiddlers after a commit',async function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		bitfieldGroup("t"),
		autoVersioning(),
		node("A"), node("B"), node("C"), node("D"),
		{title: "Main","cyoa.touch": "A B C"}]);
	var serialized = await test(wiki,["A","B","C"]);
	wiki.deleteTiddler("B");
	wiki.addTiddler({title: "Main"});
	await test(wiki,["A","C"],{state:serialized});
});

it("allows implied pages to be removed",async function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		bitfieldGroup("t"),
		autoVersioning(),
		node("A1"),node("A2","A1"),
		// Bumper nodes to ensure edge of bitfield isn't corrupt
		node("Z1"),node("Z2"),
		{title: "Main","cyoa.touch": "A2 Z1"}]);
	var serialized = await test(wiki,["A1","A2","Z1"]);
	wiki.deleteTiddler("A1");
	wiki.addTiddlers([
		node("A2"),
		{title: "Main"}]);
	await test(wiki,["Z1","A2"],{state: serialized});
});

it("allows removed implied pages to be routed around",async function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		bitfieldGroup("t"),
		autoVersioning(),
		node("A"),node("B","A"),node("C","B"),node("D","C"),
		{title: "Main","cyoa.touch": "D"}]);
	var serialized = await test(wiki,["A","B","C","D"]);
	wiki.deleteTiddler("B");
	wiki.deleteTiddler("C");
	wiki.addTiddlers([
		node("D","A"),
		{title: "Main"}]);
	await test(wiki,["A","D"],{state: serialized});
});

it("warns when existing imply is unlinked",async function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		bitfieldGroup("t"),
		autoVersioning(),
		node("A"),node("B"),node("C","A B"),node("D","C"),
		// Bumper nodes to ensure bitfield fits correctly
		node("X1"),node("X2"),
		{title: "Main","cyoa.touch": "D X2"}]);
	var serialized = await test(wiki,["A","B","C","D","X2"]);
	wiki.addTiddlers([node("D"),{title:"Main"}]);
	utils.warnings(spyOn);
	await test(wiki,["A","B","C","X2","D"],{state: serialized});
	expect(utils.warnings()).toHaveBeenCalledWith(implyWarning("D","C"));
});

it("warns when existing imply is removed from group",async function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		bitfieldGroup("t"),
		autoVersioning(),
		node("A1"),node("A2"),node("A","A1 A2"),node("B"),node("C","A B"),node("D","C"),
		// Bumper nodes to ensure bitfield fits correctly
		node("X1"),node("X2"),
		{title: "Main","cyoa.touch": "D X2"}]);
	var serialized = await test(wiki,["A","A1","A2","B","C","D","X2"]);
	wiki.addTiddlers([node("D"),{title:"A"},{title:"C"},{title:"Main"}]);
	utils.warnings(spyOn);
	await test(wiki,["A1","A2","B","X2","D"],{state: serialized});
	expect(utils.warnings()).toHaveBeenCalledWith(implyWarning("D","A1"));
	expect(utils.warnings()).toHaveBeenCalledWith(implyWarning("D","A2"));
	expect(utils.warnings()).toHaveBeenCalledWith(implyWarning("D","B"));
	expect(utils.warnings()).toHaveBeenCalledTimes(3);
});

it("doesn't warn about severed implications multiple times", async function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		bitfieldGroup("t"),
		autoVersioning(),
		node("A"),node("B"),node("X","A B"),
		{title: "Main","cyoa.touch": "X"}]);
	await test(wiki,["A","B","X"]);
	wiki.addTiddler(node("X","A"));
	utils.warnings(spyOn);
	await test(wiki,["A","B","X"]);
	expect(utils.warnings()).toHaveBeenCalledWith(implyWarning("X","B"));
	expect(utils.warnings()).toHaveBeenCalledTimes(1);
	// Now we remove the other implication. We should get a warning for the new one, but not the old.
	wiki.addTiddler(node("X"));
	utils.warnings().calls.reset();
	await test(wiki,["A","B","X"]);
	expect(utils.warnings()).toHaveBeenCalledWith(implyWarning("X","A"));
	expect(utils.warnings()).toHaveBeenCalledTimes(1);
	// And now we test again. Nothing should be called.
	utils.warnings().calls.reset();
	await test(wiki,["A","B","X"]);
	expect(utils.warnings()).not.toHaveBeenCalled();
});

it("warns when existing imply is deleted from tiddlywiki",async function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		bitfieldGroup("t"),
		autoVersioning(),
		node("A"),node("B"),node("C","A B"),node("D","C"),
		// Bumper nodes to ensure bitfield fits correctly
		node("X1"),node("X2"),
		{title: "Main","cyoa.touch": "D X2"}]);
	var serialized = await test(wiki,["A","B","C","D","X2"]);
	wiki.addTiddlers([node("D"),{title:"Main"}]);
	wiki.deleteTiddler("C");
	utils.warnings(spyOn);
	await test(wiki,["A","B","X2","D"],{state: serialized});
	expect(utils.warnings()).toHaveBeenCalledWith(implyWarning("D","A"));
	expect(utils.warnings()).toHaveBeenCalledWith(implyWarning("D","B"));
	expect(utils.warnings()).toHaveBeenCalledTimes(2);
});

/** Exclusion **/

it("handles exclusion across different versions",async function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		bitfieldGroup("t"),
		autoVersioning(),
		node("A1"),
		node("A3"),
		node("B1","A1 A3",{"cyoa.exclude": "X"}),
		node("B3","A3",{"cyoa.exclude": "X"}),
		{title: "Main","cyoa.touch": "B1 B3"}]);
	var prevSerialized = await test(wiki,["A1","A3","B3"]);
	wiki.addTiddler(node("B2","A1",{"cyoa.exclude": "X"}));
	var newSerialized = await test(wiki,["A1","A3","B3"]);
	// The addition of a new versioned tiddler shouldn"t change things
	expect(newSerialized).toBe(prevSerialized);
	wiki.addTiddler({title: "Main","cyoa.touch": "B1 B3 B2"});
	await test(wiki,["A1","A3","B2"]);
});

/** Clearing **/

as(index10).
it("can clear the version history and repack",async function(group) {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		group,autoVersioning(),
		node("A"),node("C"),
		{title: "Main","cyoa.touch": "C"}]);
	var oldState = await test(wiki,["C"]);
	// Now add a new page which would ordinarily offset "C"
	wiki.addTiddler(node("B"));
	var newState = await test(wiki,["C"]);
	// This is already expected.
	expect(newState).toBe(oldState);
	// But after we clear the groups, all the pages should be repacked.
	wiki.clearCyoaGroups();
	var changedState = test(wiki,["C"]);
	// Now it should be different
	expect(changedState).not.toBe(newState);
});

it("warns and refuses when a page would have a different id",async function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([node("A"),node("B"),node("C"),
		utils.group("default","set",{variable: "s",style: "string",filter: "[addsuffix[z]]"}),
		autoVersioning(),
		{title: "Main","cyoa.touch":"B C"}]);
	var oldState = await test(wiki,["B","C"]);
	renameTiddler(wiki,"B","X");
	wiki.addTiddler({title: "Main","cyoa.touch": "X C"});
	utils.warnings(spyOn);
	var newState = await test(wiki,["C","X"]);
	// We will issue a warning and retain the old id.
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'X': Tiddler would now use id 'Xz' instead of 'Bz', which would be a backward-incompatible change. CYOA will retain the use of 'Bz' until the version history is next cleared.");
	expect(newState).toBe(oldState);
	utils.warnings().calls.reset();
	newState = await test(wiki,["C","X"]);
	// It warns, but it only warns once.
	expect(utils.warnings()).not.toHaveBeenCalled();
	expect(newState).toBe(oldState);
	// But it warns again if renamed again
	renameTiddler(wiki,"X","Y");
	wiki.addTiddler({title: "Main","cyoa.touch": "Y C"});
	await test(wiki,["C","Y"]);
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'Y': Tiddler would now use id 'Yz' instead of 'Bz', which would be a backward-incompatible change. CYOA will retain the use of 'Bz' until the version history is next cleared.");
});


});
