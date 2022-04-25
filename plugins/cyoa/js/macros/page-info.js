/*\
title: $:/plugins/mythos/cyoa/js/macros/page-info.js
type: application/javascript
module-type: macro

This returns an info string for the current tiddler.
\*/

exports.name = "cyoa-page-info"

exports.params = [
	{name: "title"}
];

/*
Run the macro
*/
exports.run = function(title) {
	title = title || this.getVariable("currentTiddler");
	var tiddler = !!title && this.wiki.getTiddler(title);
	if(tiddler) {
		var attributes = {};
		for(var field in tiddler.fields) {
			if(field.substr(0,5) === "cyoa.") {
				var name = field.substr(5);
				attributes[name] = {
					name: name,
					type: "string",
					value: tiddler.fields[field]
				};
			}
		}
		var parseTreeCyoa = {
			type: "cyoa",
			attributes: attributes};
		var widget = this.wiki.makeWidget({tree: [parseTreeCyoa]},{parentWidget: this});
		widget.execute();
		var cyoaWidget = widget.children[0];
		cyoaWidget.computeAttributes();
		cyoaWidget.execute();
		return cyoaWidget.compileInfo().map(function(str) {
			return str.replace(/^\w+:/,"''$&''");
		}).join("<br>");
	}
	return '';
};
