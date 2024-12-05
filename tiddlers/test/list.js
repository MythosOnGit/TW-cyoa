/*\
title: test/list.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoa StringArray utility methods.

\*/

var utils = require("$:/plugins/mythos/cyoa/js/cyoa/utils.js");

function flip(input,delimiter) {
	delimiter = delimiter || ".";
	var string = utils.stringifyList(input,delimiter);
	var output = utils.parseStringList(string,delimiter);
	expect(output).toEqual(input);
	return string;
};

describe("Cyoa Array",function() {

it("doesn't use escape characters that URIencode poorly",function() {
	var encodeSafeChars = [".","!","~","*","'","(",")","-","_"];
	// Two of those characters must be escaped, but what they're
	// escaped by should not explode in size when uriEncoded.
	var expectedLength = encodeSafeChars.join(" ").length + 2;
	var result = encodeURIComponent(flip(encodeSafeChars));
	expect(result).not.toContain("%");
	expect(result.length).toEqual(expectedLength,"Expected '"+result+"' to be a length "+expectedLength+", not "+result.length);
});

it("handles the empty elements",function() {
	expect(flip([])).toBe("");
	flip([""]);
	flip(["",""]);
	flip(["","",""]);
	flip(["a","","b"]);
	flip(["a","b",""]);
	flip(["a","b","",""]);
	flip(["","a","b"]);
	flip(["","","a","b"]);
});

it("ignores unfinished input strings",function() {
	expect(utils.parseStringList("~")).toEqual([]);
	expect(utils.parseStringList(".~")).toEqual(["."]);
	var legal = "with.content";
	expect(utils.parseStringList(legal+"~")).toEqual([legal]);
});

it("handles escape characters",function() {
	flip(["split.by.periods","another.split."]);
	flip([".","..","\\"]);
	flip(["split\\by\.slashes"]);
	flip(["another\\.split\\","actually\\a\\blackslash\\\\"]);
});

it("can override to change the delimiter",function() {
	expect(utils.parseStringList("aXb","X")).toEqual(["a","b"]);
	expect(utils.stringifyList("","X")).toEqual("");
	flip(["a","b","dXXd","X","lXl","XlX","X~X","~"],"X");
	flip([""],"X");
});

});
