(function () {
    "use strict";
var gui = require('nw.gui');
var Window = gui.Window;
var menu = new gui.Menu({type: "menubar"});
menu.append(new gui.MenuItem({
  label: "Click me",
  click: function() {
    alert("I'm clicked");
  }
}));
Window.get().menu = menu;

function isZoomify(win) {
	var doc = win.document;
	if (win.Z && win.Z.ZoomifyImageViewer) return true; //HTML5 viewer
	var flashvarselem = doc.querySelector("object param[name=FlashVars], object param[name=flashvars]");
	if (flashvarselem && flashvarselem.value.indexOf("zoomifyImagePath")!==-1) return true; //Flash viewer
	return false;
}

function isNatGal(win) {
	var doc = win.document;
	return (win.ZoomTool && doc.querySelector(".data dt"));
}

function deepDetect(win, func) {
	if (func(win)) return win.document;
	var frames = win.document.querySelectorAll("frame, iframe");
	for (var i=0; i<frames.length; i++) {
		var subwin = frames[i].contentWindow;
		var detection = deepDetect(subwin, func);
		if (detection) return detection;
	}
	return false;
}

var iframe;

function startDezoomification (win) {
	var win = iframe.contentWindow;
	var zoomify = deepDetect(win, isZoomify);
	if (!zoomify) var natgal = deepDetect(win, isNatGal);
	var win = iframe.contentWindow;
	if ( zoomify || natgal ) {
		var dezoomWin = Window.open("dezoomify/dezoomify.html", {
			toolbar:true,
			focus:true
		});
		dezoomWin.on("loaded", function() {
			var dezoomwin = dezoomWin.window;
			dezoomwin.ZoomManager.dezoomer = zoomify ? dezoomwin.zoomify : dezoomwin.nationalgallery;
			dezoomwin.ZoomManager.open(zoomify || natgal);
		});
	}
}

window.onload = function () {
	iframe = document.getElementById("browserframe");
	iframe.onload = startDezoomification;
	var button = document.getElementById("redetect");
	button.onclick = startDezoomification;
};

//Window.get().showDevTools(); //DEBUG
})();
