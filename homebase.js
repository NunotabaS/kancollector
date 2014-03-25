var tools = require("./tools");
tools.ship_db.ships("db");

exports.bind = function(event, api){
	/*** RESOURCES **********/
	event.addEventListener("cmd_resources", function(v){
		api.resources(v.db.key, function(stats){
			if(stats.code === 200){
				var r = "Resources : \n===========================\n";
				r+= "Fuel    : " + tools.pad(stats.resp.fuel,6," ") + "\t\t\t";
				r+= "Steel   : " + tools.pad(stats.resp.steel,6," ") + "\n";
				r+= "Ammo    : " + tools.pad(stats.resp.ammo,6," ") + "\t\t\t";
				r+= "Bauxite : " + tools.pad(stats.resp.bauxite,6," ") + "\n";
				r+="\n";
				r+= "DevMat  : " + tools.pad(stats.resp.devmat,6," ") + "\n";
				r+= "QuickCon: " + tools.pad(stats.resp.quickconstruct,6," ") + "\n";
				r+= "Buckets : " + tools.pad(stats.resp.buckets,6," ") + "\n";
				v.callback(r); 
			}else{
				console.log(stats);
				v.callback();
			}
		});
		return;
	});
	/*** DOCKS ************/
	var docks = function(v){
		var command = v.command;
		if(command.length === 1){
			api.stats_dock(v.db.key, function(stats){
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
							tools.findById(v.db.ships, tools.ship_db.ships("db"), 
								docks[i].ship, true) + 
								" Remaining: " + tools.pretty_time(docks[i].remaining);
						}
						console.log(info);
					}
					v.callback();
				}else{
					console.log(stats);
					v.callback();
				}
			});
		} else {
			var dockid = parseInt(command[1]);
			var shipid = parseInt(command[2]);
			var highspeed = command[3] ? (command[3] === "true") : false;
			if(shipid && tools.hasShip(v.db.ships, shipid)){
				api.dock(v.db.key, dockid, shipid, highspeed, function(resp){
					console.log(resp);
					v.callback();
				});
			}else{
				v.callback("docks [dockid] [shipid] [highspeed=false]\n\tDock a ship to a dock");
				return;
			}
		}
		return;
	};
	event.addEventListener("cmd_docks", docks);
	event.addEventListener("cmd_dock", docks);
	
	/*** AUTODOCKING ********/
	var autodock = function(v){
		
	};
	
	/*** SHIPS **************/
	var ships = function(v){
		var s = 0;
		var command = v.command;
		var SHIP_REF = tools.ship_db.ships("db");
		if(command.length === 1){
			s = 0;
		}else{
			switch(command[1]){
				case "id": s = 0; break;
				case "level": s = 1; break;
				case "type": s = 2;break;
				case "new": s = 3;break;
				case "hp": s = 4;break;
				case "repeat": s = 0; break;
			}
		}
		var hasSeenShip = {};
		api.ships(v.db.key,s, function(stats){
			if(stats.code === 200){
				var ships = stats.resp;
				// Only save if we're fetching completedb
				if(s === 0){
					v.db.ships = ships;
					event.dispatchEvent("saveCache",{db:v.db});
				}
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
						if(!ships[i].name || !ships[i].name.length){
							ships[i].name = tools.findById(SHIP_REF,ships[i], ships[i].sortno - 1);
						}
						out += info + (ships[i].name.length> 4 ? "\t\t" : "\t\t\t");
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
				v.callback(out);
			}else{
				console.log(stats);
				v.callback();
			}
		});					
		return;
	};
	event.addEventListener("cmd_ships", ships);
	event.addEventListener("cmd_ship", ships);
	
	/*** TEAMS **************/
	var teams = function(v){
		api.teams(v.db.key, function(stats){
			var SHIP_REF = tools.ship_db.ships("db");
			if(stats.code === 200){
				var teams = stats.resp;
				v.db.teams = teams;
				event.dispatchEvent("saveCache",{db:v.db});
				var out = "";
				for(var i = 0; i < teams.length; i++){
					var info = "[" + tools.pad(teams[i].id, 2) + "]";
					info += " " + teams[i].name;
					info += "(" + teams[i].ship.length + ")\n\t";
					if(v.db.ships){
						for(var x = 0; x < teams[i].ship.length; x++){
							var id = teams[i].ship[x];
							if(id > 0){
								info += tools.findById(v.db.ships, SHIP_REF, id, true) + 
									" [" + tools.pad(id,3) + "]\n\t";
							}else{
								info += "Empty\n\t";
							}
						}
					}
					out += "\n" + info;
				}
				v.callback(out);
			}else{
				console.log(stats);
				v.callback();
			}
		});
		return;
	}
	event.addEventListener("cmd_teams", teams);
	event.addEventListener("cmd_fleets", teams);
	
	var supply = function(v){
		var command = v.command;
		if(command.length < 4){
			v.callback("Not enough parameters!\n resupply [ship|team] [oil|ammo|all] {id}");
			return;
		}
		var idMap = {
			"oil": 1,
			"ammo": 2,
			"all": 3,
		}
		switch(command[1]){
			case "ship":{
				api.charge(v.db.key, (!idMap[command[3]] ? 3 : idMap[command[3]]), 
					[parseInt(command[2])], function(resp){
			
					if(resp.code === 200){
						callback("Success.");
					}else{
						console.log(resp);
						callback("Fail.");
					}
					return;
				});
				return;
			}break;
			case "fleet":{
				// Get the ships of that fleet first
				if(!v.db.teams){
					v.callback("You can only resupply a fleet after reading fleet info.");
					return;
				}
				var team = null;
				for(var i = 0; i < v.db.teams.length; i++){
					if(v.db.teams[i].id === parseInt(command[2])){
						team = v.db.teams[i];
					}
				}
		
				if(!team){
					v.callback("Team '" + command[2] + "' not found");
					return;
				}
				var ships =[];
				for(var i = 0; i < team.ship.length; i++){
					if(team.ship[i] !== -1){
						ships.push(team.ship[i]);
					}
				}
				api.charge(v.db.key, (!idMap[command[3]] ? 3 : idMap[command[3]]), 
					ships, function(resp){
					if(resp.code === 200){
						v.callback("Success.");
					}else{
						console.log(resp);
						v.callback("Failed. Please check that you have sufficient resources.");
					}
					return;
				});
				return;
			}break;
		}
		v.callback();
		return;
	};
	event.addEventListener("cmd_resupply", supply);
	/*** EXPEDITIONS **********/
	var expedition = function(v){
		var command = v.command;
		var check = function(){
			if(!v.db.missions || v.db.missions.length === 0){
				v.callback("None.");
				return;
			}else{
				var out = "";
				for(var i = 0; i < v.db.missions.length; i++){
					var hasResched = v.db.missions_resched ? v.db.missions_resched.indexOf(v.db.missions[i].mission_id) : -1;
					out += "Mission " + tools.pad(v.db.missions[i].mission_id, 2) + 
						" | Fleet : " + tools.pad(v.db.missions[i].fleet,2) + 
						"   Time Remaining: [" + 
						tools.pretty_time(v.db.missions[i].end - (new Date()).getTime());
					out += "]" + (hasResched > -1 ? "\u001b[1;33m[R]\u001b[0m" : "[1]") + "\n";
				}
				v.callback(out);
				return;
			}
		};
		if(command[1] !== "cached"){
			api.teams(v.db.key, function(stats){
				if(stats.code === 200){
					var teams = stats.resp;
					v.db.teams = teams;
					var missions = [];
					for(var i = 0; i < v.db.teams.length; i++){
						var team = v.db.teams[i];
						if(team.mission[0] !== 0 && team.mission[1] !== 0){
							missions.push({
								"fleet": team.id,
								"mission_id": team.mission[1],
								"end": team.mission[2],
							});
						}
					}
					v.db.missions = missions;
					event.dispatchEvent("saveCache", {db:v.db});
					check();
				}
			});
		}else{
			check();
		}
		return;
	};
	event.addEventListener("cmd_missions", expedition);
	event.addEventListener("cmd_expeditions", expedition);
};
