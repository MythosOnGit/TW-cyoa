/*\
title: test/cyoa/mock/history.js
type: application/javascript
module-type: library

A mock history class to be used a mock window class.
\*/

function History(window) {
	this.window = window;
};

History.prototype.pushState = function(data,title,url) {
	var site = this.window.dummySite();
	this.window.setUri(url.slice(site.length));
};

module.exports = History;
