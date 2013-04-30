// version 3.1
var storage = chrome.storage.sync;
var apps;

//Chrome storage functions.
function setValue(key, value) {
	sessionStorage.setItem(key, JSON.stringify(value));
}

function getValue(key) {
	var v = sessionStorage.getItem(key);
	if (v === undefined) return v;
	return JSON.parse(v);
}

// Helper prototypes

String.prototype.startsWith = function(prefix) {
	return this.indexOf(prefix) === 0;
};

Number.prototype.formatMoney = function(places, symbol, thousand, decimal) {
	//FIXME: Puts symbol on wrong end for rubles and euros.

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

// DOM helpers
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
	};
	http.open('GET', url, true);
	http.send(null);
}

function get_divContents(selector) {
	var nodeList = document.querySelectorAll(selector);
	for (var i = 0, length = nodeList.length; i < length; i++) {
		return nodeList[i].innerHTML;
	}
}

function get_appid(t) {
	if (t && t.match(/store\.steampowered\.com\/app\/(\d+)\/?/)) return RegExp.$1;
	else return null;
}

function get_appid_wishlist(t) {
	if (t && t.match(/game_(\d+)/)) return RegExp.$1;
	else return null;
}

function get_groupname(t) {
	if (t && t.match(/steamcommunity\.com\/groups\/(\S+)/)) return RegExp.$1;
	else return null;
}

// colors the tile for owned games
function highlight_owned(node) {
	storage.get(function(settings) {
		if (settings.bgcolor === undefined) { settings.bgcolor = "#5c7836";	storage.set({'bgcolor': settings.bgcolor}); }
		if (settings.showowned === undefined) { settings.showowned = true; storage.set({'showowned': settings.showowned}); }
		if (settings.showowned) {
			highlight_node(node, settings.bgcolor);
			add_tag(node, "Owned", settings.bgcolor);

		}
	});
}

// colors the tile for wishlist games
function highlight_wishlist(node) {
	storage.get(function(settings) {
		if (settings.wlcolor === undefined) { settings.wlcolor = "#496e93";	storage.set({'wlcolor': settings.wlcolor}); }
		if (settings.showwishlist === undefined) { settings.showwishlist = true; storage.set({'showwishlist': settings.showwishlist}); }
		if (settings.showwishlist) {
			highlight_node(node, settings.wlcolor);
			add_tag(node, "Wishlist", settings.wlcolor);
		}
	});
}

// colors the tile for items with coupons
function highlight_coupon(node) {
	storage.get(function(settings) {
		if (settings.ccolor === undefined) { settings.ccolor = "#6b2269"; storage.set({'ccolor': settings.ccolor}); }
		if (settings.showcoupon === undefined) { settings.showcoupon = true; storage.set({'showcoupon': settings.showcoupon}); }
		if (settings.showcoupon) {
			highlight_node(node, settings.ccolor);
			add_tag(node, "Coupon", settings.ccolor);
		}
	});
}

// colors the tile for items in inventory
function highlight_inv_gift(node) {
	storage.get(function(settings) {
		if (settings.icolor === undefined) { settings.icolor = "#a75124"; storage.set({'icolor': settings.icolor}); }
			highlight_node(node, settings.icolor);
			add_tag(node, "Gift", settings.icolor);
	});
}

// colors the tile for items in inventory
function highlight_inv_guestpass(node) {
	storage.get(function(settings) {
		if (settings.icolor === undefined) { settings.icolor = "#a75124"; storage.set({'icolor': settings.icolor}); }
			highlight_node(node, settings.icolor);
			add_tag(node, "Guest Pass", settings.icolor);
	});
}

function highlight_node(node, color) {
	storage.get(function(settings) {
		if (settings.highlight_bg === undefined) { settings.highlight_bg = true; storage.set({'highlight_bg': settings.highlight_bg});}
		if (settings.highlight_bg) {
			node.style.backgroundImage = "none";
			node.style.backgroundColor = color;
		}
	});
}

function add_friends_want_tag(node, appid) {
	storage.get(function(settings) {
		if (settings.show_friends_want === undefined) { settings.show_friends_want = true; storage.set({'show_friends_want': settings.show_friends_want});}
		if (settings.show_friends_want_color === undefined) { settings.show_friends_want_color = "#7E4060"; storage.set({'show_friends_want_color': show_friends_want_color.show_friends_want});}
		if (settings.show_friends_want) {
			add_tag(node, "<a href=\"http://steamcommunity.com/my/friendsthatplay/" + appid + "\">" + getValue(appid + "friendswant") + " wish for</a>", settings.show_friends_want_color);
		}
	});
}

function add_tag (node, string, color) {
	/* To add coloured tags to the end of app names instead of colour
	highlighting; this allows an to be "highlighted" multiple times; e.g.
	inventory and owned. */
	storage.get(function(settings) {
		if (settings.highlight_tag === undefined) { settings.highlight_tag = true; storage.set({'highlight_tag': settings.highlight_tag});}
		if (settings.highlight_tag) {
			node.tags = node.tags || [];
			var tagItem = [string, color];
			var already_tagged = false;

			// Check its not already tagged.
			for (var i = 0; i < node.tags.length; i++) {
				if (node.tags[i][0] === tagItem[0]) already_tagged = true;
			}
			if (!already_tagged) {
				node.tags.push(tagItem);
				display_tags(node);
			}
		}
	});
}

