/*\
title: $:/plugins/mythos/cyoa/js/macros/data.js
type: application/javascript
module-type: macro

Returns the JSON data for all the groups.
\*/

exports.name = "cyoa-data"

exports.params = [];

exports.run = function() {
	var obj = this.wiki.getCyoaGroupData();
	return JSON.stringify(obj);
};
