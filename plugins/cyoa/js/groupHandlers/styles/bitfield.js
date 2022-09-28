/*\
description: bit field (e.g. 7ZxR3d)
title: $:/plugins/mythos/cyoa/js/groupHandlers/styles/bitfield.js
type: application/javascript
module-type: cyoagrouphandlerstyle

\*/

var utils = require("$:/plugins/mythos/cyoa/js/cyoa/utils.js");

exports.name = "bitfield";

/*
Bitfields only work for sets.
*/
exports.only = "set";

exports.init = function() {
	// The number of version groups that exist. Bitfield needs to isolate new entries into their own version groups.
	this.count = 0;
	this.implications = Object.create(null);
	this.exclusions = Object.create(null);
	this.newEntries = Object.create(null);
};

/*
Bitfield uses base-10 indexes under the hood.
*/
exports.getIdFor = function(entry,index) {
	return index;
};

exports.touch = function(wiki,info,index) {
	// Let's collect the entries for ourselves. We'll need them to build the bitfield tree.
	var changed = false;
	if (info.tree === undefined) {
		// It's new. Thus, we must be past all pre-existing entries. We can assign a group and set its initial implications in stone.
		this.newEntries[index] = true;
		info.tree = [];
		if(info.imply) {
			for(var i = 0; i < info.imply.length; i++) {
				var parentIndex = info.imply[i];
				// If the parent comes after this new entry, or we already discovered that it's new, then it must be new. New pages can tree with new pages.
				if(parentIndex > index || this.newEntries[parentIndex]) {
					info.tree.push(parentIndex);
				}
				// else don't add it. New pages can't be treed with old pages.
			}
		}
		// We do the same for exclusions, except exclusions aren't written if there's nothing worth writing.
		if(info.exclude) {
			for(var i = 0; i < info.exclude.length; i++) {
				var parentIndex = info.exclude[i];
				if(parentIndex > index || this.newEntries[parentIndex]) {
					info.treeX = info.treeX || [];
					info.treeX.push(parentIndex);
				}
			}
		}
		changed = true;
	}
	// Collect this information for bitfield tree generation
	this.count++;
	if(info.tree.length > 0) {
		this.implications[index] = info.tree;
	}
	if(info.treeX) {
		this.exclusions[index] = info.treeX
	}
	return changed;
};

// Bitfields have a lot more data that must be exported for the generated story. It uses a specialized tree to compact itself down.
exports.exportData = function(data) {
	data.count = this.count;
	data.bridges = makeBridges(this.implications,data.up);
	data.states = generateGraphData(this.implications,this.exclusions,this.count);
	// Replace old up tree with the one that properly reflects the tree.
	data.up = this.implications;
};

/*
Bridges make up the difference between what implications our tree reflects, and what implications there are.
The treeImplications are implications that the bitfield tree represents.
The tiddlerImplications are implications reflected by "cyoa.imply", which might not match the bitfield tree, often because connections were introduced in later versions.
*/
function makeBridges(treeImplications,tiddlerImplications) {
	var bridges = Object.create(null);
	for(var index in tiddlerImplications) {
		var tiddlerParents = tiddlerImplications[index];
		var treeParents = treeImplications[index] || [];
		for(var pIndex = 0; pIndex < tiddlerParents.length; pIndex++) {
			var parentId = tiddlerParents[pIndex];
			if(treeParents.indexOf(parentId) < 0) {
				// Then the relationship must be handled through a bridge and not have an actual connecting edge in the tree
				bridges[index] = bridges[index] || [];
				bridges[index].push(tiddlerParents[pIndex]);
			}
		}
	}
	return bridges;
};

//// Below produces the generated data necessary to unpack graph states.

/*
Generates data used to quickly parse a bitstring into a graph, and reverse
[ treeRoot,
  [pivot, off_states, on_states, off, on],
  ...]
off and on are recursive graphData for that subgraph
*/
function generateGraphData(up,exclusions,count) {
	var set = Object.create(null);
	var down = utils.generateDownTree(up);
	for(var index = 0; index < count; index++) {
		set[index] = true;
	}
	function countStates(group) {
		var data = [];
		var connectedGroups = splitIntoGroups(group,up,down,exclusions);
		var states = 1n;
		for(var index = 0; index < connectedGroups.length; index++) {
			var connectedGroup = connectedGroups[index];
			var pivot = findPivot(connectedGroup,up,exclusions),
				subStates,
				subdata;
			if(pivot !== null) {
				var noDescendentsGroup = subgroup(connectedGroup,pivot,down),
					noAncestorsGroup = subgroup(connectedGroup,pivot,up,exclusions,down),
					off = countStates(noDescendentsGroup),
					on = countStates(noAncestorsGroup);
				// BigInt can't JSON parse, so we've got to make it string
				subdata = [
					parseInt(pivot),
					off.states.toString(),
					on.states.toString(),
					off.data,
					on.data];
				subStates = off.states + on.states;
			} else {
				subdata = parseInt(getTreeRoot(connectedGroup,up));
				subStates = treeStates(connectedGroup,down,subdata);
			}
			states *= subStates;
			data.push(subdata);
		}
		return {states: states,data: data};
	};
	return countStates(set).data;
};