function display_tags(node) {
	var remove_existing_tags = function remove_existing_tags(tag_root) {
		if (tag_root.find(".tags").length > 0) {
			tag_root.find(".tags").remove();
		}
	};
	if (node.tags) {

		// Make tags.
		$tags = $("<div class=\"tags\"></div>");
		for (var i = 0; i < node.tags.length; i++) {
			var tag = node.tags[i];
			var $tag = $("<span>" + tag[0] + "</span>");
			$tag.css("backgroundColor", tag[1]);
			$tag.css("color", "white");
			$tag.css("float", "right");
			$tag.css("padding", "2px");
			$tag.css("margin-right", "4px");
			$tag.css("margin-bottom", "4px");
			$tag.css("border", "1px solid #262627");
			$tags.append($tag);
		}

		// Gotta apply tags differently per type of node.
		var $tag_root;
		if (node.classList.contains("tab_row")) {
			$tag_root = $(node).find(".tab_desc");
			remove_existing_tags($tag_root);

			$tag_root.find("h4").after($tags);
		}
		else if (node.classList.contains("search_result_row")) {
			$tag_root = $(node).find(".search_name");
			remove_existing_tags($tag_root);

			$tag_root.find("h4").after($tags);
		}
		else if (node.classList.contains("dailydeal")) {
			$tag_root = $(node).parent();
			remove_existing_tags($tag_root);

			$tag_root.find(".game_purchase_action").before($tags);
			$tag_root.find(".game_purchase_action").before($("<div style=\"clear: right;\"></div>"));
		}
		else if (node.classList.contains("small_cap")) {
			$tag_root = $(node);
			remove_existing_tags($tag_root);

			$tags.css("width", "100px");
			$tags.css("float", "right");
			$tag_root.find("h4").before($tags);
		}
		else if (node.classList.contains("game_area_dlc_row")) {
			$tag_root = $(node);
			remove_existing_tags($tag_root);

			$tags.css("margin-right", "60px");
			$tag_root.find(".game_area_dlc_price").before($tags);

			// Remove margin-bottom on DLC lists, else horrible pyramidding.
			$.each($tag_root.find(".tags span"), function (i, obj) {
				$(obj).css("margin-bottom", "0");
			});
		}
		else if (node.classList.contains("wishlistRow")) {
			$tag_root = $(node).find(".wishlistRowItem");
			remove_existing_tags($tag_root);

			$tags.css("float", "left");
			$tag_root.find(".bottom_controls").append($tags);
		}
		else if (node.classList.contains("match")) {
			$tag_root = $(node);
			remove_existing_tags($tag_root);

			$tags.css("float", "right");
			$tags.css("width", "130px");
			$tags.css("margin-top", "4px");
			$tag_root.find(".match_price").after($tags);
		}
	}
}

function load_inventory() {
	var profileurl = $(".user_avatar")[0].href || $(".user_avatar a")[0].href;
	var gift_deferred = new $.Deferred();
	var coupon_deferred = new $.Deferred();

	var handle_inv_ctx1 = function (txt) {
		localStorage.setItem("inventory_1", txt);
		var data = JSON.parse(txt);
		if (data.success) {
			$.each(data.rgDescriptions, function(i, obj) {
				if (obj.actions) {
					var appid = get_appid(obj.actions[0].link);
					setValue(appid + (obj.type === "Gift" ? "gift" : "guestpass"), true);
					// add_info(appid);
				}
			});
		}
		gift_deferred.resolve();
	};
	var handle_inv_ctx3 = function (txt) {
		localStorage.setItem("inventory_3", txt);
		var data = JSON.parse(txt);
		if (data.success) {
			$.each(data.rgDescriptions, function(i, obj) {
				var appid;
				if (obj.type === "Coupon") {
					if (obj.actions) {
						var packageids = [];
						for (var j = 0; j < obj.actions.length; j++) {
							//obj.actions[j]
							var link = obj.actions[j].link;
							var packageid = /http:\/\/store.steampowered.com\/search\/\?list_of_subs=([0-9]+)/.exec(link)[1];

							// If sub+packageid is in SessionStorage then we don't need to get this info reloaded.
							// This sick optimization saves 268ms per page load! Woo!
							if (!getValue("sub" + packageid)) packageids.push(packageid);
						}
						if (packageids.length > 0){
							get_http("//store.steampowered.com/api/packagedetails/?packageids=" + packageids.join(","), function(txt) {
								var package_data = JSON.parse(txt);
								$.each(package_data, function(package_id, _package) {
									if (_package.success) {
										setValue("sub" + package_id, true);
										$.each(_package.data.apps, function(i, app) {
											setValue(app.id + "coupon", true);
											setValue(app.id + "coupon_sub", package_id);
											setValue(app.id + "coupon_imageurl", obj.icon_url);
											setValue(app.id + "coupon_title", obj.name);
											setValue(app.id + "coupon_discount", obj.name.match(/([1-9][0-9])%/)[1]);
											for (var i = 0; i < obj.descriptions.length; i++) {
												if (obj.descriptions[i].value.startsWith("Can't be applied with other discounts.")) {
													setValue(app.id + "coupon_discount_note", obj.descriptions[i].value);
													setValue(app.id + "coupon_discount_doesnt_stack", true);
												}
												else if (obj.descriptions[i].value.startsWith("(Valid")) {
													setValue(app.id + "coupon_valid", obj.descriptions[i].value);
												}
											};
										});
									}
								});
								coupon_deferred.resolve();
							});
						}
						else {
							coupon_deferred.resolve();
						}
					}
				}
			});
		}
	}

	// Yes caching!

	//TODO: Expire delay in options.
	var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
	var last_updated = localStorage.getItem("inventory_time") || expire_time - 1;
	if (last_updated < expire_time || !localStorage.getItem("inventory_1") || !localStorage.getItem("inventory_3")) {
		console.log("MMM I like me some fresh inventory.");
		localStorage.setItem("inventory_time", parseInt(Date.now() / 1000, 10))

		// Context ID 1 is gifts and guest passes
		get_http(profileurl + '/inventory/json/753/1/', handle_inv_ctx1);

		// Context ID 3 is coupons
		get_http(profileurl + '/inventory/json/753/3/', handle_inv_ctx3);
	}
	else {
		// No need to load anything, its all in sessionStorage.
		console.log("Aw yis free cache.");
		handle_inv_ctx1(localStorage.getItem("inventory_1"));
		handle_inv_ctx3(localStorage.getItem("inventory_3"));

		gift_deferred.resolve();
		coupon_deferred.resolve();
	}

	var deferred = new $.Deferred();
	$.when.apply(null, [gift_deferred.promise(), coupon_deferred.promise()]).done(function (){
		deferred.resolve();
	});
	return deferred.promise();
}

