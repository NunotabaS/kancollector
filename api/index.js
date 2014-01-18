var http = require("http");
var config = require("./config.js");
var expedition = require("./expedition.js");

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
			if(/^svdata=/.test(ret)){
				try{
					parsed = JSON.parse(ret.replace(/^svdata=/,""));
				}catch(e){}
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
	var req = exports.create(key);
	exports.api("get_member/basic",req, function(resp){
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

exports.join = function(obja, objb){
	for(var x in objb){
		obja[x] = objb[x];
	}
	return obja;
};
