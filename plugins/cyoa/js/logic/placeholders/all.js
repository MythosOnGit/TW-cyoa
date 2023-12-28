/*\
title: $:/plugins/mythos/cyoa/js/logic/placeholders/all.js
type: application/javascript
module-type: cyoafilterplaceholder

\*/

var All = Object.create(require("./filter.js"));

module.exports = All;

All.prefix = "A";
All.join = " and ";

All.script = function(titles) {
	return "(" + titles.join("&&") + ")";
};
