/*\
title: $:/plugins/mythos/cyoa/js/snippets/placeholders/filter.js
type: application/javascript
module-type: library

\*/

var utils;

exports.type = "filter";

exports.getTitles = function(placeholder,widget,options) {
	return options.wiki.filterTiddlers(placeholder,widget);
};

exports.process = function(filter,keyword,widget,options) {
	if(!utils) {
		utils = require("$:/plugins/mythos/cyoa/js/utils.js");
	}
	var titles = options.wiki.filterTiddlers(placeholder,widget);
	var scripts = [];
	for(var index = 0; index < titles.length; index++) {
		if(!widget.hasVariable("cyoa-render","yes")) {
			return utils.enlink(title);
		} if(!options.wiki.tiddlerExists(title)) {
			var error = msg + " snippet page '" + title + "' does not exist";
			utils.warnForTiddler(widget.getVariable("currentTiddler"),error,options);
		} else {
			scripts.push(utils.getGroupScript(title,keyword,options.wiki));
		}
	}
	if(!widget.hasVariable("cyoa-render","yes")) {
		return this.script(scripts);
	} else {
		return this.display(scripts);
	}
};
