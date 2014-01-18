var repl = require("repl");
var api = require("./api");
var sesn_key = "";

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
					callback("[OK] Set user apikey as " + command[1]);
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
			};
			callback(command[0] + " : command not found");
		} else {
			callback("");
		}
	}
});
