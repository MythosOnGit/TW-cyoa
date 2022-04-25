/*\
description: bit field (e.g. 7ZxR3d)
title: $:/plugins/mythos/cyoa/js/groupHandlers/styles/bitfield.js
type: application/javascript
module-type: cyoagrouphandlerstyle

\*/

exports.name = "bitfield";

/*
Bitfields only work for sets.
*/
exports.only = "set";

/*
Bitfield uses base-10 indexes under the hood.
*/
exports.getIdFor = function(groupHandler,page,index) {
	return index;
};
