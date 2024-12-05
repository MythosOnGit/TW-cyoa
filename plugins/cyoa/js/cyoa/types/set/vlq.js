/*\
description: Variable-length quantifiers

\*/

'use strict';

var utils = require('../../utils');

var delimiter = '.';

exports.name = 'vlq';

exports.deserialize = function(string,data) {
	var vlqNumbers = $cyoa.utils.parseVlqRun(string);
	var offset = 0;
	var maxLength = data.tracked.length;
	var set = Object.create(null);
	for (var i = 0; i < vlqNumbers.length; i++) {
		var number = vlqNumbers[i];
		if(number < 0) {
			var bitMap = -number;
			var end = offset + 4;
			var ptr = offset;
			while(bitMap > 0) {
				if(bitMap % 2) {
					if(ptr >= end) {
						end += 5;
					}
					utils.addToTree(set,ptr,data.up,data.down,data.exMap);
					--bitMap;
				}
				bitMap /= 2;
				++ptr;
			}
			offset = end;
		} else {
			offset += number + 4;
			// Add it, only if it's in range
			if (offset < maxLength) {
				utils.addToTree(set,offset,data.up,data.down,data.exMap);
			}
			++offset;
		}
	}
	return set;
};

exports.serialize = function(set,data) {
	var array = findProminentActives(set,data).sort((a,b) => a - b);
	var vlqNumbers = [];
	var index = 0;
	var bitRange = 4;
	var bitMap = 0;
	for(var i = 0; i < array.length; ++i) {
		var offset = array[i] - index;
		if(bitMap > 0) {
			// 49 is the last bitRange threshold we can use. 54 exceeds MAX_SAFE_INTEGER
			if(offset < bitRange + 5 && offset < 49) {
				bitMap += 2**offset;
				if(offset >= bitRange) {
					bitRange += 5;
				}
				continue;
			} else {
				vlqNumbers.push(-bitMap);
				offset -= bitRange;
				// Yes, we do have to update the index incase we immediately start another bitRange.
				index += bitRange;
				bitRange = 4;
				bitMap = 0;
			}
		}
		if(offset < bitRange) {
			bitMap = 2**offset;
		} else {
			// We can snip off a little bit on the number because 0-3 never
			// occurs. We'd have used a bitrange.
			vlqNumbers.push(offset-bitRange);
			index += offset + 1;
		}
	}
	if(bitMap > 0) {
		vlqNumbers.push(-bitMap);
	}
	return $cyoa.utils.toVlqRun(vlqNumbers);
};

function findProminentActives(set,data) {
	var array = [];
	for(var index in set) {
		// Find all the actives nodes that don't have any active children
		if(set[index]) {
			var children = data.down[index];
			if(children && children.some(child => set[child])) {
				continue;
			}
			array.push(parseInt(index));
		}
	}
	return array;
};
