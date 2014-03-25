var listeners = {

};

exports.addEventListener = function(e, f){
	if(!listeners[e]){
		listeners[e] = [];
	}
	listeners[e].push(f);
};

exports.dispatchEvent = function(e, data){
	if(listeners[e]){
		for(var i = 0; i < listeners[e].length; i++){
			listeners[e][i](data);
		}
	}else if(e !== "__unhandled"){
		exports.dispatchEvent("__unhandled",{
			event:e,
			data:data
		});
		return;
	}
};
