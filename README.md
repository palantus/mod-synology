mod-synology
============

Server and client code for browsing a Synology NAS

## Installation ##

Checkout the server code first:

	https://github.com/palantus/serverplatform.git

Then checkout this module in another folder:

	https://github.com/palantus/mod-synology.git


## Configuration ##
Create a config.json file in either the folder with serverplatform or the one above it.

Paste something like this in it:

	{
		"port" : 3000,
		"www": "../www",
		"modules": "../modules",

		"enableSSL" : true,
		"SSLPort" : 3001,
		"SSLKey" : "/home/ahk/certificates/selfsigned/server.key",
		"SSLCert" : "/home/ahk/certificates/selfsigned/server.crt",
		"SSLCa" : "/home/ahk/certificates/selfsigned/ca.crt",
		"AutoSSLRedirection" : false,

		"    SYNOLOGY MODULE    ":"",
		"SynologyURL" : "https://YOURSERVER"
	}

The SSL section can be skipped if you haven't got a certificate. If your Synology NAS hasn't got SSL setup, just remove the 's' in 'https' from SynologyURL.

## Resulting folder structure ##

	-- Root
		-- serverplatform
		-- modules
			-- synology
		-- config.json

## Running it ##
Go to serverplatform and run:
	node server.js

Open the following URL in your browser:

	http://localhost:3000/synology

## Status ##
Browsing images is working fine, but videos aren't centered correctly. I still haven't added support for downloading files, but the code for the download URL is already written.

Images are opened in full screen when clicked and you can click on the page to go to prev/next or close fullscreen view. Zooming is unfortunatly not implemented yet.

## Screenshots ##
Listing root folders in list view:

![](https://github.com/palantus/mod-synology/blob/master/screens/folderlist.png)

Listing folders in thumb view:

![](https://github.com/palantus/mod-synology/blob/master/screens/folderlist_thumb.png)

Listing content of a folder with images in thumb view:

![](https://github.com/palantus/mod-synology/blob/master/screens/imagelist_thumb.png)