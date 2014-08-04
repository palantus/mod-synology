function SynologyBrowser(_element){
	this.loginSettings = {username: "", password: ""};
	this.loggedInToNAS = false;
	this.loggingIn = false;
	this.sid = "";
	this.folderHistory = [];
	this.curPath = "";
	this.imageExtensions = ["jpg", "jpeg", "png", "gif", "tif"];
	this.videoExtensions = ["mp4", "avi", "mpg", "mpeg", "mkv", "m4v", "mov"];
	this.element = _element;
	this.thumbView = false;
	this.currentImages = [];
	this.isNested = false;
}

SynologyBrowser.prototype.run = function(){
	var t = this;

	var backButton = $('<img class="synologybackbutton synologybutton synologydisabled" src="/img/back.png" title="Back"></img>')
	var setupButton = $('<img class="synologysetupbutton synologybutton" src="/img/setup.png" title="Setup"></img>');
	var listViewButton = $('<img class="synologylistbutton synologybutton synologydisabled" src="/img/list2.png" title="List view"></img>');
	var thumbViewButton = $('<img class="synologythumbbutton synologybutton" src="/img/thumbnail.png" title="Thumbnail view"></img>');
	var folders = $('<div class="folders"></div>');

	t.element.append(backButton);
	t.element.append(setupButton);
	t.element.append(listViewButton);
	t.element.append(thumbViewButton);
	t.element.append(folders);

	t.sid = $.cookie("sid");

	if(t.sid)
		t.getFolders("");

	backButton.click(function(){
		$(this).addClass("backdisabled");
		t.element.find(".contentview").empty();
		var gotoPath = t.folderHistory[t.folderHistory.length-2];
		t.folderHistory.pop();
		t.folderHistory.pop();
		t.getFolders(gotoPath);
	});

	thumbViewButton.click(function(){
		t.thumbView = true;;
		t.element.find(".synologythumbbutton").addClass("synologydisabled");
		t.element.find(".synologylistbutton").removeClass("synologydisabled");
		t.listFolders();
	});

	listViewButton.click(function(){
		t.thumbView = false;
		t.element.find(".synologylistbutton").addClass("synologydisabled");
		t.element.find(".synologythumbbutton").removeClass("synologydisabled");
		t.listFolders();
	});

	setupButton.click(function(){
		var popupCreator = new PopupCreator();
		popupCreator.init({
			title: "Synology Setup",
			style: {width: "300px", height: "300px"},
			content: "\
							<div id='logoutcontrols' style='display:none'>\
								<button>Log out</button>\
							</div>\
							<table id='logincontrols' style='display:none'>\
								<tr><td>Username:</td><td><input type='text' id='loginusername'></input></td></tr>\
								<tr><td>Password:</td><td><input type='password' id='loginpassword'></input></td></tr>\
								<tr><td></td><td><button style='height: 40px; width: 100px'>Login</button></td></tr>\
							</table>",

	 		onShow: function(){
 				var form = this;

				var setLoggedIn = function(loggedIn){
 					if(loggedIn){
 						form.element.find("#logincontrols").hide();
 						form.element.find("#logoutcontrols").show();
 					}
 					else {
 						var username = $.cookie("synologyusername");
 						form.element.find("#logincontrols").show();
 						form.element.find("#logoutcontrols").hide();
 						if(username){
	 						form.element.find("#loginusername").val(username);
							form.element.find("#loginpassword").focus();
						} else {
							form.element.find("#loginusername").focus();
						}
 					}
				}

				form.element.find("#logoutcontrols button").click(function(){
					t.sid = "";
					t.loggedInToNAS = false;
					setLoggedIn(false);
					t.element.find(".folders").empty();
				});

				form.element.find("#logincontrols button").click(function(){
					var username = form.element.find("#loginusername").val();
					var password = form.element.find("#loginpassword").val();
					t.loginSettings = {username: username, password: password};
					t.login(function(success){
						if(success){
							t.log("Logged in!");
							setLoggedIn(true);
							$.cookie("synologyusername", username);
							t.getFolders("");
						}
					});
				});

				form.element.find("#logincontrols input").keydown(function(e){
					if(e.keyCode == 13){
						form.element.find("#logincontrols button").click();
					}
				});

	 			setLoggedIn(t.loggedInToNAS);
	 		}
		});
		popupCreator.show();
	});
}


