/*\
title: $:/plugins/mythos/cyoa/js/logic/placeholders/filter.js
type: application/javascript
module-type: library

\*/

var utils;

exports.type = "filter";

exports.getTitles = function(placeholder,widget) {
	return widget.wiki.filterTiddlers(placeholder,widget);
};
