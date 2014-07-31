var request = require('request');

var SynologyModule = function () {
};

SynologyModule.prototype.init = function(fw, onFinished) {
    this.fw = fw;
	onFinished.call(this);
}

SynologyModule.prototype.onMessage = function (req, callback) {

	if(req !== undefined && req.body !== undefined && req.body.type == "ExternalRequest" && req.body.vars !== undefined){
		//console.log("Incoming request for api " + req.body.api);
		var vars = "";
		if(req.body.vars !== undefined){
			vars = "?";
			for(key in req.body.vars)
				vars += (vars!="?" ? "&" : "") + key + "=" + req.body.vars[key];
		}

		var baseURL = req.body.isHome ? "http://nas.ahkpro.dk" : "http://ahkpro.dk";
		var port = !isNaN(req.body.port) ? ":" + req.body.port : "";

		var path = typeof(req.body.path) === "string" ? req.body.path : "/";
		var url = baseURL + port + path + vars;

		//console.log(req.body.vars);
		//console.log(url);

		request(url, function(err, resp, body){

			//console.log("Response from external site with statusCode " + resp.statusCode);

			if(resp === undefined)
				callback({success: false, error: "Unknown error"});
			else if(resp.statusCode != 200)
				callback({success: false, error: resp.statusCode});
			else
				callback(body);
		});
	}
};
 
module.exports = SynologyModule;