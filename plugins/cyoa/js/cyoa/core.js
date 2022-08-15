var utils = require("./utils");
var Page = require("./page");
var Book = require("./book");

function Core(document,state,manager) {
	this.document = document;
	this.book = new Book(document);
	this.topPage = undefined;
	this.manager = manager;
	this.state = state;
	var self = this;
	this.manager.onpageturn = function() {self.focus_on_page();};
	this.book.onlinkclick = function(link,event) {self.clicked_link(link,event);};
	this.document.addEventListener("keydown",function(e) {
		var keyArray = [];
		if(e.altKey) {
			keyArray.push("alt");
		}
		if(e.ctrlKey) {
			keyArray.push("ctrl");
		}
		if(e.metaKey) {
			keyArray.push("meta");
		}
		if(e.shiftKey) {
			keyArray.push("shift");
		}
		keyArray.push(e.key);
		var key = keyArray.join("-");
		if(self.loadedLinks[key] !== undefined) {
			self.loadedLinks[key].element.onclick(e);
		}
		keyArray.pop();
		keyArray.push(e.code);
		key = keyArray.join("-");
		if(e.code !== e.key && self.loadedLinks[key] !== undefined) {
			self.loadedLinks[key].element.onclick(e);
		}
	});
};

module.exports = Core;

Core.prototype.openBook = function(page) {
	// Close the start page, since it's open by default
	this.book.closeAll();
	this.focus_on_page(page);
};

Core.prototype.focus_on_page = function(page) {
	var self = this;
	utils.clearErrors(this.document);
	this.unpack_state();
	this.book.closeAll();
	this.loadedLinks = [undefined];

	var currentPage = page || this.manager.getPage();
	if(!currentPage) {
		currentPage = this.book.getStartPage().title;
	}
	this.topPage = currentPage;
	this.openPages = [];

	utils.log("Page: " + currentPage);
	this.document.body.setAttribute("data-title", currentPage);
	this.document.body.scrollTop=this.document.documentElement.scrollTop=0;

	this.processExtraPages(this.book.headers);

	var page = this.book.getPageOrDefault(currentPage);
	while (page) {
		if(page.active) {
			var msg = "'"+page.title+"' is already loaded";
			utils.error(new Error(msg));
		}
		page.execute(this.cyoa.vars);
		page.eachActiveLink(function(node) {
			self.registerHotkeys(node,node.hotkey || self.loadedLinks.length);
		});
		this.openPages.push(page.title);
		page = page.selectAppend(this.cyoa.vars,this.cyoa.stackVariable);
	}
	this.processExtraPages(this.book.footers);
};

Core.prototype.processExtraPages = function(pages) {
	var self = this;
	for(var index=0; index < pages.length; index++) {
		var page = pages[index];
		if(page.test(this.cyoa.vars)) {
			page.execute(this.cyoa.vars);
			page.eachActiveLink(function(node) {
				self.registerHotkeys(node,node.hotkey);
			});
		}
	}
};

Core.prototype.registerHotkeys = function(node,hotkeyString) {
	if(hotkeyString) {
		var hotkeys = hotkeyString.toString().split(" ");
		for(var index = 0; index < hotkeys.length; index++) {
			if(hotkeys[index]) {
				var metas = hotkeys[index].split("-");
				// Take off that last key, sort the meta keys, and recombine
				var key = metas.pop();
				metas.sort();
				metas.push(key);
				this.loadedLinks[metas.join("-")] = node;
			}
		}
	}
};

/*
Loads fresh state from the manager and distributes it for use.
*/
Core.prototype.unpack_state = function() {
	var self = this;
	utils.safeCall(null,
		this.document,
		function(){self.state.deserialize(self.manager.getState());});
};

Core.prototype.clicked_link = function(linkNode,event) {
	var threw = false;
	if(linkNode.replaces) {
		// Refresh the state, undoing any changes
		this.unpack_state();
	}
	try {
		linkNode.executeOnclick(this.cyoa.vars);
	} catch(err) {
		threw = true;
	}
	if(!threw) {
		utils.safeCall(this,this.document,function() {
			var newState;
			var href = this.resolveNextPage(linkNode,this.cyoa.vars);
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
		next = state[this.cyoa.stackVariable].pop();
	}
	if(!next) {
		next = linkElement.to;
	}
	if(!next) {
		next = this.topPage;
	}
	return next || undefined;
}
