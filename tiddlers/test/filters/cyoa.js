/*\
title: test/filters/cyoa.js
type: application/javascript
tags: $:/tags/test-spec

Tests the [cyoa[]] super filter operator.

These tests rely on the filter operator in tiddlers/filters/test.js

\*/

describe("cyoa filter",function() {

/*
If this fails for that newline, remember: `perl -pi -e 'chomp if eof' $file
*/
it("issues error on bad or missing suffix",function() {
	var wiki = new $tw.Wiki();
	var err = "Filter Error: Unknown suffix '' for the 'cyoa' filter operator";
	expect(wiki.filterTiddlers("[cyoa[]]")).toEqual([err]);
	err = "Filter Error: Unknown suffix 'noexist' for the 'cyoa' filter operator";
	expect(wiki.filterTiddlers("[cyoa:noexist[]]")).toEqual([err]);
});

});
