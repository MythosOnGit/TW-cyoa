"use strict";

var _boot = (function(cyoa,inBrowser) {

cyoa = cyoa || Object.create(null);
var modules = cyoa.modules = cyoa.modules || Object.create(null);
var boot = cyoa.boot = cyoa.boot || Object.create(null);

// This is the only one available in production.
boot.saver = "uri";

boot.reportError = function(error) {
	console.error(error.stack || error);
	if(inBrowser) {
		var str = "<span>"+error+"</span>";
		var elem = document.getElementById("$:/cyoaError");
		elem.innerHTML += str;
	}
}

/*
Ripped from $tw.utils.resolvePath
*/
function resolvePath(sourcePath,rootPath) {
	var src = sourcePath.split("/");
	var root = (rootPath || "").split("/");
	root.splice(root.length-1,1);
	while(src.length > 0) {
		var c = src.shift();
		if(c === "..") {
			if(root.length > 0) {
				root.splice(root.length-1,1);
			}
		} else if(c !== ".") { //Ignoring dots
			root.push(c);
		}
	}
	return root.join("/");
};

var moduleSets = {"cyoa": "$:/plugins/mythos/cyoa/js/cyoa/cyoa.js"};

function resolveModuleGivenPath(path) {
	var mods = modules.titles;
	if(mods[path]) {
		return path;
	} else if(mods[path + ".js"]) {
		return path + ".js";
	} else if(mods[moduleSets[path]]) {
		return moduleSets[path];
	}
	return null;
};

modules.execute = function(path,root) {
	if(!path) {
		throw new Error("require requires a non-empty string ("+path+")");
	}
	var rootToUse = "";
	if(path[0] == ".")  {
		rootToUse = root;
	}
	var name = resolvePath(path,rootToUse);
	var realPath = resolveModuleGivenPath(name);
	if(!realPath) {
		if(!inBrowser) {
			return require(path);
		} else {
			throw new Error("Module '"+name+"' not found");
		}
	}
	var moduleSet = modules.titles[realPath];
	if(moduleSet.loading) {
		throw new Error("Cyclic dependency encountered importing '"+name+"'");
	}
	if(!moduleSet.loaded) {
		var code = "(function(module,exports,require,$cyoa) {(function(){" + moduleSet.text + "\n;})();\nreturn exports;\n})\n";
		code += "\n\n//# sourceURL=" + name;
		try {
			moduleSet.loading = true;
			var fn = eval(code);
			var module = {exports: Object.create(null)};
			fn.call(null,
				module,
				module.exports,
				function(path) {return modules.execute(path,realPath);},
				cyoa);
			moduleSet.module = module;
			moduleSet.loaded = true;
		} catch (err) {
			err.message= "Error importing '"+name+"': "+err.message;
			throw err;
		} finally {
			moduleSet.loading = false;
		}
	}
	return moduleSet.module.exports;
}

boot.gatherModules = function(document) {
	var scriptHolders = document.getElementsByClassName("cyoa-scripts");
	var mods = Object.create(null);
	for(var index = 0; index < scriptHolders.length; index++) {
		var div = scriptHolders[index].firstElementChild;
		for(; div; div = div.nextElementSibling) {
			var moduleContent = div.textContent;
			var encodedName = div.id;
			var type = div.getAttribute("module-type");
			var name = decodeURIComponent(encodedName);
			mods[name] = {
				text: div.textContent,
				type: type,
				loaded: false
			};
		}
	}
	return mods;
}

modules.forEachModuleOfType = function(type,method) {
	if(modules.types[type]) {
		for(var name in modules.types[type]) {
			var module = modules.types[type][name];
			var exports = modules.execute(name);
			method(name,exports);
		}
	}
};

modules.assignModulesOfType = function(type,target) {
	target = target || Object.create(null);
	modules.forEachModuleOfType(type,function(name,exports) {
		for(var member in exports) {
			target[member] = exports[member];
		}
	});
	return target;
};

modules.getModulesByTypeAsHashmap = function(type,nameField) {
	nameField = nameField || "name";
	var results = Object.create(null);
	modules.forEachModuleOfType(type,function(title,module) {
		results[module[nameField]] = module;
	});
	return results;
};

modules.createClassesFromModule = function(type,baseClass) {
	var classes = Object.create(null);
	modules.forEachModuleOfType(type,function(title,moduleExports) {
		var newClass = function() {};
		if(baseClass) {
			newClass.prototype = Object.create(baseClass.prototype);
			newClass.prototype.constructor = baseClass;
		}
		Object.assign(newClass.prototype,moduleExports);
		classes[moduleExports.name] = newClass;
	});
	return classes;
};

boot.executeModules = function() {
	for(var name in modules.titles) {
		modules.execute(name);
	}
};

boot.boot = function(window) {
	modules.titles = boot.gatherModules(window.document);
	// Split modules into types
	modules.types = Object.create(null);
	for(var name in modules.titles) {
		var module = modules.titles[name];
		var type = module.type || "";
		modules.types[type] = modules.types[type] || Object.create(null);
		modules.types[type][name] = module;
	}
	// Start booting up
	// Assign all those methods to the global cyoa.
	modules.assignModulesOfType("cyoamethod",cyoa);
	cyoa.utils = modules.assignModulesOfType("cyoautils");
	var Lib = modules.execute("cyoa");
	var book = new Lib.Book(window.document);
	var state = new Lib.State(cyoa.data, book);
	var savers = modules.assignModulesOfType("cyoasaver");
	var manager = new savers[boot.saver](window);
	cyoa.state = state;
	cyoa.core = new Lib.Core(window.document, state, manager, book);
	cyoa.core.cyoa = cyoa; // getting a little wierd here
	cyoa.book = book;
	boot.executeModules();
	// Open the first page
	cyoa.core.openPage();
};

if(inBrowser) {
	try {
		boot.boot(window);
	} catch (err) {
		boot.reportError(err);
	}
}

return cyoa;

});

if(typeof(module) !== "undefined" && typeof(exports) !== "undefined") {
	module.exports = _boot;
} else {
	window.$cyoa = Object.create(null);
	window.onload = function() {
		_boot(window.$cyoa,true);
	};
}

//# sourceURL=$:/plugins/mythos/cyoa/js/boot.js
