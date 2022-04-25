/*\
title: $:/plugins/mythos/cyoa/js/macros/filename.js
type: application/javascript
module-type: macro

Returns the output filepath for generated cyoa files.
\*/

exports.name = "cyoa-filename"

exports.params = [];

const rules = "\\rules only filteredtranscludeinline transcludeinline\n"

exports.run = function() {
	var settings = this.wiki.getTiddler("$:/config/mythos/cyoa/filename");
	if(settings) {
		var raw = settings.getFieldString("text");
		var result = this.wiki.renderText("text/plain","text/vnd.tiddlywiki",rules + raw);
		return result + ".html";
	} else {
		return "cyoa.html";
	}
};
