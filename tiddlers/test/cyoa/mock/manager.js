/*\
title: test/cyoa/mock/manager.js
tags: $:/tags/cyoa/Javascript
type: application/javascript
module-type: cyoasaver

Mock manager class which handles state itself instead of relying on a URI.
\*/

function Manager() {
	this.state = Object.create(null);
	this.page = "";
};

exports.mock = Manager;

Manager.prototype.pushState = function(newState,newPage) {
	this.state = newState;
	this.page = newPage;
	if(this.onpageturn) {
		this.onpageturn();
	}
};

Manager.prototype.getPage = function() {
	return this.page;
};

Manager.prototype.getState = function() {
	return this.state;
};
