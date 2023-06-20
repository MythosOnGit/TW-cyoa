"use strict";

var _boot = (function(cyoa,inBrowser) {

cyoa = cyoa || Object.create(null);
var boot = cyoa.boot = cyoa.boot || Object.create(null);
var state;

/*
This is encodePage, but it works exclusively on a string. encodePage can
also take an array.
*/
function encodeString(idString) {
	var dictionary = { "/": "%2F" };
	var encoded = encodeURIComponent(idString);
	for(var dec in dictionary) {
		var enc = dictionary[dec];
		encoded = encoded.split(enc).join(dec);
	}
	return encoded;
};

boot.declare = function(modules,args) {
	state.declare.apply(state,args);
}

boot.reportError = function(error) {
	console.error(error.stack || error);
	if(inBrowser) {
		var str = "<li class='cyoa-error-item'>"+error+"</li>";
		var elem = document.getElementsByClassName("cyoa-error")[0];
		elem.innerHTML += str;
	}
}

/*
Ripped from $tw.utils.resolvePath
*/
boot.resolvePath = function(sourcePath,rootPath) {
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

boot.resolveModuleGivenPath = function(modules,path) {
	if(modules[path]) {
		return path;
	} else if(modules[path + ".js"]) {
		return path + ".js";
	} else if(modules[moduleSets[path]]) {
		return moduleSets[path];
	}
	return null;
};

boot.execute = function(modules,path,root) {
	if(!path) {
		throw new Error("require requires a non-empty string ("+path+")");
	}
	var rootToUse = "";
	if(path[0] == ".")  {
		rootToUse = root;
	}
	var name = boot.resolvePath(path,rootToUse);
	var realPath = boot.resolveModuleGivenPath(modules,name);
	if(!realPath) {
		if(!inBrowser) {
			return require(path);
		} else {
			throw new Error("Module '"+name+"' not found");
		}
	}
	var moduleSet = modules[realPath];
	if(moduleSet.loading) {
		throw new Error("Cyclic dependency encountered importing '"+name+"'");
	}
	if(!moduleSet.loaded) {
		var code = "(function(module,exports,declare,require,cyoa) {(function(){" + moduleSet.text + "\n;})();\nreturn exports;\n})\n";
		code += "\n\n//# sourceURL=" + name;
		try {
			moduleSet.loading = true;
			var fn = eval(code);
			var module = {exports: Object.create(null)};
			fn.call(null,
				module,
				module.exports,
				function() {return boot.declare(modules,arguments);},
				function(path) {return boot.execute(modules,path,realPath);},
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
	var modules = Object.create(null);
	for(var index = 0; index < scriptHolders.length; index++) {
		var div = scriptHolders[index].firstElementChild;
		for(; div; div = div.nextElementSibling) {
			var moduleContent = div.textContent;
			var encodedName = div.id;
			var type = div.getAttribute("module-type");
			var name = decodeURIComponent(encodedName);
			modules[name] = {
				text: div.textContent,
				type: type,
				loaded: false
			};
		}
	}
	return modules;
}

boot.forEachModuleOfType = function(modules,type,method) {
	for(var name in modules) {
		var module = modules[name];
		if(module.type === type) {
			var exports = boot.execute(modules,name);
			method(name,exports);
		}
	}
};

boot.assignModulesOfType = function(modules,type,target) {
	target = target || Object.create(null);
	boot.forEachModuleOfType(modules,type,function(name,exports) {
		for(var member in exports) {
			target[member] = exports[member];
		}
	});
	return target;
};

boot.executeModules = function(modules) {
	for(var name in modules) {
		boot.execute(modules,name);
	}
};

boot.boot = function(window) {
	var modules = boot.gatherModules(window.document);
	var Lib = boot.execute(modules,"cyoa");
	state = new Lib.State();
	var manager = new Lib.UriManager(window);
	cyoa.core = new Lib.Core(window.document,state,manager);
	// Assign all those methods to the global cyoa.
	boot.assignModulesOfType(modules,"cyoamethod",cyoa);
	cyoa.stateClasses = boot.assignModulesOfType(modules,"state");
	cyoa.utils = Lib.utils;
	cyoa.core.cyoa = cyoa; // getting a little wierd here
	cyoa.book = cyoa.core.book;
	boot.executeModules(modules);
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
