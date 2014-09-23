// Version 6.7
var version = "6.7"

var console_info=["%c Enhanced %cSteam v"+version+" by jshackles %c http://www.enhancedsteam.com ","background: #000000;color: #7EBE45", "background: #000000;color: #ffffff",""];
console.log.apply(console,console_info);

var storage = chrome.storage.sync;
var apps;
var info = 0;
var isSignedIn = false;
var signedInChecked = false;
var search_threshhold = $(window).height() - 80;

var total_requests = 0;
var processed_requests = 0;

var cookie = document.cookie;

if (cookie.match(/steam_language=([a-z]{3})/i)) {
	var language = cookie.match(/steam_language=([a-z]{3})/i)[1];
} else {
	var language = "eng";
}

if (localized_strings[language] === undefined) { language = "eng"; }

// Set language for options page
chrome.storage.sync.set({'language': language});

// Global scope promise storage; to prevent unecessary API requests
var loading_inventory;
var appid_promises = {};
var library_all_games = [];

MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

// Run script in the context of the current tab
function runInPageContext(fun){
    var script  = document.createElement('script');
	script.textContent = '(' + fun + ')();';
	document.documentElement.appendChild(script);
	script.parentNode.removeChild(script);
}

// Chrome storage functions
function setValue(key, value) {
	localStorage.setItem(key, JSON.stringify(value));
}

function getValue(key) {
	var v = localStorage.getItem(key);
	if (v === undefined) return v;
	return JSON.parse(v);
}

function delValue(key) {
	localStorage.removeItem(key);
}

// Helper prototypes
String.prototype.startsWith = function(prefix) {
	return this.indexOf(prefix) === 0;
};

String.prototype.contains = function(it) {
	return this.indexOf(it) != -1;
};

Array.prototype.chunk = function(chunkSize) {
    var R = [];
    for (var i=0; i<this.length; i+=chunkSize)
        R.push(this.slice(i,i+chunkSize));
    return R;
}

function formatCurrency(number, type) {
	var places, symbol, thousand, decimal, right;

	switch (type) {
		case "BRL":
			places = 2; symbol = "R$ "; thousand = "."; decimal = ","; right = false;
			break;
		case "EUR":
			places = 2; symbol = "€"; thousand = ","; decimal = "."; right = true;
			break;
		case "GBP":
			places = 2; symbol = "£"; thousand = ","; decimal = "."; right = false;
			break;
		case "RUB":
			places = 0; symbol = " pуб."; thousand = ""; decimal = ","; right = true;
			if (number % 1 != 0) { places = 2; }
			break;
		case "JPY":
			places = 0; symbol = "¥ "; thousand = ","; decimal = "."; right = false;
			break;
		case "MYR":
			places = 2; symbol = "RM"; thousand = ","; decimal = "."; right = false;
			break;
		case "NOK":
			places = 2; symbol = " kr"; thousand = "."; decimal = ","; right = true;
			break;
		case "IDR":
			places = 2; symbol = "Rp "; thousand = ""; decimal = "."; right = false;
			break;
		case "PHP":
			places = 2; symbol = "P"; thousand = ","; decimal = "."; right = false;
			break;
		case "SGD":
			places = 2; symbol = "S$"; thousand = ","; decimal = "."; right = false;
			break;
		case "THB":
			places = 2; symbol = "฿"; thousand = ","; decimal = "."; right = false;
			break;
		case "VND":
			places = 2; symbol = "₫"; thousand = ","; decimal = "."; right = false;
			break;
		case "KRW":
			places = 2; symbol = "₩"; thousand = ","; decimal = "."; right = false;
			break;
		case "TRY":
			places = 2; symbol = " TL"; thousand = ""; decimal = ","; right = true;
			break;
		case "UAH":
			places = 2; symbol = "₴"; thousand = ""; decimal = ","; right = true;
			break;
		case "MXN":
			places = 2; symbol = "Mex$ "; thousand = ","; decimal = "."; right = false;
			break;
		case "CAD":
			places = 2; symbol = "C$ "; thousand = ","; decimal = "."; right = false;
			break;
		case "AUD":
			places = 2; symbol = "A$ "; thousand = ","; decimal = "."; right = false;
			break;
		case "NZD":
			places = 2; symbol = "NZ$ "; thousand = ","; decimal = "."; right = false;
			break;
		default:
			places = 2; symbol = "$"; thousand = ","; decimal = "."; right = false;
			break;
	}

	var negative = number < 0 ? "-" : "",
		i = parseInt(number = Math.abs(+number || 0).toFixed(places), 10) + "",
		j = (j = i.length) > 3 ? j % 3 : 0;
	if (right) {
		return negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) + (places ? decimal + Math.abs(number - i).toFixed(places).slice(2) : "") + symbol;
	} else {
		return symbol + negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) + (places ? decimal + Math.abs(number - i).toFixed(places).slice(2) : "");
	}
}

function currency_symbol_to_type (currency_symbol) {
	switch (currency_symbol) {
		case "pуб":
			return "RUB";
		case "€":
			return "EUR";
		case "£":
			return "GBP";
		case "R$":
			return "BRL";
		case "¥":
			return "JPY";
		case "kr":
			return "NOK";
		case "Rp":
			return "IDR";
		case "RM":
			return "MYR";
		case "P":
			return "PHP";
		case "S$":
			return "SGD";
		case "฿":
			return "THB";
		case "₫":
			return "VND";
		case "₩":
			return "KRW";
		case "TL":
			return "TRY";
		case "₴":
			return "UAH";
		case "Mex$":
			return "MXN";
		case "C$":
			return "CAD";
		case "A$":
			return "AUD";
		case "NZ$":
			return "NZD";
		default:
			return "USD";
	}
}

function currency_symbol_from_string (string_with_symbol) {
	var return_string = "";
	if (string_with_symbol.match(/(?:R\$|S\$|\$|RM|kr|Rp|€|¥|£|฿|pуб|P|₫|₩|TL|₴|Mex\$|C\$|A\$|NZ\$)/)) {
		return_string = string_with_symbol.match(/(?:R\$|S\$|\$|RM|kr|Rp|€|¥|£|฿|pуб|P|₫|₩|TL|₴|Mex\$|C\$|A\$|NZ\$)/)[0];
	}
	return return_string;
}

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

