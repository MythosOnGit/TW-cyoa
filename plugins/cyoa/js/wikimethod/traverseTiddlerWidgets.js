/*\
title: $:/plugins/mythos/cyoa/js/wikimethod/traverseTiddlerWidgets.js
type: application/javascript
module-type: wikimethod

This wikimethod is used exclusively by the other cyoa wikimethods.

It provides a common method of traversing through a tiddler to collect information from them into an array.

\*/

var cyoaAliases = {cyoa: true,first: true,visited: true,"else": true};

function merge(arrayA,arrayB) {
	if(arrayB) {
		$tw.utils.each(arrayB,function(value) {
			if(arrayA.indexOf(value) == -1) {
				arrayA.push(value);
			}
		});
	}
}

exports.traverseTiddlerWidgets = function(title,cacheName,treeNodeMethod) {
	var self = this;
	// We'll cache the links so they only get computed if the tiddler changes
	return this.getCacheForTiddler(title,cacheName,function() {
		// Parse the tiddler
		// Count up the results
		var results = [];
		var checkParseTree = function(parseTree) {
			for(var index=0; index<parseTree.length; index++) {
				var parseTreeNode = parseTree[index];
				var list = treeNodeMethod(parseTreeNode);
				merge(results,list);
				if(parseTreeNode.children) {
					checkParseTree(parseTreeNode.children);
				}
			}
		};
		var parser = self.parseTiddler(title);
		if(parser) {
			checkParseTree(parser.tree);
		}
		// Now we need to search through a cyoa.caption field if it's there
		var tiddler = self.getTiddler(title);
		if(tiddler && tiddler.fields["cyoa.caption"]) {
			var captionParser = self.parseText("text/vnd.tiddlywiki",tiddler.fields["cyoa.caption"]);
			if (captionParser) {
				checkParseTree(captionParser.tree);
			}
		}
		return results;
	});
}

exports.traverseTiddlerStateWidgets = function(title,cacheName,method) {
	return this.traverseTiddlerWidgets(title,cacheName,function(ptn) {
		if(cyoaAliases[ptn.type]) {
			return method(ptn);
		}
	});
};
