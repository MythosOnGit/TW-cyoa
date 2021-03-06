/*\
cyoa.module-type: state

A space-efficient object for storing binary flags for pages.

\*/

var Base64 = require("./base64");
var utils = require("./utils");

var BitField = function(string,groupData) {
	var self = this;
	if(groupData) {
		this.data = groupData;
		if(!groupData.down) {
			groupData.down = utils.generateDownTree(groupData.up);
			groupData.downBridges = utils.generateDownTree(groupData.bridges);
			groupData.exMap = utils.generateExclusiveMap(groupData.exList);
		}
	}
	// Now to unpack the input string recursively
	this.array = new Array(groupData.count);
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
					self.remove(pivot);
					unpackSet(set[3],subsetState); // the OFF subsets
				} else {
					self.add(pivot);
					// Subtract those on states
					subsetState -= possibleOffStates;
					unpackSet(set[4],subsetState); // the ON subsets
				}
			} else {
				// Single values are tree roots.
				range = countPossibleTreeStates(self.array,set,self.data.down);
				setTreeState(self.array,set,self.data.down,state % range);
			}
			state /= range;
		}
	};
	unpackSet(groupData.states,Base64.parse64n(string));
};

exports.bitfield = BitField;

var Bp = BitField.prototype;

Bp.data = {
	exMap: Object.create(null),
	bridges: Object.create(null)
};

Bp.toString = function() {
	var self = this;
	// this array keeps track of what nodes have already been accounted for
	var intermediateArray = new Array(this.array.length);
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
				if(!self.array[pivot]) {
					propogate(intermediateArray,pivot,self.data.down);
					// the OFF subsets
					subState = packSet(set[3]);
				} else {
					propogate(intermediateArray,pivot,self.data.up,self.data.exMap,self.data.down);
					// all the possible OFF states + the ON substate
					subState = offStates + packSet(set[4]);
				}
			} else {
				range = countPossibleTreeStates(intermediateArray,set,self.data.down);
				subState = getTreeState(self.array,intermediateArray,set,self.data.down);
			}
			state += subState * multiplier;
			multiplier *= range;
		}
		return state;
	};
	var string = Base64.to64n(packSet(this.data.states));
	if (string === "0") {
		return "";
	}
	return string;
};

Bp.clear = function() {
	for(var index = 0; index < this.array.length; index++) {
		this.array[index] = false;
	}
};

Bp.has = function(index) {
	return this.array[index];
}

Bp.add = function(index) {
	var parents = this.data.up[index];
	this.array[index] = true;
	var exclusions = this.data.exMap[index];
	if(exclusions) {
		for(var counter = 0; counter < exclusions.length; counter++) {
			if(exclusions[counter] !== index) {
				this.remove(exclusions[counter]);
			}
		}
	}
	var bridges = this.data.bridges[index];
	if(bridges) {
		for(var counter = 0; counter < bridges.length; counter++) {
			this.add(bridges[counter]);
		}
	}
	if(parents) {
		for(var counter = 0; counter < parents.length; counter++) {
			if(this.array[parents[counter]] !== true) {
				this.add(parents[counter]);
			}
		}
	}
};

Bp.remove = function(index) {
	var children = this.data.down[index];
	this.array[index] = false;
	var bridges = this.data.downBridges[index];
	if(bridges) {
		for(var counter = 0; counter < bridges.length; counter++) {
			this.remove(bridges[counter]);
		}
	}
	if(children) {
		for(var counter = 0; counter < children.length; counter++) {
			if(this.array[children[counter]] !== false) {
				this.remove(children[counter]);
			}
		}
	}
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
	product += 1n;
	array[node] = product;
	return product;
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
					var child = children[counter];
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

function propogate(array,index,direction,exclusionMap,down) {
	var parents = direction[index];
	array[index] = true;
	if(exclusionMap) {
		var exclusions = exclusionMap[index];
		if(exclusions) {
			for(var counter = 0; counter < exclusions.length; counter++) {
				if(exclusions[counter] !== index) {
					propogate(array,exclusions[counter],down);
				}
			}
		}
	}
	if(parents) {
		for(var counter = 0; counter < parents.length; counter++) {
			if(array[parents[counter]] !== true) {
				propogate(array,parents[counter],direction,exclusionMap,down);
			}
		}
	}
};
