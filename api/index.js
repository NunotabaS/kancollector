var http = require("http");
var config = require("./config.js");
var expedition = require("./expedition.js");

exports.config = function(conf){
	config.server = conf;
};

exports.create = function(token){
	return {
		api_token: token,
		api_verno: 1
	};
};

exports.api = function(entry, data, callback){
	var req = http.request({
		hostname: config.server,
		port:80,
		path:"/kcsapi/api_" + entry,
		method:"POST",
		headers:{
			"Accept":"*/*",
			"Accept-Language":"ja,ja-JP;q=0.8",
			"Origin":"http://" + config.server,
			"Content-Type":"application/x-www-form-urlencoded",
			"Referer":"http://" + config.server + "/kcs/port.swf?version=" + (config.mainVersion ? config.mainVersion : "1.6.2"),
			"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.29 Safari/537.36"
		}
	},function(res){
		var ret = "";
		res.setEncoding('utf8');
		res.on("data", function(d){
			ret += d;
		});
	
		res.on("end", function(){
			var parsed = null;
			if(/^.*?svdata=/.test(ret)){
				try{
					parsed = JSON.parse(ret.replace(/^.*?svdata=/,""));
				}catch(e){
					console.log(e);
				}
			}
			callback({code:res.statusCode,resp:ret, parsed:parsed});
		});
		
		res.on("error", function(){
			callback({code:500,resp:"error"});
		});
	});
	
	// Create the post body
	var pb = [];
	for(var x in data){
		pb.push(encodeURIComponent(x) + "=" + encodeURIComponent(data[x]));
	}
	req.write(pb.join("&"));
	req.end();
};

exports.stats = function(key, callback){
	exports.api("get_member/basic", exports.create(key), function(resp){
		if(resp.code !== 200 || !resp.parsed || resp.parsed.api_result !== 1){
			callback({code:500, resp: resp});
		}else{
			var stats = {};
			for(var i in resp.parsed.api_data){
				stats[i.replace(/^api_/,"")] = resp.parsed.api_data[i];
			}
			callback({code:200, resp: stats, src: resp});
		}
	});
};

exports.stats_dock = function(key, callback){
	var states = ["locked", "empty", "working"]
	exports.api("get_member/ndock",exports.create(key), function(resp){
		if(resp.code !== 200 || !resp.parsed || resp.parsed.api_result !== 1){
			callback({code:500, resp: resp});
		}else{
			var docks = [];
			for(var i = 0; i < resp.parsed.api_data.length;i++){
				var dock = resp.parsed.api_data[i];
				var dockinfo = {
					id : dock["api_id"],
					ship : dock["api_ship_id"],
					state: states[dock["api_state"] + 1],
					complete : dock["api_complete_time"],
					remaining: dock["api_complete_time"] > 0 ? (dock["api_complete_time"] - new Date().getTime()) : 0
				};
				docks.push(dockinfo);
			}
			callback({code:200, resp: docks, src: resp});
		}
	});
};

exports.ships = function(key, sortkey, callback){
	exports.api("get_member/ship2",exports.join(exports.create(key),{
			"api_sort_order":2,
			"api_sort_key":sortkey,
		}), function(resp){
		if(resp.code !== 200 || !resp.parsed || resp.parsed.api_result !== 1){
			callback({code:500, resp: resp});
		}else{
			var ships = [];
			for(var i = 0; i < resp.parsed.api_data.length;i++){
				var ship = resp.parsed.api_data[i];
				var ship_stats = {};
				for(var j in ship){
					ship_stats[j.replace(/^api_/,"")] = ship[j];
				}
				ships.push(ship_stats);
			}
			callback({code:200, resp: ships, src: resp});
		}
	});
};

exports.mission = function(key, mission_id, deck_id, callback){
	exports.api("req_mission/start",exports.join(exports.create(key),{
			"api_deck_id":deck_id,
			"api_mission_id":mission_id,
		}), function(resp){
		if(resp.code !== 200 || !resp.parsed || resp.parsed.api_result !== 1){
			callback({code:500, resp: resp});
		}else{
			var data = {};
			for(var j in resp.parsed.api_data){
				data[j.replace(/^api_/,"")] = resp.parsed.api_data[j];
			}
			callback({code:200, resp: data, src: resp});
		}
	});
};

exports.teams = function(key, callback){
	exports.api("get_member/deck_port",exports.create(key), function(resp){
		if(resp.code !== 200 || !resp.parsed || resp.parsed.api_result !== 1){
			callback({code:500, resp: resp});
		}else{
			var teams = [];
			for(var i = 0; i < resp.parsed.api_data.length;i++){
				var team = resp.parsed.api_data[i];
				var team_stats = {};
				for(var j in team){
					team_stats[j.replace(/^api_/,"")] = team[j];
				}
				teams.push(team_stats);
			}
			callback({code:200, resp: teams, src: resp});
		}
	});
};

exports.charge = function(key, type, ship_ids,  callback){
	exports.api("req_hokyu/charge",exports.join(exports.create(key),{
			"api_kind":type,
			"api_id_items":ship_ids.join(",")
		}), function(resp){
		if(resp.code !== 200 || !resp.parsed || resp.parsed.api_result !== 1){
			callback({code:500, resp: resp});
		}else{
			var data = {};
			for(var j in resp.parsed){
				data[j.replace(/^api_/,"")] = resp.parsed[j];
			}
			callback({code:200, resp: data, src: resp});
		}
	});
};

exports.dock = function(key, dock_id, ship_id, highspeed, callback){
	exports.api("req_nyukyo/start",exports.join(exports.create(key),{
			"api_ship_id":ship_id,
			"api_ndock_id":dock_id,
			"api_highspeed": (highspeed ? 1 : 0),
		}), function(resp){
		if(resp.code !== 200 || !resp.parsed || resp.parsed.api_result !== 1){
			callback({code:500, resp: resp});
		}else{
			var data = {};
			for(var j in resp.parsed){
				data[j.replace(/^api_/,"")] = resp.parsed[j];
			}
			callback({code:200, resp: data, src: resp});
		}
	});
};

exports.hensei = function(key, ship_id, position, team, callback){
	exports.api("req_hensei/change",exports.join(exports.create(key),{
			"api_ship_id":ship_id,
			"api_ship_idx":position,
			"api_id": team,
		}), function(resp){
		if(resp.code !== 200 || !resp.parsed || resp.parsed.api_result !== 1){
			callback({code:500, resp: resp});
		}else{
			var data = {};
			for(var j in resp.parsed){
				data[j.replace(/^api_/,"")] = resp.parsed[j];
			}
			callback({code:200, resp: data, src: resp});
		}
	});
};

exports.join = function(obja, objb){
	for(var x in objb){
		obja[x] = objb[x];
	}
	return obja;
};
