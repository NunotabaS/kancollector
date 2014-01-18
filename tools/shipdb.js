var fs = require("fs");
var ships = null;
exports.load = function(file){
	var typeRef = {
		"戦艦":"BB",
		"駆逐艦":"DD",
		"正規空母":"CV",
		"軽空母":"CVL",
		"重巡洋艦":"CA",
		"軽巡洋艦":"CL",
		"重雷装巡洋艦":"CLT",
		"水上機母艦":"AV",
		"揚陸艦":"LSD",
		"装甲空母":"CVB",
		"航空巡洋艦":"CAV",
	}
	try{
		var rdb = fs.readFileSync(file).toString("utf8").split("\n");
		var db = [];
		for(var i = 0; i <rdb.length;i++){
			if(rdb[i]=== "")
				continue;
			var recordl = rdb[i].split("\t");
			
			var record = {
				"id": recordl[0],
				"rare": recordl[1] !== "" ? parseInt(recordl[1]) : 0,
				"name": recordl[2],
				"class": recordl[3],
				"class_id": recordl[4],
				"type": recordl[5],
				"type_id":typeRef[recordl[5]] ? typeRef[recordl[5]] : ""
			};
			db.push(record);
		}
		ships = db;
		return db;
	}catch(e){
		console.log("[Err] Shipdb load fail");
		return [];
	}
};

exports.ships = function(file){
	if(ships)
		return ships;
	else
		return exports.load(file);
}
