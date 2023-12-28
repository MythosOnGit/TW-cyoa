/*\
description: bitfield (e.g. 7ZxR3d)
\*/

'use strict';

var utils = require('../../utils');

exports.name = 'bitfield';

exports.serialize = function(array,data) {
	// this array keeps track of what nodes have already been accounted for. a node with a BigInt number indicates the number of states starting from there. Nodes that are true/false, have already been accounted for by another node.
	var intermediateArray = new Array(array.length);
	function packSet(setArray) {
		var multiplier = 1n,
			state = 0n,
			subState,
			range;
		for(var index = 0; index < setArray.length; index++) {
			var set = setArray[index];
			if(Array.isArray(set)) {
				// Arrays represent pivot points
				var pivot = set[0];
				var offStates = BigInt(set[1]);
				range = offStates + BigInt(set[2]);
				if(!array[pivot]) {
					utils.removeFromTree(intermediateArray,pivot,data.downFamily);
					// the OFF subsets
					subState = packSet(set[3]);
				} else {
					utils.addToTree(intermediateArray,pivot,data.upFamily,data.downFamily,data.exMap);
					// all the possible OFF states + the ON substate
					subState = offStates + packSet(set[4]);
				}
			} else {
				range = countPossibleTreeStates(intermediateArray,set,data.downFamily);
				subState = getTreeState(array,intermediateArray,set,data.downFamily);
			}
			state += subState * multiplier;
			multiplier *= range;
		}
		return state;
	};
	for(var i = 0; i < array.length; i++) {
		// This is to deal with state corruption that could have occurred in earlier version of TW-CYOA. This can be removed later.
		if(array[i]) {
			utils.addToTree(array,i,data.upFamily,data.downFamily,data.exMap);
		}
	}
	var finalState = packSet(data.states);
	// If it's non-zero, convert it to a string and return
	var rtn = finalState? $cyoa.utils.to64n(finalState): '';
	var sanityCheck = exports.deserialize(rtn,data);
	for (var i = 0; i < sanityCheck.length; i++) {
		if (!!array[i] !== !!sanityCheck[i]) {
			throw new Error('Serialization mismatch on: ' + i);
		}
	}
	return rtn;
};

exports.deserialize = function(string,data) {
	var array = new Array(data.count);
	function unpackSet(setArray,state) {
		for(var index = 0; index < setArray.length; index++) {
			var range;
			var set = setArray[index];
			if(Array.isArray(set)) {
				// Arrays represent pivot points
				var pivot = set[0];
				var possibleOffStates = BigInt(set[1]);
				range = possibleOffStates + BigInt(set[2]);
				var subsetState = state % range;
				if(subsetState < possibleOffStates) {
					// Only supply the family-bound down-tree. Don't cross bridges
					utils.removeFromTree(array,pivot,data.downFamily);
					unpackSet(set[3],subsetState); // the OFF subsets
				} else {
					// Pass only the family-bould up-tree. Don't cross bridges
					utils.addToTree(array,pivot,data.upFamily,data.downFamily,data.exMap);
					// Subtract those on states
					subsetState -= possibleOffStates;
					unpackSet(set[4],subsetState); // the ON subsets
				}
			} else {
				// Single values are tree roots.
				range = countPossibleTreeStates(array,set,data.downFamily);
				setTreeState(array,set,data.downFamily,state % range);
			}
			state /= range;
		}
	};
	// Get the state from the input string
	var startingState = $cyoa.utils.parse64n(string);
	// Let's make sure we create the metadata we use to help pack and unpack
	if(!data.downBridges) {
		data.downBridges = utils.generateDownTree(data.bridges);
		data.upFamily = data.tree;
		data.downFamily = utils.generateDownTree(data.upFamily);
	};
	// Now to unpack the input string recursively
	unpackSet(data.states,startingState);
	crossAllBridges(array,data.bridges,data);
	return array;
};

function countPossibleTreeStates(array,node,down) {
	var product = 1n,
		children = down[node];
	if(children) {
		for(var index = 0; index < children.length; index++) {
			var child = children[index];
			if(array[child] === undefined) {
				product *= countPossibleTreeStates(array,child,down);
			}
		}
	}
	++product;
	array[node] = product;
	return product;
};

function getTreeState(array,intermediateArray,node,down) {
	var possibleStates = 1n,
		state;
	if(array[node]) {
		// If this node is ON
		state = 1n;
		// And if this is not a leaf;
		if(intermediateArray[node] !== 2n) {
			var children = down[node];
			if(children) {
				for(var counter = 0; counter < children.length; counter++) {
					var child = children[counter],
						maxChildStates = intermediateArray[child];
					if(maxChildStates && maxChildStates !== true) {
						state += getTreeState(array,intermediateArray,child,down) * possibleStates;
						possibleStates *= intermediateArray[child];
					}
				}
			}
		}
	} else {
		state = 0n;
	}
	return state;
};

function setTreeState(array,node,down,state) {
	var isLeaf = array[node] === 2n;
	if(state > 0n) {
		array[node] = true;
		state -= 1n;
	} else {
		array[node] = false;
	}
	if(!isLeaf) {
		// Only leaf nodes have a value of 2. If it's a leaf, we stop
		// before recursing into unrelated nodes.
		var children = down[node];
		if(children) {
			for(var index = 0; index < children.length; index++) {
				var child = children[index];
				var maxChildStates = array[child];
				if(maxChildStates && maxChildStates !== true) {
					var childStates = state % maxChildStates;
					setTreeState(array,child,down,childStates);
					state -= childStates;
					state /= maxChildStates;
				}
			}
		}
	}
};

/*
This touches all bridges after the unpacking. It can't be done during unpacking, because that would interfere with how tree segment sizes are calculated.
*/
function crossAllBridges(array,bridges,data) {
	for(var index in bridges) {
		if(array[index]) {
			var set = bridges[index];
			for(var bridgeIndex = 0; bridgeIndex < set.length; bridgeIndex++) {
				utils.addToTree(array,set[bridgeIndex],data.up,data.down,data.exMap);
			}
		}
	}
}
