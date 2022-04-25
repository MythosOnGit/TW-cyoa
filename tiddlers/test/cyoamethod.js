/*\
title: test/cyoamethod.js
type: application/javascript
tags: $:/tags/test-spec

Tests the cyoamethods: shuffle, cap, hash, etc...

\*/

var cyoa = require("test/utils.js").cyoa;

describe("cyoamethods",function() {

function shuffle(index,seed,deckSize) {
	return cyoa.shuffle(index,seed)(deckSize);
};

it("hash: works",function() {
	expect(typeof cyoa.hash("some string")).toBe("number");
});

it("shuffle: has one of each per deck",function() {
	var decksize = 13;
	for(var i = 0; i < 10; i++) {
		var outcomes = [];
		for(var j = 0; j < decksize; j++) {
			var val = shuffle(j + (i*decksize),"randoseed",decksize);
			outcomes[val] = (outcomes[val] || 0) + 1;
		}
		for(var j = 0; j < decksize; j++) {
			expect(outcomes[j]).toEqual(1);
		}
	}
});

it("shuffle: distributes relatively evenly",function() {
	var decksize = 5;
	var repetitions = 600;
	var outcomes = [];
	for(var i = 0; i < decksize; i++) {
		outcomes[i] = [];
		for(var j = 0; j < decksize; j++) {
			outcomes[i][j] = 0;
		}
	}
	for(var i = 0; i < repetitions*decksize; i++) {
		var value = shuffle(i,"otherseed",decksize);
		outcomes[i%decksize][value] += 1;
	}
	var tolerance = (repetitions / decksize) * 0.8;
	for(var i = 0; i < decksize; i++) {
		for(var j = 0; j < decksize; j++) {
			expect(outcomes[i][j]).toBeGreaterThanOrEqual(tolerance);
		}
	}
});

it("cap: properly caps from zero to size-1",function() {
	function cap(index,size) {
		return cyoa.cap(index)(size);
	};
	expect(cap(3,5)).toBe(3);
	expect(cap(5,5)).toBe(4);
	expect(cap(100,5)).toBe(4);
	expect(cap(-1,5)).toBe(0);
	expect(cap(0,5)).toBe(0);
});

});
