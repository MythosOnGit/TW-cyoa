/*\
title: $:/plugins/mythos/cyoa/js/filters/default.js
type: application/javascript
module-type: cyoa.filteroperator

Filter returns the tiddler cyoa directs to when missing pages are clicked.
It prefers, in order:

[!cyoa:default[]] returns everything except the default page.

$:/config/mythos/cyoa/default!!text
$:/config/mythos/cyoa/start!!text
null (or nothing if used as a filter)

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var utils = require("$:/plugins/mythos/cyoa/js/utils");

exports["default"] = function(source,operator,options) {
	var wiki = (options && options.wiki) || $tw.wiki;
	var defaultPage = wiki.getCyoaDefaultPage();
	var results = [];
	if(operator.prefix === "!") {
		source(function(tiddler,title) {
			if(title !== defaultPage) {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(title === defaultPage) {
				results.push(title);
			}
		});
	}
	return results;
};

})();
