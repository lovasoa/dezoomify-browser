var zoomify = (function () { //Code isolation
	//var PHPSCRIPT = "http://ophir.alwaysdata.net/dezoomify/dezoomify.php" //Use a remote php script if you can't host PHP
	var PHPSCRIPT = "dezoomify.php";

	return {
		"open" : function (doc) {
			var path;
			
			//Search for an HTML5 viewer
			var scripts = doc.getElementsByTagName("script");
			var regex = new RegExp("showImage\\([^),]*,[^\"']*[\"']([^'\"]*)[^)]*\\)");
			for (var i=0; i<scripts.length; i++) {
				var matching = scripts[i].innerHTML.match(regex);
				if (matching && matching.length >= 2) {
					path = matching[1];
					break;
				}
			}
			
			if (!path) { //Search for a flash viewer
				var flashvars = doc.querySelector("object param[name=FlashVars], object param[name=flashvars]");
				console.log(flashvars.value);
				var regex = new RegExp("zoomifyImagePath=([^'\"&]*)", "i");
				var matching = flashvars.value.match(regex);
				if (matching && matching.length >= 2) {
					path = matching[1];
				}
			}
			
			if (!path) {
				ZoomManager.error("No zoomify viewer found");
				return;
			}

			//Trick to transform relative url to absolute url
			var a = doc.createElement("a");
			a.href = path;
			path = a.href; //Magic!

			var xhr = new XMLHttpRequest();
			console.log("requesting: "+path + "/ImageProperties.xml");
			xhr.open("GET", path + "/ImageProperties.xml", true);

			xhr.onloadstart = function () {
				ZoomManager.updateProgress(0, "Sent a request in order to get informations about the image...");
			};
			xhr.onerror = function (e) {
				console.log("XHR error", e);
				ZoomManager.error("Unable to connect to the server to get the required informations.");
			};
			xhr.onloadend = function () {
				var xml = xhr.responseXML;
				if (!infos) {
					ZoomManager.error("The server answered our request for metadata, but it's answer is not in a valid format.");
					console.log(xhr.responseText);
				}
				var infos = xml.getElementsByTagName("IMAGE_PROPERTIES")[0];
				if (!infos) {
					ZoomManager.error();
					console.log(xhr.responseText);
				}
				var data = {};
				data.path = path;
				data.width = parseInt(infos.getAttribute("WIDTH"));
				data.height = parseInt(infos.getAttribute("HEIGHT"));
				data.tileSize = parseInt(infos.getAttribute("TILESIZE"));
				data.numTiles = parseInt(infos.getAttribute("NUMTILES")); //Total number of tiles (for all zoom levels)
				data.zoomFactor = 2; //Zooming factor between two consecutive zoom levels
				data.name = doc.title.replace(new RegExp("/", "g"), "-").slice(0,30);

				ZoomManager.readyToRender(data);
			};
			xhr.send(null);
		},
		"getTileURL" : function (col, row, zoom, data) {
			var totalTiles = data.nbrTilesX * data.nbrTilesY;
			var tileGroup = Math.floor((data.numTiles - totalTiles + col + row*data.nbrTilesX) / 256);
			return data.path + "/TileGroup" + tileGroup + "/" + zoom + "-" + col + "-" + row + ".jpg";
		}
	};
})();
ZoomManager.dezoomersList["zoomify"] = zoomify;
ZoomManager.dezoomer = nationalgallery;
