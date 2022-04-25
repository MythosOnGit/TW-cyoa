/*\
title: $:/plugins/mythos/cyoa/js/filters/gates.js
type: application/javascript
module-type: cyoa.filteroperator

filter operators to specify special handling withing a tracking filter.
\*/

var gates = require("$:/plugins/mythos/cyoa/js/snippets/tracking/gates");
var saltCache = "__cyoasalt"

$tw.utils.each(gates.gates,createOperator);
$tw.utils.each(gates.operators,createOperator);

function createOperator(gate,keyword) {
	exports[keyword] = function(source,operator,options) {
		var results = [];
		if(options.widget.hasVariable("cyoa-render","yes")) {
			var cache = getCache(options);
			var saltStr = "." + cache.salt;
			cache.salt += 1;
			results.push(gates.prefix+(operator.prefix||"")+keyword+"/"+(operator.suffix || "")+"/"+(operator.operand || "") + saltStr);
			var depth = 0;
			source(function(tiddler,title) {
				// All this depth stuff is to prevent
				// salting titles twice.
				if(title.startsWith(gates.prefix)) {
					if(title.startsWith("end",gates.prefix.length)) {
						depth -= 1;
					} else {
						depth += 1;
					}
					results.push(title);
				} else {
					if(depth > 0) {
						results.push(title);
					} else {
						results.push(title + saltStr);
					}
				}
			});
			results.push(gates.prefix + "end" + saltStr);
		} else {
			source(function(tiddler,title) {
				results.push(title);
			});
		}
		return results;
	};
};

function getCache(options) {
	return options.wiki.getGlobalCache(saltCache,function() {
		return {salt: 0};
	});
};
