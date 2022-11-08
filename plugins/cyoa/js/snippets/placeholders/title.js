/*\
title: $:/plugins/mythos/cyoa/js/snippets/placeholders/title.js
type: application/javascript
module-type: cyoafilterplaceholder

\*/

exports.prefix = "";

exports.type = "title";

exports.getTitles = function(placeholder,widget,options) {
	return [placeholder.trim()];
};

exports.script = function(titles) {
	return "(" + titles.join("||") + ")";
};

exports.display = function(titles) {
	return titles.join(" or ");
};