SynologyBrowser.prototype.log = function(text){
	//var text = $("<p></p>", {html: text});
	//$(".output").prepend(text);
	console.log(text);
	//$("body").prepend(text);
	//$.post('/cb', {type: "log", text: text}, function(){});
}

SynologyBrowser.prototype.login = function(callback){
	if(this.loginSettings === undefined || !this.loginSettings.username || !this.loginSettings.password){
		callback(false);
		return;
	}

	if(this.loggingIn === true){
		if(typeof(callback) === "function")
			callback();
		return;
	}
	var t = this;
	
	var req = { api: "auth.cgi",
				vars: {api: "SYNO.API.Auth", version: 2, method: "login", account: this.loginSettings.username, passwd: this.loginSettings.password,  session: "DownloadStation", format:"sid"}};

	this.loggingIn = true;
	this.sendRequest(req, function(data){
		if(data.success === false || data.error !== undefined){
			t.loggingIn = false;
			alert("Wrong username or password. Try again.");
			callback(false);
		} else {
			t.sid = data.data.sid;
			$.cookie("sid", t.sid, { expires: 10, path: '/' })
			t.loggedInToNAS = true;
			t.loggingIn = false;
			if(typeof(callback) === "function")
				callback(true);
		}
	});
}

SynologyBrowser.prototype.sendRequest = function(req, callback){
	var t = this;
	/*
	if(this.loggedInToNAS !== true && req.vars.method != "login"){
		if(loggingIn){
			setTimeout(function(){
				t.sendRequest(req, callback);
			}, 100);
		} else {
			login(function(){
				t.sendRequest(req, callback);
			});
		}
		return;
	}
	*/

	if(req.type === undefined)
		req.type = "ExternalRequest";
	if(req.method === undefined)
		req.method = "GET";
	if(req.vars._sid === undefined && this.sid != "" && this.sid !== undefined)
		req.vars._sid = this.sid;


	req.path = "/webapi/" + req.api;
	req.module = "synology";

	request(req, function(data){
		var response = JSON.parse(data);
		if(response.error !== undefined && response.error.code == 105)
			alert("Your session has timed out or you do not have access to the resource.");
		console.log(response);
		callback(response);
	}, function(e) {
		prompt( "ERROR - please report: ", e.message || e.error);
	});
}

SynologyBrowser.prototype.getShares = function(callback){
	var t = this;
	var req = { api: "FileStation/file_share.cgi", vars: {api: "SYNO.FileStation.List", version: 1, method: "list_share", additional: ""}};
	
	this.sendRequest(req, function(reply){
		if(reply.success === false){
			console.log("Error when refreshing: ", reply);
			callback({error: "error"});
		} else {
			t.loggedInToNAS = true;
			callback(reply);
		}
	});
}

SynologyBrowser.prototype.getFolders = function(path){
	var t = this;
	this.curPath = path;
	this.folderHistory.push(path);
	
	if(this.curPath == ""){
		this.getShares(function(res){
			t.listFolders(res);
		});
	} else {

		this.getFolderContent(this.curPath, function(res){
			t.listFolders(res);
		});
	}
}

