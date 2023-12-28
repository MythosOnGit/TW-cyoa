/*\
description: Variable-length quantifiers (e.g. lvaluejval)
\*/

'use strict';

exports.name = 'vlq';

exports.serialize = function(map, setData) {
	var array = [],
		ptr = 0,
		keys = Object.keys(map).map(parseFloat).sort();
	for(var i = 0; i < keys.length; ++i) {
		var index = keys[i];
		var value = map[index];
		// We only act if this is an actual positive index, and a valid value.
		if(index >= 0 && value !== undefined && value !== null) {
			if(index === ptr) {
				// Index is adjacent to previous. Abridged format
				array.push($cyoa.utils.toVlq(-value.length));
			} else {
				// Standard. Put in index and length
				// We always subract 1 because normal indices are always 2 away.
				array.push($cyoa.utils.toVlq(index-ptr-1), $cyoa.utils.toVlq(value.length));
			}
			array.push(value);
			ptr = index + 1;
		}
	}
	return array.join('');
};

exports.deserialize = function(string, setData) {
	var stringPos = 0,
		index = 0,
		map = Object.create(null),
		output, length;
	while(stringPos < string.length) {
		// fetch index
		output = $cyoa.utils.parseVlq(string, stringPos);
		stringPos = output.pos;
		// We do 1/value because that allows us to test for -0
		if ((1/output.value) >= 0) {
			// normal index. Length of string will follow
			// We put in that extra 1 because we're always at least 2 away for normal indices
			index += output.value + 1;
			output = $cyoa.utils.parseVlq(string, stringPos);
			stringPos = output.pos;
			length = output.value;
		} else {
			// Abridged version. No length will follow
			length = -output.value;
		}
		// fetch string
		map[index] = string.substr(stringPos, length);
		++index;
		stringPos += length;
	}
	return map;
};
