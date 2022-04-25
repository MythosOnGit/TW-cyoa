/*
Those last two characters can be: -._~
*/
var base64map ="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_!";
var bitsPerByte = 6;
var bitsPerByteN = 6n;
var bytesPerChunk = 5;
/*
30 is the maximum number of bits. Not Number.MAX_SAFE_INTEGER or whatever, because we're using bitwise operations, which convert to int32. 31 bits and one sign bit. I use 30 to be safer.
*/
var bitsPerChunk = 30;


var Base64 = function(string) {
	this.parse(string);
};

exports.Field = Base64;

var B64 = Base64.prototype;

B64.parse = function(string) {
	var stringCode = string || "0";
	var array = [];
	while (stringCode.length > bytesPerChunk) {
		var cutPoint = stringCode.length - bytesPerChunk;
		var endChunk = stringCode.substr(cutPoint);
		array.push(exports.parse64(endChunk));
		stringCode = stringCode.substr(0,cutPoint);
	}
	array.push(exports.parse64(stringCode));
	this.array = array;
};

B64.toString = function() {
	var stringCode = "";
	for(var index = this.array.length-1; index >= 0; --index) {
		var strChunk = exports.to64(this.array[index]);
		if(index != this.array.length - 1) {
			strChunk = pad_number(strChunk,bytesPerChunk);
		}
		stringCode += strChunk
	}
	return stringCode.replace(/^0+/,"");
};

B64.getRange = function(index,range) {
	var value = 0,
		end = index+range-1,
		ptr = end-(end%bitsPerChunk);
	do {
		var chunkStart = Math.max(ptr,index),
			chunkIndex = ptr / bitsPerChunk,
			bitOffset = chunkStart - ptr,
			bitMask = 2 << (end-chunkStart),
			chunk = ((this.array[chunkIndex] || 0) >> bitOffset) & (bitMask-1);
		value = (value * bitMask) + chunk;
		end = ptr-1;
		ptr -= bitsPerChunk;
	} while (end >= index);
	return value;
};

B64.setRange = function(index,range,value) {
	var end = index + range;
	while(index < end) {
		var chunkIndex = Math.floor(index / bitsPerChunk);
		var bitIndex = index % bitsPerChunk;
		var bit = value & 1;
		if(bit) {
			this.array[chunkIndex] |= (1 << bitIndex);
		} else {
			this.array[chunkIndex] &= ~(1 << bitIndex);
		}
		value = Math.floor(value / 2);
		index++;
	}
};

exports.to64 = function(number) {
	number = number || 0;
	var rtnString = "";
	var mask = (1 << bitsPerByte) - 1;
	while (number > 0) {
		rtnString = base64map[number & mask] + rtnString;
		number >>= bitsPerByte;
	}
	return rtnString || "0";
}

var maskN = (1n << bitsPerByteN) - 1n;

exports.to64n = function(bigNumber) {
	bigNumber = bigNumber || 0n;
	var rtnString = "";
	while (bigNumber > 0n) {
		rtnString = base64map[bigNumber & maskN] + rtnString;
		bigNumber >>= bitsPerByteN;
	}
	return rtnString || "0";
};

exports.parse64 = function(string) {
	var rtnNumber = 0;
	for(var index = 0; index < string.length; index++) {
		rtnNumber <<= bitsPerByte;
		var bit = base64map.indexOf(string[index]);
		if(bit < 0) {
			throw new Error("base64 error: Illegal character: '"+string[index]+"'");
		}
		rtnNumber += bit;
	}
	return rtnNumber;
}

exports.parse64n = function(string) {
	var rtnNumber = 0n;
	for(var index = 0; index < string.length; index++) {
		rtnNumber <<= bitsPerByteN;
		var bit = base64map.indexOf(string[index]);
		if(bit < 0) {
			throw new Error("base64 error: Illegal character: '"+string[index]+"'");
		}
		rtnNumber += BigInt(bit);
	}
	return rtnNumber;
}

function pad_number(n,width) {
	n = n + "";
	return n.length >= width ?
		n:
		stringRange("0",width - n.length) + n;
};

function stringRange(n,count) {
	return new Array(count+1).join(n);
}
