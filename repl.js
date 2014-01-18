var repl = require("repl"), fs = require("fs");
var api = require("./api"), tools = require("./tools");
var sesn_key = "";
var cache = {
	key:"",
	ships:null
};

function saveCache(cb){
	fs.writeFile("cachefile", JSON.stringify(cache), {flag:"w"}, function(){
		if(cb)
			cb();
	});
};	

fs.readFile("cachefile",function(err, data){
	var SHIP_REF = tools.ship_db.ships("db");
	try{
		cache = err ? {} : JSON.parse(data);
		if(err){
			saveCache();
		}
		if(!cache.ships)
			cache.ships = null;
		sesn_key = cache.key ? cache.key : "";
	}catch(e){
		saveCache();
		sesn_key = "";
	}
	
	if(sesn_key !== ""){
		console.log("[OK] Loaded apikey as " + sesn_key);
	}
	repl.start({
		prompt: "> ",
		eval: function(cmd, context, filename, callback) {
			if (cmd !== "(\n)") {
				cmd = cmd.slice(1, -2); // rm parens and newline added by repl
				var command = cmd.trim().split(" ");
				if(command[0] === "exit"){
					process.exit();
				}
				switch(command[0]){
					case "key":{
						sesn_key = command[1];
						cache.key = sesn_key;
						saveCache(function(){
							callback("[OK] Set user apikey as " + command[1]);
						});
						return;
					}break;
					case "api":{
						var req = api.create(sesn_key);
						var entry = command[1] ? command[1] : "auth_member/logincheck";
						var params = null;
						try{
							params = command[2] ? JSON.parse(command[2]) : {};
						}catch(e){
							params = {};
						}
						api.api(entry, api.join(req, params), function(resp){
							console.log(resp);
							callback("RAW : " + resp.resp);
						});
						return;
					}break;
					case "stat":{
						api.stats(sesn_key, function(stats){
							if(stats.code === 200){
								console.log(stats.resp);
								callback();
							}else{
								console.log(stats);
								callback();
							}
						});
						return;
					}break;
					
					case "docks":{
						if(command.length === 1){
							api.stats_dock(sesn_key, function(stats){
								if(stats.code === 200){
									var docks = stats.resp;
									for(var i = 0; i < docks.length; i++){
										var info = "[" + docks[i].id + "] ";
										if(docks[i].state === "empty"){
											info += "Empty";
										}else if(docks[i].state === "locked"){
											info += "Locked";
										}else{
											info += "Ship:" + 
												tools.findById(cache.ships, SHIP_REF, docks[i].ship) + 
												" Remaining: " + tools.pretty_time(docks[i].remaining);
										}
										console.log(info);
									}
									callback();
								}else{
									console.log(stats);
									callback();
								}
							});
						}
						return;
					}break;
					
					case "teams":{
						api.teams(sesn_key, function(stats){
								if(stats.code === 200){
									var teams = stats.resp;
									var out = "";
									for(var i = 0; i < teams.length; i++){
										var info = "[" + tools.pad(teams[i].id, 2) + "]";
										info += " " + teams[i].name;
										info += "(" + teams[i].ship.length + ")\n\t";
										if(cache.ships){
											for(var x = 0; x < teams[i].ship.length; x++){
												var id = teams[i].ship[x];
												if(id > 0){
													info += tools.findById(cache.ships, SHIP_REF, id, true) + "\n\t";
												}else{
													info += "Empty\n\t";
												}
											}
										}
										out += "\n" + info;
									}
									callback(out);
								}else{
									console.log(stats);
									callback();
								}
							});
						return;
					}break;
					
					case "shipinfo":{
						// Find ship
						if(command.length < 2){
							return callback("Not enough parameters. Please check in help.");
						}
						if(!cache.ships){
							callback("Ship List not read yet. Please execute 'ships' command to fetch your ships");
							return;
						}
						var ship = null;
						for(var i = 0; i < cache.ships.length;i++){
							if(cache.ships[i].id == parseInt(command[1])){
								ship = cache.ships[i];
								break;
							}
						}
						if(!ship){
							callback("Ship Id not found. Refresh ship list by executing 'ships'.");
							return;
						}
						var ref = SHIP_REF[ship.sortno - 1];
						if(!ref){
							callback("Ship not in database. Maybe its a 改 ship! No information");
							return;
						}
						var out = "\u001b[31;1m[" + tools.pad(ship.id, 3) + "] " + ref.name + " \u001b[0m (Lv." + ship.lv + ")\n";
						out += "Rarity : <\u001b[1;33m" + tools.rarity(ref.rare) + "\u001b[0m>\n";
						out += "Class : " + ref["class"] + " > " + ref["class_id"] + "\n";
						out += "Type : " + ref["type"] + "(" + ref["type_id"] + ")\n";
						out += "HP : " + ship.nowhp + "/" + ship.maxhp + "\n=========================\n";
						out += "Fuel (燃料): " + ship.fuel + "\t\t\t\t";
						out += "Firepower (火力): " + ship.karyoku[0] + "/" + ship.karyoku[1] + "\n";
						out += "Evasion (回避): " + ship.kaihi[0] + "/" + ship.kaihi[1] + "\t\t\t";
						out += "Torpedo (雷装): " + ship.raisou[0] + "/" + ship.raisou[1] + "\n";
						out += "AA (对空): " + ship.taiku[0] + "/" + ship.taiku[1] + "\t\t\t";
						out += "ASW (对潜): " + ship.taisen[0] + "/" + ship.taisen[1] + "\n";
						callback(out);
						return;
					}break;
					
					case "ships":{
						var s = 0;
						if(command.length === 1){
							s = 0;
						}else{
							switch(command[1]){
								case "id": s = 0; break;
								case "level": s = 1; break;
								case "repeat": s = 0; break;
							}
						}
						var hasSeenShip = {};
						api.ships(sesn_key,s, function(stats){
							if(stats.code === 200){
								var ships = stats.resp;
								cache.ships = ships;
								saveCache();
								var out = "";
								for(var i = 0; i < ships.length; i++){
									var ship_type_id = tools.pad(ships[i].sortno, 4);
									if(!hasSeenShip[ship_type_id]){
										hasSeenShip[ship_type_id] = [ships[i]];
									}else{
										hasSeenShip[ship_type_id].push(ships[i]);
									}
									if(command[1] === "repeat") continue;
									var info = tools.shipInfo(ships[i], SHIP_REF);
									if(i % 2 == 0){
										out += info + "\t\t\t";
									}else{
										out += info + "\n";
									}
								}
								if(command[1] === "repeat"){
									for(var x in hasSeenShip){
										if(hasSeenShip[x].length > 1){
											out += "<" + x + ">:\n" 
											for(var i = 0; i < hasSeenShip[x].length; i++){
												out += tools.shipInfo(hasSeenShip[x][i], SHIP_REF) + "; ";
											}
											out += "\n";
										}
									}
								}
								callback(out);
							}else{
								console.log(stats);
								callback();
							}
						});					
						return;
					}break;
					case "mission":{
						if(command.length < 3){
							callback("Not enough parameters!");
							return;
						}
						api.mission(sesn_key, command[1], command[2], function(resp){
							console.log(resp);
							callback();
						});
						return;
					}break;
					
					
					case "help":{
						var helpfile = command[1] ? command[1] : "help";
						helpfile.replace(new RegExp("[/.]","g"),"");
						try{
							callback(fs.readFileSync("docs/" + helpfile));
						}catch(e){
							callback("Help file \"" + helpfile + "\" not found");
						}
						return;
					}break;
				};
				callback(command[0] + " : command not found");
			} else {
				callback("");
			}
		}
	});
});