function add_empty_wishlist_button() {
	var profile = $(".playerAvatar a")[0].href.replace("http://steamcommunity.com", "");
	if (window.location.pathname.startsWith(profile)) {
		var empty_button = $("<a>Empty wishlist</a>");
		empty_button.click(empty_wishlist);
		$("#wishlist_sort_options").before(empty_button);
	}
}

function empty_wishlist() {
	var deferreds = $(".wishlistRow").map(function(i, $obj) {
		var deferred = new $.Deferred();
		var appid = get_appid_wishlist($obj.id),
			http = new XMLHttpRequest(),
			profile = $(".returnLink a")[0].href.replace("http://steamcommunity.com/", "");

		http.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				deferred.resolve();
			}
		};
		http.open('POST', "http://steamcommunity.com/" + profile + "/wishlist/", true);
		http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		http.send("action=remove&appid=" + encodeURIComponent(appid));

		return deferred.promise();
	});

	$.when.apply(null, deferreds).done(function(){
		location.reload();
	});
}

// checks an item panel
function add_info(appid) {
	var handle_app_page = function (txt) {
		setValue(appid, true); // Set appid to true to indicate we have data on it.
		if (txt.search(/<div class="game_area_already_owned">/) > 0) {
			setValue(appid + "owned", true);
		}

		// Use storefront API to check if wishlisted; I've put in a request
		// for this method to state whether or not an app is owned, so it
		// may be able to replace the direct storefront call later; thus
		// allowing batch-requests and huge bandwidth savings for users.
		get_http('//store.steampowered.com/api/appuserdetails/?appids=' + appid, function (data) {
			var app_data = JSON.parse(data)[appid];
			if (app_data.success) {
				setValue(appid + "wishlisted",
				app_data.data.added_to_wishlist);

				if (app_data.data.friendswant) setValue(appid + "friendswant", app_data.data.friendswant.length);
			}
			deferred.resolve();
		});
	};

	// Caching.
	// TODO: Move expire_time into options.
	var deferred = new $.Deferred();
	var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
	var last_updated = sessionStorage.getItem(appid) || expire_time - 1;

	// loads values from cache to reduce response time
	// always get fresh data while dev;
	if (last_updated < expire_time) {
		get_http('http://store.steampowered.com/app/' + appid + '/', handle_app_page);
	}
	else {
		// Data already in sessionStorage, just resolve.
		deferred.resolve();
	}
	return deferred.promise();
}

function find_purchase_date(appname) {
	get_http('http://store.steampowered.com/account/', function (txt) {
		var apphtml = txt.substring(txt.indexOf('<div class="transactionRowTitle">' + appname), txt.indexOf('<div class="transactionRowTitle">' + appname) - 300);
		var appdate = apphtml.match(/<div class="transactionRowDate">(.+)<\/div>/);
		var found = 0;
		xpath_each("//div[contains(@class,'game_area_already_owned')]", function (node) {
			if (found === 0) {
				if (appdate) {
					node.innerHTML = node.innerHTML + "(Purchased " + appdate[1] + ")";
					found = 1;
				}
			}
		});
	});
}

// Adds a link to options to the global menu (where is Install Steam button)
function add_enhanced_steam_options_link() {
	document.getElementById("global_action_menu").insertAdjacentHTML("afterend", '<div style="float: left; margin-right: 5px;"><a href="' + chrome.extension.getURL("options.html") + '" target="_blank" class="global_action_link">Enhanced Steam</a></div>');
}