SynologyBrowser.prototype.listFolders = function(res){
	var t = this;

	if(res === undefined){
		if(t.resLast !== undefined)
			res = t.resLast;

		if(res === undefined)
			return;
	}
	t.resLast = res;

	this.element.find(".folders").empty();
/*
	if(this.thumbView)
		this.element.find(".folders").addClass("thumbview");
	else
		this.element.find(".folders").removeClass("thumbview");
*/
	if(this.curPath == "")
		this.element.find(".synologybackbutton").addClass("synologydisabled");
	else
		this.element.find(".synologybackbutton").removeClass("synologydisabled");

	this.currentImages = [];

	if(res.success === true){
		var folers = res.data.shares !== undefined ? res.data.shares : res.data.files;

		folers = folers.sort(function(a, b){return (a.isdir && !b.isdir) ? -1 : (!a.isdir && b.isdir) ? 1 : a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;});

		for(i in folers){
			var btn = $("<div/>");

			var isImage = folers[i].additional !== undefined && typeof(folers[i].additional.type) === "string"
								&& t.imageExtensions.indexOf(folers[i].additional.type.toLowerCase()) >= 0;
			var isVideo = folers[i].additional !== undefined && typeof(folers[i].additional.type) === "string"
								&& t.videoExtensions.indexOf(folers[i].additional.type.toLowerCase()) >= 0;

			if(isImage)
				t.currentImages.push({title: folers[i].name, src: t.getLinkToFileThumbnail(folers[i].path, "large")});

			if(t.thumbView){
				btn.addClass("thumbview");
				if(isImage || isVideo){
					var link = t.getLinkToFileThumbnail(folers[i].path, "medium");
					//btn.css({"background-image": "url('" + link + "')"});
					btn.css({"background-image": "url('/img/loading2.gif')"});
					btn.addClass("thumb");
					btn.data("imgurl", link);
				}
				else if(folers[i].isdir){
					btn.css({"background-image": "url('/img/folder.png')"});
					btn.append($("<p/>", {html: folers[i].name}));
				} else {
					btn.css({"background-image": "url('/img/help2.png')"});
					btn.append($("<p/>", {html: folers[i].name}));
				}
			} else {
				btn.addClass("listview");
				if(folers[i].isdir)
					btn.append($("<img/>", {class: "listmodethumb", src: "/img/folder.png"}));
				else
					btn.append($("<img/>", {class: "listmodethumb", src: "/img/document.png"}));

				btn.append($("<p/>", {html: folers[i].name}));
			}

			btn.data("path", folers[i])

			btn.click(function(e){
				

				t.element.find(".contentview").empty();

				var f = $(this).data("path");
				if(f.isdir){
					t.getFolders(f.path);
				} else {
					t.showContent(f);
				}
			})

			this.element.find(".folders").append(btn);
		}

		if(folers.length <= 0)
			this.element.find(".folders").append("<p>The folder is empty...</p>", {class: "synemptyfolder"});	

		this.loadImagesInBackground();
	}
}

SynologyBrowser.prototype.loadImagesInBackground = function(folderPath, callback){
	/* Load images in the background */
	var imageLoaded = function() {
		var thumb = $(this).data("thumb");
		thumb.removeClass("imgloading");
    	thumb.css({"background-image": "url('" + this.src + "')"});
    }
    this.element.find(".folders div.thumb").each(function() {
        var tmpImg = new Image() ;
        tmpImg.onload = imageLoaded ;
        tmpImg.src = $(this).data("imgurl");
        $(tmpImg).data("thumb", $(this));
        $(this).addClass("imgloading");
    }) ;
}

SynologyBrowser.prototype.getFolderContent = function(folderPath, callback){
	var t = this;
	var req = { api: "FileStation/file_share.cgi", vars: {api: "SYNO.FileStation.List", version: 1, method: "list", additional: "type", folder_path: folderPath}};
	
	this.sendRequest(req, function(reply){
		if(reply.success === false){
			console.log("Error when refreshing: ", reply);
			callback({error: "error"});
		} else {
			t.loggedInToNAS = true;
			callback(reply);
		}
	});
}

SynologyBrowser.prototype.showContent = function(file){
	var content = $("<div/>", {class: "synologycontentview"});
	var link = "";

	if(this.imageExtensions.indexOf(file.additional.type.toLowerCase()) >= 0){
		link = this.getLinkToFileThumbnail(file.path, "large");

		if(this.isNested){
			content.css({"background-image": "url('" + link + "')"});
		} else {
			var idx = 0;
			for(i in this.currentImages)
				if(this.currentImages[i].src == link)
					idx = i;

			var viewer = new ImageViewer();
			viewer.init(this.currentImages);
			viewer.show(idx);
			return;
		}

	} else if(this.videoExtensions.indexOf(file.additional.type.toLowerCase()) >= 0){
		var vid = $("<video/>", {width: "700px", height: "400px", controls: ""});
		var src = $("<source/>", {src: this.getLinkToFile(file.path)});
		vid.append(src);
		content.append(vid);
	} else {
		alert("Unknown file");
		return;
	}
	
	var popupCreator = new PopupCreator();
	popupCreator.init({
		title: file.name,
		style: {width: "800px", height: "500px"},
		content: content
	});
	popupCreator.show();
}

SynologyBrowser.prototype.getLinkToFile = function(filePath){
	var url = "https://nas.ahkpro.dk/webapi/FileStation/file_download.cgi?api=SYNO.FileStation.Download&version=1&method=download&path=" + filePath + "&mode=open&_sid=" + this.sid;
	return url;
}

SynologyBrowser.prototype.getLinkToFileThumbnail = function(filePath, size){
	var url = "https://nas.ahkpro.dk/webapi/FileStation/file_thumb.cgi?api=SYNO.FileStation.Thumb&version=1&method=get&path=" + filePath + "&_sid=" + this.sid + (size !== undefined ? "&size=" + size : "");
	return url;
}