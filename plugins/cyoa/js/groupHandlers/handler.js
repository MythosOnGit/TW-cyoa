/*\
title: $:/plugins/mythos/cyoa/js/groupHandlers/handler.js
type: application/javascript
module-type: library

This is the page group that all pages are in if they
don't have any page group tags.

\*/

"use strict";

var utils = require("$:/plugins/mythos/cyoa/js/utils.js");
var Record = require("$:/plugins/mythos/cyoa/js/groupHandlers/record.js");

function Style(){};
Style.prototype.amendRecord = function(){};
Style.prototype.init = function(){};
Style.prototype.exportData = function(){};
Style.prototype.getIdFor = function(entry,index) {return index;};
var styleClasses = $tw.modules.createClassesFromModules("cyoaserializermanager",null,Style);

/*
group: string of group name
*/
function Handler() {
};

module.exports = Handler;

var Hp = Handler.prototype = Object.create(Record.prototype);

Hp.init = function(wiki,group,data,pages) {
	this.data = data || Object.create(null);
	this.variable = wiki.getCyoaGroupVariable(group,"cyoa.key");
	var styleClass = styleClasses[this.data.style || "string"];
	if(!styleClass) {
		// This doesn't have a codec stager, so we can use the default stager.
		styleClass = Style;
	}
	this.style = new styleClass();
	this.style.init(wiki,this.data);
	Record.call(this,wiki,group,pages);
	this.update();
	// And now the styles have a chance to write data however they want
	this.changed = this.style.amendRecord(this.entries) || this.changed;
	// Okay. Now that we've updated the record, lets pull out the pageMap
	if(Record.versioningEnabled(wiki)) {
		// This will likely occur after all compiling is done.
		$tw.utils.nextTick(() => this.commit(wiki));
	}
};

Hp.groupData = function() {
	var data = {
		exList: this.generateExclusionList(),
		up: this.generateUpTree(),
		encoder: this.data.style || "string"
	};
	this.style.exportData(data);
	return data;
};

Hp.after = function(title) {
	return this.variable + ".is(" + this.strIdFor(title) + ")";
};

Hp.touch = function(title) {
	return this.variable + ".touch(" + this.strIdFor(title) + ")";
};

Hp.reset = function(title) {
	return this.variable + ".reset(" + this.strIdFor(title) + ")";
};

Hp.before = function(title) {
	var rtn = this.after(title);
	if(rtn) {
		return "!" + rtn;
	}
	return rtn;
};

Hp.afterAll = function(title) {
	return this.variable + ".any()";
}

Hp.touchAll = function(title) {
	return null;
}

Hp.resetAll = function(title) {
	return this.variable + ".clear()";
}

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
	return this.if(title);
};

Hp.weight = function(title) {
	return this.if(title);
};

Hp.write = function(title) {
	return this.if(title);
};

Hp.do = function(title) {
	return this.variable + ".x(" + this.strIdFor(title) + ").val";
};

Hp.if = function(title) {
	return  this.variable + ".get(" + this.strIdFor(title) +")";
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
