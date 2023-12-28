/*\
Represents a cyoa node, <$cyoa>, or <$div class='cyoa-state'/> in compile.
\*/

'use strict';

var utils = require('./utils');
var scriptor = require('./scriptor');

var Node = function(book,element) {
	this.book = book;
	this.element = element;
};

module.exports = Node;

function getter(name,method) {
	Object.defineProperty(Node.prototype,name,{ get: method });
}

getter('id',function() { return decodeURIComponent(this.element.id); } );
getter('dependList',function() { return this.getPageList('data-depend'); } );
getter('hotkey',function() { return this.element.getAttribute('data-hotkey'); } );
getter('isElse',function() { return this.element.classList.contains('cyoa-else'); } );
getter('isLink',function() { return this.element.classList.contains('tc-tiddlylink'); } );
getter('isOnclick',function() { return this.element.classList.contains('cyoa-onclick'); } );
getter('isStateful',function() { return this.element.classList.contains('cyoa-state'); } );
getter('parent',function() {
	var par = this.element.parentNode;
	if(!par || !par.classList) {
		return undefined;
	}
	if(par.classList.contains('cyoa-page')) {
		return this.book.getPage(par.id);
	} else {
		return new Node(this.book,par);
	}
});

Object.defineProperty(Node.prototype,'active',{
	get: function() {
		return this.element.classList.contains('cyoa-active') || !this.isStateful;
	},
	set: function(visible) {
		this.element.classList.toggle('cyoa-active',visible);
	}
});

Object.defineProperty(Node.prototype,'to',{
	get: function() {
		var href = this.element.href;
		if(href) {
			return decodeURIComponent(href.substr(href.indexOf('#')+1));
		}
		return null;
	},
	set: function(page) {
		this.element.setAttribute('href','#'+page);
	}
});

Node.prototype.getIndex = function(state) {
	return this.evalSnippet('index',{arguments: state});
};

Node.prototype.eachActiveLink = function(method) {
	if(this.active) {
		if(this.isLink) {
			// It's a link, and it's active.
			method(this);
		}
		for(var childElem = this.element.firstElementChild; childElem; childElem = childElem.nextElementSibling) {
			var child = new Node(this.book,childElem);
			child.eachActiveLink(method);
		}
	}
};

/*
This processes any snippets attached to the page, as well as processing It's inner body.
activeLinks: list which will be populated with list of active link
             elements which should be keyed to hotkeys. If not
             supplied, a fresh list is returned.
returns: A list of link elements which should be keyed up to number keys.
*/
Node.prototype.execute = function(state) {
	if(this.isStateful) {
		this.active = true;
		var options = {arguments: state};
		if(!this.isOnclick) {
			this.evalSnippet('do',options);
		}
		if(this.element.hasAttribute('data-write')) {
			var write = this.evalSnippet('write',options);
			this.element.innerHTML = write;
		} else {
			this.executeChildren(state);
		}
		if(!this.isOnclick) {
			this.evalSnippet('done',options);
		}
	}
};

Node.prototype.executeChildren = function(state) {
	var index = this.getIndex(state);
	var iterator = new TreeIterator(this.book,this.element,state);
	var child;
	if(index !== undefined) {
		var selected = this.selectFromList(index,iterator,state);
		if(selected) {
			selected.execute(state);
		}
	} else {
		while (child = iterator.next()) {
			if(iterator.isTrue) {
				child.execute(state);
			} else {
				child.active = false;
			}
		}
	}
};

/*
Executes onclick scripts for this node and all its parents in proper order.
*/
Node.prototype.executeOnclick = function(state) {
	var ancestry = [];
	for(var node = this; node; node = node.parent) {
		if(node.isStateful && node.isOnclick) {
			ancestry.push(node);
		}
	}
	// Execute 'do's coming down, and then 'done's coming back up.
	for(var index=ancestry.length-1; index>=0; index--) {
		ancestry[index].evalSnippet('do',{rethrow: true,arguments: state});
	}
	for(var index=0; index < ancestry.length; index++) {
		ancestry[index].evalSnippet('done',{rethrow: true,arguments: state});
	}
};

