/*\
title: $:/plugins/mythos/cyoa/js/groupHandlers/set.js
type: application/javascript
module-type: cyoagrouphandler

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Handler = require("$:/plugins/mythos/cyoa/js/groupHandlers/handler.js");
var utils = require("$:/plugins/mythos/cyoa/js/cyoa/utils.js");

function SetHandler() {
	Handler.apply(this,arguments);
};

var Sp = SetHandler.prototype = Object.create(Handler.prototype);

Sp.groupData = function() {
	var impTree = this.getImplicationTree();
	var data = {
		exList: this.getExclusionLists()
	};
	if(this.data.style === "bitfield") {
		var versionMap = getVersionMap(this,this.pages);
		var count = Object.keys(versionMap).length;
		data.count = count;
		data.up = this.convertToIds(impTree);
		// makeBridges has side-effects on data.up.
		data.bridges = makeBridges(versionMap,data.up);
		data.states = generateGraphData(data.up,count,versionMap,utils.generateExclusiveMap(data.exList));
	} else {
		data.up = this.convertToIds(impTree);
	}
	return data;
};

Sp.touch = function(title) {
	return this.variable + ".add(" + this.strIdFor(title) + ")";
};

Sp.reset = function(title) {
	return this.variable + ".remove(" + this.strIdFor(title) + ")";
};

Sp.resetAll = function() {
	return this.variable + ".clear()";
};

Sp.after = function(title) {
	return this.variable + ".has(" + this.strIdFor(title) + ")";
};

Sp.do = function(title) {
	return this.variable + ".flag(" + this.strIdFor(title) + ").val";
};

function getVersionMap(setHandler,pages) {
	var versionMap = Object.create(null);
	var pageMap = setHandler.getPageMap();
	for(var title in pageMap) {
		var info = pageMap[title];
		versionMap[info.id] = info.group;
	}
	return versionMap;
};

function makeBridges(versionMap,implicationTree) {
	var bridges = Object.create(null);
	for(var title in implicationTree) {
		var parents = implicationTree[title];
		for(var index = parents.length-1; index >= 0; index--) {
			if(versionMap[title] !== versionMap[parents[index]]) {
				bridges[title] = bridges[title] || [];
				bridges[title].push(parents[index]);
				if(parents.length > 1) {
					parents.splice(index,1);
				} else {
					delete implicationTree[title];
				}
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
function generateGraphData(up,count,versionMap,exclusionMap) {
	var set = Object.create(null);
	var down = utils.generateDownTree(up);
	for(var index = 0; index < count; index++) {
		set[index] = true;
	}
	function countStates(group) {
		var data = [];
		var connectedGroups = splitIntoGroups(group,up,down,versionMap,exclusionMap);
		var states = 1n;
		for(var index = 0; index < connectedGroups.length; index++) {
			var connectedGroup = connectedGroups[index];
			var pivot = findPivot(connectedGroup,up,exclusionMap),
				subStates,
				subdata;
			if(pivot !== null) {
				var noDescendentsGroup = subgroup(connectedGroup,pivot,down),
					noAncestorsGroup = subgroup(connectedGroup,pivot,up,exclusionMap,down),
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

function subgroup(group,pivot,lineage,exclusionMap,down) {
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
	if(exclusionMap) {
		var exclusives = exclusionMap[pivot];
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

function splitIntoGroups(set,up,down,versionMap,excludeMap) {
	var trees = [],
		tree,
		mapId,
		touched = Object.create(null);
	function addFamily(family) {
		if(family) {
			for(var index = 0; index < family.length; index++) {
				var item = family[index];
				if(!tree[item] && set[item] && versionMap[item] === mapId) {
					tree[item] = true;
					touched[item] = true;
					addFamily(up[item]);
					addFamily(down[item]);
					// Exclusions need to be grouped together in order
					// to properly exclude possibles states that would mix them
					addFamily(excludeMap[item]);
				}
			}
		}
	};
	for(var item in set) {
		if(!touched[item]) {
			tree = Object.create(null);
			mapId = versionMap[item];
			addFamily([item]);
			trees.push(tree);
		}
	}
	return trees;
};

function findPivot(group,up,excludeMap) {
	function isActiveExclude(node) {
		var excludeList = excludeMap[node];
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

exports.set = SetHandler;
