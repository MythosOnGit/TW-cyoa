/*\
title: test/tiddlywiki/tiddlers/snippets.js
type: application/javascript
module-type: cyoasnippets

This is a snippets test module for testing cyoa-File and state.js
\*/

exports["if"] = function(tiddler,widget) {
	var v = widget.getAttribute("testThrow");
	if(v) {
		throw new Error(v);
	}
	return widget.getAttribute("testIf");
};