/*
Selects an item from iterator given the index. Index can be an integer, string, or [int, string] pair
*/
Node.prototype.selectFromList = function(index,iterator,state) {
	var whiteList = [],
		item,
		weightedLength = 0;
	var index = index || 0;
	var indexNumber, skipRest = false;
	switch (typeof index) {
	case 'function':
		// We set the number to somethign that guarantees we evaluate all nodes.
		indexNumber = Number.MAX_SAFE_INTEGER;
		break;
	case 'string':
		indexNumber = Math.abs($cyoa.hash(index));
		break;
	default: // numbers and booleans
	case 'number':
		if(index < 0) {
			throw new Error('index cannot be less than zero ('+index+')');
		}
		indexNumber = index;
	}
	while(item = iterator.next(skipRest)) {
		if(iterator.isTrue) {
			weightedLength += item.getWeight(state);
			if(weightedLength > indexNumber) {
				// This is the one. We don't have to bother evaluating any more
				skipRest = true;
			}
			whiteList.push(item);
		} else {
			item.active = false;
		}
	}
	if(typeof index === 'function') {
		indexNumber = index(weightedLength);
	}
	indexNumber = indexNumber % weightedLength;
	var weightedIndex = 0;
	for(var wlIndex = 0; wlIndex < whiteList.length; wlIndex++) {
		weightedIndex += whiteList[wlIndex].getWeight(state);
		if(weightedIndex > indexNumber) {
			var selected = whiteList[wlIndex];
			// First disable all remaining whitelisted nodes
			while(++wlIndex < whiteList.length) {
				whiteList[wlIndex].active = false;
			}
			return selected;
		}
		whiteList[wlIndex].active = false;
	}
	// This return is reached only if iterator was empty.
	return null;
};

/*
This tests a $cyoa element to see if it's 'truthy', meaning all it's conditionals and dependencies evaulate to true and this can be rendered.  Should have no side-effects.
*/
Node.prototype.test = function(state) {
	return recursiveTest(this,state,{});
};

/*
This is private and wrapped by another method because getting a bad arg can cause an infinit loop.
*/
function recursiveTest(node,state,visited) {
	if(!node.evalSnippet('if',{default: true,arguments: state})) {
		return false;
	}
	var pageList = node.dependList;
	if(pageList.length > 0) {
		// This works, even if the first element is a $cyoa widget. That's because no elements visited after this will also be a $cyoa widget, only pages with IDs.
		visited[node.title] = true;
		for(var index = 0; index < pageList.length; index++) {
			var otherPage = pageList[index];
			if(!visited[otherPage]) {
				var page = node.book.getPage(otherPage);
				if(recursiveTest(page,state,visited)) {
					return true;
				}
			}
		}
		return false;
	}
	return true;
};

/*
Processes a layer of cyoa elements. Properly manages if/else branch chains.
*/
Node.prototype.evalSnippet = function(dataKey,options) {
	options = options || {}
	try {
		var rtn = options.default;
		var script = this.element.getAttribute('data-'+dataKey);
		if(script) {
			rtn = scriptor.evalAll(script,options.arguments,this);
			utils.log('    Evaluating: '+dataKey+' ('+rtn+') ['+script+']');
		}
		return rtn;
	}
	catch(err) {
		var message = err.message || err.toString();
		err.message = '<i>'+dataKey+'</i> attribute failed ('+script+'): ' + message;
		utils.error(err,this.book.document);
		if(options.rethrow) {
			throw(err);
		}
		return false;
	}
};

Node.prototype.getPageList = function(attribute) {
	var str = this.element.getAttribute(attribute);
	if(str) {
		return str.split(' ').map(decodeURIComponent);
	}
	return [];
};

Node.prototype.getWeight = function(state) {
	var weight = this.evalSnippet('weight',{default: 1, arguments: state});
	return weight < 0? 0: weight;
};

function isStateful(element) {
	return element.classList.contains('cyoa-state');
};

function TreeIterator(book,element,state) {
	this.root = element;
	this.ptr = element.firstElementChild;
	this.book = book;
	this.state = state;
	this.skipElse = false;
	this.isTrue = undefined;
};

// We want the ability to skip tests and just return them as is
TreeIterator.prototype.next = function(skipTest) {
	while (this.ptr !== null) {
		if(isStateful(this.ptr)) {
			var node = new Node(this.book,this.ptr);
			this.ptr = this.nextSibling(this.ptr);
			this.isTrue = false;
			if(!skipTest && (!this.skipElse || !node.isElse)) {
				if(node.test(this.state)) {
					this.skipElse = true;
					this.isTrue = true;
				} else {
					this.skipElse = false;
				}
			}
			return node;
		} else {
			this.ptr = this.ptr.firstElementChild || this.nextSibling(this.ptr);
		}
	}
	return null;
};

TreeIterator.prototype.nextSibling = function(ptr) {
	while (ptr.nextElementSibling === null) {
		ptr = ptr.parentNode;
		if(ptr === this.root) {
			return null;
		}
	}
	return ptr.nextElementSibling;
};
