// Formulate a decision greedily. Maximizing valuation

exports.decide = function(operations){
	var best = null; var bestScore = 0;
	for(var op in operations){
		var operation = operations[op];
		var score = (operation.gain / operation.cost) * operation.risk;
		if(score >= bestScore){
			bestScore = score;
			best = operation;
		}
	}
	
	return best;
};
