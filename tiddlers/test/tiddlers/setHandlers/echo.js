/*\
title: test/tiddlywiki/tiddlers/groupHandlers/echo.js
type: application/javascript
module-type: cyoagrouphandler

This returns true if the tiddler starts with the name of the snippet attribute
calling it.

This is used to test control tiddlers in "before" and "after" clauses

\*/

exports.name = "echo";

$tw.utils.each(["touch","reset","after"],function(field) {
	exports[field] = function(title) {
		var tiddler = this.wiki.getTiddler(title);
		return tiddler.fields[field];
	}
});
