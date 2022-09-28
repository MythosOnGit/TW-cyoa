/*\
title: $:/plugins/mythos/cyoa/js/groupHandlers/handler.js
type: application/javascript
module-type: library

This is the page group that all pages are in if they
don't have any page group tags.

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var utils = require("$:/plugins/mythos/cyoa/js/utils.js");
var Record = require("$:/plugins/mythos/cyoa/js/groupHandlers/record.js");

function Style(){};
Style.prototype.touch = function(){};
Style.prototype.init = function(){};
Style.prototype.exportData = function(){};
var styleClasses = $tw.modules.createClassesFromModules("cyoagrouphandlerstyle",null,Style);

/*
group: string of group name
*/
function Handler(wiki,group,data,pages) {
	this.data = data || Object.create(null);
	this.variable = data.variable || group;
	var styleClass = styleClasses[this.data.style || "string"];
	if(!styleClass) {
		utils.warn("Grouphandler warning: In "+this.data.title+", style '"+this.data.style+"' not recognized.");
		styleClass = styleClasses.string;
	}
	this.style = new styleClass();
	this.style.init(wiki,this.data);
	Record.call(this,wiki,group,pages);
	this.update();
	// Okay. Now that we've updated the record, lets pull out the pageMap
	if(Record.versioningEnabled(wiki)) {
		// This will likely occur after all compiling is done.
		$tw.utils.nextTick(() => this.commit(wiki));
	}
};

module.exports = Handler;

var Hp = Handler.prototype = Object.create(Record.prototype);

/*
Should be overridden
*/
Hp.after = function(title) {
	return null;
};

/*
Should be overridden
*/
Hp.touch = function(title) {
	return null;
};

/*
Should be overridden
*/
Hp.reset = function(title) {
	return null;
};

/*
Can be overridden
*/
Hp.before = function(title) {
	var rtn = this.after(title);
	if(rtn) {
		return "!" + rtn;
	}
	return rtn;
};

/*
Can be overridden
*/
Hp.afterAll = function(title) {
	return null;
}

/*
Can be overridden
*/
Hp.touchAll = function(title) {
	return null;
}

/*
Should be overridden?
*/
Hp.resetAll = function(title) {
	return null;
}

/*
Can be overridden
*/
Hp.beforeAll = function(title) {
	var rtn = this.afterAll(title);
	if(rtn) {
		return "!" + rtn;
	}
	return rtn;
}

Hp.first = function(title) {
	return this.before(title);
};

Hp.visited = function(title) {
	return this.after(title);
};

Hp.index = function(title) {
	return this.after(title);
};

Hp.write = function(title) {
	return this.after(title);
};

Hp.do = function(title) {
	return this.after(title);
};

Hp.if = function(title) {
	return this.after(title);
};

Hp.idFor = function(title) {
	var index = this.indexMap[title];
	return this.style.getIdFor(this.entries[index],index);
};

Hp.idForIndex = function(index) {
	return this.style.getIdFor(this.entries[index],index);
};

Hp.strIdFor = function(title) {
	var value = this.idFor(title);
	if(typeof value === "string") {
		return utils.enquote(value);
	} else {
		return value;
	}
};

Hp.strIndexerFor = function(title) {
	var value = this.idFor(title);
	if(/^[a-zA-Z$][\w$]*$/.test(value)) {
		return this.variable + "." + value;
	}
	return this.variable + "[" + this.strIdFor(title) + "]";
};

/*
This calls one of the sub getIdMap methods, this allows sub classes to add new styles, or change existing ones.
*/
Hp.generateIdFor = function(page,counter) {
	return this.style.getIdFor(this,page,counter);
};

Hp.touchEntry = function(info,index) {
	return this.style.touch(this,info,index)
};

Hp.generateUpTree = function() {
	var tree = Object.create(null);
	var getId = this.idForIndex.bind(this);
	var index = 0;
	this.forEachEntry(function(info) {
		if(info.imply) {
			tree[getId(index)] = info.imply.map(getId);
		}
		index++;
	});
	return tree;
};

Hp.generateExclusionList = function() {
	return this.exclusionArray.map((set) => set.map((title) => this.idFor(title)));
};
