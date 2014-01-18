exports.expedition = function(deckid, missionid, api_object){
	api_object["api_deck_id"] = deckid;
	api_object["api_mission_id"] = missionid;
	return api_object;
};

// Good expeditions to use if you need resources
exports.canned = {
	"oil":[5],
	"steel":[5],
};
