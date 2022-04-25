/*\
title: $:/plugins/mythos/cyoa/js/tiddlymap/cyoaLinkEdgeTypeSubscriber.js
module-type: tmap.edgetypehandler
type: application/javascript

This edgetype manager displays edges for all <$cyoa to="something" />
occurrences.
\*/

/*jslint node: true, browser: true */
"use strict";

var AbstractRefEdgeTypeSubscriber = require("$:/plugins/felixhayashi/tiddlymap/js/AbstractRefEdgeTypeSubscriber").default;
var utils = require("$:/plugins/felixhayashi/tiddlymap/js/utils");

function StateLinkEdgeTypeSubscriber(allEdgeTypes,options) {
	options = options || {};
	AbstractRefEdgeTypeSubscriber.call(this,allEdgeTypes,options);
};

StateLinkEdgeTypeSubscriber.prototype = Object.create(AbstractRefEdgeTypeSubscriber.prototype);

exports.StateLinkEdgeTypeSubscriber = StateLinkEdgeTypeSubscriber;


StateLinkEdgeTypeSubscriber.prototype.canHandle = function(edgeType) {
	return edgeType.id === "tw-body:cyoa.link";
};

StateLinkEdgeTypeSubscriber.prototype.getReferences = function(tObj,toWL,typeWL) {
	if(typeWL && !typeWL["tw-body:cyoa.link"]) {
		return;
	}

	var toRefs = $tw.wiki.getTiddlerStateLinks(tObj.fields.title);

	if(!toRefs || !toRefs.length) {
		return;
	}

	return { "tw-body:cyoa.link": toRefs };
};
