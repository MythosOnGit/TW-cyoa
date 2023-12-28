/*\
description: Variable-length quantifiers (e.g. lg45s)
\*/

'use strict';

exports.name = 'vlq';

exports.deserialize = function(string, setData) {
	var numbers = $cyoa.utils.parseVlqRun(string);
	if(numbers.length > 0) {
		if((1/numbers[0]) > 0) {
			return deserializeIntegers(numbers);
		} else {
			numbers[0] *= -1;
			return deserializeRationals(numbers);
		}
	}
	return Object.create(null);
};

function deserializeIntegers(numbers) {
	var index = 0, value,
		map = Object.create(null);
	for(var ptr = 0; ptr < numbers.length; ++ptr) {
		var number = numbers[ptr];
		if(1/number < 0) {
			value = -number;
		} else {
			index += number;
			++ptr;
			value = numbers[ptr];
		}
		map[index] = value;
		++index;
	}
	return map;
};

function deserializeRationals(numbers) {
	var index = 0, value,
		map = Object.create(null);
	for(var ptr = 0; ptr < numbers.length; ++ptr) {
		index += numbers[ptr];
		var numerator = numbers[ptr+1];
		var denominator = 1;
		var exponent = 0;
		++ptr;
		if((1/numbers[ptr+1]) < 0) {
			++ptr;
			// Offset denominator by for for the space savings. 0 no used
			denominator = 1-numbers[ptr];
			if ((1/numbers[ptr+1]) < 0) {
				++ptr;
				exponent = 2-numbers[ptr];
				var sign = exponent % 2;
				exponent = ((exponent - sign) / 2) * (sign? -1: 1);
			}
		}
		map[index] = (numerator / denominator) * (32**exponent);
		++index;
	}
	return map;
};

exports.serialize = function(map, setData) {
	var numbers;
	for(var index in map) {
		var number = map[index];
		if(typeof number === 'number'
		&& (number % 1 !== 0 || Math.abs(number) >= Number.MAX_SAFE_INTEGER*1024)) {
			var numbers = serializeRationals(map);
			numbers[0] *= -1;
			return $cyoa.utils.toVlqRun(numbers);
		}
	}
	return $cyoa.utils.toVlqRun(serializeIntegers(map));
};

function serializeIntegers(map) {
	var numbers = [],
		ptr = 0;
	for(var index in map) {
		var number = map[index];
		if(typeof number === 'number') {
			// If not the first,
			// the adjacent number is next,
			// and it's not negative, we can use the abridged notation
			if(ptr > 0 && index == ptr && (1/number) >= 0) {
				numbers.push(-number);
			} else {
				numbers.push(index-ptr,number);
				ptr = index;
			}
			++ptr;
		}
	}
	return numbers;
};

function serializeRationals(map) {
	var numbers = [],
		ptr = 0;
	for(var index in map) {
		var number = map[index];
		if(typeof number === 'number') {
			numbers.push(index-ptr);
			ptr = index;
			numbers.push.apply(numbers,serializeRational(number));
			++ptr;
		}
	}
	return numbers;
};

function serializeRational(number) {
	var exponent = 0;
	var array;
	if(Math.abs(number) < 2**14 && number % 1 == 0) {
		return [number];
	}
	if(number % 64 === 0) {
		do {
			++exponent;
			number /= 32;
		} while(number % 2 === 0);
	} else {
		while(number*number <= 2**-10) {
			--exponent;
			number *= 32;
		}
	}
	var decimal = number % 1;
	var max = Number.MAX_SAFE_INTEGER;
	var num = Math.round(decimal * max);
	// Max denominator of 512 limits it to a vlq length of 2
	var ratio = limitDenominator(num,max,512);
	// the denominator is ofset by 1 because 0 is never a possible value. Let's save space.
	var array = [((number - decimal) * ratio[1]) + ratio[0]];
	if(ratio[1] !== 1 || exponent !== 0) {
		// -1*(ratio[1]-1) is important over 1-ratio[1], because it allows -0
		array.push(-1*(ratio[1]-1));
	}
	if(exponent !== 0) {
		// We put in the exponent, using the least significant digit to indicate sign
		var sign = exponent < 0;
		if (sign) {
			exponent *= -1;
		}
		// exponent must always be >=1 or <=-1, so we can shift by 2
		array.push(2-(exponent * 2 + sign));
	}
	return array;
};

// Borrowed from the pytho fractions library
function limitDenominator(numerator,denominator,max) {
	if(denominator <= max) {
		return [numerator,denominator];
	}
	var floating = numerator/denominator,
		p0 = 0,
		q0 = 1,
		p1 = 1,
		q1 = 0,
		n = numerator,
		d = denominator;
	while(true) {
		var a = Math.floor(n/d);
		var q2 = q0+a*q1;
		if(q2 > max) {
			break;
		}
		var p2 = p0+a*p1;
		p0 = p1;
		q0 = q1;
		p1 = p2;
		q1 = q2;
		var tmp = n;
		n = d;
		d = tmp - a*d;
	}
	var k = Math.floor((max-q0)/q1);
	var bound1 = [p0+k*p1, q0+k*q1];
	var bound2 = [p1,q1];
	if (Math.abs((bound2[0]/bound2[1]) - floating) <= Math.abs((bound1[0]/bound1[1]) - floating)) {
		return bound2;
	} else {
		return bound1;
	}
};
