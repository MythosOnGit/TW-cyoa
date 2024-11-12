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
		// It's important to enqueue an event so that the cyoa-preview knows when the theme has changed.
		onSwitch: function(plugins) {
			// Right now, we just trigger a save, we don't even bother changing anything.
			$tw.wiki.enqueueTiddlerEvent("$:/temp/mythos/cyoa/theme-state");
		},
		defaultPlugins: [
			"$:/themes/mythos/simple"
		]
	});
};
