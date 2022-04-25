/*\
title: test/cyoa/base64.js
type: application/javascript
tags: $:/tags/test-spec

Tests the bitfield tracked types.

\*/

const Field = require("$:/plugins/mythos/cyoa/js/cyoa/base64.js").Field;

describe("base64",function() {

function range(n,count) {
	return new Array(count+1).join(n);
};

it("doesn't trail zeros in end chunk",function() {
	var b = new Field("");
	b.setRange(0,1,1);

	expect(b.toString()).toBe("1");
});

it("trails zeros in middle chunks",function() {
	var b = new Field("");
	b.setRange(186,1,1);
	expect(b.toString()).toBe("1"+range("0",31));

	b.setRange(6,1,1);
	expect(b.toString()).toBe("1"+range("0",29)+"10");
});

it("doesn't choke on undefined chunks",function() {
	var b = new Field("");
	b.setRange(390,1,1);
	expect(b.toString()).toBe("1"+range("0",65));
});

it("handles large indices without rounding",function() {
	var b = new Field("");
	var expected = range("!",100);
	for(var i = 0; i < 600; i++) {
		b.setRange(i,1,1);
	}
	expect(b.toString()).toBe(expected);
});

it("checks single bits correctly",function() {
	$tw.utils.each([0,1,6,7,8,12,13,500],function(index) {
		var bitField = new Field("");
		bitField.setRange(index,1,1)
		var result = bitField.getRange(index,1)
		expect(result).toBe(1,("Failed on "+index))
	});
});

it("can set bits in middle of ranges",function() {
	var bitField = new Field();
	bitField.setRange(3,5,17);
	expect(bitField.getRange(3,5)).toBe(17);
	bitField.setRange(3,5,19);
	expect(bitField.getRange(3,5)).toBe(19);
	// Resetting lower bits moves the range down in value
	bitField.setRange(3,5,7);
	expect(bitField.getRange(3,5)).toBe(7);
	var big = Number.MAX_SAFE_INTEGER;
	bitField.setRange(28,80,big);
	expect(bitField.getRange(28,80)).toBe(big);
});

it("won't let large indices interfere with small indices",function() {
	var a = new Field("1");
	var b = new Field("2000001");
	expect(a.getRange(0,1)).toBe(1);
	expect(b.getRange(0,1)).toBe(1);
});

it("throws exception when encountering illegal characters",function() {
	expect(() => new Field("#4")).toThrowError("base64 error: Illegal character: '#'");
});

it("treats the empty string as its default",function() {
	var b = new Field();
	expect(b.toString()).toBe("");
	b = new Field("0");
	expect(b.toString()).toBe("");
	b = new Field("00000");
	expect(b.toString()).toBe("");
	b = new Field("");
	expect(b.toString()).toBe("");
});

it("can reset bits",function() {
	var bitField = new Field("7");
	bitField.setRange(1,1,0);
	expect(bitField.getRange(0,1)).toBe(1);
	expect(bitField.toString()).toBe("5");
});

it("can reset large indices",function() {
	var bitField = new Field("2000001");
	bitField.setRange(37,1,0);
	expect(bitField.toString()).toBe("1");
});

it("can reset already off indices",function() {
	var bitField = new Field();
	bitField.setRange(37,1,0);
	expect(bitField.toString()).toBe("");
});

});
