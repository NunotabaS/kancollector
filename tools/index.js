var pad = function(num, len, padchar){
	num = "" + num;
	if(!padchar)
		padchar = "0";
	while(num.length < len){
		num = padchar + num;
	}
	return num;
}
exports.pad = pad;
exports.pretty_time = function(time){
	if(time < 0)
		time = 0;
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
	for(var j = 0; j < 7 - stars; j++){
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
		case 2: return "\u001b[1;37m" + shipname + "\u001b[0m" + ext; break; // (Small Damage
		case 1: return "\u001b[1;33m" + shipname + "\u001b[0m" + ext; break; //(Med damage
		case 0: return "\u001b[1;31m" + shipname + "\u001b[0m" + ext; break; //(Large Damage
	}
}

exports.colorName = colorName;

exports.shipInfo = function(ship, SHIP_REF){
	if(/改/.test(ship.name) && !SHIP_REF[ship.sortno - 1]){
		var nameBefore = ship.name.replace(/改$/,"");
		var rarity = 0;
		for(var i = 0; i < SHIP_REF.length; i++){
			if(SHIP_REF[i] && SHIP_REF[i]["name"] === nameBefore){
				rarity = SHIP_REF[i].rare + 1; 
			}
		}
		SHIP_REF[ship.sortno - 1] = {
			"name":ship.name,
			"rare":rarity
		};
	}
	var info = "[" + 
		exports.pad(ship.id, 4) + "] <\u001b[1;33m" + 
			exports.rarity((SHIP_REF[ship.sortno - 1] ? SHIP_REF[ship.sortno - 1]["rare"] : 0))
		+ "\u001b[0m> Lv." + 
		exports.pad(ship.lv, 2);
	if(ship.name){
		info += " " + colorName(ship,ship.name) + (ship.name.length > 3  ? "" : " ");
	}else{
		info += " " + colorName(ship,ship.sortno);
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
				if(sid.name){
					nm = sid.name;
				}else{
					if(ref[sid.sortno -1]){
						nm = ref[sid.sortno -1]["name"];
					}else{
						if(ref[sid.sortno - 277]){
							nm = ref[sid.sortno - 277]["name"] + "改";
						}else{
							nm = sid.sortno;
						}
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