// Removes the "Install Steam" button at the top of each page
function remove_install_steam_button() {
	storage.get(function(settings) {
		if (settings.hideinstallsteambutton === undefined) { settings.hideinstallsteambutton = false; storage.set({'hideinstallsteambutton': settings.hideinstallsteambutton}); }
		if (settings.hideinstallsteambutton) {
			$('div.header_installsteam_btn').replaceWith('');
		}
	});
}

// Adds a link to SPUF to the top menu
function add_spuf_link() {
	var supernav_content = document.querySelectorAll("#supernav .supernav_content");
	document.querySelectorAll("#supernav .supernav_content")[supernav_content.length - 2].innerHTML = document.querySelectorAll("#supernav .supernav_content")[supernav_content.length - 2].innerHTML.replace(
		'<a class="submenuitem" href="http://steamcommunity.com/workshop/">',
		'<a class="submenuitem" href="http://forums.steampowered.com/forums/" target="_blank">Forums</a><a class="submenuitem" href="http://steamcommunity.com/workshop/">'
	);
}

// If app has a coupon, display message
function display_coupon_message(appid) {
	// get JSON coupon results
	// debugger;
	$('#game_area_purchase').before($(""+
	"<div class=\"early_access_header\">" +
	"    <div class=\"heading\">" +
	"        <h1 class=\"inset\">You have a coupon available!</h1>" +
	"        <h2 class=\"inset\">A coupon in your inventory will be applied automatically at checkout.</h2>" +
	"        <p><a href=\"https://support.steampowered.com/kb_article.php?ref=4210-YIPC-0275\">Learn more</a> about Steam Coupons</p>" +
	"    </div>" +
	"    <div class=\"devnotes\">" +
	"        <table border=0>" +
	"            <tr>" +
	"                <td rowspan=3>" +
	"                    <img src=\"http://cdn.steamcommunity.com/economy/image/" + getValue(appid + "coupon_imageurl") + "\"/>" +
	"                </td>" +
	"                <td valign=center>" +
	"                    <h1>" + getValue(appid + "coupon_title") + "</h1>" +
	"                </td>" +
	"            </tr>" +
	"            <tr>" +
	"                <td>" + getValue(appid + "coupon_discount_note") + "</td>" +
	"            </tr>" +
	"            <tr>" +
	"                <td>" +
	"                    <font style=\"color:#A75124;\">" + getValue(appid + "coupon_valid") + "</font>" +
	"                </td>" +
	"            </tr>" +
	"        </table>" +
	"    </div>" +
	"</div>"));

	var $price_div = $("[itemtype=\"http://schema.org/Offer\"]"),
		cart_id = $price_div.find("[name=\"subid\"]"),
		actual_price_container = $price_div.find("[itemprop=\"price\"]")[0].innerText,
		original_price = parseFloat(actual_price_container.match(/([0-9]+(?:(?:\,|\.)[0-9]+)?)/)[1].replace(",", ".")),
		currency_symbol = actual_price_container.match(/(?:R\$|\$|€|£|pуб)/)[0], // Lazy but effective
		comma = (actual_price_container.indexOf(",") > -1);

	var discounted_price = (original_price - (original_price * getValue(appid + "coupon_discount") / 100).toFixed(2)).toFixed(2);

	if (!($price_div.find(".game_purchase_discount").length > 0 && getValue(appid + "coupon_discount_doesnt_stack"))) {
		// If not (existing discounts and coupon does not stack)
		// debugger;

		if (comma) {
			currency_symbol = currency_symbol.replace(".", ",");
			discounted_price = discounted_price.replace(".", ",");
		}

		var original_price_with_symbol,
			discounted_price_with_symbol;

		// Super simple way to put currency symbol on correct end.

		switch (currency_symbol) {
			case "€":
				original_price_with_symbol = original_price + currency_symbol;
				discounted_price_with_symbol = discounted_price + currency_symbol;
				break;

			case "pуб":
				original_price_with_symbol = parseFloat(original_price).toFixed(0) + " " + currency_symbol;
				discounted_price_with_symbol = parseFloat(discounted_price).toFixed(0) + " " + currency_symbol;
				break;

			default:
			original_price_with_symbol = currency_symbol + original_price;
			discounted_price_with_symbol = currency_symbol + discounted_price;
		}


		$price_div[0].innerHTML = ""+
			"<div class=\"game_purchase_action_bg\">" +
			"    <div class=\"discount_block game_purchase_discount\">" +
			"        <div class=\"discount_pct\">-" + getValue(appid + "coupon_discount") + "%</div>" +
			"        <div class=\"discount_prices\">" +
			"            <div class=\"discount_original_price\">" + original_price_with_symbol + "</div>" +
			"            <div class=\"discount_final_price\" itemprop=\"price\">" + discounted_price_with_symbol + "</div>" +
			"        </div>" +
			"    </div>" +
			"<div class=\"btn_addtocart\">" +
			"    <div class=\"btn_addtocart_left\"></div>" +
			"        <a class=\"btn_addtocart_content\" href=\"javascript:addToCart( " + cart_id + ");\">Add to Cart</a>" +
			"        <div class=\"btn_addtocart_right\"></div>" +
			"    </div>" +
			"</div>";

	}


}

