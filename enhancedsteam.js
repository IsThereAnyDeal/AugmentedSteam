// version 5.3
var storage = chrome.storage.sync;
var apps;
var info = 0;
var isSignedIn = false;
var signedInChecked = false;
var search_threshhold = $(window).height() - 80;

var cookie = document.cookie;
var language = cookie.match(/language=([a-z]{3})/i)[1];
if (localized_strings[language] === undefined) { language = "eng"; }

// set language for options page
chrome.storage.sync.set({'language': language});

// Global scope promise storage; to prevent unecessary API requests.
var loading_inventory;
var appid_promises = {};
var library_all_games = [];

MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

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

function formatMoney (number, places, symbol, thousand, decimal, right) {
	places = !isNaN(places = Math.abs(places)) ? places : 2;
	symbol = symbol !== undefined ? symbol : "$";
	thousand = thousand || ",";
	decimal = decimal || ".";
	var negative = number < 0 ? "-" : "",
		i = parseInt(number = Math.abs(+number || 0).toFixed(places), 10) + "",
		j = (j = i.length) > 3 ? j % 3 : 0;
	if (right) {
		return negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) + (places ? decimal + Math.abs(number - i).toFixed(places).slice(2) + symbol: "");
	} else {
		return symbol + negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) + (places ? decimal + Math.abs(number - i).toFixed(places).slice(2) : "");
	}
};

function escapeHTML(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') ;
}

function getCookie(name) {
	return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(name).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
}

function matchAll(re, str) {
	var p, r = [];
	while(p = re.exec(str))
		r.push(p[1]);
	return r;
}

