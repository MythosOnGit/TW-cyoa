/*\
title: $:/plugins/mythos/cyoa/js/snippets/placeholders/any.js
type: application/javascript
module-type: cyoafilterplaceholder

\*/

var Any = Object.create(require("./filter.js"));

module.exports = Any;

Any.prefix = "a";

Any.script = function(titles) {
	return "(" + titles.join("||") + ")";
};

Any.display = function(titles) {
	return titles.join(" or ");
};