function show_pricing_history(appid) {
	storage.get(function(settings) {
		if (settings.showlowestprice === undefined) { settings.showlowestprice = true; storage.set({'showlowestprice': settings.showlowestprice}); }
		if (settings.showlowestprice) {
			var sgsurl = "http://www.steamgamesales.com/app/" + appid + "/";
			lowest_price = "<div class='game_purchase_area_friends_want' style='padding-top: 15px; height: 30px; border-top: 1px solid #4d4b49; border-left: 1px solid #4d4b49; border-right: 1px solid #4d4b49;' id='enhancedsteam_lowest_price'><div class='gift_icon' style='margin-top: -9px;'><img src='" + chrome.extension.getURL("img/line_chart.png") + "'></div><a href='" + sgsurl + "' target='_blank'>Click here to check pricing history</a>";
			document.getElementById('game_area_purchase').insertAdjacentHTML('afterbegin', lowest_price);
		}
	});
}

// Adds red warnings for 3rd party DRM
function drm_warnings() {
	storage.get(function(settings) {
		if (settings.showdrm === undefined) { settings.showdrm = true; storage.set({'showdrm': settings.showdrm}); }
		if (settings.showdrm) {

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
				document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM (Games for Windows Live)</div>');
				otherdrm = false;
			}

			if (uplay) {
				document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM (Ubisoft Uplay)</div>');
				otherdrm = false;
			}

			if (securom) {
				document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM (SecuROM)</div>');
				otherdrm = false;
			}

			if (tages) {
				document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM (Tages)</div>');
				otherdrm = false;
			}

			if (stardock) {
				document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM (Stardock Account Required)</div>');
				otherdrm = false;
			}

			if (rockstar) {
				document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM (Rockstar Social Club)</div>');
				otherdrm = false;
			}

			if (kalypso) {
				document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM (Kalypso Launcher)</div>');
				otherdrm = false;
			}

			if (otherdrm) {
				document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM</div>');
			}
		}
	});
}

function add_empty_cart_button() {
	addtext = "<a href='javascript:document.cookie=\"shoppingCartGID=0; path=/\";location.reload();' class='btn_checkout_blue' style='float: left; margin-top: 14px;'><div class='leftcap'></div><div class='rightcap'></div>Empty Cart</a>";

	var loc = 0;
	xpath_each("//div[contains(@class,'checkout_content')]", function (node) {
		loc = loc + 1;
		if (loc == 2) { node.insertAdjacentHTML('afterbegin', addtext); }
	});
}

// Changes Steam Community Groups pages
function add_group_events() {
	var groupname = get_groupname(document.URL);
	if (groupname.indexOf("#") > 0) { groupname = groupname.substring(0, groupname.indexOf("#")); }

	storage.get(function(settings) {
		if (settings.showgroupevents === undefined) { settings.showgroupevents = true; storage.set({'showgroupevents': settings.showgroupevents}); }
		if (settings.showgroupevents) {

			$('.group_summary').after('<div class="group_content_rule"></div><div class="group_content"><div class="group_content_header"><div class="group_content_header_viewmore"><a href="http://steamcommunity.com/groups/' + groupname + '/events/">VIEW ALL</a></div>Events</div><div id="enhancedsteam_group_events"></div>');

			get_http("//steamcommunity.com/groups/" + groupname + "/events/", function (txt) {

				var events_start = txt.indexOf('<!-- events section -->');
				var events_end = txt.indexOf('<!-- /events section -->');
				var events = txt.substring(events_start, events_end);

				// now that we have the information, put it on the page
				document.getElementById('enhancedsteam_group_events').innerHTML = events;
			});
		}
	});
}

