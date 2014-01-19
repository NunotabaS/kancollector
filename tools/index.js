var pad = function(num, len){
	num = "" + num;
	while(num.length < len){
		num = "0" + num;
	}
	return num;
}
exports.pad = pad;
exports.pretty_time = function(time){
	var seconds = Math.floor(time / 1000);
	var minutes = Math.floor(seconds / 60);
	var hours = Math.floor(minutes / 60);
	seconds -= minutes * 60;
	minutes -= hours * 60;
	return pad(hours,2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2);
};

exports.ship_db = require("./shipdb.js");

exports.rarity = function(stars){
	if(typeof stars !== 'number' || isNaN(stars)){
		return "      ";
	}
	var out = "";
	for(var i = 0; i < stars; i++){
		out+="*";
	}
	for(var j = 0; j < 6 - stars; j++){
		out+= " ";
	}
	return out;
}

var colorName = function(ship, shipname, display_info){
	var health = 3;
	if(ship.nowhp / ship.maxhp > 0.75){
		health = 3;
	}else if(ship.nowhp / ship.maxhp > 0.5){
		health = 2;
	}else if(ship.nowhp / ship.maxhp > 0.2){
		health = 1;
	}else{
		health = 0;
	}
	var ext = "";
	if(display_info){
		if(health == 2){
			ext = "(小破)";
		}else if(health == 1){
			ext = "(中破)";
		}else if(health == 0){
			ext = "(大破)";
		}
	}
	switch(health){
		case 3: return "\u001b[1;32m" + shipname + "\u001b[0m" + ext; break; //(Normal)
		case 2: return shipname + ext; break; // (Small Damage
		case 1: return "\u001b[1;33m" + shipname + "\u001b[0m" + ext; break; //(Med damage
		case 0: return "\u001b[1;31m" + shipname + "\u001b[0m" + ext; break; //(Large Damage
	}
}

exports.colorName = colorName;

exports.shipInfo = function(ship, SHIP_REF){
	var info = "[" + 
		exports.pad(ship.id, 3) + "] <\u001b[1;33m" + 
			exports.rarity((SHIP_REF[ship.sortno - 1] ? SHIP_REF[ship.sortno - 1]["rare"] : 0))
		+ "\u001b[0m> Lv." + 
		exports.pad(ship.lv, 2);
	
	if(ship.sortno < 170){
		info += " " + colorName(ship,SHIP_REF[ship.sortno - 1]["name"]) + " ";
	}else{
		try{
			info += " " + colorName(ship,SHIP_REF[ship.sortno - 277]["name"] + "改");
		}catch(e){
			info += " " + colorName(ship,ship.sortno);
		}
	}
	return info;
};

exports.hasShip = function(ships, id){
	if(!ships)
		return true;
	for(var i = 0; i < ships.length; i++){
		if(ships[i].id === id){
			return true;
		}
	};
	return false;
};

exports.findById = function(shipdb, ref, id, lv){
	if(shipdb){
		for(var x in shipdb){
			if(shipdb[x].id === id){
				var sid = shipdb[x];
				var hp = sid.nowhp + "/" + sid.maxhp;
				var nm = "";
				if(ref[sid.sortno -1]){
					nm = ref[sid.sortno -1]["name"];
				}else{
					if(ref[sid.sortno - 277]){
						nm = ref[sid.sortno - 277]["name"] + "改";
					}else{
						nm = sid.sortno;
					}
				}
				return (lv ? "Lv." + exports.pad(sid.lv,2) + " " : "") + 
					colorName(sid,nm) + 
					(lv ? " (" + hp + ")" : "");
			}
		}
		return id;
	}
	return id;
}
