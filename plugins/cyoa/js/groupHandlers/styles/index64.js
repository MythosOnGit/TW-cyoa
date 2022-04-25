/*\
description: base-64 index (e.g. 1,A,3Vd)
title: $:/plugins/mythos/cyoa/js/groupHandlers/styles/index64.js
type: application/javascript
module-type: cyoagrouphandlerstyle

\*/

var base64 = require("$:/plugins/mythos/cyoa/js/cyoa/base64.js");

exports.name = "index64";

exports.getIdFor = function(groupHandler,page,index) {
	return base64.to64(index);
};