// DOM helpers
function xpath_each(xpath, callback) {
	//TODO: Replace instances with jQuery selectors.
	var res = document.evaluate(xpath, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	var node;
	for (var i = 0; i < res.snapshotLength; ++i) {
		node = res.snapshotItem(i);
		callback(node);
	}
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

function get_appid(t) {
	if (t && t.match(/(?:store\.steampowered|steamcommunity)\.com\/app\/(\d+)\/?/)) return RegExp.$1;
	else return null;
}

function get_appids(t) {
	var res = matchAll(/(?:store\.steampowered|steamcommunity)\.com\/app\/(\d+)\/?/g, t);
	return (res.length > 0) ? res : null;
}

function get_subid(t) {
	if (t && t.match(/(?:store\.steampowered|steamcommunity)\.com\/sub\/(\d+)\/?/)) return RegExp.$1;
	else return null;
}

function get_appid_wishlist(t) {
	if (t && t.match(/game_(\d+)/)) return RegExp.$1;
	else return null;
}

function ensure_appid_deferred(appid) {
	if (!appid_promises[appid]) {
		var deferred = new $.Deferred();
		appid_promises[appid] = {
			"resolve": deferred.resolve,
			"promise": deferred.promise()
		};
	}
}

// check if the user is signed in
function is_signed_in() {
	if (!signedInChecked) {
		var steamLogin = getCookie("steamLogin");
		if (steamLogin) isSignedIn = steamLogin.replace(/%.*/, "").match(/^\d+/);
		signedInChecked = true;
	}
	return isSignedIn;
}

// colors the tile for owned games
function highlight_owned(node) {
	storage.get(function(settings) {
		node.classList.add("es_highlight_owned");

		if (settings.highlight_owned_color === undefined) { settings.highlight_owned_color = "#5c7836";	storage.set({'highlight_owned_color': settings.highlight_owned_color}); }
		if (settings.highlight_owned === undefined) { settings.highlight_owned = true; storage.set({'highlight_owned': settings.highlight_owned}); }
		if (settings.hide_owned === undefined) { settings.hide_owned = false; chrome.storage.sync.set({'hide_owned': settings.hide_owned}); }

		if (settings.highlight_owned) highlight_node(node, settings.highlight_owned_color);
		if (settings.hide_owned) hide_node(node);

		if (settings.tag_owned === undefined) { settings.tag_owned = false; storage.set({'tag_owned': settings.tag_owned}); }
		if (settings.tag_owned_color === undefined) { settings.tag_owned_color = "#5c7836";	storage.set({'tag_owned_color': settings.tag_owned_color}); }
		if (settings.tag_owned) add_tag(node, localized_strings[language].tag_owned, settings.tag_owned_color);
	});
}

// colors the tile for wishlist games
function highlight_wishlist(node) {
	storage.get(function(settings) {
		node.classList.add("es_highlight_wishlist");

		if (settings.highlight_wishlist_color === undefined) { settings.highlight_wishlist_color = "#496e93";	storage.set({'highlight_wishlist_color': settings.highlight_wishlist_color}); }
		if (settings.highlight_wishlist === undefined) { settings.highlight_wishlist = true; storage.set({'highlight_wishlist': settings.highlight_wishlist}); }
		if (settings.highlight_wishlist) highlight_node(node, settings.highlight_wishlist_color);

		if (settings.tag_wishlist_color === undefined) { settings.tag_wishlist_color = "#496e93";	storage.set({'tag_wishlist_color': settings.tag_wishlist_color}); }
		if (settings.tag_wishlist === undefined) { settings.tag_wishlist = false; storage.set({'tag_wishlist': settings.tag_wishlist}); }
		if (settings.tag_wishlist) add_tag(node, localized_strings[language].tag_wishlist, settings.highlight_wishlist_color);
	});
}

// colors the tile for items with coupons
function highlight_coupon(node) {
		node.classList.add("es_highlight_coupon");

	storage.get(function(settings) {
		if (settings.highlight_coupon_color === undefined) { settings.highlight_coupon_color = "#6b2269"; storage.set({'highlight_coupon_color': settings.highlight_coupon_color}); }
		if (settings.highlight_coupon === undefined) { settings.highlight_coupon = false; storage.set({'highlight_coupon': settings.highlight_coupon}); }
		if (settings.highlight_coupon) highlight_node(node, settings.highlight_coupon_color);

		if (settings.tag_coupon_color === undefined) { settings.tag_coupon_color = "#6b2269"; storage.set({'tag_coupon_color': settings.tag_coupon_color}); }
		if (settings.tag_coupon === undefined) { settings.tag_coupon = true; storage.set({'tag_coupon': settings.tag_coupon}); }
		if (settings.tag_coupon) add_tag(node, localized_strings[language].tag_coupon, settings.highlight_coupon_color);
	});
}

// colors the tile for items in inventory
function highlight_inv_gift(node) {
	storage.get(function(settings) {
		node.classList.add("es_highlight_inv_gift");

		if (settings.highlight_inv_gift_color === undefined) { settings.highlight_inv_gift_color = "#a75124"; storage.set({'highlight_inv_gift_color': settings.highlight_inv_gift_color}); }
		if (settings.highlight_inv_gift === undefined) { settings.highlight_inv_gift = false; storage.set({'highlight_inv_gift': settings.highlight_inv_gift}); }
		if (settings.highlight_inv_gift) highlight_node(node, settings.highlight_inv_gift_color);

		if (settings.tag_inv_gift_color === undefined) { settings.tag_inv_gift_color = "#a75124"; storage.set({'tag_inv_gift_color': settings.tag_inv_gift_color}); }
		if (settings.tag_inv_gift === undefined) { settings.tag_inv_gift = true; storage.set({'tag_inv_gift': settings.tag_inv_gift}); }
		if (settings.tag_inv_gift) add_tag(node, localized_strings[language].tag_inv_gift, settings.highlight_inv_gift_color);
	});
}

// colors the tile for items in inventory
function highlight_inv_guestpass(node) {
	storage.get(function(settings) {
		node.classList.add("es_highlight_inv_guestpass");

		if (settings.highlight_inv_guestpass_color === undefined) { settings.highlight_inv_guestpass_color = "#a75124"; storage.set({'highlight_inv_guestpass_color': settings.highlight_inv_guestpass_color}); }
		if (settings.highlight_inv_guestpass === undefined) { settings.highlight_inv_guestpass = false; storage.set({'highlight_inv_guestpass': settings.highlight_inv_guestpass}); }
		if (settings.highlight_inv_guestpass) highlight_node(node, settings.highlight_inv_guestpass_color);

		if (settings.tag_inv_guestpass_color === undefined) { settings.tag_inv_guestpass_color = "#a75124"; storage.set({'tag_inv_guestpass_color': settings.tag_inv_guestpass_color}); }
		if (settings.tag_inv_guestpass === undefined) { settings.tag_inv_guestpass = true; storage.set({'tag_inv_guestpass': settings.tag_inv_guestpass}); }
		if (settings.tag_inv_guestpass) add_tag(node, localized_strings[language].tag_inv_guestpass, settings.highlight_inv_guestpass_color);
	});
}

function highlight_friends_want(node, appid) {
	storage.get(function(settings) {
		node.classList.add("es_highlight_friends_want");

		if (settings.highlight_friends_want === undefined) { settings.highlight_friends_want = false; storage.set({'highlight_friends_want': settings.highlight_friends_want});}
		if (settings.highlight_friends_want_color === undefined) { settings.highlight_friends_want_color = "#7E4060"; storage.set({'highlight_friends_want_color': settings.highlight_friends_want_color});}
		if (settings.highlight_friends_want) highlight_node(node, settings.highlight_friends_want_color);

		if (settings.tag_friends_want === undefined) { settings.tag_friends_want = true; storage.set({'tag_friends_want': settings.tag_friends_want});}
		if (settings.tag_friends_want_color === undefined) { settings.tag_friends_want_color = "#7E4060"; storage.set({'tag_friends_want_color': settings.tag_friends_want_color});}
		if (settings.tag_friends_want) add_tag(
			node,
			localized_strings[language].tag_friends_want.replace("__appid__", appid).replace("__friendcount__", getValue(appid + "friendswant")),
			settings.tag_friends_want_color
		);
	});
}

function tag_friends_own(node, appid) {
	storage.get(function(settings) {
		node.classList.add("es_tag_friends_own");

		if (settings.tag_friends_own === undefined) { settings.tag_friends_own = true; storage.set({'tag_friends_own': settings.tag_friends_own});}
		if (settings.tag_friends_own_color === undefined) { settings.tag_friends_own_color = "#5b9504"; storage.set({'tag_friends_own_color': settings.tag_friends_own_color});}
		if (settings.tag_friends_own) add_tag(
			node,
			localized_strings[language].tag_friends_own.replace("__appid__", appid).replace("__friendcount__", getValue(appid + "friendsown")),
			settings.tag_friends_own_color
		);
	});
}

function tag_friends_rec(node, appid) {
	storage.get(function(settings) {
		node.classList.add("es_tag_friends_rec");

		if (settings.tag_friends_rec === undefined) { settings.tag_friends_rec = false; storage.set({'tag_friends_rec': settings.tag_friends_rec});}
		if (settings.tag_friends_rec_color === undefined) { settings.tag_friends_rec_color = "#2e3d54"; storage.set({'tag_friends_rec_color': settings.tag_friends_rec_color});}
		if (settings.tag_friends_rec) add_tag(
			node,
			localized_strings[language].tag_friends_rec.replace("__appid__", appid).replace("__friendcount__", getValue(appid + "friendsrec")),
			settings.tag_friends_rec_color
		);
	});
}

function highlight_node(node, color) {
	var $node = $(node);
	// Carousel item
	if (node.classList.contains("cluster_capsule")) {
		$node = $(node).find(".main_cap_content");
	}

	// Genre Carousel items
	if (node.classList.contains("large_cap")) {
		$node = $(node).find(".large_cap_content");
	}
	
	// Sale items
	if (node.classList.contains("insert_season_here_sale_dailydeal_ctn")) {
		$node = $(node).find(".dailydeal_footer");
	}
	
	// App and community hub page headers
	if (node.classList.contains("apphub_HeaderTop") || node.classList.contains("apphub_HeaderStandardTop")) {
		$node = $(node).find(".apphub_AppName");
		$node.css("color", color);
		return;
	}

	// Blotter activity
	if ($node.parent().parent()[0].classList.contains("blotter_daily_rollup_line") || $node.parent().parent()[0].classList.contains("blotter_author_block") || $node.parent().parent()[0].classList.contains("blotter_gamepurchase") || $node.parent().parent()[0].classList.contains("blotter_recommendation")) {
		$node.css("color", color);
		return;
	}

	$node.css("backgroundImage", "none");
	$node.css("backgroundColor", color);

	// Set text colour to not conflict with highlight.
	if (node.classList.contains("tab_row")) $node.find(".tab_desc").css("color", "lightgrey");
	if (node.classList.contains("search_result_row")) $node.find(".search_name").css("color", "lightgrey");
}

function hide_node(node) {
	if ($(node).hasClass("info")) { node = $(node).parent()[0]; }

	if (node.classList.contains("search_result_row") || node.classList.contains("tab_row") || node.classList.contains("game_area_dlc_row") || node.classList.contains("item")) {
		$(node).css("display", "none");
		search_threshhold = search_threshhold - 58;
		if ($(document).height() <= $(window).height()) {
			load_search_results();
		}
	}
}

function add_tag (node, string, color) {
	/* To add coloured tags to the end of app names instead of colour
	highlighting; this allows an to be "highlighted" multiple times; e.g.
	inventory and owned. */
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

function display_tags(node) {
	var remove_existing_tags = function remove_existing_tags(tag_root) {
		if (tag_root.find(".tags").length > 0) {
			tag_root.find(".tags").remove();
		}
	},
	new_display_tag = function new_display_tag(text, color) {
		var $tag = $("<span>" + tag[0] + "</span>");
		$tag.css("backgroundColor", tag[1]);
		$tag.css("color", "white");
		$tag.css("float", "right");
		$tag.css("padding", "2px");
		$tag.css("margin-right", "4px");
		$tag.css("margin-bottom", "4px");
		$tag.css("border", "1px solid #262627");
		return $tag;
	};

	if (node.tags) {

		// Make tags.
		$tags = $("<div class=\"tags\"></div>");
		for (var i = 0; i < node.tags.length; i++) {
			var tag = node.tags[i];
			var $tag = new_display_tag(tag[0], tag[1]);
			$tags.append($tag);
		}

		// Gotta apply tags differently per type of node.
		var $tag_root;
		if (node.classList.contains("tab_row")) {
			$tag_root = $(node).find(".tab_desc").removeClass("with_discount");
			remove_existing_tags($tag_root);

			$tags.css("margin-right", "76px");
			$tag_root.find("h4").after($tags);
		}
		else if (node.classList.contains("search_result_row")) {
			$tag_root = $(node).find(".search_name");
			remove_existing_tags($tag_root);

			$tags.css("display", "inline-block");
			$tags.css("vertical-align", "middle");
			$tags.css("font-size", "small");

			$tag_root.find("p").prepend($tags);

			// Remove margin-bottom, border, and tweak padding on carousel lists.
			$.each($tag_root.find(".tags span"), function (i, obj) {
				$(obj).css("margin-bottom", "0");
				$(obj).css("border", "0");
				$(obj).css("padding", "3px");
			});
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

			// small_cap will have extra height

			$tags.css("display", "table");
			$tags.css("margin-top", "4px");
			$tag_root.find("h4").before($tags);
		}
		else if (node.classList.contains("game_area_dlc_row")) {
			$tag_root = $(node);
			remove_existing_tags($tag_root);

			var width = $(".game_area_dlc_price").width();
			$tags.css("margin-right", width + 3);
			$tag_root.find(".game_area_dlc_name").before($tags);

			// Remove margin-bottom on DLC lists, else horrible pyramidding.
			$.each($tag_root.find(".tags span"), function (i, obj) {
				$(obj).css("margin-bottom", "0");
				$(obj).css("padding", "0 2px");
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
			$tags.css("margin-top", "30px");
			$tag_root.find(".match_price").after($tags);
		}
		else if (node.classList.contains("cluster_capsule")) {
			$tag_root = $(node);
			remove_existing_tags($tag_root);

			$tags.css("display", "inline-block");
			$tags.css("vertical-align", "middle");
			$tags.css("font-size", "small");
			$tag_root.find(".main_cap_platform_area").append($tags);

			// Remove margin-bottom, border, and tweak padding on carousel lists.
			$.each($tag_root.find(".tags span"), function (i, obj) {
				$(obj).css("margin-bottom", "0");
				$(obj).css("border", "0");
				$(obj).css("padding", "3px");
			});
		}
		else if (node.classList.contains("recommendation_highlight")) {
			$tag_root = $(node);
			remove_existing_tags($tag_root);

			$tags.css("float", "left");

			$tag_root.find(".game_purchase_action").before($tags);
			$tag_root.find(".game_purchase_action").before($("<div style=\"clear: right;\"></div>"));
		}
		else if (node.classList.contains("recommendation_carousel_item")) {
			$tag_root = $(node);
			remove_existing_tags($tag_root);

			$tags.css("float", "left");

			$tag_root.find(".buttons").before($tags);
		}
		else if (node.classList.contains("friendplaytime_game")) {
			$tag_root = $(node);
			remove_existing_tags($tag_root);

			$tags.css("float", "left");

			$tag_root.find(".friendplaytime_buttons").before($tags);
		}
		else if (node.classList.contains("inline_tags")) {
			$tag_root = $(node);
			remove_existing_tags($tag_root.parent());

			$tags.css("display", "inline-block");
			$tags.css("margin-left", "4px");

			$tags.children().remove();
			// display inline as text only.
			$.each(node.tags, function (i, obj) {
				var $obj = $("<span>" + obj[0] + "</span>");
				// $obj.css("border-bottom", "2px solid " + obj[1]);
				// $obj.css("background-color", obj[1]);
				// $obj.css("color", "white");

				if (i === 0) $tags.append(" (");
				$tags.append($obj);
				if (i === node.tags.length - 1) {
					$tags.append(")");
				}
				else {
					$tags.append(", ");
				}
			});
			$tag_root.after($tags);
		}
		else if (node.classList.contains("apphub_HeaderStandardTop")) {
			$tag_root = $(node);
			$tag_root.css("height", "auto"); // Height to accomodate tags.

			remove_existing_tags($tag_root);

			$tags.css("float", "left");
			$tags.css("margin-top", "4px");
			$tags.css("margin-left", "4px");

			$tag_root.find(".apphub_AppName").after($tags);
			$tag_root.find(".apphub_AppName").after($("<div style=\"clear: right;\"></div>"));
		}
		else if (node.classList.contains("apphub_HeaderTop")) {
			$tag_root = $(node);

			$tag_root.find(".apphub_AppName").css("width", "0px")

			remove_existing_tags($tag_root);

			$tags.css("float", "left");
			$tags.css("margin-top", "4px");
			$tags.css("margin-left", "4px");

			$tag_root.find(".apphub_OtherSiteInfo").append($tags);
			$tag_root.find(".apphub_AppName").after($("<div style=\"clear: right;\"></div>"));

			var max_width = 948-($(".apphub_OtherSiteInfo").width() + 69);

			$tag_root.find(".apphub_AppName").css("max-width", max_width+"px").attr("title", $tag_root.find(".apphub_AppName").text());
			$tag_root.find(".apphub_AppName").css("width", "auto")
			$tag_root.find(".apphub_AppName").css("overflow", "hidden");
		}
	}
}

function load_inventory() {
	if ($(".user_avatar").length > 0) { var profileurl = $(".user_avatar")[0].href || $(".user_avatar a")[0].href; }
	var gift_deferred = new $.Deferred();
	var coupon_deferred = new $.Deferred();
	var card_deferred = new $.Deferred();

	var handle_inv_ctx1 = function (txt) {
		if (txt.charAt(0) != "<") {

			localStorage.setItem("inventory_1", txt);
			var data = JSON.parse(txt);
			if (data.success) {
				$.each(data.rgDescriptions, function(i, obj) {
					var is_package = false;
					var appids;

					if (obj.descriptions) {
						for (var d = 0; d < obj.descriptions.length; d++) {
							if (obj.descriptions[d].type == "html") {
								appids = get_appids(obj.descriptions[d].value);
								if (appids) {
									// gift package with multiple apps
									is_package = true;
									for (var j = 0; j < appids.length; j++) {
										setValue(appids[j] + (obj.type === "Gift" ? "gift" : "guestpass"), true);
									}

									break;
								}
							}
						}
					}

					if (!is_package && obj.actions) {
						// single app
						var appid = get_appid(obj.actions[0].link);
						setValue(appid + (obj.type === "Gift" ? "gift" : "guestpass"), true);
					}
				});
			}
			gift_deferred.resolve();
		}
	};

	var handle_inv_ctx6 = function (txt) {
		if (txt) {
			if (txt.charAt(0) != "<") {
				localStorage.setItem("inventory_6", txt);
				var data = JSON.parse(txt);
				if (data.success) {
					$.each(data.rgDescriptions, function(i, obj) {
						if (obj.market_hash_name) {
							setValue("card:" + obj.market_hash_name, true);
						}
					});
				}
				card_deferred.resolve();
			}
		}
	};

	var handle_inv_ctx3 = function (txt) {
		if (txt.charAt(0) != "<") {
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

								// If sub+packageid is in localStorage then we don't need to get this info reloaded.
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
	}

	// Yes caching!

	//TODO: Expire delay in options.
	var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
	var last_updated = localStorage.getItem("inventory_time") || expire_time - 1;
	if (last_updated < expire_time || !localStorage.getItem("inventory_1") || !localStorage.getItem("inventory_3")) {
		localStorage.setItem("inventory_time", parseInt(Date.now() / 1000, 10))

		// Context ID 1 is gifts and guest passes
		get_http(profileurl + '/inventory/json/753/1/', handle_inv_ctx1);

		// Context ID 3 is coupons
		get_http(profileurl + '/inventory/json/753/3/', handle_inv_ctx3);

		// Context ID 6 is trading card stuff
		get_http(profileurl + '/inventory/json/753/6/', handle_inv_ctx6);
	}
	else {
		// No need to load anything, its all in localStorage.
		handle_inv_ctx1(localStorage.getItem("inventory_1"));
		handle_inv_ctx3(localStorage.getItem("inventory_3"));
		handle_inv_ctx6(localStorage.getItem("inventory_6"));

		gift_deferred.resolve();
		coupon_deferred.resolve();
		card_deferred.resolve();
	}

	var deferred = new $.Deferred();
	$.when.apply(null, [gift_deferred.promise(), card_deferred.promise(), coupon_deferred.promise()]).done(function (){
		deferred.resolve();
	});
	return deferred.promise();
}

function add_empty_wishlist_buttons() {
	// TODO Trigger a new event after everything is highlighted and then add the button
	if(is_signed_in) {
		var profile = $(".playerAvatar a")[0].href.replace("http://steamcommunity.com", "");
		if (window.location.pathname.startsWith(profile)) {
			var empty_buttons = $("<div class='btn_save' id='es_empty_wishlist'>" + localized_strings[language].empty_wishlist + "</div><div class='btn_save' id='es_empty_owned_wishlist'>" + localized_strings[language].remove_owned_wishlist + "</div>");
			$(".save_actions_enabled").filter(":last").after(empty_buttons);
			$("#es_empty_wishlist").click({ empty_owned_only: false },empty_wishlist);
			$("#es_empty_owned_wishlist").click({ empty_owned_only: true },empty_wishlist);
		}
	}
}

function add_wishlist_filter() {
	var html  = "<span>" + localized_strings[language].show + ": </span>";
		html += "<label class='es_sort' id='es_wl_all'><input type='radio' id='es_wl_all_box' name='es_wl_sort' checked><span><a>" + localized_strings[language].games_all + "</a></span></label>";
		html += "<label class='es_sort' id='es_wl_sale'><input type='radio' id='es_wl_sale_box' name='es_wl_sort'><span><a>" + localized_strings[language].games_discount + "</a></span></label>";
		html += "<label class='es_sort' id='es_wl_coupon'><input type='radio' id='es_wl_coupon_box' name='es_wl_sort'><span><a>" + localized_strings[language].games_coupon + "</a></span></label>";
		html += "</div>";

	$('#wishlist_sort_options').append("<p>" + html);


	$('#es_wl_all').on('click', function() {
		$('#es_wl_all_box').prop('checked', true);
		$('.wishlistRow').css('display', 'block');
	});

	$('#es_wl_sale').on('click', function() {
		$('#es_wl_sale_box').prop('checked', true);
		$('.wishlistRow').css('display', 'block');
		$('.wishlistRow').each(function () {
			if (!$(this).html().match(/discount_block_inline/)) {
				$(this).css('display', 'none');
			}
		});
	});

	$('#es_wl_coupon').on('click', function() {
		$('#es_wl_coupon_box').prop('checked', true);
		$('.wishlistRow').css('display', 'block');
		$('.wishlistRow').each(function () {
			if (!$(this)[0].outerHTML.match(/es_highlight_coupon/)) {
				$(this).css('display', 'none');
			}
		});
	});
}

function add_wishlist_discount_sort() {
	if ($("#wishlist_sort_options").find("a[href$='price']").length > 0) {
		$("#wishlist_sort_options").find("a[href$='price']").after("&nbsp;&nbsp;<label id='es_wl_sort_discount'><a>" + localized_strings[language].discount + "</a></label>");
	} else {
		$("#wishlist_sort_options").find("span[class='selected_sort']").after("&nbsp;&nbsp;<label id='es_wl_sort_discount'><a>" + localized_strings[language].discount + "</a></label>");
	}

	$("#es_wl_sort_discount").on("click", function() {
		var wishlistRows = [];
		$('.wishlistRow').each(function () {
			var push = new Array();
			if ($(this).html().match(/discount_block_inline/)) {
				push[0] = this.outerHTML;
				push[1] = $(this).find("div[class='discount_pct']").html();
			} else {
				push[0] = this.outerHTML;
				push[1] = "0";
			}
			wishlistRows.push(push);
			this.parentNode.removeChild(this);
		});

		wishlistRows.sort(function(a,b) { return parseInt(a[1],10) - parseInt(b[1],10);	});

		$('.wishlistRow').each(function () { $(this).css("display", "none"); });

		$(wishlistRows).each(function() {
			$("#wishlist_items").append(this[0]);
		});

		$(this).html("<span style='color: #B0AEAC;'>" + localized_strings[language].discount + "</span>");
		var html = $("#wishlist_sort_options").find("span[class='selected_sort']").html();
		html = "<a onclick='location.reload()'>" + html + "</a>";
		$("#wishlist_sort_options").find("span[class='selected_sort']").html(html);
	});
}

function add_wishlist_total() {
	var total = 0;
	var gamelist = "";
	var items = 0;
	var currency_symbol;
	var apps = "";
	var htmlstring;
	
	function calculate_node(node, search) {
		price = parseFloat($(node).find(search).text().trim().replace(",", ".").replace(/[^0-9\.]+/g,""));
		currency_symbol = $(node).find(search).text().trim().match(/(?:R\$|\$|€|£|pуб)/)[0];
		gamelist += $(node).find("h4").text().trim() + ", ";
		items += 1;
		if (price) {
			total += price;
			apps += get_appid($(node).find("a[class='btn_visit_store']")[0].href) + ",";
		}
	}
	
	$('.wishlistRow').each(function () {
		if ($(this).find("div[class='price']").length != 0 && $(this).find("div[class='price']").text().trim() != "") calculate_node( $(this), "div[class='price']" );	
		if ($(this).find("div[class='discount_final_price']").length != 0) calculate_node( $(this), "div[class='discount_final_price']" );	
	});
	gamelist = gamelist.replace(/, $/, "");
	
	get_http('http://store.steampowered.com/api/appdetails/?appids=' + apps, function (data) {
		var storefront_data = JSON.parse(data);
		htmlstring = '<form name="add_to_cart_all" action="http://store.steampowered.com/cart/" method="POST">';
		htmlstring += '<input type="hidden" name="snr" value="1_5_9__403">';
		htmlstring += '<input type="hidden" name="action" value="add_to_cart">';
		$.each(storefront_data, function(appid, app_data) {
			if (app_data.success) {					
				if (app_data.data.packages && app_data.data.packages[0]) {
					htmlstring += '<input type="hidden" name="subid[]" value="' + app_data.data.packages[0] + '">';
				}
			}
		});
		htmlstring += '</form>';
	
		switch (currency_symbol) {
			case "pуб":
				if (parseInt(total, 10) == total) {
					total = total + " pуб.";
					break;
				}
			case "€":
				total = formatMoney(parseFloat(total), 2, currency_symbol, ".", ",", true);
				break;
			case "R$":
				total = formatMoney(parseFloat(total), 2, "R$ ", ".", ",", false);
				break;
			default:
				total = formatMoney(parseFloat(total), 2, currency_symbol, ",", ".", false);
				break;
		}
		$(".games_list").after(htmlstring + "<link href='http://cdn4.store.steampowered.com/public/css/styles_gamev5.css' rel='stylesheet' type='text/css'><div class='game_area_purchase_game' style='width: 600px; margin-top: 15px;'><h1>" + localized_strings[language].buy_wishlist + "</h1><p class='package_contents'><b>" + localized_strings[language].bundle.includes.replace("(__num__)", items) + ":</b> " + gamelist + "</p><div class='game_purchase_action'><div class='game_purchase_action_bg'><div class='game_purchase_price price'>" + total + "</div><div class='btn_addtocart'><div class='btn_addtocart_left'></div><a class='btn_addtocart_content' onclick='document.forms[\"add_to_cart_all\"].submit();' href='#cartall' id='cartall'>" + localized_strings[language].add_to_cart + "</a><div class='btn_addtocart_right'></div></div></div></div></div></div>");
	});
}

function add_remove_from_wishlist_button(appid) {
	if (is_signed_in()) {
		$(".demo_area_button").find("p").append(" (<span id='es_remove_from_wishlist' style='text-decoration: underline; cursor: pointer;'>" + localized_strings[language].remove + "</span>)");
		$("#es_remove_from_wishlist").click(function() { remove_from_wishlist(appid); });
	}
}

function empty_wishlist(e) {
	var conf_text = (e.data.empty_owned_only) ? "Are you sure you want to remove games you own from your wishlist?\n\nThis action cannot be undone!" : "Are you sure you want to empty your wishlist?\n\nThis action cannot be undone!"
	var conf = confirm(conf_text);
	if (conf) {
		var wishlist_class = (e.data.empty_owned_only) ? ".wishlistRow.es_highlight_owned" : ".wishlistRow"
		var deferreds = $(wishlist_class).map(function(i, $obj) {
			var deferred = new $.Deferred();
			var appid = get_appid_wishlist($obj.id),
				http = new XMLHttpRequest(),
				profile = $(".playerAvatar a")[0].href.replace("http://steamcommunity.com/", "");

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
}

function remove_from_wishlist(appid) {
	var http = new XMLHttpRequest(),
		profile = $(".user_avatar")[0].href.replace("http://steamcommunity.com/", "");

	http.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			location.reload();
		}
	};

	http.open('POST', "http://steamcommunity.com/" + profile + "/wishlist/", true);
	http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	http.send("action=remove&appid=" + encodeURIComponent(appid));
}

function pack_split(node, ways) {
	var price_text = $(node).find(".discount_final_price").html();
	var at_end, comma, places = 2;
	if (price_text == null) { price_text = $(node).find(".game_purchase_price").html(); }
	if (price_text.match(",")) {
		at_end = true;
		comma = true;
		price_text = price_text.replace(",", ".");
	}
	var currency_symbol = price_text.match(/(?:R\$|\$|€|£|pуб)/)[0];
	if (currency_symbol.match(/R\$/)) { at_end = false; }
	if (currency_symbol.match(/pуб/)) { at_end = true; places = 0}
	var price = (Number(price_text.replace(/[^0-9\.]+/g,""))) / ways;
	price = (Math.ceil(price * 100) / 100);
	price_text = formatMoney(price, places, currency_symbol, ",", comma ? "," : ".", at_end);
	$(node).find(".btn_addtocart").before("<div class='game_purchase_discount' style='width: 60px;background-color:black;'><div class='discount_prices'><div class='es_each_price'>" + price_text + "</div><div class='es_each'>"+localized_strings[language].each+"</div></div></div>");
}

function add_4pack_breakdown() {
	$(".game_area_purchase_game_wrapper").each(function() {
		if ($(this).is(":contains('Two Pack')")) { pack_split(this, 2); }
		if ($(this).is(":contains('Two-pack')")) { pack_split(this, 2); }
		if ($(this).is(":contains('Friend Pack')")) { pack_split(this, 2); }
		if ($(this).is(":contains('2-Pack')")) { pack_split(this, 2); }
		if ($(this).is(":contains('3-Pack')")) { pack_split(this, 3); }
		if ($(this).is(":contains('3 pack')")) { pack_split(this, 3); }
		if ($(this).is(":contains('Team Pack')")) { pack_split(this, 3); }
		if ($(this).is(":contains('4-pack')")) { pack_split(this, 4); }
		if ($(this).is(":contains('4-Pack')")) { pack_split(this, 4); }
		if ($(this).is(":contains('4 Pack')")) { pack_split(this, 4); }
		if ($(this).is(":contains('Four Pack')")) { pack_split(this, 4); }
		if ($(this).is(":contains('Four pack')")) { pack_split(this, 4); }
		if ($(this).is(":contains('Four-Pack')")) { pack_split(this, 4); }
		if ($(this).is(":contains('Clan Pack')")) { pack_split(this, 4); }
		if ($(this).is(":contains('5 Pack')")) { pack_split(this, 5); }
		if ($(this).is(":contains('6-pack')")) { pack_split(this, 6); }
		if ($(this).is(":contains('6-Pack')")) { pack_split(this, 6); }
	});
}

function add_package_info_button() {
	storage.get(function(settings) {
		if (settings.show_package_info === undefined) { settings.show_package_info = false; storage.set({'show_package_info': settings.show_package_info}); }
		if (settings.show_package_info) {
			$(".game_area_purchase_game_wrapper").each(function() {
				if ($(this).find(".btn_packageinfo").length == 0) {
					var htmlstr = '<div class="game_purchase_action_bg"><div class="btn_addtocart btn_packageinfo"><div class="btn_addtocart_left"></div>';
					var subid = $(this).find("input[name=subid]").val();
					htmlstr += '<a class="btn_addtocart_content" href="http://store.steampowered.com/sub/' + subid + '/">' + localized_strings[language].package_info + '</a>';
					htmlstr += '<div class="btn_addtocart_right"></div></div></div>';
					$(this).find(".game_purchase_action").prepend(htmlstr);
				}
			});
		}
	});
}

function add_steamchart_info(appid) {
	if ($(".game_area_dlc_bubble").length == 0) {
		storage.get(function(settings) {
			if (settings.show_steamchart_info === undefined) { settings.show_steamchart_info = true; storage.set({'show_steamchart_info': settings.show_steamchart_info}); }
			if (settings.show_steamchart_info) {
				get_http("http://api.enhancedsteam.com/charts/?appid=" + appid, function (txt) {
					if (txt.length > 0) {
						var data = JSON.parse(txt);
						if (data["chart"]) {
							var html = '<div id="steam-charts" class="game_area_description"><h2>' + localized_strings[language].charts.current + '</h2>';
							html += '<div id="chart-heading" class="chart-content"><div id="chart-image"><img src="http://cdn4.steampowered.com/v/gfx/apps/' + appid + '/capsule_184x69.jpg" width="184" height="69"></div><div class="chart-stat">';
							html += '<span class="num">' + escapeHTML(data["chart"]["current"]) + '</span><br>' + localized_strings[language].charts.playing_now + '</div><div class="chart-stat">';
							html += '<span class="num">' + escapeHTML(data["chart"]["peaktoday"]) + '</span><br>' + localized_strings[language].charts.peaktoday + '</div><div class="chart-stat">';
							html += '<span class="num">' + escapeHTML(data["chart"]["peakall"]) + '</span><br>' + localized_strings[language].charts.peakall + '</div><span class="chart-footer">Powered by <a href="http://steamcharts.com/app/' + appid + '" target="_blank">SteamCharts.com</a></span></div></div>';

							$("#game_area_sys_req").before(html);
						}
					}
				});
			}
		});
	}
}

function send_age_verification() {
	storage.get(function(settings) {
		if (settings.send_age_info === undefined) { settings.send_age_info = true; storage.set({'send_age_info': settings.send_age_info}); }
		if (settings.send_age_info) {
			document.getElementsByName("ageYear")[0].value="1955";
			document.getElementsByClassName("btn_checkout_green")[0].click();
		}
	});
}

function add_wallet_balance_to_header() {
	$("#global_action_menu").append("<div id='es_wallet' style='text-align:right; padding-right:12px; line-height: normal;'>");
	$("#es_wallet").load('http://store.steampowered.com #header_wallet_ctn');
}

// Adds a link to options to the global menu (where is Install Steam button)
function add_enhanced_steam_options() {
	$dropdown = $("<span class=\"pulldown global_action_link\" id=\"enhanced_pulldown\">Enhanced Steam</span>");
	$dropdown_options_container = $("<div class=\"popup_block\"><div class=\"popup_body popup_menu\"></div></div>");
	$dropdown_options = $dropdown_options_container.find(".popup_body");
	$dropdown_options.css("display", "none");

	// remove menu if click anywhere but on "Enhanced Steam". Commented out bit is for clicking on menu won't make it disappear either.
	$('body').bind('click', function(e) {
		if(/*$(e.target).closest(".popup_body").length == 0 && */$(e.target).closest("#enhanced_pulldown").length == 0) {
			if ($dropdown_options.css("display") == "block" || $dropdown_options.css("display") == "") {
				$dropdown_options.css("display", "none");
			}
		}
	});

	$dropdown.click(function(){
		$dropdown_options.toggle();
	});

	$options_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\""+chrome.extension.getURL("options.html")+"\">"+localized_strings[language].options+"</a>")
	$website_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"http://www.enhancedsteam.com\">" + localized_strings[language].website + "</a>");
	$contribute_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//github.com/jshackles/Enhanced_Steam\">" + localized_strings[language].contribute + "</a>");
	$bug_feature_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//github.com/jshackles/Enhanced_Steam/issues\">" + localized_strings[language].bug_feature + "</a>");
	$donation_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//enhancedsteam.com/donate.php\">" + localized_strings[language].donate + "</a>");
	$group_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//" + localized_strings[language].official_group_url + "\">" + localized_strings[language].official_group + "</a>");

	$clear_cache_link = $("<a class=\"popup_menu_item\" href=\"\">" + localized_strings[language].clear_cache + "</a>");
	$clear_cache_link.click(function(){
		localStorage.clear();
		sessionStorage.clear();
		location.reload();
	});

	$spacer = $("<div class=\"hr\"></div>");

	$dropdown_options.append($options_link);
	$dropdown_options.append($clear_cache_link);
	$dropdown_options.append($spacer.clone());
	$dropdown_options.append($contribute_link);
	$dropdown_options.append($bug_feature_link);
	$dropdown_options.append($spacer.clone());
	$dropdown_options.append($website_link);
	$dropdown_options.append($group_link);
	$dropdown_options.append($donation_link);

	$("#global_action_menu")
		.before($dropdown)
		.before($dropdown_options_container);
}

function add_fake_country_code_warning() {
	storage.get(function(settings) {
		if (settings.showfakeccwarning === undefined) { settings.showfakeccwarning = true; storage.set({'showfakeccwarning': settings.showfakeccwarning}); }
		if (settings.showfakeccwarning) {
			var LKGBillingCountry = getCookie("LKGBillingCountry");
			var fakeCC = getCookie("fakeCC");

			if (fakeCC && LKGBillingCountry && LKGBillingCountry.length == 2 && LKGBillingCountry != fakeCC) {
				$("#global_header").after('<div class=content style="background-image: url( ' + chrome.extension.getURL("img/red_banner.png") + '); height: 21px; text-align: center; padding-top: 8px;">' + localized_strings[language].using_store.replace("__current__", fakeCC) + '  <a href="#" id="reset_fake_country_code">' + localized_strings[language].using_store_return.replace("__base__", LKGBillingCountry) + '</a></div>');
				$("#page_background_holder").css("top", "135px");
				$("#reset_fake_country_code").click(function(e) {
					e.preventDefault();
					document.cookie = 'fakeCC=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;';
					window.location.replace(window.location.href.replace(/[?&]cc=.{2}/, ""));
				})
			}
		}
	});
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

// Removes the About menu item at the top of each page
function remove_about_menu() {
	storage.get(function(settings) {
		if (settings.hideaboutmenu === undefined) { settings.hideaboutmenu = false; storage.set({'hideaboutmenu': settings.hideaboutmenu}); }
		if (settings.hideaboutmenu) {
			$('a[href$="http://store.steampowered.com/about/"]').replaceWith('');
		}
	});
}

function remove_community_new() {
	storage.get(function(settings) {
		if (settings.hidecommunitynew === undefined) { settings.hidecommunitynew = true; storage.set({'hidecommunitynew': settings.hidecommunitynew}); }
		if (settings.hidecommunitynew) {
			$('.menuitem_new').replaceWith('');
		}
	});
}

function add_header_links() {
	var supernav_content = document.querySelectorAll("#supernav .supernav_content");
	if ($("#supernav").length > 0) {
		$("a[href='http://steamcommunity.com/workshop/'][class$='submenuitem']").after('<a class="submenuitem" href="http://forums.steampowered.com/forums/" target="_blank">' + localized_strings[language].forums + '</a>');
		$("a[href$='/friends/'][class$='submenuitem']").before('<a class="submenuitem" href="http://steamcommunity.com/my/games/">' + localized_strings[language].games + '</a>');
		$("a[href$='/inventory/'][class$='submenuitem']").after('<a class="submenuitem" href="http://steamcommunity.com/my/recommended/">' + localized_strings[language].reviews + '</a>');
	}
}

function replace_account_name() {
	storage.get(function(settings) {
		if (settings.replaceaccountname === undefined) { settings.replaceaccountname = false; storage.set({'replaceaccountname': settings.replaceaccountname}); }
		if (settings.replaceaccountname) {
			var new_account_name = $("#global_header .username").text().trim()+"'s account";
			$("#account_pulldown").text(new_account_name);
			if ($(".page_title").children(".blockbg").text().trim()==document.title&&document.title!="") {
				$(".page_title").children(".blockbg").text(new_account_name);
				document.title=new_account_name;
			}
		}
	});
}

// Adds a "Library" menu to the main menu of Steam
function add_library_menu() {
	storage.get(function(settings) {
		if (settings.showlibrarymenu === undefined) { settings.showlibrarymenu = true; storage.set({'showlibrarymenu': settings.showlibrarymenu}); }
		if (settings.showlibrarymenu) {
			var library_url = (window.location.host == "store.steampowered.com") ? "#library" : "http://store.steampowered.com/#library";
			$(".menuitem[href='http://steamcommunity.com/']").before("<a class='menuitem' href='" + library_url + "' id='es_library'>" + localized_strings[language].library_menu + "</a>");

			var showAppInLibrary = function() {
				var appid = window.location.hash.match(/\d+/);
				if (appid && ! isNaN(parseInt(appid[0]))) {
					settings.librarylastappid = appid[0];
					storage.set({'librarylastappid': appid[0]});

					var selectAppInList = function() {
						$(".es_library_app[data-appid='" + $("#es_library_list").data("appid-selected") + "']").removeClass('es_library_selected');
						$(".es_library_app[data-appid='" + settings.librarylastappid + "']").addClass('es_library_selected');
						$("#es_library_list").data("appid-selected", settings.librarylastappid);
						// scroll if found in the app list
						if ($(".es_library_app[data-appid='" + settings.librarylastappid + "']").length != 0) {
							$(".es_library_app[data-appid='" + settings.librarylastappid + "']")[0].scrollIntoView();
						}
					}

					if ($("#es_library_content").length == 0) {
						show_library().then(function() { selectAppInList(); library_show_app(appid[0]) });
					}
					else {
						selectAppInList();
						library_show_app(appid[0]);
					}
				}
			};

			if (window.location.hash == "#library") {
				show_library();
			}
			else if (window.location.hash.startsWith("#library/app/")) {
				showAppInLibrary();
			}

			$(".es_library_app").bind("click", function() {
				showAppInLibrary();
			});

			$(window).bind("hashchange", function() {
				if (window.location.hash == "#library") {
					show_library();
				}
				else if (window.location.hash.startsWith("#library/app/")) {
					showAppInLibrary();
				}
			});
		}
	});
}

function show_library() {
	var deferred = $.Deferred();

	// change page title
	document.title = 'Steam Library';

	// Remove content divs
	$("#es_library_list").remove();
	$("#es_library_right").remove();
	$("#es_library_background_filter").remove();
	$("#es_library_background").remove();
	$("#store_header").remove();
	$("#main").remove();
	$("#footer").remove();
	$("#game_background_holder").remove();
	$("#modalBG").remove();
	$("#page_background_holder").remove();

	// Create Library divs
	var es_library = $("<div id='es_library_content'></div>");
	$("#global_header").after(es_library);
	es_library.append("<div id='es_library_background'></div>");
	es_library.append("<div id='es_library_background_filter'></div>");
	es_library.append("<div id='es_library_right'></div>");
	es_library.append("<div id='es_library_search' style='display: none;'></div>");
	es_library.append("<div id='es_library_list' data-appid-selected='undefined'><div id='es_library_list_loading'><img src='http://cdn.steamcommunity.com/public/images/login/throbber.gif'>"+ localized_strings[language].loading +"</div></div>");


	storage.get(function(settings) {
		if (settings.showlibraryf2p === undefined) { settings.showlibraryf2p = true; storage.set({'showlibraryf2p': settings.showlibraryf2p}); }

		var showlibraryf2p = 1;
		showlibraryf2p = (settings.showlibraryf2p) ? 1 : 0;

		// Call EnhancedSteam API Wrapper
		get_http('http://api.enhancedsteam.com/steamapi/GetOwnedGames/?steamid=' + is_signed_in() + '&include_played_free_games=' + showlibraryf2p, function (txt) {
			var data = JSON.parse(txt);
			if (data.response && Object.keys(data.response).length > 0) {
				library_all_games = data.response.games;

				//sort entries
				library_all_games.sort(function(a,b) {
					if ( a.name == b.name ) return 0;
					return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
				});

				var refresh_games_list = function(filter_name) {
					$("#es_library_list").html("");

					var last_app_id_in_games = false;
					var filtered_games = [];

					$.each(library_all_games, function(i, obj) {
						if (obj.name && (filter_name === undefined || new RegExp(filter_name, "i").test(obj.name))) {
							if (obj.name.length > 34) {
								obj.name = obj.name.substring(0,34) + "...";
							}
							var app_html = "<a href='#library/app/" + obj.appid + "' data-appid='" + obj.appid + "' data-playtime-forever='" + obj.playtime_forever + "' class='es_library_app'>";
							if (obj.img_icon_url.length != 0) {
								app_html += "<img src='http://media.steampowered.com/steamcommunity/public/images/apps/" + obj.appid + "/" + obj.img_icon_url + ".jpg' height=16 style='vertical-align: middle;'>&nbsp;";
							}
							$("#es_library_list").append(app_html + obj.name + "</a>");

							if (settings.librarylastappid == obj.appid) {
								last_app_id_in_games = true;
							}

							filtered_games.push(obj);
						}
					});

					if (! last_app_id_in_games && filtered_games.length > 0) {
						settings.librarylastappid = filtered_games[0].appid;
						storage.set({'librarylastappid': settings.librarylastappid});
					}

					$(".es_library_app[data-appid='" + settings.librarylastappid + "']").addClass('es_library_selected');
					$("#es_library_list").data("appid-selected", settings.librarylastappid);
					window.location.hash = "library/app/" + settings.librarylastappid;
				};

				refresh_games_list();

				$("#es_library_search").append("<input type='text' id='es_library_search_input' placeholder='Search'>");
				$("#es_library_search").show();

				$("#es_library_search_input").keyup(function(e) {
					if (e.which != 13) {
						if (! $(this).val()) {
							refresh_games_list();
						}
						else {
							refresh_games_list($(this).val());
						}
					}
				});

				$("#es_library_list_loading").remove();

				deferred.resolve();
			}
			else {
				$("#es_library_list_loading").remove();
				es_library.html("<div id='es_library_private_profile'>" + localized_strings[language].library.private_profile + "</div>");
				deferred.reject();
			}
		});
	});

	return deferred.promise();
}

function library_show_app(appid) {
	$("#es_library_background").removeAttr("style");
	$("#es_library_right").html("<div id='es_library_list_loading'><img src='http://cdn.steamcommunity.com/public/images/login/throbber.gif'>"+ localized_strings[language].loading +"</div>");

	get_http('http://store.steampowered.com/api/appdetails/?appids=' + appid, function (txt) {
		var app_data = JSON.parse(txt);

		if (app_data[appid].success && appid == $('.es_library_selected').data('appid')) {

			// fill background div with screenshot
			var screenshotID = Math.floor(Math.random() * app_data[appid].data.screenshots.length - 1) + 1;
			$('#es_library_background').css('background', 'url(' + app_data[appid].data.screenshots[screenshotID].path_full + ') 0 0 no-repeat');
			$('#es_library_background').css('background-size', 'cover');

			// fill title div with icon and title
			var el_title = $("<div id='es_library_title'></div>");
			$("#es_library_right").append(el_title);
			el_title.append("<img src='" + $(".es_library_app[data-appid='" + appid + "']").children("img").attr("src") + "' height=32>&nbsp;&nbsp;<span style='font-size: 32px; color: #d1d0cc;'>" + app_data[appid].data.name + "</span>");

			if (app_data[appid].data.genres && app_data[appid].data.genres.length > 0) {
				var genres = [];
				for (var i = 0; i < app_data[appid].data.genres.length; i++) {
					genres.push(app_data[appid].data.genres[i].description);
				}
				el_title.append("<br><span style='color: grey;'>Genres: " + genres.join(" / ") + "</span>");
			}

			if (app_data[appid].data.categories && app_data[appid].data.categories.length > 0) {
				var categories = [];
				for (var i = 0; i < app_data[appid].data.categories.length; i++) {
					categories.push(app_data[appid].data.categories[i].description);
				}
				el_title.append("<br><span style='color: grey;'>Categories: " + categories.join(" / ") + "</span>");
			}

			// fill "playnow" div
			$("#es_library_right").append("<br><div id='es_library_app_playnow'></div>");
			var el_playnow = $("#es_library_app_playnow");

			el_playnow.append("<a href='steam://run/" + appid + "'><img id='play_button' name='play_button' src='" + chrome.extension.getURL("img/play_off.png") + "'></a>");
			$("#play_button").hover(
				function () { $(this).attr('src', chrome.extension.getURL("img/play_on.png")); }, function () { $(this).attr('src', chrome.extension.getURL("img/play_off.png")); }
			);
			var playtime_forever = $(".es_library_app[data-appid='" + appid + "']").data("playtime-forever");
			if (playtime_forever != "undefined") {
				playtime_forever = parseInt(playtime_forever);
				el_playnow.append("&nbsp;&nbsp;<span style='font-size: 14px; color: #FFF;'>");
				if (playtime_forever < 60) {
					el_playnow.append(playtime_forever + " MINUTES PLAYED");
				} else {
					el_playnow.append(Math.floor(playtime_forever / 60) + " HOURS PLAYED");
				}
				el_playnow.append("</span>");
			}

			var el_hub_link = $("<div id='es_library_hub_link' class='btn_darkblue_white_innerfade'></div>");
			$("#es_library_right").append(el_hub_link);
			el_hub_link.append("<a href='http://steamcommunity.com/app/" + appid + "/'>COMMUNITY HUB</a>");

			$("#es_library_right").append("<br><div id='es_library_app_left'></div><div id='es_library_app_right'></div>");

			// achievements etc. can be loaded later
			$("#es_library_list_loading").remove();

			// fill achievements div

			if (app_data[appid].data.achievements && app_data[appid].data.achievements.total > 0) {
				$("#es_library_app_left").append($("<div class='es_library_app_container' id='es_library_app_achievements_container' style='display: none;'><div id='es_library_app_achievements'></div></div>"));

				// TODO: spam Valve so we can do just 1 request for achievements
				get_http("http://api.enhancedsteam.com/steamapi/GetPlayerAchievements/?steamid=" + is_signed_in() + "&appid=" + appid, function(txt) {
					var player_achievements = JSON.parse(txt);

					if (player_achievements.playerstats.achievements) {
						get_http("http://api.enhancedsteam.com/steamapi/GetSchemaForGame/?steamid=" + is_signed_in() + "&appid=" + appid + "&language=" + language, function(txt) {
							var achievements_schema = JSON.parse(txt).game.availableGameStats.achievements;
							player_achievements = player_achievements.playerstats.achievements;

							el_achievements_cont = $("#es_library_app_achievements");
							el_achievements_cont.append("<h2>Achievements</h2>");

							var achievements = {};
							var locked_achievements_count = 0;

							for (var i = 0; i < player_achievements.length; i++) {
								achievements[player_achievements[i].apiname] = { achieved: player_achievements[i].achieved };
								if (player_achievements[i].achieved == 0) {
									locked_achievements_count++;
								}
							}

							for (var i = 0; i < achievements_schema.length; i++) {
								$.extend(achievements[achievements_schema[i].name], achievements_schema[i]);
							}

							el_achievements_cont.append("<div style='margin-bottom: 10px;'>You have unlocked " + (player_achievements.length - locked_achievements_count) + "/" + player_achievements.length + " (" + (Math.ceil((player_achievements.length - locked_achievements_count) / player_achievements.length * 100)) + "%)</div>");

							if (locked_achievements_count > 0) {
								el_achievements_cont.append("<div style='margin-bottom: 10px;'>Locked achievements:</div>");

								var shown_locked_achievements_count = 0;

								$.each(achievements, function(key, achievement) {
									if (achievement.achieved == 0) {
										var displayName = (achievement.displayName) ? achievement.displayName.replace(/'/g, "&#39;") + "\n" : "";
										var description = (achievement.description) ? achievement.description.replace(/'/g, "&#39;") : "";
										el_achievements_cont.append("<img src='" + achievement.icongray + "' title='" + displayName + description + "' alt='" + displayName + description + "' class='btn_grey_white_innerfade' style='padding: 4px; margin-right: 10px; width: 32px; height: 32px; cursor: default;'>");
										shown_locked_achievements_count++;
									}

									if (shown_locked_achievements_count == 10) {
										if (locked_achievements_count > shown_locked_achievements_count) {
											el_achievements_cont.append("<a href='http://steamcommunity.com/my/stats/appid/" + appid + "/achievements' class='btn_grey_white_innerfade' style='width: 32px; height: 32px; line-height: 32px; padding: 4px; display: inline-block; vertical-align: top; text-align: center;'>+" + (locked_achievements_count - shown_locked_achievements_count) + "</a>");
										}
										return false;
									}
								});
							}
							else {
								el_achievements_cont.append("You've unlocked every single achievement. Congratulations!");
							}

							el_achievements_cont.append("<div><a href='http://steamcommunity.com/my/stats/appid/" + appid + "/achievements' class='btn_grey_white_innerfade' style='padding: 4px; margin-top: 10px;'>VIEW ALL ACHIEVEMENTS</a></div>");

							$("#es_library_app_achievements_container").show();
						});
					}
				});
			}

			// fill news div

			get_http("http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=" + appid + "&maxlength=500&count=3", function(txt) {
				var data = JSON.parse(txt);

				if (data.appnews.newsitems && data.appnews.newsitems.length > 0) {
					$("#es_library_app_left").append($("<div class='es_library_app_container' id='es_library_app_news_container' style='display: none;'><div id='es_library_app_news'></div></div>"));
					el_news_cont = $("#es_library_app_news");
					el_news_cont.append("<h2>News</h2>");

					var news = data.appnews.newsitems;

					for (var i = 0; i < news.length; i++) {
						el_news_cont.append("<div class='es_library_app_news_post'>");
						el_news_cont.append("<h3><a href='" + news[i].url + "'>" + news[i].title  + "</a></h3>");
						el_news_cont.append("<span style='color: grey;'>" + new Date(news[i].date * 1000) + " - " + news[i].feedlabel + "</span>")
						el_news_cont.append("<br>" + news[i].contents);
						el_news_cont.append("<br><a href='" + news[i].url + "' style='text-decoration: underline;'>Read More</a></h3>");
						el_news_cont.append("</div>");
					}

					el_news_cont.append("<div><a href='http://store.steampowered.com/news/?appids=" + appid + "' class='btn_grey_white_innerfade' style='padding: 4px; margin-top: 10px;'>VIEW ALL NEWS</a></div>");

					$("#es_library_app_news_container").show();
				}
			});

			// Links in the right sidebar

			$("#es_library_app_right").append($("<div class='es_library_app_container'><div id='es_library_app_links'></div></div>"));
			$("#es_library_app_links").append("<h2>LINKS</h2><ul></ul>");
			if (app_data[appid].data.achievements && app_data[appid].data.achievements.total > 0) {
				$("#es_library_app_links ul").append("<li><a href='http://steamcommunity.com/my/stats/appid/" + appid + "/achievements'>Achievements</a></li>");
			}
			$("#es_library_app_links ul").append("<li><a href='http://store.steampowered.com/app/" + appid + "/'>Store Page</a></li>");
			$("#es_library_app_links ul").append("<li><a href='http://store.steampowered.com/news/?appids=" + appid + "'>News</a></li>");
			$("#es_library_app_links ul").append("<li><a href='http://steamcommunity.com/app/" + appid + "/'>Community Hub</a></li>");
			$("#es_library_app_links ul").append("<li><a href='http://steamcommunity.com/app/" + appid + "/discussions'>Forums</a></li>");
			$("#es_library_app_links ul").append("<li><a href='http://steamcommunity.com/app/" + appid + "/guides'>Community Guides</a></li>");
			$("#es_library_app_links ul").append("<li><a href='http://steamcommunity.com/app/" + appid + "/images'>Artwork</a></li>");
			$("#es_library_app_links ul").append("<li><a href='http://steamcommunity.com/actions/Search?T=ClanAccount&K=" + encodeURIComponent(app_data[appid].data.name) + "'>Related Groups</a></li>");
			$("#es_library_app_links ul").append("<li><a href='http://store.steampowered.com/recommended/recommendgame/" + appid + "'>Recommend</a></li>");
			$("#es_library_app_links ul").append("<li><a href='https://support.steampowered.com/kb_article.php?appid=" + appid + "'>Support</a></li>");
			if (app_data[appid].data.website) {
				$("#es_library_app_links ul").append("<li><a href='" + app_data[appid].data.website + "'>Website</a></li>");
			}
		}
		else if(appid == $('.es_library_selected').data('appid')) {
			$("#es_library_list_loading").html("App ID " + appid + " wasn't found.");
		}
	});
}

// If app has a coupon, display message
function display_coupon_message(appid) {
	// get JSON coupon results

	var coupon_date = getValue(appid + "coupon_valid");
	var coupon_date2 = coupon_date.match(/\[date](.+)\[\/date]/);
	coupon_date = new Date(coupon_date2[1] * 1000);

	var coupon_discount_note = getValue(appid + "coupon_discount_note");
	if (coupon_discount_note === null) { coupon_discount_note = ""; }

	$('#game_area_purchase').before($(""+
	"<div class=\"early_access_header\">" +
	"    <div class=\"heading\">" +
	"        <h1 class=\"inset\">" + localized_strings[language].coupon_available + "</h1>" +
	"        <h2 class=\"inset\">" + localized_strings[language].coupon_application_note + "</h2>" +
	"        <p>" + localized_strings[language].coupon_learn_more + "</p>" +
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
	"                <td>" + coupon_discount_note + "</td>" +
	"            </tr>" +
	"            <tr>" +
	"                <td>" +
	"                    <font style=\"color:#A75124;\">" + coupon_date + "</font>" +
	"                </td>" +
	"            </tr>" +
	"        </table>" +
	"    </div>" +
	"</div>"));

	var $price_div = $("[itemtype=\"http://schema.org/Offer\"]"),
		cart_id = $(document).find("[name=\"subid\"]")[0].value,
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
				break;
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
			"        <a class=\"btn_addtocart_content\" href=\"javascript:addToCart( " + cart_id + ");\">" + localized_strings[language].add_to_cart + "</a>" +
			"        <div class=\"btn_addtocart_right\"></div>" +
			"    </div>" +
			"</div>";

	}
}

function show_pricing_history(appid, type) {
	storage.get(function(settings) {
		if (settings.showlowestprice === undefined) { settings.showlowestprice = true; storage.set({'showlowestprice': settings.showlowestprice}); }
		if (settings.showlowestprice_region === undefined) { settings.showlowestprice_region = "us"; storage.set({'showlowestprice_region': settings.showlowestprice_region}); }
		if (settings.showallstores === undefined) { settings.showallstores = true; chrome.storage.sync.set({'showallstores': settings.showallstores}); }
		if (settings.stores === undefined) { settings.stores = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]; chrome.storage.sync.set({'stores': settings.stores}); }
		if (settings.showlowestprice) {

			// Get List of stores we're searching for
			var storestring = "";
			if (settings.stores[0]) { storestring += "steam,"; }
			if (settings.stores[1]) { storestring += "amazonus,"; }
			if (settings.stores[2]) { storestring += "impulse,"; }
			if (settings.stores[3]) { storestring += "gamersgate,"; }
			if (settings.stores[4]) { storestring += "greenmangaming,"; }
			if (settings.stores[5]) { storestring += "gamefly,"; }
			if (settings.stores[6]) { storestring += "origin,"; }
			if (settings.stores[7]) { storestring += "uplay,"; }
			if (settings.stores[8]) { storestring += "indiegalastore,"; }
			if (settings.stores[9]) { storestring += "gametap,"; }
			if (settings.stores[10]) { storestring += "gamesplanet,"; }
			if (settings.stores[11]) { storestring += "getgames,"; }
			if (settings.stores[12]) { storestring += "desura,"; }
			if (settings.stores[13]) { storestring += "gog,"; }
			if (settings.stores[14]) { storestring += "dotemu,"; }
			if (settings.stores[15]) { storestring += "beamdog,"; }
			if (settings.stores[16]) { storestring += "adventureshop,"; }
			if (settings.stores[17]) { storestring += "nuuvem,"; }
			if (settings.stores[18]) { storestring += "shinyloot,"; }
			if (settings.stores[19]) { storestring += "dlgamer,"; }
			if (settings.stores[20]) { storestring += "humblestore,"; }
			if (settings.stores[21]) { storestring += "indiegamestand,"; }
			if (settings.showallstores) { storestring = "steam,amazonus,impulse,gamersgate,greenmangaming,gamefly,origin,uplay,indiegalastore,gametap,gamesplanet,getgames,desura,gog,dotemu,beamdog,adventureshop,nuuvem,shinyloot,dlgamer,humblestore"; }

			// Get country code from Steam cookie
			var cookies = document.cookie;
			var matched = cookies.match(/fakeCC=([a-z]{2})/i);
			var cc = "us";
			if (matched != null && matched.length == 2) {
				cc = matched[1];
			} else {
				matched = cookies.match(/steamCC(?:_\d+){4}=([a-z]{2})/i);
				if (matched != null && matched.length == 2) {
					cc = matched[1];
				}
			}

			get_http("http://api.enhancedsteam.com/pricev2/?search=" + type + "/" + appid + "&stores=" + storestring + "&cc=" + cc, function (txt) {
                var data = JSON.parse(txt);
                if (data) {
                    var activates = "", line1 = "", line2 = "", line3 = "", html, recorded, currency_symbol, comma = false, at_end = false;

					switch (data[".meta"]["currency"]) {
						case "GBP":
							currency_symbol = "£";
							break;
						case "EUR":
							currency_symbol = "€";
							comma = true;
							at_end = true;
							break;
						case "BRL":
							currency_symbol = "R$ ";
							comma = true;
							break;
						default:
							currency_symbol = "$";
					}

        			// "Lowest Price"
					if (data["price"]) {
                        if (data["price"]["drm"] == "steam") {
                        	activates = "(<b>" + localized_strings[language].activates + "</b>)";
                    		if (data["price"]["store"] == "Steam") {
                    			activates = "";
                    		}
                    	}

                        line1 = localized_strings[language].lowest_price + ': ' + formatMoney(escapeHTML(data["price"]["price"].toString()), 2, currency_symbol, ",", comma ? "," : ".", at_end) + ' at <a href="' + escapeHTML(data["price"]["url"].toString()) + '" target="_blank">' + escapeHTML(data["price"]["store"].toString()) + '</a> ' + activates + ' (<a href="' + escapeHTML(data["urls"]["info"].toString()) + '" target="_blank">' + localized_strings[language].info + '</a>)';
                    }

					// "Historical Low"
					if (data["lowest"]) {
                        recorded = new Date(data["lowest"]["recorded"]*1000);
                        line2 = localized_strings[language].historical_low + ': ' + formatMoney(escapeHTML(data["lowest"]["price"].toString()), 2, currency_symbol, ",", comma ? "," : ".", at_end) + ' at ' + escapeHTML(data["lowest"]["store"].toString()) + ' on ' + recorded.toDateString() + ' (<a href="' + escapeHTML(data["urls"]["history"].toString()) + '" target="_blank">' + localized_strings[language].info + '</a>)';
                    }

					html = "<div class='game_purchase_area_friends_want' style='padding-top: 5px; height: 35px; border-top: 1px solid #4d4b49; border-left: 1px solid #4d4b49; border-right: 1px solid #4d4b49;' id='enhancedsteam_lowest_price'><div class='gift_icon' style='margin-top: -9px;'><img src='" + chrome.extension.getURL("img/line_chart.png") + "'></div>";

					// "Number of times this game has been in a bundle"
					if (data["bundles"]["count"] > 0) {
						line3 = "<br>" + localized_strings[language].bundle.bundle_count + ": " + data["bundles"]["count"] + ' (<a href="' + escapeHTML(data["urls"]["bundle_history"].toString()) + '" target="_blank">' + localized_strings[language].info + '</a>)';
						html = "<div class='game_purchase_area_friends_want' style='padding-top: 5px; height: 50px; border-top: 1px solid #4d4b49; border-left: 1px solid #4d4b49; border-right: 1px solid #4d4b49;' id='enhancedsteam_lowest_price'><div class='gift_icon' style='margin-top: -4px;'><img src='" + chrome.extension.getURL("img/line_chart.png") + "'></div>";
					}

					if (line1 && line2) {
						$("#game_area_purchase").before(html + line1 + "<br>" + line2 + line3);
					}

					if (data["bundles"]["active"].length > 0) {
						var length = data["bundles"]["active"].length;
						for (var i = 0; i < length; i++) {
							var enddate;
							if (data["bundles"]["active"][i]["expiry"]) {
								enddate = new Date(data["bundles"]["active"][i]["expiry"]*1000);
							}
							var currentdate = new Date().getTime();
							if (!enddate || currentdate < enddate) {
								purchase = '<div class="game_area_purchase_game_wrapper"><div class="game_area_purchase_game"><div class="game_area_purchase_platform"></div><h1>' + localized_strings[language].buy + ' ' + data["bundles"]["active"][i]["page"] + ' ' + data["bundles"]["active"][i]["title"] + '</h1>';
								if (enddate) purchase += '<p class="game_purchase_discount_countdown">' + localized_strings[language].bundle.offer_ends + ' ' + enddate + '</p>';
								purchase += '<p class="package_contents"><b>' + localized_strings[language].bundle.includes.replace("(__num__)", data["bundles"]["active"][i]["games"].length) + ':</b> '
								data["bundles"]["active"][i]["games"].forEach(function(entry) {
									purchase += entry + ", ";
								});
								purchase = purchase.replace(/, $/, "");
								purchase += '</p><div class="game_purchase_action"><div class="game_purchase_action_bg"><div class="btn_addtocart btn_packageinfo"><div class="btn_addtocart_left"></div><a class="btn_addtocart_content" href="' + data["bundles"]["active"][i]["details"] + '" target="_blank">' + localized_strings[language].bundle.info + '</a><div class="btn_addtocart_right"></div></div></div><div class="game_purchase_action_bg">';
								if (data["bundles"]["active"][i]["pwyw"] == 0) { if (data["bundles"]["active"][i]["price"] > 0) { purchase += '<div class="game_purchase_price price" itemprop="price">' + formatMoney(escapeHTML(data["bundles"]["active"][i]["price"].toString()), 2, currency_symbol, ",", comma ? "," : ".", at_end) + '</div>'; } }
								purchase += '<div class="btn_addtocart"><div class="btn_addtocart_left"></div>';
								purchase += '<a class="btn_addtocart_content" href="' + data["bundles"]["active"][i]["url"] + '" target="_blank">';
								if (data["bundles"]["active"][i]["pwyw"] == 1) {
									purchase += localized_strings[language].bundle.pwyw;
								} else {
									purchase += localized_strings[language].buy;
								}
								purchase += '</a><div class="btn_addtocart_right"></div></div></div></div></div></div>';
								$("#game_area_purchase").after(purchase);
								
								$("#game_area_purchase").after("<h2 class='gradientbg'>" + localized_strings[language].bundle.header + " <img src='http://cdn3.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></h2>");
							}
						}
					}
                }
        	});
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

			var text = $("#game_area_description").html();
			text += $("#game_area_sys_req").html();
			text += $("#game_area_legal").html();
			text += $(".rightcol").html();

			// Games for Windows Live detection
			if (text.toUpperCase().indexOf("GAMES FOR WINDOWS LIVE") > 0) { gfwl = true; }
			if (text.toUpperCase().indexOf("GAMES FOR WINDOWS - LIVE") > 0) { gfwl = true; }
			if (text.indexOf("Online play requires log-in to Games For Windows") > 0) { gfwl = true; }
			if (text.indexOf("INSTALLATION OF THE GAMES FOR WINDOWS LIVE SOFTWARE") > 0) { gfwl = true; }
			if (text.indexOf("Multiplayer play and other LIVE features included at no charge") > 0) { gfwl = true; }
			if (text.indexOf("www.gamesforwindows.com/live") > 0) { gfwl = true; }

			// Ubisoft Uplay detection
			if (text.toUpperCase().indexOf("CREATION OF A UBISOFT ACCOUNT") > 0) { uplay = true; }
			if (text.toUpperCase().indexOf("UPLAY") > 0) { uplay = true; }

			// Securom detection
			if (text.toUpperCase().indexOf("SECUROM") > 0) { securom = true; }

			// Tages detection
			if (text.indexOf("Tages") > 0) { tages = true; }
			if (text.indexOf("Angebote des Tages") > 0) { tages = false; }
			if (text.indexOf("Tagesangebote") > 0) { tages = false; }
			if (text.indexOf("TAGES") > 0) { tages = true; }
			if (text.indexOf("ANGEBOT DES TAGES") > 0) { tages = false; }
			if (text.indexOf("SOLIDSHIELD") > 0) { tages = true; }
			if (text.indexOf("Solidshield Tages") > 0) { tages = true; }
			if (text.indexOf("Tages Solidshield") > 0) { tages = true; }

			// Stardock account detection
			if (text.indexOf("Stardock account") > 0) { stardock = true; }

			// Rockstar social club detection
			if (text.indexOf("Rockstar Social Club") > 0) { rockstar = true; }
			if (text.indexOf("Rockstar Games Social Club") > 0) { rockstar = true; }

			// Kalypso Launcher detection
			if (text.indexOf("Requires a Kalypso account") > 0) { kalypso = true; }

			// Detect other DRM
			if (text.indexOf("3rd-party DRM") > 0) { otherdrm = true; }
			if (text.indexOf("No 3rd Party DRM") > 0) { otherdrm = false; }

			if (gfwl) {
				$("#game_area_purchase").before('<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">' + localized_strings[language].drm_third_party + ' (Games for Windows Live)</div>');
				otherdrm = false;
			}

			if (uplay) {
				$("#game_area_purchase").before('<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">' + localized_strings[language].drm_third_party + ' (Ubisoft Uplay)</div>');
				otherdrm = false;
			}

			if (securom) {
				$("#game_area_purchase").before('<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">' + localized_strings[language].drm_third_party + ' (SecuROM)</div>');
				otherdrm = false;
			}

			if (tages) {
				$("#game_area_purchase").before('<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">' + localized_strings[language].drm_third_party + ' (Tages)</div>');
				otherdrm = false;
			}

			if (stardock) {
				$("#game_area_purchase").before('<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">' + localized_strings[language].drm_third_party + ' (Stardock Account Required)</div>');
				otherdrm = false;
			}

			if (rockstar) {
				$("#game_area_purchase").before('<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">' + localized_strings[language].drm_third_party + ' (Rockstar Social Club)</div>');
				otherdrm = false;
			}

			if (kalypso) {
				$("#game_area_purchase").before('<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">' + localized_strings[language].drm_third_party + ' (Kalypso Launcher)</div>');
				otherdrm = false;
			}

			if (otherdrm) {
				$("#game_area_purchase").before('<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">' + localized_strings[language].drm_third_party + '</div>');
			}
		}
	});
}

function add_empty_cart_button() {
	addtext = "<a href='javascript:document.cookie=\"shoppingCartGID=0; path=/\";location.reload();' class='btn_checkout_blue' style='float: left; margin-top: 14px;'><div class='leftcap'></div><div class='rightcap'></div>" + localized_strings[language].empty_cart + "</a>";

	var loc = 0;
	xpath_each("//div[contains(@class,'checkout_content')]", function (node) {
		loc = loc + 1;
		if (loc == 2) { $(node).prepend(addtext); }
	});
}

// User profile pages
function add_community_profile_links() {
	if ($("#reportAbuseModal").length > 0) { var steamID = document.getElementsByName("abuseID")[0].value; }
	if (steamID === undefined) { var steamID = document.documentElement.outerHTML.match(/steamid"\:"(.+)","personaname/)[1]; }
	var icon_color='';
	var profile_link_icon_background = '';
	storage.get(function(settings) {
		if (settings.profile_steamgifts === undefined) { settings.profile_steamgifts = true; chrome.storage.sync.set({'profile_steamgifts': settings.profile_steamgifts}); }
		if (settings.profile_steamtrades === undefined) { settings.profile_steamtrades = true; chrome.storage.sync.set({'profile_steamtrades': settings.profile_steamtrades}); }
		if (settings.profile_steamrep === undefined) { settings.profile_steamrep = true; chrome.storage.sync.set({'profile_steamrep': settings.profile_steamrep}); }
		if (settings.profile_steamdbcalc === undefined) { settings.profile_steamdbcalc = true; chrome.storage.sync.set({'profile_steamdbcalc': settings.profile_steamdbcalc}); }
		if (settings.profile_astats === undefined) { settings.profile_astats = true; chrome.storage.sync.set({'profile_astats': settings.profile_astats}); }
		if (settings.profile_backpacktf === undefined) { settings.profile_backpacktf = true; chrome.storage.sync.set({'profile_backpacktf': settings.profile_backpacktf}); }
		if (settings.profile_astatsnl === undefined) { settings.profile_astatsnl = true; chrome.storage.sync.set({'profile_astatsnl': settings.profile_astatsnl}); }
		if (settings.profile_permalink === undefined) { settings.profile_permalink = true; chrome.storage.sync.set({'profile_permalink': settings.profile_permalink}); }
		if (settings.show_profile_link_images === undefined) { settings.show_profile_link_images = "gray"; chrome.storage.sync.set({'show_profile_link_images': settings.show_profile_link_images}); }
		if (settings.show_profile_link_images!="false"){if(settings.show_profile_link_images=="color"){icon_color="_col";profile_link_icon_background=" profile_link_icon_background"}}

		var htmlstr = '';
		if (settings.profile_steamrep) {
			htmlstr += '<div class="profile_count_link"><a href="http://steamrep.com/profiles/' + steamID + '" target="_blank"><span class="count_link_label">SteamRep</span>&nbsp;<span class="profile_count_link_total">';
			if (settings.show_profile_link_images!="false"){htmlstr += '<img src="' + chrome.extension.getURL('img/ico/steamrep'+icon_color+'.png') + '" class="profile_link_icon'+profile_link_icon_background+'">';}
			else {htmlstr += '&nbsp;'}
			htmlstr += '</span></a></div>';
		}
		if (settings.profile_steamdbcalc) {
			htmlstr += '<div class="profile_count_link"><a href="http://steamdb.info/calculator/?player=' + steamID + '" target="_blank"><span class="count_link_label">SteamDB</span>&nbsp;<span class="profile_count_link_total">';
			if (settings.show_profile_link_images!="false"){htmlstr += '<img src="' + chrome.extension.getURL('img/ico/steamdb.png') + '" class="profile_link_icon">';}
			else {htmlstr += '&nbsp;'}
			htmlstr += '</span></a></div>';
		}
		if (settings.profile_steamtrades) {
			htmlstr += '<div class="profile_count_link"><a href="http://www.steamtrades.com/user/id/' + steamID + '" target="_blank"><span class="count_link_label">SteamTrades</span>&nbsp;<span class="profile_count_link_total">';
			if (settings.show_profile_link_images!="false"){htmlstr += '<img src="' + chrome.extension.getURL('img/ico/steamtrades'+icon_color+'.png') + '" class="profile_link_icon">';}
			else {htmlstr += '&nbsp;'}
			htmlstr += '</span></a></div>';
		}
		if (settings.profile_steamgifts) {
			htmlstr += '<div class="profile_count_link"><a href="http://www.steamgifts.com/user/id/' + steamID + '" target="_blank"><span class="count_link_label">SteamGifts</span>&nbsp;<span class="profile_count_link_total">';
			if (settings.show_profile_link_images!="false"){htmlstr += '<img src="' + chrome.extension.getURL('img/ico/steamgifts'+icon_color+'.png') + '" class="profile_link_icon">';}
			else {htmlstr += '&nbsp;'}
			htmlstr += '</span></a></div>';
		}
		if (settings.profile_astats) {
			htmlstr += '<div class="profile_count_link"><a href="http://www.achievementstats.com/index.php?action=profile&playerId=' + steamID + '" target="_blank"><span class="count_link_label">Achievement Stats</span>&nbsp;<span class="profile_count_link_total">';
			if (settings.show_profile_link_images!="false"){htmlstr += '<img src="' + chrome.extension.getURL('img/ico/achievementstats'+icon_color+'.png') + '" class="profile_link_icon">';}
			else {htmlstr += '&nbsp;'}
			htmlstr += '</span></a></div>';
		}
		if (settings.profile_backpacktf) {
			htmlstr += '<div class="profile_count_link"><a href="http://backpack.tf/profiles/' + steamID + '" target="_blank"><span class="count_link_label">Backpack.tf</span>&nbsp;<span class="profile_count_link_total">';
			if (settings.show_profile_link_images!="false"){htmlstr += '<img src="' + chrome.extension.getURL('img/ico/backpacktf'+icon_color+'.png') + '" class="profile_link_icon">';}
			else {htmlstr += '&nbsp;'}
			htmlstr += '</span></a></div>';
		}
		if (settings.profile_astatsnl) {
			htmlstr += '<div class="profile_count_link"><a href="http://astats.astats.nl/astats/User_Info.php?steamID64=' + steamID + '" target="_blank"><span class="count_link_label">AStats.nl</span>&nbsp;<span class="profile_count_link_total">';
			if (settings.show_profile_link_images!="false"){htmlstr += '<img src="' + chrome.extension.getURL('img/ico/astatsnl'+icon_color+'.png') + '" class="profile_link_icon">';}
			else {htmlstr += '&nbsp;'}
			htmlstr += '</span></a></div>';
		}

		if (settings.profile_permalink) {
			htmlstr += "<div class=\"profile_count_link\" id=\"es_permalink_div\"><span id=\"es_permalink_text\">"+localized_strings[language].permalink+"</span>&nbsp;<input type=\"text\" id=\"es_permalink\" value=\"http://steamcommunity.com/profiles/"+steamID+"\" readonly></div>";
		}	
		
		if (htmlstr != '') { $(".profile_item_links").append(htmlstr); }

		if ($(".profile_item_links").length == 0) {
			htmlstr = "<div class='profile_item_links'>" + htmlstr + "</div>";
			$(".profile_rightcol").append(htmlstr);
			$(".profile_rightcol").after("<div style='clear: both'></div>");
		}

		$("#es_permalink").click(function(){
			$(this).select();
		});
	});
}

function appdata_on_wishlist() {
	xpath_each("//a[contains(@class,'btn_visit_store')]", function (node) {
		var app = get_appid(node.href);
		get_http('//store.steampowered.com/api/appdetails/?appids=' + app, function (data) {
			var storefront_data = JSON.parse(data);
			$.each(storefront_data, function(appid, app_data) {
				if (app_data.success) {
					// Add "Add to Cart" button
					if (app_data.data.packages && app_data.data.packages[0]) {
						var htmlstring = '<form name="add_to_cart_' + app_data.data.packages[0] + '" action="http://store.steampowered.com/cart/" method="POST">';
						htmlstring += '<input type="hidden" name="snr" value="1_5_9__403">';
						htmlstring += '<input type="hidden" name="action" value="add_to_cart">';
						htmlstring += '<input type="hidden" name="subid" value="' + app_data.data.packages[0] + '">';
						htmlstring += '</form>';
						$(node).before('</form>' + htmlstring + '<a href="#" onclick="document.forms[\'add_to_cart_' + app_data.data.packages[0] + '\'].submit();" class="btn_visit_store">' + localized_strings[language].add_to_cart + '</a>  ');
					}

					// Adds platform information
					if (app_data.data.platforms) {
						var htmlstring = "";
						var platforms = 0;
						if (app_data.data.platforms.windows) { htmlstring += "<span class='platform_img win'></span>"; platforms += 1; }
						if (app_data.data.platforms.mac) { htmlstring += "<span class='platform_img mac'></span>"; platforms += 1; }
						if (app_data.data.platforms.linux) { htmlstring += "<span class='platform_img linux'></span>"; platforms += 1; }

						if (platforms > 1) { htmlstring = "<span class='platform_img steamplay'></span>" + htmlstring; }

						$(node).parent().parent().parent().find(".bottom_controls").append(htmlstring);
					}
				}
			});
		});
		
		if ($(node).parent().parent().parent().html().match(/discount_block_inline/)) {
			$(node).before("<div id='es_sale_type_" + app + "' style='margin-top: -10px; margin-bottom: -10px; color: #7cb8e4; display: none;'></div>");
			$("#es_sale_type_" + app).load("http://store.steampowered.com/app/" + app + " .game_purchase_discount_countdown:first", function() {
				if ($("#es_sale_type_" + app).html() != "") {
					$("#es_sale_type_" + app).html($("#es_sale_type_" + app).html().replace(/\!(.+)/, "!"));
					$("#es_sale_type_" + app).show();					
				}
			});
		};	
	});
}

var processing = false;
var search_page = 2;

function load_search_results () {
	if (!processing) {
		processing = true;
		var search = document.URL.match(/(.+)\/(.+)/)[2].replace(/\&page=./, "").replace(/\#/g, "&");
		get_http('http://store.steampowered.com/search/results' + search + '&page=' + search_page + '&snr=es', function (txt) {
			var html = $.parseHTML(txt);
			html = $(html).find("a.search_result_row");
			$(".search_result_row").last().after(html);
			search_threshhold = search_threshhold + 1450; //each result is 58px height * 25 results per page = 1450
			search_page = search_page + 1;
			processing = false;
			remove_non_specials();
		});
	}
}

function endless_scrolling() {
	storage.get(function(settings) {
		if (settings.contscroll === undefined) { settings.contscroll = false; storage.set({'contscroll': settings.contscroll}); }
		if (settings.contscroll) {

			$(".search_pagination_right").css("display", "none");
			$(".search_pagination_left").text($(".search_pagination_left").text().trim().match(/(\d+)$/)[0] + " Results");

			$(window).scroll(function() {
				if ($(window).scrollTop() > search_threshhold) {
					load_search_results();
				}
			});
		}
	});
}

function remove_non_specials() {
	if (window.location.search.match(/specials=1/)) {
		$(".search_result_row").each(function(index) {
			if (!($(this).html().match(/<strike>/))) {
				hide_node($(this)[0]);
				if ($(document).height() <= $(window).height()) {
					load_search_results();
				}
			}
		});
	}
}

// Changes Steam Greenlight pages
function hide_greenlight_banner() {
	storage.get(function(settings) {
		if (settings.showgreenlightbanner === undefined) { settings.showgreenlightbanner = false; storage.set({'showgreenlightbanner': settings.showgreenlightbanner}); }
		if (settings.showgreenlightbanner) {
			var banner = $("#ig_top_workshop");
			var breadcrumbs = $(".breadcrumbs");

			var greenlight_info = '<div class="apphub_HeaderTop es_greenlight"><div class="apphub_AppName ellipsis">Greenlight</div><div style="clear: both"></div>'
			greenlight_info += '<div class="apphub_sectionTabs">';
			greenlight_info += '<a class="apphub_sectionTab" id="games_apphub_sectionTab" href="http://steamcommunity.com/workshop/browse/?appid=765&section=items"><span>Games</a>';
			greenlight_info += '<a class="apphub_sectionTab" id="software_apphub_sectionTab" href="http://steamcommunity.com/workshop/browse/?appid=765&section=software"><span>Software</a>';
			greenlight_info += '<a class="apphub_sectionTab" id="concepts_apphub_sectionTab" href="http://steamcommunity.com/workshop/browse/?appid=765&section=concepts"><span>Concepts</a>';
			greenlight_info += '<a class="apphub_sectionTab" id="collections_apphub_sectionTab" href="http://steamcommunity.com/workshop/browse/?appid=765&section=collections"><span>Collections</a>';
			greenlight_info += '<a class="apphub_sectionTab" href="http://steamcommunity.com/workshop/discussions/?appid=765"><span>Discussions</a>';
			greenlight_info += '<a class="apphub_sectionTab" href="http://steamcommunity.com/workshop/about/?appid=765&section=faq"><span>About Greenlight</a>';
			greenlight_info += '<a class="apphub_sectionTab" href="http://steamcommunity.com/workshop/news/?appid=765"><span>News</a>';
			greenlight_info += '</div><div style="top: 28px;position: relative;"><div class="apphub_sectionTabsHR"><img src="http://cdn.steamcommunity.com/public/images/trans.gif"></div></div>';
			if(breadcrumbs.find("a:first").text().trim()=="Greenlight"){
				banner.before(greenlight_info);
				var collection_header = $("#ig_collection_header");
				collection_header.css("height","auto");
				collection_header.find("img").hide();
				if(banner.hasClass("blue")) {
					banner.hide();
				}
				else if(banner.hasClass("green")) {
					$(".es_greenlight").toggleClass("es_greenlit");
					banner.css("background-image","url("+chrome.extension.getURL("img/gl_banner.jpg")+")")
				}else if(banner.hasClass("greenFlash")) {
					$(".es_greenlight").toggleClass("es_released");
					banner.css("background-image","url("+chrome.extension.getURL("img/gl_banner.jpg")+")")
				}
				var second_breadcrumb = breadcrumbs.find("a:nth-child(2)").text().trim();
				switch (second_breadcrumb) {
					case "Games":
						$("#games_apphub_sectionTab").toggleClass("active");
						break;
					case "Software":
						$("#software_apphub_sectionTab").toggleClass("active");
						break;
					case "Concepts":
						$("#concepts_apphub_sectionTab").toggleClass("active");
						break;
					case "Collections":
						breadcrumbs.before(greenlight_info);
						$("#collections_apphub_sectionTab").toggleClass("active");
						break;
				}
			}
		}
	});
}

function hide_spam_comments() {
	storage.get(function(settings) {
		if (settings.hidespamcomments === undefined) { settings.hidespamcomments = false; storage.set({'hidespamcomments': settings.hidespamcomments}); }
		if(settings.hidespamcomments) {
			if (settings.spamcommentregex === undefined) { settings.spamcommentregex = "[\\u2500-\\u27BF]"; storage.set({'spamcommentregex': settings.spamcommentregex}); }
			var spam_regex = new RegExp(settings.spamcommentregex);
			function check_hide_comments() {
				var comment_array = $(".commentthread_comment").toArray();
				$.each(comment_array, function(index,value){
					var comment_text = $(value).find(".commentthread_comment_text").text().trim();
					if(spam_regex.test(comment_text)) {
						bad_comment=$(value).attr("id");
						$("#"+bad_comment).hide();
					}
				});
			}
			function frame_check_hide_comments() {
				for (var i=0; i<frames.length; i++) {
					var frame = frames[i].document;
					var comment_array = $(frame).find(".commentthread_comment").toArray();
					$.each(comment_array, function(index,value){
						var comment_text = $(value).find(".commentthread_comment_text").text().trim();
						if(spam_regex.test(comment_text)) {
							bad_comment=$(value).attr("id");
							$(frame).find("#"+bad_comment).hide();
						}
					});
				}
			}
			var observer = new WebKitMutationObserver(function(mutations) {
				check_hide_comments();
			});
			if($("#AppHubContent").html()) {
				var modal_content_observer = new WebKitMutationObserver(function(mutations) {
					var frame_comment_observer = new WebKitMutationObserver(function(mutations) {
						frame_check_hide_comments();
						for (var i=0; i<frames.length; i++) {
							var frame = frames[i].document;
							if($(frame).find(".commentthread_comments").html()) {
								frame_comment_observer.observe($(frame).find(".commentthread_comments")[0], {childList:true, subtree:true});
							}
						}
					});
					frame_comment_observer.observe($("#modalContentWait")[0], {attributes:true});
				});
				modal_content_observer.observe($("#modalContentFrameContainer")[0], {childList:true, subtree:true});
			}
			else {
				check_hide_comments();
				observer.observe($(".commentthread_comments")[0], {childList:true, subtree:true});
			}
		}
	});
}

function hide_activity_spam_comments() {
	var blotter_content_observer = new WebKitMutationObserver(function(mutations) {
		hide_spam_comments();
	});
	blotter_content_observer.observe($("#blotter_content")[0], {childList:true, subtree:true});
}

function add_metacritic_userscore() {
	// adds metacritic user reviews
	storage.get(function(settings) {
		if (settings.showmcus === undefined) { settings.showmcus = true; storage.set({'showmcus': settings.showmcus}); }
		if (settings.showmcus) {
            var metahtml = document.getElementById("game_area_metascore");
            var metauserscore = 0;
            if (metahtml) {
            	var metalink = document.getElementById("game_area_metalink");
            	meta = metalink.getElementsByTagName("a");
            	for (var i = 0; i < meta.length; i++)
            	var meta_real_link = meta[i].href;
            	get_http("http://api.enhancedsteam.com/metacritic/?mcurl=" + meta_real_link, function (txt) {
            		metauserscore = escapeHTML(txt);
            		metauserscore = metauserscore.replace(".","");
            		var newmeta = '<div id="game_area_metascore" style="background-image: url(' + chrome.extension.getURL("img/metacritic_bg.png") + ');"><div id="metapage">' + escapeHTML(metauserscore) + '</div></div>';
            		$("#game_area_metascore").after(newmeta);
            	});
            }
		}
	});
}

function add_hltb_info(appid) {
	storage.get(function(settings) {
		if (settings.showhltb === undefined) { settings.showhltb = true; storage.set({'showhltb': settings.showhltb}); }
		if (settings.showhltb) {
			get_http("http://api.enhancedsteam.com/hltb/?appid=" + appid, function (txt) {
				if (txt.length > 0) {
					var data = JSON.parse(txt);
					if (data["hltb"]) {
						xpath_each("//div[contains(@class,'game_details')]", function (node) {
								$(node).after("<div class='block game_details underlined_links'>"
												+ "<div class='block_header'><h4>How Long to Beat</h4></div>"
												+ "<div class='block_content'><div class='block_content_inner'><div class='details_block'>"
													+ "<b>" + localized_strings[language].hltb_main + ":</b><span style='float: right;'>" + escapeHTML(data['hltb']['main_story']) + "</span><br>"
													+ "<b>" + localized_strings[language].hltb_main_e + ":</b><span style='float: right;'>" + escapeHTML(data['hltb']['main_extras']) + "</span><br>"
													+ "<b>" + localized_strings[language].hltb_compl + ":</b><span style='float: right;'>" + escapeHTML(data['hltb']['comp']) + "</span><br>"
													+ "</div>"
													+ "<a class='linkbar' href='" + escapeHTML(data['hltb']['url']) + "' target='_blank'><div class='rightblock'><img src='http://cdn2.store.steampowered.com/public/images/ico/link_web.gif' width='16' height='16' border='0' align='top' /></div>" + localized_strings[language].more_information + " <img src='http://cdn2.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"
													+ "<a class='linkbar' href='" + escapeHTML(data['hltb']['submit_url']) + "' target='_blank'><div class='rightblock'><img src='http://cdn3.store.steampowered.com/public/images/ico/link_news.gif' width='16' height='16' border='0' align='top' /></div>" + localized_strings[language].hltb_submit + " <img src='http://cdn2.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"
													+ "</div></div></div>");
						});
					}
				}
			});
		}
	});
}

function add_pcgamingwiki_link(appid) {
	storage.get(function(settings) {
		if (settings.showpcgw === undefined) { settings.showpcgw = true; storage.set({'showpcgw': settings.showpcgw}); }
		if (settings.showpcgw) {
			get_http("http://api.enhancedsteam.com/pcgw/?appid=" + appid, function (txt) {
				if (txt.length > 0) {
					var gamename = txt.match(/results":{"(.+)":{/)[1];
					var data = JSON.parse(txt);
					var url = (data["results"][gamename]["fullurl"]);
					$('#demo_block').find('.block_content_inner').prepend('<div class="demo_area_button"><a class="game_area_wishlist_btn" target="_blank" href="' + url + '" style="background-image:url(' + chrome.extension.getURL("img/pcgw.png") + ')">' + localized_strings[language].wiki_article.replace("__pcgw__","PC Gaming Wiki") + '</a></div>');
				}
			});
		}
	});
}

function add_widescreen_certification(appid) {
	storage.get(function(settings) {
		if (settings.showwsgf === undefined) { settings.showwsgf = true; storage.set({'showwsgf': settings.showwsgf}); }
		if (document.body.innerHTML.indexOf("<p>Requires the base game <a href=") <= 0) {
			if (settings.showwsgf) {
				// check to see if game data exists
				get_http("http://api.enhancedsteam.com/wsgf/?appid=" + appid, function (txt) {
					found = 0;
					xpath_each("//div[contains(@class,'game_details')]", function (node) {
						if (found == 0) {
							var data = JSON.parse(txt);
							if (data["node"]) {
								var path = data["node"]["Path"];
								var wsg = data["node"]["WideScreenGrade"];
								var mmg = data["node"]["MultiMonitorGrade"];
								var fkg = data["node"]["FourKGrade"];
								var uws = data["node"]["UltraWideScreenGrade"];
								var wsg_icon = "", wsg_text = "", mmg_icon = "", mmg_text = "";
								var fkg_icon = "", fkg_text = "", uws_icon = "", uws_text = "";

								switch (wsg) {
									case "A":
										wsg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_ws-gold.png";
										wsg_text = localized_strings[language].wsgf.gold.replace(/__type__/g, "Widescreen");
										break;
									case "B":
										wsg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_ws-silver.png";
										wsg_text = localized_strings[language].wsgf.silver.replace(/__type__/g, "Widescreen");
										break;
									case "C":
										wsg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_ws-limited.png";
										wsg_text = localized_strings[language].wsgf.limited.replace(/__type__/g, "Widescreen");
										break;
									case "Incomplete":
										wsg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_ws-incomplete.png";
										wsg_text = localized_strings[language].wsgf.incomplete;
										break;
									case "Unsupported":
										wsg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_ws-unsupported.png";
										wsg_text = localized_strings[language].wsgf.unsupported.replace(/__type__/g, "Widescreen");
										break;
								}

								switch (mmg) {
									case "A":
										mmg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_mm-gold.png";
										mmg_text = localized_strings[language].wsgf.gold.replace(/__type__/g, "Multi-Monitor");
										break;
									case "B":
										mmg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_mm-silver.png";
										mmg_text = localized_strings[language].wsgf.silver.replace(/__type__/g, "Multi-Monitor");
										break;
									case "C":
										mmg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_mm-limited.png";
										mmg_text = localized_strings[language].wsgf.limited.replace(/__type__/g, "Multi-Monitor");
										break;
									case "Incomplete":
										mmg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_mm-incomplete.png";
										mmg_text = localized_strings[language].wsgf.incomplete;
										break;
									case "Unsupported":
										mmg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_mm-unsupported.png";
										mmg_text = localized_strings[language].wsgf.unsupported.replace(/__type__/g, "Multi-Monitor");
										break;
								}

								switch (uws) {
									case "A":
										uws_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_uw-gold.png";
										uws_text = localized_strings[language].wsgf.gold.replace(/__type__/g, "Ultra-Widescreen");
										break;
									case "B":
										uws_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_uw-silver.png";
										uws_text = localized_strings[language].wsgf.silver.replace(/__type__/g, "Ultra-Widescreen");
										break;
									case "C":
										uws_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_uw-limited.png";
										uws_text = localized_strings[language].wsgf.limited.replace(/__type__/g, "Ultra-Widescreen");
										break;
									case "Incomplete":
										uws_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_uw-incomplete.png";
										uws_text = localized_strings[language].wsgf.incomplete;
										break;
									case "Unsupported":
										uws_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_uw-unsupported.png";
										uws_text = localized_strings[language].wsgf.unsupported.replace(/__type__/g, "Ultra-Widescreen");
										break;
								}

								switch (fkg) {
									case "A":
										fkg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_4k-gold.png";
										fkg_text = localized_strings[language].wsgf.gold.replace(/__type__/g, "4k UHD");
										break;
									case "B":
										fkg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_4k-silver.png";
										fkg_text = localized_strings[language].wsgf.silver.replace(/__type__/g, "4k UHD");
										break;
									case "C":
										fkg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_4k-limited.png";
										fkg_text = localized_strings[language].wsgf.limited.replace(/__type__/g, "4k UHD");
										break;
									case "Incomplete":
										fkg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_4k-incomplete.png";
										fkg_text = localized_strings[language].wsgf.incomplete;
										break;
									case "Unsupported":
										fkg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_4k-unsupported.png";
										fkg_text = localized_strings[language].wsgf.unsupported.replace(/__type__/g, "4k UHD");
										break;
								}

								var html = "<div class='block underlined_links'><div class='block_header'><h4>WSGF Widescreen Certifications</h4></div><div class='block_content'><div class='block_content_inner'><div class='details_block'><center>";

								if (wsg != "Incomplete") { html += "<a target='_blank' href='" + escapeHTML(path) + "'><img src='" + escapeHTML(wsg_icon) + "' height='120' title='" + escapeHTML(wsg_text) + "' border=0></a>&nbsp;&nbsp;&nbsp;"; }
								if (mmg != "Incomplete") { html += "<a target='_blank' href='" + escapeHTML(path) + "'><img src='" + escapeHTML(mmg_icon) + "' height='120' title='" + escapeHTML(mmg_text) + "' border=0></a>&nbsp;&nbsp;&nbsp;"; }
								if (uws != "Incomplete") { html += "<a target='_blank' href='" + escapeHTML(path) + "'><img src='" + escapeHTML(uws_icon) + "' height='120' title='" + escapeHTML(uws_text) + "' border=0></a>&nbsp;&nbsp;&nbsp;"; }
								if (fkg != "Incomplete") { html += "<a target='_blank' href='" + escapeHTML(path) + "'><img src='" + escapeHTML(fkg_icon) + "' height='120' title='" + escapeHTML(fkg_text) + "' border=0></a>&nbsp;&nbsp;&nbsp;"; }
								if (path) { html += "</center><br><a class='linkbar' target='_blank' href='" + escapeHTML(path) + "'><div class='rightblock'><img src='http://cdn2.store.steampowered.com/public/images/ico/link_web.gif' width='16' height='16' border='0' align='top'></div>" + localized_strings[language].rating_details + " <img src='http://cdn2.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"; }
								html += "</div></div></div></div>";
								$(node).after(html);
							}
							found = 1;
						}
					});
				});
			}
		}
	});
}

function add_dlc_page_link(appid) {
	if ($(".game_area_dlc_section").length > 0) {
		var html = $(".game_area_dlc_section").html();
		title = html.match(/<h2 class=\"gradientbg">(.+)<\/h2>/)[1];
		html = html.replace(title, "<a href='http://store.steampowered.com/dlc/" + appid + "'>" + title + "</a>");
		$(".game_area_dlc_section").html(html);
	}
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

function fix_profile_image_not_found() {
	var items = $(".recent_game");
	if (items) {
		imgs = $(items).find("img");
		for (var i = 0; i < imgs.length; i++)
		if (imgs[i].src == "http://media.steampowered.com/steamcommunity/public/images/avatars/33/338200c5d6c4d9bdcf6632642a2aeb591fb8a5c2.gif") {
			var gameurl = imgs[i].parentNode.href;
			imgs[i].src = "http://cdn.steampowered.com/v/gfx/apps/" + gameurl.substring(gameurl.lastIndexOf("/") + 1) + "/header.jpg";
			imgs[i].width = 184;
			imgs[i].height = 69;
		}
	}
}

function add_market_total() {
	storage.get(function(settings) {
		if (settings.showmarkettotal === undefined) { settings.showmarkettotal = true; storage.set({'showmarkettotal': settings.showmarkettotal}); }
		if (settings.showmarkettotal) {
			if (window.location.pathname.match(/^\/market\/$/)) {
				// Add market transaction button
				$("#moreInfo").before('<div id="es_summary"><div class="market_search_sidebar_contents"><h2 class="market_section_title">'+ localized_strings[language].market_transactions +'</h2><div class="market_search_game_button_group" id="es_market_summary" style="width: 238px"><img src="http://cdn.steamcommunity.com/public/images/login/throbber.gif">'+ localized_strings[language].loading +'</div></div></div>');

				// Get market transactions
				get_http("http://steamcommunity.com/market/myhistory/render/?query=&start=0&count=99999999999999999", function (txt) {
					var data = JSON.parse(txt);
					market = data['results_html'];
					var currency_symbol = "";

					totaler = function (p, i) {
						var priceContainer = $(p).find(".market_listing_price");
						if (priceContainer.length > 0) {
							if (p.innerHTML.match(/\+.+<\/div>/)) {
								var priceText = $(priceContainer).text().trim();

								currency_symbol = priceText.match(/(?:R\$|\$|€|£|pуб)/)[0];

								var regex = /(\d+[.,]\d\d+)/,
									price = regex.exec(priceText);

								if (price !== null && price !== "Total") {
									var tempprice = price[0].toString();
									tempprice = tempprice.replace(",", ".");
									return parseFloat(tempprice);
								}
							}
						}
					};

					usd_totaler = function (p, i) {
						var priceContainer = $(p).find(".market_listing_price");
						if (priceContainer.length > 0) {
							if (p.innerHTML.match(/-.+<\/div>/)) {
								var priceText = $(priceContainer).text().trim();
								var regex = /(\d+[.,]\d\d+)/,
									price = regex.exec(priceText);

								if (priceText.match(/^\$/)) {
									if (price !== null && price !== "Total") {
										var tempprice = price[0].toString();
										tempprice = tempprice.replace(",", ".");
										return parseFloat(tempprice);
									}
								}
							}
						}
					};

					gbp_totaler = function (p, i) {
						var priceContainer = $(p).find(".market_listing_price");
						if (priceContainer.length > 0) {
							if (p.innerHTML.match(/-.+<\/div>/)) {
								var priceText = $(priceContainer).text().trim();
								var regex = /(\d+[.,]\d\d+)/,
									price = regex.exec(priceText);

								if (priceText.match(/^£/)) {
									if (price !== null && price !== "Total") {
										var tempprice = price[0].toString();
										tempprice = tempprice.replace(",", ".");
										return parseFloat(tempprice);
									}
								}
							}
						}
					};

					eur_totaler = function (p, i) {
						var priceContainer = $(p).find(".market_listing_price");
						if (priceContainer.length > 0) {
							if (p.innerHTML.match(/-.+<\/div>/)) {
								var priceText = $(priceContainer).text().trim();
								var regex = /(\d+[.,]\d\d+)/,
									price = regex.exec(priceText);

								if (priceText.match(/€/)) {
									if (price !== null && price !== "Total") {
										var tempprice = price[0].toString();
										tempprice = tempprice.replace(",", ".");
										return parseFloat(tempprice);
									}
								}
							}
						}
					};

					rub_totaler = function (p, i) {
						var priceContainer = $(p).find(".market_listing_price");
						if (priceContainer.length > 0) {
							if (p.innerHTML.match(/-.+<\/div>/)) {
								var priceText = $(priceContainer).text().trim();
								var regex = /(\d+[.,]\d\d+)/,
									price = regex.exec(priceText);

								if (priceText.match(/pуб/)) {
									if (price !== null && price !== "Total") {
										var tempprice = price[0].toString();
										tempprice = tempprice.replace(",", ".");
										return parseFloat(tempprice);
									}
								}
							}
						}
					};

					brl_totaler = function (p, i) {
						var priceContainer = $(p).find(".market_listing_price");
						if (priceContainer.length > 0) {
							if (p.innerHTML.match(/-.+<\/div>/)) {
								var priceText = $(priceContainer).text().trim();
								var regex = /(\d+[.,]\d\d+)/,
									price = regex.exec(priceText);

								if (priceText.match(/^R\$/)) {
									if (price !== null && price !== "Total") {
										var tempprice = price[0].toString();
										tempprice = tempprice.replace(",", ".");
										return parseFloat(tempprice);
									}
								}
							}
						}
					};

					pur_prices = jQuery.map($(market), totaler);
					usd_prices = jQuery.map($(market), usd_totaler);
					gbp_prices = jQuery.map($(market), gbp_totaler);
					eur_prices = jQuery.map($(market), eur_totaler);
					rub_prices = jQuery.map($(market), rub_totaler);
					brl_prices = jQuery.map($(market), brl_totaler);

					var pur_total = 0.0;
					var usd_total = 0.0;
					var gbp_total = 0.0;
					var eur_total = 0.0;
					var rub_total = 0.0;
					var brl_total = 0.0;

					jQuery.map(pur_prices, function (p, i) { pur_total += p; });
					jQuery.map(usd_prices, function (p, i) { usd_total += p; });
					jQuery.map(gbp_prices, function (p, i) { gbp_total += p; });
					jQuery.map(eur_prices, function (p, i) { eur_total += p; });
					jQuery.map(rub_prices, function (p, i) { rub_total += p; });
					jQuery.map(brl_prices, function (p, i) { brl_total += p; });

					switch (currency_symbol) {
						case "€":
							get_http("http://api.enhancedsteam.com/currency/?usd=" + usd_total + "&gbp=" + gbp_total + "&eur=" + eur_total + "&rub=" + rub_total + "$brl=" + brl_total + "&local=eur", function (txt) {
								var net = txt - pur_total;

								var html = localized_strings[language].purchase_total + ":<span style='float: right;'>" + formatMoney(parseFloat(pur_total), 2, currency_symbol, ".", ",", true) + "</span><br>";
								html += localized_strings[language].sales_total + ":<span style='float: right;'>" + formatMoney(parseFloat(txt), 2, currency_symbol, ".", ",", true) + "</span><br>";
								if (net > 0) {
									html += localized_strings[language].net_gain + ":<span style='float: right; color: green;'>" + formatMoney(parseFloat(net), 2, currency_symbol, ".", ",", true) + "</span>";
								} else {
									html += localized_strings[language].net_spent + ":<span style='float: right; color: red;'>" + formatMoney(parseFloat(net), 2, currency_symbol, ".", ",", true) + "</span>";
								}

								$("#es_market_summary").html(html);
							});
							break;

						case "pуб":
							get_http("http://api.enhancedsteam.com/currency/?usd=" + usd_total + "&gbp=" + gbp_total + "&eur=" + eur_total + "&rub=" + rub_total + "$brl=" + brl_total + "&local=rub", function (txt) {
								var net = txt - pur_total;

								var html = localized_strings[language].purchase_total + ":<span style='float: right;'>" + formatMoney(parseFloat(pur_total), 2, currency_symbol, ".", ",", true) + "</span><br>";
								html += localized_strings[language].sales_total + ":<span style='float: right;'>" + formatMoney(parseFloat(txt), 2, currency_symbol, ".", ",", true) + "</span><br>";
								if (net > 0) {
									html += localized_strings[language].net_gain + ":<span style='float: right; color: green;'>" + formatMoney(parseFloat(net), 2, currency_symbol, ".", ",", true) + "</span>";
								} else {
									html += localized_strings[language].net_spent + ":<span style='float: right; color: red;'>" + formatMoney(parseFloat(net), 2, currency_symbol, ".", ",", true) + "</span>";
								}

								$("#es_market_summary").html(html);
							});
							break;

						case "£":
							get_http("http://api.enhancedsteam.com/currency/?usd=" + usd_total + "&gbp=" + gbp_total + "&eur=" + eur_total + "&rub=" + rub_total + "$brl=" + brl_total + "&local=gbp", function (txt) {
								var net = txt - pur_total;

								var html = localized_strings[language].purchase_total + ":<span style='float: right;'>" + formatMoney(parseFloat(pur_total), 2, currency_symbol, ",", ".", false) + "</span><br>";
								html += localized_strings[language].sales_total + ":<span style='float: right;'>" + formatMoney(parseFloat(txt), 2, currency_symbol, ",", ".", false) + "</span><br>";
								if (net > 0) {
									html += localized_strings[language].net_gain + ":<span style='float: right; color: green;'>" + formatMoney(parseFloat(net), 2, currency_symbol, ",", ".", false) + "</span>";
								} else {
									html += localized_strings[language].net_spent + ":<span style='float: right; color: red;'>" + formatMoney(parseFloat(net), 2, currency_symbol, ",", ".", false) + "</span>";
								}

								$("#es_market_summary").html(html);
							});
							break;

						case "R$":
							get_http("http://api.enhancedsteam.com/currency/?usd=" + usd_total + "&gbp=" + gbp_total + "&eur=" + eur_total + "&rub=" + rub_total + "$brl=" + brl_total + "&local=brl", function (txt) {
								var net = txt - pur_total;

								var html = localized_strings[language].purchase_total + ":<span style='float: right;'>" + formatMoney(parseFloat(pur_total), 2, currency_symbol, ",", ".", false) + "</span><br>";
								html += localized_strings[language].sales_total + ":<span style='float: right;'>" + formatMoney(parseFloat(txt), 2, currency_symbol, ",", ".", false) + "</span><br>";
								if (net > 0) {
									html += localized_strings[language].net_gain + ":<span style='float: right; color: green;'>" + formatMoney(parseFloat(net), 2, currency_symbol, ",", ".", false) + "</span>";
								} else {
									html += localized_strings[language].net_spent + ":<span style='float: right; color: red;'>" + formatMoney(parseFloat(net), 2, currency_symbol, ",", ".", false) + "</span>";
								}

								$("#es_market_summary").html(html);
							});
							break;

						default:
							get_http("http://api.enhancedsteam.com/currency/?usd=" + usd_total + "&gbp=" + gbp_total + "&eur=" + eur_total + "&rub=" + rub_total + "$brl=" + brl_total + "&local=usd", function (txt) {
								var net = txt - pur_total;

								var html = localized_strings[language].purchase_total + ":<span style='float: right;'>" + formatMoney(parseFloat(pur_total), 2, currency_symbol, ",", ".", false) + "</span><br>";
								html += localized_strings[language].sales_total + ":<span style='float: right;'>" + formatMoney(parseFloat(txt), 2, currency_symbol, ",", ".", false) + "</span><br>";
								if (net > 0) {
									html += localized_strings[language].net_gain + ":<span style='float: right; color: green;'>" + formatMoney(parseFloat(net), 2, currency_symbol, ",", ".", false) + "</span>";
								} else {
									html += localized_strings[language].net_spent + ":<span style='float: right; color: red;'>" + formatMoney(parseFloat(net), 2, currency_symbol, ",", ".", false) + "</span>";
								}

								$("#es_market_summary").html(html);
							});
							break;
					}
				});
			}
		}
	});
}

function add_active_total() {
	if (window.location.pathname.match(/^\/market\/$/)) {
		if ($(".market_listing_table_message").length == 0) {
			var total = 0;

			$(".market_listing_row").find(".market_listing_my_price").each(function() {
				total += Number($(this).find(".market_listing_price").text().trim().replace(/,/, ".").replace(/[^0-9\.]+/g,""));
				currency_symbol = $(this).find(".market_listing_price").text().trim().match(/(?:R\$|\$|€|£|pуб)/)[0];
			});

			switch (currency_symbol) {
				case "pуб":
				case "€":
					total = formatMoney(parseFloat(total), 2, currency_symbol, ".", ",", true);
					break;
				default:
					total = formatMoney(parseFloat(total), 2, currency_symbol, ",", ".", false);
					break;
			}

			$(".my_listing_section").append("<div class='market_listing_row market_recent_listing_row'><div class='market_listing_right_cell market_listing_edit_buttons'></div><div class='market_listing_right_cell market_listing_my_price'><span><span class='market_listing_price'><b>" + total + "</b></span><br><span class='market_listing_item_name'>" + localized_strings[language].sales_total + "</span></span></div></div>");
		}
	}
}

function minimize_active_listings() {
	storage.get(function(settings) {
		if (settings.hideactivelistings === undefined) { settings.hideactivelistings = false; storage.set({'hideactivelistings': settings.hideactivelistings}); }
		if (settings.hideactivelistings) {
			if (window.location.pathname.match(/^\/market\/$/)) {
				$("#tabContentsMyListings").css("display", "none");
				$("#tabMyListings").removeClass("market_tab_well_tab_active");
				$("#tabMyListings").addClass("market_tab_well_tab_inactive");
			}
		}
	});
}

function account_total_spent() {
	// adds a "total spent on Steam" to the account details page
	storage.get(function(settings) {
		if (settings.showtotal === undefined) { settings.showtotal = true; storage.set({'showtotal': settings.showtotal}); }
		if (settings.showtotal) {
			if ($('.transactionRow').length !== 0) {
				var currency_symbol = $(".accountBalance").html();
				currency_symbol = currency_symbol.match(/(?:R\$|\$|€|£|pуб)/)[0];

				totaler = function (p, i) {
					if (p.innerHTML.indexOf("class=\"transactionRowEvent walletcredit\">") < 0) {
						var priceContainer = $(p).find(".transactionRowPrice");
						if (priceContainer.length > 0) {
							var priceText = $(priceContainer).text();
							var regex = /(\d+[.,]\d\d+)/,
								price = regex.exec(priceText);

							if (price !== null && price !== "Total") {
								var tempprice = price[0].toString();
								tempprice = tempprice.replace(",", ".");
								return parseFloat(tempprice);
							}
						}
					}
				};

				game_prices = jQuery.map($('#store_transactions .transactionRow'), totaler);
				ingame_prices = jQuery.map($('#ingame_transactions .transactionRow'), totaler);
				market_prices = jQuery.map($('#market_transactions .transactionRow'), totaler);


				var game_total = 0.0;
				var ingame_total = 0.0;
				var market_total = 0.0;

				jQuery.map(game_prices, function (p, i) { game_total += p; });
				jQuery.map(ingame_prices, function (p, i) { ingame_total += p; });
				jQuery.map(market_prices, function (p, i) { market_total += p; });

				total_total = game_total + ingame_total + market_total;

				if (currency_symbol) {
					switch (currency_symbol) {
						case "€":
							game_total = formatMoney(parseFloat(game_total), 2, currency_symbol, ".", ",", true)
							ingame_total = formatMoney(parseFloat(ingame_total), 2, currency_symbol, ".", ",", true)
							market_total = formatMoney(parseFloat(market_total), 2, currency_symbol, ".", ",", true)
							total_total = formatMoney(parseFloat(total_total), 2, currency_symbol, ".", ",", true)
							break;

						case "pуб":
							currency_symbol = " " + currency_symbol;
							game_total = formatMoney(parseFloat(game_total), 2, currency_symbol, ".", ",", true)
							ingame_total = formatMoney(parseFloat(ingame_total), 2, currency_symbol, ".", ",", true)
							market_total = formatMoney(parseFloat(market_total), 2, currency_symbol, ".", ",", true)
							total_total = formatMoney(parseFloat(total_total), 2, currency_symbol, ".", ",", true)
							break;

						default:
							game_total = formatMoney(parseFloat(game_total), 2, currency_symbol, ",", ".", false)
							ingame_total = formatMoney(parseFloat(ingame_total), 2, currency_symbol, ",", ".", false)
							market_total = formatMoney(parseFloat(market_total), 2, currency_symbol, ",", ".", false)
							total_total = formatMoney(parseFloat(total_total), 2, currency_symbol, ",", ".", false)
							break;
					}

					var html = '<div class="accountRow accountBalance accountSpent">';
					html += '<div class="accountData price">' + game_total + '</div>';
					html += '<div class="accountLabel">' + localized_strings[language].store_transactions + ':</div></div>';
					html += '<div class="accountRow accountBalance accountSpent">';
					html += '<div class="accountData price">' + ingame_total + '</div>';
					html += '<div class="accountLabel">' + localized_strings[language].game_transactions + ':</div></div>';
					html += '<div class="accountRow accountBalance accountSpent">';
					html += '<div class="accountData price">' + market_total + '</div>';
					html += '<div class="accountLabel">' + localized_strings[language].market_transactions + ':</div></div>';
					html += '<div class="inner_rule"></div>';
					html += '<div class="accountRow accountBalance accountSpent">';
					html += '<div class="accountData price">' + total_total + '</div>';
					html += '<div class="accountLabel">' + localized_strings[language].total_spent + ':</div></div>';
					html += '<div class="inner_rule"></div>';

					$('.accountInfoBlock .block_content_inner .accountBalance').before(html);
				}
			}
		}
	});
}

function inventory_market_prepare() {
	storage.get(function(settings) {
		if (settings.showinvmarket === undefined) { settings.showinvmarket = true; storage.set({'showinvmarket': settings.showinvmarket}); }
		if (settings.showinvmarket) {
			$("#es_market_helper").remove();
			var es_market_helper = document.createElement("script");
			es_market_helper.type = "text/javascript";
			es_market_helper.id = "es_market_helper";
			es_market_helper.textContent = 'jQuery(".itemHolder").bind("click", function() { window.postMessage({ type: "es_sendmessage", text: iActiveSelectView+":::"+g_ActiveInventory.selectedItem.marketable+":::"+g_ActiveInventory.appid+":::"+g_ActiveInventory.selectedItem.market_hash_name }, "*"); });';
			document.documentElement.appendChild(es_market_helper);

			window.addEventListener("message", function(event) {
			  if (event.source != window)
			    return;

			  if (event.data.type && (event.data.type == "es_sendmessage")) { inventory_market_helper(event.data.text); }
			}, false);
		}
	});
}

function inventory_market_helper(response) {
	var desc, appid, item_name, game_name;
	var item = response.split(":::")[0];
	var marketable = response.split(":::")[1];
	var global_id = response.split(":::")[2];
	var hash_name = response.split(":::")[3];

	if ($('#es_item0').length == 0) { $("#iteminfo0_item_market_actions").after("<div class='item_market_actions es_item_action' id=es_item0 height=10></div>"); }
	if ($('#es_item1').length == 0) { $("#iteminfo1_item_market_actions").after("<div class='item_market_actions es_item_action' id=es_item1 height=10></div>"); }
	$('.es_item_action').html("");			
	
	if (marketable == 0) { $('.es_item_action').remove(); return; }

	function load_inventory_market_prices(item, item_name, global_id) {
		function html_characters(str){
			return str.replace(/ /g,"%20").replace(/#/g,"%23").replace(/&/g,"&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
		}
		switch (global_id) {
			case "730":
				var url = "http://steamcommunity.com/market/listings/" + global_id + "/" + html_characters(item_name);
				break;
			default:
				var url = "http://steamcommunity.com/market/listings/" + global_id + "/" + html_characters(hash_name);
		}
		get_http(url, function (txt) {
			var item_price = txt.match(/<span class="market_listing_price market_listing_price_with_fee">\r\n(.+)<\/span>/);					
			if (item_price) { $("#es_item" + item).html(localized_strings[language].lowest_price + " for " + item_name + ": " + item_price[1].trim() + "<br><a href=\"" + url + "\" target='_blank' class='btn_grey_grey btn_medium'><span>" + localized_strings[language].view_marketplace + "</span></a>");
			} else { $("#es_item" + item).html(localized_strings[language].no_results_found); }
		});
	}
	
	$("#es_item" + item).html("<img src='http://cdn.steamcommunity.com/public/images/login/throbber.gif'>"+ localized_strings[language].loading);
	item_name = $("#iteminfo" + item + "_item_name").html();
	switch (global_id) {
		case "730":
			var condition = $("#iteminfo" + item + "_item_descriptors .descriptor:contains('Exterior')").text().replace(/Exterior\: /, "");
			if (condition) item_name += " (" + condition + ")";
		default:
			load_inventory_market_prices(item, item_name, global_id);
			break;
	}
}

function subscription_savings_check() {
	var not_owned_games_prices = 0,
		appid_info_deferreds = [],
		sub_apps = [],
		sub_app_prices = {},
		comma,
		currency_symbol,
		symbol_right;

	// For each app, load its info.
	$.each($(".tab_row"), function (i, node) {
		var appid = get_appid(node.querySelector("a").href),
			// Remove children, leaving only text (price or only discounted price, if there are discounts)
			price_container = $(node).find(".tab_price").children().remove().end().text().trim();

		if (price_container !== "N/A") {
			if (price_container) {
				if (price_container !== "Free") {
					itemPrice = parseFloat(price_container.match(/([0-9]+(?:(?:\,|\.)[0-9]+)?)/)[1].replace(",", "."));
					if (!currency_symbol) currency_symbol = price_container.match(/(?:R\$|\$|€|£|pуб)/)[0];
				}

				switch (currency_symbol) {
					case "€":
						symbol_right = true;
						break;
					case "pуб":
						symbol_right = true;
						break;
				}

				if (!comma) comma = (price_container.indexOf(",") > -1);
			} else {
				itemPrice = 0;
			}
		} else {
			itemPrice = 0;
		}

		// Batch app ids, checking for existing promises, then do this.
		ensure_appid_deferred(appid);

		appid_info_deferreds.push(appid_promises[appid].promise);

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
		if (comma) { not_owned_games_prices = not_owned_games_prices * 100; }
		var corrected_price = not_owned_games_prices - bundle_price;

		if (symbol_right) {
			var $message = $('<div class="savings">' + formatMoney((comma ? corrected_price / 100 : corrected_price), 2, currency_symbol, ",", comma ? "," : ".", true) + '</div>');
		} else {
			var $message = $('<div class="savings">' + formatMoney((comma ? corrected_price / 100 : corrected_price), 2, currency_symbol, ",", comma ? "," : ".") + '</div>');
		}
		if (corrected_price < 0) $message[0].style.color = "red";

		$('.savings').replaceWith($message);
	});
}

// pull DLC gamedata from enhancedsteam.com
function dlc_data_from_site(appid) {
    if ($("div.game_area_dlc_bubble").length > 0) {
        var appname = $(".apphub_AppName").html();
		appname = appname.replace("&amp;", "and");
		appname = appname.replace("\"", "");
		appname = appname.replace("“", "");
		get_http("http://api.enhancedsteam.com/gamedata/?appid=" + appid + "&appname=" + appname, function (txt) {
    		var data;
			if (txt != "{\"dlc\":}}") {
				data = JSON.parse(txt);
			}
            var html = "<div class='block'><div class='block_header'><h4>" + localized_strings[language].dlc_details + "</h4></div><div class='block_content'><div class='block_content_inner'><div class='details_block'>";

            if (data) {
                $.each(data["dlc"], function(index, value) {
                    html += "<div class='game_area_details_specs'><div class='icon'><img src='http://www.enhancedsteam.com/gamedata/icons/" + escapeHTML(value['icon']) + "' align='top'></div><div class='name'><span title='" + escapeHTML(value['text']) + "'>" + escapeHTML(index) + "</span></div></div>";
                });
			}

			html += "</div><a class='linkbar' href='http://www.enhancedsteam.com/gamedata/dlc_category_suggest.php?appid=" + appid + "&appname=" + appname + "' target='_blank'>" + localized_strings[language].dlc_suggest + "</a></div></div></div>";

			$("#demo_block").after(html);
    	});
    }
}

function dlc_data_for_dlc_page() {

	var appid_deferred = [];
	var totalunowned = 0;
	var addunowned = "<form name=\"add_all_unowned_dlc_to_cart\" action=\"http://store.steampowered.com/cart/\" method=\"POST\"><input type=\"hidden\" name=\"action\" value=\"add_to_cart\">";

	$.each($("div.dlc_page_purchase_dlc"), function(j, node){
		var appid = get_appid(node.href || $(node).find("a")[0].href) || get_appid_wishlist(node.id);
		get_http("http://api.enhancedsteam.com/gamedata/?appid=" + appid, function (txt) {
    		var data;
			if (txt != "{\"dlc\":}}") {
				data = JSON.parse(txt);
			}
            var html = "<div style='width: 250px; margin-left: 310px;'>";

            if (data) {
                $.each(data["dlc"], function(index, value) {
                    html += "<div class='game_area_details_specs'><div class='icon'><img src='http://www.enhancedsteam.com/gamedata/icons/" + escapeHTML(value['icon']) + "' align='top'></div><div class='name'><span title='" + escapeHTML(value['text']) + "'>" + escapeHTML(index) + "</span></div></div>";
                });
			}

			html += "</div>";

			$(node).css("height", "144px");
			$(node).append(html);
    	});

		if (appid) {
			if (!getValue(appid + "owned")) {
				get_http('//store.steampowered.com/api/appdetails/?appids=' + appid, function (data) {
					var storefront_data = JSON.parse(data);
					$.each(storefront_data, function(application, app_data) {
						if (app_data.success) {
							if (app_data.data.packages[0]) {
								addunowned += "<input type=\"hidden\" name=\"subid[]\" value=\"" + app_data.data.packages[0] + "\">";
								totalunowned = totalunowned + 1;
							}
						}
					});
				});
			}
		}

		ensure_appid_deferred(appid);
		appid_deferred.push(appid_promises[appid].promise);
	});

	$.when.apply(null, appid_deferred).done(function() {
		addunowned += "</form>";

		if (totalunowned > 0) {
			$("#dlc_purchaseAll").before(addunowned);
			var buttoncode = "<div class='btn_addtocart' style='float: right; margin-right: 15px;' id='dlc_purchaseAllunOwned'><div class='btn_addtocart_left'></div><div class='btn_addtocart_right'></div><a class='btn_addtocart_content' href=\"javascript:document.forms['add_all_unowned_dlc_to_cart'].submit();\">" + localized_strings[language].add_unowned_dlc_to_cart + "</a></div>";
			$("#dlc_purchaseAll").after(buttoncode);
		}
	});
}

function dlc_data_for_app_page() {

	var appid_deferred = [];
	var totalunowned = 0;
	var totalcost = 0.0;
	var totaldlc = $(".game_area_dlc_row").size();
	var currency_symbol;
	var addunowned = "<form name=\"add_all_unowned_dlc_to_cart\" action=\"http://store.steampowered.com/cart/\" method=\"POST\"><input type=\"hidden\" name=\"action\" value=\"add_to_cart\">";

	$.each($("a.game_area_dlc_row"), function(j, node){
		var appid = get_appid(node.href || $(node).find("a")[0].href) || get_appid_wishlist(node.id);		
		if (appid) {
			if (!getValue(appid + "owned")) {
				get_http('//store.steampowered.com/api/appdetails/?appids=' + appid, function (data) {
					var storefront_data = JSON.parse(data);
					$.each(storefront_data, function(application, app_data) {
						if (app_data.success) {
							if (app_data.data.packages[0]) {
								addunowned += "<input type=\"hidden\" name=\"subid[]\" value=\"" + app_data.data.packages[0] + "\">";
								totalunowned = totalunowned + 1;
								var price = 0;
								var html = $(node).html().replace(/,/g, ".");
								if ($(node).html().match(/discount_pct/)) {
									price = parseFloat(html.match(/discount_final_price" itemprop="price">(.+)<\/div>/)[1].trim().match(/(\d+[.|,]?\d+)/)[1]);
								} else { 
									price = parseFloat(html.match(/game_area_dlc_price">\n(.+)<\/div>/)[1].trim().match(/(\d+[.|,]?\d+)/)[1]); 
								}
								totalcost = totalcost + price;
								if (!currency_symbol) currency_symbol = $(node).html().match(/(?:R\$|\$|€|£|pуб)/)[0];
							}
						}
					});
				});
			}
		}

		ensure_appid_deferred(appid);
		appid_deferred.push(appid_promises[appid].promise);
	});

	$.when.apply(null, appid_deferred).done(function() {
		addunowned += "</form>";
		
		if (totalunowned > 0 && totaldlc != totalunowned && totalcost != 0) {
			switch (currency_symbol) {
				case "pуб":
					if (parseInt(totalcost, 10) == totalcost) {
						totalcost = totalcost + " pуб.";
						break;
					}
				case "€":
					totalcost = formatMoney(parseFloat(totalcost), 2, currency_symbol, ".", ",", true);
					break;
				case "R$":
					totalcost = formatMoney(parseFloat(totalcost), 2, "R$ ", ".", ",", false);
					break;
				default:
					totalcost = formatMoney(parseFloat(totalcost), 2, currency_symbol, ",", ".", false);
					break;
			}
			$("#dlc_purchase_action").before(addunowned);
			var buttoncode = "<div style='float: right; padding: 0px 0px 0px 0px;' class='game_purchase_action game_purchase_action_bg' style><div class='game_purchase_price price'>" + totalcost + "</div><div class='btn_addtocart' id='dlc_purchaseAllunOwned'><div class='btn_addtocart_left'></div><div class='btn_addtocart_right'></div><a class='btn_addtocart_content' href=\"javascript:document.forms['add_all_unowned_dlc_to_cart'].submit();\">" + localized_strings[language].add_unowned_dlc_to_cart + "</a></div></div>";
			$("#dlc_purchase_action").prepend(buttoncode);
		}
	});
}

function show_regional_pricing() {
	storage.get(function(settings) {
		if (settings.showregionalprice === undefined) { settings.showregionalprice = "mouse"; storage.set({'showregionalprice': settings.showregionalprice}); }
		if (settings.regional_countries === undefined) { settings.regional_countries = ["us","gb","eu1","eu2","ru","br","au"]; storage.set({'regional_countries': settings.regional_countries}); }
		if (settings.regional_hideworld === undefined) { settings.regional_hideworld = false; storage.set({'regional_hideworld':settings.regional_hideworld}); }
		if (settings.regional_countries<1){settings.showregionalprice="off";}
		if (settings.showregionalprice != "off") {
			var api_url = "http://store.steampowered.com/api/packagedetails/";
			var countries = settings.regional_countries;
			var pricing_div = "<div class='es_regional_container'></div>";
			var world = chrome.extension.getURL("img/flags/world.png");
			var currency_deferred = [];
			var local_country;
			var dailydeal;
			var sale;
			var sub;
			var region_appended=0;
			if (/^\/$/.test(window.location.pathname)) {
				dailydeal = true;
				pricing_div = $(pricing_div).addClass("es_regional_dailydeal");
			}
			if (/^\/sale\/.*/.test(window.location.pathname)) {
				sale=true;
				pricing_div = $(pricing_div).addClass("es_regional_sale");
			}
			if (/^\/sub\/.*/.test(window.location.pathname)) {
				sub=true;
				pricing_div = $(pricing_div).addClass("es_regional_sub");
			}
			if(getCookie("fakeCC")){
				local_country = getCookie("fakeCC").toLowerCase();
			}else {
				local_country = getCookie("LKGBillingCountry").toLowerCase();
			}
			if(countries.indexOf(local_country)===-1){
				countries.push(local_country);
			}
			var all_game_areas = $(".game_area_purchase_game").toArray();
			if (dailydeal) {
				all_game_areas = $(".dailydeal_content").toArray();
			} else if(sale) {
				all_game_areas = $(".sale_page_purchase_app").toArray();
			}
			var subid_info = [];
			var subid_array = [];
			var subids_csv;

			function formatPriceData(sub_info,country,converted_price,local_currency) {
				var flag_div = "<div class=\"es_flag\" style='background-image:url("+chrome.extension.getURL("img/flags/flags.png")+")'></div>";
				if (sub_info["prices"][country]){
					var price = sub_info["prices"][country]["final"]/100;
					var local_price = sub_info["prices"][local_country]["final"]/100;
					converted_price = converted_price/100;
					converted_price = converted_price.toFixed(2);
					var currency = sub_info["prices"][country]["currency"];
					var percentage;
					switch(currency) {
						case "EUR":
							var formatted_price = formatMoney(price,2,"€",".",",",true);
							break;
						case "RUB":
							var formatted_price = price+"  pуб.";
							break;
						case "BRL":
							var formatted_price = formatMoney(price, 2, "R$ ", ".", ",", false);
							break;
						case "GBP":
							var formatted_price = formatMoney(price,2,"£");
							break;
						default:
							var formatted_price = formatMoney(price);
							break;
					}
					switch(local_currency) {
						case "EUR":
							var formatted_converted_price = formatMoney(converted_price,2,"€",".",",",true);
							break;
						case "RUB":
							converted_price = Math.round(converted_price);
							var formatted_converted_price = converted_price+"  pуб.";
							break;
						case "BRL":
							var formatted_converted_price = formatMoney(converted_price, 2, "R$ ", ".", ",", false);
							break;
						case "GBP":
							var formatted_converted_price = formatMoney(converted_price,2,"£");
							break;
						default:
							var formatted_converted_price = formatMoney(converted_price);
							break;
					}
					percentage = (((converted_price/local_price)*100)-100).toFixed(2);
					var arrows = chrome.extension.getURL("img/arrows.png");
					var percentage_span="<span class=\"es_percentage\"><div class=\"es_percentage_indicator\" style='background-image:url("+arrows+")'></div></span>";
					if (percentage<0) {
						percentage = Math.abs(percentage);
						percentage_span = $(percentage_span).addClass("es_percentage_lower");
					}else if (percentage==0) {
						percentage_span = $(percentage_span).addClass("es_percentage_equal");
					}else {
						percentage_span = $(percentage_span).addClass("es_percentage_higher");
					}
					percentage_span = $(percentage_span).append(percentage+"%");
					var regional_price_div = "<div class=\"es_regional_price\">"+formatted_price+"&nbsp;<span class=\"es_regional_converted\">("+formatted_converted_price+")</span></div>";
					flag_div = $(flag_div).addClass("es_flag_"+country);
					regional_price_div = $(regional_price_div).prepend(flag_div);
					regional_price_div = $(regional_price_div).append(percentage_span);
					return regional_price_div;
				}
				else {
					var regional_price_div = "<div class=\"es_regional_price\"><span class=\"es_regional_unavailable\">"+localized_strings[language].region_unavailable+"</span></div>";
					flag_div = $(flag_div).addClass("es_flag_"+country);
					regional_price_div = $(regional_price_div).prepend(flag_div);
					return regional_price_div;
				}
			}

			$.each(all_game_areas,function(index,app_package){
				var subid = $(app_package).find("input").last().val();
				if(subid>0){
					subid_info[index]=[];
					subid_info[index]["subid"]=subid;
					subid_info[index]["prices"]=[];
					subid_array.push(subid);
				}
			});
			if(subid_array.length>0){
				subids_csv=subid_array.join();
				$.each(countries,function(index,country){
					switch (country) {
						case "eu1":
							cc="fr";
							break;
						case "eu2":
							cc="it";
							break;
						default:
							cc=country;
							break;
					}
					currency_deferred.push(
						$.ajax({
							url:api_url,
							data:{
								packageids:subids_csv,
								cc:cc
							}
						}).done(function(data){
							$.each(subid_info,function(subid_index,package_info){
								$.each(data,function(data_subid){
									if(package_info){
										if(package_info["subid"]===data_subid){
											if(data[data_subid]["data"]) {
												var price = data[data_subid]["data"]["price"];
												subid_info[subid_index]["prices"][country]=price;
												pricing_div=$(pricing_div).append(price);
											}
										}
									}
								});
							});
						})
					);
				});
				var format_deferred=[];
				var formatted_regional_price_array=[];
				$.when.apply(null,currency_deferred).done(function(){
					$.map(subid_info,function(subid,index){
						if(subid){
							var sub_formatted = [];
							var convert_deferred=[];
							var all_convert_deferred = $.Deferred();
							var app_pricing_div = $(pricing_div).clone();
							var local_currency = subid["prices"][local_country]["currency"];
							$(app_pricing_div).attr("id", "es_pricing_" + subid_info[index]["subid"].toString());
							$.each(countries,function(country_index,country){
								var regional_price_array=[];
								if(country!==local_country){
									if(subid["prices"][country]){
										var country_currency = subid["prices"][country]["currency"].toString().toLowerCase();
										var app_price = subid["prices"][country]["final"];
										convert_deferred.push($.ajax({
											url:"http://api.enhancedsteam.com/currency/?"+country_currency+"="+app_price+"&local="+local_currency
										}).done(function(converted_price){
											var regional_price = formatPriceData(subid,country,converted_price,local_currency);
											regional_price_array[0]=country;
											regional_price_array[1]=regional_price;
											sub_formatted.push(regional_price_array);
										}));
									}
									else {
										var regional_price = formatPriceData(subid,country);
										regional_price_array[0]=country;
										regional_price_array[1]=regional_price;
										sub_formatted.push(regional_price_array);
									}
								}
							});
							$.when.apply(null,convert_deferred).done(function(){
								if(dailydeal){
									$(".dailydeal_content").eq(index).find(".game_purchase_action_bg").before(app_pricing_div);
								}
								else if (sale){
									$(".sale_page_purchase_app").eq(index).find(".game_purchase_action_bg").before(app_pricing_div);
								} else {
									switch(settings.showregionalprice){
										case "always":
											$(".game_area_purchase_game").eq(index).find(".game_purchase_action").before(app_pricing_div);
											break;
										default:
											$(".game_area_purchase_game").eq(index).after(app_pricing_div);
											break;
									}
								}
								sub_formatted["subid"]=subid_info[index]["subid"].toString();
								formatted_regional_price_array.push(sub_formatted);
								all_convert_deferred.resolve();
							});
							format_deferred.push(all_convert_deferred.promise());
						}
					});
					$.when.apply(null,format_deferred).done(function(){
						var all_sub_sorted_divs=[];
						$.each(formatted_regional_price_array,function(formatted_div_index,formatted_div){
							var sorted_formatted_divs=[];
							$.each(countries,function(country_index,country){
								$.each(formatted_div,function(regional_div_index,regional_div){
									var sort_div_country = regional_div[0];
									if(country==sort_div_country){
										sorted_formatted_divs.push(regional_div[1]);
									}
								});
							});
							sorted_formatted_divs["subid"]=formatted_div["subid"];
							all_sub_sorted_divs.push(sorted_formatted_divs);
						});
						$.each(all_sub_sorted_divs,function(index,sorted_divs){
							var subid = subid_array[index];
							$.each(sorted_divs,function(price_index,regional_div){
								$("#es_pricing_"+sorted_divs["subid"]).append(regional_div);
								if(regional_div!=undefined){
									region_appended++;
								}
							});
							if (settings.showregionalprice == "mouse") {
								$("#es_pricing_"+subid).append("<div class='miniprofile_arrow right' style='position: absolute; top: 12px; right: -8px;'></div>");
								if(region_appended<=1){
									$("#es_pricing_"+subid).find(".miniprofile_arrow").css("top","6px");
								}
							}	
						});
						$.each(all_game_areas,function(index,app_package){
							var subid = $(app_package).find("input").last().val();
							if(subid){
								if (settings.showregionalprice == "mouse") {
									if(!(settings.regional_hideworld)){
										$(app_package).find(".price").css({"padding-left":"25px","background-image":"url("+world+")","background-repeat":"no-repeat","background-position":"5px 8px"});
										$(app_package).find(".discount_original_price").css({"position":"relative","float":"left"});
										$(app_package).find(".discount_block").css({"padding-left":"25px","background-image":"url("+world+")","background-repeat":"no-repeat","background-position":"77px 8px"});
									}
									$(app_package).find(".price, .discount_block")
									.mouseover(function() {
										var purchase_location = $(app_package).find("div.game_purchase_action_bg").offset();
										if(dailydeal) {
											$("#es_pricing_" + subid).css("right", $(app_package).find(".game_purchase_action").width()+18 +"px");
										} else if(sale) {
											$("#es_pricing_" + subid).css("right", $(app_package).find(".game_purchase_action").width() + 25 +"px");
										} else if(sub) {
											$("#es_pricing_" + subid).css("right", $(".rightcol").width() + $(app_package).find(".game_purchase_action").width() + 45 +"px");
										} else {
											$("#es_pricing_" + subid).css("right", $(".rightcol").width() + $(app_package).find(".game_purchase_action").width() + 35 +"px");
										}
										$("#es_pricing_" + subid).show();
									})
									.mouseout(function() {
										$("#es_pricing_" + subid).hide();
									})
									.css("cursor","help");
								} else {
									$("#es_pricing_" + subid).addClass("es_regional_always");
									$("#es_pricing_"+subid).after("<div style='clear:both'></div>");
								}
							}
						});
					});
				});
			}
		}
	});
}

function display_purchase_date() {
    if ($(".game_area_already_owned").length > 0) {
        var appname = $(".apphub_AppName").text();

        get_http('https://store.steampowered.com/account/', function (txt) {
    		var earliestPurchase = $(txt).find("#store_transactions .transactionRowTitle:contains(" + appname + ")").closest(".transactionRow").last(),
    			purchaseDate = $(earliestPurchase).find(".transactionRowDate").text();

    		var found = 0;
    		xpath_each("//div[contains(@class,'game_area_already_owned')]", function (node) {
    			if (found === 0) {
    				if (purchaseDate) {
    					node.innerHTML = node.innerHTML + localized_strings[language].purchase_date.replace("__date__", purchaseDate);
    					found = 1;
    				}
    			}
    		});
    	});
	}
}

function bind_ajax_content_highlighting() {
	// checks content loaded via AJAX
	var observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			for (var i = 0; i < mutation.addedNodes.length; i++) {
				var node = mutation.addedNodes[i];
				// Check the node is what we want, and not some unrelated DOM change.
				//if (node.id == "search_result_container") add_cart_to_search();

				if (node.classList && node.classList.contains("inventory_page")) {
					inventory_market_prepare();
				}

				if (node.classList && node.classList.contains("tab_row")) {
					hide_early_access();
					start_highlighting_node(node);
				}
				if (node.id == "search_result_container") {
					endless_scrolling();
					start_highlights_and_tags();
					remove_non_specials();
				}
				if (node.classList && node.classList.contains("match")) start_highlighting_node(node);
				if (node.classList && node.classList.contains("search_result_row")) start_highlighting_node(node);
				if (node.classList && node.classList.contains("market_listing_row_link")) highlight_market_items();
				if ($(node).children('div')[0] && $(node).children('div')[0].classList.contains("blotter_day")) start_friend_activity_highlights();
				if ($(node).parent()[0] && $(node).parent()[0].classList.contains("search_result_row")) start_highlighting_node($(node).parent()[0]);
			}
		});
	});
	observer.observe(document, { subtree: true, childList: true });
}

function start_highlights_and_tags(){
	/* Batches all the document.ready appid lookups into one storefront call. */

	var selectors = [
		"div.tab_row",			// Storefront rows
		"div.dailydeal",		// Christmas deals; https://www.youtube.com/watch?feature=player_detailpage&v=2gGopKNPqVk#t=52s
		"div.wishlistRow",		// Wishlist row
		"a.game_area_dlc_row",	// DLC on app pages
		"a.small_cap",			// Featured storefront items, and "recommended" section on app pages.
		"a.search_result_row",	// Search result row.
		"a.match",				// Search suggestions row.
		"a.cluster_capsule",	// Carousel items.
		"div.recommendation_highlight",	// Recommendation page.
		"div.recommendation_carousel_item",	// Recommendation page.
		"div.friendplaytime_game",	// Recommendation page.
		"div.dlc_page_purchase_dlc", // DLC page rows
		"div.sale_page_purchase_item", // Sale pages
		"div.item",				// Sale page / featured page
		"div.home_area_spotlight",	// midweek and weekend deals
		"div.insert_season_here_sale_dailydeal_ctn"		// Valve Sthap!
	];

	// Get all appids and nodes from selectors.
	$.each(selectors, function (i, selector) {
		$.each($(selector), function(j, node){
			var appid = get_appid(node.href || $(node).find("a")[0].href) || get_appid_wishlist(node.id);
			if (appid) {

				if ($(node).hasClass("item")) { node = $(node).find(".info")[0]; }
				if ($(node).hasClass("home_area_spotlight")) { node = $(node).find(".spotlight_content")[0]; }

				on_app_info(appid, function(){
					highlight_app(appid, node);
				});
			} else {
				var subid = get_subid(node.href || $(node).find("a")[0].href);

				if ($(node).hasClass("item")) { node = $(node).find(".info")[0]; }
				if ($(node).hasClass("home_area_spotlight")) { node = $(node).find(".spotlight_content")[0]; }

				if (subid) {
					get_sub_details (subid, node);
				}
			}
		});
	});
}

function start_highlighting_node(node) {
	var appid = get_appid(node.href || $(node).find("a")[0].href) || get_appid_wishlist(node.id);
	if (appid) {
		on_app_info(appid, function(){
			highlight_app(appid, node);
		});
	} else {
		var subid = get_subid(node.href || $(node).find("a")[0].href);
		if (subid) {
			get_sub_details (subid, node);
		}
	}
}

function add_steamdb_links(appid, type) {
	storage.get(function(settings) {
		if (settings.showsteamdb === undefined) { settings.showsteamdb = true; storage.set({'showsteamdb': settings.showsteamdb}); }
		if (settings.showsteamdb) {
			switch (type) {
				case "gamehub":
					$(".apphub_OtherSiteInfo").append('<a href="http://steamdb.info/app/' + appid + '/" class="btn_darkblue_white_innerfade btn_medium" target="_blank"><span>Steam Database</span>');
					break;
				case "gamegroup":
					$('#rightActionBlock' ).append('<div class="actionItemIcon"><img src="' + chrome.extension.getURL("img/steamdb.png") + '" width="16" height="16" alt=""></div><a class="linkActionMinor" target="_blank" href="http://steamdb.info/app/' + appid + '/">' + localized_strings[language].view_in + ' Steam Database</a>');
					break;
				case "app":
					$('#demo_block').find('.block_content_inner').prepend('<div class="demo_area_button"><a class="game_area_wishlist_btn" target="_blank" href="http://steamdb.info/app/' + appid + '/" style="background-image:url(' + chrome.extension.getURL("img/steamdb_store.png") + ')">' + localized_strings[language].view_in + ' Steam Database</a></div>');
					break;
				case "sub":
					$(".share").before('<a class="game_area_wishlist_btn" target="_blank" href="http://steamdb.info/sub/' + appid + '/" style="background-image:url(' + chrome.extension.getURL("img/steamdb_store.png") + ')">' + localized_strings[language].view_in + ' Steam Database</a>');
					break;
			}
		}
	});
}

function get_app_details(appids) {
	// Make sure we have inventory loaded beforehand so we have gift/guestpass/coupon info.
	if (!loading_inventory) loading_inventory = load_inventory();
	loading_inventory.done(function() {

		// Batch request for appids - all untracked or cache-expired apps.
		// Handle new data highlighting as it loads.

		if (!(appids instanceof Array)) appids = [appids];
		get_http('//store.steampowered.com/api/appuserdetails/?appids=' + appids.join(","), function (data) {
			var storefront_data = JSON.parse(data);
			$.each(storefront_data, function(appid, app_data){
				if (app_data.success) {
					setValue(appid + "wishlisted", (app_data.data.added_to_wishlist === true));
					setValue(appid + "owned", (app_data.data.is_owned === true));

					if (app_data.data.friendswant) setValue(appid + "friendswant", app_data.data.friendswant.length);
					if (app_data.data.friendsown) setValue(appid + "friendsown", app_data.data.friendsown.length);
					if (app_data.data.recommendations.totalfriends > 0) setValue(appid + "friendsrec", app_data.data.recommendations.totalfriends);
				}
				// Time updated, for caching.
				setValue(appid, parseInt(Date.now() / 1000, 10));

				// Resolve promise, to run any functions waiting for this apps info.
				appid_promises[appid].resolve();
			});
		});
	});
}

function get_sub_details(subid, node) {
	if (getValue(subid + "owned")) { highlight_owned(node); return; }
	get_http('//store.steampowered.com/api/packagedetails/?packageids=' + subid, function (data) {
		var pack_data = JSON.parse(data);
		$.each(pack_data, function(subid, sub_data) {
			if (sub_data.success) {
				var app_ids = [];
				var owned = [];
				if (sub_data.data.apps) {
					sub_data.data.apps.forEach(function(app) {
						app_ids.push (app.id);
						get_http('//store.steampowered.com/api/appuserdetails/?appids=' + app.id, function (data2) {
							var storefront_data = JSON.parse(data2);
							$.each(storefront_data, function(appid, app_data) {
								if (app_data.success) {
									if (app_data.data.is_owned === true) {
										owned.push(appid);
									}
								}
							});

							if (owned.length == app_ids.length) {
								setValue(subid + "owned", true);
								setValue(subid, parseInt(Date.now() / 1000, 10));
								highlight_app(subid, node);
							}
						});
					});
				}
			}
		});
	});
}

function highlight_app(appid, node) {
	storage.get(function(settings) {
		if (!(node.classList.contains("wishlistRow") || node.classList.contains("wishlistRowItem"))) {
			if (getValue(appid + "wishlisted")) highlight_wishlist(node);
		}

		if (settings.highlight_excludef2p === undefined) { settings.highlight_excludef2p = false; storage.set({'highlight_excludef2p': settings.highlight_excludef2p}); }
		if (settings.highlight_excludef2p) {
			if ($(node).html().match(/<div class="(tab_price|large_cap_price|col search_price|main_cap_price)">\n?(.+)?(Free to Play|Play for Free!)(.+)?<\/div>/i)) {
				return;
			}
			if ($(node).html().match(/<h5>(Free to Play|Play for Free!)<\/h5>/i)) {
				return;
			}
			if ($(node).html().match(/genre_release/)) {
				if ($(node).find(".genre_release").html().match(/Free to Play/i)) {
					return;
				}
			}
			if (node.classList.contains("search_result_row")) {
				if ($(node).html().match(/Free to Play/i)) {
					return;
				}
			}
		}

		if (getValue(appid + "owned")) highlight_owned(node);
		if (getValue(appid + "gift")) highlight_inv_gift(node);
		if (getValue(appid + "guestpass")) highlight_inv_guestpass(node);
		if (getValue(appid + "coupon")) highlight_coupon(node);
		if (getValue(appid + "friendswant")) highlight_friends_want(node, appid);
		if (getValue(appid + "friendsown")) tag_friends_own(node, appid);
		if (getValue(appid + "friendsrec")) tag_friends_rec(node, appid);
	});
}

function fix_community_hub_links() {
	element = document.querySelector( '.apphub_OtherSiteInfo a' );

	if( element && element.href.charAt( 26 ) === '/' ) {
		element.href = element.href.replace( /\/\/app\//, '/app/' ) + '/';
	}
}

function add_carousel_descriptions() {
	storage.get(function(settings) {
		if (settings.show_carousel_descriptions === undefined) { settings.show_carousel_descriptions = true; storage.set({'show_carousel_descriptions': settings.show_carousel_descriptions}); }
		if (settings.show_carousel_descriptions) {
			if ($(".main_cluster_content").length > 0) {
				var description_height_to_add = 62;
				$(".main_cluster_content").css("height", parseInt($(".main_cluster_content").css("height").replace("px", ""), 10) + description_height_to_add + "px");
				
				
				$.each($(".cluster_capsule"), function(i, _obj) {
					var appid = get_appid(_obj.href),
						$desc = $(_obj).find(".main_cap_content"),
						$desc_content = $("<p></p>");
					
					$desc.css("height", parseInt($desc.css("height").replace("px", ""), 10) + description_height_to_add + "px");
					$desc.parent().css("height", parseInt($desc.parent().css("height").replace("px", ""), 10) + description_height_to_add + "px");
					
					get_http('http://store.steampowered.com/app/' + appid, function(txt) {
						var desc = txt.match(/textarea name="w_text" placeholder="(.+)" maxlength/);
						if (desc) {
							$desc.append(desc[1]);
						}
					});
				});
			}
		}
	});
}

function add_affordable_button() {
	if (is_signed_in() && $("#header_wallet_ctn").text().trim()) {
		var balance_text = $("#header_wallet_ctn").text().trim();
		var currency_symbol = balance_text.match(/(?:R\$|\$|€|£|pуб)/)[0];
		var balance = balance_text.replace(currency_symbol, "");
		if(currency_symbol == "$") balance = balance.replace(" USD", "");
		balance = balance.replace(",", ".");
		if (balance > 0) {
			var link = "http://store.steampowered.com/search/?sort_by=Price&sort_order=DESC&price=0%2C" + balance;
			$(".btn_browse").each(function(index) {
				if (index == 1) {
					switch (currency_symbol) {
						case "€":
							$(this).after("<a class='btn_browse' style='width: 308px; background-image: url(" + chrome.extension.getURL("img/es_btn_browse.png") +");' href='" + link + "'><h3 style='width: 120px;'>" + balance + "<span class='currency'>" + currency_symbol + "</span></h3><h5><span id='es_results'></span> games under " + balance_text + "</h5></a>");
							break;
						case "pуб":
							$(this).after("<a class='btn_browse' style='width: 308px; background-image: url(" + chrome.extension.getURL("img/es_btn_browse.png") +");' href='" + link + "'><h3 style='width: 120px;'>" + balance + "</h3><h5><span id='es_results'></span> games under " + balance_text + "</h5></a>");
							break;
						default:
							$(this).after("<a class='btn_browse' style='width: 308px; background-image: url(" + chrome.extension.getURL("img/es_btn_browse.png") +");' href='" + link + "'><h3 style='width: 120px;'><span class='currency'>" + currency_symbol + "</span>" + balance + "</h3><h5><span id='es_results'></span> games under " + balance_text + "</h5></a>");
					}
					get_http(link, function(txt) {
						var results = txt.match(/search_pagination_left(.+)\r\n(.+)/)[2];
						results = results.match(/(\d+)(?!.*\d)/)[0];
						$("#es_results").text(results);
					});
				}
			});
		}
	}
}

function add_small_cap_height() {
	// Add height for another line for tags;
	var height_to_add = 20,
		$small_cap_pager = $(".small_cap_pager"),
		$small_cap = $(".small_cap");

	if ($small_cap.length > 0) {
		if (/^\/$/.test(window.location.pathname)) {
			// $small_cap_pager and $small_cap_page are exclusive to frontpage, so let's not run them anywhere else.
			$.each($small_cap_pager, function(i, obj) {
				// Go though and check if they are one or two row pagers.
				var $obj = $(obj),
					rows = obj.classList.contains("onerow") ? 1 : 2,
					$small_cap_page = $obj.find(".small_cap_page");

				// Don't do anything to the video small_cap
				if (!obj.classList.contains("onerowvideo")) {
					$obj.css("height", parseInt($obj.css("height").replace("px", ""), 10) + (height_to_add * rows) + "px");
					$small_cap_page.css("height", parseInt($small_cap_page.css("height").replace("px", ""), 10) + (height_to_add * rows) + "px");
				}
			});
		}

		$small_cap.css("height", parseInt($small_cap.css("height").replace("px", ""), 10) + height_to_add + "px");
	}
}

function start_friend_activity_highlights() {
	var selectors = [
		".blotter_author_block a",
		".blotter_gamepurchase_details a",
		".blotter_daily_rollup_line a"
	];

	$.each(selectors, function (i, selector) {
		$.each($(selector), function(j, node){
			var appid = get_appid(node.href);
			if (appid && !node.classList.contains("blotter_userstats_game")) {
				if (selector == ".blotter_author_block a") { $(node).addClass("inline_tags"); }
				if (selector == ".blotter_daily_rollup_line a") {
					if ($(node).parent().parent().html().match(/<img src="(.+apps.+)"/)) {
						add_achievement_comparison_link($(node).parent().parent());
					}
				}

				on_app_info(appid, function(){
					highlight_app(appid, node);
				});
			}
		});
	});
}

function add_achievement_comparison_link(node) {
	if (!($(node).html().match(/es_achievement_compare/))&&!$(node).find("span:not(.nickname_block,.nickname_name)").attr("data-compare")) {
		$(node).find("span:not(.nickname_block,.nickname_name)").attr("data-compare","true");
		var links = $(node).find("a");
		var appid = get_appid(links[2].href);
		get_http(links[0].href + "/stats/" + appid, function(txt) {
			var html = txt.match(/<a href="(.+)compare">/);
			if (html) {
				$(node).find("span:not(.nickname_block,.nickname_name)").css("margin-top", "0px");
				$(node).find("span:not(.nickname_block,.nickname_name)").append("<br><a href='http://www.steamcommunity.com" + html[1] + "compare' class='es_achievement_compare' target='_blank' style='font-size: 10px; float: right; margin-right: 6px;'>(" + localized_strings[language].compare + ")</a>");
			}
		});
	}
}

function rewrite_string(string) {
	string = string.replace(/%20/g, " ");
	string = string.replace(/%28/g, "(");
	string = string.replace(/%29/g, ")");
	string = string.replace(/%3A/g, ":");
	string = string.replace(/%27/g, "'");
	string = string.replace(/%26/g, "&");
	string = string.replace(/%21/g, "!");
	string = string.replace(/%3F/g, "?");
	string = string.replace(/%2C/g, ",");
	string = string.replace(/%22/g, "\"");
	return string;
}

function highlight_market_items() {
	$.each($(".market_listing_row_link"), function (i, node) {
		var current_market_name = node.href.match(/steamcommunity.com\/market\/listings\/753\/(.+)\?/);
		if (!current_market_name) { current_market_name = node.href.match(/steamcommunity.com\/market\/listings\/753\/(.+)/); }
		if (current_market_name) {
			var item_name = rewrite_string(current_market_name[1]);
			var market_name = getValue("card:" + item_name);
			if (market_name) {
				storage.get(function(settings) {
					if (settings.highlight_owned_color === undefined) { settings.highlight_owned_color = "#5c7836";	storage.set({'highlight_owned_color': settings.highlight_owned_color}); }
					if (settings.highlight_owned === undefined) { settings.highlight_owned = true; storage.set({'highlight_owned': settings.highlight_owned}); }
					if (settings.highlight_owned) {
						node = $(node).find("div");
						$(node).css("backgroundImage", "none");
						$(node).css("color", "white");
						$(node).css("backgroundColor", settings.highlight_owned_color);
					}
				});
			}
		}
	});
}

function add_app_page_highlights(appid) {
	if (window.location.host == "store.steampowered.com") node = $(".apphub_HeaderStandardTop")[0];
	if (window.location.host == "steamcommunity.com") node = $(".apphub_HeaderTop")[0];

	on_app_info(appid, function(){
		highlight_app(appid, node);
	});
}

function add_app_page_wishlist(appid) {
	storage.get(function(settings) {
		if (settings.wlbuttoncommunityapp === undefined) { settings.wlbuttoncommunityapp = true; storage.set({'wlbuttoncommunityapp': settings.wlbuttoncommunityapp}); }
		if (settings.wlbuttoncommunityapp) {
			var wishlisted = getValue(appid + "wishlisted");
			var owned = getValue(appid+"owned");
			if(!wishlisted && !owned){
				$(".apphub_Stats").prepend('<div class="btn_darkblue_white_innerfade btn_medium" style="margin-right: 3px" id="es_wishlist"><span>' + localized_strings[language].add_to_wishlist + '</span>');
				$("#es_wishlist").click(function() {
					$.ajax({
						type:"POST",
						url:"http://store.steampowered.com/api/addtowishlist",
						data:{
							appid:appid
						},
						success: function( msg ) {
							$("#es_wishlist").addClass("btn_disabled");
							$("#es_wishlist").off("click");
							setValue(appid + "wishlisted",true);
						},
						error: function(e){
	        				console.log('Error: '+e);
    					}
					});
				});
			}
		}
	});
}

function on_app_info(appid, cb) {
	ensure_appid_deferred(appid);

	var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
	var last_updated = localStorage.getItem(appid) || expire_time - 1;

	// If we have no data on appid, or the data has expired; add it to appids to fetch new data.
	if (last_updated < expire_time) {
		get_app_details(appid);
	}
	else {
		appid_promises[appid].resolve();
	}

	// Bind highlighting.
	appid_promises[appid].promise.done(cb);
}

function add_steamcards_link(appid) {
	if ($(".icon").find('img[src$="/ico_cards.gif"]').length > 0) {
		$('.communitylink .block_content_inner:first').append("<a class='linkbar' href='http://steamcommunity.com/my/gamecards/" + appid + "'><div class='rightblock'><img src='" + chrome.extension.getURL("img/ico_cards.gif") + "' width='16' height='16' border='0' align='top' /></div>" + localized_strings[language].trading_cards + "</a>");
	}
}

function clear_cache() {
	localStorage.clear();
	sessionStorage.clear();
}

function change_user_background() {
	var steamID;
	if ($("#reportAbuseModal").length > 0) { steamID = document.getElementsByName("abuseID")[0].value; }
	if (steamID === undefined) { steamID = document.documentElement.outerHTML.match(/steamid"\:"(.+)","personaname/)[1]; }

	get_http("http://api.enhancedsteam.com/profile/?steam64=" + steamID, function (txt) {
		if (txt) {
			$(".no_header")[0].style.backgroundImage = "url(" + escapeHTML(txt) + ")";
			if ($(".profile_background_image_content").length > 0) {
				$(".profile_background_image_content")[0].style.backgroundImage = "url(" + escapeHTML(txt) + ")";
			} else {
				$(".no_header").addClass("has_profile_background");
				$(".profile_content").addClass("has_profile_background");
				$(".profile_content").prepend('<div class="profile_background_holder_content"><div class="profile_background_overlay_content"></div><div class="profile_background_image_content " style="background-image: url(' + escapeHTML(txt) + ');"></div></div></div>');
			}
		}
	});
}

function add_es_background_selection() {
	storage.get(function(settings) {
		if (settings.showesbg === undefined) { settings.showesbg = true; storage.set({'showesbg': settings.showesbg}); }
		if (settings.showesbg) {
			if (window.location.pathname.indexOf("/settings") < 0) {
				var steam64 = $(document.body).html();
				steam64 = steam64.match(/g_steamID = \"(.+)\";/)[1];
				var html = "<form id='es_profile_bg' method='POST' action='http://www.enhancedsteam.com/gamedata/profile_bg_save.php'><div class='group_content group_summary'>";
				html += "<input type='hidden' name='steam64' value='" + steam64 + "'>";
				html += "<div class='formRow'><div class='formRowFields'><div class='profile_background_current'><div class='profile_background_current_img_ctn'>";
				html += "<img id='es_profile_background_current_image' src=''>";
				html += "</div><div class='profile_background_current_description'><div id='profile_background_current_name'><select name='es_background' id='es_background' class='gray_bevel dynInput' onchange=\"function image(obj){index=obj.selectedIndex; document.getElementById('es_profile_background_current_image').src=obj.options[index].id; } image(this);\"><option value='0' id='http://www.enhancedsteam.com/gamedata/icons/smallblacksquare.jpg'>None Selected / No Change</option>";

				get_http("http://api.enhancedsteam.com/profile-select/?steam64=" + steam64, function (txt) {
					var data = JSON.parse(txt);

					var array = [];
					for (var key in data["backgrounds"]) {
						if (data["backgrounds"].hasOwnProperty(key)) {
						  array.push(data["backgrounds"][key]);
						}
					}

					array.sort(function(a,b) {
						if ( a.text == b.text ) return 0;
						return a.text < b.text ? -1 : 1;
					});

					$.each(array, function(index, value) {
						if (value["selected"]) {
							html += "<option id='" + escapeHTML(value['id'].toString()) + "' value='" + escapeHTML(value['index'].toString()) + "' SELECTED>" + escapeHTML(value['text'].toString()) + "</option>";
						} else {
							html += "<option id='" + escapeHTML(value['id'].toString()) + "' value='" + escapeHTML(value['index'].toString()) + "'>" + escapeHTML(value['text'].toString()) + "</option>";
						}
					});

					html += "</select></div></div><div style='clear: left;'></div><div class='background_selector_launch_area'></div></div><div class='background_selector_launch_area'>&nbsp;<div style='float: right;'><span class='btn_grey_white_innerfade btn_small' onclick=\"document.getElementById('es_profile_bg').submit()\"><span>" + localized_strings[language].save + "</span></span></div></div><div class='formRowTitle'>" + localized_strings[language].custom_background + ":<span class='formRowHint' title='" + localized_strings[language].custom_background_help + "'>(?)</span></div></div></div>";
					html += "</form>";

					$(".group_content_bodytext").before(html);

					get_http("http://api.enhancedsteam.com/profile-small/?steam64=" + steam64, function (txt) {
						$("#es_profile_background_current_image").attr("src", escapeHTML(txt));
					});
				});
			}
		}
	});
}

function fix_broken_sub_image() {
	var header = $(".package_header").attr("src");
	var img = $(".tab_item_img").find("img").attr("src").match(/(.+)\//)[0] + "header.jpg";
	$.ajax(header).error(function() { $(".package_header").attr("src", img); });
}

function add_feature_search_links () {
	var game_details = ($('.game_area_details_specs').filter(function(){ return !$(this).parents('div').hasClass('icon'); }));
	$.each(game_details, function(index, value) {
		// these will only work with English, until Valve either assigns IDs to these fields or has distinguishable icons
		if (value.innerHTML.match(/MMO/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=20&advanced=0'>"));
		}
		if (value.innerHTML.match(/Local Co-op/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=24&advanced=0'>"));
		}
		if (value.innerHTML.match(/Cross-Platform Multiplayer/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=27&advanced=0'>"));
		}

		// these have somewhat unique icons and should work everywhere
		if (value.innerHTML.match(/ico_multiPlayer/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=1&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_singlePlayer/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=2&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_mod_hl2/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=997&category2=6&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_mod_hl/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=997&category2=7&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_vac/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=8&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_coop/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=9&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_hdr/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=12&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_cc/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=13&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_commentary/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=14&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_stats/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=15&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_sdk/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=16&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_editor/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=17&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_partial_controller/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=18&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_dlc/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=21&category2=21&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_achievements/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=22&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_cloud/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=23&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_leaderboards/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=25&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_guide/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category2=26'>"));
		}
		if (value.innerHTML.match(/ico_controller/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=28&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_cards/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=29&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_workshop/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=30&advanced=0'>"));
		}
	});
}

function totalsize() {
	var html = $("html").html();
	var txt = html.match(/var rgGames = (.+);/);
	var games = JSON.parse(txt[1]);
	var mbt = 0;
	var gbt = 0;
	$.each(games, function(index, value) {
		if (value["client_summary"]) {
			if (/MiB/.test(value["client_summary"]["localContentSize"])) {
				var mb = value["client_summary"]["localContentSize"].match(/(.+) MiB/)
				mbt += parseFloat(mb[1]);
			}
			if (/GiB/.test(value["client_summary"]["localContentSize"])) {
				var gb = value["client_summary"]["localContentSize"].match(/(.+) GiB/)
				gbt += parseFloat(gb[1]);
			}
		}
	});

	mbt = (mbt / 1024);
	var total = (gbt + mbt).toFixed(2);
	$(".clientConnChangingText").before("<div style='float:right;'><p class='clientConnHeaderText'>" + localized_strings[language].total_size + ":</p><p class='clientConnMachineText'>" +total + " GiB</p></div.");
}

function totaltime() {
	var html = $("html").html();
	var txt = html.match(/var rgGames = (.+);/);
	var games = JSON.parse(txt[1]);
	var time = 0;
	$.each(games, function(index, value) {
		if (value["hours_forever"]) {
			time_str=value["hours_forever"].replace(",","");
			time+=parseFloat(time_str);
		}
	});
	var total = time.toFixed(1);
	$(".clientConnChangingText").before("<div style='float:right;'><p class='clientConnHeaderText'>" + localized_strings[language].total_time + ":</p><p class='clientConnMachineText'>" +total + " Hours</p></div>");
}

function add_gamelist_sort() {
	if ($(".clientConnChangingText").length > 0) {
		$("#gameslist_sort_options").append("&nbsp;&nbsp;<label id='es_gl_sort_size'><a>" + localized_strings[language].size + "</a></label>");

		$("#es_gl_sort_size").on("click", function() {
			var gameRowsGB = [];
			var gameRowsMB = [];

			$(".clientConnItemBlock").find(".clientConnItemText:last").each(function (index, value) {
				var push = new Array();
				var size = ($(value).text());
				var row = ($(this).parent().parent().parent().parent());

				if (size) {

					push[0] = row[0].outerHTML;
					push[1] = size.replace(" GiB", "").replace(" MiB", "").replace(",", "");

					if (size.match(/GiB/)) {
						gameRowsGB.push(push);
					}

					if (size.match(/MiB/)) {
						gameRowsMB.push(push);
					}

					$(row).remove();
				}
			});

			gameRowsGB.sort(function(a,b) { return parseInt(a[1],10) - parseInt(b[1],10); });
			gameRowsMB.sort(function(a,b) { return parseInt(a[1],10) - parseInt(b[1],10); });

			$(gameRowsMB).each(function() {
				$("#games_list_rows").prepend(this[0]);
			});

			$(gameRowsGB).each(function() {
				$("#games_list_rows").prepend(this[0]);
			});

			$(this).html("<span style='color: #B0AEAC;'>" + localized_strings[language].size + "</span>");
			var html = $("#gameslist_sort_options").find("span[class='selected_sort']").html();
			html = "<a onclick='location.reload()'>" + html + "</a>";
			$("#gameslist_sort_options").find("span[class='selected_sort']").html(html);
		});
	}
}

function add_gamelist_filter() {
	if ($(".clientConnChangingText").length > 0) {
		var html  = "<span>" + localized_strings[language].show + ": </span>";
		html += "<label class='es_sort' id='es_gl_all'><input type='radio' name='es_gl_sort' checked><span><a>" + localized_strings[language].games_all + "</a></span></label>";
		html += "<label class='es_sort' id='es_gl_installed'><input type='radio' name='es_gl_sort'><span><a>" + localized_strings[language].games_installed + "</a></span></label>";
		html += "</div>";

		$('#gameslist_sort_options').append("<br>" + html);

		$('#es_gl_all').on('click', function() {
			$('.gameListRow').css('display', 'block');
		});

		$('#es_gl_installed').on('click', function() {
			$('.gameListRowItem').not(".gameListItemInstalled").parent().css("display", "none");
		});
	}
}

function add_gamelist_achievements() {
	storage.get(function(settings) {
		if (settings.showallachievements === undefined) { settings.showallachievements = false; storage.set({'showallachievements': settings.showallachievements}); }
		if (settings.showallachievements) {
			// Only show stats on the "All Games" tab
			if (window.location.href.match(/\/games\?tab=all/)) {
				$(".gameListRow").each(function(index, value) {
					var appid = get_appid_wishlist(value.id);
					$(value).find(".bottom_controls").find("img").each(function () {
						// Get only items with achievements
						if ($(this).attr("src").indexOf("http://cdn.steamcommunity.com/public/images/skin_1/ico_stats.gif") == 0) {
							// Get only items with play time
							if (!($(value).html().match(/<h5><\/h5>/))) {
								// Copy achievement stats to row
								$(value).find(".gameListRowItemName").append("<div class='recentAchievements' id='es_app_" + appid + "' style='padding-top: 14px; padding-right: 4px; width: 205px; float: right; font-size: 10px; font-weight: normal;'>");
								$("#es_app_" + appid).html("Loading achievements...");
								$("#es_app_" + appid).load($(".profile_small_header_texture a")[0].href + '/stats/' + appid + ' #topSummaryAchievements', function(response, status, xhr) {
									var BarFull = $("#es_app_" + appid).html().match(/achieveBarFull\.gif" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])" height="12"/)[1];
									var BarEmpty = $("#es_app_" + appid).html().match(/achieveBarEmpty\.gif" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])" height="12"/)[1];
									BarFull = BarFull * .58;
									BarEmpty = BarEmpty * .58;
									var html = $("#es_app_" + appid).html();
									html = html.replace(/achieveBarFull\.gif" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])"/, "achieveBarFull.gif\" width=\"" + BarFull.toString() + "\"");
									html = html.replace(/achieveBarEmpty\.gif" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])"/, "achieveBarEmpty.gif\" width=\"" + BarEmpty.toString() + "\"");
									html = html.replace("::", ":");
									$("#es_app_" + appid).html(html);
								});
							}
						}
					});
				});
			}
		}
	});
}

function add_gamelist_common() {
	if($("label").attr("for")=="show_common_games") {
		get_http('http://api.enhancedsteam.com/steamapi/GetOwnedGames/?steamid=' + is_signed_in() + '&include_played_free_games=1', function (txt) {
			var data = JSON.parse(txt);
			$("#gameFilter").after("<span id=\"es_gl_comparison_mode\" style=\"margin-left:5px;\">"+localized_strings[language].comparison_mode+"</span>");
			$("#gameFilter").after("<input type=\"checkbox\" id=\"es_gl_show_notcommon_games\"><label for=\"es_gl_show_notcommon_games\" id=\"es_gl_show_notcommon_games_label\">"+localized_strings[language].notcommon_label+"</label>");
			$("#gameFilter").after("<input type=\"checkbox\" id=\"es_gl_show_common_games\"><label for=\"es_gl_show_common_games\" id=\"es_gl_show_common_games_label\">"+localized_strings[language].common_label+"</label>");
			$("#es_gl_show_common_games, #es_gl_show_notcommon_games, #es_gl_show_notcommon_games_label, #es_gl_show_common_games_label").hide();
			$("#show_common_games").next().hide();
			$("#show_common_games").hide();
			if (data.response && Object.keys(data.response).length > 0) {
				library_all_games = data.response.games;
			}
			function game_id_toggle(show_toggle) {
				$.each(library_all_games, function(i,obj){
					$("#game_"+obj.appid).toggle();
				});
			}
			function es_gl_show_checks(){
				$("#es_gl_show_common_games, #es_gl_show_notcommon_games, #es_gl_show_notcommon_games_label, #es_gl_show_common_games_label").show();
				$("#es_gl_comparison_mode").hide();
			}
			$("#es_gl_show_notcommon_games").on("change", function() {
				game_id_toggle();
			});
			$("#es_gl_show_common_games").on("change", function() {
				$(".gameListRow").toggle();
				game_id_toggle();
			});
			$("#es_gl_show_common_games, #es_gl_show_notcommon_games").on("change", function() {
				var num = $("#games_list_rows > .gameListRow:visible").length;
				var scroll_info = $(".scroll_info").first().text().split(" ");
				if(scroll_info[2]==scroll_info[4]) scroll_info[2]=num;
				scroll_info[4]=num;
				$(".scroll_info").text(scroll_info.join(" "));
			});
			if($("#all_pp").hasClass("active")) {
				es_gl_show_checks();
			}
			$("#10_pp, #25_pp, #50_pp").on("click", function() {
				$("#es_gl_show_common_games, #es_gl_show_notcommon_games, #es_gl_show_notcommon_games_label, #es_gl_show_common_games_label").hide();
				$(".gameListRow, #es_gl_comparison_mode").show();
				$("#es_gl_show_common_games, #es_gl_show_notcommon_games").prop("checked",false);
			});
			$("#all_pp").on("click", function(){
				es_gl_show_checks();
			});
		});
	}
}

function get_gamecard(t) {
	if (t && t.match(/(?:id|profiles)\/.+\/gamecards\/(\d+)/)) return RegExp.$1;
	else return null;
}

function add_cardexchange_links(game) {
	storage.get(function(settings) {
		if (settings.steamcardexchange === undefined) { settings.steamcardexchange = true; storage.set({'steamcardexchange': settings.steamcardexchange}); }
		if (settings.steamcardexchange) {
			xpath_each("//div[contains(@class,'badge_row')]", function (node) {
				var $node = $(node);
				var gamecard = game || get_gamecard($node.find(".badge_row_overlay").attr('href'));
				if(!gamecard) return;
				$node.prepend('<div style="position: absolute; z-index: 3; top: 12px; right: 12px;" class="es_steamcardexchange_link"><a href="http://www.steamcardexchange.net/index.php?gamepage-appid-' + gamecard + '" target="_blank" alt="Steam Card Exchange" title="Steam Card Exchange"><img src="' + chrome.extension.getURL('img/ico/steamcardexchange.png') + '" width="24" height="24" border="0" /></a></div>');
				$node.find(".badge_title_row").css("padding-right", "44px");
			});
		}
	});
}

function add_badge_filter() {
	if ( $(".profile_small_header_texture a")[0].href == $(".user_avatar a")[0].href) {
		var html  = "<div style='text-align: right;'><span>" + localized_strings[language].show + ": </span>";
			html += "<label class='badge_sort_option whiteLink es_badges' id='es_badge_all'><input type='radio' name='es_badge_sort' checked><span>" + localized_strings[language].badges_all + "</span></label>";
			html += "<label class='badge_sort_option whiteLink es_badges' id='es_badge_drops'><input type='radio' name='es_badge_sort'><span>" + localized_strings[language].badges_drops + "</span></label>";
			html += "</div>";

		$('.profile_badges_header').append(html);

		$('#es_badge_all').on('click', function() {
			$('.is_link').css('display', 'block');
		});

		$('#es_badge_drops').on('click', function() {
			$('.is_link').each(function () {
				if ($(this).html().match(/progress_info_bold">\D/)) {
					$(this).css('display', 'none');
				} else {
					if ($(this).html().match(/badge_info_unlocked/)) {
						if (!($(this).html().match(/badge_current/))) {
							$(this).css('display', 'none');
						}
					}
					// Hide foil badges too
					if (!($(this).html().match(/progress_info_bold/))) {
						$(this).css('display', 'none');
					}
				}
			});
		});
	}
}

function add_badge_view_options() {
	var html  = "<div style='text-align: right;'><span>" + localized_strings[language].view + ": </span>";
		html += "<label class='badge_sort_option whiteLink es_badges' id='es_badge_view_default'><input type='radio' name='es_badge_view' checked><span>" + localized_strings[language].theworddefault + "</span></label>";
		html += "<label class='badge_sort_option whiteLink es_badges' id='es_badge_view_binder'><input type='radio' name='es_badge_view'><span>" + localized_strings[language].binder_view + "</span></label>";
		html += "</div>";

	$('.profile_badges_header').append(html);

	$("#es_badge_view_default").on('click', function() {
		window.location.reload();
	});

	$("#es_badge_view_binder").on('click', function() {
		$('.is_link').each(function () {
			var stats = $(this).find("span[class$='progress_info_bold']").html();
			$(this).find("div[class$='badge_cards']").remove();
			$(this).find("div[class$='badge_title_stats']").css("display", "none");
			$(this).find("div[class$='badge_description']").css("display", "none");
			$(this).find("span[class$='badge_view_details']").remove();
			$(this).find("div[class$='badge_info_unlocked']").remove();
			$(this).find("div[class$='badge_progress_tasks']").remove();
			$(this).find("div[class$='badge_progress_info']").css("padding", "0");
			$(this).find("div[class$='badge_progress_info']").css("float", "none");
			$(this).find("div[class$='badge_progress_info']").css("margin", "0");
			$(this).find("div[class$='badge_progress_info']").css("width", "auto");
			$(this).find("div[class$='badge_title']").css("font-size", "12px");
			$(this).find("div[class$='badge_title_row']").css("padding-top", "0px");
			$(this).find("div[class$='badge_title_row']").css("padding-right", "4px");
			$(this).find("div[class$='badge_title_row']").css("padding-left", "4px");
			$(this).find("div[class$='badge_title_row']").css("height", "24px");
			$(this).find("div[class$='badge_row_inner']").css("height", "195px");
			$(this).find("div[class$='badge_current']").css("width", "100%");
			$(this).find("div[class$='badge_empty_circle']").css("float", "center");
			$(this).find("div[class$='badge_empty_circle']").css("margin-left", "45px");
			$(this).find("div[class$='badge_info_image']").css("float", "center");
			$(this).find("div[class$='badge_info_image']").css("margin-right", "0px");
			$(this).find("div[class$='badge_content']").css("padding-top", "0px");
			$(this).css("width", "160px");
			$(this).css("height", "195px");
			$(this).css("float", "left");
			$(this).css("margin-right", "15px");
			$(this).css("margin-bottom", "15px");
			if (stats && stats.match(/\d+/)) {
				if (!($(this).find("span[class$='es_game_stats']").length > 0)) {
					$(this).find("div[class$='badge_content']").first().append("<span class='es_game_stats' style='color: #5491cf; font-size: 12px; white-space: nowrap;'>" + stats + "</span>");
				}
			}
			if ($(this).find("div[class$='badge_progress_info']").text()) {
				var card = $(this).find("div[class$='badge_progress_info']").text().trim().match(/(\d+)\D*(\d+)/)[1] + " / " + $(this).find("div[class$='badge_progress_info']").text().trim().match(/(\d+)\D*(\d+)/)[2];
				$(this).find("div[class$='badge_progress_info']").text(card);
			}
		});

		$(".es_steamcardexchange_link").remove();
		$(".badges_sheet").css("text-align", "center");
		$(".badges_sheet").css("margin-left", "32px");
		$(".badge_empty").css("border", "none");
		$("#footer_spacer").before('<div style="display: block; clear: both;"></div>');
	});
}

function add_gamecard_foil_link() {
	if ($(".progress_info_bold").length > 0) {
		$(".gamecards_inventorylink").append("<a class='btn_grey_grey btn_small_thin' href='" + window.location + "?border=1'><span>View Foil Badge Progress</span></a>");
	}
}

function add_gamecard_market_links(game) {
	var foil = $(".progress_info_bold").length - 1;

	$(".badge_card_set_card, .badge_card_to_collect_info").each(function() {
		var cardname = $(this).html().match(/(.+)<div style=\"/)[1].trim();
		if (cardname == "") { cardname = $(this).html().match(/<div class=\"badge_card_set_text\">(.+)<\/div>/)[1].trim(); }

		cardname = cardname.replace("&amp;", "&");

		var newcardname = cardname.replace(/'/g, "%27").replace(/\?/g, "%3F").replace(/&/g, "%26");

		if (foil) { newcardname = newcardname + " (Foil)"; }
		var marketlink = "http://steamcommunity.com/market/listings/753/" + game + "-" + newcardname;
		var node = $(this);

		// Test market link to see if valid.  Some cards have "(Trading Card)" on the end of their name
		get_http(marketlink, function (txt) {
			if (/<div id=\"largeiteminfo\">/.test(txt) == false) {
				if (foil) {
					newcardname = newcardname.replace(/\)$/, "");
					marketlink = "http://steamcommunity.com/market/listings/753/" + game + "-" + newcardname + " Trading Card)";
				} else {
					marketlink = "http://steamcommunity.com/market/listings/753/" + game + "-" + newcardname + " (Trading Card)";
				}
			}

			var html = $(node).children("div:contains('" + cardname + "')").html().replace("&amp;", "&");
			html = html.replace(cardname, "<a href='" + marketlink + "' target='_blank'>" + cardname + "</a>");

			$(node).children("div:contains('" + cardname + "')").replaceWith(html);
		});
	});
}

function add_total_drops_count() {
	var drops_count = 0;
	var drops_games = 0;
	var booster_games = 0;
	$(".progress_info_bold").each(function(i, obj) {
		var parent = ($(obj).parent().parent().html().trim());
		if (!(parent.match(/^<div class="badge_title_stats">/))) {
			return false;
		}

		var obj_count = obj.innerHTML.match(/\d+/);
		if (obj_count) {
			drops_count += parseInt(obj_count[0]);
			drops_games = drops_games + 1;
		}
	});

	get_http("http://steamcommunity.com/my/ajaxgetboostereligibility/", function(txt) {
		var eligible = $.parseHTML(txt);
		$(eligible).find(".booster_eligibility_games").children().each(function(i, obj) {
			booster_games += 1;
		});

		$(".profile_xp_block_right").html("<span style='color: #fff;'>" + localized_strings[language].card_drops_remaining.replace("__drops__", drops_count) + "<br>" + localized_strings[language].games_with_drops.replace("__dropsgames__", drops_games) + "<br>" + localized_strings[language].games_with_booster.replace("__boostergames__", booster_games) + "</span>");
	});
}

$(document).ready(function(){
	is_signed_in();

	localization_promise.done(function(){
		// Don't interfere with Storefront API requests
		if (window.location.pathname.startsWith("/api")) return;
		// On window load...
		add_enhanced_steam_options();
		add_fake_country_code_warning();
		remove_install_steam_button();
		remove_about_menu();
		remove_community_new();
		add_header_links();
		if (is_signed_in()) {
			replace_account_name();
			add_library_menu();
		}

		// attach event to the logout button
		$('a[href$="http://store.steampowered.com/logout/"]').bind('click', clear_cache);

		switch (window.location.host) {
			case "store.steampowered.com":

				switch (true) {
					case /^\/cart\/.*/.test(window.location.pathname):
						add_empty_cart_button();
						break;

					case /^\/app\/.*/.test(window.location.pathname):
						var appid = get_appid(window.location.host + window.location.pathname);
						add_app_page_wishlist(appid);
						load_inventory().done(function() {
							if (getValue(appid+"coupon")) display_coupon_message(appid);
						});
						show_pricing_history(appid, "app");
						dlc_data_from_site(appid);

						drm_warnings();
						add_metacritic_userscore();
						display_purchase_date()

						fix_community_hub_links();
						add_widescreen_certification(appid);
						add_hltb_info(appid);
						add_pcgamingwiki_link(appid);
						add_app_page_highlights(appid);
						add_steamdb_links(appid, "app");
						add_steamcards_link(appid);
						add_feature_search_links();
						add_dlc_page_link(appid);
						add_remove_from_wishlist_button(appid);
						add_4pack_breakdown();
						add_package_info_button();
						add_steamchart_info(appid);
						dlc_data_for_app_page()

						show_regional_pricing();
						break;

					case /^\/sub\/.*/.test(window.location.pathname):
						var subid = get_subid(window.location.host + window.location.pathname);
						drm_warnings();
						subscription_savings_check();
						show_pricing_history(subid, "sub");
						add_steamdb_links(subid, "sub");
						add_feature_search_links();
						fix_broken_sub_image();

						show_regional_pricing();
						break;

					case /^\/agecheck\/.*/.test(window.location.pathname):
						send_age_verification();
						break;

					case /^\/dlc\/.*/.test(window.location.pathname):
						dlc_data_for_dlc_page();
						break;

					case /^\/account\/.*/.test(window.location.pathname):
						account_total_spent();
						replace_account_name();
						break;

					case /^\/search\/.*/.test(window.location.pathname):
						//add_cart_to_search();
						endless_scrolling();
						remove_non_specials();
						break;

					case /^\/sale\/.*/.test(window.location.pathname):
						show_regional_pricing();
						break;

					// Storefront-front only
					case /^\/$/.test(window.location.pathname):
						add_carousel_descriptions();
						add_affordable_button();
						show_regional_pricing();
						break;
				}

				/* Highlights & data fetching */
				start_highlights_and_tags();

				// Storefront homepage tabs.
				bind_ajax_content_highlighting();

				add_small_cap_height();

				break;

			case "steamcommunity.com":

				add_wallet_balance_to_header();

				switch (true) {
					case /^\/(?:id|profiles)\/.+\/wishlist/.test(window.location.pathname):
						appdata_on_wishlist();
						fix_wishlist_image_not_found();
						add_empty_wishlist_buttons();
						add_wishlist_filter();
						add_wishlist_discount_sort();
						add_wishlist_total();

						// wishlist highlights
						start_highlights_and_tags();
						break;

					case /^\/(?:id|profiles)\/.+\/\b(home|myactivity|status)\b/.test(window.location.pathname):
						start_friend_activity_highlights();
						bind_ajax_content_highlighting();
						hide_activity_spam_comments();
						break;

					case /^\/(?:id|profiles)\/.+\/edit/.test(window.location.pathname):
						add_es_background_selection();
						break;

					case /^\/(?:id|profiles)\/.+\/inventory\/.*/.test(window.location.pathname):
						bind_ajax_content_highlighting();
						inventory_market_prepare();
						break;

					case /^\/(?:id|profiles)\/(.+)\/games/.test(window.location.pathname):
						totaltime();
						totalsize();
						add_gamelist_achievements();
						add_gamelist_sort();
						add_gamelist_filter();
						add_gamelist_common();
						break;

					case /^\/(?:id|profiles)\/.+\/badges/.test(window.location.pathname):
						add_total_drops_count();
						add_cardexchange_links();
						add_badge_filter();
						add_badge_view_options();
						break;

					case /^\/(?:id|profiles)\/.+\/gamecard/.test(window.location.pathname):
						var gamecard = get_gamecard(window.location.pathname);
						add_cardexchange_links(gamecard);
						add_gamecard_market_links(gamecard);
						add_gamecard_foil_link();
						break;

					case /^\/(?:id|profiles)\/.+/.test(window.location.pathname):
						add_community_profile_links();
						change_user_background();
						fix_profile_image_not_found();
						hide_spam_comments();
						break;

					case /^\/(?:sharedfiles|workshop)\/.*/.test(window.location.pathname):
						hide_greenlight_banner();
						hide_spam_comments();
						break;

					case /^\/market\/.*/.test(window.location.pathname):
						load_inventory().done(function() {
							highlight_market_items();
							bind_ajax_content_highlighting();
						});
						add_market_total();
						add_active_total();
						minimize_active_listings();
						break;

					case /^\/app\/.*/.test(window.location.pathname):
						var appid = get_appid(window.location.host + window.location.pathname);
						add_app_page_highlights(appid);
						add_app_page_wishlist(appid);
						hide_spam_comments();
						add_steamdb_links(appid, "gamehub");
						break;

					case /^\/games\/.*/.test(window.location.pathname):
						var appid = document.querySelector( 'a[href*="http://steamcommunity.com/app/"]' );
						appid = appid.href.match( /(\d)+/g );
						add_steamdb_links(appid, "gamegroup");
						break;

					case /^\/$/.test(window.location.pathname):
						hide_spam_comments();
						break;
				}
				break;
		}
	});
});
