/*\

Returns a function for hashing strings deterministically.

\*/

'use strict';

var primes=[56369,34231,64063,14197,32911,61861,28411,263,56569,5749,41659,9649,46499,12853,45343,26513,24481];

var prime = function(i) {
	return primes[i % primes.length];
}

function get16bits(str,index) {
	var char = str.charCodeAt(index);
	var char2 = str.charCodeAt(index+1);
	return (char << 8) + char2;
}

/*
Common and quick hash function ripped from the internets
*/
exports.hash = function(str) {
	if(str.length <= 0) {
		return 0;
	}
	var hash = str.length,
		tmp;

	var len = 0;
	/* Main loop */
	while (len <= str.length-4) {
		hash  += get16bits(str,len);
		// The following line is my own addition to help increase cascading.
		hash = hash ^ (prime(hash) * prime(hash >> 5));
		tmp    = (get16bits(str,len+2) << 11) ^ hash;
		hash   = (hash << 16) ^ tmp;
		hash  += hash >> 11;
		len += 4;
	}

	/* Handle end cases */
	switch (str.length-len) {
	case 3:
		hash += get16bits (str,len);
		hash ^= hash << 16;
		hash ^= str.charCodeAt(len+2) << 18;
		hash += hash >> 11;
	case 2:
		hash += get16bits (str,len);
		hash ^= hash << 11;
		hash += hash >> 17;
	case 1:
		hash += str.charCodeAt(len);
		hash ^= hash << 10;
		hash += hash >> 1;
	}

	/* Force 'avalanching' of final 127 bits */
	hash ^= hash << 3;
	hash += hash >> 5;
	hash ^= hash << 4;
	hash += hash >> 17;
	hash ^= hash << 25;
	hash += hash >> 6;

	return hash;
};
