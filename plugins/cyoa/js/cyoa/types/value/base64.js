/*\
description: base-64 index (e.g. 1 or B)

\*/

'use strict';

exports.name = 'index64';

exports.serialize = function(value,data) {
	return value === null? '': $cyoa.utils.to64(value);
};

exports.deserialize = function(value,data) {
	return value? $cyoa.utils.parse64(value): null;
};
