// Multi-Armed Bandit - Play Each field and try to get good results

exports.bandit = function(valuation, slots){	
	var scores = {};
	for(var i = 0; i < slots.length; i++){
		scores[slots[i].id] = 0;
	}
	
	this.evaluate = function(slot, result){
		scores[slot] += valuation(result);
	};
	
	this.next = function(){
		if(Math.random() > 0.9){
			// Exploration
			
		}else{
			// Exploitation, ho.
			
		}
	};
	
	this.serialize = function(){
		return scores;
	};
};
