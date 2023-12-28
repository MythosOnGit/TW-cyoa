/*\
title: $:/plugins/mythos/cyoa/js/logic/placeholders/any.js
type: application/javascript
module-type: cyoafilterplaceholder

\*/

var Any = Object.create(require("./filter.js"));

module.exports = Any;

Any.prefix = "a";
Any.join = " or ";

Any.script = function(titles) {
	return "(" + titles.join("||") + ")";
};