function get_http(url, callback) {
	total_requests += 1;
	$("#es_progress").attr({"max": 100, "title": localized_strings[language].ready.loading});
	$("#es_progress").removeClass("complete");
	var http = new XMLHttpRequest();
	http.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			processed_requests += 1;
			var complete_percentage = (processed_requests / total_requests) * 100;
			$("#es_progress").val(complete_percentage);
			if (complete_percentage == 100) { $("#es_progress").addClass("complete").attr("title", localized_strings[language].ready.ready); }
			callback(this.responseText);
		}

		if (this.readyState == 4 && this.status != 200) {
			$("#es_progress").val(100).addClass("error").attr({"title":localized_strings[language].ready.errormsg, "max":1});
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

// Check if the user is signed in
function is_signed_in() {
	if (!signedInChecked) {
		var steamLogin = getCookie("steamLogin");
		if (steamLogin) isSignedIn = steamLogin.replace(/%.*/, "").match(/^\d+/);
		signedInChecked = true;
	}
	return isSignedIn;
}

// Color the tile for owned games
function highlight_owned(node) {
	storage.get(function(settings) {
		node.classList.add("es_highlight_owned");

		if (settings.highlight_owned_color === undefined) { settings.highlight_owned_color = "#5c7836";	storage.set({'highlight_owned_color': settings.highlight_owned_color}); }
		if (settings.highlight_owned === undefined) { settings.highlight_owned = true; storage.set({'highlight_owned': settings.highlight_owned}); }
		if (settings.hide_owned === undefined) { settings.hide_owned = false; chrome.storage.sync.set({'hide_owned': settings.hide_owned}); }
		if (settings.hide_owned_homepage === undefined) { settings.hide_owned_homepage = false; chrome.storage.sync.set({'hide_owned_homepage': settings.hide_owned_homepage}); }

		if (settings.highlight_owned) highlight_node(node, settings.highlight_owned_color);
		if (settings.hide_owned) hide_node(node);
		if (settings.hide_owned_homepage) hide_node(node);

		if (settings.tag_owned === undefined) { settings.tag_owned = false; storage.set({'tag_owned': settings.tag_owned}); }
		if (settings.tag_owned_color === undefined) { settings.tag_owned_color = "#5c7836";	storage.set({'tag_owned_color': settings.tag_owned_color}); }
		if (settings.tag_owned) add_tag(node, localized_strings[language].tag.owned, settings.tag_owned_color);
	});
}

// Color the tile for wishlist games
function highlight_wishlist(node) {
	storage.get(function(settings) {
		node.classList.add("es_highlight_wishlist");

		if (settings.highlight_wishlist_color === undefined) { settings.highlight_wishlist_color = "#496e93";	storage.set({'highlight_wishlist_color': settings.highlight_wishlist_color}); }
		if (settings.highlight_wishlist === undefined) { settings.highlight_wishlist = true; storage.set({'highlight_wishlist': settings.highlight_wishlist}); }
		if (settings.highlight_wishlist) highlight_node(node, settings.highlight_wishlist_color);

		if (settings.tag_wishlist_color === undefined) { settings.tag_wishlist_color = "#496e93";	storage.set({'tag_wishlist_color': settings.tag_wishlist_color}); }
		if (settings.tag_wishlist === undefined) { settings.tag_wishlist = false; storage.set({'tag_wishlist': settings.tag_wishlist}); }
		if (settings.tag_wishlist) add_tag(node, localized_strings[language].tag.wishlist, settings.highlight_wishlist_color);
	});
}

// Color the tile for items with coupons
function highlight_coupon(node, discount) {
		node.classList.add("es_highlight_coupon");

	storage.get(function(settings) {
		if (settings.highlight_coupon_color === undefined) { settings.highlight_coupon_color = "#6b2269"; storage.set({'highlight_coupon_color': settings.highlight_coupon_color}); }
		if (settings.highlight_coupon === undefined) { settings.highlight_coupon = false; storage.set({'highlight_coupon': settings.highlight_coupon}); }
		if (settings.highlight_coupon) highlight_node(node, settings.highlight_coupon_color);

		if (settings.tag_coupon_color === undefined) { settings.tag_coupon_color = "#6b2269"; storage.set({'tag_coupon_color': settings.tag_coupon_color}); }
		if (settings.tag_coupon === undefined) { settings.tag_coupon = true; storage.set({'tag_coupon': settings.tag_coupon}); }
		if (settings.tag_coupon) add_tag(node, localized_strings[language].tag.coupon + " (" + discount + "%)", settings.highlight_coupon_color);
	});
}

// Color the tile for items in inventory
function highlight_inv_gift(node) {
	storage.get(function(settings) {
		node.classList.add("es_highlight_inv_gift");

		if (settings.highlight_inv_gift_color === undefined) { settings.highlight_inv_gift_color = "#a75124"; storage.set({'highlight_inv_gift_color': settings.highlight_inv_gift_color}); }
		if (settings.highlight_inv_gift === undefined) { settings.highlight_inv_gift = false; storage.set({'highlight_inv_gift': settings.highlight_inv_gift}); }
		if (settings.highlight_inv_gift) highlight_node(node, settings.highlight_inv_gift_color);

		if (settings.tag_inv_gift_color === undefined) { settings.tag_inv_gift_color = "#a75124"; storage.set({'tag_inv_gift_color': settings.tag_inv_gift_color}); }
		if (settings.tag_inv_gift === undefined) { settings.tag_inv_gift = true; storage.set({'tag_inv_gift': settings.tag_inv_gift}); }
		if (settings.tag_inv_gift) add_tag(node, localized_strings[language].tag.inv_gift, settings.highlight_inv_gift_color);
	});
}

// Color the tile for items in inventory
function highlight_inv_guestpass(node) {
	storage.get(function(settings) {
		node.classList.add("es_highlight_inv_guestpass");

		if (settings.highlight_inv_guestpass_color === undefined) { settings.highlight_inv_guestpass_color = "#a75124"; storage.set({'highlight_inv_guestpass_color': settings.highlight_inv_guestpass_color}); }
		if (settings.highlight_inv_guestpass === undefined) { settings.highlight_inv_guestpass = false; storage.set({'highlight_inv_guestpass': settings.highlight_inv_guestpass}); }
		if (settings.highlight_inv_guestpass) highlight_node(node, settings.highlight_inv_guestpass_color);

		if (settings.tag_inv_guestpass_color === undefined) { settings.tag_inv_guestpass_color = "#a75124"; storage.set({'tag_inv_guestpass_color': settings.tag_inv_guestpass_color}); }
		if (settings.tag_inv_guestpass === undefined) { settings.tag_inv_guestpass = true; storage.set({'tag_inv_guestpass': settings.tag_inv_guestpass}); }
		if (settings.tag_inv_guestpass) add_tag(node, localized_strings[language].tag.inv_guestpass, settings.highlight_inv_guestpass_color);
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

	// Set text colour to not conflict with highlight
	if (node.classList.contains("tab_row")) $node.find(".tab_desc").css("color", "lightgrey");
	if (node.classList.contains("search_result_row")) $node.find(".search_name").css("color", "lightgrey");
}

function hide_node(node) {
	storage.get(function(settings) {
		if (settings.hide_owned === undefined) { settings.hide_owned = false; chrome.storage.sync.set({'hide_owned': settings.hide_owned}); }
		if (settings.hide_owned_homepage === undefined) { settings.hide_owned_homepage = false; chrome.storage.sync.set({'hide_owned_homepage': settings.hide_owned_homepage}); }
		if (settings.hide_dlcunownedgames === undefined) { settings.hide_dlcunownedgames = false; chrome.storage.sync.set({'hide_dlcunownedgames': settings.hide_dlcunownedgames}); }

		if ($(node).hasClass("info") || $(node).hasClass("dailydeal") || $(node).hasClass("spotlight_content") || $(node).hasClass("browse_tag_game_cap")) { node = $(node).parent()[0]; }

		if (settings.hide_owned) {
			if (node.classList.contains("search_result_row") || node.classList.contains("game_area_dlc_row") || node.classList.contains("item") || node.classList.contains("cluster_capsule") || node.classList.contains("browse_tag_game")) {
				hide_the_node(node);
				search_threshhold = search_threshhold - 58;
				if ($(document).height() <= $(window).height()) {
					load_search_results();
				}
			}
		}
		
		// Hide owned items from the store homepage
		if (settings.hide_owned_homepage) {
			if (node.classList.contains("tab_row") || node.classList.contains("small_cap") || node.classList.contains("nopad") || $(node).hasClass("home_area_spotlight")) {
				$(node).css("visibility", "hidden");
			}
		}
		
		// Hide DLC for unowned items
		if (settings.hide_dlcunownedgames) {
			if (node.classList.contains("search_result_row") || node.classList.contains("game_area_dlc_row") || node.classList.contains("item") || node.classList.contains("cluster_capsule")) {
				hide_the_node(node);
			}
		}
	});
}

function hide_the_node(node) {
	$(node).css("display", "none");
}

function add_tag (node, string, color) {
	/* To add coloured tags to the end of app names instead of colour
	highlighting; this allows an to be "highlighted" multiple times; e.g.
	inventory and owned. */
	node.tags = node.tags || [];
	var tagItem = [string, color];
	var already_tagged = false;

	// Check if it isn't already tagged
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

		$tag.css({
			"backgroundColor": tag[1],
			"color": "white",
			"float": "right",
			"padding": "2px",
			"margin-right": "4px",
			"margin-bottom": "4px",
			"border": "1px solid #262627"
		});

		return $tag;
	};

	if (node.tags) {

		// Make tags
		$tags = $("<div class=\"tags\"></div>");
		for (var i = 0; i < node.tags.length; i++) {
			var tag = node.tags[i];
			var $tag = new_display_tag(tag[0], tag[1]);
			$tags.append($tag);
		}

		// Apply tags differently per type of node
		var $tag_root;
		if (node.classList.contains("tab_row")) {
			$tag_root = $(node).find(".tab_desc").removeClass("with_discount");
			remove_existing_tags($tag_root);

			$(node).find(".tab_discount").css("top","15px");
			
			$tag_root.find("h4").after($tags);
		}
		else if (node.classList.contains("search_result_row")) {
			$tag_root = $(node).find(".search_name");
			remove_existing_tags($tag_root);

			$tags.css({
				"display": "inline-block",
				"vertical-align": "middle",
				"font-size": "small"
			});

			$tag_root.find("p").prepend($tags);

			// Remove margin-bottom, border, and tweak padding on carousel lists
			$.each($tag_root.find(".tags span"), function (i, obj) {
				$(obj).css({
					"margin-bottom": "0",
					"border": "0",
					"padding": "3px"
				});
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
			$tags.css({
				"display": "table",
				"margin-top": "4px"
			});
			$tag_root.find("h4").before($tags);
		}
		else if (node.classList.contains("browse_tag_game")) {
			$tag_root = $(node);
			remove_existing_tags($tag_root);
			$tags.css("display", "table");
			$tags.css("margin-left", "8px");
			$tag_root.find(".browse_tag_game_price").after($tags);
		}
		else if (node.classList.contains("game_area_dlc_row")) {
			$tag_root = $(node);
			remove_existing_tags($tag_root);

			var clone = $(node).clone();
			clone.css({
				visibility:'hidden',
				width : '',
				height: '',
				maxWidth : '',
				maxHeight: ''
			});
			$('body').append(clone);
			var width = $(clone).find(".game_area_dlc_price").width();
			clone.remove();
			
			$tags.css("margin-right", width + 3);
			$tag_root.find(".game_area_dlc_name").before($tags);

			// Remove margin-bottom on DLC lists to prevent horrible pyramidding
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

			$tags.css({
				"float": "right",
				"width": "130px",
				"margin-top": "30px"
			});	

			$tag_root.find(".match_price").after($tags);
		}
		else if (node.classList.contains("cluster_capsule")) {
			$tag_root = $(node);
			remove_existing_tags($tag_root);

			$tags.css({
				"display": "inline-block",
				"vertical-align": "middle",
				"font-size": "small"
			});	

			$tag_root.find(".main_cap_platform_area").append($tags);

			// Remove margin-bottom, border, and tweak padding on carousel lists
			$.each($tag_root.find(".tags span"), function (i, obj) {
				$(obj).css({
					"margin-bottom": "0",
					"border": "0",
					"padding": "3px"		
				});	
			});
		}
		else if (node.classList.contains("recommendation_highlight")) {
			$tag_root = $(node);
			remove_existing_tags($tag_root);
			
			if ($(".game_purchase_action").length > 0) {
				$tags.css("float", "left");
				$tag_root.find(".game_purchase_action").before($tags);
				$tag_root.find(".game_purchase_action").before($("<div style=\"clear: right;\"></div>"));
			} else {
				$tags.css("float", "right");
				$tag_root.find(".price").parent().before($tags);
			}	
		}
		else if (node.classList.contains("similar_grid_item")) {
			$tag_root = $(node);
			remove_existing_tags($tag_root);

			$tags.css("float", "right");
			$tag_root.find(".similar_grid_price").find(".price").append($tags);
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
			// Display inline as text only
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
			// Height to accomodate tags
			$tag_root.css("height", "auto");

			remove_existing_tags($tag_root);

			$tags.css({
				"float": "left",
				"margin-top": "4px",
				"margin-left": "4px"
			});

			$tag_root.find(".apphub_AppName").after($tags);
			$tag_root.find(".apphub_AppName").after($("<div style=\"clear: right;\"></div>"));
		}
		else if (node.classList.contains("apphub_HeaderTop")) {
			$tag_root = $(node);

			$tag_root.find(".apphub_AppName").css("width", "0px")

			remove_existing_tags($tag_root);

			$tags.css({
				"float": "left",
				"margin-top": "4px",
				"margin-left": "4px"
			});

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
	if (is_signed_in()) {
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
										// Gift package with multiple apps
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
							// Single app
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
													if (getValue(app.id + "coupon")) {
														if (getValue(app.id + "coupon_discount") >= obj.name.match(/([1-9][0-9])%/)[1]) { return; }
													}
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
		var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
		var last_updated = localStorage.getItem("inventory_time") || expire_time - 1;
		if (last_updated < expire_time || !localStorage.getItem("inventory_1") || !localStorage.getItem("inventory_3")) {
			
			// purge stale information from localStorage
			var i = 0, sKey;
			for (; sKey = window.localStorage.key(i); i++) {
				if (sKey.match(/coupon/)) { delValue(sKey); }
				if (sKey.match(/card:/)) { delValue(sKey); }
				if (sKey.match(/gift/)) { delValue(sKey); }
				if (sKey.match(/guestpass/)) { delValue(sKey); }
			}
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
	} else {
		var deferred = new $.Deferred();
		deferred.resolve();
		return deferred.promise();
	}
}

function add_empty_wishlist_buttons() {
	if(is_signed_in) {
		var profile = $(".playerAvatar a")[0].href.replace("http://steamcommunity.com", "");
		if (window.location.pathname.startsWith(profile)) {
			var empty_buttons = $("<div class='btn_save' id='es_empty_wishlist'>" + localized_strings[language].empty_wishlist + "</div>");
			$(".save_actions_enabled").filter(":last").after(empty_buttons);
			$("#es_empty_wishlist").click(empty_wishlist);
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
		$(".es_lowest_price").remove();
		$('#es_wl_all_box').prop('checked', true);
		$('.wishlistRow').css('display', 'block');
	});

	$('#es_wl_sale').on('click', function() {
		$(".es_lowest_price").remove();
		$('#es_wl_sale_box').prop('checked', true);
		$('.wishlistRow').css('display', 'block');
		$('.wishlistRow').each(function () {
			if (!$(this).html().match(/discount_block_inline/)) {
				$(this).css('display', 'none');
			}
		});
	});

	$('#es_wl_coupon').on('click', function() {
		$(".es_lowest_price").remove();
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
		$(".es_lowest_price").remove();	
		var wishlistRows = [];
		$('.wishlistRow').each(function () {
			var push = new Array();
			if ($(this).html().match(/discount_block_inline/)) {
				push[0] = this.outerHTML;
				push[1] = $(this).find(".discount_pct").html();
				push[2] = $(this).find(".discount_final_price").html();
			} else if ($(this).html().match(/div class=\"price/)) {
				push[0] = this.outerHTML;
				push[1] = "0";
				push[2] = $(this).find(".price").html();
			} else {
				push[0] = this.outerHTML;
				push[1] = "0";
				push[2] = "0";
			}
			wishlistRows.push(push);
			this.parentNode.removeChild(this);
		});

		wishlistRows.sort(function(a,b) {
			var discountA = parseInt(a[1],10);
			var discountB = parseInt(b[1],10);

			if (discountA > discountB) {
				return 1;
			} else if (discountA < discountB) {
				return -1;
			} else {
				var priceA = Number(a[2].replace(/[^0-9\.]+/g,""));
				var priceB = Number(b[2].replace(/[^0-9\.]+/g,""));

				if (priceA > priceB) {
					return 1;
				} else if (priceA < priceB) {
					return -1;
				} else {
					return 0;
				}
			}
		});

		$('.wishlistRow').each(function () { $(this).css("display", "none"); });

		$(wishlistRows).each(function() {
			$("#wishlist_items").append(this[0]);
		});

		add_wishlist_pricehistory();

		$(this).html("<span style='color: #B0AEAC;'>" + localized_strings[language].discount + "</span>");
		var html = $("#wishlist_sort_options").find("span[class='selected_sort']").html();
		html = "<a onclick='location.reload()'>" + html + "</a>";
		$("#wishlist_sort_options").find("span[class='selected_sort']").html(html);
	});
}

// Calculate total cost of all items on wishlist
function add_wishlist_total() {
	var total = 0;
	var gamelist = "";
	var items = 0;
	var currency_symbol;
	var apps = "";
	var htmlstring;
	
	function calculate_node(node, search) {
		price = parseFloat($(node).find(search).text().trim().replace(",", ".").replace(/[^0-9\.]+/g,""));
		if (price) {
			currency_symbol = currency_symbol_from_string($(node).find(search).text().trim());
			gamelist += $(node).find("h4").text().trim() + ", ";
			items += 1;
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
		currency_type = currency_symbol_to_type(currency_symbol);
		total = formatCurrency(parseFloat(total), currency_type);
		$(".games_list").after(htmlstring + "<link href='http://cdn4.store.steampowered.com/public/css/styles_gamev5.css' rel='stylesheet' type='text/css'><div class='game_area_purchase_game' style='width: 600px; margin-top: 15px;'><h1>" + localized_strings[language].buy_wishlist + "</h1><p class='package_contents'><b>" + localized_strings[language].bundle.includes.replace("(__num__)", items) + ":</b> " + gamelist + "</p><div class='game_purchase_action'><div class='game_purchase_action_bg'><div class='game_purchase_price price'>" + total + "</div><div class='btn_addtocart'><div class='btn_addtocart_left'></div><a class='btn_addtocart_content' onclick='document.forms[\"add_to_cart_all\"].submit();' href='#cartall' id='cartall'>" + localized_strings[language].add_to_cart + "</a><div class='btn_addtocart_right'></div></div></div></div></div></div>");
	});
}

function add_wishlist_ajaxremove() {
	$("a[onclick*=wishlist_remove]").each(function() {		
		var appid = $(this).parent().parent()[0].id.replace("game_", "");
		$(this).after("<span class='es_wishlist_remove' id='es_wishlist_remove_" + appid + "'>" + $(this).text() + "</span>");
		$(this).remove();
		var session = decodeURIComponent(cookie.match(/sessionid=(.+?);/i)[1]);

		$("#es_wishlist_remove_" + appid).on("click", function() {
			$.ajax({
				type:"POST",
				url: window.location,
				data:{
					sessionid: session,
					action: "remove",
					appid: appid
				},
				success: function( msg ) {
					var currentRank = parseFloat($("#game_" + appid + " .wishlist_rank")[0].value);
					if ($("#es_price_" + appid).length > 0) { $("#es_price_" + appid).remove(); }
					$("#game_" + appid).remove();
					setValue(appid + "wishlisted", false);
					for (var i = 0; i < $('.wishlistRow').length; i++) {
						if ($('.wishlist_rank')[i].value > currentRank) {
							$('.wishlist_rank')[i].value = $('.wishlist_rank')[i].value - 1;	
						}
					}
				}
			});
		});
	});
}

function add_wishlist_pricehistory() {
	storage.get(function(settings) {
		if (settings.showlowestprice_onwishlist === undefined) { settings.showlowestprice_onwishlist = true; storage.set({'showlowestprice_onwishlist': settings.showlowestprice_onwishlist}); }
		if (settings.showlowestpricecoupon === undefined) { settings.showlowestpricecoupon = true; storage.set({'showlowestpricecoupon': settings.showlowestpricecoupon}); }
		if (settings.showlowestprice_region === undefined) { settings.showlowestprice_region = "us"; storage.set({'showlowestprice_region': settings.showlowestprice_region}); }
		if (settings.showallstores === undefined) { settings.showallstores = true; chrome.storage.sync.set({'showallstores': settings.showallstores}); }
		if (settings.stores === undefined) { settings.stores = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]; chrome.storage.sync.set({'stores': settings.stores}); }
		if (settings.showlowestprice_onwishlist) {

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
			if (settings.stores[15]) { storestring += "gameolith,"; }
			if (settings.stores[16]) { storestring += "adventureshop,"; }
			if (settings.stores[17]) { storestring += "nuuvem,"; }
			if (settings.stores[18]) { storestring += "shinyloot,"; }
			if (settings.stores[19]) { storestring += "dlgamer,"; }
			if (settings.stores[20]) { storestring += "humblestore,"; }
			if (settings.stores[21]) { storestring += "indiegamestand,"; }
			if (settings.stores[22]) { storestring += "squenix,"; }
			if (settings.stores[23]) { storestring += "bundlestars,"; }
			if (settings.stores[24]) { storestring += "fireflower,"; }
			if (settings.stores[25]) { storestring += "humblewidgets,"; }
			if (settings.showallstores) { storestring = "steam,amazonus,impulse,gamersgate,greenmangaming,gamefly,origin,uplay,indiegalastore,gametap,gamesplanet,getgames,desura,gog,dotemu,gameolith,adventureshop,nuuvem,shinyloot,dlgamer,humblestore,squenix,bundlestars,fireflower,humblewidgets"; }

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

			function get_price_data(lookup_type, node, id) {
				html = "<div class='es_lowest_price' id='es_price_" + id + "'><div class='gift_icon' id='es_line_chart_" + id + "'><img src='" + chrome.extension.getURL("img/line_chart.png") + "'></div><span id='es_price_loading_" + id + "'>" + localized_strings[language].loading + "</span>";
				$(node).before(html);

				get_http("http://api.enhancedsteam.com/pricev2/?search=" + lookup_type + "/" + id + "&stores=" + storestring + "&cc=" + cc + "&coupon=" + settings.showlowestpricecoupon, function (txt) {
					var data = JSON.parse(txt);
					if (data) {
						var activates = "", line1 = "", line2 = "", line3 = "", html, recorded;
						var currency_type = data[".meta"]["currency"];

	        			// "Lowest Price"
						if (data["price"]) {
	                        if (data["price"]["drm"] == "steam") {
	                        	activates = "(<b>" + localized_strings[language].activates + "</b>)";
	                    		if (data["price"]["store"] == "Steam") {
	                    			activates = "";
	                    		}
	                    	}

	                        line1 = localized_strings[language].lowest_price + ': ' + formatCurrency(escapeHTML(data["price"]["price"].toString()), currency_type) + ' at <a href="' + escapeHTML(data["price"]["url"].toString()) + '" target="_blank">' + escapeHTML(data["price"]["store"].toString()) + '</a> ' + activates + ' (<a href="' + escapeHTML(data["urls"]["info"].toString()) + '" target="_blank">' + localized_strings[language].info + '</a>)';
	                    	if (settings.showlowestpricecoupon) {
	                    		if (data["price"]["price_voucher"]) {
	                    			line1 = localized_strings[language].lowest_price + ': ' + formatCurrency(escapeHTML(data["price"]["price_voucher"].toString()), currency_type) + ' at <a href="' + escapeHTML(data["price"]["url"].toString()) + '" target="_blank">' + escapeHTML(data["price"]["store"].toString()) + '</a> ' + localized_strings[language].after_coupon + ' <b>' + escapeHTML(data["price"]["voucher"].toString()) + '</b> ' + activates + ' (<a href="' + escapeHTML(data["urls"]["info"].toString()) + '" target="_blank">' + localized_strings[language].info + '</a>)';
	                    		}
	                    	}
	                    }

						// "Historical Low"
						if (data["lowest"]) {
	                        recorded = new Date(data["lowest"]["recorded"]*1000);
	                        line2 = localized_strings[language].historical_low + ': ' + formatCurrency(escapeHTML(data["lowest"]["price"].toString()), currency_type) + ' at ' + escapeHTML(data["lowest"]["store"].toString()) + ' on ' + recorded.toDateString() + ' (<a href="' + escapeHTML(data["urls"]["history"].toString()) + '" target="_blank">' + localized_strings[language].info + '</a>)';
	                    }

						// "Number of times this game has been in a bundle"
						if (data["bundles"]["count"] > 0) {
							line3 = "<br>" + localized_strings[language].bundle.bundle_count + ": " + data["bundles"]["count"] + ' (<a href="' + escapeHTML(data["urls"]["bundle_history"].toString()) + '" target="_blank">' + localized_strings[language].info + '</a>)';
						}

						if (line1 && line2) {
							$("#es_price_loading_" + id).remove();
							$("#es_price_" + id).append(line1 + "<br>" + line2 + line3);
							$("#es_line_chart_" + id).css("top", (($("#es_price_" + id).outerHeight() - 20) / 2) + "px");
							return;
						}

						if (line2) {
							$("#es_price_loading_" + id).remove();
							$("#es_price_" + id).append(line2 + line3);
							$("#es_line_chart_" + id).css("top", (($("#es_price_" + id).outerHeight() - 20) / 2) + "px");
							return;	
						}

						if (data["lowest"] === null && data["price"] === null) {					
							$("#es_price_loading_" + id).remove();
							$("#es_price_" + id).append(localized_strings[language].no_results_found);
							return;
						}
	                }
	        	});
			}

			var timeoutId;
			$(".wishlistRow").hover(function() {
				var node = $(this);
				var appid = node[0].id.replace("game_", "");
				if (!timeoutId) {
					timeoutId = window.setTimeout(function() {					
						timeoutId = null;						
						if ($("#es_price_" + appid).length == 0) {							
							get_price_data("app", node, appid);
						}	
					}, 1000);
				}
			},
			function() {
				if (timeoutId) {
					window.clearTimeout(timeoutId);
					timeoutId = null;
				}
			});
		}
	});
}

function add_wishlist_notes() {
	if(is_signed_in) {
		var profile = $(".playerAvatar a")[0].href.replace("http://steamcommunity.com", "");
		if (window.location.pathname.startsWith(profile)) {
			$(".wishlistRow").each(function() {
				var appid = $(this).attr("id").replace("game_", "");
				var node = $(this);
				$(this).find(".bottom_controls .popup_block2 .popup_body2").append("<a class='popup_menu_item2 tight es_add_wishlist_note' id='es_add_wishlist_note_" + appid + "'><h5>Add a wishlist note</h5></a>");
				storage.get(function(settings) {
					var key = appid + "wishlist_note";
					var array = $.map(settings, function(value, index) {
						if (index == key) return [value];
					});
					var wl_note = array[0];
					if (wl_note) {
						$(node).find("h4").after("<div class='es_wishlist_note'>" + wl_note.toString() + "</div").css("padding-top", "6px");
						$("#es_add_wishlist_note_" + appid).find("h5").text("Update wishlist note");
						if ($(node).find(".es_wishlist_note")[0].scrollWidth > $(node).find(".es_wishlist_note")[0].clientWidth) { $(node).find(".es_wishlist_note").attr("title", wl_note); }
					}
				});
			});

			$(".es_add_wishlist_note").click(function() {
				$(".popup_block2").hide();
				var appid = $(this).attr("id").replace("es_add_wishlist_note_", "");
				storage.get(function(settings) {
					var key = appid + "wishlist_note";
					var obj = {};
					var array = $.map(settings, function(value, index) {
						if (index == key) return [value];	
					});
					var wl_note = array[0];
					if (wl_note) {
						var note = prompt("Update your wishlist note", wl_note);
					} else {
						var note = prompt("Enter your wishlist note", "");
					}
					switch (note) {
						case null:
							break;
						case "":
							storage.remove(appid + "wishlist_note");
							$("#game_" + appid).find(".es_wishlist_note").remove();
							break;
						default:
							obj[key] = note;
							storage.set(obj);
							$("#game_" + appid).find(".es_wishlist_note").remove();
							$("#game_" + appid).find("h4").after("<div class='es_wishlist_note'>" + note + "</div").css("padding-top", "6px");
							if ($("#game_" + appid).find(".es_wishlist_note")[0].scrollWidth > $("#game_" + appid).find(".es_wishlist_note")[0].clientWidth) { $("#game_" + appid).find(".es_wishlist_note").attr("title", note); }
					}
				});
			});
		}
	}
}

// Removes all items from the user's wishlist
function empty_wishlist() {
	var conf_text = "Are you sure you want to empty your wishlist?\n\nThis action cannot be undone!";
	var conf = confirm(conf_text);
	if (conf) {
		var wishlist_class = ".wishlistRow";
		var deferreds = $(wishlist_class).map(function(i, $obj) {
			var deferred = new $.Deferred();
			var appid = get_appid_wishlist($obj.id),
				profile = $(".playerAvatar a")[0].href.replace("http://steamcommunity.com/", ""),
				session = decodeURIComponent(cookie.match(/sessionid=(.+?);/i)[1]);

			$.ajax({
				type:"POST",
				url: "http://steamcommunity.com/" + profile + "/wishlist/",
				data:{
					sessionid: session,
					action: "remove",
					appid: appid
				},
				success: function( msg ) {
					deferred.resolve();
				}
			});

			return deferred.promise();
		});

		$.when.apply(null, deferreds).done(function(){
			location.reload();
		});
	}
}

function pack_split(node, ways) {
	var price_text = $(node).find(".discount_final_price").html();
	var at_end, comma, places = 2;
	if (price_text == null) { price_text = $(node).find(".game_purchase_price").html(); }
	if (price_text.match(/,\d\d(?!\d)/)) {
		at_end = true;
		comma = true;
		price_text = price_text.replace(",", ".");
	}
	var currency_symbol = currency_symbol_from_string(price_text);
	var currency_type = currency_symbol_to_type(currency_symbol);
	var price = (Number(price_text.replace(/[^0-9\.]+/g,""))) / ways;
	price = (Math.ceil(price * 100) / 100);
	price_text = formatCurrency(price, currency_type);
	$(node).find(".btn_addtocart").last().before(
		"<div class='es_each_box'><div class='es_each_price'>" + price_text + "</div><div class='es_each'>"+localized_strings[language].each+"</div></div>"
	);
}

function add_pack_breakdown() {
	$(".game_area_purchase_game_wrapper").each(function() {
		var title = $(this).find("h1").text().trim();
		title = title.toLowerCase().replace(/-/g, ' ');
		if (!title || !title.contains('pack')) return;

		if (title.contains(' 2 pack') && !title.contains('bioshock')) { pack_split(this, 2); }
		else if (title.contains(' two pack')) { pack_split(this, 2); }
		else if (title.contains('tower wars friend pack')) { pack_split(this, 2); }

		else if (title.contains(' 3 pack') && !title.contains('doom 3')) { pack_split(this, 3); }
		else if (title.contains(' three pack')) { pack_split(this, 3); }
		else if (title.contains('tower wars team pack')) { pack_split(this, 3); }

		else if (title.contains(' 4 pack')) { pack_split(this, 4); }
		else if (title.contains(' four pack')) { pack_split(this, 4); }
		else if (title.contains(' clan pack')) { pack_split(this, 4); }

		else if (title.contains(' 5 pack')) { pack_split(this, 5); }
		else if (title.contains(' five pack')) { pack_split(this, 5); }

		else if (title.contains(' 6 pack')) { pack_split(this, 6); }
		else if (title.contains(' six pack')) { pack_split(this, 6); }
	});
}

// Add button to show package info for all games
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

// Display information on current players from SteamCharts.com
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
							html += '<div id="chart-heading" class="chart-content"><div id="chart-image"><img src="http://cdn.akamai.steamstatic.com/steam/apps/' + appid + '/capsule_184x69.jpg" width="184" height="69"></div><div class="chart-stat">';
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

// Add button to check system requirements on app pages 
function add_system_requirements_check(appid) {
	storage.get(function(settings) {
		if (settings.show_sysreqcheck === undefined) { settings.show_sysreqcheck = false; storage.set({'show_sysreqcheck': settings.show_sysreqcheck}); }
		if (settings.show_sysreqcheck) {
			var html = "<a class='btn_darkblue_white_innerfade btn_medium es_btn_systemreqs' href='steam://checksysreqs/" + appid + "'><span>" + localized_strings[language].check_system + "</span></a>";
			$("#game_area_sys_req").last().after(html);
		}
	});	
}

// Automatically send age verification when requested
function send_age_verification() {
	storage.get(function(settings) {
		if (settings.send_age_info === undefined) { settings.send_age_info = true; storage.set({'send_age_info': settings.send_age_info}); }
		if (settings.send_age_info) {
			document.getElementsByName("ageYear")[0].value="1955";
			document.getElementsByClassName("btn_checkout_green")[0].click();
		}
	});
}

// Display Steam Wallet funds in header
function add_wallet_balance_to_header() {
	$("#global_action_menu").append("<div id='es_wallet' style='text-align:right; padding-right:12px; line-height: normal;'>");
	$("#es_wallet").load('http://store.steampowered.com #header_wallet_ctn');
}

// Add a link to options to the global menu (where is Install Steam button)
function add_enhanced_steam_options() {
	$dropdown = $("<span class=\"pulldown global_action_link\" id=\"enhanced_pulldown\">Enhanced Steam</span>");
	$dropdown_options_container = $("<div class=\"popup_block_new\"><div class=\"popup_body popup_menu\" id=\"es_popup\"></div></div>");
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

	$options_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\""+chrome.extension.getURL("options.html")+"\">"+localized_strings[language].thewordoptions+"</a>")
	$website_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"http://www.enhancedsteam.com\">" + localized_strings[language].website + "</a>");
	$contribute_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//github.com/jshackles/Enhanced_Steam\">" + localized_strings[language].contribute + "</a>");
	$translate_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//translation.enhancedsteam.com\">" + localized_strings[language].translate + "</a>");
	$bug_feature_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//github.com/jshackles/Enhanced_Steam/issues\">" + localized_strings[language].bug_feature + "</a>");
	$donation_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//enhancedsteam.com/donate.php\">" + localized_strings[language].donate + "</a>");
	$group_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//" + localized_strings[language].official_group_url + "\">" + localized_strings[language].official_group + "</a>");

	$clear_cache_link = $("<a class=\"popup_menu_item\" href=\"\">" + localized_strings[language].clear_cache + "</a>");
	$clear_cache_link.click(function(){
		localStorage.clear();
		location.reload();
	});

	$spacer = $("<div class=\"hr\"></div>");

	$dropdown_options.append($options_link);
	$dropdown_options.append($clear_cache_link);
	$dropdown_options.append($spacer.clone());
	$dropdown_options.append($contribute_link);
	$dropdown_options.append($translate_link);
	$dropdown_options.append($bug_feature_link);
	$dropdown_options.append($spacer.clone());
	$dropdown_options.append($website_link);
	$dropdown_options.append($group_link);
	$dropdown_options.append($donation_link);

	$("#global_action_menu")
		.before($dropdown)
		.before($dropdown_options_container);

	$("#global_actions").after("<progress id='es_progress' class='complete' value='1' max='1' title='" + localized_strings[language].ready.ready + "'></progress>");
}

// Display warning if browsing using non-account region
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

// Display warning if browsing using a different language
function add_language_warning() {
	storage.get(function(settings) {
		if (settings.showlanguagewarning === undefined) { settings.showlanguagewarning = true; storage.set({'showlanguagewarning': settings.showlanguagewarning}); }
		if (settings.showlanguagewarning) {
			var currentLanguage = "English";
			if (cookie.match(/language=([a-z]+)/i)) {
				currentLanguage = cookie.match(/language=([a-z]+)/i)[1];
			}
			currentLanguage = currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1);

			function make_language_pretty(language_string) {
				switch (language_string) {
					case "Schinese": return "Simplified Chinese"; break;
					case "Tchinese": return "Traditional Chinese"; break;
					case "Koreana":	return "Korean"; break;
					default: return language_string; break;
				}
			}

			if (settings.showlanguagewarninglanguage === undefined) { settings.showlanguagewarninglanguage = currentLanguage; storage.set({'showlanguagewarninglanguage': settings.showlanguagewarninglanguage}); }
			var lang = settings.showlanguagewarninglanguage.toLowerCase().slice(0,3);

			currentLanguage = make_language_pretty(currentLanguage);
			settings.showlanguagewarninglanguage = make_language_pretty(settings.showlanguagewarninglanguage);

			if (settings.showlanguagewarninglanguage != currentLanguage) {
				if (localized_strings[lang] && localized_strings[lang].using_language && localized_strings[lang].using_language_return) {
					$("#global_header").after('<div class=content style="background-image: url( ' + chrome.extension.getURL("img/red_banner.png") + '); color: #ffffff; font-size: 12px; height: 21px; text-align: center; padding-top: 8px;">' + localized_strings[lang].using_language.replace("__current__", currentLanguage) + '  <a href="#" id="reset_language_code">' + localized_strings[lang].using_language_return.replace("__base__", settings.showlanguagewarninglanguage) + '</a></div>');
				} else {
					$("#global_header").after('<div class=content style="background-image: url( ' + chrome.extension.getURL("img/red_banner.png") + '); color: #ffffff; font-size: 12px; height: 21px; text-align: center; padding-top: 8px;">' + localized_strings["eng"].using_language.replace("__current__", currentLanguage) + '  <a href="#" id="reset_language_code">' + localized_strings["eng"].using_language_return.replace("__base__", settings.showlanguagewarninglanguage) + '</a></div>');
				}
				$("#page_background_holder").css("top", "135px");
				$("#reset_language_code").click(function(e) {
					e.preventDefault();
					document.cookie = 'Steam_Language=' + settings.showlanguagewarninglanguage.toLowerCase() + ';path=/;';
					window.location.replace(window.location.href.replace(/[?&]l=[a-z]+/, ""));
				});
			}
		}
	});
}

// Remove the "Install Steam" button at the top of each page
function remove_install_steam_button() {
	storage.get(function(settings) {
		if (settings.hideinstallsteambutton === undefined) { settings.hideinstallsteambutton = false; storage.set({'hideinstallsteambutton': settings.hideinstallsteambutton}); }
		if (settings.hideinstallsteambutton) {
			$('div.header_installsteam_btn').replaceWith('');
		}
	});
}

// Remove the "About" menu item at the top of each page
function remove_about_menu() {
	storage.get(function(settings) {
		if (settings.hideaboutmenu === undefined) { settings.hideaboutmenu = false; storage.set({'hideaboutmenu': settings.hideaboutmenu}); }
		if (settings.hideaboutmenu) {
			$('a[href$="http://store.steampowered.com/about/"]').replaceWith('');
		}
	});
}

function add_header_links() {
	var supernav_content = document.querySelectorAll("#supernav .supernav");
	if ($("#supernav").length > 0) {
		// add "Forums" after "Workshop"
		var community = $("#supernav").find("a[href='http://steamcommunity.com/']").attr("data-tooltip-content");
		var insertAt = community.match(/\/workshop\/">(.+)<\/a>/);
		community = community.substr(0, (insertAt.index + insertAt[0].length)) + '<a class="submenuitem" href="http://forums.steampowered.com/forums/" target="_blank">' + localized_strings[language].forums + '</a>' + community.substr(insertAt.index + insertAt[0].length);
		$("#supernav").find("a[href='http://steamcommunity.com/']").attr("data-tooltip-content", community);

		if (is_signed_in()) {
			var user = $("#supernav").find("a[href$='/home/']").attr("data-tooltip-content");
			var insertAt = user.match(/\/home\/">(.+)<\/a>/);
			user = user.substr(0, (insertAt.index + insertAt[0].length)) + '<a class="submenuitem" href="http://steamcommunity.com/my/games/">' + localized_strings[language].games + '</a>' + user.substr(insertAt.index + insertAt[0].length);
			user = user + '<a class="submenuitem" href="http://steamcommunity.com/my/recommended/">' + localized_strings[language].reviews + '</a>';
			$("#supernav").find("a[href$='/home/']").attr("data-tooltip-content", user);
		}
	}
}

// Replace account name with community name
function replace_account_name() {
	storage.get(function(settings) {
		if (settings.replaceaccountname === undefined) { settings.replaceaccountname = false; storage.set({'replaceaccountname': settings.replaceaccountname}); }
		if (settings.replaceaccountname) {
			var current_account_name = $("#global_header .username").text().trim();
			var new_account_name = localized_strings[language].community_name_account_header.replace("__username__", current_account_name);
			$("#account_pulldown").text(new_account_name);
			if ($(".page_title").children(".blockbg").text().trim()==document.title&&document.title!="") {
				$(".page_title").children(".blockbg").text(new_account_name);
				document.title=new_account_name;
			}
		}
	});
}

function add_custom_wallet_amount() {
	var addfunds = $(".addfunds_area_purchase_game:first").clone();
	$(addfunds).addClass("es_custom_funds");
	$(addfunds).find(".btn_addtocart_content").addClass("es_custom_button");
	$(addfunds).find("h1").text(localized_strings[language].wallet.custom_amount);
	$(addfunds).find("p").text(localized_strings[language].wallet.custom_amount_text.replace("__minamount__", $(addfunds).find(".price").text().trim()));
	var currency_symbol = currency_symbol_from_string($(addfunds).find(".price").text().trim());
	var minimum = $(addfunds).find(".price").text().trim().replace(/(?:R\$|\$|€|¥|£|pуб)/, "");
	var formatted_minimum = minimum;
	switch (currency_symbol) {
		case "€":
		case "pуб":
			$(addfunds).find(".price").html("<input id='es_custom_funds_amount' class='es_text_input' style='margin-top: -3px;' size=4 value='" + minimum +"'> " + currency_symbol);
			break;
		default:
			$(addfunds).find(".price").html(currency_symbol + " <input id='es_custom_funds_amount' class='es_text_input' style='margin-top: -3px;' size=4 value='" + minimum +"'>");
			break;
	}
	$("#game_area_purchase .addfunds_area_purchase_game:first").after(addfunds);
	$("#es_custom_funds_amount").change(function() {
		// Make sure two numbers are entered after the separator
		if (!($("#es_custom_funds_amount").val().match(/(\.|\,)\d\d$/))) { $("#es_custom_funds_amount").val($("#es_custom_funds_amount").val().replace(/\D/g, "")); }

		// Make sure the user entered decimals. If not, add 00 to the end of the number to make the value correct.
		if (currency_symbol == "€" || currency_symbol == "pуб" || currency_symbol == "R$") {
			if ($("#es_custom_funds_amount").val().indexOf(",") == -1) $("#es_custom_funds_amount").val($("#es_custom_funds_amount").val() + ",00");
		} else {
			if ($("#es_custom_funds_amount").val().indexOf(".") == -1) $("#es_custom_funds_amount").val($("#es_custom_funds_amount").val() + ".00");
		}

		var calculated_value = $("#es_custom_funds_amount").val().replace(/-/g, "0").replace(/\D/g, "").replace(/[^A-Za-z0-9]/g, '');		
		$("#es_custom_funds_amount").val($("#es_custom_funds_amount").val().replace(/[A-Za-z]/g, ''));
		$(".es_custom_button").attr("href", "javascript:submitAddFunds( " + calculated_value + " );")
	});
}

// Add a "Library" menu to the main menu of Steam
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
						// Scroll if found in the app list
						var selected = $(".es_library_app[data-appid='" + settings.librarylastappid + "']");
						if (selected.length != 0) {
							selected[0].scrollIntoViewIfNeeded();
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

// Display game library when "Library" button is selected
function show_library() {
	var deferred = $.Deferred();

	// Change page title
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
	es_library.append("<div id='es_library_categories' style='display: none;'></div>");
	es_library.append("<div id='es_library_genres' style='display: none;'></div>");	
	es_library.append("<div id='es_library_list' data-appid-selected='undefined'><div id='es_library_list_loading'><img src='http://cdn.steamcommunity.com/public/images/login/throbber.gif'><span>"+ localized_strings[language].loading +"</span></div></div>");


	storage.get(function(settings) {
		if (settings.showlibraryf2p === undefined) { settings.showlibraryf2p = true; storage.set({'showlibraryf2p': settings.showlibraryf2p}); }

		var showlibraryf2p = 1;
		showlibraryf2p = (settings.showlibraryf2p) ? 1 : 0;

		// Call EnhancedSteam API Wrapper
		get_http('http://api.enhancedsteam.com/steamapi/GetOwnedGames/?steamid=' + is_signed_in() + '&include_played_free_games=' + showlibraryf2p, function (txt) {
			var data = JSON.parse(txt);
			if (data.response && Object.keys(data.response).length > 0) {
				library_all_games = data.response.games;
                var appids = library_all_games.map(function(val,i,arr) {return val.appid});
				var appdetails = {};
				var appidchunks = appids.chunk(100).map(function(val) {return val.join(',');});
				var appdetailcalls = appidchunks.map(function(val,i,arr) {
						 return $.post('http://store.steampowered.com/api/appdetails/', 
						{ appids: val, filters: 'categories,genres' },
						function(appdetailtxt){ 
						 $.extend(appdetails,appdetailtxt)
						});
				});
				$.when.apply($,appdetailcalls).then(
				function () {
				var categories = [];
				var genres = [];
				$.each(appdetails, function (appid,detail){
				 if (detail && detail.data) {
					if (detail.data.categories) {	
						$.each(detail.data.categories, function (id,detail) {
					  if (!categories.some(function (val) {return val.id == detail.id}))
					    categories.push({id: detail.id, name: detail.description});
						});
					}
					if (detail.data.genres) {	
						$.each(detail.data.genres, function (id,genre) {
					  if (!genres.some(function (val) {return val.id == genre.id}))
					    genres.push({id: genre.id, name: genre.description});
						});
					}
				}
				});
				var sortByName=function(a,b) {return ((a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0));}
				categories.sort(sortByName);
				genres.sort(sortByName);
				var catselect_html="<select style='width:250px' id='es_library_category_select' multiple placeholder='"+localized_strings[language].library.categories+"'>";
				$.each(categories, function(i,val) {
					catselect_html+="<option value='"+val.id+"'>"+val.name+"</option>";
				});
				catselect_html+="</select>"

				var genselect_html="<select style='width:250px' id='es_library_genre_select' multiple placeholder='"+localized_strings[language].library.genres+"'>";
				$.each(genres, function(i,val) {
					genselect_html+="<option value='"+val.id+"'>"+val.name+"</option>";
				});
				genselect_html+="</select>"

				
			// Sort entries
				library_all_games.sort(function(a,b) {
					if ( a.name == b.name ) return 0;
					return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
				});

				var refresh_games_list = function(filter_name) {
					$("#es_library_list").html("");

					var last_app_id_in_games = false;
					var filtered_games = [];
					var selected_categories = [];
					if ($("#es_library_category_select").length > 0)
					  selected_categories=$("#es_library_category_select")[0].selectedOptions;
					var selected_genres = [];
					if ($("#es_library_genre_select").length > 0)
					  selected_genres = $("#es_library_genre_select")[0].selectedOptions;



					$.each(library_all_games, function(i, obj) {
						var detail=appdetails [obj.appid];
						// If no category is selected, this is true by default.
						var is_in_categories=(!selected_categories || selected_categories.length == 0)
						// Check every selected category if the game contains it
						if (!is_in_categories && detail && detail.data && detail.data.categories)
						is_in_categories = $.makeArray(selected_categories).every(function(val,i,array){
							return detail.data.categories.some(function(catval,cati,catarray){
								return catval.id == val.value});
						});

						var is_in_genres=(!selected_genres || selected_genres.length == 0 || !is_in_categories)
						// Check every selected category if the game contains it
						if (!is_in_genres && detail && detail.data && detail.data.genres)
						is_in_genres = $.makeArray(selected_genres).every(function(val,i,array){
							return detail.data.genres.some(function(genval){
								return genval.id == val.value});
						});

					    
						if (obj.name && (filter_name === undefined || new RegExp(filter_name, "i").test(obj.name)) && is_in_categories && is_in_genres) {
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

				$("#es_library_search").append("<input type='text' id='es_library_search_input' placeholder='Search'/>");
				$("#es_library_search").show();
				$("#es_library_categories").append(catselect_html);
				$("#es_library_categories").show();
				$("#es_library_category_select").select2({
				maximumSelectionSize: 3,
				formatSelection: function (item) { 
				  return (item.text.length>8)?(item.text.slice(0,6)+'...'):item.text;}  
				});
				$("#es_library_category_select").change(function(e) {
					refresh_games_list();
				});

				$("#es_library_genres").append(genselect_html);
				$("#es_library_genres").show();
				$("#es_library_genre_select").select2({
				maximumSelectionSize: 3,
				formatSelection: function (item) { 
				  return (item.text.length>8)?(item.text.slice(0,6)+'...'):item.text;}  
				});
				$("#es_library_genre_select").change(function(e) {
					refresh_games_list();
				});
				
				
				
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
         		}, function(val) {
						// One of the ajax calls for appdetails failed
						$("#es_library_list_loading").remove();
						es_library.html("<div id='es_library_private_profile'>" + localized_strings[language].library.error_loading_library + "</div>");
						deferred.reject();
					}				
				);
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

// Display loading message when loading game library
function library_show_app(appid) {
	$("#es_library_background").removeAttr("style");
	$("#es_library_right").html("<div id='es_library_list_loading'><img src='http://cdn.steamcommunity.com/public/images/login/throbber.gif'><span>"+ localized_strings[language].loading +"</span></div>");

	get_http('http://store.steampowered.com/api/appdetails/?appids=' + appid, function (txt) {
		var app_data = JSON.parse(txt);

		if (app_data[appid].success && appid == $('.es_library_selected').data('appid')) {

			// Fill background div with screenshot
			var screenshotID = Math.floor(Math.random() * app_data[appid].data.screenshots.length - 1) + 1;
			$('#es_library_background').css('background', 'url(' + app_data[appid].data.screenshots[screenshotID].path_full + ') 0 0 no-repeat');
			$('#es_library_background').css('background-size', 'cover');

			// Fill title div with icon and title
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

			// Fill "playnow" div
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

			// Achievements etc. can be loaded later
			$("#es_library_list_loading").remove();

			// Fill achievements div

			if (app_data[appid].data.achievements && app_data[appid].data.achievements.total > 0) {
				$("#es_library_app_left").append($("<div class='es_library_app_container' id='es_library_app_achievements_container' style='display: none;'><div id='es_library_app_achievements'></div></div>"));

				// TODO: Spam Valve so we can do just 1 request for achievements
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

			// Fill news div

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

			// Add links to the right sidebar

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

// If app has a coupon, display a message.
function display_coupon_message(appid) {
	// Get JSON coupon results

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
		currency_symbol = currency_symbol_from_string(actual_price_container),
		currency_type = currency_symbol_to_type(currency_symbol),
		comma = actual_price_container.search(/,\d\d(?!\d)/);

	if (comma > -1) {
		actual_price_container = actual_price_container.replace(",", ".");
	} else {
		actual_price_container = actual_price_container.replace(",", "");
	}

	var original_price = parseFloat(actual_price_container.match(/([0-9]+(?:(?:\,|\.)[0-9]+)?)/)[1]);
	var discounted_price = (original_price - (original_price * getValue(appid + "coupon_discount") / 100).toFixed(2)).toFixed(2);

	if (!($price_div.find(".game_purchase_discount").length > 0 && getValue(appid + "coupon_discount_doesnt_stack"))) {
		// If not (existing discounts and coupon does not stack)

		$price_div[0].innerHTML = ""+
			"<div class=\"game_purchase_action_bg\">" +
			"    <div class=\"discount_block game_purchase_discount\">" +
			"        <div class=\"discount_pct\">-" + getValue(appid + "coupon_discount") + "%</div>" +
			"        <div class=\"discount_prices\">" +
			"            <div class=\"discount_original_price\">" + formatCurrency(original_price, currency_type) + "</div>" +
			"            <div class=\"discount_final_price\" itemprop=\"price\">" + formatCurrency(discounted_price, currency_type) + "</div>" +
			"        </div>" +
			"    </div>" +
			"<div class=\"btn_addtocart\">" +
			"        <a class=\"btnv6_green_white_innerfade btn_medium\" href=\"javascript:addToCart( " + cart_id + ");\"><span>" + localized_strings[language].add_to_cart + "</span></a>" +
			"    </div>" +
			"</div>";
	}
}

function show_pricing_history(appid, type) {
	storage.get(function(settings) {
		if (settings.showlowestprice === undefined) { settings.showlowestprice = true; storage.set({'showlowestprice': settings.showlowestprice}); }
		if (settings.showlowestpricecoupon === undefined) { settings.showlowestpricecoupon = true; storage.set({'showlowestpricecoupon': settings.showlowestpricecoupon}); }
		if (settings.showlowestprice_region === undefined) { settings.showlowestprice_region = "us"; storage.set({'showlowestprice_region': settings.showlowestprice_region}); }
		if (settings.showallstores === undefined) { settings.showallstores = true; chrome.storage.sync.set({'showallstores': settings.showallstores}); }
		if (settings.stores === undefined) { settings.stores = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]; chrome.storage.sync.set({'stores': settings.stores}); }
		if (settings.showlowestprice) {

			// Get list of stores we're searching for
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
			if (settings.stores[15]) { storestring += "gameolith,"; }
			if (settings.stores[16]) { storestring += "adventureshop,"; }
			if (settings.stores[17]) { storestring += "nuuvem,"; }
			if (settings.stores[18]) { storestring += "shinyloot,"; }
			if (settings.stores[19]) { storestring += "dlgamer,"; }
			if (settings.stores[20]) { storestring += "humblestore,"; }
			if (settings.stores[21]) { storestring += "indiegamestand,"; }
			if (settings.stores[22]) { storestring += "squenix,"; }
			if (settings.stores[23]) { storestring += "bundlestars,"; }
			if (settings.stores[24]) { storestring += "fireflower,"; }
			if (settings.stores[25]) { storestring += "humblewidgets,"; }
			if (settings.showallstores) { storestring = "steam,amazonus,impulse,gamersgate,greenmangaming,gamefly,origin,uplay,indiegalastore,gametap,gamesplanet,getgames,desura,gog,dotemu,gameolith,adventureshop,nuuvem,shinyloot,dlgamer,humblestore,squenix,bundlestars,fireflower,humblewidgets"; }

			// Get country code from the Steam cookie
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

			function get_price_data(lookup_type, node, id) {
				get_http("http://api.enhancedsteam.com/pricev2/?search=" + lookup_type + "/" + id + "&stores=" + storestring + "&cc=" + cc + "&coupon=" + settings.showlowestpricecoupon, function (txt) {
					var data = JSON.parse(txt);
					if (data) {
						var activates = "", line1 = "", line2 = "", line3 = "", html, recorded;
						var currency_type = data[".meta"]["currency"];

						// "Lowest Price"
						if (data["price"]) {
	                        if (data["price"]["drm"] == "steam") {
	                        	activates = "(<b>" + localized_strings[language].activates + "</b>)";
	                    		if (data["price"]["store"] == "Steam") {
	                    			activates = "";
	                    		}
	                    	}

	                        line1 = localized_strings[language].lowest_price + ': ' + formatCurrency(escapeHTML(data["price"]["price"].toString()), currency_type) + ' at <a href="' + escapeHTML(data["price"]["url"].toString()) + '" target="_blank">' + escapeHTML(data["price"]["store"].toString()) + '</a> ' + activates + ' (<a href="' + escapeHTML(data["urls"]["info"].toString()) + '" target="_blank">' + localized_strings[language].info + '</a>)';
	                    	if (settings.showlowestpricecoupon) {
	                    		if (data["price"]["price_voucher"]) {
	                    			line1 = localized_strings[language].lowest_price + ': ' + formatCurrency(escapeHTML(data["price"]["price_voucher"].toString()), currency_type) + ' at <a href="' + escapeHTML(data["price"]["url"].toString()) + '" target="_blank">' + escapeHTML(data["price"]["store"].toString()) + '</a> ' + localized_strings[language].after_coupon + ' <b>' + escapeHTML(data["price"]["voucher"].toString()) + '</b> ' + activates + ' (<a href="' + escapeHTML(data["urls"]["info"].toString()) + '" target="_blank">' + localized_strings[language].info + '</a>)';
	                    		}
	                    	}
	                    }

						// "Historical Low"
						if (data["lowest"]) {
	                        recorded = new Date(data["lowest"]["recorded"]*1000);
	                        line2 = localized_strings[language].historical_low + ': ' + formatCurrency(escapeHTML(data["lowest"]["price"].toString()), currency_type) + ' at ' + escapeHTML(data["lowest"]["store"].toString()) + ' on ' + recorded.toDateString() + ' (<a href="' + escapeHTML(data["urls"]["history"].toString()) + '" target="_blank">' + localized_strings[language].info + '</a>)';
	                    }

						html = "<div class='es_lowest_price' id='es_price_" + id + "'><div class='gift_icon' id='es_line_chart_" + id + "'><img src='" + chrome.extension.getURL("img/line_chart.png") + "'></div>";

						// "Number of times this game has been in a bundle"
						if (data["bundles"]["count"] > 0) {
							line3 = "<br>" + localized_strings[language].bundle.bundle_count + ": " + data["bundles"]["count"] + ' (<a href="' + escapeHTML(data["urls"]["bundle_history"].toString()) + '" target="_blank">' + localized_strings[language].info + '</a>)';
						}

						if (line1 && line2) {
							$(node).before(html + line1 + "<br>" + line2 + line3);
							$("#es_line_chart_" + id).css("top", (($("#es_price_" + id).outerHeight() - 20) / 2) + "px");
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
									if (data["bundles"]["active"][i]["page"]) { purchase = '<div class="game_area_purchase_game_wrapper"><div class="game_area_purchase_game"><div class="game_area_purchase_platform"></div><h1>' + localized_strings[language].buy + ' ' + data["bundles"]["active"][i]["page"] + ' ' + data["bundles"]["active"][i]["title"] + '</h1>'; } 
									else { purchase = '<div class="game_area_purchase_game_wrapper"><div class="game_area_purchase_game"><div class="game_area_purchase_platform"></div><h1>' + localized_strings[language].buy + ' ' + data["bundles"]["active"][i]["title"] + '</h1>'; }
									if (enddate) purchase += '<p class="game_purchase_discount_countdown">' + localized_strings[language].bundle.offer_ends + ' ' + enddate + '</p>';
									purchase += '<p class="package_contents"><b>' + localized_strings[language].bundle.includes.replace("(__num__)", data["bundles"]["active"][i]["games"].length) + ':</b> '
									data["bundles"]["active"][i]["games"].forEach(function(entry) {
										purchase += entry + ", ";
									});
									purchase = purchase.replace(/, $/, "");
									purchase += '</p><div class="game_purchase_action"><div class="game_purchase_action_bg"><div class="btn_addtocart btn_packageinfo"><div class="btn_addtocart_left"></div><a class="btn_addtocart_content" href="' + data["bundles"]["active"][i]["details"] + '" target="_blank">' + localized_strings[language].bundle.info + '</a><div class="btn_addtocart_right"></div></div></div><div class="game_purchase_action_bg">';
									if (data["bundles"]["active"][i]["price"] > 0) {										
										if (data["bundles"]["active"][i]["pwyw"]) {
											purchase += '<div class="es_each_box" itemprop="price">';
											purchase += '<div class="es_each">' + localized_strings[language].bundle.at_least + '</div><div class="es_each_price" style="text-align: right;">' + formatCurrency(escapeHTML(data["bundles"]["active"][i]["price"].toString()), currency_type) + '</div>';
										} else {
											purchase += '<div class="game_purchase_price price" itemprop="price">';
											purchase += formatCurrency(escapeHTML(data["bundles"]["active"][i]["price"].toString()), currency_type);
										}
									 }
									purchase += '</div><div class="btn_addtocart"><div class="btn_addtocart_left"></div>';
									purchase += '<a class="btn_addtocart_content" href="' + data["bundles"]["active"][i]["url"] + '" target="_blank">';
									purchase += localized_strings[language].buy;
									purchase += '</a><div class="btn_addtocart_right"></div></div></div></div></div></div>';
									$("#game_area_purchase").after(purchase);
									
									$("#game_area_purchase").after("<h2 class='gradientbg'>" + localized_strings[language].bundle.header + " <img src='http://cdn3.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></h2>");
								}
							}
						}
	                }
	        	});
			}

			switch (type) {
				case "app":
					get_price_data(type, $(".game_area_purchase_game_wrapper:first"), appid);

					$(".game_area_purchase_game_wrapper").not(".game_area_purchase_game_wrapper:first").each(function() {
						var subid = $(this).find("input[name=subid]").val();
						get_price_data("sub", $(this), subid);
					});
					break;
				case "sub":
					get_price_data(type, $(".game_area_purchase_game:first"), appid);
					break;
			}
			
		}
	});
}

// Add red warnings for 3rd party DRMs
function drm_warnings(type) {
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
			var drm;

			var text = $("#game_area_description").html();
			text += $("#game_area_sys_req").html();
			text += $("#game_area_legal").html();
			text += $(".game_details").html();
			text += $(".DRM_notice").html();

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
			if (text.match(/\btages\b/i)) { tages = true; }
			if (text.match(/angebote des tages/i)) { tages = false; }
			if (text.match("/\bsolidshield\b/i")) { tages = true; }

			// Stardock account detection
			if (text.indexOf("Stardock account") > 0) { stardock = true; }

			// Rockstar social club detection
			if (text.indexOf("Rockstar Social Club") > 0) { rockstar = true; }
			if (text.indexOf("Rockstar Games Social Club") > 0) { rockstar = true; }

			// Kalypso Launcher detection
			if (text.indexOf("Requires a Kalypso account") > 0) { kalypso = true; }

			// Detect other DRM
			if (text.indexOf("3rd-party DRM") > 0) { drm = true; }
			if (text.indexOf("No 3rd Party DRM") > 0) { drm = false; }
			
			var string_type;
			var drm_string = "(";
			if (type == "app") { string_type = localized_strings[language].drm_third_party; } else { string_type = localized_strings[language].drm_third_party_sub; }
			
			if (gfwl) { drm_string += 'Games for Windows Live, '; drm = true; }
			if (uplay) { drm_string += 'Ubisoft Uplay, '; drm = true; }
			if (securom) { drm_string += 'SecuROM, '; drm = true; }
			if (tages) { drm_string += 'Tages, '; drm = true; }
			if (stardock) { drm_string += 'Stardock Account Required, '; drm = true; }
			if (rockstar) { drm_string += 'Rockstar Social Club, '; drm = true; }
			if (kalypso) { drm_string += "Kalypso Launcher, "; drm = true; }

			if (drm_string == "(") {
				drm_string = "";
			} else {
				drm_string = drm_string.substring(0, drm_string.length - 2);
				drm_string += ")";
			}

			if (drm) {
				if ($("#game_area_purchase").find(".game_area_description_bodylabel").length > 0) {
					$("#game_area_purchase").find(".game_area_description_bodylabel").after('<div class="game_area_already_owned es_drm_warning" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );"><span>' + string_type + ' ' + drm_string + '</span></div>');
				} else {
					$("#game_area_purchase").prepend('<div class="game_area_already_owned es_drm_warning" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );"><span>' + string_type + ' ' + drm_string + '</span></div>');
				}	
			}	
		}
	});
}

// Remove all items from cart
function add_empty_cart_button() {
	addtext = "<a href='javascript:document.cookie=\"shoppingCartGID=0; path=/\";location.reload();' class='btn_checkout_blue' style='float: left; margin-top: 14px;'><div class='leftcap'></div><div class='rightcap'></div>" + localized_strings[language].empty_cart + "</a>";

	jQuery('.checkout_content').each(function () {
		$(this).prepend(addtext);
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
		if (settings.profile_api_info === undefined){ settings.profile_api_info = false; chrome.storage.sync.set({'profile_api_info': settings.profile_api_info});}
		if (settings.api_key == false||settings.api_key==""||settings.api_key===undefined){ settings.profile_api_info = false; chrome.storage.sync.set({'profile_api_info': settings.profile_api_info});}

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
			htmlstr += "<div class=\"profile_count_link\" id=\"es_permalink_div\"><span id=\"es_permalink_text\">"+localized_strings[language].permalink+"</span><input type=\"text\" id=\"es_permalink\" value=\"http://steamcommunity.com/profiles/"+steamID+"\" readonly></div>";
		}

		if (settings.profile_api_info) {
			htmlstr += '<div class="profile_count_link"><a href="http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=' + settings.api_key + '&steamids='+steamID+'" target="_blank"><span class="count_link_label">API Information</span><span class="profile_count_link_total">&nbsp;</span></div>';
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

function add_wishlist_profile_link() {
	if ($("#reportAbuseModal").length > 0) { var steamID = document.getElementsByName("abuseID")[0].value; }
	if (steamID === undefined) { var steamID = document.documentElement.outerHTML.match(/steamid"\:"(.+)","personaname/)[1]; }

	$(".profile_item_links").find(".profile_count_link:first").after("<div class='profile_count_link' id='es_wishlist_link'><a href='http://steamcommunity.com/profiles/" + steamID + "/wishlist'><span class='count_link_label'>" + localized_strings[language].wishlist + "</span>&nbsp;<span class='profile_count_link_total' id='es_wishlist_count'></span></a></div>");

	// Get count of wishlisted items
	get_http("http://steamcommunity.com/profiles/" + steamID + "/wishlist", function(txt) {
		var html = $.parseHTML(txt);
		var count = ($(html).find(".wishlistRow").length);

		if (count) { $("#es_wishlist_count").text(count); } else { $('#es_wishlist_link').remove(); }
	});	
}

// Add supporter badges to supporter's profiles
function add_supporter_badges() {
	if ($("#reportAbuseModal").length > 0) { var steamID = document.getElementsByName("abuseID")[0].value; }
	if (steamID === undefined) { var steamID = document.documentElement.outerHTML.match(/steamid"\:"(.+)","personaname/)[1]; }

	get_http("http://api.enhancedsteam.com/supporter/?steam_id=" + steamID, function(txt) {
		var data = JSON.parse(txt);
		var badge_count = data["badges"].length;

		if (badge_count > 0) {
			var html = '<div class="profile_badges" id="es_supporter_badges"><div class="profile_count_link"><a href="http://www.EnhancedSteam.com"><span class="count_link_label">' + localized_strings[language].es_supporter + '</span>&nbsp;<span class="profile_count_link_total">' + badge_count + '</span></a></div>';

			for (i=0; i < data["badges"].length; i++) {
				if (data["badges"][i].link) {
					html += '<div class="profile_badges_badge "><a href="' + data["badges"][i].link + '" title="' + data["badges"][i].title + '"><img src="' + data["badges"][i].img + '"></a></div>';
				} else {
					html += '<div class="profile_badges_badge "><img src="' + data["badges"][i].img + '" title="' + data["badges"][i].title + '"></div>';
				}	
			}

			html += '<div style="clear: left;"></div></div>';
			$(".profile_badges").after(html);
			$("#es_supporter_badges .profile_badges_badge:last").addClass("last");
		}
	});
}

function appdata_on_wishlist() {

	jQuery('a.btn_visit_store').each(function (index, node) {
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

					// Add platform information
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
	});
}

function add_advanced_cancel() {
	$("#advanced_search_controls").find(".control:first").append("<div id='es_advanced_cancel' style='display: inline-block;'>(<a style='cursor: pointer;'>" + localized_strings[language].cancel + "</a>)</div>");
	$("#es_advanced_cancel").click(function() {
		$("#advanced_search_ctn").hide();
		$("#advanced_search_toggle").show();
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
			// Each result is 58px height * 25 results per page = 1450
			search_threshhold = search_threshhold + 1450;
			search_page = search_page + 1;
			processing = false;
			remove_non_specials();
			process_early_access();
		});
	}
}

// Enable continuous scrolling of search results
function endless_scrolling() {
	storage.get(function(settings) {
		if (settings.contscroll === undefined) { settings.contscroll = true; storage.set({'contscroll': settings.contscroll}); }
		if (settings.contscroll) {

			$(".search_pagination_right").css("display", "none");
			if ($(".search_pagination_left").text().trim().match(/(\d+)$/)) $(".search_pagination_left").text($(".search_pagination_left").text().trim().match(/(\d+)$/)[0] + " Results");

			$(window).scroll(function() {
				if ($(window).scrollTop() > search_threshhold) {
					load_search_results();
					search_in_names_only(true);
				}
			});
		}
	});
}

function remove_non_specials() {
	if (window.location.search.match(/specials=1/)) {
		$(".search_result_row").each(function(index) {
			if (!($(this).html().match(/<strike>/))) {
				hide_the_node($(this)[0]);
				if ($(document).height() <= $(window).height()) {
					load_search_results();
				}
			}
		});
	}
}

function set_homepage_tab() {
	storage.get(function(settings) {
		if (settings.homepage_tab_selection === undefined) { settings.homepage_tab_selection = "remember"; storage.set({'homepage_tab_selection': settings.homepage_tab_selection}); }
		$(".tabarea .tabbar").find("div").on("click", function(e) {
			var current_button;
			var button_id = $(this).attr("id");
			if (button_id == "es_popular") {
				current_button = "es_popular";
			} else {
				var button = $(this).attr("onclick").match(/TabSelect\( this, '(.+)'/)[1];
				current_button = button;
			}
			storage.set({'homepage_tab_last': current_button});
		});

		if (settings.homepage_tab_selection == "remember") {
			settings.homepage_tab_selection = settings.homepage_tab_last;
		}

		switch (settings.homepage_tab_selection) {
			case "tab_3_content":
				$(".tabarea .tabbar").find("div[onclick='LoadDelayedImages(\'home_tabs\'); TabSelect( this, \'tab_3_content\' );']").click();
				break;
			case "tab_2_content":
				break;
			case "tab_1_content":
				$(".tabarea .tabbar").find("div[onclick='LoadDelayedImages(\'home_tabs\'); TabSelect( this, \'tab_1_content\' );']").click();
				break;
			case "tab_discounts_content":
				$(".tabarea .tabbar").find("div[onclick='LoadDelayedImages(\'home_tabs\'); TabSelect( this, \'tab_discounts_content\' );']").click();
				break;	
			case "es_popular":
				$("#es_popular").click();
				break;
		}
	});
}

function add_actual_new_release_button() {
	$("#tab_filtered_dlc_content").clone().css("display", "none").attr("id", "tab_filtered_dlc_content_enhanced").appendTo(".tab_content_ctn");
	$("#tab_filtered_dlc_content_enhanced").find("#tab_NewReleasesFilteredDLC_items").attr("id", "tab_NewReleasesFilteredDLC_items_enhanced").empty();
	$("#tab_filtered_dlc_content_enhanced").find("#tab_NewReleasesFilteredDLC_prev").remove();
	$("#tab_filtered_dlc_content_enhanced").find("#tab_NewReleasesFilteredDLC_next").remove();
	$("#tab_filtered_dlc_content_enhanced").find("#tab_NewReleasesFilteredDLC_count_total").text("10");
	$("#tab_filtered_dlc_content").find(".new_releases_filter_block").append("<div class='store_checkbox_button checked' style='margin-left: 16px;' id='new_all_filtered' onclick='TabSelectStealth(\"tab_filtered_dlc_content_enhanced\");'>" + localized_strings[language].show_all_steam_releases + "</div>");
	$("#tab_filtered_dlc_content_enhanced").find(".new_releases_filter_block").append("<div class='store_checkbox_button' style='margin-left: 16px;' id='new_all_filtered_enhanced' onclick='TabSelectStealth(\"tab_filtered_dlc_content\");'>" + localized_strings[language].show_all_steam_releases + "</div>");

	$("#tab_1_content").clone().css("display", "none").attr("id", "tab_1_content_enhanced").appendTo(".tab_content_ctn");
	$("#tab_1_content_enhanced").find("#tab_NewReleases_items").attr("id", "tab_NewReleases_items_enhanced").empty();
	$("#tab_1_content_enhanced").find("#tab_NewReleases_prev").remove();
	$("#tab_1_content_enhanced").find("#tab_NewReleases_next").remove();
	$("#tab_1_content_enhanced").find("#tab_NewReleases_count_total").text("10");
	$("#tab_1_content").find(".new_releases_filter_block").append("<div class='store_checkbox_button checked' style='margin-left: 16px;' id='new_all' onclick='TabSelectStealth(\"tab_1_content_enhanced\");'>" + localized_strings[language].show_all_steam_releases + "</div>");
	$("#tab_1_content_enhanced").find(".new_releases_filter_block").append("<div class='store_checkbox_button' style='margin-left: 16px;' id='new_all_enhanced' onclick='TabSelectStealth(\"tab_1_content\");'>" + localized_strings[language].show_all_steam_releases + "</div>");

	$("#tab_1_content_enhanced").find(".store_checkbox_button:first").attr("onclick", "TabSelectStealth('tab_filtered_dlc_content_enhanced');");
	$("#tab_filtered_dlc_content_enhanced").find(".store_checkbox_button:first").attr("onclick", "TabSelectStealth('tab_1_content_enhanced');");

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

	$(".tabarea .tab_filler").on("click", function() {
		// Determine which to show by default
		storage.get(function(settings) {
			if (settings.new_release_filter === undefined) { settings.new_release_filter = true; storage.set({'new_release_filter': settings.new_release_filter}); }
			if (settings.new_release_dlc_filter === undefined) { settings.new_release_dlc_filter = true; storage.set({'new_release_dlc_filter': settings.new_release_dlc_filter}); }

			$("#tab_1_content").hide();
			$("#tab_1_content_enhanced").hide();
			$("#tab_filtered_dlc_content").hide();
			$("#tab_filtered_dlc_content_enhanced").hide();

			if (settings.new_release_dlc_filter == true && settings.new_release_filter == true) { $("#tab_1_content").show(); }
			if (settings.new_release_dlc_filter == true && settings.new_release_filter == false) { $("#tab_1_content_enhanced").show(); }
			if (settings.new_release_dlc_filter == false && settings.new_release_filter == true) { $("#tab_filtered_dlc_content").show(); }
			if (settings.new_release_dlc_filter == false && settings.new_release_filter == false) { $("#tab_filtered_dlc_content_enhanced").show(); }

			$("#new_all_filtered_enhanced, #new_all_enhanced").click(function() {
				storage.set({'new_release_filter': true});
			});

			$("#new_all_filtered, #new_all").click(function() {
				storage.set({'new_release_filter': false});
			});

			$("#tab_1_content_enhanced").find(".store_checkbox_button:first").click(function() { storage.set({'new_release_dlc_filter': false}); });
			$("#tab_1_content").find(".store_checkbox_button:first").click(function() { storage.set({'new_release_dlc_filter': false}); });
			$("#tab_filtered_dlc_content_enhanced").find(".store_checkbox_button:first").click(function() { storage.set({'new_release_dlc_filter': true}); });
			$("#tab_filtered_dlc_content").find(".store_checkbox_button:first").click(function() { storage.set({'new_release_dlc_filter': true}); });
		});

		function fill_box(tabName) {
			$("#tab_" + tabName + "_items_enhanced").append("<div class='es_newrelease_loading' id='es_loading_" + tabName + "'><img src='http://cdn.steamcommunity.com/public/images/login/throbber.gif'><span>" + localized_strings[language].loading + "</span></div>");

			var appids = [];
			var count = 1;

			var game_items = $("#tab_" + tabName + "_items").children();
			get_http("http://store.steampowered.com/search/tab?bHoverEnabled=true&cc=" + cc + "&l=" + language + "&style=&navcontext=1_4_4_&tab=" + tabName + "&start=10&count=15", function(txt) {
				var parsed = $.parseHTML(txt);
				$(parsed).each(function(i) {
					if ($(parsed[i]).find("div").length > 0) {
						game_items.push($(parsed[i]));
					}
				});

				$(game_items).each(function() {
					var valueToPush = new Array();
					valueToPush[0] = get_appid($(this).find("a").attr("href"));
					valueToPush[1] = $(this).clone();
					valueToPush[2] = $(this).find(".genre_release").text().match(/\: (.+)/)[1].toLowerCase();
					valueToPush[3] = count;
					appids.push(valueToPush);
					count++;
				});
				
				var processItemsDeferred = [];
				var games = [];

				for(var i = 0; i < appids.length; i++){
					processItemsDeferred.push(processItem(appids[i]));
				}

				function processItem(data) {
					var dfd = $.Deferred();

					get_http("http://store.steampowered.com/app/" + data[0] + "/", function(store_page) {
						var html = $.parseHTML(store_page);
						if ($(html).find(".glance_ctn").find("div:not([class])").text().trim().match(/\: (.+)/)) {
							apppage_release_date = $(html).find(".glance_ctn").find("div:not([class])").text().trim().match(/\: (.+)/)[1].toLowerCase();
							if (data[2] == apppage_release_date) {
								var valueToPush = new Array();
								valueToPush[0] = data[0];
								valueToPush[1] = data[1];
								valueToPush[2] = data[2];
								valueToPush[3] = apppage_release_date;
								valueToPush[4] = data[3];
								games.push(valueToPush);
							}						
						}
						dfd.resolve();
					});

					return dfd.promise();
				}

				$.when.apply($, processItemsDeferred).done(function() {
					games.sort(function(a,b) {
						return parseInt(a[4],10) - parseInt(b[4],10);
					});
					$("#es_loading_" + tabName).remove();
					$(games).each(function(t) {
						$("#tab_" + tabName + "_items_enhanced").append(games[t][1]);
					});
				});

			});
		}

		fill_box("NewReleasesFilteredDLC");
		fill_box("NewReleases");
	});
}

function add_popular_tab() {
	$(".tabarea .tabbar").find(".tab:last").after("<div class='tab' id='es_popular'>" + localized_strings[language].popular + "</div>");
	var tab_html = "<div id='tab_popular_content' style='display: none;'><div class='tab_page' style='height: 780px;'><div id='tab_popular_items' class='v5'><span id='es_loading' style='position: absolute; margin-top: 20px; margin-left: 260px;'><img src='http://cdn.steamcommunity.com/public/images/login/throbber.gif'>" + localized_strings[language].loading + "</span></div></div>";
	tab_html += "<div class='tab_page_link_holder'><div id='tab_popular_prev' class='tab_page_link tab_page_link_prev' style='visibility: hidden;'>";
	tab_html += "<a href='javascript:tabMax[\"popular\"] = 100; PageTab(\"popular\", -10, 100);'>";
	tab_html += "<img src='http://store.akamai.steamstatic.com/public/images/v5/ico_navArrow_up.gif'> prev 10</a></div>";
	tab_html += "<div id='tab_popular_next' class='tab_page_link tab_page_link_next'>";
	tab_html += "<a href='javascript:tabMax[\"popular\"] = 100; PageTab(\"popular\", 10, 100);'>";
	tab_html += "next 10 <img src='http://store.akamai.steamstatic.com/public/images/v5/ico_navArrow_down.gif'></a></div>";
	tab_html += "<div id='tab_popular_count' class='tab_page_count'><span id='tab_popular_count_start'>1</span> - <span id='tab_popular_count_end'>10</span> of <span id='tab_popular_count_total'>100</span></div>";
	tab_html += "</div>";

	$(".tabarea .tab_content_ctn").append(tab_html);

	$("#es_popular").on("click", function() {
		$(".tabarea .tabbar").find(".active").removeClass("active");
		$("#tab_1_content, #tab_2_content, #tab_3_content, #tab_discounts_content, #tab_filtered_dlc_content, #tab_filtered_dlc_content_enhanced, #tab_1_content_enhanced").css("display", "none");
		$("#es_popular").addClass("active");
		$("#tab_popular_content").css("display", "block");

		if ($("#tab_popular_items").find("div").length == 0) {

			get_http("http://store.steampowered.com/stats", function(txt) {
				$("#es_loading").remove();
				var return_text = $.parseHTML(txt);
				$(return_text).find(".player_count_row").each(function() {
					var appid = get_appid($(this).find("a").attr("href"));
					var game_name = $(this).find("a").text();
					var currently = $(this).find(".currentServers:first").text();
					var html = "<div class='tab_row' onmouseover='GameHover( this, event, $(\"global_hover\"), {\"type\":\"app\",\"id\":\"" + appid + "\"} );' onmouseout='HideGameHover( this, event, $(\"global_hover\") )' id='tab_row_popular_" + appid + "'>";
					html += "<a class='tab_overlay' href='http://store.steampowered.com/app/" + appid + "/?snr=1_4_4__106'></a>";
					html += "<div class='tab_item_img'><img src='http://cdn.akamai.steamstatic.com/steam/apps/" + appid + "/capsule_sm_120.jpg' class='tiny_cap_img'></div>";
					html += "<div class='tab_desc'><h4>" + game_name + "</h4><div class='genre_release'>" + currently + " " + localized_strings[language].charts.playing_now + "</div><br clear='all'></div>";

					html += "</div>";
					$("#tab_popular_items").append(html);
				});	
			});
		}
	});
}

function fix_search_placeholder() {
	var selectors = ["#store_nav_search_term", "#term"];
	$.each(selectors, function(index, selector){
		$(selector).each(function(){
			var $this = $(this);
			$this.off("blur");
			$this.attr("onblur","");
			if(selector!="#term"){
				var search_string = $this.val();
				if (!$this.attr("placeholder")){
					$this.attr("placeholder", search_string);
				}
				$this.removeClass("default");
				$this.val("");
				$this.blur(function(e) {
					if($this.val()==search_string){
						$this.val("");
						$this.removeClass("default");
					}
				});
			}
		});
	});
}
// Add speech input to search boxes
function add_speech_search() {
	storage.get(function(settings) {
		if (settings.showspeechsearch === undefined) { settings.showspeechsearch = true; storage.set({'showspeechsearch': settings.showspeechsearch}); }
		if (settings.showspeechsearch) {
			var selectors = [["#store_nav_search_term","#searchform"], ["#term", "#advsearchform"]];
			$.each(selectors, function(index, selector){
				$(selector[0]).attr("x-webkit-speech", "search");			
				$(selector[0]).bind("webkitspeechchange", function(e) {
					if(selector[0]=="#term"){
						$("#realterm").val($("#term").val());
					}
					var form = $(selector[1]);
					form.submit();
					return false;
				});
			});
		}
	});
}

// Change Steam Greenlight pages
function hide_greenlight_banner() {
	storage.get(function(settings) {
		if (settings.showgreenlightbanner === undefined) { settings.showgreenlightbanner = false; storage.set({'showgreenlightbanner': settings.showgreenlightbanner}); }
		if (settings.showgreenlightbanner) {
			var banner = $("#ig_top_workshop");
			var breadcrumbs = $(".breadcrumbs");

			var greenlight_info = '<link rel="stylesheet" type="text/css" href="http://cdn.steamcommunity.com/public/shared/css/apphub.css">';
			greenlight_info += '<div class="apphub_HeaderTop es_greenlight"><div class="apphub_AppName ellipsis">Greenlight</div><div style="clear: both"></div>'
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
			var spam_comment_show = "<div class='es_bad_comment_num' title=\"" + localized_strings[language].spam_comment_warn + "\">" + localized_strings[language].spam_comment_show+"</div>"
			function comment_num(bad_comment_num, frame) {
				if (frame){
					$(frame).find(".es_bad_comment_num").remove();
					if (bad_comment_num>0) {
						$(frame).find(".commentthread_comments").after(spam_comment_show.replace("__num__", bad_comment_num));
					}
				}
				else {
					$(".es_bad_comment_num").remove();
					if (bad_comment_num>0) {
						$(".commentthread_comments").after(spam_comment_show.replace("__num__", bad_comment_num));
					}
				}
			}
			function check_hide_comments() {
				var bad_comment_num = 0;
				var comment_array = $(".commentthread_comment").toArray();
				$.each(comment_array, function(index,value){
					var comment_text = $(value).find(".commentthread_comment_text").text().trim();
					if(spam_regex.test(comment_text)) {
						bad_comment=$(value).attr("id");
						$("#"+bad_comment).hide();
						bad_comment_num++;
					}
				});
				comment_num(bad_comment_num);
			}
			function frame_check_hide_comments() {
				for (var i=0; i<frames.length; i++) {
					var frame = frames[i].document;
					var bad_comment_num = 0;
					var comment_array = $(frame).find(".commentthread_comment").toArray();
					$.each(comment_array, function(index,value){
						var comment_text = $(value).find(".commentthread_comment_text").text().trim();
						if(spam_regex.test(comment_text)) {
							bad_comment=$(value).attr("id");
							$(frame).find("#"+bad_comment).hide();
							bad_comment_num++;
						}
					});
					comment_num(bad_comment_num, frame);
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
							$(frame).on("click", ".es_bad_comment_num", function(){
								$(this).hide();
								$(frame).find(".commentthread_comment").show();
							});
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
			$(document).on("click", ".es_bad_comment_num", function(){
				$(this).hide();
				$(".commentthread_comment").show();
			});
		}
	});
}

function hide_activity_spam_comments() {
	var blotter_content_observer = new WebKitMutationObserver(function(mutations) {
		hide_spam_comments();
	});
	blotter_content_observer.observe($("#blotter_content")[0], {childList:true, subtree:true});
}

// Add Metacritic user scores to store page
function add_metacritic_userscore() {
	// Add metacritic user reviews
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
            		metauserscore = metauserscore*10;
            		var newmeta = '<div id="game_area_metascore" style="background-image: url(' + chrome.extension.getURL("img/metacritic_bg.png") + ');"><div id="metapage">' + metauserscore + '</div></div>';
            		$("#game_area_metascore").after(newmeta);
            	});
            }
		}
	});
}

// Add Steam user review score
function add_steamreview_userscore(appid) {
	if ($(".game_area_dlc_bubble,.noReviewsYetTitle").length === 0) {
		var positive = 0,
			negative = 0;

		positive = parseFloat($("#ReviewsTab_positive").find("span:last").text().replace(/\(|\)|,/g, ""));
		negative = parseFloat($("#ReviewsTab_negative").find("span:last").text().replace(/\(|\)|,/g, ""));

		var pos_percent = ((positive / (positive + negative)) * 100).toFixed(0),
			neg_percent = ((negative / (positive + negative)) * 100).toFixed(0);

		if (!isNaN(pos_percent) && !isNaN(neg_percent)) {
			$(".game_details").find(".details_block:first").before('<div id="es_review_score"><div style="display: inline-block; margin-right: 25px;"><img src="http://store.akamai.steamstatic.com/public/shared/images/userreviews/icon_thumbsUp_v6.png" width="24" height="24" class="es_review_image"><span class="es_review_text"> ' + pos_percent + '%</span></div><div style="display: inline-block;"><img src="http://store.akamai.steamstatic.com/public/shared/images/userreviews/icon_thumbsDown_v6.png" width="24" height="24" class="es_review_image"><span class="es_review_text"> ' + neg_percent + '%</span></div><div style="clear: both;"></div></div>');
		}
	}
}

function add_hltb_info(appid) {
	storage.get(function(settings) {
		if (settings.showhltb === undefined) { settings.showhltb = true; storage.set({'showhltb': settings.showhltb}); }
		if (settings.showhltb) {
			get_http("http://api.enhancedsteam.com/hltb/?appid=" + appid, function (txt) {
				if (txt.length > 0) {
					var data = JSON.parse(txt);
					if (data["hltb"]) {
						how_long_html = "<div class='block game_details underlined_links'>"
							+ "<div class='block_header'><h4>How Long to Beat</h4></div>"
							+ "<div class='block_content'><div class='block_content_inner'><div class='details_block'>";
						if (data["hltb"]["main_story"]){
							how_long_html += "<b>" + localized_strings[language].hltb.main + ":</b><span style='float: right;'>" + escapeHTML(data['hltb']['main_story']) + "</span><br>";
						}
						if (data["hltb"]["main_extras"]){
							how_long_html += "<b>" + localized_strings[language].hltb.main_e + ":</b><span style='float: right;'>" + escapeHTML(data['hltb']['main_extras']) + "</span><br>";
						}
						if (data["hltb"]["comp"]) {
							how_long_html += "<b>" + localized_strings[language].hltb.compl + ":</b><span style='float: right;'>" + escapeHTML(data['hltb']['comp']) + "</span><br>"
						}
						how_long_html += "</div>"
							+ "<a class='linkbar' href='" + escapeHTML(data['hltb']['url']) + "' target='_blank'><div class='rightblock'><img src='http://cdn2.store.steampowered.com/public/images/ico/link_web.gif' width='16' height='16' border='0' align='top' /></div>" + localized_strings[language].more_information + " <img src='http://cdn2.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"
							+ "<a class='linkbar' href='" + escapeHTML(data['hltb']['submit_url']) + "' target='_blank'><div class='rightblock'><img src='http://cdn3.store.steampowered.com/public/images/ico/link_news.gif' width='16' height='16' border='0' align='top' /></div>" + localized_strings[language].hltb.submit + " <img src='http://cdn2.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"
							+ "</div></div></div>";
						$("div.game_details:first").after(how_long_html);
					}
				}
			});
		}
	});
}

// Add link to game pages on pcgamingwiki.com
function add_pcgamingwiki_link(appid) {
	storage.get(function(settings) {
		if (settings.showpcgw === undefined) { settings.showpcgw = true; storage.set({'showpcgw': settings.showpcgw}); }
		if (settings.showpcgw) {
			get_http("http://api.enhancedsteam.com/pcgw/?appid=" + appid, function (txt) {
				if (txt) {
					var data = JSON.parse(txt);
					for (var game_name in data["results"]) break;
					var url = data["results"][game_name]["fullurl"];
					$('#demo_block').find('.block_content_inner').prepend('<div class="demo_area_button"><a class="game_area_wishlist_btn" target="_blank" href="' + url + '" style="background-image:url(' + chrome.extension.getURL("img/pcgw.png") + ')">' + localized_strings[language].wiki_article.replace("__pcgw__","PC Gaming Wiki") + '</a></div>');
				}
			});
		}
	});
}

// Add link to Steam Card Exchange
function add_steamcardexchange_link(appid){
  storage.get(function(settings) {
    if (settings.showsteamcardexchange === undefined ){ settings.showsteamcardexchange = false; storage.set({'showsteamcardexchange': settings.showsteamcardexchange}); }
    if (settings.showsteamcardexchange) {
    	if ($(".icon").find('img[src$="/ico_cards.png"]').length > 0) {
      		$("#demo_block").find('.block_content_inner').prepend('<div class="demo_area_button"><a class="game_area_wishlist_btn" target="_blank" href="http://www.steamcardexchange.net/index.php?gamepage-appid-' + appid + '" style="background-image:url(' + chrome.extension.getURL("img/steamcardexchange.png") + ')">' + localized_strings[language].view_in + ' Steam Card Exchange</a></div>');
      	}
    }
  });
}

// Display widescreen support information from wsgf.org
function add_widescreen_certification(appid) {
	storage.get(function(settings) {
		if (settings.showwsgf === undefined) { settings.showwsgf = true; storage.set({'showwsgf': settings.showwsgf}); }
		if (document.body.innerHTML.indexOf("<p>Requires the base game <a href=") <= 0) {
			if (settings.showwsgf) {
				// Check to see if game data exists
				get_http("http://api.enhancedsteam.com/wsgf/?appid=" + appid, function (txt) {
					$("div.game_details:first").each(function (index, node) {
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
									wsg_icon = chrome.extension.getURL("img/wsgf/ws-gold.png");
									wsg_text = localized_strings[language].wsgf.gold.replace(/__type__/g, "Widescreen");
									break;
								case "B":
									wsg_icon = chrome.extension.getURL("img/wsgf/ws-silver.png");
									wsg_text = localized_strings[language].wsgf.silver.replace(/__type__/g, "Widescreen");
									break;
								case "C":
									wsg_icon = chrome.extension.getURL("img/wsgf/ws-limited.png");
									wsg_text = localized_strings[language].wsgf.limited.replace(/__type__/g, "Widescreen");
									break;
								case "Incomplete":
									wsg_icon = chrome.extension.getURL("img/wsgf/ws-incomplete.png");
									wsg_text = localized_strings[language].wsgf.incomplete;
									break;
								case "Unsupported":
									wsg_icon = chrome.extension.getURL("img/wsgf/ws-unsupported.png");
									wsg_text = localized_strings[language].wsgf.unsupported.replace(/__type__/g, "Widescreen");
									break;
							}

							switch (mmg) {
								case "A":
									mmg_icon = chrome.extension.getURL("img/wsgf/mm-gold.png");
									mmg_text = localized_strings[language].wsgf.gold.replace(/__type__/g, "Multi-Monitor");
									break;
								case "B":
									mmg_icon = chrome.extension.getURL("img/wsgf/mm-silver.png");
									mmg_text = localized_strings[language].wsgf.silver.replace(/__type__/g, "Multi-Monitor");
									break;
								case "C":
									mmg_icon = chrome.extension.getURL("img/wsgf/mm-limited.png");
									mmg_text = localized_strings[language].wsgf.limited.replace(/__type__/g, "Multi-Monitor");
									break;
								case "Incomplete":
									mmg_icon = chrome.extension.getURL("img/wsgf/mm-incomplete.png");
									mmg_text = localized_strings[language].wsgf.incomplete;
									break;
								case "Unsupported":
									mmg_icon = chrome.extension.getURL("img/wsgf/mm-unsupported.png");
									mmg_text = localized_strings[language].wsgf.unsupported.replace(/__type__/g, "Multi-Monitor");
									break;
							}

							switch (uws) {
								case "A":
									uws_icon = chrome.extension.getURL("img/wsgf/uw-gold.png");
									uws_text = localized_strings[language].wsgf.gold.replace(/__type__/g, "Ultra-Widescreen");
									break;
								case "B":
									uws_icon = chrome.extension.getURL("img/wsgf/uw-silver.png");
									uws_text = localized_strings[language].wsgf.silver.replace(/__type__/g, "Ultra-Widescreen");
									break;
								case "C":
									uws_icon = chrome.extension.getURL("img/wsgf/uw-limited.png");
									uws_text = localized_strings[language].wsgf.limited.replace(/__type__/g, "Ultra-Widescreen");
									break;
								case "Incomplete":
									uws_icon = chrome.extension.getURL("img/wsgf/uw-incomplete.png");
									uws_text = localized_strings[language].wsgf.incomplete;
									break;
								case "Unsupported":
									uws_icon = chrome.extension.getURL("img/wsgf/uw-unsupported.png");
									uws_text = localized_strings[language].wsgf.unsupported.replace(/__type__/g, "Ultra-Widescreen");
									break;
							}

							switch (fkg) {
								case "A":
									fkg_icon = chrome.extension.getURL("img/wsgf/4k-gold.png");
									fkg_text = localized_strings[language].wsgf.gold.replace(/__type__/g, "4k UHD");
									break;
								case "B":
									fkg_icon = chrome.extension.getURL("img/wsgf/4k-silver.png");
									fkg_text = localized_strings[language].wsgf.silver.replace(/__type__/g, "4k UHD");
									break;
								case "C":
									fkg_icon = chrome.extension.getURL("img/wsgf/4k-limited.png");
									fkg_text = localized_strings[language].wsgf.limited.replace(/__type__/g, "4k UHD");
									break;
								case "Incomplete":
									fkg_icon = chrome.extension.getURL("img/wsgf/4k-incomplete.png");
									fkg_text = localized_strings[language].wsgf.incomplete;
									break;
								case "Unsupported":
									fkg_icon = chrome.extension.getURL("img/wsgf/4k-unsupported.png");
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

// Fix "No image available" in wishlist
function fix_wishlist_image_not_found() {
	var items = document.getElementById("wishlist_items");
	if (items) {
		imgs = items.getElementsByTagName("img");
		for (var i = 0; i < imgs.length; i++)
		if (imgs[i].src == "http://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/33/338200c5d6c4d9bdcf6632642a2aeb591fb8a5c2.gif") {
			var gameurl = imgs[i].parentNode.href;
			imgs[i].src = "http://cdn.akamai.steamstatic.com/steam/apps/" + gameurl.substring(gameurl.lastIndexOf("/") + 1) + "/header.jpg";
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
			imgs[i].src = "http://cdn.akamai.steamstatic.com/steam/apps/" + gameurl.substring(gameurl.lastIndexOf("/") + 1) + "/header.jpg";
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
				$("#moreInfo").before('<div id="es_summary"><div class="market_search_sidebar_contents"><h2 class="market_section_title">'+ localized_strings[language].market_transactions +'</h2><div class="market_search_game_button_group" id="es_market_summary" style="width: 238px"><img src="http://cdn.steamcommunity.com/public/images/login/throbber.gif"><span>'+ localized_strings[language].loading +'</span></div></div></div>');

				var pur_total = 0.0;
				var sale_total = 0.0;
				var currency_symbol = "";

				function get_market_data(txt) {
					var data = JSON.parse(txt);
					market = data['results_html'];
					if (!currency_symbol) currency_symbol = currency_symbol_from_string($(market).find(".market_listing_price").text().trim());
					
					pur_totaler = function (p, i) {
						if ($(p).find(".market_listing_price").length > 0) {
							if (p.innerHTML.match(/\+.+<\/div>/)) {
								var price = $(p).find(".market_listing_price").text().trim().match(/(\d+[.,]?\d+)/);
								if (price !== null) {
									var tempprice = price[0].toString();
									tempprice = tempprice.replace(/,(\d\d)$/, ".$1");
									tempprice = tempprice.replace(/,/g, "");
									return parseFloat(tempprice);
								}
							}
						}
					};

					sale_totaler = function (p, i) {
						if ($(p).find(".market_listing_price").length > 0) {
							if (p.innerHTML.match(/-.+<\/div>/)) {
								var price = $(p).find(".market_listing_price").text().trim().match(/(\d+[.,]?\d+)/);
								if (price !== null) {
									var tempprice = price[0].toString();
									tempprice = tempprice.replace(/,(\d\d)$/, ".$1");
									tempprice = tempprice.replace(/,/g, "");
									return parseFloat(tempprice);
								}
							}
						}
					};

					pur_prices = jQuery.map($(market), pur_totaler);
					sale_prices = jQuery.map($(market), sale_totaler);

					jQuery.map(pur_prices, function (p, i) { pur_total += p; });
					jQuery.map(sale_prices, function (p, i) { sale_total += p; });
				}

				function show_results() {
					var currency_type = currency_symbol_to_type(currency_symbol);
					var net = sale_total - pur_total;

					var html = localized_strings[language].purchase_total + ":<span class='es_market_summary_item'>" + formatCurrency(parseFloat(pur_total), currency_type) + "</span><br>";
					html += localized_strings[language].sales_total + ":<span class='es_market_summary_item'>" + formatCurrency(parseFloat(sale_total), currency_type) + "</span><br>";
					if (net > 0) {
						html += localized_strings[language].net_gain + ":<span class='es_market_summary_item' style='color: green;'>" + formatCurrency(parseFloat(net), currency_type) + "</span>";
					} else {
						html += localized_strings[language].net_spent + ":<span class='es_market_summary_item' style='color: red;'>" + formatCurrency(parseFloat(net), currency_type) + "</span>";
					}

					$("#es_market_summary").html(html);
				}

				var start = 0;
				var count = 1000;
				var i = 1;
				get_http("http://steamcommunity.com/market/myhistory/render/?query=&start=0&count=1", function (last_transaction) {
					var data = JSON.parse(last_transaction);
					var total_count = data["total_count"];
					var loops = Math.ceil(total_count / count);

					if (loops) {
						while ((start + count) < (total_count + count)) {
							get_http("http://steamcommunity.com/market/myhistory/render/?query=&start=" + start + "&count=" + count, function (txt) {
								txt = txt.replace(/[ ]src=/g," data-src=");
								get_market_data(txt);
								if (i == loops) { show_results(); }
								i++;
							});
							start += count;
						}
					} else {
						show_results();
					}
				});
			}
		}
	});
}

function add_active_total() {
	if (window.location.pathname.match(/^\/market\/$/)) {
		var total = 0;
		var total_after = 0;	
		
		$(".my_listing_section:first").find(".market_listing_row").find(".market_listing_my_price").each(function() {
			var temp = $(this).text().trim().replace(/pуб./g,"").replace(/,(\d\d(?!\d))/g, ".$1").replace(/[^0-9(\.]+/g,"").split("(");
			total += Number(temp[0]);
			total_after += Number(temp[1]);
			currency_symbol = currency_symbol_from_string($(this).text().trim());
		});
		
		if (total != 0) {
			var currency_type = currency_symbol_to_type(currency_symbol);
			total = formatCurrency(parseFloat(total), currency_type);
			total_after = formatCurrency(parseFloat(total_after), currency_type);
			$(".my_listing_section:first").append("<div class='market_listing_row market_recent_listing_row'><div class='market_listing_right_cell market_listing_edit_buttons'></div><div class='market_listing_my_price es_active_total'><span class='market_table_value><span class='market_listing_price'><span style='color: white'>" + total + "</span><br><span style='color: #AFAFAF'>(" + total_after + ")</span></span></span><br><span>" + escapeHTML(localized_strings[language].sales_total) + "</span></div></div>");
		}

		var total = 0;
		
		$(".my_listing_section:nth-child(2)").find(".market_listing_row").find(".market_listing_my_price:first").each(function() {
			var qty = $(this).parent().find(".market_listing_my_price:last").text().trim();
			total += Number($(this).text().trim().replace(/pуб./g,"").replace(/,(\d\d(?!\d))/g, ".$1").replace(/[^0-9\.]+/g,"")) * Number(qty);
			currency_symbol = currency_symbol_from_string($(this).text().trim());
		});
		
		if (total != 0) {
			var currency_type = currency_symbol_to_type(currency_symbol);
			total = formatCurrency(parseFloat(total), currency_type);				
			$(".my_listing_section:nth-child(2)").append("<div class='market_listing_row market_recent_listing_row'><div class='market_listing_right_cell market_listing_edit_buttons'></div><div class='market_listing_my_price es_active_total'><span class='market_listing_item_name' style='color: white'>" + escapeHTML(total) + "</span><br><span class='market_listing_game_name'>" + escapeHTML(localized_strings[language].buying_total) + "</span></div></div>");
		}
	}
}

// Hide active listings on Market homepage
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

// Add a "Total spent on Steam" to the account details page
function account_total_spent() {
	storage.get(function(settings) {
		if (settings.showtotal === undefined) { settings.showtotal = true; storage.set({'showtotal': settings.showtotal}); }
		if (settings.showtotal) {
			if ($('.transactionRow').length !== 0) {
				var available_currencies = ["USD","GBP","EUR","BRL","RUB","JPY","NOK","IDR","MYR","PHP","SGD","THB","VND","KRW","TRY","UAH","MXN","CAD","AUD","NZD"];
				var currency_symbol;

				// Get user's Steam currency
				currency_symbol = currency_symbol_from_string($(".accountBalance").text().trim());
				if (currency_symbol == "") { return; }
				local_currency = currency_symbol_to_type(currency_symbol);

				var complete = 0;

				$.each(available_currencies, function(index, currency_type) {
					if (currency_type != local_currency) {
						if (getValue(currency_type + "to" + local_currency)) {
							var expire_time = parseInt(Date.now() / 1000, 10) - 24 * 60 * 60; // One day ago
							var last_updated = getValue(currency_type + "to" + local_currency + "_time") || expire_time - 1;

							if (last_updated < expire_time) {
								get_http("//firefox.enhancedsteam.com/api/currency/?" + local_currency.toLowerCase() + "=1&local=" + currency_type.toLowerCase(), function(txt) {
									complete += 1;
									setValue(currency_type + "to" + local_currency, parseFloat(txt));
									setValue(currency_type + "to" + local_currency + "_time", parseInt(Date.now() / 1000, 10));
									if (complete == available_currencies.length - 1) get_total();
								});
							} else {
								complete += 1;
								if (complete == available_currencies.length - 1) get_total();
							}
						} else {
							get_http("//firefox.enhancedsteam.com/api/currency/?" + local_currency.toLowerCase() + "=1&local=" + currency_type.toLowerCase(), function(txt) {
								complete += 1;
								setValue(currency_type + "to" + local_currency, parseFloat(txt));
								setValue(currency_type + "to" + local_currency + "_time", parseInt(Date.now() / 1000, 10));
								if (complete == available_currencies.length - 1) get_total();
							});
						}
					}
				});

				function totaler(p, i) {
					if (p.innerHTML.indexOf("class=\"transactionRowEvent walletcredit\">") < 0) {
						if ($(p).find(".transactionRowPrice")) {
							var price = $(p).find(".transactionRowPrice").text().match(/(\d+[.,]?\d+)/);
							if (price !== null) {
								var currency = currency_symbol_to_type(currency_symbol_from_string($(p).find(".transactionRowPrice").text()));
								var tempprice = price[0].toString();
								tempprice = tempprice.replace(/,(\d\d)$/, ".$1");
								tempprice = tempprice.replace(/,/g, "");

								if (currency !== local_currency) {
									tempprice = parseFloat(tempprice);
									tempprice = tempprice / getValue(currency + "to" + local_currency);
								}
								return parseFloat(tempprice);
							}
						}
					}
				};

				function get_total() {
					game_prices = jQuery.map($('#store_transactions .block:first .transactionRow'), totaler);
					gift_prices = jQuery.map($('#store_transactions .block:last .transactionRow'), totaler);
					ingame_prices = jQuery.map($('#ingame_transactions .transactionRow'), totaler);
					market_prices = jQuery.map($('#market_transactions .transactionRow'), totaler);

					var game_total = 0.0;
					var gift_total = 0.0;
					var ingame_total = 0.0;
					var market_total = 0.0;

					jQuery.map(game_prices, function (p, i) { game_total += p; });
					jQuery.map(gift_prices, function (p, i) { gift_total += p; });
					jQuery.map(ingame_prices, function (p, i) { ingame_total += p; });
					jQuery.map(market_prices, function (p, i) { market_total += p; });

					total_total = game_total + gift_total + ingame_total + market_total;

					if (currency_symbol) {
						var currency_type = currency_symbol_to_type(currency_symbol);

						game_total = formatCurrency(parseFloat(game_total), currency_type);
						gift_total = formatCurrency(parseFloat(gift_total), currency_type);
						ingame_total = formatCurrency(parseFloat(ingame_total), currency_type);
						market_total = formatCurrency(parseFloat(market_total), currency_type);
						total_total = formatCurrency(parseFloat(total_total), currency_type);

						var html = '<div class="accountRow accountBalance accountSpent">';
						html += '<div class="accountData price">' + game_total + '</div>';
						html += '<div class="accountLabel">' + localized_strings[language].store_transactions + ':</div></div>';
						html += '<div class="accountRow accountBalance accountSpent">';
						html += '<div class="accountData price">' + gift_total + '</div>';
						html += '<div class="accountLabel">' + localized_strings[language].gift_transactions + ':</div></div>';
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
		}
	});
}

function inventory_market_prepare() {
		$("#es_market_helper").remove();
		var es_market_helper = document.createElement("script");
		es_market_helper.type = "text/javascript";
		es_market_helper.id = "es_market_helper";
		es_market_helper.textContent = 'jQuery("#inventories").on("click", ".itemHolder, .newitem", function() { window.postMessage({ type: "es_sendmessage", information: [iActiveSelectView,g_ActiveInventory.selectedItem.marketable,g_ActiveInventory.appid,g_ActiveInventory.selectedItem.market_hash_name,g_ActiveInventory.selectedItem.market_fee_app,g_ActiveInventory.selectedItem.type] }, "*"); });';
		document.documentElement.appendChild(es_market_helper);

		window.addEventListener("message", function(event) {
			if (event.source != window)	return;
			if (event.data.type && (event.data.type == "es_sendmessage")) { inventory_market_helper(event.data.information); }
		}, false);
}

function inventory_market_helper(response) {
	var item = response[0];
	var marketable = response[1];
	var global_id = response[2];
	var hash_name = response[3];
	var appid = response[4];
	var gift = false;
	if (response[5] && response[5].match(/Gift/)) gift = true;
	var html;

	if (gift) {
		$("#es_item" + item).remove();
		if ($("#iteminfo" + item + "_item_actions").find("a").length > 0) {
			var gift_appid = get_appid($("#iteminfo" + item + "_item_actions").find("a")[0].href);
			get_http("http://store.steampowered.com/api/appdetails/?appids=" + gift_appid + "&filters=price_overview", function(txt) {
				var data = JSON.parse(txt);
				if (data[gift_appid].success && data[gift_appid]["data"]["price_overview"]) {
					var currency = data[gift_appid]["data"]["price_overview"]["currency"];
					var discount = data[gift_appid]["data"]["price_overview"]["discount_percent"];
					var price = formatCurrency(data[gift_appid]["data"]["price_overview"]["final"] / 100, currency);
					
					$("#iteminfo" + item + "_item_actions").css("height", "50px");
					if (discount > 0) {
						var original_price = formatCurrency(data[gift_appid]["data"]["price_overview"]["initial"] / 100, currency);
						$("#iteminfo" + item + "_item_actions").append("<div class='es_game_purchase_action' style='float: right;'><div class='es_game_purchase_action_bg'><div class='es_discount_block es_game_purchase_discount'><div class='es_discount_pct'>-" + discount + "%</div><div class='es_discount_prices'><div class='es_discount_original_price'>" + original_price + "</div><div class='es_discount_final_price'>" + price + "</div></div></div></div>");
					} else {						
						$("#iteminfo" + item + "_item_actions").append("<div class='es_game_purchase_action' style='float: right;'><div class='es_game_purchase_action_bg'><div class='es_game_purchase_price es_price'>" + price + "</div></div>");
					}	
				}
			});
		}
	} else {
		if ($(".profile_small_header_name .whiteLink").attr("href") !== $(".playerAvatar").find("a").attr("href")) {
			if ($('#es_item0').length == 0) { $("#iteminfo0_item_market_actions").after("<div class='item_market_actions es_item_action' id=es_item0></div>"); }
			if ($('#es_item1').length == 0) { $("#iteminfo1_item_market_actions").after("<div class='item_market_actions es_item_action' id=es_item1></div>"); }
			$('.es_item_action').html("");
			
			if (marketable == 0) { $('.es_item_action').remove(); return; }
			$("#es_item" + item).html("<img src='http://cdn.steamcommunity.com/public/images/login/throbber.gif'><span>"+ localized_strings[language].loading+"</span>");
			
			var url = "http://steamcommunity.com/market/priceoverview/?appid=" + global_id + "&market_hash_name=" + hash_name;
			get_http(url, function (txt) {
				data = JSON.parse(txt);
				$("#es_item" + item).html("");
				if (data.success) {
					html = "<div><div style='height: 24px;'><a href='http://steamcommunity.com/market/listings/" + global_id + "/" + hash_name + "'>" + localized_strings[language].view_in_market + "</a></div>";
					html += "<div style='min-height: 3em; margin-left: 1em;'>" + localized_strings[language].starting_at + ": " + data.lowest_price;
					if (data.volume) {
						html += "<br>" + localized_strings[language].last_24.replace("__sold__", data.volume);
					}

					$("#es_item" + item).html(html);
				} else {
					$("#es_item" + item).remove();
				}
			});
		} else {
			if (hash_name && hash_name.match(/Booster Pack/g)) {
				setTimeout(function() {
					var currency_symbol = currency_symbol_from_string($("#iteminfo" + item + "_item_market_actions").text());
					var currency_type = currency_symbol_to_type(currency_symbol);
					var api_url = "http://api.enhancedsteam.com/market_data/average_card_price/?appid=" + appid + "&cur=" + currency_type.toLowerCase();

					get_http(api_url, function(price_data) {				
						var booster_price = parseFloat(price_data,10) * 3;					
						html = localized_strings[language].avg_price_3cards + ": " + formatCurrency(booster_price, currency_type) + "<br>";
						$("#iteminfo" + item + "_item_market_actions").find("div:last").css("margin-bottom", "8px");
						$("#iteminfo" + item + "_item_market_actions").find("div:last").append(html);
					});
				}, 1000);
			}
		}
	}
}

function add_inventory_gotopage(){
	storage.get(function(settings) {
		if (settings.showinvnav === undefined) { settings.showinvnav = false; storage.set({'showinvnav': settings.showinvnav}); }
		if (settings.showinvnav) {
			$("#es_gotopage").remove();
			$("#pagebtn_first").remove();
			$("#pagebtn_last").remove();
			$("#es_pagego").remove();
			var es_gotopage = document.createElement("script");
			es_gotopage.type = "text/javascript";
			es_gotopage.id = "es_gotopage";
			es_gotopage.textContent =
				["g_ActiveInventory.GoToPage = function(page){",
				 "	var iCurPage = this.pageCurrent;",
				 "	var iNextPage = Math.min(Math.max(0, --page), this.pageTotal-1);",
				 "	this.pageList[iCurPage].hide();",
				 "	this.pageList[iNextPage].show();",
				 "	this.pageCurrent = iNextPage;",
				 "	this.LoadPageImages(this.pageList[iNextPage]);",
				 "	this.PreloadPageImages(iNextPage);",
				 "	this.UpdatePageCounts();",
				 "}",
				 "function InventoryLastPage(){",
				 "	g_ActiveInventory.GoToPage(g_ActiveInventory.pageTotal);",
				 "}",
				 "function InventoryFirstPage(){",
				 "	g_ActiveInventory.GoToPage(1);",
				 "}",
				 "function InventoryGoToPage(){",
				 "	var page = $('es_pagenumber').value;",
				 "	if (isNaN(page)) return;",
				 "	g_ActiveInventory.GoToPage(parseInt(page));",
				 "}"].join('\n');

			document.documentElement.appendChild(es_gotopage);

			// Go to first page
			var firstpage = document.createElement("a");
			firstpage.textContent = "<<";
			firstpage.id = "pagebtn_first";
			firstpage.classList.add("pagecontrol_element");
			firstpage.classList.add("pagebtn");
			firstpage.href = "javascript:InventoryFirstPage();";
			$("#pagebtn_previous").after(firstpage);

			// Go to last page
			var lastpage = document.createElement("a");
			lastpage.textContent = ">>";
			lastpage.id = "pagebtn_last";
			lastpage.classList.add("pagecontrol_element");
			lastpage.classList.add("pagebtn");
			lastpage.href = "javascript:InventoryLastPage();";
			$("#pagebtn_next").before(lastpage);

			$(".pagebtn").css({
				"padding": "0",
				"width": "32px",
				"margin": "0 3px"
			});
			var page_go = document.createElement("div");
			page_go.id = "es_pagego";
			$(page_go).css({"float":"left"});
			// Page number box
			var pagenumber = document.createElement("input");
			pagenumber.type = "number";
			pagenumber.value="1";
			// Steam's input theme
			pagenumber.classList.add("filter_search_box");
			pagenumber.autocomplete = "off";
			pagenumber.placeholder = "page #";
			pagenumber.id = "es_pagenumber";
			pagenumber.style.width = "50px";
			pagenumber.min = 1;
			pagenumber.max = $("#pagecontrol_max").text();
			$(page_go).append(pagenumber);

			var goto_btn = document.createElement("a");
			goto_btn.textContent = "Go";
			goto_btn.id = "gotopage_btn";
			goto_btn.classList.add("pagebtn");
			goto_btn.href = "javascript:InventoryGoToPage();";
			goto_btn.style.width = "32px";
			goto_btn.style.padding = "0";
			goto_btn.style.margin = "0 6px";
			goto_btn.style.textAlign = "center";
			$(page_go).append(goto_btn);

			$("#inventory_pagecontrols").before(page_go);
			// TODO: Maybe use &laquo; or &#8810; for first/last button text?
			// TODO: Disable buttons when already on first/last page?
		}
	});
}

// Check price savings when purchasing game bundles
function subscription_savings_check() {
	var not_owned_games_prices = 0,
		appid_info_deferreds = [],
		sub_apps = [],
		sub_app_prices = {},
		currency_symbol,
		currency_type,
		comma;

	// Load each apps info
	$.each($(".tab_row"), function (i, node) {
		var appid = get_appid(node.querySelector("a").href),
			// Remove children, leave only text(price or only discounted price, if there are discounts)
			price_container = $(node).find(".tab_price").children().remove().end().text().trim();

		if (price_container !== "N/A" && price_container !== "Free") {
			if (price_container) {
				itemPrice = parseFloat(price_container.match(/([0-9]+(?:(?:\,|\.)[0-9]+)?)/)[1]);
				if (!currency_symbol) currency_symbol = currency_symbol_from_string(price_container);
				if (!comma) comma = (price_container.search(/,\d\d(?!\d)/));
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
		currency_type = currency_symbol_to_type(currency_symbol);
		for (var i = 0; i < sub_apps.length; i++) {
			if (!getValue(sub_apps[i] + "owned")) not_owned_games_prices += sub_app_prices[sub_apps[i]];
		}
		var $bundle_price = $(".game_area_purchase_game").find(".discount_final_price:last");
		if ($bundle_price.length === 0) $bundle_price = $(".game_area_purchase_game").find(".game_purchase_price");

		var bundle_price = Number(($bundle_price[0].innerText).replace(/[^0-9\.]+/g,""));		
		if (comma > -1) { bundle_price = bundle_price / 100; }		
		var corrected_price = not_owned_games_prices - bundle_price;

		var $message = $('<div class="savings">' + formatCurrency(corrected_price, currency_type) + '</div>');
		if (corrected_price < 0) $message[0].style.color = "red";
		$('.savings').replaceWith($message);
	});
}

// Pull DLC gamedata from enhancedsteam.com
function dlc_data_from_site(appid) {
    if ($("div.game_area_dlc_bubble").length > 0) {
        var appname = $(".apphub_AppName").html();
		appname = rewrite_string(appname, true);
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

			html += "</div><a class='linkbar' href=\"http://www.enhancedsteam.com/gamedata/dlc_category_suggest.php?appid=" + appid + "&appname=" + appname + "\" target='_blank'>" + localized_strings[language].dlc_suggest + "</a></div></div></div>";

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

function enhance_game_background(type) {
	if (type == "sale") {
		$("#game_background").css("background-size", "initial");		
	} else {
		$("#game_background").before("<div id='es_background_gradient'></div>");		
	}

	$("#game_background").css("display", "block");
}

function add_screenshot_lightbox() {
	$(".highlight_screenshot").find("a").addClass("es_lightbox_image");
	var current, size = 0;
	var game_name = $(".apphub_AppName:first").text();

	$(".es_lightbox_image").click(function(e) {
		e.preventDefault();
		var image_href = $(this).attr("href");
		var slideNum = $(".es_lightbox_image").index(this);
		if ($('#es-lightbox').length > 0) {
			$('#es-lightbox').fadeIn(300);
		} else {
			$('body').append("<div id='es-lightbox'><p>X</p><div id='es-lightbox-content'><ul></ul><div class='es-nav'><a href='#es-prev' class='es-prev slide-nav'><</a><a href='#es-next' class='es-next slide-nav'>></a></div><div id='es-lightbox-desc'></div></div></div>");
		}

		if (size === 0) {
			$(".es_lightbox_image").each(function() {
				var $href = $(this).attr("href");
				$("#es-lightbox-content ul").append("<li><img src='" + $href + "'></li>");
			});
		}

		size = $("#es-lightbox-content ul > li").length;
		if (size === 1) { $(".es-nav").remove(); }
		$("#es-lightbox-content ul > li").hide();
		$("#es-lightbox-content ul > li:eq(" + slideNum + ")").show();
		current = slideNum;
		$("#es-lightbox-desc").text(game_name + "  " + (current + 1) + " / " + size);
	});

	$("body").on("click", "#es-lightbox", function() { $("#es-lightbox").fadeOut(300); });

	$("body").on({ 
		mouseenter: function() { $(".es-nav").fadeIn(300);	},
		mouseleave: function() { $(".es-nav").fadeOut(300); }
	}, "#es-lightbox-content");

	$("body").on("click", ".slide-nav", function(e) {
		e.preventDefault();
		e.stopPropagation();

		var $this = $(this);
		var dest;

		if ($this.hasClass('es-prev')) {
			dest = current - 1;
			if (dest < 0) {
				dest = size - 1;
			}
		} else {
			dest = current + 1;
			if (dest > size - 1) {
				dest = 0;
			}
		}

		$('#es-lightbox-content ul > li:eq(' + current + ')').hide();
		$('#es-lightbox-content ul > li:eq(' + dest + ')').show();

		current = dest;
		$("#es-lightbox-desc").text(game_name + "  " + (current + 1) + " / " + size);
	});
}

function add_app_badge_progress(appid) {
	if (is_signed_in()) {
		if ($(".icon").find('img[src$="/ico_cards.png"]').length > 0) {
			$(".communitylink .block_content:last").append("<div class='rule'></div><div class='block_content_inner'><link rel='stylesheet' type='text/css' href='http://cdn.steamcommunity.com/public/css/skin_1/badges.css'><div class='es_badge_progress'></div><div class='es_foil_badge_progress'></div></div><div style=\"clear: both\"></div>");
			$(".es_badge_progress").load("http://steamcommunity.com/my/gamecards/" + appid + "/ .badge_current", function(responseText) {
				if ($(responseText).find(".friendPlayerLevelNum").length != 1) {
					var card_num_owned = $(responseText).find(".badge_detail_tasks .owned").length;
					var card_num_total = $(responseText).find(".badge_detail_tasks .badge_card_set_card").length;
					var progress_text_length = $(responseText).find(".gamecard_badge_progress").text().trim().length;
					var next_level_empty_badge = $(responseText).find(".gamecard_badge_progress .badge_info").length;
					var show_card_num;
					var badge_completed;
					if(progress_text_length>0&&next_level_empty_badge==0){
						badge_completed=true;
					}
					if((card_num_owned>0&&progress_text_length==0)||(card_num_owned>0&&!badge_completed)){
						show_card_num=true;
					}
					if (badge_completed){
						$(".es_badge_progress").after("<a class='linkbar' href='http://steamcommunity.com/my/gamecards/" + appid + "/'><div class='rightblock'><img src='http://cdn4.store.steampowered.com/public/images/ico/ico_cards.png' width=24 height=16 border=0 align=top></div>" + localized_strings[language].view_badge + "</a>");
					} else {
						$(".es_badge_progress").after("<a class='linkbar' href='http://steamcommunity.com/my/gamecards/" + appid + "/'><div class='rightblock'><img src='http://cdn4.store.steampowered.com/public/images/ico/ico_cards.png' width=24 height=16 border=0 align=top></div>" + localized_strings[language].badge_progress + "</a>");
					}
					if(show_card_num){
						$(".es_badge_progress").after("<div style='padding-top: 2px; padding-bottom: 2px; color: #5491cf;'>" + localized_strings[language].cards_owned.replace("__owned__", card_num_owned).replace("__possible__", card_num_total) + "</div>");
					}
					$(".es_badge_progress").after("<div style='padding-top: 10px; padding-bottom: 2px; color: #5491cf;'>" + $(responseText).find(".progress_info_bold").text() + "</div>");
					$(".es_badge_progress").after("<div style=\"clear: both\"></div>");
					$(".es_badge_progress .badge_info_description").css({"width":"275px"});
					$(".es_badge_progress .badge_empty_circle").css({"margin":"0px 46px 14px 8px","border-radius":"46px"});
					$(".es_badge_progress .badge_empty_right div:last-child").remove();
					$(".es_badge_progress .badge_empty_right").append("<div class=\"badge_empty_name\">" + localized_strings[language].badge_not_unlocked + "</div>").append("<div style=\"clear: both\"></div>");
				} else {
					$(".es_badge_progress").remove();
					$(".communitylink .rule:last").remove();
				}
			});
			$(".es_foil_badge_progress").load("http://steamcommunity.com/my/gamecards/" + appid + "/?border=1 .badge_current", function(responseText) {
				if ($(responseText).find(".friendPlayerLevelNum").length != 1) {
					var card_num_owned = $(responseText).find(".badge_detail_tasks .owned").length;
					var card_num_total = $(responseText).find(".badge_detail_tasks .badge_card_set_card").length;
					var progress_text_length = $(responseText).find(".gamecard_badge_progress").text().trim().length;
					var next_level_empty_badge = $(responseText).find(".gamecard_badge_progress .badge_info").length;
					var show_card_num;
					var badge_completed;
					if(progress_text_length>0&&next_level_empty_badge==0){
						badge_completed=true;
					}
					if((card_num_owned>0&&progress_text_length==0)||(card_num_owned>0&&!badge_completed)){
						show_card_num=true;
					}
					if ($(responseText).find(".badge_empty_circle").length != 1||card_num_owned>0) {
						$(".es_foil_badge_progress .badge_info_description").css({"width":"275px"});
						$(".es_foil_badge_progress .badge_empty_circle").css({"margin":"0px 46px 14px 8px","border-radius":"46px"});
						$(".es_foil_badge_progress .badge_empty_right div:last-child").remove();
						$(".es_foil_badge_progress .badge_empty_right").append("<div class=\"badge_empty_name\">" + localized_strings[language].badge_not_unlocked + "</div>")
						if (badge_completed){
							$(".es_foil_badge_progress").after("<a class='linkbar' href='http://steamcommunity.com/my/gamecards/" + appid + "/?border=1'><div class='rightblock'><img src='http://cdn4.store.steampowered.com/public/images/ico/ico_cards.png' width=24 height=16 border=0 align=top></div>" + localized_strings[language].view_badge_foil + "</a>");
						}
						else {
							$(".es_foil_badge_progress").after("<a class='linkbar' href='http://steamcommunity.com/my/gamecards/" + appid + "/?border=1'><div class='rightblock'><img src='http://cdn4.store.steampowered.com/public/images/ico/ico_cards.png' width=24 height=16 border=0 align=top></div>" + localized_strings[language].badge_foil_progress + "</a>");
						}
						if(show_card_num){
							$(".es_foil_badge_progress").after("<div style='padding-top: 2px; padding-bottom: 2px; color: #5491cf;'>" + localized_strings[language].cards_owned.replace("__owned__", card_num_owned).replace("__possible__", card_num_total) + "</div>");
						}
						$(".es_foil_badge_progress").after("<div style=\"clear: both\"></div>");
					} else {
						$(".es_foil_badge_progress").remove();
					}
				} else {
					$(".es_foil_badge_progress").remove();
				}
			});
		}
	}
}

// Add checkboxes for DLC
function add_dlc_checkboxes() {
	var session = decodeURIComponent(cookie.match(/sessionid=(.+?);/i)[1]);
	if ($("#game_area_dlc_expanded").length > 0) {
		$("#game_area_dlc_expanded").after("<div class='game_purchase_action game_purchase_action_bg' style='float: left; margin-top: 4px; margin-bottom: 10px; display: none;' id='es_selected_btn'><div class='btn_addtocart'><a class='btnv6_green_white_innerfade btn_medium' href='javascript:document.forms[\"add_selected_dlc_to_cart\"].submit();'><span>" + localized_strings[language].add_selected_dlc_to_cart + "</span></a></div></div>");
		$(".game_area_dlc_section").after("<div style='clear: both;'></div>");
	} else {
		$(".gameDlcBlocks").after("<div class='game_purchase_action game_purchase_action_bg' style='float: left; margin-top: 4px; display: none;' id='es_selected_btn'><div class='btn_addtocart'><a class='btnv6_green_white_innerfade btn_medium' href='javascript:document.forms[\"add_selected_dlc_to_cart\"].submit();'><span>" + localized_strings[language].add_selected_dlc_to_cart + "</span></a></div></div>");
	}
	$("#es_selected_btn").before("<form name=\"add_selected_dlc_to_cart\" action=\"http://store.steampowered.com/cart/\" method=\"POST\" id=\"es_selected_cart\">");
	$(".game_area_dlc_row").each(function() {
		$(this).find(".game_area_dlc_name").prepend("<input type='checkbox' class='es_dlc_selection' style='cursor: default;' id='es_select_dlc_" + $(this).find("input").val() + "' value='" + $(this).find("input").val() + "'><label for='es_select_dlc_" + $(this).find("input").val() + "' style='background-image: url( " + chrome.extension.getURL("img/check_sheet.png") + ");'></label>");
	});
	function add_dlc_to_list() {
		$("#es_selected_cart").html("<input type=\"hidden\" name=\"action\" value=\"add_to_cart\"><input type=\"hidden\" name=\"sessionid\" value=\"" + session + "\">");
		$(".es_dlc_selection:checked").each(function() {
			var input = $("<input>", {type: "hidden", name: "subid[]", value: $(this).val() });
			$("#es_selected_cart").append(input);
		});
		if ($(".es_dlc_selection:checked").length > 0) {
			$("#es_selected_btn").show();
		} else {
			$("#es_selected_btn").hide();
		}
	}

	$(".game_area_dlc_section").find(".gradientbg").after("<div style='height: 28px; padding-left: 15px; display: none;' id='es_dlc_option_panel'></div>");

	$("#es_dlc_option_panel").append("<div class='es_dlc_option' id='unowned_dlc_check'>" + localized_strings[language].select.unowned_dlc + "</div>");
	$("#unowned_dlc_check").on("click", function() {		
		$(".game_area_dlc_section").find(".game_area_dlc_row").each(function() {
			if (!($(this).hasClass("es_highlight_owned"))) {
				$(this).find("input").prop("checked", true).change();				
			}
		});
	});

	$("#es_dlc_option_panel").append("<div class='es_dlc_option' id='wl_dlc_check'>" + localized_strings[language].select.wishlisted_dlc + "</div>");
	$("#wl_dlc_check").on("click", function() {		
		$(".game_area_dlc_section").find(".game_area_dlc_row").each(function() {
			if ($(this).hasClass("es_highlight_wishlist")) {
				$(this).find("input").prop("checked", true).change();
			}	
		});
	});

	$("#es_dlc_option_panel").append("<div class='es_dlc_option' id='no_dlc_check'>" + localized_strings[language].select.none + "</div>");
	$("#no_dlc_check").on("click", function() {		
		$(".game_area_dlc_section").find(".game_area_dlc_row").each(function() {
			$(this).find("input").prop("checked", false).change();
		});
	});

	$(".game_area_dlc_section").find(".gradientbg").append("<div id='es_dlc_option_button'>" + localized_strings[language].thewordoptions + " ▾</div>");
	
	$("#es_dlc_option_button").on("click", function() {
		$("#es_dlc_option_panel").toggle();
		if ($("#es_dlc_option_button").text().match("▾")) {
			$("#es_dlc_option_button").text(localized_strings[language].thewordoptions + " ▴");
		} else {
			$("#es_dlc_option_button").text(localized_strings[language].thewordoptions + " ▾");
		}
	});

	$(document).on( "change", ".es_dlc_selection", add_dlc_to_list );
}

function fix_achievement_icon_size() {
	if ($(".rightblock").find("img[src$='ico_achievements.png']").length > 0) {
		$(".rightblock").find("img[src$='ico_achievements.png']").attr("height", "24");
		$(".rightblock").find("img[src$='ico_achievements.png']").css("margin-top", "-5px");
	}
}

function add_astats_link(appid) {
	storage.get(function(settings) {
		if (settings.showastatslink === undefined) { settings.showastatslink = true; storage.set({'showastatslink': settings.showastatslink}); }
		if (settings.showastatslink) {
			$(".communitylink_achievement_inner a:last").after("<a class='linkbar' href='http://astats.astats.nl/astats/Steam_Game_Info.php?AppID=" + appid + "' target='_blank'><div class='rightblock'><img src='" + chrome.extension.getURL("img/ico/astatsnl.png") + "' style='margin-right: 11px;'></div>" + localized_strings[language].view_astats + "</a>")
		}
	});
}

function add_achievement_completion_bar(appid) {
	$(".myactivity_block").find(".details_block").after("<div id='es_ach_stats' style='margin-bottom: 9px; margin-top: -10px;'></div>");
	$("#es_ach_stats").load("http://steamcommunity.com/my/stats/" + appid + "/ #topSummaryAchievements", function(response, status, xhr) {				
		if (response.match(/achieveBarFull\.gif/)) {
			var BarFull = $("#es_ach_stats").html().match(/achieveBarFull\.gif" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])"/)[1];
			var BarEmpty = $("#es_ach_stats").html().match(/achieveBarEmpty\.gif" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])"/)[1];
			BarFull = BarFull * .88;
			BarEmpty = BarEmpty * .88;
			var html = $("#es_ach_stats").html();
			html = html.replace(/achieveBarFull\.gif" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])"/, "achieveBarFull.gif\" width=\"" + escapeHTML(BarFull.toString()) + "\"");
			html = html.replace(/achieveBarEmpty\.gif" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])"/, "achieveBarEmpty.gif\" width=\"" + escapeHTML(BarEmpty.toString()) + "\"");
			html = html.replace("::", ":");
			$("#es_ach_stats").html(html);
		}
	});
}

var ea_appids, ea_promise = (function () {
	var deferred = new $.Deferred();
	if (window.location.protocol != "https:") {		
		// is the data cached?
		var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
		var last_updated = getValue("ea_appids_time") || expire_time - 1;
		
		if (last_updated < expire_time) {
			// if no cache exists, pull the data from the website
			get_http("//api.enhancedsteam.com/early_access/", function(txt) {
				ea_appids = txt;
				setValue("ea_appids", ea_appids);
				setValue("ea_appids_time", parseInt(Date.now() / 1000, 10));
				deferred.resolve();	
			});
		} else {
			ea_appids = getValue("ea_appids");
			deferred.resolve();
		}
		
		return deferred.promise();
	} else {
		deferred.resolve();
		return deferred.promise();
	}
})();

// Check for Early Access titles
function check_early_access(node, image_name, image_left, selector_modifier, action) {
	var href = ($(node).find("a").attr("href") || $(node).attr("href"));
	var appid = get_appid(href);
	if (appid === null) { 
		if ($(node).find("img").attr("src").match(/\/apps\/(\d+)\//)) {
			appid = $(node).find("img").attr("src").match(/\/apps\/(\d+)\//)[1];
		}
	}
	var early_access = JSON.parse(ea_appids);
	if (early_access["ea"].indexOf(appid) >= 0) {
		switch (action) {
			case "hide":
				$(node).css("visibility", "hidden");
				break;
			default:
				var selector = "img";
				if (selector_modifier != undefined) selector += selector_modifier;
				overlay_img = $("<img class='es_overlay' src='" + chrome.extension.getURL("img/overlay/" + image_name) + "'>");
				$(overlay_img).css({"left":image_left+"px"});
				$(node).find(selector.trim()).before(overlay_img);
				break;
		}
	}
}

// Add a blue banner to Early Access games
function process_early_access() {
	storage.get(function(settings) {
		if (settings.show_early_access === undefined) { settings.show_early_access = true; storage.set({'show_early_access': settings.show_early_access}); }
		if (settings.hide_early_access === undefined) { settings.hide_early_access = false; chrome.storage.sync.set({'hide_early_access': settings.hide_early_access}); }
		if (settings.show_early_access || settings.hide_early_access) {
			ea_promise.done(function(){
				if (settings.hide_early_access) {
					switch (window.location.host) {
						case "store.steampowered.com":
							switch (true) {
								case /^\/(?:genre|browse)\/.*/.test(window.location.pathname):
									$(".tab_row").each(function(index, value) { check_early_access(this, "", 0, "", "hide") });
									$(".special_tiny_cap").each(function(index, value) { check_early_access(this, "", 0, "", "hide") });
									$(".cluster_capsule").each(function(index, value) { check_early_access(this, "", 0, "", "hide") });
									$(".game_capsule").each(function(index, value) { check_early_access(this, "", 0, "", "hide") });
									break;
								case /^\/search\/.*/.test(window.location.pathname):
									$(".search_result_row").each(function(index, value) { check_early_access(this, "", 0, "", "hide") });
									break;
								case /^\/tag\/.*/.test(window.location.pathname):
									$(".cluster_capsule").each(function(index, value) { check_early_access(this, "", 0, "", "hide"); });
									$(".tab_row").each(function(index, value) { check_early_access(this, "", 0, "", "hide"); });
									$(".browse_tag_game_cap").each(function(index, value) { check_early_access(this, "", 0, "", "hide"); });
									break;
								case /^\/$/.test(window.location.pathname):
									$(".tab_row").each(function(index, value) { check_early_access(this, "", 0, "", "hide") });
									$(".small_cap").each(function(index, value) { check_early_access(this, "", 0, "", "hide") });
									$(".cap").each(function(index, value) { check_early_access(this, "", 0, "", "hide") });
									$(".special_tiny_cap").each(function(index, value) { check_early_access(this, "", 0, "", "hide") });
									$(".game_capsule").each(function(index, value) { check_early_access(this, "", 0, "", "hide") });
									$(".cluster_capsule").each(function(index, value) { check_early_access(this, "", 0, "", "hide") });
									break;
							}
					}
					$(".store_nav .popup_menu_item").each(function(index, value) {
						if(value.innerHTML.trim() == 'Early Access') {
							$(this).hide();
						}
					});
				} else {
					if (settings.show_early_access) {
						switch (window.location.host) {
							case "store.steampowered.com":
								switch (true) {
									case /^\/app\/.*/.test(window.location.pathname):									
										$(".game_header_image").append("<a href='" + window.location.href + "'></a>");
										$(".game_header_image_ctn").each(function(index, value) { check_early_access($(this), "ea_292x136.png", $(this).position().left); });
										$(".small_cap").each(function(index, value) { check_early_access($(this), "ea_184x69.png", 15); });
										break;
									case /^\/(?:genre|browse)\/.*/.test(window.location.pathname):
										$(".tab_row").each(function(index, value) { check_early_access($(this), "ea_184x69.png", 0); });
										$(".special_tiny_cap").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", 0); });
										$(".cluster_capsule").each(function(index, value) { check_early_access($(this), "ea_467x181.png", 0); });
										$(".game_capsule").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", 0); });
										break;
									case /^\/search\/.*/.test(window.location.pathname):
										$(".search_result_row").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", 0, ":eq(1)"); });					
										break;
									case /^\/recommended/.test(window.location.pathname):
										$(".friendplaytime_appheader").each(function(index, value) { check_early_access($(this), "ea_292x136.png", $(this).position().left); });
										$(".header_image").each(function(index, value) { check_early_access($(this), "ea_292x136.png", 0); });
										$(".appheader").each(function(index, value) { check_early_access($(this), "ea_292x136.png", $(this).position().left); });
										$(".recommendation_carousel_item").each(function(index, value) { check_early_access($(this), "ea_184x69.png", $(this).position().left + 8); });
										$(".game_capsule_area").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", $(this).position().left + 8); });
										$(".game_capsule").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", $(this).position().left); });
										$(".similar_grid_capsule").each(function(index, value) { check_early_access($(this), "ea_292x136.png", 0); });
										break;
									case /^\/tag\/.*/.test(window.location.pathname):
										$(".cluster_capsule").each(function(index, value) { check_early_access($(this), "ea_467x181.png", 0); });
										$(".tab_row").each(function(index, value) { check_early_access($(this), "ea_184x69.png", 0); });
										$(".browse_tag_game_cap").each(function(index, value) { check_early_access($(this), "ea_292x136.png", $(this).position().left); });
										break;
									case /^\/$/.test(window.location.pathname):					
										$(".tab_row").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", 0); });
										$(".home_smallcap").each(function(index, value) { check_early_access($(this), "ea_184x69.png", 15); });
										$(".cap").each(function(index, value) { check_early_access($(this), "ea_292x136.png", 0); });
										$(".special_tiny_cap").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", 0); });
										$(".game_capsule").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", 0); });
										$(".cluster_capsule").each(function(index, value) { check_early_access($(this), "ea_467x181.png", 0); });
										$(".recommended_spotlight_cap").each(function(index, value) { check_early_access($(this), "ea_292x136.png", 0); });
										$(".curated_app_link").each(function(index, value) { check_early_access($(this), "ea_292x136.png", 0); });
										$(".tab_item").each(function(index, value) { check_early_access($(this), "ea_184x69.png", 0, ":last"); });
										$(".dailydeal_cap").find("a").each(function(index, value) { check_early_access($(this), "ea_292x136.png", 0); });
										break;
								}
							case "steamcommunity.com":
								switch(true) {
									case /^\/(?:id|profiles)\/.+\/wishlist/.test(window.location.pathname):
										$(".gameLogo").each(function(index, value) { check_early_access($(this), "ea_184x69.png", 4); });
										break;
									case /^\/(?:id|profiles)\/(.+)\/games/.test(window.location.pathname):
										$(".gameLogo").each(function(index, value) { check_early_access($(this), "ea_184x69.png", 4); });
										break;
									case /^\/(?:id|profiles)\/.+\/\b(home|myactivity|status)\b/.test(window.location.pathname):
										$(".blotter_gamepurchase_content").find("a").each(function(index, value) {
											check_early_access($(this), "ea_231x87.png", $(this).position().left);
										});
										break;
									case /^\/(?:id|profiles)\/.+/.test(window.location.pathname):
										$(".game_info_cap").each(function(index, value) { check_early_access($(this), "ea_184x69.png", 0); });
										$(".showcase_slot").each(function(index, value) { check_early_access($(this), "ea_184x69.png", 0); });
										break;
									case /^\/app\/.*/.test(window.location.pathname):
										if ($(".apphub_EarlyAccess_Title").length > 0) {
											$(".apphub_StoreInfoHeader").css({"position":"relative"})
											$(".apphub_StoreAppLogo:first").after("<img class='es_overlay ea_app_overlay' src='" + chrome.extension.getURL("img/overlay/ea_292x136.png") + "'>");
										}
								}
						}
					}
				}
			});
		}
	});
}

// Display a regional price comparison
function show_regional_pricing() {
	storage.get(function(settings) {
		if (settings.showregionalprice === undefined) { settings.showregionalprice = "mouse"; storage.set({'showregionalprice': settings.showregionalprice}); }
		if (settings.regional_countries === undefined) { settings.regional_countries = ["us","gb","eu1","eu2","ru","br","au","jp"]; storage.set({'regional_countries': settings.regional_countries}); }
		if (settings.regional_hideworld === undefined) { settings.regional_hideworld = false; storage.set({'regional_hideworld':settings.regional_hideworld}); }
		if (settings.regional_countries<1){settings.showregionalprice="off";}
		if (settings.showregionalprice != "off") {
			var api_url = "http://store.steampowered.com/api/packagedetails/";
			var countries = settings.regional_countries;
			var pricing_div = "<div class='es_regional_container'></div>";
			var world = chrome.extension.getURL("img/flags/world.png");
			var currency_deferred = [];
			var local_country;
			var local_currency;
			var dailydeal;
			var sale;
			var sub;
			var region_appended=0;
			var available_currencies = ["USD","GBP","EUR","BRL","RUB","JPY","NOK","IDR","MYR","PHP","SGD","THB","VND","KRW","TRY","UAH","MXN","CAD","AUD","NZD"];
			var conversion_rates = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
			var currency_symbol;

			// Get user's Steam currency
			currency_symbol = currency_symbol_from_string($(".price:first, .discount_final_price:first").text().trim());
			if (currency_symbol == "") { return; }
			local_currency = currency_symbol_to_type(currency_symbol);

			var complete = 0;

			$.each(available_currencies, function(index, currency_type) {
				if (currency_type != local_currency) {
					if (getValue(currency_type + "to" + local_currency)) {
						var expire_time = parseInt(Date.now() / 1000, 10) - 24 * 60 * 60; // One day ago
						var last_updated = getValue(currency_type + "to" + local_currency + "_time") || expire_time - 1;

						if (last_updated < expire_time) {
							get_http("http://api.enhancedsteam.com/currency/?" + local_currency.toLowerCase() + "=1&local=" + currency_type.toLowerCase(), function(txt) {
								complete += 1;
								conversion_rates[available_currencies.indexOf(currency_type)] = parseFloat(txt);
								setValue(currency_type + "to" + local_currency, parseFloat(txt));
								setValue(currency_type + "to" + local_currency + "_time", parseInt(Date.now() / 1000, 10));
								if (complete == available_currencies.length - 1) process_data(conversion_rates);
							});
						} else {
							complete += 1;
							conversion_rates[available_currencies.indexOf(currency_type)] = getValue(currency_type + "to" + local_currency);
							if (complete == available_currencies.length - 1) process_data(conversion_rates);
						}	
					} else {
						get_http("http://api.enhancedsteam.com/currency/?" + local_currency.toLowerCase() + "=1&local=" + currency_type.toLowerCase(), function(txt) {
							complete += 1;
							conversion_rates[available_currencies.indexOf(currency_type)] = parseFloat(txt);
							setValue(currency_type + "to" + local_currency, parseFloat(txt));
							setValue(currency_type + "to" + local_currency + "_time", parseInt(Date.now() / 1000, 10));
							if (complete == available_currencies.length - 1) process_data(conversion_rates);
						});
					}
				}
			});
			
			function process_data(conversion_array) {
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
				if (getCookie("fakeCC") != null || getCookie("LKGBillingCountry") != null) {
					if (getCookie("fakeCC")){
						local_country = getCookie("fakeCC").toLowerCase();
					} else {
						local_country = getCookie("LKGBillingCountry").toLowerCase();
					}
				}
				if(countries.indexOf(local_country)===-1){
					countries.push(local_country);
				}
				var all_game_areas = $(".game_area_purchase_game").toArray();
				if (dailydeal) {
					all_game_areas = $(".dailydeal_content").toArray();
				} else if(sale) {
					all_game_areas = $(".sale_page_purchase_item").toArray();
				}
				var subid_info = [];
				var subid_array = [];
				var subids_csv;

				function formatPriceData(sub_info,country,converted_price) {
					var flag_div = "<div class=\"es_flag\" style='background-image:url("+chrome.extension.getURL("img/flags/flags.png")+")'></div>";
					if (sub_info["prices"][country]){
						var price = sub_info["prices"][country]["final"]/100;
						var local_price = sub_info["prices"][local_country]["final"]/100;
						converted_price = converted_price/100;
						converted_price = converted_price.toFixed(2);
						var currency = sub_info["prices"][country]["currency"];
						var percentage;
						var formatted_price = formatCurrency(price, currency);
						var formatted_converted_price = formatCurrency(converted_price, local_currency);
						
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
					var subid = $(app_package).find("input[name='subid']").val();
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
								$(app_pricing_div).attr("id", "es_pricing_" + subid_info[index]["subid"].toString());
								$.each(countries,function(country_index,country){
									var regional_price_array=[];
									if(country!==local_country){
										if(subid["prices"][country]){
											var country_currency = subid["prices"][country]["currency"].toString().toUpperCase();
											var app_price = subid["prices"][country]["final"];
											var index = $.inArray(country_currency, available_currencies);
											var converted_price = parseFloat(app_price) / conversion_array[index];																					
											var regional_price = formatPriceData(subid,country,converted_price);
											regional_price_array[0]=country;
											regional_price_array[1]=regional_price;
											sub_formatted.push(regional_price_array);											
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
										switch(settings.showregionalprice){
											case "always":
												$(".sale_page_purchase_item").eq(index).css({"height":"auto", "min-height":"136px"}).prepend(app_pricing_div);
												break;
											default:
												$(".sale_page_purchase_item").eq(index).find(".game_purchase_action_bg").before(app_pricing_div);
												break;
										}
									} else {
										switch(settings.showregionalprice){
											case "always":
												$(".game_area_purchase_game").eq(index).find(".game_purchase_action").before(app_pricing_div);
												break;
											default:
												$(".game_area_purchase_game").eq(index).append(app_pricing_div);
												$(app_pricing_div).css("top", $(".game_area_purchase_game").eq(index).outerHeight(true));
												$(".game_area_purchase_game").css("z-index", "auto");
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
								var subid = $(app_package).find("input[name='subid']").val();
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
												$("#es_pricing_" + subid).css("right", $(app_package).find(".game_purchase_action").width() + 45 + "px");
											} else {
												$("#es_pricing_" + subid).css("right", $(app_package).find(".game_purchase_action").width() + 20 + "px");
											}
											$("#es_pricing_" + subid).show();
										})
										.mouseout(function() {
											$("#es_pricing_" + subid).hide();
										})
										.css("cursor","help");
									} else {
										$("#es_pricing_" + subid).addClass("es_regional_always");
										if (!sale){
											$("#es_pricing_"+subid).after("<div style='clear:both'></div>");
										}
									}
								}
							});
						});
					});
				}
			}
		}
	});
}

// Hide Trademark and Copyright symbols in game titles for Community pages
function hide_trademark_symbols(community) {
	storage.get(function(settings) {
		if (settings.hidetmsymbols === undefined) { settings.hidetmsymbols = false; storage.set({'hidetmsymbols': settings.hidetmsymbols}); }
		if (settings.hidetmsymbols) {
			var selectors=["title",".apphub_AppName",".breadcrumbs","h1","h4"];
			if(community){
				selectors.push(".game_suggestion",".appHubShortcut_Title",".apphub_CardContentNewsTitle",".apphub_CardTextContent",".apphub_CardContentAppName",".apphub_AppName");
			} else {
				selectors.push(".game_area_already_owned",".details_block",".game_description_snippet",".game_area_description",".glance_details",".game_area_dlc_bubble game_area_bubble",".package_contents",".game_area_dlc_name",".tab_desc");
			}
			function replace_symbols(input){
				return input.replace(/[\u00AE\u00A9\u2122]/g,"");
			}
			$.each(selectors, function(index, selector){
				$(selector).each(function(){
					$(this).html(replace_symbols($(this).html()));
				});
			});
			var observer = new WebKitMutationObserver(function(mutations) {
					$.each(mutations,function(mutation_index, mutation){
						if(mutations[mutation_index]["addedNodes"]){
							$.each(mutations[mutation_index]["addedNodes"], function(node_index, node){
								if(node["nodeName"]=="DIV"||node["nodeName"]=="SPAN"||node["nodeName"]=="A"){
									$(node).html(replace_symbols($(node).html()));
								}
							});
						}
					})
			});
			if(community){
				observer.observe($("#game_select_suggestions")[0], {childList:true, subtree:true});
			}
			else{
				observer.observe($("#search_suggestion_contents")[0], {childList:true, subtree:true});
				if($(".tab_content_ctn").length>0){
					observer.observe($(".tab_content_ctn")[0], {childList:true, subtree:true});
				}
			}
		}
	});
}

// Display purchase date for owned games
function display_purchase_date() {
    if ($(".game_area_already_owned").length > 0) {
        var appname = $(".apphub_AppName").text();

        get_http('https://store.steampowered.com/account/', function (txt) {
    		var earliestPurchase = $(txt).find("#store_transactions .block:nth-of-type(1) .transactionRowTitle:contains(" + appname + ")").closest(".transactionRow").last(),
    			purchaseDate = $(earliestPurchase).find(".transactionRowDate").text();

    		var found = 0;
    		jQuery("div.game_area_already_owned").each(function (index, node) {
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
	// Check content loaded via AJAX
	var observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			for (var i = 0; i < mutation.addedNodes.length; i++) {
				var node = mutation.addedNodes[i];
				// Check the node is what we want and not some unrelated DOM change
				//if (node.id == "search_result_container") add_cart_to_search();
				if (node.classList && node.classList.contains("inventory_page")) {
					add_inventory_gotopage();
				}

				if (node.classList && node.classList.contains("tab_row")) {
					start_highlighting_node(node);
					check_early_access(node, "ea_sm_120.png", 0);
				}

				if (node.id == "search_result_container") {
					endless_scrolling();
					start_highlights_and_tags();
					remove_non_specials();
					process_early_access();
					search_in_names_only(true);
				}

				if ($(node).children('div')[0] && $(node).children('div')[0].classList.contains("blotter_day")) {
					start_friend_activity_highlights();
					process_early_access();
				}

				if (node.classList && node.classList.contains("browse_tag_games")) {
					start_highlights_and_tags();
					process_early_access();
				}

				if (node.classList && node.classList.contains("match")) start_highlighting_node(node);
				if (node.classList && node.classList.contains("search_result_row")) start_highlighting_node(node);
				if (node.classList && node.classList.contains("market_listing_row_link")) highlight_market_items();				
				if ($(node).parent()[0] && $(node).parent()[0].classList.contains("search_result_row")) start_highlighting_node($(node).parent()[0]);
			}
		});
	});
	observer.observe(document, { subtree: true, childList: true });
}

var owned_promise = (function () {
	var deferred = new $.Deferred();
	if (is_signed_in() && window.location.protocol != "https:") {
		var steamID = is_signed_in()[0];

		var expire_time = parseInt(Date.now() / 1000, 10) - 7 * 60 * 60 * 24; // One week ago
		var last_updated = getValue("owned_games_time") || expire_time - 1;

		if (last_updated < expire_time) {
			$.ajax({
				url:"http://api.enhancedsteam.com/steamapi/GetOwnedGames/?steamid=" + steamID + "&include_appinfo=0",
				success: function(txt) {
					var data = JSON.parse(txt);
					if (data["requests"]) {
						$.each(data['response']['games'], function(index, value) {
							setValue(value['appid'] + "owned", true);
						});						
					}
					setValue("owned_games_time", parseInt(Date.now() / 1000, 10));
					deferred.resolve();
				},
				error: function(e){
					deferred.resolve();
				}
			});
		} else {
			deferred.resolve();
		}
	} else {
		deferred.resolve();
	}
	
	return deferred.promise();
})();

var wishlist_promise = (function () {
	var deferred = new $.Deferred();
	if (is_signed_in() && window.location.protocol != "https:") {
		var steamID = is_signed_in()[0];
		var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60 ; // One hour ago
		var last_updated = getValue("wishlist_games_time") || expire_time - 1;

		if (last_updated < expire_time) {
			// purge stale information from localStorage
			var i = 0, sKey;
			for (; sKey = window.localStorage.key(i); i++) {
				if (sKey.match(/wishlisted/)) {
					var appid = sKey.match(/\d+/)[0];
					delValue(appid + "wishlisted");
				}
			}

			$.ajax({
				url:"http://steamcommunity.com/profiles/" + steamID + "/wishlist",
				success: function(txt) {
					var html = $.parseHTML(txt);
					$(html).find(".wishlistRow").each(function() {
						var appid = $(this).attr("id").replace("game_", "");
						setValue(appid + "wishlisted", true);
						setValue(appid, parseInt(Date.now() / 1000, 10));
					});
					setValue("wishlist_games_time", parseInt(Date.now() / 1000, 10));
					deferred.resolve();
				},
				error: function(e){
					deferred.resolve();
				}
			});
		} else {
			deferred.resolve();
		}
	} else {
		deferred.resolve();
	}
	
	return deferred.promise();
})();

function start_highlights_and_tags(){
	// Batch all the document.ready appid lookups into one storefront call.
	$.when.apply($, [owned_promise, wishlist_promise]).done(function() {	
		var selectors = [
			"div.tab_row",				// Storefront rows
			"div.dailydeal",			// Christmas deals; http://youtu.be/2gGopKNPqVk?t=52s
			"div.wishlistRow",			// Wishlist rows
			"a.game_area_dlc_row",			// DLC on app pages
			"a.small_cap",				// Featured storefront items and "recommended" section on app pages
			"a.search_result_row",			// Search result rows
			"a.match",				// Search suggestions rows
			"a.cluster_capsule",			// Carousel items
			"div.recommendation_highlight",		// Recommendation pages
			"div.recommendation_carousel_item",	// Recommendation pages
			"div.friendplaytime_game",		// Recommendation pages
			"div.dlc_page_purchase_dlc",		// DLC page rows
			"div.sale_page_purchase_item",		// Sale pages
			"div.item",				// Sale pages / featured pages
			"div.home_area_spotlight",		// Midweek and weekend deals
			"div.browse_tag_game",			// Tagged games
			"div.similar_grid_item"			// Items on the "Similarly tagged" pages
		];

		var appids = [];

		// Get all appids and nodes from selectors
		$.each(selectors, function (i, selector) {
			$.each($(selector), function(j, node){
				var appid = get_appid(node.href || $(node).find("a")[0].href) || get_appid_wishlist(node.id);
				if (appid) {
					if ($(node).hasClass("item")) { node = $(node).find(".info")[0]; }
					if ($(node).hasClass("home_area_spotlight")) { node = $(node).find(".spotlight_content")[0]; }

					var pushvar = [appid, node];
					appids.push(pushvar);
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

		on_apps_info(appids);
	});
}

function start_friend_activity_highlights() {
	$.when.apply($, [owned_promise, wishlist_promise]).done(function() {
		var selectors = [
			".blotter_author_block a",
			".blotter_gamepurchase_details a",
			".blotter_daily_rollup_line a"
		];

		var appids = [];

		// Get all appids and nodes from selectors
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

					var pushvar = [appid, node];
					appids.push(pushvar);
				} else {
					var subid = get_subid(node.href || $(node).find("a")[0].href);
					if (subid) {
						get_sub_details (subid, node);
					}
				}	
			});
		});

		on_apps_info(appids);
	});
}

// Accepts a multidimensional array with [appid, node] values
function on_apps_info(appids) {
	var appids_to_process = [];

	$.each(appids, function(index, value) {
		var appid = value[0];
		ensure_appid_deferred(appid);

		if (getValue(appid + "owned") != true) {
			var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
			var last_updated = getValue(appid) || expire_time - 1;

			// If we have no data on appid, or the data has expired; add it to appids to fetch new data.
			if (last_updated < expire_time) {
				appids_to_process.push(appid);
			}
			else {
				appid_promises[appid].resolve();
			}
		} else {
			appid_promises[appid].resolve();
		}

		appid_promises[appid].promise.done(highlight_app(appid, value[1]));
	});

	if (appids_to_process.length) {
		get_http('//store.steampowered.com/api/appuserdetails/?appids=' + appids_to_process.join(), function (data) {
			var storefront_data = JSON.parse(data);
			$.each(storefront_data, function(appid, app_data){
				if (app_data.success) {
					setValue(appid + "owned", (app_data.data.is_owned === true));

					if (app_data.data.is_owned != true) {
						// Update time for caching
						setValue(appid, parseInt(Date.now() / 1000, 10));
					}
				}

				// Resolve promise to run any functions waiting for this apps info
				appid_promises[appid].resolve();

				// find the appropriate node to highlight
				for (var i = 0; i < appids.length; i++) {
					if (appids[i][0] === appid) {
						highlight_app(appid, appids[i][1]);
					}
				}
			});
		});
	}
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

// Add a link to an item's page on steamdb.info
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

function add_familysharing_warning(appid) {
	get_http('http://api.enhancedsteam.com/exfgls/?appid=' + appid, function (txt) {
		var data = JSON.parse(txt);
		if (data["exfgls"]["excluded"]) {
			$("#game_area_purchase").before('<div id="purchase_note"><div class="notice_box_top"></div><div class="notice_box_content">' + localized_strings[language].family_sharing_notice + '</div><div class="notice_box_bottom"></div></div>');
		}
	});
}

function get_app_details(appids) {
	if (is_signed_in()) {
		// Make sure we have inventory loaded beforehand so we have gift/guestpass/coupon info
		if (!loading_inventory) loading_inventory = load_inventory();
		loading_inventory.done(function() {
			if (!(appids instanceof Array)) appids = [appids];			
			get_http('//store.steampowered.com/api/appuserdetails/?appids=' + appids.join(), function (data) {
				var storefront_data = JSON.parse(data);
				$.each(storefront_data, function(appid, app_data){
					if (app_data.success) {
						setValue(appid + "owned", (app_data.data.is_owned === true));

						if (app_data.data.is_owned != true) {
							// Update time for caching
							setValue(appid, parseInt(Date.now() / 1000, 10));
						}
					}

					// Resolve promise to run any functions waiting for this apps info
					appid_promises[appid].resolve();
				});
			});	
		});
	}
}

function get_sub_details(subid, node) {
	if (is_signed_in()) {
		if (getValue(subid + "owned")) { highlight_owned(node); return; }

		var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
		var last_updated = getValue(subid) || expire_time - 1;

		if (last_updated < expire_time) {
			var app_ids = [];
			var owned = [];

			get_http('//store.steampowered.com/api/packagedetails/?packageids=' + subid, function (data) {
				var pack_data = JSON.parse(data);
				$.each(pack_data, function(subid, sub_data) {
					if (sub_data.success) {
						if (sub_data.data.apps) {
							sub_data.data.apps.forEach(function(app) {
								app_ids.push (app.id.toString());
							});
						}
					}
				});

				get_http('//store.steampowered.com/api/appuserdetails/?appids=' + app_ids.toString(), function (data2) {
					var storefront_data = JSON.parse(data2);
					$.each(storefront_data, function(appid, app_data) {
						if (app_data.success) {
							if (app_data.data.is_owned === true) {
								setValue(appid + "owned", true);
								owned.push(appid);
							} else {
								setValue(appid + "owned", false);
								setValue(appid, parseInt(Date.now() / 1000, 10));
							}
						}
					});
					if (owned.length == app_ids.length) {
						setValue(subid + "owned", true);
						highlight_app(subid, node);
					} else {
						setValue(subid + "owned", false);
						setValue(subid, parseInt(Date.now() / 1000, 10));
					}
				});
			});
		}
	}
}

function highlight_app(appid, node) {
	storage.get(function(settings) {
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

		if (getValue(appid + "guestpass")) highlight_inv_guestpass(node);
		if (getValue(appid + "coupon")) highlight_coupon(node, getValue(appid + "coupon_discount"));
		if (getValue(appid + "gift")) highlight_inv_gift(node);
		if (!(node.classList.contains("wishlistRow") || node.classList.contains("wishlistRowItem"))) {
			if (getValue(appid + "wishlisted")) highlight_wishlist(node);
		}
		if (getValue(appid + "owned")) highlight_owned(node);
	});
}

function fix_community_hub_links() {
	element = document.querySelector( '.apphub_OtherSiteInfo a' );

	if( element && element.href.charAt( 26 ) === '/' ) {
		element.href = element.href.replace( /\/\/app\//, '/app/' ) + '/';
	}
}

// Display app descriptions on storefront carousel
function add_carousel_descriptions() {
	storage.get(function(settings) {
		if (settings.show_carousel_descriptions === undefined) { settings.show_carousel_descriptions = true; storage.set({'show_carousel_descriptions': settings.show_carousel_descriptions}); }
		if (settings.show_carousel_descriptions) {
			if ($(".main_cluster_content").length > 0) {
				var description_height_to_add = 56;
				$(".main_cluster_content").css("height", parseInt($(".main_cluster_content").css("height").replace("px", ""), 10) + description_height_to_add + "px");
				
				$.each($(".cluster_capsule"), function(i, _obj) {
					var appid = get_appid(_obj.href),
						$desc = $(_obj).find(".main_cap_content"),
						$desc_content = $("<p></p>");
					
					$desc.css("height", parseInt($desc.css("height").replace("px", ""), 10) + description_height_to_add + "px");
					$desc.parent().css("height", parseInt($desc.parent().css("height").replace("px", ""), 10) + description_height_to_add + "px");

					var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
					var last_updated = getValue(appid + "carousel_time") || expire_time - 1;

					if (last_updated < expire_time) {
						get_http('http://store.steampowered.com/app/' + appid, function(txt) {
							var desc = txt.match(/textarea name="w_text" placeholder="(.+)" maxlength/);
							if (desc) {
								setValue(appid + "carousel", desc[1]);
								setValue(appid + "carousel_time", parseInt(Date.now() / 1000, 10));
								$desc.append(desc[1]);
							}
						});
					}
					else {
						var desc = getValue(appid + "carousel");
						var value_to_add = "<div class='main_cap_status' style='font-size: 12px; line-height: normal;'>" + desc + "</div>";
						$desc.append(value_to_add);
					}
				});

				// purge stale information from localStorage				
				var i = 0, sKey;
				for (; sKey = window.localStorage.key(i); i++) {
					if (sKey.match(/carousel_time/)) {
						var expire_time = parseInt(Date.now() / 1000, 10) - 8 * 60 * 60; // Eight hours ago
						var last_updated = window.localStorage.getItem(sKey) || expire_time - 1;

						if (last_updated < expire_time) {
							var appid = sKey.match(/\d+/)[0];
							delValue(appid + "carousel");
							delValue(appid + "carousel_time");
						}
					}
				}
			}
		}
	});
}

function add_small_cap_height() {
	storage.get(function(settings) {			
		if (settings.tag_owned || settings.tag_wishlist || settings.tag_coupon || settings.tag_inv_gift || settings.tag_inv_guestpass || settings.tag_friends_want || settings.tag_friends_own || settings.tag_friends_rec) {	
			// Add height for another line for tags
			var height_to_add = 20,
				$small_cap_pager = $(".small_cap_pager"),
				$small_cap = $(".small_cap");

			if ($small_cap.length > 0) {
				if (/^\/$/.test(window.location.pathname)) {
					// $small_cap_pager and $small_cap_page are exclusive to frontpage, so let's not run them anywhere else.
					$.each($small_cap_pager, function(i, obj) {
						// Go though and check if they are one or two row pagers
						var $obj = $(obj),
							$small_cap_page = $obj.find(".small_cap_page");

						// Don't do anything to the video small_cap
						if (!obj.classList.contains("onerowvideo")) {
							$obj.css("height", parseInt($obj.css("height").replace("px", ""), 10) + (height_to_add) + "px");
							$small_cap_page.css("height", parseInt($small_cap_page.css("height").replace("px", ""), 10) + (height_to_add) + "px");
						}
					});
				}
				$small_cap.css("height", parseInt($small_cap.css("height").replace("px", ""), 10) + height_to_add + "px");
			}
		}
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

function rewrite_string(string, websafe) {
	if (websafe) {
		string = encodeURIComponent(string);
	} else {		
		string = decodeURI(string);
	}
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

// Show videos using HTML5 instead of Flash
function set_html5_video() {
	storage.get(function(settings) {
		if (settings.html5video === undefined) { settings.html5video = true; storage.set({'html5video': settings.html5video}); }
		if (settings.html5video) {
			var dateExpires = new Date();
			dateExpires.setTime( dateExpires.getTime() + 1000 * 60 * 60 * 24 * 365 * 10 );
			document.cookie = 'bShouldUseHTML5=1; expires=' + dateExpires.toGMTString() + ';path=/';
		} else {
			document.cookie = 'bShouldUseHTML5=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;';
		}
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

	if (getValue(appid + "owned") != true) {
		var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
		var last_updated = getValue(appid) || expire_time - 1;

		// If we have no data on appid, or the data has expired; add it to appids to fetch new data.
		if (last_updated < expire_time) {
			get_app_details(appid);
		}
		else {
			appid_promises[appid].resolve();
		}
	} else {
		appid_promises[appid].resolve();
	}

	// Bind highlighting
	appid_promises[appid].promise.done(cb);
}

function clear_cache() {
	localStorage.clear();
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
				var selected = false;
				steam64 = steam64.match(/g_steamID = \"(.+)\";/)[1];
				var html = "<form id='es_profile_bg' method='POST' action='http://www.enhancedsteam.com/gamedata/profile_bg_save.php'><div class='group_content group_summary'>";
				html += "<input type='hidden' name='steam64' value='" + steam64 + "'>";
				html += "<input type='hidden' name='appid' id='appid'>";
				html += "<div class='formRow'><div class='formRowFields'><div class='profile_background_current'><div class='profile_background_current_img_ctn'><div class='es_loading'><img src='http://cdn.steamcommunity.com/public/images/login/throbber.gif'><span>"+ localized_strings[language].loading +"</div>";
				html += "<img id='es_profile_background_current_image' src=''>";
				html += "</div><div class='profile_background_current_description'><div id='es_profile_background_current_name'>";
				html += "</div></div><div style='clear: left;'></div><div class='background_selector_launch_area'></div></div><div class='background_selector_launch_area'>&nbsp;<div style='float: right;'><span id='es_background_save_btn' class='btn_grey_white_innerfade btn_small btn_disabled'><span>" + localized_strings[language].save + "</span></span></div></div><div class='formRowTitle'>" + localized_strings[language].custom_background + ":<span class='formRowHint' title='" + localized_strings[language].custom_background_help + "'>(?)</span></div></div></div>";
				html += "</form>";
				$(".group_content_bodytext").before(html);

				get_http("http://api.enhancedsteam.com/profile-select-v2/?steam64=" + steam64, function (txt) {
					var data = JSON.parse(txt);
					var select_html = "<select name='es_background_gamename' id='es_background_gamename' class='gray_bevel dynInput'><option value='0' id='0'>None Selected / No Change</option>";
					
					$.each(data["games"], function(index, value) {
						if (value["selected"]) {
							select_html += "<option id='" + escapeHTML(value["appid"].toString()) + "' value='" + escapeHTML(value["appid"].toString()) + "' selected>" + escapeHTML(index.toString()) + "</option>";
							selected = true;
						} else {
							select_html += "<option id='" + escapeHTML(value["appid"].toString()) + "' value='" + escapeHTML(value["appid"].toString()) + "'>" + escapeHTML(index.toString()) + "</option>";
						}
					});
					select_html += "</select>";
					$(".es_loading").remove();
					$("#es_profile_background_current_name").html(select_html);

					get_http("http://api.enhancedsteam.com/profile-small/?steam64=" + steam64, function (txt) {
						$("#es_profile_background_current_image").attr("src", escapeHTML(txt));
					});

					$("#es_background_gamename").change(function() {						
						var appid = $("#es_background_gamename option:selected").attr("id");
						$("#appid").attr("value", appid);
						$("#es_background_selection").remove();
						if (appid == 0) {
							$("#es_profile_background_current_image").attr("src", "");
						} else {
							$("#es_profile_background_current_name").after("<div class='es_loading'><img src='http://cdn.steamcommunity.com/public/images/login/throbber.gif'><span>"+ localized_strings[language].loading +"</div>");							

							get_http("http://api.enhancedsteam.com/profile-select-v2-game/?appid=" + appid + "&steam64=" + steam64, function (txt) {
								var bg_data = JSON.parse(txt);
								$("#es_profile_background_current_name").after("<div id='es_background_selection'></div>");
								select_html = "<select name='es_background' id='es_background' class='gray_bevel dynInput'>";
								var i = 0;
								if (selected) { i = 1; selected = false; }
								$.each(bg_data["backgrounds"], function(index, value) {
									if (value["selected"]) {
										select_html += "<option id='" + escapeHTML(value["id"].toString()) + "' value='" + escapeHTML(value["index"].toString()) + "' selected>" + escapeHTML(value["text"].toString()) + "</option>";
									} else {
										if (i == 0) { $("#es_profile_background_current_image").attr("src", value["id"]); i = 1; }
										select_html += "<option id='" + escapeHTML(value["id"].toString()) + "' value='" + escapeHTML(value["index"].toString()) + "'>" + escapeHTML(value["text"].toString()) + "</option>";
									}	
								});
								select_html += "</select>";
								$(".es_loading").remove();
								$("#es_background_selection").html(select_html);

								$("#es_background").change(function() {
									var img = $("#es_background option:selected").attr("id");
									$("#es_profile_background_current_image").attr("src", img);
								});
							});

							// Enable the "save" button
							$("#es_background_save_btn").removeClass("btn_disabled");
							$("#es_background_save_btn").click(function(e) {
								$("#es_profile_bg").submit();
							});
						}
					});

					if (selected) { $("#es_background_gamename").change(); }
				});
			}
		}
	});
}

function add_profile_store_links() {
	$(".game_name").find(".whiteLink").each(function() {
		var href = this.href.replace("http://steamcommunity.com", "http://store.steampowered.com");		
		$(this).after("<br><a class='whiteLink' style='font-size: 10px;' href=" + href + ">" + localized_strings[language].visit_store + "</a>");
	});
}

// Display total size of all installed games
function total_size() {
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

// Display total time played for all games
function total_time() {
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
		html += "<label class='es_sort' id='es_gl_all'><input type='radio' name='es_gl_sort' id='es_gl_all_input' checked><span><a>" + localized_strings[language].games_all + "</a></span></label>";
		html += "<label class='es_sort' id='es_gl_installed'><input type='radio' name='es_gl_sort' id='es_gl_installed_input'><span><a>" + localized_strings[language].games_installed + "</a></span></label>";
		html += "</div>";

		$('#gameslist_sort_options').append("<br>" + html);

		$('#es_gl_all').on('click', function() {
			$('.gameListRow').css('display', 'block');
			$("#es_gl_all_input").prop("checked", true);
		});

		$('#es_gl_installed').on('click', function() {
			$('.gameListRowItem').find(".color_uninstalled").parent().parent().css("display", "none");
			$('.gameListRowItem').find(".color_disabled").parent().parent().css("display", "none");
			$("#es_gl_installed_input").prop("checked", true);
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
			$(".badge_row").each(function (index, node) {
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

		var resetLazyLoader = function() { runInPageContext(function() { 
				// Clear registered image lazy loader watchers (CScrollOffsetWatcher is found in shared_global.js)
				CScrollOffsetWatcher.sm_rgWatchers = [];
				
				// Recreate registered image lazy loader watchers
				$J('div[id^=image_group_scroll_badge_images_gamebadge_]').each(function(i,e){
					// LoadImageGroupOnScroll is found in shared_global.js
					LoadImageGroupOnScroll(e.id, e.id.substr(19));
				});
			});
		};
		
		$('#es_badge_all').on('click', function() {
			$('.is_link').css('display', 'block');			
			resetLazyLoader();
		});

		$('#es_badge_drops').on('click', function() {
			$('.is_link').each(function () {
				if (!($(this).html().match(/progress_info_bold".+\d/))) {
					$(this).css('display', 'none');
				} else if (parseFloat($(this).html().match(/progress_info_bold".+?(\d+)/)[1]) == 0) {					
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
			resetLazyLoader();
		});
	}
}

function add_badge_sort() {
	if ($(".profile_badges_sortoptions").find("a[href$='sort=r']").length > 0) {
		$(".profile_badges_sortoptions").find("a[href$='sort=r']").after("&nbsp;&nbsp;<a class='badge_sort_option whiteLink' id='es_badge_sort_drops'>" + localized_strings[language].most_drops + "</a>&nbsp;&nbsp;<a class='badge_sort_option whiteLink' id='es_badge_sort_value'>" + localized_strings[language].drops_value + "</a>");
	}

	var resetLazyLoader = function() { runInPageContext(function() { 
			// Clear registered image lazy loader watchers (CScrollOffsetWatcher is found in shared_global.js)
			CScrollOffsetWatcher.sm_rgWatchers = [];
			
			// Recreate registered image lazy loader watchers
			$J('div[id^=image_group_scroll_badge_images_gamebadge_]').each(function(i,e){
				// LoadImageGroupOnScroll is found in shared_global.js
				LoadImageGroupOnScroll(e.id, e.id.substr(19));
			});
		});
	};

	$("#es_badge_sort_drops").on("click", function() {
		var badgeRows = [];
		$('.badge_row').each(function () {
			var push = new Array();
			if ($(this).html().match(/progress_info_bold".+\d/)) {
				push[0] = this.outerHTML;
				push[1] = $(this).find(".progress_info_bold").html().match(/\d+/)[0];
			} else {
				push[0] = this.outerHTML;
				push[1] = "0";
			}
			badgeRows.push(push);
			this.parentNode.removeChild(this);
		});

		badgeRows.sort(function(a,b) {
			var dropsA = parseInt(a[1],10);
			var dropsB = parseInt(b[1],10);

			if (dropsA < dropsB) {
				return 1;
			} else {
				return -1;
			}	
		});

		$('.badge_row').each(function () { $(this).css("display", "none"); });

		$(badgeRows).each(function() {
			$(".badges_sheet:first").append(this[0]);
		});

		$(".active").removeClass("active");
		$(this).addClass("active");
		resetLazyLoader();
	});

	$("#es_badge_sort_value").on("click", function() {
		var badgeRows = [];
		$('.badge_row').each(function () {
			var push = new Array();
			if ($(this).find(".es_card_drop_worth").length > 0) {
				push[0] = this.outerHTML;
				push[1] = $(this).find(".es_card_drop_worth").html();
			} else {
				push[0] = this.outerHTML;
				push[1] = localized_strings[language].drops_worth_avg;
			}
			badgeRows.push(push);
			$(this).remove();
		});

		badgeRows.sort(function(a, b) {
			var worthA = a[1];
			var worthB = b[1];

			if (worthA < worthB) {
				return 1;
			} else {
				return -1;
			}
		});

		$('.badge_row').each(function () { $(this).css("display", "none"); });

		$(badgeRows).each(function() {
			$(".badges_sheet:first").append(this[0]);
		});

		$(".active").removeClass("active");
		$(this).addClass("active");
		resetLazyLoader();
	});	
}

function add_achievement_sort() {
	if ($("#personalAchieve").length > 0 || $("#achievementsSelector").length > 0) {
		if (language == "eng") {
			$("#tabs").before("<div id='achievement_sort_options' class='sort_options'>" + localized_strings[language].sort_by + "<span id='achievement_sort_default'>" + localized_strings[language].theworddefault + "</span><span id='achievement_sort_date' class='es_achievement_sort_link'>" + localized_strings[language].date_unlocked + "</span></div>");
			$("#personalAchieve, #achievementsSelector").clone().insertAfter("#personalAchieve, #achievementsSelector").attr("id", "personalAchieveSorted").css("padding-left", "16px").hide();	

			var achRows = [];
			$("#personalAchieveSorted").find(".achieveUnlockTime").each(function() {
				var push = new Array();
				push[0] = $(this).parent().parent().prev();
				$(this).parent().parent().next().remove();
				$(this).parent().parent().next().remove();
				$(this).parent().parent().next().remove();
				push[1] = $(this).parent().parent();
				var unlocktime = $(this).text().trim().replace(/^.+\: /, "").replace(/jan/i, "01").replace(/feb/i, "02").replace(/mar/i, "03").replace(/apr/i, "04").replace(/may/i, "05").replace(/jun/i, "06").replace(/jul/i, "07").replace(/aug/i, "08").replace(/sep/i, "09").replace(/oct/i, "10").replace(/nov/i, "11").replace(/dec/i, "12");
				var year = new Date().getFullYear();
				if ($(this).text().replace(/^.+\: /, "").match(/^\d/)) {
					var parts = unlocktime.match(/(\d+) (\d{2})(?:, (\d{4}))? \@ (\d+):(\d{2})(am|pm)/);				
				} else {
					var parts = unlocktime.match(/(\d{2}) (\d+)(?:, (\d{4}))? \@ (\d+):(\d{2})(am|pm)/);
				}

				if (parts[3] === undefined) parts[3] = year;
				if (parts[6] == "pm" && parts[4] != 12) parts[4] = (parseFloat(parts[4]) + 12).toString();
				if (parts[6] == "am" && parts[4] == 12) parts[4] = (parseFloat(parts[4]) - 12).toString();
				
				if ($(this).text().replace(/^.+\: /, "").match(/^\d/)) {
					push[2] = Date.UTC(+parts[3], parts[2]-1, +parts[1], +parts[4], +parts[5]) / 1000;
				} else {	
					push[2] = Date.UTC(+parts[3], parts[1]-1, +parts[2], +parts[4], +parts[5]) / 1000;
				}	
				achRows.push(push);
			});

			achRows.sort();

			$(achRows).each(function() {		
				if ($(".smallForm").length > 0) {
					$("#personalAchieveSorted").find("form").next().after("<br clear='left'><img src='http://cdn.steamcommunity.com/public/images/trans.gif' width='1' height='11' border='0'><br>");
					$("#personalAchieveSorted").find("form").next().after(this[1]);
					$("#personalAchieveSorted").find("form").next().after(this[0]);
				} else {
					$("#personalAchieveSorted").prepend("<br clear='left'><img src='http://cdn.steamcommunity.com/public/images/trans.gif' width='1' height='11' border='0'><br>");
					$("#personalAchieveSorted").prepend(this[1]);
					$("#personalAchieveSorted").prepend(this[0]);
				}
			});

			$("#achievement_sort_default").on("click", function() {
				$(this).removeClass('es_achievement_sort_link');
				$("#achievement_sort_date").addClass("es_achievement_sort_link");
				$("#personalAchieve, #achievementsSelector").show();
				$("#personalAchieveSorted").hide();
			});

			$("#achievement_sort_date").on("click", function() {
				$(this).removeClass('es_achievement_sort_link');
				$("#achievement_sort_default").addClass("es_achievement_sort_link");
				$("#personalAchieve, #achievementsSelector").hide();
				$("#personalAchieveSorted").show();
			});
		}
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
			var $this = $(this);
			var stats = $this.find("span[class$='progress_info_bold']").html();

			$this.find("div[class$='badge_cards']").remove();
			$this.find("div[class$='badge_title_stats']").css("display", "none");
			$this.find("div[class$='badge_description']").css("display", "none");
			$this.find("span[class$='badge_view_details']").remove();
			$this.find("div[class$='badge_info_unlocked']").remove();
			$this.find("div[class$='badge_progress_tasks']").remove();
			$this.find("div[class$='badge_progress_info']").css({
				"padding": "0",
				"float": "none",
				"margin": "0",
				"width": "auto"
			});
			$this.find("div[class$='badge_title']")
				.css({
					"font-size": "12px",
					"line-height": "26px"
				})
				.html( $this.find("div[class$='badge_title']").html().slice(0,-9) );

			$this.find("div[class$='badge_title_row']").css({
				"padding-top": "0px",
				"padding-right": "4px",
				"padding-left": "4px",
				"height": "24px"
			});
			$this.find("div[class$='badge_row_inner']").css("height", "195px");
			$this.find("div[class$='badge_current']").css("width", "100%");
			$this.find("div[class$='badge_empty_circle']").css({
				"float": "center",
				"margin-left": "45px"
			});
			$this.find("div[class$='badge_info_image']").css({
				"float": "center",
				"margin": "7px auto 0px auto"
			});
			$this.find("div[class$='badge_content']").css("padding-top", "0px");
			$this.css({
				"width": "160px",
				"height": "195px",
				"float": "left",
				"margin-right": "15px",
				"margin-bottom": "15px"
			});

			if (stats && stats.match(/\d+/)) {
				if (!($this.find("span[class$='es_game_stats']").length > 0)) {
					$this.find("div[class$='badge_content']").first().append("<span class='es_game_stats' style='color: #5491cf; font-size: 12px; white-space: nowrap;'>" + stats + "</span>");
				}
			}
			if ($this.find("div[class$='badge_progress_info']").text()) {
				var card = $this.find("div[class$='badge_progress_info']").text().trim().match(/(\d+)\D*(\d+)/),
					text = (card) ? card[1] + " / " + card[2] : '';
				$this.find("div[class$='badge_progress_info']").text(text);
			}
		});

		$(".es_steamcardexchange_link").remove();
		$(".badges_sheet").css({
			"text-align": "center",
			"margin-left": "32px"
		});
		$(".badge_empty").css("border", "none");
		$("#footer_spacer").before('<div style="display: block; clear: both;"></div>');
	});
}

function add_gamecard_foil_link() {
	var foil;
	var foil_index;
	var url_search = window.location.search;
	var url_parameters_array = url_search.replace("?","").split("&");

	$.each(url_parameters_array,function(index,url_parameter){
		if(url_parameter=="border=1"){
			foil=true;
			foil_index=index;
		}
	});
	if (foil) {
		if(url_parameters_array.length>1){
			url_parameters_array.splice(foil_index,1);
			var url_parameters_out = url_parameters_array.join("&");
			$(".gamecards_inventorylink").append("<a class='btn_grey_grey btn_small_thin' href='" + window.location.origin + window.location.pathname + "?"+url_parameters_out+"'><span>"+localized_strings[language].view_normal_badge+"</span></a>");
		}
		else {
			$(".gamecards_inventorylink").append("<a class='btn_grey_grey btn_small_thin' href='" + window.location.origin + window.location.pathname + "'><span>"+localized_strings[language].view_normal_badge+"</span></a>");
		}
	}
	else {
		if(url_parameters_array[0]!=""){
			url_parameters_array.push("border=1");
			var url_parameters_out = url_parameters_array.join("&");
			$(".gamecards_inventorylink").append("<a class='btn_grey_grey btn_small_thin' href='" + window.location.origin + window.location.pathname + "?"+url_parameters_out+"'><span>"+localized_strings[language].view_foil_badge+"</span></a>");
		}
		else {
			$(".gamecards_inventorylink").append("<a class='btn_grey_grey btn_small_thin' href='" + window.location.origin + window.location.pathname + "?border=1'><span>"+localized_strings[language].view_foil_badge+"</span></a>");
		}
	}
}

function add_gamecard_market_links(game) {
	var foil;
	var url_search = window.location.search;
	var url_parameters_array = url_search.replace("?","").split("&");
	var cost = 0;

	$.each(url_parameters_array,function(index,url_parameter){
		if(url_parameter=="border=1"){
			foil=true;
		}
	});

	get_http("http://store.steampowered.com/app/220/", function(txt) {
		var currency_symbol = currency_symbol_from_string($(txt).find(".price, .discount_final_price").text().trim());
		var currency_type = currency_symbol_to_type(currency_symbol);

		get_http("http://api.enhancedsteam.com/market_data/card_prices/?appid=" + game, function(txt) {
			var data = JSON.parse(txt);
			$(".badge_card_set_card").each(function() {
				var node = $(this);
				var cardname = $(this).html().match(/(.+)<div style=\"/)[1].trim().replace(/&amp;/g, '&');
				if (cardname == "") { cardname = $(this).html().match(/<div class=\"badge_card_set_text\">(.+)<\/div>/)[1].trim().replace(/&amp;/g, '&');; }

				var newcardname = cardname;
				if (foil) { newcardname += " (Foil)"; }

				for (var i = 0; i < data.length; i++) {
					if (data[i].name == newcardname) {
						var marketlink = "http://steamcommunity.com/market/listings/" + data[i].url;
						switch (currency_symbol) {
							case "R$":
								var card_price = formatCurrency(data[i].price_brl, currency_type);
								if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price_brl);
								break;
							case "€":
								var card_price = formatCurrency(data[i].price_eur, currency_type); 
								if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price_eur);
								break;
							case "pуб":
								var card_price = formatCurrency(data[i].price_rub, currency_type); 
								if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price_rub);
								break;
							case "£":
								var card_price = formatCurrency(data[i].price_gbp, currency_type);
								if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price_gbp);
								break;
							case "¥":
								var card_price = formatCurrency(data[i].price_jpy, currency_type);
								if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price_jpy);
								break;
							default:
								var card_price = formatCurrency(data[i].price, currency_type);
								if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price);
								break;
						}
					}
				}

				if (!(marketlink)) { 
					if (foil) { newcardname = newcardname.replace("(Foil)", "(Foil Trading Card)"); } else { newcardname += " (Trading Card)"; }
					for (var i = 0; i < data.length; i++) {
						if (data[i].name == newcardname) {
							var marketlink = "http://steamcommunity.com/market/listings/" + data[i].url;
							switch (currency_symbol) {
								case "R$":
									var card_price = formatCurrency(data[i].price_brl, currency_type);
									if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price_brl);
									break;
								case "€":
									var card_price = formatCurrency(data[i].price_eur, currency_type); 
									if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price_eur);
									break;
								case "pуб":
									var card_price = formatCurrency(data[i].price_rub, currency_type); 
									if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price_rub);
									break;
								case "£":
									var card_price = formatCurrency(data[i].price_gbp, currency_type); 
									if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price_gbp);
									break;
								case "¥":
									var card_price = formatCurrency(data[i].price_jpy, currency_type);
									if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price_jpy);
									break;
								default:
									var card_price = formatCurrency(data[i].price, currency_type);						
									if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price);
									break;
							}
						}
					}
				}

				if (marketlink && card_price) {
					var html = "<a class=\"es_card_search\" href=\"" + marketlink + "\">" + localized_strings[language].lowest_price + ": " + card_price + "</a>";
					$(this).children("div:contains('" + cardname + "')").parent().append(html);
				}
			});
			if (cost > 0 && $(".profile_small_header_name .whiteLink").attr("href") == $("#headerUserAvatarIcon").parent().attr("href")) {
				cost = formatCurrency(cost, currency_type);
				$(".badge_empty_name:last").after("<div class='badge_info_unlocked' style='color: #5c5c5c;'>" + localized_strings[language].badge_completion_cost+ ": " + cost + "</div>");
				$(".badge_empty_right").css("margin-top", "7px");
				$(".gamecard_badge_progress .badge_info").css("width", "296px");
			}
		});
	});
}

// Display the cost estimate of crafting a game badge by purchasing unowned trading cards
function add_badge_completion_cost() {
	$(".profile_xp_block_right").after("<div id='es_cards_worth'></div>");
	get_http("http://store.steampowered.com/app/220/", function(txt) {
		var currency_symbol = currency_symbol_from_string($(txt).find(".price, .discount_final_price").text().trim());
		var currency_type = currency_symbol_to_type(currency_symbol);		
		var total_worth = 0, count = 0;
		$(".badge_row").each(function() {
			var game = $(this).find(".badge_row_overlay").attr("href").match(/\/(\d+)\//);
			var foil = $(this).find("a:last").attr("href").match(/\?border=1/);
			var node = $(this);			
			if (game) {
				var url = "http://api.enhancedsteam.com/market_data/average_card_price/?appid=" + game[1] + "&cur=" + currency_type.toLowerCase();
				if (foil) { url = url + "&foil=true"; }
				get_http(url, function(txt) {
					if ($(node).find("div[class$='badge_progress_info']").text()) {
						var card = $(node).find("div[class$='badge_progress_info']").text().trim().match(/(\d+)\D*(\d+)/);
						var need = card[2] - card[1];
					}

					var cost = (need * parseFloat(txt)).toFixed(2);

					if ($(node).find(".progress_info_bold").text()) {
						var drops = $(node).find(".progress_info_bold").text().match(/\d+/);
						if (drops) { var worth = (drops[0] * parseFloat(txt)).toFixed(2); }
					}

					if (worth > 0) {
						total_worth = total_worth + parseFloat(worth);
					}

					cost = formatCurrency(cost, currency_type);
					card = formatCurrency(worth, currency_type);
					worth_formatted = formatCurrency(total_worth, currency_type);

					if (worth > 0) {
						$(node).find(".how_to_get_card_drops").after("<span class='es_card_drop_worth'>" + localized_strings[language].drops_worth_avg + " " + card + "</span>")
						$(node).find(".how_to_get_card_drops").remove();
					}

					$(node).find(".badge_empty_name:last").after("<div class='badge_info_unlocked' style='color: #5c5c5c;'>" + localized_strings[language].badge_completion_avg + ": " + cost + "</div>");
					$(node).find(".badge_empty_right").css("margin-top", "7px");
					$(node).find(".gamecard_badge_progress .badge_info").css("width", "296px");

					if (total_worth > 0) {
						$("#es_cards_worth").text(localized_strings[language].drops_worth_avg + " " + worth_formatted);
					}
				});
			}
		});
	});
}

function add_gamecard_trading_forum() {
	var forumAdded = false;
	function get_number(bracketed_number){
		return parseInt(bracketed_number.trim().substr(1, bracketed_number.length-2));
	}
	function addForum(){
		var pathname = window.location.pathname;
		var appid = window.location.pathname.split("/")[4];
		$(".badge_detail_tasks_rule").next().next().after('<div class="gamecards_inventorylink"><a href="http://steamcommunity.com/app/'+appid+'/tradingforum/" class="btn_grey_grey btn_medium"><span>' + localized_strings[language].visit_trade_forum + '</span></a></div>');
		forumAdded = true;
	}
	var all_cards = $(".badge_card_set_card");
	var all_owned = $(".badge_card_set_card.owned");
	if (all_cards.length == all_owned.length){
		$.each(all_owned, function(){
			var num_owned = get_number($(this).find(".badge_card_set_text_qty").text());
			if (num_owned>0 && !forumAdded){
				addForum();
			}
		});
	}
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
		if ($(".badge_details_set_favorite").find(".btn_grey_black").length > 0) { $(".badge_details_set_favorite").append("<div class='btn_grey_black btn_small_thin' id='es_faq_link'><span>" + localized_strings[language].faqs + "</span></div>"); }
		$("#es_faq_link").click(function() {
			window.location = "http://steamcommunity.com/tradingcards/faq";
		});
	});
}

function add_friends_that_play() {
	var appid = window.location.pathname.match(/(?:id|profiles)\/.+\/friendsthatplay\/(\d+)/)[1];

	$.get('//store.steampowered.com/api/appuserdetails/?appids=' + appid).success(function(data) {
		if (data[appid].success && data[appid].data.friendsown && data[appid].data.friendsown.length > 0) {
			// Steam Web API is awful, let's do it the easiest way.
			$.get('//steamcommunity.com/my/friends/').success(function(friends_html) {
				friends_html = $(friends_html);

				var friendsown = data[appid].data.friendsown;

				var html = '<div class="mainSectionHeader friendListSectionHeader">';
				html += localized_strings[language].all_friends_own.replace('__friendcount__', friendsown.length);
				html += ' <span class="underScoreColor">_</span>';
				html += '</div>';

				html += '<div class="profile_friends" style="height: ' + (48 * friendsown.length / 3) + 'px;">';

				for (var i = 0; i < friendsown.length; i++) {
					var steamID = friendsown[i].steamid.slice(4) - 1197960265728;
					var friend_html = $(friends_html.find('.friendBlock[data-miniprofile=' + steamID + ']')[0].outerHTML);
					var friend_small_text = localized_strings[language].hours_short.replace('__hours__', Math.round(friendsown[i].playtime_twoweeks / 60 * 10) / 10);
					friend_small_text += ' / ' + localized_strings[language].hours_short.replace('__hours__', Math.round(friendsown[i].playtime_total / 60 * 10) / 10);
					var compare_url = friend_html.find('.friendBlockLinkOverlay')[0].href + '/stats/' + appid + '/compare';
					friend_small_text += '<br><a class="whiteLink friendBlockInnerLink" href="' + compare_url + '">' + localized_strings[language].view_stats + '</a>';
					friend_html.find('.friendSmallText').html(friend_small_text);
					html += friend_html[0].outerHTML;
				}

				html += '</div>';

				$('.friends_that_play_content').append(html);

				// Reinitialize miniprofiles by injecting the function call.

				var injectedCode = 'InitMiniprofileHovers();';
				var script = document.createElement('script');
				script.appendChild(document.createTextNode('(function() { '+ injectedCode +' })();'));
				(document.body || document.head || document.documentElement).appendChild(script);
			});
		}
	});
}

function add_birthday_celebration() {
	var profile_id = is_signed_in();
	var setting_name = profile_id[0]+"birthday";
	var obj = {};
	storage.get(function(settings) {
		if (settings[setting_name] === undefined) {
			get_http('http://api.enhancedsteam.com/steamapi/GetPlayerSummaries/?steamids=' + profile_id, function (txt) {
				var data = JSON.parse(txt);
				var timecreated = data["response"]["players"][0]["timecreated"];
				obj[setting_name] = timecreated;
				storage.set(obj);
			});
		}
		else {
			var username = $("#global_header .username").text().trim();
			var birth_date_unix = settings[setting_name];
			var birth_date = new Date(birth_date_unix*1000);
			var now = new Date();
			var years=0;
			if(now.getMonth()==birth_date.getMonth()){
				if(now.getDate()==birth_date.getDate()){
					years = now.getFullYear()-birth_date.getFullYear();
					var message = localized_strings[language]["birthday_message"].replace("__username__", username).replace("__age__", years);
					$("#logo_holder img").attr({"title":message,"alt":message,"height":100,"src":chrome.extension.getURL("img/birthday_logo.png")}).css('margin-top', '-14px');
					$(".logo").css({"height":"60px","padding-top":"14px"});

					switch (window.location.host) {
						case "store.steampowered.com":
							switch (true) {
								case /^\/$/.test(window.location.pathname):
									$("#global_header").append("<div style='background-image: url("+chrome.extension.getURL("img/birthday_bg.png")+");' class='birthday'></div>");					
									break;
							}
					}
				}
			}
		}
	});
}

// Add a checkbox to Advanced Search Options to search in names of products only
function search_in_names_only(calledbyajax) {
	var searchterm = $(".search_controls #realterm").val().toLowerCase();
	var itemtitle;
	if(!$("#advanced_search_controls #names_only").length)
	{
		$("#advanced_search_controls").append('<div class="store_checkbox_button" style="margin-bottom: 8px;" id="names_only">' + localized_strings[language].search_names_only + '</div>');
	}
	if(calledbyajax)
	{      
		$(".search_result_row:hidden").show();
		if($("#advanced_search_controls #names_only").hasClass("checked"))
		{
			$(".search_result_row .search_name h4").each(function() {
				itemtitle = $(this).html().toLowerCase();
				if(!$(this).html().toLowerCase().contains(searchterm))
				{
					$(this).parent().parent().hide();
					search_threshhold = search_threshhold - 61;
				}
			});
		}    
	}
	else
	{
		$("#advanced_search_controls #names_only").off('click').click(function(){
			$(this).toggleClass("checked");
			if($(this).hasClass("checked"))
			{
				$(".search_result_row .search_name h4").each(function() {
					itemtitle = $(this).html().toLowerCase();
					if(!$(this).html().toLowerCase().contains(searchterm))
					{
						$(this).parent().parent().hide();
						search_threshhold = search_threshhold - 61;
					}
				});
			}
			else
			{
				$(".search_result_row:hidden").show();
			}
		});
	}
}

$(document).ready(function(){
	is_signed_in();

	localization_promise.done(function(){
		// Don't interfere with Storefront API requests
		if (window.location.pathname.startsWith("/api")) return;
		// On window load
		add_enhanced_steam_options();
		add_fake_country_code_warning();
		add_language_warning();
		remove_install_steam_button();
		remove_about_menu();
		add_header_links();
		process_early_access();
		if (is_signed_in()) {
			replace_account_name();
			add_library_menu();
			add_birthday_celebration();
		}

		// Attach event to the logout button
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
						enhance_game_background();
						add_screenshot_lightbox();

						drm_warnings("app");
						add_metacritic_userscore();
						add_steamreview_userscore(appid);
						display_purchase_date();

						fix_community_hub_links();
						add_widescreen_certification(appid);
						add_hltb_info(appid);
						add_pcgamingwiki_link(appid);
						add_steamcardexchange_link(appid);
						add_app_page_highlights(appid);
						add_steamdb_links(appid, "app");
						add_familysharing_warning(appid);
						add_dlc_page_link(appid);
						add_pack_breakdown();
						add_package_info_button();
						add_steamchart_info(appid);
						add_system_requirements_check(appid);
						add_app_badge_progress(appid);
						add_dlc_checkboxes();
						fix_achievement_icon_size();
						add_astats_link(appid);
						add_achievement_completion_bar(appid);

						show_regional_pricing();
						break;

					case /^\/sub\/.*/.test(window.location.pathname):
						var subid = get_subid(window.location.host + window.location.pathname);
						enhance_game_background();
						drm_warnings("sub");
						subscription_savings_check();
						show_pricing_history(subid, "sub");
						add_steamdb_links(subid, "sub");						

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
						return;
						break;

					case /^\/steamaccount\/addfunds/.test(window.location.pathname):
						add_custom_wallet_amount();
						break;

					case /^\/search\/.*/.test(window.location.pathname):
						//add_cart_to_search();
						add_advanced_cancel();
						endless_scrolling();
						remove_non_specials();
						search_in_names_only(false);
						break;

					case /^\/sale\/.*/.test(window.location.pathname):
						show_regional_pricing();
						enhance_game_background("sale");
						break;

					// Storefront-front only
					case /^\/$/.test(window.location.pathname):
						add_popular_tab();
						add_actual_new_release_button();
						set_homepage_tab();
						add_carousel_descriptions();
						show_regional_pricing();
						break;
				}

				// Highlights & data fetching
				start_highlights_and_tags();

				// Storefront homepage tabs
				bind_ajax_content_highlighting();
				add_small_cap_height();
				fix_search_placeholder();
				hide_trademark_symbols();
				add_speech_search();
				set_html5_video();
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
						add_wishlist_ajaxremove();
						add_wishlist_pricehistory();
						add_wishlist_notes();

						// Wishlist highlights
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

					case /^\/(?:id|profiles)\/.+\/inventory/.test(window.location.pathname):
						bind_ajax_content_highlighting();
						inventory_market_prepare();
						break;

					case /^\/(?:id|profiles)\/(.+)\/games/.test(window.location.pathname):
						total_time();
						total_size();
						add_gamelist_achievements();
						add_gamelist_sort();
						add_gamelist_filter();
						add_gamelist_common();
						break;

					case /^\/(?:id|profiles)\/.+\/badges/.test(window.location.pathname):
						add_badge_completion_cost();
						add_total_drops_count();
						add_cardexchange_links();
						add_badge_filter();
						add_badge_sort();
						add_badge_view_options();
						break;

					case /^\/(?:id|profiles)\/.+\/stats/.test(window.location.pathname):
						add_achievement_sort();
						break;

					case /^\/(?:id|profiles)\/.+\/gamecard/.test(window.location.pathname):
						var gamecard = get_gamecard(window.location.pathname);
						add_cardexchange_links(gamecard);
						add_gamecard_market_links(gamecard);
						add_gamecard_foil_link();
						add_gamecard_trading_forum();
						break;

					case /^\/(?:id|profiles)\/.+\/friendsthatplay/.test(window.location.pathname):
						add_friends_that_play();
						break;

					case /^\/(?:id|profiles)\/.+/.test(window.location.pathname):
						add_community_profile_links();
						add_wishlist_profile_link();
						add_supporter_badges();
						change_user_background();
						add_profile_store_links();
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
						hide_trademark_symbols(true);
						break;
				}
				break;
		}
	});
});
