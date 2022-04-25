/*\
title: test/tiddlywiki/tiddlers/groupHandlers/echo.js
type: application/javascript
module-type: cyoagrouphandler

This returns true if the tiddler starts with the name of the snippet attribute
calling it.

This is used to test control tiddlers in "before" and "after" clauses

\*/

var GroupHandler = require("$:/plugins/mythos/cyoa/js/groupHandlers/handler.js");

function Echo(group,data,pages,options) {
	GroupHandler.apply(this,arguments);
};

Echo.prototype = Object.create(GroupHandler.prototype);

exports.echo = Echo;

$tw.utils.each(["touch","reset","after"],function(field) {
	Echo.prototype[field] = function(title) {
		var tiddler = this.wiki.getTiddler(title);
		return tiddler.fields[field];
	}
});
