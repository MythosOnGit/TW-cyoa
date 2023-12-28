/*\
title: $:/plugins/mythos/cyoa/js/logic/hotkey.js
type: application/javascript
module-type: cyoalogic

Takes care of establishing the hotkey for widgets

\*/

"use strict";

exports.infoTree = function(widget) {
	var hotkey = widget.getAttribute("hotkey");
	if(hotkey) {
		return [[
			{type: "element", tag: "strong", children: [{type: "text", text: "Hotkey: "}]},
			{type: "text", text: hotkey}]];
	}
};

exports.hotkey = function(widget) {
	return widget.getAttribute("hotkey");
};
