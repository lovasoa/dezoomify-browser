var nationalgallery = (function(){
	var PHPSCRIPT = "proxy.php";

	function getObfuscatedTileId (id, zoom, row, col) {
		var repl = "vRfOdXapKz";
		var num = "0000000" + (row*1e9 + id*1e4 + col*1e2 + zoom), res='';
		for (var i=num.length-1; i>num.length-12; i--) res = repl[num[i]] + res;
		return res;
	}

	return {
		"open" : function (doc) {
			var base = doc.URL.split("/").slice(0,3).join("/");
			var path = base + "/custom/ng/tile.php?id=";

			var dataElems = doc.querySelectorAll(".data dt");
			if (dataElems.length===0) ZoomManager.error("No valid zoomify information found.");
			var rawdata = {};
			for (var i=0; i<dataElems.length; i++) {
				rawdata[dataElems[i].textContent] = dataElems[i].nextElementSibling.textContent;
			}
			var data = {
				"width" : Math.round(rawdata.width),
				"height" : Math.round(rawdata.height),
				"tileSize" : parseInt(rawdata.tileSize),
				"maxZoomLevel" : parseInt(rawdata.max),
				"contentId" : parseInt(rawdata.contentId),
				"path" : path,
				"name" : doc.title.split("|").slice(0,2).join("-")
			};

			ZoomManager.readyToRender(data);
		},
		"getTileURL" : function (col, row, zoom, data) {
			return data.path + getObfuscatedTileId(data.contentId, zoom, row, col);
		}
	};
})();
ZoomManager.dezoomersList["nationalgallery"] = nationalgallery;
ZoomManager.dezoomer = nationalgallery;
