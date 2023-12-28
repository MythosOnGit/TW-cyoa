'use strict';

exports.error = function(error,document) {
	console.error(error);
	if(document) {
		var elem = document.getElementsByClassName('cyoa-error')[0];
		if(elem) {
			var str = '<li class=\'cyoa-error-item\'>'+error+'</li>';
			elem.innerHTML += str;
		}
	}
}

exports.clearErrors = function(document) {
	var elem = document.getElementById('cyoa-error');
	while (elem && elem.lastChild) {
		elem.removeChild(elem.lastChild);
	}
}

exports.log = function(message) {
}

/*
Takes an array of arrays and builds a map where each item points to a conglomerate array of all the ones including it.
[[1,2], [2,3]] => {1: [1,2], 2: [1,2,2,3], 3: [2,3]}
*/
exports.generateExclusiveMap = function(excludeLists) {
	var map = Object.create(null);
	for(var index = 0; index < excludeLists.length; index++) {
		var list = excludeLists[index];
		for(var listIndex = 0; listIndex < list.length; listIndex++) {
			var id = list[listIndex];
			if(map[id]) {
				map[id] = map[id].concat(list);
			} else {
				map[id] = list;
			}
		}
	}
	return map;
};

/*
Takes a map of nodes pointing to parents and reverses it.
*/
exports.generateDownTree = function(upTree) {
	var downTree = Object.create(null);
	for(var node in upTree) {
		var parents = upTree[node];
		for(var index = 0; index < parents.length; index++) {
			var parent = parents[index];
			downTree[parent] = downTree[parent] || [];
			downTree[parent].push(node);
		}
	}
	return downTree;
};

exports.addToTree = function(array,index,up,down,exclusionMap) {
	var parents = up[index];
	array[index] = true;
	var exclusions = exclusionMap[index];
	if(exclusions) {
		for(var counter = 0; counter < exclusions.length; counter++) {
			if(exclusions[counter] !== index) {
				exports.removeFromTree(array,exclusions[counter],down);
			}
		}
	}
	if(parents) {
		for(var counter = 0; counter < parents.length; counter++) {
			if(array[parents[counter]] !== true) {
				exports.addToTree(array,parents[counter],up,down,exclusionMap);
			}
		}
	}
};

exports.removeFromTree = function(array,index,down) {
	var children = down[index];
	array[index] = false;
	if(children) {
		for(var counter = 0; counter < children.length; counter++) {
			if(array[children[counter]] !== false) {
				exports.removeFromTree(array,children[counter],down);
			}
		}
	}
};

exports.parseStringList = function(string,delimiter) {
	var str = '',
		escaped = false,
		anyNonEmpty = false,
		list = [];
	string = string || '';
	for(var index=0; index<string.length;index++) {
		var c = string.charAt(index);
		if(escaped) {
			str += c;
			anyNonEmpty = true;
			escaped = false;
		} else {
			if(c=='~') {
				escaped = true;
			} else if(c==delimiter) {
				list.push(str);
				str = '';
			} else {
				anyNonEmpty = true;
				str += c;
			}
		}
	}
	// Special case. Don't add the last thing if we have only
	// empty strings. '' -> [], '.' -> ['']
	if(anyNonEmpty) {
		list.push(str);
	}
	return list;
};

exports.stringifyList = function(list,delimiter) {
	var anyNonEmpty = false;
	var array = [];
	for(var index = 0; index < list.length; index++) {
		var item = list[index].toString();
		anyNonEmpty = anyNonEmpty || (item.length > 0);
		array.push(escapeValue(item,delimiter));
	}
	var rtn = array.join(delimiter);
	// Special case.
	// Arrays of empty strings need an extra dot or else they
	// lose one element when stringified and back
	if(!anyNonEmpty && list.length > 0) { rtn += delimiter; };
	return rtn;
};

function escapeValue(string,delimiter) {
	var str = '';
	for(var index=0; index<string.length;index++) {
		var c = string.charAt(index);
		if(c=='~' || c==delimiter) {
			str = str+'~'+c;
		} else {
			str = str+c;
		}
	}
	return str;
};
