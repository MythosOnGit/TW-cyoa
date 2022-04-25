/*\
title: $:/plugins/mythos/cyoa/js/command.js
type: application/javascript
module-type: command

Compiles the cyoa file given the pages and configuration of the given tiddler directory.

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var getFilename = require("$:/plugins/mythos/cyoa/js/macros/filename").run;

exports.info = {
	name: "cyoa"
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var argument;
	console.time("Compile time");
	if(this.params.length < 1) {
		// User did not specify a filename, so we use the default
		argument = getFilename.call(this.commander);
	} else {
		argument = this.params[0];
	}
	var self = this,
		fs = require("fs"),
		path = require("path"),
		filename = path.resolve(this.commander.outputPath,argument),
		variables = {};
	$tw.utils.createFileDirectories(filename);
	fs.writeFile(
		filename,
		this.commander.wiki.renderTiddler(
			"text/vnd.tiddlywiki",
			"$:/plugins/mythos/cyoa/templates/cyoaFile",
			{variables: variables}),
		"utf8",
		function(err) { self.callback(err); }
	);
	console.timeEnd("Compile time");
	return null;
};

exports.Command = Command;

})();
