/*\
title: $:/plugins/mythos/cyoa/js/logic/placeholders/title.js
type: application/javascript
module-type: cyoafilterplaceholder

\*/

exports.prefix = "";
exports.join = " or ";

exports.type = "title";

exports.getTitles = function(placeholder) {
	return [placeholder.trim()];
};

exports.script = function(titles) {
	return "(" + titles.join("||") + ")";
};
