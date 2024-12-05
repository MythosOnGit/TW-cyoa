'use strict';

var utils = require('./utils');
var Page = require('./page');
var Link = require('./link');
var Book = require('./book');

function Core(document,state,manager,book) {
	this.document = document;
	this.book = book;
	this.topPage = undefined;
	this.manager = manager;
	this.state = state;
	this.openPages = [this.book.getStartPage().title];
	var self = this;
	this.manager.onpageturn = function() {self.openPage();};
	this.book.onlinkclick = function(link,event) {self.clicked_link(link,event);};
	this.document.addEventListener('keydown',function(e) {
		var keyArray = [];
		if(e.altKey) {
			keyArray.push('alt');
		}
		if(e.ctrlKey) {
			keyArray.push('ctrl');
		}
		if(e.metaKey) {
			keyArray.push('meta');
		}
		if(e.shiftKey) {
			keyArray.push('shift');
		}
		keyArray.push(e.key);
		var key = keyArray.join('-');
		if(self.loadedLinks[key] !== undefined) {
			self.loadedLinks[key].element.onclick(e);
		}
		keyArray.pop();
		keyArray.push(e.code);
		key = keyArray.join('-');
		if(e.code !== e.key && self.loadedLinks[key] !== undefined) {
			self.loadedLinks[key].element.onclick(e);
		}
	});
};

module.exports = Core;

Core.prototype.openPage = function(page) {
	var self = this;
	utils.clearErrors(this.document);
	this.unpack_state();
	this.loadedLinks = [undefined];

	var currentPage = page || this.manager.getPage();
	if(!currentPage) {
		currentPage = this.book.getStartPage().title;
	}
	this.topPage = currentPage;
	var newPages = [];

	utils.log('Turning to page: ' + currentPage);
	this.document.body.setAttribute('data-title', currentPage);
	this.document.body.scrollTop=this.document.documentElement.scrollTop=0;

		utils.log('  Headers');
	this.processExtraPages(this.book.tops);
	this.processExtraPages(this.book.headers);

	var page = this.book.getPageOrDefault(currentPage);
	while (page) {
		utils.log('  Page: ' + page.title);
		page.execute(this.state);
		page.eachActiveLink(function(node) {
			self.registerHotkeys(node,node.hotkey || self.loadedLinks.length);
		});
		newPages.push(page.title);
		page = page.selectAppend(this.state);
	}
		utils.log('  Footers');
	this.processExtraPages(this.book.footers);
	this.processExtraPages(this.book.bottoms);
	// Close pages that aren't still open
	for(var i = 0; i < this.openPages.length; i++) {
		var title = this.openPages[i];
		if(newPages.indexOf(title) < 0) {
			this.book.getPage(title).active = false;
		}
	}
	this.openPages = newPages;
};

Core.prototype.processExtraPages = function(pages) {
	var self = this;
	for(var index=0; index < pages.length; index++) {
		var page = pages[index];
		if(page.test(this.state)) {
			page.execute(this.state);
			page.eachActiveLink(function(node) {
				self.registerHotkeys(node,node.hotkey);
			});
		} else {
			page.active = false;
		}
	}
};

Core.prototype.registerHotkeys = function(node,hotkeyString) {
	if(hotkeyString) {
		var hotkeys = hotkeyString.toString().split(' ');
		for(var index = 0; index < hotkeys.length; index++) {
			if(hotkeys[index]) {
				var metas = hotkeys[index].split('-');
				// Take off that last key, sort the meta keys, and recombine
				var key = metas.pop();
				metas.sort();
				metas.push(key);
				this.loadedLinks[metas.join('-')] = node;
			}
		}
	}
};

/*
Loads fresh state from the manager and distributes it for use.
*/
Core.prototype.unpack_state = function() {
	var self = this;
	safeCall(null,
		this.document,
		function(){self.state.deserialize(self.manager.getState());});
};

Core.prototype.clicked_link = function(linkElement,event) {
	var linkNode = new Link(this.book,linkElement);
	var threw = false;
	if(linkNode.replaces) {
		// Refresh the state, undoing any changes
		this.unpack_state();
	}
	try {
		linkNode.executeOnclick(this.state);
	} catch(err) {
		threw = true;
	}
	if(!threw) {
		safeCall(this,this.document,function() {
			var newState;
			var href = this.resolveNextPage(linkNode,this.state);
			if(href) {
				newState = this.state.serialize();
				this.manager.pushState(newState,href);
			}
		});
	}
	event.preventDefault();
}

Core.prototype.resolveNextPage = function(linkElement,state) {
	var next = undefined;
	if(linkElement.returns) {
		next = state.stack.pop();
	}
	if(!next) {
		next = linkElement.to;
	}
	if(!next) {
		next = this.topPage;
	}
	return next || undefined;
};

function safeCall(thisArg,document,method,defaultReturn) {
	var rtn = defaultReturn;
	try {
		rtn = method.call(thisArg);
	}
	catch(err) {
		utils.error(err,document);
		if(defaultReturn === undefined) {
			throw(err);
		}
	}
	return rtn;
};
