document.addEventListener("DOMContentLoaded", function(){//Code isolation

	var backbutton = document.getElementById("prev");
	var homebutton = document.getElementById("homebutton");
	var adressbar = document.getElementById("adressbar");
	var browserform = document.getElementById("browserform");
	var iframe = document.getElementById("browserframe");

	var history = [];

	function goto(url) {
		if (url.indexOf("://") === -1) url = "https://google.com/search?q="+url;
		console.log("Going to "+url);
		iframe.contentWindow.location.replace(url);
		adressbar.value = (url.indexOf("file://") === 0) ? "" : url;
		adressbar.disabled = true;
	}

	goto(iframe.src);

	backbutton.addEventListener("click", function(e) {
		e.stopPropagation();
		console.log("Back. History: ", history);
		if (history.length > 1) history.shift();
		goto(history[0]);
	}, true);

	homebutton.addEventListener("click", function(e) {
		e.stopPropagation();
		console.log("Home");
		goto(history[history.length-1]);
	}, true);

	browserform.addEventListener("submit", function(e) {
		e.stopPropagation();
		goto(adressbar.value);
	}, true);

	iframe.addEventListener("load", function() {
		var url = iframe.contentWindow.location.toString();
		if (url.indexOf("file://") !== 0) adressbar.value = url;
		else adressbar.value = "";
		if (history[0] !== url) history.unshift(url);
		adressbar.disabled = false;
		iframe.contentWindow.addEventListener("beforeunload", function(){
			adressbar.value = "Loading...";
		});
	}, true);

}, true);
