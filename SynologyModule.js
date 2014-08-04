var request = require('request');

var SynologyModule = function () {
};

SynologyModule.prototype.init = function(fw, onFinished) {
    this.fw = fw;
	onFinished.call(this);
}

SynologyModule.prototype.onMessage = function (req, callback) {

	if(this.fw.config.SynologyURL === undefined){
		callback({error: "Invalid synology server setup"});
		console.error("Synology: Missing URl (server variable 'SynologyURL')");
		return;
	}

	if(req !== undefined && req.body !== undefined && req.body.type == "ExternalRequest" && req.body.vars !== undefined){
		var vars = "";
		if(req.body.vars !== undefined){
			vars = "?";
			for(key in req.body.vars)
				vars += (vars!="?" ? "&" : "") + key + "=" + req.body.vars[key];
		}

		var baseURL = this.fw.config.SynologyURL;
		var port = !isNaN(req.body.port) ? ":" + req.body.port : "";

		var path = typeof(req.body.path) === "string" ? req.body.path : "/";
		var url = baseURL + port + path + vars;

		request({url: url, "rejectUnauthorized": false}, function(err, resp, body){
			if(resp === undefined)
				callback({success: false, error: "Unknown error"});
			else if(resp.statusCode != 200)
				callback({success: false, error: resp.statusCode});
			else
				callback(body);
		});
	}
}
 
module.exports = SynologyModule;