// User profile pages
function add_community_profile_links() {
	// Changes the profile page
	var steamID = document.getElementsByName("abuseID")[0].value;

	storage.get(function(settings) {
		var htmlstr = '<hr>';
		if (settings.profile_steamgifts === undefined) { settings.profile_steamgifts = true; chrome.storage.sync.set({'profile_steamgifts': settings.profile_steamgifts}); }
		if (settings.profile_steamtrades === undefined) { settings.profile_steamtrades = true; chrome.storage.sync.set({'profile_steamtrades': settings.profile_steamtrades}); }
		if (settings.profile_steamrep === undefined) { settings.profile_steamrep = true; chrome.storage.sync.set({'profile_steamrep': settings.profile_steamrep}); }
		if (settings.profile_wastedonsteam === undefined) { settings.profile_wastedonsteam = true; chrome.storage.sync.set({'profile_wastedonsteam': settings.profile_wastedonsteam}); }
		if (settings.profile_sapi === undefined) { settings.profile_sapi = true; chrome.storage.sync.set({'profile_sapi': settings.profile_sapi}); }
		if (settings.profile_backpacktf === undefined) { settings.profile_backpacktf = true; chrome.storage.sync.set({'profile_backpacktf': settings.profile_backpacktf}); }
		if (settings.profile_astats === undefined) { settings.profile_astats = true; chrome.storage.sync.set({'profile_astats': settings.profile_astats}); }

		if (settings.profile_steamgifts === true) {	htmlstr += '<div class="actionItemIcon"><a href="http://www.steamgifts.com/user/id/' + steamID + '" target="_blank"><img src="' + chrome.extension.getURL('img/ico/steamgifts.ico') + '" width="16" height="16" border="0" /></a></div><div class="actionItem"><a class="linkActionMinor" href="http://www.steamgifts.com/user/id/' + steamID + '" target="_blank">SteamGifts</a></div>'; }
		if (settings.profile_steamtrades === true) { htmlstr += '<div class="actionItemIcon"><a href="http://www.steamtrades.com/user/id/' + steamID + '" target="_blank"><img src="' + chrome.extension.getURL('img/ico/steamtrades.ico') + '" width="16" height="16" border="0" /></a></div><div class="actionItem"><a class="linkActionMinor" href="http://www.steamtrades.com/user/id/' + steamID + '" target="_blank">SteamTrades</a></div>'; }
		if (settings.profile_steamrep === true) { htmlstr += '<div class="actionItemIcon"><a href="http://steamrep.com/profiles/' + steamID + '" target="_blank"><img src="' + chrome.extension.getURL('img/ico/steamrep.ico') + '" width="16" height="16" border="0" /></a></div><div class="actionItem"><a class="linkActionMinor" href="http://steamrep.com/profiles/' + steamID + '" target="_blank">SteamRep</a></div>'; }
		if (settings.profile_wastedonsteam === true) { htmlstr += '<div class="actionItemIcon"><a href="http://wastedonsteam.com/id/' + steamID + '" target="_blank"><img src="' + chrome.extension.getURL('img/ico/wastedonsteam.ico') + '" width="16" height="16" border="0" /></a></div><div class="actionItem"><a class="linkActionMinor" href="http://wastedonsteam.com/id/' + steamID + '" target="_blank">Wasted On Steam</a></div>'; }
		if (settings.profile_sapi === true) { htmlstr += '<div class="actionItemIcon"><a href="http://sapi.techieanalyst.net/?page=profile&id=' + steamID + '" target="_blank"><img src="' + chrome.extension.getURL('img/ico/sapi.ico') + '" width="16" height="16" border="0" /></a></div><div class="actionItem"><a class="linkActionMinor" href="http://sapi.techieanalyst.net/?page=profile&id=' + steamID + '" target="_blank">sAPI</a></div>'; }
		if (settings.profile_backpacktf === true) { htmlstr += '<div class="actionItemIcon"><a href="http://backpack.tf/profiles/' + steamID + '" target="_blank"><img src="' + chrome.extension.getURL('img/ico/backpacktf.ico') + '" width="16" height="16" border="0" /></a></div><div class="actionItem"><a class="linkActionMinor" href="http://backpack.tf/profiles/' + steamID + '" target="_blank">backpack.tf</a></div>'; }
		if (settings.profile_astats === true) { htmlstr += '<div class="actionItemIcon"><a href="http://www.achievementstats.com/index.php?action=profile&playerId=' + steamID + '" target="_blank"><img src="' + chrome.extension.getURL('img/ico/achievementstats.ico') + '" width="16" height="16" border="0" /></a></div><div class="actionItem"><a class="linkActionMinor" href="http://www.achievementstats.com/index.php?action=profile&playerId=' + steamID + '" target="_blank">Achievement Stats</a></div>'; }

		if (htmlstr != '<hr>') { document.getElementById("rightActionBlock").insertAdjacentHTML('beforeend', htmlstr); }
	});
}

// Changes user's wishlist
function add_cart_on_wishlist() {
	xpath_each("//a[contains(@class,'btn_visit_store')]", function (node) {
		var app = node.href;

		// get page, find cart string
		get_http(app, function (txt) {
			var subid = txt.match(/<input type="hidden" name="subid" value="([0-9]+)">/);
			if (subid) {
				// subid is undefined for games not yet available for purchase.
				var htmlstring = $(txt).find('form[name="add_to_cart_' + subid[1] + '"]')[0];
				node.insertAdjacentHTML('beforebegin', '</form>' + htmlstring.outerHTML + '<a href="#" onclick="document.forms[\'add_to_cart_' + subid[1] + '\'].submit();" class="btn_visit_store">Add to Cart</a>  ');
			}
		});
	});
}

// Changes user's edit page
function add_return_to_profile_tab() {
	htmlstr = '<div class="tab" id="returnTabOff">';
	htmlstr += '<div class="tabOffL"><img src="http://cdn.steamcommunity.com/public/images/skin_1/greyCornerUpLeftDark.gif" width="2" height="2" border="0"></div>';
	htmlstr += '<div class="tabOff"><a href="http://steamcommunity.com/my/">Return to profile</a></div>';
	htmlstr += '<div class="tabOffR"><img src="http://cdn.steamcommunity.com/public/images/skin_1/greyCornerUpRightDark.gif" width="2" height="2" border="0"></div>';
	htmlstr += '</div>';

	document.getElementById("tabs").insertAdjacentHTML('beforeend', htmlstr);
}


// Changes Steam Greenlight pages
function hide_greenlight_banner() {
	// insert the "top bar" found on all other Steam games

	storage.get(function(settings) {
		if (settings.showgreenlightbanner === undefined) { settings.showgreenlightbanner = false; storage.set({'showgreenlightbanner': settings.showgreenlightbanner}); }
		if (settings.showgreenlightbanner) {
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
			if (banner) { banner.hidden = true;	}
		}
	});
}

