/*\
title: $:/plugins/mythos/cyoa/js/filters/start.js
type: application/javascript
module-type: cyoa.filteroperator

Filter operator returns the tiddler specified as the starting page, or
whatever the compiler would default to if that's not specified.
[!cyoa:start[]] returns everything except the start page.

It prefers, in order:

$:/config/mythos/cyoa/start!!text
first of $:/DefaultTiddlers!!text
null

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.start = function(source,operator,options) {
	var wiki = (options && options.wiki) || $tw.wiki;
	var start = wiki.getCyoaStartPage();
	var results = [];
	if(operator.prefix === "!") {
		source(function(tiddler,title) {
			if(title !== start) {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(title === start) {
				results.push(title);
			}
		});
	}
	return results;
};

})();
