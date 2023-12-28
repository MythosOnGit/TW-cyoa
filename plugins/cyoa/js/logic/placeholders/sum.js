/*\
title: $:/plugins/mythos/cyoa/js/logic/placeholders/sum.js
type: application/javascript
module-type: cyoafilterplaceholder

\*/

var Sum = Object.create(require("./filter.js"));

module.exports = Sum;

Sum.prefix = "+";
Sum.join = " + ";

Sum.script = function(titles) {
	return "(" + titles.join("+") + ")";
};
