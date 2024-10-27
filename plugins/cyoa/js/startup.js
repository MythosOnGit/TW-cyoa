/*\
title: $:/plugins/mythos/cyoa/js/startup.js
type: application/javascript
module-type: startup

Startup task to register the cyoa-theme plugin type.

\*/

"use strict";

exports.name = "cyoa";
exports.after = ["startup"];
exports.before = ["commands"];
exports.synchronous = true;

exports.startup = function() {
	$tw.cyoaThemeManager = new $tw.PluginSwitcher({
		wiki: $tw.wiki,
		pluginType: "cyoatheme",
		controllerTitle: "$:/config/mythos/cyoa/theme",
		defaultPlugins: [
			"$:/themes/mythos/simple"
		]
	});
};
