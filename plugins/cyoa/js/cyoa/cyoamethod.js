/*\
cyoa.module-type: cyoamethod

Returns a function for shuffling. Used in index selection.
\*/

var hash = require("./hash");

exports.shuffle = function(index,seed) {
	return function(deckSize) {
		seed = seed.toString() + Math.floor(index / deckSize).toString();
		var array = [];
		for(var number = 0; number < deckSize; number++) {
			array.push(number);
		}
		var loopCount = Math.min(deckSize-2,index % deckSize);
		for(var loopNumber = 0; loopNumber <= loopCount; loopNumber++) {
			seed = Math.abs(hash.hash(seed.toString()));
			var select = (seed % (deckSize - loopNumber)) + loopNumber;
			var tmp = array[loopNumber];
			array[loopNumber] = array[select];
			array[select] = tmp;
		}
		return array[index % deckSize];
	};
};

exports.cap = function(index,seed) {
	return function(listSize) {
		return Math.max(0,Math.min(listSize-1,index));
	};
};
