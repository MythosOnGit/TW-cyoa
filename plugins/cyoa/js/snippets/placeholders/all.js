/*\
title: $:/plugins/mythos/cyoa/js/snippets/placeholders/all.js
type: application/javascript
module-type: cyoafilterplaceholder

\*/

var All = Object.create(require("./filter.js"));

module.exports = All;

All.prefix = "A";

All.script = function(titles) {
	return "(" + titles.join("&&") + ")";
};

All.display = function(titles) {
	return titles.join(" and ");
};
