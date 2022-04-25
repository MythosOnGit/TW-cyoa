/*\
title: $:/plugins/mythos/cyoa/js/groupHandlers/variable.js
type: application/javascript
module-type: library

This is a virtual groupHandler which introduces the often-used variable that many other group handlers use. This class is just meant to be inhereted.

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var utils = require("$:/plugins/mythos/cyoa/js/utils.js");
var GroupHandler = require("$:/plugins/mythos/cyoa/js/groupHandlers/handler.js");

var VariableHandler = function(group,data,pages,options) {
	GroupHandler.apply(this,arguments);
};

VariableHandler.prototype = Object.create(GroupHandler.prototype);

module.exports = VariableHandler;
