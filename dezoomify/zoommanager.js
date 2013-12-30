var UI = {};
UI.canvas = document.getElementById("rendering-canvas");

/** Adjusts the size of the image, so that is fits page width or page height
**/
UI.changeSize = function () {
	var width = UI.canvas.width, height = UI.canvas.height;
	switch (this.fit) {
		case "width":
			this.fit = "height";
			UI.canvas.style.height = window.innerHeight + "px";
			UI.canvas.style.width = window.innerHeight / height * width + "px";
			break;
		case "height":
			this.fit = "none";
			UI.canvas.style.width = width + "px";
			UI.canvas.style.height = height + "px";
			break;
		default:
			this.fit = "width";
			UI.canvas.style.width = window.innerWidth + "px";
			UI.canvas.style.height = window.innerWidth / width * height + "px";
	}
};
/** Sets the width and height of the canvas
**/
UI.setupRendering = function (data) {
	document.getElementById("urlform").style.display = "none";
	UI.canvas.width = data.width;
	UI.canvas.height = data.height;
	UI.canvas.onclick = UI.changeSize;
	UI.ctx = UI.canvas.getContext("2d");
	UI.changeSize();
	console.log("Image size: " + data.width + "x" + data.height);
};

UI.drawTile = function(tileImg, x, y) {
	UI.ctx.drawImage(tileImg, x, y);
};

UI.error = function(errmsg) {
	var elem = document.getElementById("error");
	if (errmsg) elem.innerHTML = errmsg;
	elem.style.display = "block";
};

UI.updateProgress = function (percent, text) {
	if (percent === null) percent = 100;
	else text += ' (' + parseInt(percent) + ") %";
	document.getElementById("percent").innerHTML = text;
	document.getElementById("progressbar").style.width = percent + "%";
};

UI.loadEnd = function() {
	if (process && process.title === "node") { //Running under node-webkit
		var a = document.createElement("a");
		a.textContent = "Download";
		a.href = "#";
		UI.updateProgress(null, "Creating the JPEG file...");
		var base64, buffer;
		var inputEl = document.createElement("input");
		inputEl.type="file";
		inputEl.nwsaveas = (ZoomManager.data.name || "image") + ".jpg";
		inputEl.addEventListener("change", function(){
			var fs = require("fs");
			fs.writeFile(inputEl.value, buffer, function(err){
				if (err) UI.error(err);
				else UI.updateProgress(100, "File saved");
			});
		}, false);
		a.addEventListener("click", function(evt) {
			evt.preventDefault();
			inputEl.click();
		}, true);
		setTimeout(function() {
			base64 = UI.canvas.toDataURL("image/jpeg").split("base64,",2)[1];
			buffer = new Buffer(base64, "base64");
			UI.updateProgress(null, "File created : ");
			document.getElementById("percent").appendChild(a);
		}, 10); //Give time to refresh the UI
	} else {
		document.getElementById("status").style.display="none";
	}
};

var ZoomManager = {};

ZoomManager.error = function (errmsg) {
	console.error(errmsg);
	UI.error(errmsg);
};
ZoomManager.updateProgress = UI.updateProgress;

ZoomManager.status = {
	"loaded" : 0,
	"totalTiles" : 1
};

ZoomManager.startTimer = function () {
	var timer = setInterval(function () {
		/*Update the User Interface each 500ms, and not in addTile, because it would
		slow down the all process to update the UI too often.*/
		var loaded = ZoomManager.status.loaded, total = ZoomManager.status.totalTiles;
		ZoomManager.updateProgress(100 * loaded / total, "Loading the tiles...");

		if (loaded == total) {
			clearInterval(timer);
			ZoomManager.loadEnd();
		}
	}, 500);
	return timer;
};

ZoomManager.loadEnd = UI.loadEnd;


ZoomManager.readyToRender = function(data) {

	data.nbrTilesX = data.nbrTilesX || Math.ceil(data.width / data.tileSize);
	data.nbrTilesY = data.nbrTilesY|| Math.ceil(data.height / data.tileSize);
	data.totalTiles = data.totalTiles || data.nbrTilesX*data.nbrTilesY;

	ZoomManager.status.totalTiles = data.totalTiles;
	ZoomManager.data = data;
	UI.setupRendering(data);

	ZoomManager.updateProgress(0, "Preparing tiles load...");
	ZoomManager.startTimer();

	var render = ZoomManager.dezoomer.render || ZoomManager.defaultRender;
	setTimeout(render, 1, data); //Give time to refresh the UI, in case render would take a long time
};

ZoomManager.defaultRender = function (data) {
	var zoom = data.maxZoomLevel || ZoomManager.findMaxZoom(data);
	for (var x=0; x<data.nbrTilesX; x++) {
		for (var y=0; y<data.nbrTilesY; y++) {
			var url = ZoomManager.dezoomer.getTileURL(x,y,zoom,data);
			ZoomManager.addTile(url, x*data.tileSize, y*data.tileSize);
		}
	}
};

ZoomManager.addTile = function (url, x, y) {
	//Demande une partie de l'image au serveur, et l'affiche lorsqu'elle est reçue
	var img = document.createElement("img");
	img.onload = function () {
		UI.drawTile(img, x, y);
		ZoomManager.status.loaded ++;
	};
	img.src = url;
};

ZoomManager.open = function(doc) {
	ZoomManager.dezoomer.open(doc);
};

/** Returns the maximum zoom level, knowing the image size, the tile size, and the multiplying factor between two consecutive zoom levels 
**/
ZoomManager.findMaxZoom = function (data) {
	//For all zoom levels:
	//size / zoomFactor^(maxZoomLevel - zoomlevel) = numTilesAtThisZoomLevel * tileSize
	//For the baseZoomLevel (0 for zoomify), numTilesAtThisZoomLevel=1
	var size = Math.max(data.width, data.height);
	return Math.ceil(Math.log(size/data.tileSize) / Math.log(data.zoomFactor)) + (data.baseZoomLevel||0);
};

ZoomManager.dezoomersList = {};
