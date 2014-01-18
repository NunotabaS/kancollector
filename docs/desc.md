Kancollector - Automatic Player
==============================
Logic:
 - Evaluate resources, Read in current resource amount and caculate a valuation 
   for them according to max stats. The more we have the cheaper it is.
 	v[item] = - ln ((max - item + 1) / (max + 1))
 	
 	rv[items] = (v[item] * count) / s[sum of all (v[item] * amount[item])]
 	
 	
 - Repair-First:
 	Repair Ships under damage, by minimizing cost evaluation function 
 	(e = [repair time in hours] * rv[items used])
 	
 - Next-Resupply:
    Resupply ships by minimizing
 
