/*\
title: test/groups/rule.js
type: application/javascript
tags: $:/tags/test-spec

Tests the rule-type pages

\*/

const utils = require("test/utils.js");

describe("rule",function() {

const ruleTitle = "$:/plugins/mythos/cyoa/groups/rule";
const ruleTiddler = $tw.wiki.getTiddler(ruleTitle);
const filterConfig = "$:/config/mythos/cyoa/page-filter";


it('can indirectly test against physical pages',function() {
	var core = utils.testBook([
		ruleTiddler,
		utils.group('state', "set"),
		{title: "Main","cyoa.append":"A B"},
		{title: "A", "cyoa.group": "state", "cyoa.after": "testFalse"},
		{title: "B", "cyoa.group": "state", "cyoa.after": "testTrue"},
		{title: "testFalse", "cyoa.group": ruleTitle, "cyoa.if": "0 == 1"},
		{title: "testTrue", "cyoa.group": ruleTitle, "cyoa.before": "testFalse"}]);
	expect(core.state.allVisited()).toEqual(["B", "testTrue"]);
});

it('can indirectly test against virtual pages',function() {
	utils.warnings(spyOn);
	var core = utils.testBook([
		ruleTiddler,
		utils.group('state', "set"),
		{title: "$:/config/mythos/cyoa/default", text: "Default"},
		{title: filterConfig, text: "[!cyoa.group[" + ruleTitle + "]]"},
		{title: "Main","cyoa.append":"isTrue A"},
		{title: "Default", text: "This is the default page"},
		{title: "A", "cyoa.group": "state", "cyoa.after": "isTrue", text: "<$cyoa id=badLink to=isTrue />"},
		{title: "isTrue", "cyoa.group": ruleTitle, "cyoa.if": "1 == 1", text: "EXCLUDED"}]);
	// Non-page rules cannot be appended
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'Main': append includes non-page tiddler 'isTrue'");
	expect(core.state.serialize()).toEqual({state: "A"});
	// Non-page rules do not include their content into the final file
	expect(core.document.documentElement.innerHTML).not.toContain("EXCLUDE");
	utils.click(core,"badLink");
	// Make sure we can't visit virtual rules
	expect(core.openPages).toEqual(["Default"]);
});

it('can visit rule pages like any other page',function() {
	var core = utils.testBook([
		ruleTiddler,
		utils.group('number', 'numbermap'),
		{title: "Main", "cyoa.append": "skipPage rulePage"},
		// Skipped page should not be visited.
		{title: "skipPage", "cyoa.group": ruleTitle, "cyoa.if": "false"},
		{title: "rulePage", "cyoa.group": ruleTitle, "cyoa.touch": "PageTouch", text: "<$cyoa touch=TextTouch />"},
		{title: "PageTouch", "cyoa.group": "number"},
		{title: "TextTouch", "cyoa.group": "number"}]);
	// It should only get touched once.
	expect(core.state.query("PageTouch")).toBe(1);
	// Bodies get processed when rules are visited like this
	expect(core.state.query("TextTouch")).toBe(1);
	expect(core.openPages).toEqual(["Main", "rulePage"]);
});

it('can be touched to activate its own touches',function() {
	var text = "<$cyoa touch=TextCounter />";
	var core = utils.testBook([
		ruleTiddler,
		{title: filterConfig, text: "[!tag[Virtual]]"},
		utils.group('number', 'numbermap'),
		{title: "Main", "cyoa.touch": "physicalRule virtualRule"},
		{title: "physicalRule", "cyoa.group": ruleTitle, "cyoa.touch": "PhysicalCounter followupRule", text: text},
		{title: "virtualRule", "cyoa.group": ruleTitle, tags: "Virtual", "cyoa.touch": "VirtualCounter followupRule", text: text},
		{title: "followupRule", "cyoa.group": ruleTitle, tags: "Virtual", "cyoa.touch": "FollowupCounter", text: text},
		{title: "PhysicalCounter", "cyoa.group": "number"},
		{title: "VirtualCounter", "cyoa.group": "number"},
		{title: "FollowupCounter", "cyoa.group": "number"},
		{title: "TextCounter", "cyoa.group": "number"}]);
	// It should only get touched once.
	expect(core.state.query("PhysicalCounter")).toBe(1);
	expect(core.state.query("VirtualCounter")).toBe(1);
	expect(core.state.query("FollowupCounter")).toBe(2);
	// Bodies of touched rules shouldn't be processed
	expect(core.state.query("TextCounter")).toBe(0);
	expect(core.openPages).toEqual(["Main"]);
});

it('is false when no constraints exist',function() {
	var core = utils.testBook([
		ruleTiddler,
		utils.group('state', 'set'),
		{title: "Main", "cyoa.group": "state", "cyoa.append": "No Yes"},
		{title: "No", "cyoa.group": "state", "cyoa.after": "NoRule"},
		{title: "Yes", "cyoa.group": "state", "cyoa.after": "[tag[Yes]]"},
		{title: "NoRule", "cyoa.group": ruleTitle},
		// Now we make sure each type of constraint prevents default no-constraint false behavior.
		{title: "AfterRule", "cyoa.group": ruleTitle, tags: "Yes", "cyoa.after": "Main"},
		{title: "BeforeRule", "cyoa.group": ruleTitle, tags: "Yes", "cyoa.before": "No"},
		{title: "DependRule", "cyoa.group": ruleTitle, tags: "Yes", "cyoa.depend": "Main"},
		{title: "IfRule", "cyoa.group": ruleTitle, tags: "Yes", "cyoa.if": "true"}]);
	expect(core.state.allVisited()).toEqual(['AfterRule','BeforeRule','DependRule',"IfRule","Main","Yes"]);
});

it('default unimplied value is binary',function() {
	var core = utils.testBook([
		ruleTiddler,
		utils.group('number', 'numbermap'),
		{title: "Main", "cyoa.do": "#{Counter} = (7*#{trueRule}) + #{falseRule}"},
		{title: "trueRule", "cyoa.group": ruleTitle, "cyoa.if": "true"},
		{title: "falseRule", "cyoa.group": ruleTitle, "cyoa.if": "false"},
		{title: "Counter", "cyoa.group": "number"}]);
	expect(core.state.query("Counter")).toBe(7);
	expect(core.state.query("trueRule")).toBe(true);
	expect(core.state.query("falseRule")).toBe(false);
});

it('blank value is considered no value',function() {
	var core = utils.testBook([
		ruleTiddler,
		utils.group('number', 'numbermap'),
		{title: "Main", "cyoa.do": "#{Counter} = (3*#{trueRule}) + #{falseRule}"},
		{title: "trueRule", "cyoa.group": ruleTitle, "cyoa.value": "", "cyoa.if": "true"},
		{title: "falseRule", "cyoa.group": ruleTitle, "cyoa.value": ""},
		{title: "Counter", "cyoa.group": "number"}]);
	expect(core.state.query("Counter")).toBe(3);
	expect(core.state.query("trueRule")).toBe(true);
	expect(core.state.query("falseRule")).toBe(false);
});

it('specified value is value whether true or false',function() {
	var core = utils.testBook([
		ruleTiddler,
		utils.group('number', 'numbermap'),
		{title: "Main", "cyoa.do": "#{Counter} = 7", "cyoa.append": "Next"},
		{title: "Next", "cyoa.do": "#{Output} = #{Eh} + #{No} + #{Yes}"},

		{title: "Eh", "cyoa.value": "#{Counter}*5", "cyoa.group": ruleTitle},
		{title: "No", "cyoa.value": "#{Counter}*3", "cyoa.group": ruleTitle, "cyoa.if": "false"},
		{title: "Yes", "cyoa.value": "#{Counter}*2", "cyoa.group": ruleTitle, "cyoa.if": "true"},
		{title: "Counter", "cyoa.group": "number"},
		{title: "Output", "cyoa.group": "number"}]);
	expect(core.state.query("Output")).toBe(70);
	expect(core.state.query("Eh")).toBe(35);
	expect(core.state.query("No")).toBe(21);
	expect(core.state.query("Yes")).toBe(14);
});

// ALso test for this:
// it('can handle value loops',function() { });

it('can be implied',function() {
	var core = utils.testBook([
		ruleTiddler,
		utils.group('set', 'set'),
		{title: "Main", text: "<$cyoa touch='A2 Child'/><$cyoa reset=ResetRule/>"},
		// Subrule makes sure that implications propagate through rules
		{title: "SubRule", "cyoa.group": ruleTitle},
		  {title: "Rule", "cyoa.group": ruleTitle, "cyoa.imply": "SubRule"},
		    {title: "A1", "cyoa.group": "set", "cyoa.imply": "Rule"},
		      {title: "A2", "cyoa.group": "set", "cyoa.imply": "A1 ResetRule"},
		    {title: "B", "cyoa.group": "set", "cyoa.imply": "Rule"},
		{title: "ResetRule", "cyoa.group": ruleTitle},
		  {title: "ChildRule", "cyoa.group": ruleTitle, "cyoa.imply": "ResetRule"},
		    // Child ensure that resets propagate through rules
		    {title: "Child", "cyoa.group": "set", "cyoa.imply": "ChildRule"}]);
	expect(core.state.query("Rule")).toBe(true);
	expect(core.state.query("SubRule")).toBe(true);
	expect(core.state.query("A1")).toBe(true);
	expect(core.state.query("A2")).toBe(false);
	expect(core.state.query("Child")).toBe(false);
	expect(core.state.query("ResetRule")).toBe(false);
});

it('can handle imply loops',function() {
	utils.warnings(spyOn);
	var core = utils.testBook([
		ruleTiddler,
		utils.group('set', 'set'),
		{title: "Main", text: "<$cyoa touch=A/>"},
		{title: "A", "cyoa.group": "set", "cyoa.imply": "RuleA"},
		{title: "RuleA", "cyoa.group": ruleTitle, "cyoa.imply": "RuleB"},
		{title: "RuleB", "cyoa.group": ruleTitle, "cyoa.imply": "RuleA"},
		{title: "RuleX", "cyoa.group": ruleTitle, "cyoa.imply": "RuleY"},
		{title: "RuleY", "cyoa.group": ruleTitle, "cyoa.imply": "RuleX"}]);
	// Warnings get issued, but we'll handle it anyway
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'RuleB': Detected cyclic dependency in 'cyoa.imply' chain");
	expect(utils.warnings()).toHaveBeenCalledWith("Page 'RuleY': Detected cyclic dependency in 'cyoa.imply' chain");
	expect(core.state.query("RuleA")).toBe(true);
	expect(core.state.query("RuleB")).toBe(true);
	expect(core.state.query("RuleX")).toBe(false);
	expect(core.state.query("RuleY")).toBe(false);
});

it('does not leave a record',function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		ruleTiddler,
		utils.group('state', 'set'),
		{title: "Main", "cyoa.group": "state", "cyoa.only": "first"},
		{title: "Rule", "cyoa.group": ruleTitle}]);
	wiki.commitCyoaGroups();
	var records = wiki.filterTiddlers("[removeprefix[$:/config/mythos/cyoa/records/]]");
	// Only one record for the set. None for the rules.
	expect(records).toEqual(['state']);
});

});