function subgroup(group,pivot,lineage,exclusions,down) {
	//console.log("Starting Subgroup carving",group);
	var prune = Object.create(null);
	function recurse(ptr) {
		prune[ptr] = true;
		var immediates = lineage[ptr];
		if(immediates) {
			for(var index = 0; index < immediates.length; index++) {
				if(!prune[immediates[index]]) {
					recurse(immediates[index]);
				}
			}
		}
	};
	recurse(pivot);
	// Now deal with any exclusives that are associated with this pivot
	if(exclusions) {
		var exclusives = exclusions[pivot];
		if(exclusives) {
			// All exclusives propogate down, not up.
			lineage = down;
			for(var index = 0; index < exclusives.length; index++) {
				var exclusive = exclusives[index];
				if(exclusive != pivot && group[exclusive]) {
					recurse(exclusive);
				}
			}
		}
	}
	// Get the complement of the prune group
	var complement = Object.create(null);
	for(var item in group) {
		if(!prune[item]) {
			complement[item] = true;
		}
	}
	return complement;
};

function splitIntoGroups(set,up,down,exclusions) {
	var trees = [],
		tree,
		touched = Object.create(null);
	function addFamily(family) {
		if(family) {
			for(var index = 0; index < family.length; index++) {
				var item = family[index];
				if(!tree[item] && set[item]) {
					tree[item] = true;
					touched[item] = true;
					addFamily(up[item]);
					addFamily(down[item]);
					// Exclusions need to be grouped together in order
					// to properly exclude possibles states that would mix them
					addFamily(exclusions[item]);
				}
			}
		}
	};
	for(var item in set) {
		if(!touched[item]) {
			tree = Object.create(null);
			addFamily([item]);
			trees.push(tree);
		}
	}
	return trees;
};

function findPivot(group,up,exclusions) {
	function isActiveExclude(node) {
		var excludeList = exclusions[node];
		if(excludeList) {
			for(var index = 0; index < excludeList.length; index++) {
				if(excludeList[index] != node && group[excludeList[index]]) {
					// This item excludes other stuff in this group.
					return true;
				}
			}
		};
		return false;
	};
	for(var item in group) {
		var chosen = undefined;
		if(isActiveExclude(item)) {
			// This item excludes other stuff in this group.
			chosen = item;
		} else {
			var parentCount = 0;
			var parents = up[item];
			if(parents) {
				for(var index = 0; index < parents.length; index++) {
					if(group[parents[index]]) {
						parentCount++;
						if(parentCount >= 2) {
							// This item has two or more parents. It can't exist in a tree, so it must be pivoted on.
							chosen = item;
							break;
						}
					}
				}
			}
		}
		// We can't pick this one if any of its parents are exclude nodes. We've got to check.
		if(chosen !== undefined) {
			function anyParentsAreExcludes(node) {
				var parents = up[node];
				if(parents) {
					for(var index = 0; index < parents.length; index++) {
						var p = parents[index];
						if(group[p]) {
							if(isActiveExclude(p)
							|| anyParentsAreExcludes(p)) {
								return true;
							}
						}
					}
				}
				return false;
			};
			if(!anyParentsAreExcludes(chosen)) {
				return chosen;
			}
		}
	}
	return null;
};

function getTreeRoot(group,up) {
	var root;
	for(var name in group) {
		// This just gets us ANY item in the group
		root = name;
		break;
	}
	var parents = up[root];
	var index = 0;
	while(parents && index < parents.length) {
		var par = parents[index];
		if(group[par]) {
			root = par;
			// Reset the containing while loop parameters. We have another set of parents to evaluate.
			parents = up[root];
			index = 0;
		} else {
			index++;
		}
	}
	return root;
};

/*
Given a group, a root, and a set of downard verticies, return the number of states a tree would have.
*/
function treeStates(group,down,root) {
	var children = down[root];
	var states = 1n;
	if(children) {
		for(var index = 0; index < children.length; index++) {
			var child = children[index];
			if(group[child]) {
				states *= treeStates(group,down,child);
			}
		}
	}
	return states + 1n;
};