function add_metracritic_userscore() {
	// adds metacritic user reviews
	storage.get(function(settings) {
		if (settings.showmcus === undefined) { settings.showmcus = true; storage.set({'showmcus': settings.showmcus}); }
		if (settings.showmcus) {
			var metahtml = document.getElementById("game_area_metascore");
			var metauserscore = 0;
			if (metahtml) {
				var metalink = document.getElementById("game_area_metalink");
				meta = metalink.getElementsByTagName("a");
				for (var i = 0; i < meta.length; i++) {
					var meta_real_link = meta[i].href;
					get_http("http://www.enhancedsteam.com/gamedata/metacritic.php?mcurl=" + meta_real_link, function (txt) {
						metauserscore = txt;
						metauserscore = metauserscore.replace(".","");
						var newmeta = '<div id="game_area_metascore" style="background-image: url(' + chrome.extension.getURL("img/metacritic_bg.png") + ');">' + metauserscore + '</div>';
						metahtml.insertAdjacentHTML('afterend', newmeta);
					});
				}
			}
		}
	});
}

function add_widescreen_certification() {
	//FIXME: Constantly returns nothing?

	// adds widescreen certification icons
	var appid = get_appid(window.location.host + window.location.pathname);
	storage.get(function(settings) {
		if (settings.showwsgf === undefined) { settings.showwsgf = true; storage.set({'showwsgf': settings.showwsgf}); }
		if (document.body.innerHTML.indexOf("<p>Requires the base game <a href=") <= 0) {
			if (settings.showwsgf) {
				// check to see if game data exists
				get_http("http://www.enhancedsteam.com/gamedata/wsgf.php?appid=" + appid, function (txt) {
					found = 0;

					xpath_each("//div[contains(@class,'game_details')]", function (node) {
						if (found === 0) {
							node.insertAdjacentHTML('afterend', txt);
							found = 1;
						}
					});
				});
			}
		}
	});
}


function fix_wishlist_image_not_found() {
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
}

function account_total_spent() {
	// adds a "total spent on Steam" to the account details page
	storage.get(function(settings) {
		if (settings.showtotal === undefined) { settings.showtotal = true; storage.set({'showtotal': settings.showtotal}); }
		if (settings.showtotal) {
			if ($('.transactionRow').length !== 0) {
				totaler = function (p, i) {
					if (p.innerHTML.indexOf("class=\"transactionRowEvent\">Wallet Credit</div>") < 0) {
						var regex = /(\d+\.\d\d+)/;
						price = regex.exec($(p).html());
						if (price !== null) {
							return parseFloat(price);
						}
					}
				};

				prices = jQuery.map($('.transactionRow'),  totaler);

				var total = 0.0;
				jQuery.map(prices, function (p, i) {
					total += p;
				});
				total = total.toFixed(2);

				$('.accountInfoBlock .block_content_inner .accountBalance').after('<div class="accountRow accountBalance accountSpent"></div>');
				$('.accountSpent').append('<div class="accountData price">$' + total + '</div>');
				$('.accountSpent').append('<div class="accountLabel" style="color: #C00; font-weight: bold; font-size: 100%">Total Spent:</div>');
			}
		}
	});
}

function subscription_savings_check() {
	var not_owned_games_prices = 0,
		appid_info_deferreds = [],
		sub_apps = [],
		sub_app_prices = {},
		comma,
		currency_symbol;

	// For each app, load its info.
	$.each($(".tab_row"), function (i, node) {
		var appid = get_appid(node.querySelector("a").href),
			price_container = $(node).find(".tab_price")[0].innerText;

		if (price_container !== "N/A")
		{
			itemPrice = parseFloat(price_container.match(/([0-9]+(?:(?:\,|\.)[0-9]+)?)/)[1].replace(",", "."));
			if (!currency_symbol) currency_symbol = price_container.match(/(?:R\$|\$|€|£|pуб)/)[0];
			if (!comma) comma = (price_container.indexOf(",") > -1);
		}
		else {
			itemPrice = 0;
		}

		appid_info_deferreds.push(add_info(appid));

		sub_apps.push(appid);
		sub_app_prices[appid] = itemPrice;

	});

	// When we have all the app info
	$.when.apply(null, appid_info_deferreds).done(function() {
		for (var i = 0; i < sub_apps.length; i++) {
			if (!getValue(sub_apps[i] + "owned")) not_owned_games_prices += sub_app_prices[sub_apps[i]];
		}
		var $bundle_price = $(".discount_final_price");
		if ($bundle_price.length === 0) $bundle_price = $(".game_purchase_price");

		var bundle_price = Number(($bundle_price[0].innerText).replace(/[^0-9\.]+/g,""));

		var corrected_price = not_owned_games_prices - bundle_price;

		var $message = $('<div class="savings">' + (comma ? corrected_price / 100 : corrected_price).formatMoney(2, currency_symbol, ",", comma ? "," : ".") + '</div>');
		if (corrected_price < 0) $message[0].style.color = "red";

		$('.savings').replaceWith($message);

	});
}

function dlc_data_from_site(appid) {
	// pull DLC gamedata from enhancedsteam.com
	if (document.body.innerHTML.indexOf("<p>Requires the base game <a href=") > 0) {
		get_http("http://www.enhancedsteam.com/gamedata/gamedata.php?appid=" + appid, function (txt) {
			var block = "<div class='block'><div class='block_header'><h4>Downloadable Content Details</h4></div><div class='block_content'><div class='block_content_inner'>" + txt + "</div></div></div>";

			var dlc_categories = document.getElementById('demo_block');
			dlc_categories.insertAdjacentHTML('afterend', block);
		});
	}
}

