/*\
Represents a cyoa link, which is a type of node.
\*/

var Node = require("./node");
var utils = require("./utils");

var Link = function(book,element) {
	Node.apply(this,arguments);
};

module.exports = Link;
Link.prototype = Object.create(Node.prototype);

/*
Returns a title
*/
Object.defineProperty( Link.prototype,"to",{
	get: function() {
		var href = this.element.getAttribute("href");
		if(href) {
			href = utils.stripHash(href);
			// the href and uri use different encoding schemes,
			// so we got to decode/encode
			if(href) {
				return decodeURIComponent(href);
			}
		}
		return undefined;
	}
});

Object.defineProperty(Link.prototype,"replaces",{
	get: function() {
		return this.element.classList.contains("cyoa-replace");
	}
});

Object.defineProperty(Link.prototype,"returns",{
	get: function() {
		return this.element.classList.contains("cyoa-return");
	}
});
