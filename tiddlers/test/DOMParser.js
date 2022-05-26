/*\
title: test/dom-parser.js
type: application/javascript
module-type: library

Either returns the browser DOMParser or the xmldom plugin parser
\*/

var parser;

exports.parseFromString = function(htmlContent) {
	if(parser === undefined) {
		parser = newDOMParser();
	}
	var doc = parser.parseFromString(htmlContent,"text/html");
	return doc;
};

exports.parseBodyAndHead = function(body,head) {
	head = head || "";
	return exports.parseFromString("<!doctype html><html><head>"+head+"</head><body>"+body+"</body></html>");
};

function newDOMParser() {
	if($tw.browser) {
		return new DOMParser();
	} else {
		var _DOMParser = require("$:/plugins/tiddlywiki/xmldom/dom-parser").DOMParser;
		var underlyingParser = new _DOMParser();
		return new NodeJSDOMParser(underlyingParser);
	}
};

function NodeJSDOMParser(underlyingParser) {
	this.parser = underlyingParser
};

var nodeProto;

NodeJSDOMParser.prototype.parseFromString = function(content,type) {
	var doc = this.parser.parseFromString(content,type);
	// Add some stuff that CYOA expects to be there in its documents
	doc.getElementsByClassName = getElementsByClassName;
	doc.eventListeners = Object.create(null);
	doc.addEventListener = function(eventType,method) {
		this.eventListeners[eventType] = method;
	};
	doc.dispatchEvent = function(event) {
		this.eventListeners[event.type](event);
	};
	doc.body = doc.getElementsByTagName("body")[0];
	if(nodeProto === undefined) {
		nodeProto = Object.getPrototypeOf(doc.documentElement);
		Object.defineProperty(nodeProto,"classList",{get: classList});
		Object.defineProperty(nodeProto,"id",{get: id});
		Object.defineProperty(nodeProto,"firstElementChild",{get: firstElementChild});
		Object.defineProperty(nodeProto,"innerHTML",{
			get: innerHTML,
			set: setInnerHTML
		});
		Object.defineProperty(nodeProto,"nextElementSibling",{get: nextElementSibling});
	}
	return doc;
};

///// Mock elements for NodeJS /////

function ClassList(element) {
	this.elem = element;
};

ClassList.prototype._list = function() {
	var className = this.elem.getAttribute("class");
	var list = className.split(" ").filter( a => a !== "");
	list.contains = list.includes;
	return list;
};

ClassList.prototype.contains = function(name) {
	return this._list().includes(name);
};

ClassList.prototype.toggle = function(name,on) {
	var list = this._list();
	var i = list.indexOf(name);
	if(on === undefined) {
		if(i >= 0) {
			list.splice(i,1);
		} else {
			list.push(name);
		}
	} else {
		if(on && i < 0) {
			list.push(name);
		} else if(!on && i >= 0) {
			list.splice(i,1);
		}
	}
	this.elem.setAttribute("class",list.join(" "));
};

function classList() {
	return new ClassList(this);
};

function id() {
	return this.getAttribute("id");
};

function firstElementChild() {
	var ptr = this.firstChild;
	while(ptr) {
		if(ptr.nodeType == 1 /*ELEMENT_NODE*/) {
			return ptr;
		}
		ptr = ptr.nextSibling;
	}
	return null;
};

function nextElementSibling() {
	var ptr = this.nextSibling;
	while(ptr) {
		if(ptr.nodeType == 1 /*ELEMENT_NODE*/) {
			return ptr;
		}
		ptr = ptr.nextSibling;
	}
	return null;
};

function getElementsByClassName(className){
	var ls = [];
	_visitNode(this.documentElement,function(node) {
		if(node.nodeType == 1 /*ELEMENT_NODE*/
		&& node.hasAttribute("class")
		&& node.classList.contains(className)) {
			ls.push(node);
			}
	});
	return ls;
};

var XMLSerializer;

function innerHTML() {
	if(XMLSerializer === undefined) {
		XMLSerializer = require("$:/plugins/tiddlywiki/xmldom/dom").XMLSerializer;
	}
	var serializer = new XMLSerializer();
	var accum = [];
	var ptr = this.firstChild;
	for(; ptr; ptr = ptr.nextSibling) {
		accum.push(serializer.serializeToString(ptr,true));
	}
	return accum.join("");
};

function setInnerHTML(content) {
	var xmlBit = parser.parseFromString("<doc>"+content+"</doc>");
	var bits = [];
	for (var ptr = xmlBit.documentElement.firstChild; ptr; ptr = ptr.nextSibling) {
		bits.push(ptr);
	}
	for (var i = 0; i < bits.length; i++) {
		this.appendChild(bits[i]);
	}
	return content;
};

/*
callback: Should return true for continue, false for break.
returns: boolean true, break visit.
*/
function _visitNode(node,callback){
    if(callback(node)){
        return true;
    }
    if(node = node.firstChild){
        do{
            if(_visitNode(node,callback)){return true}
        }while(node=node.nextSibling)
    }
}
