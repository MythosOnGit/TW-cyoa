/*\
title: $:/plugins/mythos/cyoa/js/snippets/placeholders/sum.js
type: application/javascript
module-type: cyoafilterplaceholder

\*/

var Sum = Object.create(require("./filter.js"));

module.exports = Sum;

Sum.prefix = "+";

Sum.script = function(titles) {
	return "(" + titles.join("+") + ")";
};

Sum.display = function(titles) {
	return titles.join(" + ");
};
