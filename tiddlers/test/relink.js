/*\
title: test/relink.js
type: application/javascript
tags: $:/tags/test-spec

Tests the gate operators in tracking snippets in conditional page fields.
This focuses on logic gate tiddlers which manipulate evaluation

\*/

describe("Relink",function() {

it("can report simple scripts",function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "my tiddler"},
		// Short snippets will show their whole context
		{title: "short","cyoa.if": "#{my tiddler} == 0"},
		// Long snippets properly omit context
		{title: "long","cyoa.if": "a #{my tiddler} long string of characters"},
		// Unrelated placeholders cause no problems
		{title: "unrelated","cyoa.if": "#{other tiddler} == 0"},
		// An empty placeholder doesn't block processing of others
		{title: "empty","cyoa.if": "#{} == #{my tiddler}"},
		{title: "$:/config/flibbles/relink/fields/cyoa.if",text: "snippet"}]);
	var references = wiki.getTiddlerRelinkBackreferences("my tiddler");
	expect(references).toEqual({
		short: ["cyoa.if: #{} == 0"],
		long: ["cyoa.if: #{}"],
		empty: ["cyoa.if: #{} == #{}"]});
});

it("can update simple scripts",function() {
	var logger = $tw.utils.Logger.prototype;
	spyOn(console, "log");
	spyOn(logger, "alert");
	function test(newTitle,changed) {
		var wiki = new $tw.Wiki();
		var expected = changed? newTitle: "from title";
		wiki.addTiddlers([
			{title: "from title"},
			{title: "test","cyoa.if": "#{from title} == !#{from title}"},
			{title: "$:/config/flibbles/relink/fields/cyoa.if",text: "snippet"}]);
		logger.alert.calls.reset();
		wiki.renameTiddler("from title",newTitle);
		expect(wiki.getTiddler("test").fields["cyoa.if"]).toBe("#{"+expected+"} == !#{"+expected+"}");
		expect(logger.alert).toHaveBeenCalledTimes(changed? 0: 1);
	}
	test("to title",true);
	test("to {title}",true);
	test("to {{{{title}}}}",true);
	test("to {{{{title}}}");
	test("close}bracket");
	test("open{bracket");
	test("outward}{brackets");
});

it("can report defined prefixed filter scripts",function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "my tiddler"},
		// titles can report, and multiple placeholders can exist
		{title: "title","cyoa.if": "#a{[[my tiddler]] 'my tiddler'} == #A{\"my tiddler\"}"},
		// tag operators should report and have nested blurbs
		{title: "tag","cyoa.if": "#a{ [tag[my tiddler]] } == true"},
		// #z is not defined. This should not report
		{title: "undef","cyoa.if": "#z{ [tag[my tiddler]] } == true"},
		// references using {} can exist
		{title: "reference","cyoa.if": "#a{[tag{my tiddler!!field}]} == true"},
		// placeholders that don't reference target cause no problems
		{title: "unrelated","cyoa.if": "#{[tag[other]]} == 0"},
		{title: "$:/config/flibbles/relink/fields/cyoa.if",text: "snippet"},
		{title: "$:/config/flibbles/relink/operators/title",text: "title"},
		{title: "$:/config/flibbles/relink/operators/tag",text: "title"}]);
	var references = wiki.getTiddlerRelinkBackreferences("my tiddler");
	expect(references).toEqual({
		title: ["cyoa.if: #a{}", "cyoa.if: #a{}", "cyoa.if: #A{}"],
		tag: ["cyoa.if: #a{[tag[]]} == true"],
		reference: ["cyoa.if: #a{[tag{!!field}]} == true"]});
});

it("can relink defined prefixed filter scripts",function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "from title"},
		{title: "test","cyoa.if": "#a{ 'from title' [tag{from title}] } == #A{ [[from title]] }"},
		{title: "$:/config/flibbles/relink/operators/title",text: "title"},
		{title: "$:/config/flibbles/relink/fields/cyoa.if",text: "snippet"}]);
	spyOn(console, "log");
	wiki.renameTiddler("from title","to title");
	expect(wiki.getTiddler("test").fields["cyoa.if"])
		.toBe("#a{ 'to title' [tag{to title}] } == #A{ [[to title]] }");
});

it("handles failure within placeholder filter",function() {
	var wiki = new $tw.Wiki();
	var logger = $tw.utils.Logger.prototype;
	wiki.addTiddlers([
		{title: "from title"},
		{title: "test","cyoa.if": "#a{ [tag[from title]] } == #A{ 'from title' }"},
		{title: "$:/config/flibbles/relink/operators/title",text: "title"},
		{title: "$:/config/flibbles/relink/operators/tag",text: "title"},
		{title: "$:/config/flibbles/relink/fields/cyoa.if",text: "snippet"}]);
	spyOn(console, "log");
	spyOn(logger, "alert");
	wiki.renameTiddler("from title","to] title");
	expect(wiki.getTiddler("test").fields["cyoa.if"])
		.toBe("#a{ [tag[from title]] } == #A{ 'to] title' }");
	expect(logger.alert).toHaveBeenCalled();
});

it("handles failure of placeholder filter with braces",function() {
	var wiki = new $tw.Wiki();
	var logger = $tw.utils.Logger.prototype;
	wiki.addTiddlers([
		{title: "from title"},
		{title: "test","cyoa.if": "#a{ [tag[from title]] } == false"},
		{title: "$:/config/flibbles/relink/operators/tag",text: "title"},
		{title: "$:/config/flibbles/relink/fields/cyoa.if",text: "snippet"}]);
	spyOn(console, "log");
	spyOn(logger, "alert");
	wiki.renameTiddler("from title","to} title");
	expect(wiki.getTiddler("test").fields["cyoa.if"])
		.toBe("#a{ [tag[from title]] } == false");
	expect(logger.alert).toHaveBeenCalled();
});

});
