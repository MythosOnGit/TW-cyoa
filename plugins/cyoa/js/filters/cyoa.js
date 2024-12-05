/*\
title: $:/plugins/mythos/cyoa/js/filters/cyoa.js
type: application/javascript
module-type: filteroperator

This filter acts as a namespace for several small, simple filters, such as
[cyoa:first[]]
[cyoa:default[]]

\*/
(function(){

"use strict";

var cyoaFilterOperators;

function getCyoaFilterOperators() {
	if(!cyoaFilterOperators) {
		cyoaFilterOperators = {};
		$tw.modules.applyMethods("cyoa.filteroperator",
		                         cyoaFilterOperators);
	}
	return cyoaFilterOperators;
}

exports.cyoa = function(source,operator,options) {
	var suffixPair = parseSuffix(operator.suffix);
	var cyoaFilterOperator = getCyoaFilterOperators()[suffixPair[0]];
	if(cyoaFilterOperator) {
		var newOperator = Object.assign({},operator);
		newOperator.suffix = suffixPair[1];
		return cyoaFilterOperator(source,newOperator,options);
	} else {
		var msg = "Filter Error: Unknown suffix '" + (suffixPair[0]||"") + "' for the 'cyoa' filter operator";
		// If we're compiling, throw this message instead of return it.
		// It'll make diagnosing easier.
		if(options.widget && options.widget.getVariable("cyoa-render") === "yes") {
			throw msg;
		} else {
			return [msg];
		}
	}
};

function parseSuffix(suffix) {
	var index = suffix? suffix.indexOf(":"): -1;
	if(index >= 0) {
		return [suffix.substr(0,index),suffix.substr(index+1)];
	} else {
		return [suffix];
	}
}

})();
