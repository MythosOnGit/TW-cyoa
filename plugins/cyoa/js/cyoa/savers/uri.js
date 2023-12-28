'use strict';

var utils = require('../utils');

function UriManager(window) {
	this.window = window || {};
	this.html5 = !!(window.history && window.history.pushState);
	this.onpageturn = null;

	var self = this;
	this.popstate = this.window.onpopstate = function() {
		if(self.onpageturn) {
			self.onpageturn();
		}
	}
}

exports.uri = UriManager;

Object.defineProperty(UriManager.prototype,'location',{
	get: function() { return this.window.location; }
});

/*
newPage: string of next page. Should not be encoded. Should have '#' at start.
newState: string that's Uri compliant. No preceding '?'
*/
UriManager.prototype.pushState = function(newState,newPage)
{
	newState = stringifyStateHash(newState);
	newPage = encodePage(newPage);
	if(this.html5) {
		var newurl = this.currentUrl()+createHtml5Component(newPage,newState);
		var statePushed = false;
		try {
			this.window.history.pushState({path:newurl},'',newurl);
			statePushed = true;
		} catch (err) {
			console.error(err);
			// This will probably occur due to Chrome's stupid security error.
			console.log('Error occurred using history.pushState. Switching to compatability mode.');
			this.html5 = false;
		}
		if(statePushed) {
			this.popstate();
		}
	}
	if(!this.html5) {
		var newurl = createHtml4Anchor(this,newPage,newState);
		// Downside. The location.search may still be populated from previous html5 browsing. It doesn't look like we can clean it up, so we just have to ignore it.
		this.location.hash = newurl;
	}
}

UriManager.prototype.getPage = function() {
	var page_id = this.location.hash;
	if(page_id.indexOf('#?') == 0) {
		// This is an html4 compatable uri.
		var secondQMark = page_id.indexOf('?',2);
		if(secondQMark >= 0) {
			page_id = page_id.substr(secondQMark);
		} else {
			page_id = ''
		}
	}
	if(page_id) {
		page_id = page_id.substring(1);
		page_id = decodePage(page_id);
	}
	return page_id;
}

UriManager.prototype.getState = function() {
	var uriState;
	if(this.location.hash.indexOf('#?') == 0) {
		//This is an html4 compatiable uri.
		var hash = this.location.hash;
		var secondQMark = hash.indexOf('?',2);
		if(secondQMark >= 0) {
			uriState = hash.slice(1,secondQMark);
		} else {
			uriState = hash.substr(1);
		}
	} else {
		uriState = this.location.search;
	}
	// Substr to get rid of the leading question mark
	return parseStateString(uriState.substr(1));
}

function createHtml5Component(page,state) {
	if(state.length > 0) {
		state = '?' + state;
	}
	return state + '#' + page;
}

function createHtml4Anchor(saver,page,state) {
	var pagePrefix = '#';
	if(state.length > 0) {
		state = '#?' + state;
		pagePrefix = '?';
	} else {
		if(saver.location.search.length > 0) {
			state = '#?';
			pagePrefix = '?';
		}
	}
	if(page.length > 0) {
		page = pagePrefix + page;
	}
	return state + page;
}

/*
http://...blah.html
*/
UriManager.prototype.currentUrl = function() {
	return this.location.protocol + '//' + this.location.host + this.location.pathname;
}

function parseStateString(stateString) {
	var array = stateString? stateString.split('&'): [];
	var pack = Object.create(null);
	for(var index = 0; index < array.length; index++) {
		var pair = array[index];
		var equals = pair.indexOf('=');
		var key = decodePage(pair.substring(0,equals));
		var val = decodePage(pair.substring(equals+1));
		pack[key] = val;
	}
	return pack;
};

function stringifyStateHash(stateHash) {
	var array = [];
	for(var key in stateHash) {
		var encodedKey = encodePage(key);
		var encodedVal = encodePage(stateHash[key]);
		array.push(encodedKey+'='+encodedVal);
	}
	return array.join('&');
};

function encodePage(idString) {
	var dictionary = { '/': '%2F' };
	var encoded = encodeURIComponent(idString);
	for(var dec in dictionary) {
		var enc = dictionary[dec];
		encoded = encoded.split(enc).join(dec);
	}
	return encoded;
};

function decodePage(idString) {
	return decodeURIComponent(idString);
};
