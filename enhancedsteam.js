// version 2.8

function setValue(key, value) {
	sessionStorage.setItem(key, JSON.stringify(value));
}

function getValue(key) {
	var v = sessionStorage.getItem(key);
	if (v === undefined) return v;
	return JSON.parse(v);
}

var storage = chrome.storage.sync;

// Attempts to extend the expiration of the 'birthtime' cookie
function modify_cookie(diff) {
	var dt = new Date();
	dt.setDate(dt.getDate() + diff);
	var cookies = document.cookie.split('; ');
	for (var i = 0; i < cookies.length; ++i) {
		var pair = cookies[i].split('=');
		switch (pair[0]) {
			case 'birthtime':
				document.cookie = cookies[i] + '; expires=' + dt.toUTCString() + '; path=/';
		}
	}
}
modify_cookie(+30);

function startWith(str, prefix) {
	return str.lastIndexOf(prefix, 0) === 0;
}

function xpath_each(xpath, callback) {
	var res = document.evaluate(xpath, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	var node;
	for (var i = 0; i < res.snapshotLength; ++i) {
		node = res.snapshotItem(i);
		callback(node);
	}
}

function getelem(node, tag, className) {
	var ary = node.getElementsByTagName(tag);
	for (var i = 0, length = ary.length; i < length; i++) {
		var e = ary[i];
		if (e.className == className) return e;
	}
	return null;
}

function get_http(url, callback) {
	var http = new XMLHttpRequest();
	http.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			callback(this.responseText);
		}
	}
	http.open('GET', url, true);
	http.send(null);
}

function get_divContents(selector) {
	var nodeList = document.querySelectorAll(selector);
	for (var i = 0, length = nodeList.length; i < length; i++) {
		return nodeList[i].innerHTML;
	}
}

var owned;

