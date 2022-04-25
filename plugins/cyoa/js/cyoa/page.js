/*\
Represents a cyoa page.
\*/

var utils = require("./utils");
var Node = require("./node");

var Page = function(book,element) {
	Node.apply(this,arguments);
};

module.exports = Page;
Page.prototype = Object.create(Node.prototype);

function getter(name,method) {
	Object.defineProperty(Page.prototype,name,{ get: method });
};

getter("title",function() { return utils.decodePage(this.element.id); } );
getter("appendList",function() { return this.getPageList("data-append"); } );
getter("isLink",function() { return false; } );
getter("isStateful",function() { return true; } );
getter("parent",function() { return undefined; } );

Page.prototype.isDefault = function() {
	return this.element.classList.contains("cyoa-default");
};

/*
Page uses data-index a little differently than an ordinary node. If a page specifies an index, it's about appended pages, not nested nodes.
*/
Page.prototype.getAppendIndex = Node.prototype.getIndex;
Page.prototype.getIndex = function() { return undefined; };

/*
By default, returns first appendPage whose conditions are true.
Takes an optional index method which selects the nth append page instead of the first (index 0). Indexes larger than the available pages will be modulo'ed down to size.
*/
Page.prototype.selectAppend = function(state,stackVariable,index) {
	var appendArray = this.appendList,
		stack = state[stackVariable],
		stackTop = stack && stack.top();
	if(stackTop && appendArray.indexOf(stackTop) >= 0) {
		// If one of the appendArray is on top of the push stack, automatically select it.
		stack.pop();
		return this.book.getPage(stackTop);
	} else {
		var iterator = new PageListIterator(this.book,appendArray,state);
		if(index === undefined) {
			index = this.getAppendIndex(state);
		}
		return this.selectFromList(index,iterator);
	}
};

function PageListIterator(book,list,state) {
	this.list = list;
	this.book = book;
	this.state = state;
	this.index = 0;
};

PageListIterator.prototype.next = function() {
	while (this.index < this.list.length) {
		var title = this.list[this.index];
		this.index++;
		var page = this.book.getPage(title);
		if(!page) {
			var msg = "append page '"+title+"' does not exist.";
			utils.error(new Error(msg));
		} else {
			if(page.test(this.state)) {
				return page;
			}
		}
	}
	return null;
};

