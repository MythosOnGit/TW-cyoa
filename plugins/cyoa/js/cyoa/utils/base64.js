'use strict';

/*
Those last two characters can also be: -._~
*/
var base64map ='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_!';
var bitsPerByte = 6;
var bitsPerByteN = 6n;
var mask = (1 << bitsPerByte) - 1;
var maskN = (1n << bitsPerByteN) - 1n;

exports.to64 = function(integer) {
	integer = integer || 0;
	var rtnString = '';
	while (integer > 0) {
		rtnString = base64map[integer & mask] + rtnString;
		integer >>= bitsPerByte;
	}
	return rtnString || '0';
}

exports.parse64 = function(string) {
	var rtnNumber = 0;
	for(var index = 0; index < string.length; index++) {
		rtnNumber <<= bitsPerByte;
		var bit = base64map.indexOf(string[index]);
		if(bit < 0) {
			throw new Error('base64 error: Illegal character: \''+string[index]+'\'');
		}
		rtnNumber += bit;
	}
	return rtnNumber;
};

exports.to64n = function(bigInteger) {
	bigInteger = bigInteger || 0n;
	var rtnString = '';
	while (bigInteger > 0n) {
		rtnString = base64map[bigInteger & maskN] + rtnString;
		bigInteger >>= bitsPerByteN;
	}
	return rtnString || '0';
};

exports.parse64n = function(string) {
	var rtnNumber = 0n;
	for(var index = 0; index < string.length; index++) {
		rtnNumber <<= bitsPerByteN;
		var bit = base64map.indexOf(string[index]);
		if(bit < 0) {
			throw new Error('base64 error: Illegal character: \''+string[index]+'\'');
		}
		rtnNumber += BigInt(bit);
	}
	return rtnNumber;
};

exports.toVlq = function(integer) {
	var signedBit;
	var string = '';
	if(integer % 1 !== 0) {
		throw new Error('vlq error: Illegal integer for vlq: '+integer);
	}
	// This obtuse way of testing for pos/neg accounts for -0
	if((1 / integer) > 0) {
		signedBit = 0;
	} else {
		// Set the signed bit
		signedBit = 16;
		integer = -integer;
	}
	var carryOverBit = 0;
	while(integer >= 16) {
		var range = integer % 32;
		string = base64map[range + carryOverBit] + string;
		integer = (integer - range) / 32;
		carryOverBit = 32;
	}
	return base64map[integer + signedBit + carryOverBit] + string;
};

exports.parseVlq = function(string, pos) {
	pos = pos || 0;
	var value = 0;
	var number = base64map.indexOf(string[pos++]);
	if(number == -1) {
		throw new Error('vlq error: Illegal string at pos '+(pos-1)+': \''+string+'\'');
	}
	var negative = number & 16;
	number -= negative;
	while(number >= 32) {
		if(pos >= string.length) {
			throw new Error('vlq error: Unexpected end to string: \''+string+'\'');
		}
		value += number % 32;
		value *= 32;
		number = base64map.indexOf(string[pos++]);
	}
	value += number;
	return {value: negative? -value: value, pos: pos};
};

exports.toVlqRun = function(arrayOfIntegers) {
	return arrayOfIntegers.map(exports.toVlq).join('');
};

exports.parseVlqRun = function(string) {
	var numbers = [];
	var pos = 0;
	while(pos < string.length) {
		var set = exports.parseVlq(string, pos);
		numbers.push(set.value);
		pos = set.pos;
	}
	return numbers;
};