function get_appid(t) {
	if (t && t.match(/^http:\/\/store\.steampowered\.com\/app\/(\d+)\//)) return RegExp.$1;
	else return null;
}

function get_appid_wishlist(t) {
	if (t && t.match(/game_(\d+)/)) return RegExp.$1;
	else return null;
}


function get_groupname(t) {
	if (t && t.match(/^http:\/\/steamcommunity\.com\/groups\/(\S+)/)) return RegExp.$1;
	else return null;
}

// colors the tile for owned daily deal games
function add_info_dd_owned(node, has_app) {
	if (has_app) {
		storage.get(function(settings) {
			var bgcolor = settings.bgcolor;
			
			// Loads default colors if none are defined.
			if (settings.bgcolor === undefined) {
				bgcolor = "#5c7836";
				storage.set({'bgcolor': bgcolor}, function() {
					console.log("set bgcolor to default.");
				});
			}
			
			node.style.backgroundImage = "none";
			node.style.backgroundColor = bgcolor;
		});
		owned = true;
	}
}

// colors the tile for wishlist daily deal games
function add_info_dd_wl(node, wl_app) {
	if (wl_app) {
		storage.get(function(settings) {
			var wlcolor = settings.wlcolor;

			// Loads default colors if none are defined.
			if (wlcolor === undefined) {
				wlcolor = "#496e93";
				storage.set({'wlcolor': wlcolor}, function() {
					console.log("set wlcolor to default.");
				});
			}
			node.style.backgroundImage = "none";
			node.style.backgroundColor = wlcolor;
		});
	}
}

// colors the tile for owned games
function add_info2(node, has_app) {
	if (has_app) {
		storage.get(function(settings) {
			var bgcolor = settings.bgcolor;
			
			// Loads default colors if none are defined.
			if (settings.bgcolor === undefined) {
				bgcolor = "#5c7836";
				storage.set({'bgcolor': bgcolor}, function() {
					console.log("set bgcolor to default.");
				});
			}
			node.style.backgroundColor = bgcolor;
		});
		owned = true;
	}
}

// colors the tile for wishlist games
function add_info3(node, wl_app) {
	if (wl_app) {
		storage.get(function(settings) {
			var wlcolor = settings.wlcolor;

			// Loads default colors if none are defined.
			if (wlcolor === undefined) {
				wlcolor = "#496e93";
				storage.set({'wlcolor': wlcolor}, function() {
					console.log("set wlcolor to default.");
				});
			}
			node.style.backgroundColor = wlcolor;
		});
	}
}

// checks to see if game is already owned
function add_info(node, appid) {

	// loads values from cache to reduce response time
	var v = getValue(appid);	
	if (v) {
		add_info2(node, v[0]);
		return;
	}
	
	var w = getValue(appid+"w");
	if (w) {
		add_info3(node, w[0]);
		return
	}
	
	// sets GET request and returns as text for evaluation
	console.log("get:" + appid);
	get_http('/app/' + appid + '/', function (txt) {
		var has_app = txt.search(/<div class="game_area_already_owned">/) > 0;
		var wl_app = txt.search(/<p>Already on <a href/) > 0;
			
		if (wl_app) {
			setValue(appid+"w", [wl_app]);
			add_info3(node, wl_app);
		}
		
		if (has_app) {
			setValue(appid, [has_app]);
			add_info2(node, has_app);
		}	
	});
}

// checks to see if daily deal game is already owned
function add_info_dd(node, appid) {
	
	// loads values from cache to reduce response time
	var v = getValue(appid);	
	if (v) {
		add_info_dd_owned(node, v[0]);
		return;
	}
	
	var w = getValue(appid+"w");
	if (w) {
		add_info_dd_wl(node, w[0]);
		return
	}
	
	// sets GET request and returns as text for evaluation
	console.log("get dd:" + appid);
	get_http('/app/' + appid + '/', function (txt) {
		var has_app = txt.search(/<div class="game_area_already_owned">/) > 0;
		var wl_app = txt.search(/<p>Already on <a href/) > 0;
		
		if (wl_app) {
			setValue(appid+"w", [wl_app]);
			add_info_dd_wl(node, wl_app);
		}
		
		if (has_app) {
			setValue(appid, [has_app]);
			add_info_dd_owned(node, has_app);
		}	
	});
}

function add_info_wishlist(node, appid) {
	// loads values from cache to reduce response time
	var v = getValue(appid);	
	if (v) {
		add_info2(node, v[0]);
		return;
	}
	
	// sets GET request and returns as text for evaluation
	console.log("get:" + appid);
	get_http('http://store.steampowered.com/app/' + appid + '/', function (txt) {
		var has_app = txt.search(/<div class="game_area_already_owned">/) > 0;
		
		if (has_app) {
			setValue(appid, [has_app]);
			add_info2(node, has_app);
		}	
	});
}

function find_purchase_date(appname) {
	var appdate;
	
	get_http('https://store.steampowered.com/account/', function (txt) {
		console.log(txt.indexOf(appname));
		var apphtml = txt.substring(txt.indexOf('<div class="transactionRowTitle">' + appname), txt.indexOf('<div class="transactionRowTitle">' + appname) - 300);
		appdate = apphtml.substring(apphtml.indexOf('<div class="transactionRowDate">') + 32, 57);
		if (appdate.substring(appdate.length - 1,appdate.length) == ">") { appdate = appdate.substring(0,appdate.length - 1); }
		if (appdate.substring(appdate.length - 1,appdate.length) == "v") { appdate = appdate.substring(0,appdate.length - 1); }
		if (appdate.substring(appdate.length - 1,appdate.length) == "i") { appdate = appdate.substring(0,appdate.length - 1); }
		if (appdate.substring(appdate.length - 1,appdate.length) == "d") { appdate = appdate.substring(0,appdate.length - 1); }
		if (appdate.substring(appdate.length - 1,appdate.length) == "/") { appdate = appdate.substring(0,appdate.length - 1); }
		if (appdate.substring(appdate.length - 1,appdate.length) == "<") { appdate = appdate.substring(0,appdate.length - 1); }
		
		console.log (appdate);

		var found = 0;
		
		xpath_each("//div[contains(@class,'game_area_already_owned')]", function (node) {
			if (found == 0) {
				if (appdate != undefined) {
					if (appdate !== "") {
						node.innerHTML = node.innerHTML + "(Purchased " + appdate + ")";
						found = 1;
					}	
				}
			}	
		});
	});	
}

// on app page
var localurl = document.URL;
if (document.URL.indexOf(document.URL.length - 1, document.URL.length) !== "/") {
	localurl = localurl + "/";
}

var localappid = get_appid(localurl);

// show pricing history
storage.get(function(settings) {
	showlowestprice = settings.showlowestprice;
	
	if (settings.showlowestprice === undefined) {
		showlowestprice = "Yes";
		storage.set({'showlowestprice': showlowestprice}, function() {
			console.log("set showlowestprice to default.");
		});
	}
	
	if (showlowestprice == "Yes") {
		if (localappid !== null) {
			var sgsurl = "http://www.steamgamesales.com/app/" + localappid + "/";
			lowest_price = "<div class='game_purchase_area_friends_want' style='padding-top: 15px; height: 30px; border-top: 1px solid #4d4b49; border-left: 1px solid #4d4b49; border-right: 1px solid #4d4b49;' id='enhancedsteam_lowest_price'><div class='gift_icon' style='margin-top: -9px;'><img src='" + chrome.extension.getURL("line_chart.png") + "'></div><a href='" + sgsurl + "' target='_blank'>Click here to check pricing history</a>";

			var lowestpricetext = document.getElementById('game_area_purchase'); 
			lowestpricetext.insertAdjacentHTML('afterbegin', lowest_price);			
		}
	}
});

//sale or sub
var not_have = 0;
var sub = startWith(location.pathname, '/sub/');
var checked = false;
var price = 0;
var curcomma;
var currencysymbol;
xpath_each("//div[contains(@class,'tab_row') or contains(@class,'sale_page_purchase_item')]", function (node) {
	if (node.checked) return;
	node.checked = checked = true;
	owned = false;
	var itemPrice;
	if (sub) {
		var e = getelem(node, 'div', 'tab_price').lastChild;
				
		if (e.nodeValue.indexOf(",") > 0) {
			var m = e.nodeValue.match(/[0-9]+.[0-9]+./);
			itemPrice = m ? parseFloat(m[0].replace(/[^0-9-.]/g, '')) : 0;
			curcomma = true;
			
			currencysymbol = e.nodeValue.replace(/\s+/g, ' ');
			if (currencysymbol.indexOf(" ") !== 0) { currencysymbol = " " + currencysymbol; }
			
			currencysymbol = currencysymbol.match(/. $/);			
			if (currencysymbol !== null) {
				currencysymbol = currencysymbol[0];
			}	
		}
		
		if (e.nodeValue.indexOf(".") > 0) { 
			var m = e.nodeValue.match(/[0-9\.]+/); 
			itemPrice = m ? parseFloat(m[0]) : 0;
			
			currencysymbol = e.nodeValue.replace(/\s+/g, ' ');
			if (currencysymbol.indexOf(" ") !== 0) { currencysymbol = " " + currencysymbol; }
			
			currencysymbol = currencysymbol.match(/^ ./);
			if (currencysymbol !== null) {
				currencysymbol = currencysymbol[0];
			}	
		}
				
		if (e.nodeValue.indexOf("p") > 0) {
			currencysymbol = "py6. ";
		}
		
	}
	
	var ret = node.getElementsByTagName('a');
	var appid;
	if (appid = get_appid(ret[0].href)) {
		add_info(node, appid);
		if (owned == false) {
			price = price + itemPrice;
		}	
	}

});

// overloads the Number object with a method for formatting money
Number.prototype.formatMoney = function(places, symbol, thousand, decimal) {
	places = !isNaN(places = Math.abs(places)) ? places : 2;
	symbol = symbol !== undefined ? symbol : "$";
	thousand = thousand || ",";
	decimal = decimal || ".";
	var number = this, 
	    negative = number < 0 ? "-" : "",
	    i = parseInt(number = Math.abs(+number || 0).toFixed(places), 10) + "",
	    j = (j = i.length) > 3 ? j % 3 : 0;
	return symbol + negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) + (places ? decimal + Math.abs(number - i).toFixed(places).slice(2) : "");
};

// calculates the savings of a pack or bundle and your savings based on games owned.
if (sub && checked) {

	var bundle_price = get_divContents('.discount_final_price');	
	if (bundle_price === undefined) { bundle_price = get_divContents('.game_purchase_price'); }
	var bundle_price2 = Number(bundle_price.replace(/[^0-9\.]+/g,""));
	price = price - bundle_price2;
	var message;
	
	if (price > 0) {
		message = '<div class="savings">' + price.formatMoney(2,currencysymbol,",",".") + '</div>';
		if (curcomma) {
			price = (price / 100);
			message = '<div class="savings">' + price.formatMoney(2,currencysymbol,",",",") + '</div>';
		}
		
	}
	else {
		message = '<div class="savings"><font color=red>' + price.formatMoney(2,currencysymbol,",",".") + '</font></div>';
		if (curcomma) {
			price = (price / 100);
			message = '<div class="savings"><font color=red>' + price.formatMoney(2,currencysymbol,",",",") + '</font></div>';
		}
	}
	
	xpath_each("//div[@class='package_totals_row']", function (node) {
		$('.savings').replaceWith(message);
	});
}

// DLC on App Page
xpath_each("//a[contains(@class,'game_area_dlc_row')]", function (node) {
	var appid;
	if (appid = get_appid(node.href)) {
		add_info(node, appid);
	}
});

// search result
xpath_each("//a[contains(@class,'search_result_row')]", function (node) {
	var appid;
	if (appid = get_appid(node.href)) {
		add_info(node, appid);
	}
});

// highlights featured homepage items
xpath_each("//a[contains(@class,'small_cap')]", function (node) {
	var appid;
	if (appid = get_appid(node.href)) {
		add_info(node, appid);
	}
});

// hightlight daily deal
xpath_each("//div[contains(@class,'dailydeal')]", function (node) {
		
	var appid;
	
	var dd_start = node.innerHTML.indexOf('<a href="http://store.steampowered.com/app/');
	var dd_end = node.innerHTML.indexOf('<img src=');
	
	var dailydeal;
	
	dailydeal = node.innerHTML.substring(dd_start + 9, dd_end - 8);	
	
	appid = get_appid(dailydeal);
	add_info_dd(node, appid);
	
});

// wishlist owned
xpath_each("//div[contains(@class,'wishlistRow')]", function (node) {
	var appid;
	
	if (appid = get_appid_wishlist(node.id)) {
		add_info_wishlist(node, appid);
	} 
});

var appname;

xpath_each("//div[contains(@class,'apphub_AppName')]", function (app) {
	appname = app.innerHTML;
});
	
// find the date a game was purchased if owned
xpath_each("//div[contains(@class,'game_area_already_owned')]", function (node) {
	if (node.innerHTML.indexOf("You already own") > 0) {
		console.log ("Game = " + appname);
		find_purchase_date(appname);
	}
});

// pull DLC gamedata from enhancedsteam.com
if (document.body.innerHTML.indexOf("<p>Requires the base game <a href=") > 0) { 
	get_http("http://www.enhancedsteam.com/gamedata/gamedata.php?appid=" + localappid + "&appname=" + appname , function (txt) {
		var block = "<div class='block'><div class='block_header'><h4>Downloadable Content Details</h4></div><div class='block_content'><div class='block_content_inner'>" + txt + "</div></div></div>";
	
		var dlc_categories = document.getElementById('demo_block');
		dlc_categories.insertAdjacentHTML('afterend', block);
	});
}

// Adds red warnings for 3rd party DRM
storage.get(function(settings) {
	showdrm = settings.showdrm;
	
	if (settings.showdrm === undefined) {
		showdrm = "Yes";
		storage.set({'showdrm': showdrm}, function() {
			console.log("set showdrm to default.");
		});
	}
	
	if (showdrm == "Yes") {
			
		var gfwl;
		var uplay;
		var securom;
		var tages;
		var stardock;
		var rockstar;
		var kalypso;
		var otherdrm;

		// Games for Windows Live detection
		if (document.body.innerHTML.indexOf("Games for Windows LIVE") > 0) { gfwl = true; }
		if (document.body.innerHTML.indexOf("Games for Windows Live") > 0) { gfwl = true; }
		if (document.body.innerHTML.indexOf("Games for Windows - Live") > 0) { gfwl = true; }
		if (document.body.innerHTML.indexOf("Games For Windows - Live") > 0) { gfwl = true; }
		if (document.body.innerHTML.indexOf("Games for Windows - LIVE") > 0) { gfwl = true; }
		if (document.body.innerHTML.indexOf("Games For Windows - LIVE") > 0) { gfwl = true; }
		if (document.body.innerHTML.indexOf("Online play requires log-in to Games For Windows") > 0) { gfwl = true; }
		if (document.body.innerHTML.indexOf("INSTALLATION OF THE GAMES FOR WINDOWS LIVE SOFTWARE") > 0) { gfwl = true; }
		if (document.body.innerHTML.indexOf("Multiplayer play and other LIVE features included at no charge") > 0) { gfwl = true; }
		if (document.body.innerHTML.indexOf("www.gamesforwindows.com/live") > 0) { gfwl = true; }
		if (document.body.innerHTML.indexOf("www.gamesforwindows.com/live") > 0) { gfwl = true; }

		// Ubisoft Uplay detection
		if (document.body.innerHTML.indexOf("Uplay Account") > 0) { uplay = true; }
		if (document.body.innerHTML.indexOf("UPLAY ACCOUNT") > 0) { uplay = true; }
		if (document.body.innerHTML.indexOf("UPlay account") > 0) { uplay = true; }
		if (document.body.innerHTML.indexOf("HIGH SPEED INTERNET CONNECTION AND CREATION OF A UBISOFT ACCOUNT ARE REQUIRED") > 0) { uplay = true; }
		if (document.body.innerHTML.indexOf("HIGH SPEED INTERNET ACCESS AND CREATION OF A UBISOFT ACCOUNT ARE REQUIRED") > 0) { uplay = true; }
		if (document.body.innerHTML.indexOf("CREATION OF A UBISOFT ACCOUNT") > 0) { uplay = true; }

		// Securom detection
		if (document.body.innerHTML.indexOf("SecuROM") > 0) { securom = true; }
		if (document.body.innerHTML.indexOf("SECUROM") > 0) { securom = true; }

		// Tages detection
		if (document.body.innerHTML.indexOf("Tages") > 0) { tages = true; }
		if (document.body.innerHTML.indexOf("Angebote des Tages") > 0) { tages = false; }
		if (document.body.innerHTML.indexOf("TAGES") > 0) { tages = true; }
		if (document.body.innerHTML.indexOf("SOLIDSHIELD") > 0) { tages = true; }		
		if (document.body.innerHTML.indexOf("Solidshield Tages") > 0) { tages = true; }
		if (document.body.innerHTML.indexOf("Tages Solidshield") > 0) { tages = true; }

		// Stardock account detection
		if (document.body.innerHTML.indexOf("Stardock account") > 0) { stardock = true; }

		// Rockstar social club detection
		if (document.body.innerHTML.indexOf("Rockstar Social Club") > 0) { rockstar = true; }
		if (document.body.innerHTML.indexOf("Rockstar Games Social Club") > 0) { rockstar = true; }

		// Kalypso Launcher detection
		if (document.body.innerHTML.indexOf("Requires a Kalypso account") > 0) { kalypso = true; }

		// Detect other DRM
		if (document.body.innerHTML.indexOf("3rd-party DRM") > 0) { otherdrm = true; }
		if (document.body.innerHTML.indexOf("No 3rd Party DRM") > 0) { otherdrm = false; }

		if (gfwl) {
			var drm = document.getElementById('game_area_purchase'); 
			drm.insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM (Games for Windows Live)</div>');
			otherdrm = false;
		}

		if (uplay) {
			var drm = document.getElementById('game_area_purchase'); 
			drm.insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM (Ubisoft Uplay)</div>');
			otherdrm = false;
		}

		if (securom) {
			var drm = document.getElementById('game_area_purchase'); 
			drm.insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM (SecuROM)</div>');
			otherdrm = false;
		}

		if (tages) {
			var drm = document.getElementById('game_area_purchase'); 
			drm.insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM (Tages)</div>');
			otherdrm = false;
		}

		if (stardock) {
			var drm = document.getElementById('game_area_purchase'); 
			drm.insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM (Stardock Account Required)</div>');
			otherdrm = false;
		}

		if (rockstar) {
			var drm = document.getElementById('game_area_purchase'); 
			drm.insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM (Rockstar Social Club)</div>');
			otherdrm = false;
		}

		if (kalypso) {
			var drm = document.getElementById('game_area_purchase'); 
			drm.insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM (Kalypso Launcher)</div>');
			otherdrm = false;
		}

		if (otherdrm) {
			var drm = document.getElementById('game_area_purchase'); 
			drm.insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM</div>');
		}
	}
});


// Adds a link to SPUF to the top menu
var supernav_content = document.querySelectorAll("#supernav .supernav_content");
document.querySelectorAll("#supernav .supernav_content")[supernav_content.length - 2].innerHTML = document.querySelectorAll("#supernav .supernav_content")[supernav_content.length - 2].innerHTML.replace(
	'<a class="submenuitem" href="http://steamcommunity.com/workshop/">',
	'<a class="submenuitem" href="http://forums.steampowered.com/forums/">Forums</a><a class="submenuitem" href="http://steamcommunity.com/workshop/">'
);


// Changes Steam Community Groups pages
if (document.URL.indexOf("steamcommunity.com/groups/") >= 0) {

	
	var groupname = get_groupname(document.URL);
	if (groupname.indexOf("#") > 0) { groupname = groupname.substring(0, groupname.indexOf("#")); }
	
	storage.get(function(settings) {
		showgroupevents = settings.showgroupevents;
		
		if (settings.showgroupevents === undefined) {
			showgroupevents = "Yes";
			storage.set({'showgroupevents': showgroupevents}, function() {
				console.log("set showgroupevents to default.");
			});
		}
		
		if (showgroupevents == "Yes") {
	
			$('.group_summary').after('<div class="group_content_rule"></div><div class="group_content"><div class="group_content_header"><div class="group_content_header_viewmore"><a href="http://steamcommunity.com/groups/' + groupname + '/events/">VIEW ALL</a></div>Events</div><div id="enhancedsteam_group_events"></div>');
			
			get_http("http://steamcommunity.com/groups/" + groupname + "/events/", function (txt) {
			
				var events_start = txt.indexOf('<!-- events section -->');
				var events_end = txt.indexOf('<!-- /events section -->');
				
				var events;
				
				events = txt.substring(events_start, events_end);		
				
				// now that we have the information, put it on the page
				var eventdiv = document.getElementById('enhancedsteam_group_events'); 
				eventdiv.innerHTML = events;
			});
		}
	});	
}


// User profile pages
if (document.URL.indexOf("://steamcommunity.com/id/") >= 0 || document.URL.indexOf("://steamcommunity.com/profiles/") >= 0) {
	// Changes the profile page
	if (document.getElementById("profileBlock")) {
		var steamID = document.getElementsByName("abuseID")[0].value;

		var htmlstr = '<hr>';
		htmlstr += '<div class="actionItemNoIcon"><a class="linkActionMinor" href="http://sapi.techieanalyst.net/?page=profile&id=' + steamID + '">sAPI</a></div>';
		htmlstr += '<div class="actionItemNoIcon"><a class="linkActionMinor" href="http://www.steamgifts.com/user/id/' + steamID + '">SteamGifts</a></div>';
		htmlstr += '<div class="actionItemNoIcon"><a class="linkActionMinor" href="http://www.steamtrades.com/user/id/' + steamID + '">SteamTrades</a></div>';
		htmlstr += '<div class="actionItemNoIcon"><a class="linkActionMinor" href="http://steamrep.com/profiles/' + steamID + '">SteamRep</a></div>';
		htmlstr += '<div class="actionItemNoIcon"><a class="linkActionMinor" href="http://backpack.tf/profiles/' + steamID + '">backpack.tf</a></div>';
		
		document.getElementById("rightActionBlock").insertAdjacentHTML('beforeend', htmlstr);
	}

	// Changes user's wishlist
	else if (document.URL.indexOf("/wishlist") >= 0) {
		xpath_each("//a[contains(@class,'btn_visit_store')]", function (node) {
			var appid = node.href;
			var appid2 = get_appid(appid + "/");
			var htmlstring;
			
			// get page, find cart string
			get_http(appid + '/', function (txt) {
				htmlstring = txt.substring(txt.indexOf('<div  class="game_area_purchase_game">') + 40, txt.indexOf('<input type="hidden" name="subid" value="') + 64);
				if (htmlstring.length > 500) { htmlstring=""; }
				if (htmlstring.indexOf("4.01 Transitional//EN") > 0) { htmlstring=""; }
				if (htmlstring.substring(htmlstring.length - 1,htmlstring.length) == "<") { htmlstring = htmlstring.substring(0,htmlstring.length - 1); }
				if (htmlstring.substring(htmlstring.length - 2,htmlstring.length) == "<d") { htmlstring = htmlstring.substring(0,htmlstring.length - 2); }
				var subid = htmlstring.substring(htmlstring.indexOf('name="subid" value="') + 20, htmlstring.length - 18);
				if (subid.substring(subid.length - 1,subid.length) == "\"") { subid = subid.substring(0,subid.length - 1); }
				if (subid.substring(subid.length - 2,subid.length) == "\">") { subid = subid.substring(0,subid.length - 2); }
				if (subid.substring(subid.length - 3,subid.length) == "\"> ") { subid = subid.substring(0,subid.length - 3); }
				
				if (subid == "Transitional/") { subid=0; }
				
				console.log(subid);
				
				node.insertAdjacentHTML('beforebegin', '</form>' + htmlstring + '<a href="#" onclick="document.forms[\'add_to_cart_' + subid + '\'].submit();" class="btn_visit_store">Add to Cart</a>  ');
			});
		});
	}

	// Changes user's edit page
	else if (document.URL.indexOf("/edit") >= 0) {
		htmlstr = '<div class="tab" id="returnTabOff">';
		htmlstr += '<div class="tabOffL"><img src="http://cdn.steamcommunity.com/public/images/skin_1/greyCornerUpLeftDark.gif" width="2" height="2" border="0"></div>';
		htmlstr += '<div class="tabOff"><a href="http://steamcommunity.com/my/">Return to profile</a></div>';
		htmlstr += '<div class="tabOffR"><img src="http://cdn.steamcommunity.com/public/images/skin_1/greyCornerUpRightDark.gif" width="2" height="2" border="0"></div>';
		htmlstr += '</div>';

		document.getElementById("tabs").insertAdjacentHTML('beforeend', htmlstr);
	}
}


// Changes Steam Greenlight pages 

if (document.URL.indexOf("steamcommunity.com/sharedfiles/") >= 0) {	
	// insert the "top bar" found on all other Steam games
	
	storage.get(function(settings) {
		showgreenlightbanner = settings.showgreenlightbanner;
		
		if (settings.showgreenlightbanner === undefined) {
			showgreenlightbanner = "No";
			storage.set({'showgreenlightbanner': showgreenlightbanner}, function() {
				console.log("set showgreenlightbanner to default.");
			});
		}
		
		if (showgreenlightbanner == "Yes") {
	
			var banner = document.getElementById('ig_top_workshop');
			var html;
			html = '<link href="' + chrome.extension.getURL("enhancedsteam.css") + '" rel="stylesheet" type="text/css">';
			html = html + '<div id="store_nav_area"><div class="store_nav_bg"><div class="store_nav">';
			html = html + '<a class="tab " href="http://steamcommunity.com/workshop/browse/?appid=765&section=items"><span>Games</a>';
			html = html + '<a class="tab " href="http://steamcommunity.com/workshop/browse/?appid=765&section=software"><span>Software</a>';
			html = html + '<a class="tab " href="http://steamcommunity.com/workshop/browse/?appid=765&section=concepts"><span>Concepts</a>';
			html = html + '<a class="tab " href="http://steamcommunity.com/workshop/browse/?appid=765&section=collections"><span>Collections</a>';
			html = html + '<a class="tab " href="http://steamcommunity.com/workshop/discussions/?appid=765"><span>Discussions</a>';
			html = html + '<a class="tab " href="http://steamcommunity.com/workshop/about/?appid=765&section=faq"><span>About Greenlight</a>';
			html = html + '<a class="tab " href="http://steamcommunity.com/workshop/news/?appid=765"><span>News</a>';

			banner.insertAdjacentHTML('beforebegin', html);
			
			
			// now hide the greenlight banner	
			if (banner) {
				banner.hidden = true;
			}
		} 
	});
}	

// adds "empty cart" button at checkout
if (document.URL.indexOf("store.steampowered.com/cart/") >= 0) {
	addtext = "<a href='javascript:document.cookie=\"shoppingCartGID=0; path=/\";location.reload();' class='btn_checkout_blue' style='float: left; margin-top: 14px;'><div class='leftcap'></div><div class='rightcap'></div>Empty Cart</a>";

	var loc = 0;	
	xpath_each("//div[contains(@class,'checkout_content')]", function (node) {
		loc = loc + 1;
		if (loc == 2) { node.insertAdjacentHTML('afterbegin', addtext); }
	});
} 

// adds metacritic user reviews
storage.get(function(settings) {
	showmcus = settings.showmcus;
	
	if (settings.showmcus === undefined) {
		showmcus = "Yes";
		storage.set({'showmcus': showmcus}, function() {
			console.log("set showmcus to default.");
		});
	}
	
	if (showmcus == "Yes") {
		var metahtml = document.getElementById("game_area_metascore");
		var metauserscore = 0;
		if (metahtml) {
			var metalink = document.getElementById("game_area_metalink");
			meta = metalink.getElementsByTagName("a");
			for (var i = 0; i < meta.length; i++)
			var meta_real_link = meta[i].href;
			get_http("http://www.enhancedsteam.com/gamedata/metacritic.php?mcurl=" + meta_real_link, function (txt) {
				metauserscore = txt;
				metauserscore = metauserscore.replace(".","");		
				var newmeta = '<div id="game_area_metascore" style="background-image: url(' + chrome.extension.getURL("metacritic_bg.png") + ');">' + metauserscore + '</div>';
				metahtml.insertAdjacentHTML('afterend', newmeta);
			});
		}
	}
});

// adds widescreen certification icons
storage.get(function(settings) {
	showwsgf = settings.showwsgf;
	
	if (settings.showwsgf === undefined) {
		showwsgf = "Yes";
		storage.set({'showwsgf': showwsgf}, function() {
			console.log("set showwsgf to default.");
		});
	}
	
	if (document.URL.indexOf("store.steampowered.com/app/") >= 0) {	
		if (document.body.innerHTML.indexOf("<p>Requires the base game <a href=") <= 0) { 
			if (showwsgf == "Yes") {
				// check to see if game data exists
				get_http("http://www.enhancedsteam.com/gamedata/wsgf.php?appid=" + localappid, function (txt) {
					found = 0;
					
					xpath_each("//div[contains(@class,'game_details')]", function (node) {
						if (found == 0) {						
							node.insertAdjacentHTML('afterend', txt);
							found = 1;
						}
					});
				});						
			}
		}	
	}
});	

		
// fixes "Image not found" in wishlist
var items = document.getElementById("wishlist_items");
if (items) {
	imgs = items.getElementsByTagName("img");
	for (var i = 0; i < imgs.length; i++)	
	if (imgs[i].src == "http://media.steampowered.com/steamcommunity/public/images/avatars/33/338200c5d6c4d9bdcf6632642a2aeb591fb8a5c2.gif") {
		var gameurl = imgs[i].parentNode.href;
		imgs[i].src = "http://cdn.steampowered.com/v/gfx/apps/" + gameurl.substring(gameurl.lastIndexOf("/") + 1) + "/header.jpg";
	}
}

// removes "onclick" events which Steam uses to add javascript to it's search functions
var allElements, thisElement;
allElements = document.evaluate("//a[contains(@onclick, 'SearchLinkClick( this ); return false;')]", document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
for (var i = 0; i < allElements.snapshotLength; i++) {
	thisElement = allElements.snapshotItem(i);
	if (thisElement.nodeName.toUpperCase() == 'A') {
		thisElement.removeAttribute('onclick');
	}
}

// adds a "total spent on Steam" to the account details page
storage.get(function(settings) {
	showtotal = settings.showtotal;
	
	if (settings.showtotal === undefined) {
		showtotal = "Yes";
		storage.set({'showtotal': showtotal}, function() {
			console.log("set showtotal to default.");
		});
	}
	
	if (showtotal == "Yes") {
		if ($('.transactionRow').length != 0) {
						
			totaler = function (p, i) {				
				if (p.innerHTML.indexOf("class=\"transactionRowEvent\">Wallet Credit</div>") < 0) {
					var regex = /(\d+\.\d\d+)/;
					price = regex.exec($(p).html());
					if (price != null) {
						return parseFloat(price);
					}
				}
			};
				
			prices = jQuery.map($('.transactionRow'),  totaler);
			
			var total = 0.0;
			jQuery.map(prices, function (p, i) {
				total += p
			});
			total = total.toFixed(2);
			
			$('.accountInfoBlock .block_content_inner .accountBalance').after('<div class="accountRow accountBalance accountSpent"></div>');
			$('.accountSpent').append('<div class="accountData price">$' + total + '</div>');
			$('.accountSpent').append('<div class="accountLabel" style="color: #C00; font-weight: bold; font-size: 100%">Total Spent:</div>');
		}
	}
});