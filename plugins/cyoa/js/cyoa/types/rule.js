/*\

Handles page rules. These are stateless and never actually save to the URI.

\*/

'use strict';

var utils = require('../utils');

exports.name = 'rule';

exports.touch = function(index, pageTitle) {
	var page = getPage(this, pageTitle);
	// true means do not recurse
	page.execute(this.state, true);
};

// If touched from a visit, do nothing. The act of visiting this node will do all the proper touching.
exports.visit = function() {};

exports.is = function(index, pageTitle) {
	if(this.stack === undefined) {
		this.stack = Object.create(null);
	}
	// If this is being recursively called in a loop, then return false
	if(this.stack[pageTitle]) {
		return false;
	}
	// Check implications first
	var children = this.data.downTree[pageTitle];
	if(children) {
		try {
			this.stack[pageTitle] = true;
			for(var index = 0; index < children.length; index++) {
				if(this.state.query(children[index], "is")) {
					return true;
				}
			}
		} finally {
			this.stack[pageTitle] = false;
		}
	}
	// Check constraints next
	var page = getPage(this, pageTitle);
	var element = page.element;
	if(element.hasAttribute('data-after')
	|| element.hasAttribute('data-before')
	|| element.hasAttribute('data-if')
	|| element.hasAttribute('data-depend')) {
		// If there are any constraints, then its value depends on those.
		return page.test(this.state);
	} else {
		// Otherwise, rules default to false, to better work for imply chains
		return false;
	}
};

exports.value = function(index, pageTitle) {
	var page = getPage(this, pageTitle);
	if(page.element.hasAttribute('data-value')) {
		return page.evalSnippet('value', {arguments: this.state});
	} else {
		return this.is(index, pageTitle);
	}
};

exports.assign = function(index,number) {
	throw new Error("Unimplemented feature");
};

exports.unassign = function(index, pageTitle) {
	// Nothing happens to the rule, but reset any implying children
	var children = this.data.downTree[pageTitle];
	if(children) {
		for(var index = 0; index < children.length; index++) {
			this.state.query(children[index], "unassign");
		}
	}
};

exports.clear = function() {
	throw new Error("Unimplemented feature");
};

exports.any = function() {
	throw new Error("Unimplemented feature");
};

function getPage(rule, pageTitle) {
	var book = rule.state.book;
	return book.getRule(pageTitle) || book.getPage(pageTitle);
};
