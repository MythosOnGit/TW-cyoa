var utils = require("./utils");

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

Object.defineProperty(UriManager.prototype,"location",{
	get: function() { return this.window.location; }
});

/*
newPage: string of next page. Should not be encoded. Should have "#" at start.
newState: string that's Uri compliant. No preceding "?"
*/
UriManager.prototype.pushState = function(newState,newPage)
{
	newPage = utils.encodePage(newPage);
	if(this.html5) {
		var newurl = this.currentUrl()+this.createHtml5Component(newPage,newState);
		var statePushed = false;
		try {
			this.window.history.pushState({path:newurl},"",newurl);
			statePushed = true;
		} catch (err) {
			console.error(err);
			// This will probably occur due to Chrome's stupid security error.
			console.log("Error occurred using history.pushState. Switching to compatability mode.");
			this.html5 = false;
		}
		if(statePushed) {
			this.popstate();
		}
	}
	if(!this.html5) {
		var newurl = this.createHtml4Anchor(newPage,newState);
		// Downside. The location.search may still be populated from previous html5 browsing. It doesn't look like we can clean it up, so we just have to ignore it.
		this.location.hash = newurl;
	}
}

UriManager.prototype.getPage = function() {
	var page_id = this.location.hash;
	if(page_id.indexOf("#?") == 0) {
		// This is an html4 compatable uri.
		var secondQMark = page_id.indexOf("?",2);
		if(secondQMark >= 0) {
			page_id = page_id.substr(secondQMark);
		} else {
			page_id = ""
		}
	}
	if(page_id) {
		page_id = page_id.substring(1);
		page_id = utils.decodePage(page_id);
	}
	return page_id;
}

UriManager.prototype.getState = function() {
	var uriState;
	if(this.location.hash.indexOf("#?") == 0) {
		//This is an html4 compatiable uri.
		var hash = this.location.hash;
		var secondQMark = hash.indexOf("?",2);
		if(secondQMark >= 0) {
			uriState = hash.slice(1,secondQMark);
		} else {
			uriState = hash.substr(1);
		}
	} else {
		uriState = this.location.search;
	}
	// Substr to get rid of the leading question mark
	return uriState.substr(1);
}

UriManager.prototype.createHtml5Component = function(page,state) {
	if(state.length > 0) {
		state = "?" + state;
	}
	return state + "#" + page;
}

UriManager.prototype.createHtml4Anchor = function(page,state) {
	var pagePrefix = "#";
	if(state.length > 0) {
		state = "#?" + state;
		pagePrefix = "?";
	} else {
		if(this.location.search.length > 0) {
			state = "#?";
			pagePrefix = "?";
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
	return this.location.protocol + "//" + this.location.host + this.location.pathname;
}

module.exports = UriManager;
