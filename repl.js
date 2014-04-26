var repl = require("repl"), fs = require("fs");
var api = require("./api"), tools = require("./tools");
var event = require("./event.js");
//Bind
require("./homebase.js").bind(event, api);

function saveCache(cache, cb){
	fs.writeFile("cachefile", JSON.stringify(cache), {flag:"w"}, function(){
		if(cb)
			cb();
	});
};

event.addEventListener("load", function(data){
	if(data.key){
		console.log("APIKEY = " +  data.key);
	}
	event.dispatchEvent("autorefresh", data);
	if(process.argv[2] === "--no-repl"){
		return;
	}
	var consts = {
		db:data
	};
	api.load(consts.db.portcache ? consts.db.portcache : {});
	repl.start({
		prompt: "> ",
		eval: function(cmd, context, filename, callback) {
			if (cmd !== "(\n)") {
				cmd = cmd.slice(1, -2); // rm parens and newline added by repl
				var command = cmd.trim().split(" ");
				if(command[0] === "exit"){
					process.exit();
				}
				event.dispatchEvent("cmd_" + command[0], {
					command: command,
					callback: callback,
					db: consts.db
				});
			}
		}
	});
});

event.addEventListener("autorefresh", function(v){
	// This will bind all the timers
	var db = v;
	if(!db){
		console.log("No Data. Cannot Bind Events");
		return;
	}
	var checkMissions = setInterval(function(){
		if(!db || !db.missions){
			event.dispatchEvent("cmd_missions", {
				command:["missions","--silent"],
				callback:function(){},
				db:v
			});
			return;
		}
		for(var i = 0; i < db.missions.length; i++){
			var mission = db.missions[i];
			if(mission.end <= ((new Date()).getTime() + 30000)){
				event.dispatchEvent("missionEnd", mission);
				db.missions.splice(i, 1);
			}
		}
	}, 5000);
	var fixShips = setInterval(function(){
		
	}, 60000);
});

event.addEventListener("saveCache", function(v){
	saveCache(v.db);
});

event.addEventListener("cmd_key",function(v){
	var nkey = v.command[1];
	if(nkey && nkey !== ""){
		v.db.key = nkey;
		saveCache(v.db, function(){
			v.callback("[OK] Set user apikey as " + nkey);
		});
		return;
	}
});

event.addEventListener("cmd_set",function(v){
	var nkey = v.command[1];
	var nval = v.command[2];
	if(nkey && nkey !== ""){
		v.db[nkey] = nval;
		saveCache(v.db, function(){
			v.callback("[OK] Set '" + nkey + "' as '" + nval + "'");
		});
		return;
	}
});

event.addEventListener("cmd_server",function(v){
	var nsrv = v.command[1];
	if(nsrv && nsrv !== ""){
		v.db.server = nsrv;
		saveCache(v.db, function(){
			v.callback("[OK] Set user server ip as " + nsrv);
		});
		return;
	}
});

event.addEventListener("cmd_api",function(v){
	var req = api.create(v.db.key);
	var command = v.command;
	var entry = command[1] ? command[1] : "auth_member/logincheck";
	var params = null;
	try{
		params = command[2] ? JSON.parse(command[2]) : {};
	}catch(e){
		params = {};
	}
	api.api(entry, api.join(req, params), function(resp){
		console.log(resp);
		v.callback("RAW : " + resp.resp);
	});
	return;
});

event.addEventListener("cmd_port", function(v){
	if(!v.db.portid){
		v.callback("Portid not defined. Cannot proceed");
		return;
	}
	api.port(v.db.key, v.db.portid, function(resp){
		if(resp.code === 200){
			v.db["portcache"] = resp.resp.data;
			saveCache(v.db, function(){
				v.callback("Port cache successfully updated");
			});
			return;
		}else{
			console.log(resp);
			v.callback();
			return;
		}
	});
	return;
});

event.addEventListener("cmd_result", function(v){
	api.result(v.db.key, v.command[1], function(resp){
		if(resp.code === 200){
			console.log(resp.resp);
			v.callback();
			return;
		}else{
			console.log(resp);
			v.callback();
			return;
		}
	});
	return;
});

event.addEventListener("cmd_help", function(v){
	var helpfile = v.command[1] ? v.command[1] : "help";
	helpfile.replace(new RegExp("[/.]","g"),"");
	try{
		v.callback(fs.readFileSync("docs/" + helpfile));
	}catch(e){
		v.callback("Help file \"" + helpfile + "\" not found");
	}
	return;
});

event.addEventListener("__unhandled", function(v){
	if(/^cmd_/.test(v.event)){
		v.data.callback("Command not found");
	}
});

/** READ THE FILE AND SEND THE INIT EVENT **/
fs.readFile("cachefile", function(err, data){
	try{
		var db = JSON.parse(data);
	}catch(e){
		var db = {};
	}
	event.dispatchEvent("load", db);
});