// Global scoping this, not sure how else do to it :((
var loading_inventory;

function load_app_info(node) {
	var appid = get_appid(node.href || $(node).find("a")[0].href) || get_appid_wishlist(node.id);
	if (appid) {

		// Using loading_inventory to prevent 50,000 requests because asynchonisity + caching.
		// Instead just add new event listeners
		if (!loading_inventory) loading_inventory = load_inventory();
		loading_inventory.done(function() {
			add_info(appid).done(function(){
				// Order here is important; bottom-most renders last.
				// TODO: Make option

				// Don't highlight "Omg you're on my wishlist!" on users wishlist.
				if (!node.classList.contains("wishlistRow")) {
					if (getValue(appid + "wishlisted")) highlight_wishlist(node);
				}
				if (getValue(appid + "owned")) highlight_owned(node);
				if (getValue(appid + "gift")) highlight_inv_gift(node);
				if (getValue(appid + "guestpass")) highlight_inv_guestpass(node);
				if (getValue(appid + "coupon")) highlight_coupon(node);
				if (getValue(appid + "friendswant")) add_friends_want_tag(node, appid);
			});
		});
	}
}

function check_if_purchased() {
	// find the date a game was purchased if owned
	var ownedNode = $(".game_area_already_owned");

	if (ownedNode.length > 0) {
		var appname = $(".apphub_AppName")[0].innerText;
		find_purchase_date(appname);
	}
}

function bind_ajax_content_highlighting() {
	// checks content loaded via AJAX
	var observer = new WebKitMutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			for (var i = 0; i < mutation.addedNodes.length; i++) {
				var node = mutation.addedNodes[i];

				// Check the node is what we want, and not some unrelated DOM change.
				if (node.classList && node.classList.contains("tab_row")) load_app_info(node);
			}
		});
	});
	observer.observe(document, { subtree: true, childList: true });
}

$(document).ready(function(){
	// Don't interfere with Storefront API requests
	if (window.location.pathname.startsWith("/api")) return;
	// On window load...
	add_enhanced_steam_options_link();
	remove_install_steam_button();

/* To test:
	Coupon behavour with already discounted game.

	dlc_data_from_site();
	add_widescreen_certification();

	Highlgihts on http://store.steampowered.com/recommended/

*/
	switch (window.location.host) {
		case "store.steampowered.com":
			// Load data from inv before anything else.
			switch (true) {
				case /^\/cart\/.*/.test(window.location.pathname):
					add_empty_cart_button();
					break;

				case /^\/app\/.*/.test(window.location.pathname):
					load_inventory().done(function() {
						var appid = get_appid(window.location.host + window.location.pathname);
						if (getValue(appid+"coupon")) display_coupon_message(appid);
					});
					show_pricing_history(appid);
					dlc_data_from_site(appid);

					drm_warnings();
					add_metracritic_userscore();
					check_if_purchased();

					add_widescreen_certification();  // Doesn't work?
					break;

				case /^\/sub\/.*/.test(window.location.pathname):
					drm_warnings();
					subscription_savings_check();

					break;

				case /^\/account\/.*/.test(window.location.pathname):
					account_total_spent();
					break;
			}

			/* Highlights & data fetching */

				// Storefront homepage tabs.
			bind_ajax_content_highlighting();

				// Storefront rows
			xpath_each("//div[contains(@class,'tab_row')]", load_app_info);

				// DLC on App Page
			xpath_each("//a[contains(@class,'game_area_dlc_row')]", load_app_info);

				// highlights featured homepage items
			xpath_each("//a[contains(@class,'small_cap')]", load_app_info);

				// hightlight daily deal
			xpath_each("//div[contains(@class,'dailydeal')]", load_app_info);

				// checks for content loaded via AJAX on the search pages
				// TODO: Does this need to be ran twice?
			xpath_each("//a[contains(@class,'search_result_row')]", load_app_info);
			$("#search_results").bind("DOMSubtreeModified", function() {
				xpath_each("//a[contains(@class,'search_result_row')]", load_app_info);
			});

				// checks for search suggestions
			$("#search_suggestion_contents").bind("DOMSubtreeModified", function() {
				xpath_each("//a[contains(@class,'match')]", load_app_info);
			});

			break;

		case "steamcommunity.com":

			switch (true) {
				case /^\/groups\/.*/.test(window.location.pathname):
					add_group_events();
					break;

				case /^\/(?:id|profiles)\/.+\/wishlist/.test(window.location.pathname):
					add_cart_on_wishlist();
					fix_wishlist_image_not_found();

					add_empty_wishlist_button();
					// wishlist owned  Highlights & data fetching
					xpath_each("//div[contains(@class,'wishlistRow')]", load_app_info);
					break;

				case /^\/(?:id|profiles)\/.+\/edit/.test(window.location.pathname):
					add_return_to_profile_tab();
					break;

				case /^\/(?:id|profiles)\/[^\/]+\/?$/.test(window.location.pathname):
					add_community_profile_links();
					break;

				case /^\/sharedfiles\/.*/.test(window.location.pathname):
					hide_greenlight_banner();
					break;
			}
			break;
	}
});