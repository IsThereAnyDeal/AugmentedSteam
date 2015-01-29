var version = "7.3"

var console_info=["%c Enhanced %cSteam v"+version+" by jshackles %c http://www.enhancedsteam.com ","background: #000000;color: #7EBE45", "background: #000000;color: #ffffff",""];
console.log.apply(console,console_info);

var storage = chrome.storage.sync;
var info = 0;

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

// Check if the user is signed in
var is_signed_in = false;
var signed_in_promise = (function () {
	var deferred = new $.Deferred();
	if (window.location.protocol != "https:") {
		if ($("#global_actions").find(".playerAvatar").length > 0) {
			var user_name = $("#global_actions").find(".playerAvatar")[0].outerHTML.match(/\/id\/(.+?)"/);
			if (user_name) {
				if (getValue("steamID")) {
					is_signed_in = getValue("steamID");
					deferred.resolve();
				} else {
					get_http("http://steamcommunity.com/id/" + user_name[1], function(txt) {
						is_signed_in = txt.match(/steamid"\:"(.+)","personaname/)[1];
						setValue("steamID", is_signed_in);
						deferred.resolve();
					});
				}
			} else {
				deferred.resolve();
			}
		} else {
			deferred.resolve();
		}
	} else {
		deferred.resolve();
	}
	return deferred.promise();
})();

// Global scope promise storage; to prevent unecessary API requests
var loading_inventory;
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

var currency_format_info = {
	"BRL": { places: 2, hidePlacesWhenZero: false, symbolFormat: "R$ ", thousand: ".", decimal: ",", right: false },
	"EUR": { places: 2, hidePlacesWhenZero: false, symbolFormat: "€", thousand: " ", decimal: ",", right: true },
	"GBP": { places: 2, hidePlacesWhenZero: false, symbolFormat: "£", thousand: ",", decimal: ".", right: false },
	"RUB": { places: 2, hidePlacesWhenZero: true,  symbolFormat: " pуб.", thousand: "", decimal: ",", right: true },
	"JPY": { places: 0, hidePlacesWhenZero: false, symbolFormat: "¥ ", thousand: ",", decimal: ".", right: false },
	"MYR": { places: 2, hidePlacesWhenZero: false, symbolFormat: "RM", thousand: ",", decimal: ".", right: false },
	"NOK": { places: 2, hidePlacesWhenZero: false, symbolFormat: " kr", thousand: ".", decimal: ",", right: true },
	"IDR": { places: 0, hidePlacesWhenZero: false, symbolFormat: "Rp ", thousand: " ", decimal: ".", right: false },
	"PHP": { places: 2, hidePlacesWhenZero: false, symbolFormat: "P", thousand: ",", decimal: ".", right: false },
	"SGD": { places: 2, hidePlacesWhenZero: false, symbolFormat: "S$", thousand: ",", decimal: ".", right: false },
	"THB": { places: 2, hidePlacesWhenZero: false, symbolFormat: "฿", thousand: ",", decimal: ".", right: false },
	"VND": { places: 2, hidePlacesWhenZero: false, symbolFormat: "₫", thousand: ",", decimal: ".", right: false },
	"KRW": { places: 2, hidePlacesWhenZero: false, symbolFormat: "₩", thousand: ",", decimal: ".", right: false },
	"TRY": { places: 2, hidePlacesWhenZero: false, symbolFormat: " TL", thousand: "", decimal: ",", right: true },
	"UAH": { places: 2, hidePlacesWhenZero: false, symbolFormat: "₴", thousand: "", decimal: ",", right: true },
	"MXN": { places: 2, hidePlacesWhenZero: false, symbolFormat: "Mex$ ", thousand: ",", decimal: ".", right: false },
	"CAD": { places: 2, hidePlacesWhenZero: false, symbolFormat: "CDN$ ", thousand: ",", decimal: ".", right: false },
	"AUD": { places: 2, hidePlacesWhenZero: false, symbolFormat: "A$ ", thousand: ",", decimal: ".", right: false },
	"NZD": { places: 2, hidePlacesWhenZero: false, symbolFormat: "NZ$ ", thousand: ",", decimal: ".", right: false },
	"USD": { places: 2, hidePlacesWhenZero: false, symbolFormat: "$", thousand: ",", decimal: ".", right: false }
};

function formatCurrency(number, type) {
	var info = currency_format_info[type];
	if (info.hidePlacesWhenZero && (number % 1 === 0)) {
		info.places = 0;
	}

	var negative = number < 0 ? "-" : "",
		i = parseInt(number = Math.abs(+number || 0).toFixed(info.places), 10) + "",
		j = (j = i.length) > 3 ? j % 3 : 0,
		formatted;

	formatted = negative +
				(j ? i.substr(0, j) + info.thousand : "") +
				i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + info.thousand) +
				(info.places ? info.decimal + Math.abs(number - i).toFixed(info.places).slice(2) : "");

	if (info.right)
		formatted += info.symbolFormat;
	else
		formatted = info.symbolFormat + formatted;

	return formatted;
}

function parse_currency(str) {
	var currency_symbol = currency_symbol_from_string(str);
	var currency_type = currency_symbol_to_type(currency_symbol);
	var currency_number = currency_symbol_to_number(currency_symbol);
	var info = currency_format_info[currency_type];

	// remove thousand sep, replace decimal with dot, remove non-numeric
	str = str.replace(info.thousand, '')
			 .replace(info.decimal, '.')
			 .replace(/[^\d\.]/g, '')
			 .trim();

	var value = parseFloat(str);

	if (isNaN(value))
		return null;

	return {
		value: value,
		currency_type: currency_type,
		currency_symbol: currency_symbol,
		currency_number: currency_number
	};
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
		case "CDN$":
			return "CAD";
		case "A$":
			return "AUD";
		case "NZ$":
			return "NZD";
		default:
			return "USD";
	}
}

function currency_symbol_to_number (currency_symbol) {
	switch (currency_symbol) {
		case "pуб":
			return 5;
		case "€":
			return 3;
		case "£":
			return 2;
		case "R$":
			return 7;
		case "¥":
			return 8;
		case "kr":
			return 9;
		case "Rp":
			return 10;
		case "RM":
			return 11;
		case "P":
			return 12;
		case "S$":
			return 13;
		case "฿":
			return 14;
		case "₫":
			return 15;
		case "₩":
			return 16;
		case "TL":
			return 17;
		case "₴":
			return 18;
		case "Mex$":
			return 19;
		case "CDN$":
			return 20;
		case "A$":
			return 21;
		case "NZ$":
			return 22;
		default:
			return 1;
	}
}

function currency_symbol_from_string (string_with_symbol) {
	var re = /(?:R\$|S\$|\$|RM|kr|Rp|€|¥|£|฿|pуб|P|₫|₩|TL|₴|Mex\$|CDN\$|A\$|NZ\$)/;
	var match = string_with_symbol.match(re);
	return match ? match[0] : '';
}

function escapeHTML(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') ;
}

function getCookie(name) {
	var re = new RegExp(name + "=([^;]+)");
	var value = re.exec(document.cookie);
	return (value != null) ? unescape(value[1]) : null;
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

// Color the tile for owned games
function highlight_owned(node) {
	storage.get(function(settings) {
		node.classList.add("es_highlight_owned");

		if (settings.highlight_owned_color === undefined) { settings.highlight_owned_color = "#5c7836";	storage.set({'highlight_owned_color': settings.highlight_owned_color}); }
		if (settings.highlight_owned === undefined) { settings.highlight_owned = false; storage.set({'highlight_owned': settings.highlight_owned}); }
		if (settings.hide_owned === undefined) { settings.hide_owned = false; chrome.storage.sync.set({'hide_owned': settings.hide_owned}); }

		if (settings.highlight_owned) highlight_node(node, settings.highlight_owned_color);
		if (settings.hide_owned) hide_node(node);

		if (settings.tag_owned === undefined) { settings.tag_owned = false; storage.set({'tag_owned': settings.tag_owned}); }
		if (settings.tag_owned_color === undefined) { settings.tag_owned_color = "#5c7836";	storage.set({'tag_owned_color': settings.tag_owned_color}); }
		if (settings.tag_owned) add_tag(node, localized_strings[language].tag.owned, settings.tag_owned_color);
	});
}

// Color the tile for wishlist games
function highlight_wishlist(node) {
	storage.get(function(settings) {
		node.classList.add("es_highlight_wishlist");

		if (settings.highlight_wishlist_color === undefined) { settings.highlight_wishlist_color = "#d3deea";	storage.set({'highlight_wishlist_color': settings.highlight_wishlist_color}); }
		if (settings.highlight_wishlist === undefined) { settings.highlight_wishlist = false; storage.set({'highlight_wishlist': settings.highlight_wishlist}); }
		if (settings.hide_wishlist === undefined) { settings.hide_wishlist = false; chrome.storage.sync.set({'hide_wishlist': settings.hide_wishlist}); }

		if (settings.highlight_wishlist) highlight_node(node, settings.highlight_wishlist_color);
		if (settings.hide_wishlist) hide_node(node);

		if (settings.tag_wishlist_color === undefined) { settings.tag_wishlist_color = "#d3deea";	storage.set({'tag_wishlist_color': settings.tag_wishlist_color}); }
		if (settings.tag_wishlist === undefined) { settings.tag_wishlist = false; storage.set({'tag_wishlist': settings.tag_wishlist}); }
		if (settings.tag_wishlist) add_tag(node, localized_strings[language].tag.wishlist, settings.highlight_wishlist_color);
	});
}

function highlight_cart(node) {
	storage.get(function(settings) {
		node.classList.add("es_highlight_cart");
		if (settings.hide_cart === undefined) { settings.hide_cart = false; chrome.storage.sync.set({'hide_cart': settings.hide_cart}); }
		if (settings.hide_cart) hide_node(node);
	});
}

// Color the tile for items with coupons
function highlight_coupon(node, discount) {
	storage.get(function(settings) {
		node.classList.add("es_highlight_coupon");
		if (settings.highlight_coupon_color === undefined) { settings.highlight_coupon_color = "#6b2269"; storage.set({'highlight_coupon_color': settings.highlight_coupon_color}); }
		if (settings.highlight_coupon === undefined) { settings.highlight_coupon = false; storage.set({'highlight_coupon': settings.highlight_coupon}); }
		if (settings.highlight_coupon) highlight_node(node, settings.highlight_coupon_color);

		if (settings.tag_coupon_color === undefined) { settings.tag_coupon_color = "#6b2269"; storage.set({'tag_coupon_color': settings.tag_coupon_color}); }
		if (settings.tag_coupon === undefined) { settings.tag_coupon = false; storage.set({'tag_coupon': settings.tag_coupon}); }
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
		if (settings.tag_inv_gift === undefined) { settings.tag_inv_gift = false; storage.set({'tag_inv_gift': settings.tag_inv_gift}); }
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
		if (settings.tag_inv_guestpass === undefined) { settings.tag_inv_guestpass = false; storage.set({'tag_inv_guestpass': settings.tag_inv_guestpass}); }
		if (settings.tag_inv_guestpass) add_tag(node, localized_strings[language].tag.inv_guestpass, settings.highlight_inv_guestpass_color);
	});
}

function highlight_nondiscounts(node) {
	storage.get(function(settings) {
		if (settings.hide_notdiscounted === undefined) { settings.hide_notdiscounted = false; chrome.storage.sync.set({'hide_notdiscounted': settings.hide_notdiscounted}); }
		
		if (settings.hide_notdiscounted) {
			$(node).css("display", "none");
		}
	});
}

function highlight_notinterested(node) {
	var notinterested_promise = (function () {
		var deferred = new $.Deferred();
		if (is_signed_in && window.location.protocol != "https:") {
			var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
			var last_updated = getValue("dynamiclist_time") || expire_time - 1;

			if (last_updated < expire_time) {
				get_http("http://store.steampowered.com/dynamicstore/userdata/", function(txt) {
					var data = JSON.parse(txt);
					if (data["rgIgnoredApps"]) {
						setValue("ignored_apps", data["rgIgnoredApps"].toString());
					}
					setValue("dynamiclist_time", parseInt(Date.now() / 1000, 10));
					deferred.resolve();
				});
			} else {
				deferred.resolve();
			}
		} else {
			deferred.resolve();
		}
		return deferred.promise();
	})();

	$.when.apply($, [notinterested_promise]).done(function() {
		storage.get(function(settings) {
			if (settings.hide_notinterested === undefined) { settings.hide_notinterested = false; chrome.storage.sync.set({'hide_notinterested': settings.hide_notinterested}); }
			
			var notinterested = getValue("ignored_apps").split(",");
			if ($(node).hasClass("search_result_row")) {
				var appid = get_appid(node.href);
				if (settings.hide_notinterested && $.inArray(appid, notinterested) !== -1) {				
					$(node).css("display", "none");
				}
			}
		});
	});
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function highlight_node(node, color) {
	var $node = $(node);
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

		var rgb = hexToRgb(color);

		$node.css("backgroundImage", "none");
		$node.css("background", "linear-gradient(135deg, rgba(0,0,0,1) 0%, rgba("+rgb.r+","+rgb.g+","+rgb.b+",0.8) 100%)");

		$(node).find("img").css("opacity", "1");
		$(node).find(".search_capsule").css("opacity", "1");
		$(node).find(".ds_flag").remove();

		// Set text colour to not conflict with highlight
		if (node.classList.contains("tab_item")) $node.find("div").css("color", "lightgrey");
		if (node.classList.contains("search_result_row")) $node.find(".search_name").css("color", "lightgrey");
	});
}

function hide_node(node) {
	storage.get(function(settings) {
		if (settings.hide_owned === undefined) { settings.hide_owned = false; chrome.storage.sync.set({'hide_owned': settings.hide_owned}); }
		if (settings.hide_dlcunownedgames === undefined) { settings.hide_dlcunownedgames = false; chrome.storage.sync.set({'hide_dlcunownedgames': settings.hide_dlcunownedgames}); }

		if ($(node).hasClass("info") || $(node).hasClass("dailydeal") || $(node).hasClass("spotlight_content") || $(node).hasClass("browse_tag_game_cap")) { node = $(node).parent()[0]; }

		if (settings.hide_owned) {
			if (node.classList.contains("search_result_row") || node.classList.contains("item") || node.classList.contains("cluster_capsule") || node.classList.contains("browse_tag_game")) {
				hide_the_node(node);
				if ($(document).height() <= $(window).height()) {
					load_search_results();
				}
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

			$tags.each(function() {
				$(this).children().css("float", "none");
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
	if (is_signed_in) {
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
											if (appids[j]) setValue(appids[j] + (obj.type === "Gift" ? "gift" : "guestpass"), true);
										}

										break;
									}
								}
							}
						}

						if (!is_package && obj.actions) {
							// Single app
							var appid = get_appid(obj.actions[0].link);
							if (appid) setValue(appid + (obj.type === "Gift" ? "gift" : "guestpass"), true);
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

	function calculate_node($node, search) {
		var parsed = parse_currency($node.find(search).text().trim());

		if (parsed) {
			currency_symbol = parsed.currency_symbol;
			gamelist += $node.find("h4").text().trim() + ", ";
			items ++;
			total += parsed.value;
			apps += get_appid($node.find(".btnv6_blue_hoverfade").attr("href")) + ",";
		}
	}

	$('.wishlistRow').each(function () {
		var $this = $(this);

		if ($this.find("div[class='price']").length != 0 && $this.find("div[class='price']").text().trim() != "")
			calculate_node($this, "div[class='price']");

		if ($this.find("div[class='discount_final_price']").length != 0)
			calculate_node($this, "div[class='discount_final_price']");
	});
	gamelist = gamelist.replace(/, $/, "");
	
	currency_type = currency_symbol_to_type(currency_symbol);
	total = formatCurrency(parseFloat(total), currency_type);
	$(".games_list").after("<link href='http://store.akamai.steamstatic.com/public/css/v6/game.css' rel='stylesheet' type='text/css'><div class='game_area_purchase_game' style='width: 600px; margin-top: 15px;'><h1>" + localized_strings[language].wishlist + "</h1><p class='package_contents'><b>" + localized_strings[language].bundle.includes.replace("(__num__)", items) + ":</b> " + gamelist + "</p><div class='game_purchase_action'><div class='game_purchase_action_bg'><div class='game_purchase_price price'>" + total + "</div></div></div></div></div></div>");
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
		if (settings.stores === undefined) { settings.stores = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]; chrome.storage.sync.set({'stores': settings.stores}); }
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
			if (settings.stores[26]) { storestring += "newegg,"; }
			if (settings.stores[27]) { storestring += "gamesrepublic,"; }
			if (settings.showallstores) { storestring = "steam,amazonus,impulse,gamersgate,greenmangaming,gamefly,origin,uplay,indiegalastore,gametap,gamesplanet,getgames,desura,gog,dotemu,gameolith,adventureshop,nuuvem,shinyloot,dlgamer,humblestore,squenix,bundlestars,fireflower,humblewidgets,newegg,gamesrepublic"; }

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
					var htmlstr = '<div class="game_purchase_action_bg"><div class="btn_addtocart btn_packageinfo">';
					var subid = $(this).find("input[name=subid]").val();
					htmlstr += '<a class="btnv6_blue_blue_innerfade btn_medium" href="http://store.steampowered.com/sub/' + subid + '/"><span>' + localized_strings[language].package_info + '</span></a></div></div>';					
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

							$(".sys_req").parent().before(html);
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
			var html = "<a class='btnv6_blue_blue_innerfade btn_medium es_btn_systemreqs' href='steam://checksysreqs/" + appid + "'><span>" + localized_strings[language].check_system + "</span></a>";
			$(".sysreq_content").last().after(html);
		}
	});	
}

// Automatically send age verification when requested
function send_age_verification() {
	storage.get(function(settings) {
		if (settings.send_age_info === undefined) { settings.send_age_info = true; storage.set({'send_age_info': settings.send_age_info}); }
		if (settings.send_age_info) {
			document.getElementsByName("ageYear")[0].value="1955";
			document.getElementsByClassName("btnv6_blue_hoverfade")[0].click();
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

		if (is_signed_in) {
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
			var new_account_name = current_account_name;
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
	$(addfunds).find(".btnv6_green_white_innerfade").addClass("es_custom_button");
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

// If app has a coupon, display a message.
function display_coupon_message(appid) {
	load_inventory().done(function() {
		if (getValue(appid+"coupon")) {
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

			var $price_div = $(".game_purchase_action:first"),
				cart_id = $(document).find("[name=\"subid\"]")[0].value,
				actual_price_container = $price_div.find(".price,.discount_final_price").text(),		
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
	});
}

function show_pricing_history(appid, type) {
	storage.get(function(settings) {
		if (settings.showlowestprice === undefined) { settings.showlowestprice = true; storage.set({'showlowestprice': settings.showlowestprice}); }
		if (settings.showlowestpricecoupon === undefined) { settings.showlowestpricecoupon = true; storage.set({'showlowestpricecoupon': settings.showlowestpricecoupon}); }
		if (settings.showlowestprice_region === undefined) { settings.showlowestprice_region = "us"; storage.set({'showlowestprice_region': settings.showlowestprice_region}); }
		if (settings.showallstores === undefined) { settings.showallstores = true; chrome.storage.sync.set({'showallstores': settings.showallstores}); }
		if (settings.stores === undefined) { settings.stores = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]; chrome.storage.sync.set({'stores': settings.stores}); }
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
			if (settings.stores[26]) { storestring += "newegg,"; }
			if (settings.stores[27]) { storestring += "gamesrepublic,"; }
			if (settings.showallstores) { storestring = "steam,amazonus,impulse,gamersgate,greenmangaming,gamefly,origin,uplay,indiegalastore,gametap,gamesplanet,getgames,desura,gog,dotemu,gameolith,adventureshop,nuuvem,shinyloot,dlgamer,humblestore,squenix,bundlestars,fireflower,humblewidgets,newegg,gamesrepublic"; }

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
			text += $(".game_area_sys_req").html();
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
	addtext = "<a href='javascript:document.cookie=\"shoppingCartGID=0; path=/\";location.reload();' class='es_empty btnv6_green_white_innerfade btn_medium continue' style='float: left;'><span>" + localized_strings[language].empty_cart + "</span></a>";

	jQuery('.checkout_content').each(function () {
		$(this).prepend(addtext);
		if ($(".cart_row").length === 0) {
			$(".es_empty").addClass("btn_disabled");
		}
	});
}

// User profile pages
function add_community_profile_links() {
	if ($("#reportAbuseModal").length > 0) { var steamID = document.getElementsByName("abuseID")[0].value; }
	if (steamID === undefined && document.documentElement.outerHTML.match(/steamid"\:"(.+)","personaname/)) { var steamID = document.documentElement.outerHTML.match(/steamid"\:"(.+)","personaname/)[1]; }
	var icon_color='';
	var profile_link_icon_background = '';
	storage.get(function(settings) {
		if (settings.profile_steamgifts === undefined) { settings.profile_steamgifts = true; chrome.storage.sync.set({'profile_steamgifts': settings.profile_steamgifts}); }
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
	if (steamID === undefined && document.documentElement.outerHTML.match(/steamid"\:"(.+)","personaname/)) { var steamID = document.documentElement.outerHTML.match(/steamid"\:"(.+)","personaname/)[1]; }

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
	if (steamID === undefined && document.documentElement.outerHTML.match(/steamid"\:"(.+)","personaname/)) { var steamID = document.documentElement.outerHTML.match(/steamid"\:"(.+)","personaname/)[1]; }

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
	$('a.btnv6_blue_hoverfade').each(function (index, node) {
		var app = get_appid(node.href);
		get_http('//store.steampowered.com/api/appdetails/?appids=' + app, function (data) {
			var storefront_data = JSON.parse(data);
			$.each(storefront_data, function(appid, app_data) {
				if (app_data.success) {
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

var processing = false;
var search_page = 2;

function load_search_results () {
	if (!processing) {
		processing = true;
		var search = document.URL.match(/(.+)\/(.+)/)[2].replace(/\&page=./, "").replace(/\#/g, "&");
		if ($(".LoadingWrapper").length === 0) {
			$(".search_pagination:last").before('<div class="LoadingWrapper"><div class="LoadingThrobber" style="margin-bottom: 15px;"><div class="Bar Bar1"></div><div class="Bar Bar2"></div><div class="Bar Bar3"></div></div><div id="LoadingText">' + localized_strings[language].loading + '</div></div>');
		}	
		$.ajax({
			url: 'http://store.steampowered.com/search/results' + search + '&page=' + search_page + '&snr=es'
		}).success(function(txt) {
			var html = $.parseHTML(txt);
			html = $(html).find("a.search_result_row");

			var added_date = +new Date();
			$('#search_result_container').attr('data-last-add-date', added_date);
			html.attr('data-added-date', added_date)

			$(".LoadingWrapper").remove();
			$(".search_result_row").last().after(html);
			search_page = search_page + 1;
			processing = false;

			var ripc = function () {
				var added_date = jQuery('#search_result_container').attr('data-last-add-date');
				GDynamicStore.DecorateDynamicItems(jQuery('.search_result_row[data-added-date="' + added_date + '"]'));
				BindStoreTooltip(jQuery('.search_result_row[data-added-date="' + added_date + '"] [data-store-tooltip]'));
			};

			runInPageContext(ripc);
		}).error(function() {
			$(".LoadingWrapper").remove();
			$(".search_pagination:last").before("<div style='text-align: center; margin-top: 16px;' id='es_error_msg'>" + localized_strings[language].search_error + ". <a id='es_retry' style='cursor: pointer;'>" + localized_strings[language].search_error_retry + ".</a></div>");

			$("#es_retry").click(function() {
				processing = false;
				$("#es_error_msg").remove();
				load_search_results();
			});
		});
	}
}

function is_element_in_viewport($elem) {
	// only concerned with vertical at this point
	var elem_offset = $elem.offset(),
		elem_bottom = elem_offset.top + $elem.height(),
		viewport_top = jQuery(window).scrollTop(),
		viewport_bottom = window.innerHeight + viewport_top;

	return (elem_bottom <= viewport_bottom && elem_offset.top >= viewport_top);
}

// Enable continuous scrolling of search results
function endless_scrolling() {
	storage.get(function(settings) {
		if (settings.contscroll === undefined) { settings.contscroll = true; storage.set({'contscroll': settings.contscroll}); }
		if (settings.contscroll) {

			var result_count;
			$(document.body).append('<link rel="stylesheet" type="text/css" href="http://store.akamai.steamstatic.com/public/css/v6/home.css">');
			$(".search_pagination_right").css("display", "none");
			if ($(".search_pagination_left").text().trim().match(/(\d+)$/)) {
				result_count = $(".search_pagination_left").text().trim().match(/(\d+)$/)[0];
				$(".search_pagination_left").text(result_count + " Results");
			}

			$(window).scroll(function () {
				// if the pagination element is in the viewport, continue loading
				if (is_element_in_viewport($(".search_pagination_left"))) {
					if (result_count > $('.search_result_row').length)
						load_search_results();
					else
						$(".search_pagination_left").text('All ' + result_count + ' results displayed');
				}
			});
		}
	});
}

function add_hide_buttons_to_search() {
	storage.get(function(settings) {
		if (settings.hide_owned === undefined) { settings.hide_owned = false; chrome.storage.sync.set({'hide_owned': settings.hide_owned}); }
		if (settings.hide_wishlist === undefined) { settings.hide_wishlist = false; chrome.storage.sync.set({'hide_wishlist': settings.hide_wishlist}); }
		if (settings.hide_cart === undefined) { settings.hide_cart = false; chrome.storage.sync.set({'hide_cart': settings.hide_cart}); }
		if (settings.hide_notdiscounted === undefined) { settings.hide_notdiscounted = false; chrome.storage.sync.set({'hide_notdiscounted': settings.hide_notdiscounted}); }
		if (settings.hide_notinterested === undefined) { settings.hide_notinterested = false; chrome.storage.sync.set({'hide_notinterested': settings.hide_notinterested}); }
		
		$("#advsearchform").find(".rightcol").prepend("<div class='block' id='es_hide_menu'><div class='block_header'><div>" + localized_strings[language].hide + "</div></div><div class='block_content block_content_inner'><div class='tab_filter_control' id='es_owned_games'><div class='tab_filter_control_checkbox'></div><span class='tab_filter_control_label'>" + localized_strings[language].options.owned + "</span></div><div class='tab_filter_control' id='es_wishlist_games'><div class='tab_filter_control_checkbox'></div><span class='tab_filter_control_label'>" + localized_strings[language].options.wishlist + "</span></div><div class='tab_filter_control' id='es_cart_games'><div class='tab_filter_control_checkbox'></div><span class='tab_filter_control_label'>" + localized_strings[language].options.cart + "</span></div><div class='tab_filter_control' id='es_notdiscounted'><div class='tab_filter_control_checkbox'></div><span class='tab_filter_control_label'>" + localized_strings[language].notdiscounted + "</span></div><div class='tab_filter_control' id='es_notinterested'><div class='tab_filter_control_checkbox'></div><span class='tab_filter_control_label'>" + localized_strings[language].notinterested + "</span></div></div></div>")

		if (settings.hide_owned) {
			$("#es_owned_games").addClass("checked");
		}

		if (settings.hide_wishlist) {
			$("#es_wishlist_games").addClass("checked");
		}

		if (settings.hide_cart) {
			$("#es_cart_games").addClass("checked");
		}

		if (settings.hide_notdiscounted) {
			$("#es_notdiscounted").addClass("checked");
		}

		if (settings.hide_notinterested) {
			$("#es_notinterested").addClass("checked");
		}

		function add_hide_buttons_to_search_click() {
			$(".search_result_row").each(function() {
				$(this).css("display", "block");
				if ($("#es_owned_games").is(".checked") && $(this).is(".ds_owned")) { $(this).css("display", "none"); }
				if ($("#es_wishlist_games").is(".checked") && $(this).is(".ds_wishlist")) { $(this).css("display", "none"); }
				if ($("#es_cart_games").is(".checked") && $(this).is(".ds_incart")) { $(this).css("display", "none"); }
				if ($("#es_notdiscounted").is(".checked") && $(this).find(".search_discount").children("span").length == 0) { $(this).css("display", "none"); }
				if ($("#es_notinterested").is(".checked")) { highlight_notinterested(this); }
			});
		}

		$("#es_owned_games").click(function() {
			if ($("#es_owned_games").hasClass("checked")) {
				$("#es_owned_games").removeClass("checked");
				chrome.storage.sync.set({'hide_owned': false });
			} else {
				$("#es_owned_games").addClass("checked");
				chrome.storage.sync.set({'hide_owned': true });
			}
			add_hide_buttons_to_search_click();
		});

		$("#es_wishlist_games").click(function() {
			if ($("#es_wishlist_games").hasClass("checked")) {
				$("#es_wishlist_games").removeClass("checked");
				chrome.storage.sync.set({'hide_wishlist': false });
			} else {
				$("#es_wishlist_games").addClass("checked");
				chrome.storage.sync.set({'hide_wishlist': true });
			}
			add_hide_buttons_to_search_click();
		});

		$("#es_cart_games").click(function() {
			if ($("#es_cart_games").hasClass("checked")) {
				$("#es_cart_games").removeClass("checked");
				chrome.storage.sync.set({'hide_cart': false });
			} else {
				$("#es_cart_games").addClass("checked");
				chrome.storage.sync.set({'hide_cart': true });
			}
			add_hide_buttons_to_search_click();
		});

		$("#es_notdiscounted").click(function() {
			if ($("#es_notdiscounted").hasClass("checked")) {
				$("#es_notdiscounted").removeClass("checked");
				chrome.storage.sync.set({'hide_notdiscounted': false });
			} else {
				$("#es_notdiscounted").addClass("checked");
				chrome.storage.sync.set({'hide_notdiscounted': true });
			}
			add_hide_buttons_to_search_click();
		});

		$("#es_notinterested").click(function() {
			if ($("#es_notinterested").hasClass("checked")) {
				$("#es_notinterested").removeClass("checked");
				chrome.storage.sync.set({'hide_notinterested': false });
			} else {
				$("#es_notinterested").addClass("checked");
				chrome.storage.sync.set({'hide_notinterested': true });
			}
			add_hide_buttons_to_search_click();
		});
	});
}

function set_homepage_tab() {
	storage.get(function(settings) {
		if (settings.homepage_tab_selection === undefined) { settings.homepage_tab_selection = "remember"; storage.set({'homepage_tab_selection': settings.homepage_tab_selection}); }
		$(".home_tabs_row").find("div").on("click", function(e) {
			var current_button = $(this).parent().attr("id");			
			storage.set({'homepage_tab_last': current_button});
		});

		if (settings.homepage_tab_selection == "remember") {
			settings.homepage_tab_selection = settings.homepage_tab_last;
		}

		$("#" + settings.homepage_tab_selection).click();
	});
}

function add_popular_tab() {
	$(".home_tabs_row").find(".home_tab:last").after("<div class='home_tab' id='es_popular'><div class='tab_content'>" + localized_strings[language].popular + "</div></div>");
	var tab_html = "<div id='tab_popular_content' class='tab_content' style='display: none;'>";

	$(".home_tabs_content").append(tab_html);

	$("#es_popular").on("click", function() {
		$(".home_tabs_row").find(".active").removeClass("active");
		$(".home_tabs_content").find(".tab_content").hide();
		$("#es_popular").addClass("active");
		$("#tab_popular_content").show();

		if ($("#tab_popular_content").find("div").length == 0) {
			get_http("http://store.steampowered.com/stats", function(txt) {
				var return_text = $.parseHTML(txt);
				var i = 0;
				$(return_text).find(".player_count_row").each(function() {
					if (i < 10) {
						var appid = get_appid($(this).find("a").attr("href"));
						var game_name = $(this).find("a").text();
						var currently = $(this).find(".currentServers:first").text();
						var html = "<div class='tab_item app_impression_tracked' data-ds-appid='" + appid + "' onmouseover='GameHover( this, event, \"global_hover\", {\"type\":\"app\",\"id\":\"" + appid + "\",\"public\":0,\"v6\":1} );' onmouseout='HideGameHover( this, event, \"global_hover\" )' id='tab_row_popular_" + appid + "'>";
						html += "<a class='tab_item_overlay' href='http://store.steampowered.com/app/" + appid + "/?snr=1_4_4__106'><img src='http://store.akamai.steamstatic.com/public/images/blank.gif'></a><div class='tab_item_overlay_hover'></div>";
						html += "<img class='tab_item_cap' src='http://cdn.akamai.steamstatic.com/steam/apps/" + appid + "/capsule_184x69.jpg'>";
						html += "<div class='tab_item_content'><div class='tab_item_name'>" + game_name + "</div><div class='tab_item_details'>" + currently + " " + localized_strings[language].charts.playing_now + "</div><br clear='all'></div>";

						html += "</div>";
						$("#tab_popular_content").append(html);
						i++;
					}
				});
				$("#tab_popular_content").append("<div class='tab_see_more'>See more: <a href='http://store.steampowered.com/stats/' class='btnv6_blue_hoverfade btn_small_tall'><span>Popular Games</span></a></div>");
			});
		}
	});
}

function add_allreleases_tab() {
	var button_text = $("#tab_newreleases_content").find(".tab_see_more a:last").text();
	$(".home_tabs_row").find(".home_tab:first").after("<div class='home_tab' id='es_allreleases'><div class='tab_content'>" + button_text + "</div></div>");
	var tab_html = "<div id='tab_allreleases_content' class='tab_content' style='display: none;'>";

	$(".home_tabs_content").append(tab_html);

	function get_allreleases_results(search) {
		$("#tab_allreleases_content .tab_item, #tab_allreleases_content .tab_see_more").remove();
		get_http("http://store.steampowered.com/search/?sort_by=Released_DESC&category1=" + search, function(txt) {
			var return_text = $.parseHTML(txt);
			$(return_text).find(".search_result_row").each(function(i, item) {
				var appid = get_appid($(this).attr("href"));
				var game_name = $(this).find(".title").text();
				var platform = $(this).find(".search_name p:last").html();
				var release_date = $(this).find(".search_released").text();
				var discount_pct = $(this).find(".search_discount span:last").text();
				var price = $(this).find(".search_price").html();
				var html = "<div class='tab_item app_impression_tracked' data-ds-appid='" + appid + "' onmouseover='GameHover( this, event, \"global_hover\", {\"type\":\"app\",\"id\":\"" + appid + "\",\"public\":0,\"v6\":1} );' onmouseout='HideGameHover( this, event, \"global_hover\" )' id='tab_row_popular_" + appid + "'>";
				html += "<a class='tab_item_overlay' href='http://store.steampowered.com/app/" + appid + "/?snr=1_4_4__106'><img src='http://store.akamai.steamstatic.com/public/images/blank.gif'></a><div class='tab_item_overlay_hover'></div>";
				html += "<img class='tab_item_cap' src='http://cdn.akamai.steamstatic.com/steam/apps/" + appid + "/capsule_184x69.jpg'>";
				// price info
				if (discount_pct) {
					html += "<div class='discount_block tab_item_discount'><div class='discount_pct'>" + discount_pct + "</div><div class='discount_prices'>" + price + "</div></div>";
				} else {
					html += "<div class='discount_block tab_item_discount no_discount'><div class='discount_prices no_discount'><div class='discount_final_price'>" + price + "</div></div></div>";
				}

				html += "<div class='tab_item_content'><div class='tab_item_name'>" + game_name + "</div><div class='tab_item_details'> " + platform + "<div class='tab_item_top_tags'><span class='top_tag'>" + release_date + "</span></div></div><br clear='all'></div>";

				html += "</div>";
				$("#tab_allreleases_content").append(html);
				return i < 9;
			});
			var button = $("#tab_newreleases_content").find(".tab_see_more").clone();
			$("#tab_allreleases_content").append(button);
		});
	}

	function generate_search_string() {
		var deferred = $.Deferred();
		var return_str = "";
		storage.get(function(settings) {
			if (settings.show_allreleases_games) { return_str += "998,"; }
			if (settings.show_allreleases_video) { return_str += "999,"; }
			if (settings.show_allreleases_demos) { return_str += "10,"; }
			if (settings.show_allreleases_mods) { return_str += "997,"; }
			if (settings.show_allreleases_packs) { return_str += "996,"; }
			if (settings.show_allreleases_dlc) { return_str += "21,"; }
			if (settings.show_allreleases_guide) { return_str += "995,"; }
			if (settings.show_allreleases_softw) { return_str += "994,"; }
			deferred.resolve(return_str);
		});

		return deferred.promise();
	}

	$("#es_allreleases").on("click", function() {
		$(".home_tabs_row").find(".active").removeClass("active");
		$(".home_tabs_content").find(".tab_content").hide();
		$("#es_allreleases").addClass("active");
		$("#tab_allreleases_content").show();

		if ($("#tab_allreleases_content").find("div").length == 0) {
			$("#tab_allreleases_content").append("<div id='es_allreleases_btn' class='home_actions_ctn' style='margin-bottom: 4px; display: none;'><div class='home_btn home_customize_btn' style='z-index: 13; position: absolute; right: -2px;'>" + localized_strings[language].customize + "</div></div>");
			
			storage.get(function(settings) {
				if (settings.show_allreleases_games === undefined) { settings.show_allreleases_games = true; storage.set({'show_allreleases_games': settings.show_allreleases_games}); }
				if (settings.show_allreleases_video === undefined) { settings.show_allreleases_video = true; storage.set({'show_allreleases_video': settings.show_allreleases_video}); }
				if (settings.show_allreleases_demos === undefined) { settings.show_allreleases_demos = true; storage.set({'show_allreleases_demos': settings.show_allreleases_demos}); }
				if (settings.show_allreleases_mods === undefined) { settings.show_allreleases_mods = true; storage.set({'show_allreleases_mods': settings.show_allreleases_mods}); }
				if (settings.show_allreleases_packs === undefined) { settings.show_allreleases_packs = true; storage.set({'show_allreleases_packs': settings.show_allreleases_packs}); }
				if (settings.show_allreleases_dlc === undefined) { settings.show_allreleases_dlc = true; storage.set({'show_allreleases_dlc': settings.show_allreleases_dlc}); }
				if (settings.show_allreleases_guide === undefined) { settings.show_allreleases_guide = true; storage.set({'show_allreleases_guide': settings.show_allreleases_guide}); }
				if (settings.show_allreleases_softw === undefined) { settings.show_allreleases_softw = true; storage.set({'show_allreleases_softw': settings.show_allreleases_softw}); }

				var html = "<div class='home_viewsettings_popup' style='display: none; z-index: 12; right: 0px; top: 58px;'><div class='home_viewsettings_instructions' style='font-size: 12px;'>" + localized_strings[language].allreleases_products + "</div>"

				// Games
				text = localized_strings[language].games;
				if (settings.show_allreleases_games) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_games'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
				else { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_games'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }

				// Videos / Trailers
				text = localized_strings[language].videos;
				if (settings.show_allreleases_video) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_video'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
				else { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_video'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";	}

				// Demos
				text = localized_strings[language].demos;
				if (settings.show_allreleases_demos) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_demos'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
				else { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_demos'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }

				// Mods
				text = localized_strings[language].mods;
				if (settings.show_allreleases_mods) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_mods'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
				else { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_mods'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }

				// Packs
				text = localized_strings[language].packs;
				if (settings.show_allreleases_packs) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_packs'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
				else { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_packs'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";	}

				// Downloadable Content
				text = localized_strings[language].dlc;
				if (settings.show_allreleases_dlc) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_dlc'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
				else { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_dlc'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }

				// Guides
				text = localized_strings[language].guides;
				if (settings.show_allreleases_guide) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_guide'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
				else { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_guide'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }

				// Software
				text = localized_strings[language].software;
				if (settings.show_allreleases_softw) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_softw'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
				else { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_softw'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }

				$("#es_allreleases_btn").append(html);

				var search_string = generate_search_string();
				search_string.done(function(result){
					get_allreleases_results(result);
				});

				$("#tab_allreleases_content").hover(function() {
					$("#es_allreleases_btn").show();
				}, function() {
					$("#es_allreleases_btn").hide();
					$("#es_allreleases_btn").find(".home_viewsettings_popup").hide();
					if ($("#es_allreleases_btn").find(".home_customize_btn").hasClass("active")) {
						$("#es_allreleases_btn").find(".home_customize_btn").removeClass("active");
					}
				});

				$("#es_allreleases_btn").find(".home_customize_btn").click(function() {
					if ($(this).hasClass("active")) {
						$(this).removeClass("active");
					} else {
						$(this).addClass("active");
					}

					if ($(this).parent().find(".home_viewsettings_popup").is(":visible")) {
						$(this).parent().find(".home_viewsettings_popup").hide();
					} else {
						$(this).parent().find(".home_viewsettings_popup").show();
					}
				});

				$("#es_allreleases_btn").find(".home_viewsettings_checkboxrow").click(function() {
					var setting_name = $(this).attr("id");
					if (settings[setting_name]) {
						settings[setting_name] = false;
						$(this).find(".home_viewsettings_checkbox").removeClass("checked");
					} else {
						settings[setting_name] = true;
						$(this).find(".home_viewsettings_checkbox").addClass("checked");
					}
					var obj = {};
					obj[setting_name] = settings[setting_name];
					storage.set(obj);

					var search_string = generate_search_string();
					search_string.done(function(result){
						get_allreleases_results(result);
					});
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

function add_steamrep_api() {
	storage.get(function(settings) {
		if (settings.showsteamrepapi === undefined) { settings.showsteamrepapi = true; storage.set({'showsteamrepapi': settings.showsteamrepapi}); }
		if(settings.showsteamrepapi) {
			if ($("#reportAbuseModal").length > 0) { var steamID = document.getElementsByName("abuseID")[0].value; }
			if (steamID === undefined && document.documentElement.outerHTML.match(/steamid"\:"(.+)","personaname/)) { var steamID = document.documentElement.outerHTML.match(/steamid"\:"(.+)","personaname/)[1]; }
			get_http("//api.enhancedsteam.com/steamrep/?steam64=" + steamID, function (txt) {
				if (txt == "") return;
				if ($(".profile_in_game").length == 0) {
					$(".profile_rightcol").prepend(txt);
				} else {
					$(".profile_rightcol .profile_in_game:first").after(txt);
				}
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
			if ($("#game_area_metascore")) {
				var metalink = $("#game_area_metalink").find("a").attr("href");
				get_http("http://api.enhancedsteam.com/metacritic/?mcurl=" + metalink, function (txt) {
					var metauserscore = parseFloat(txt)*10;
					var newmeta = '<div id="game_area_metascore" style="background-image: url(' + chrome.extension.getURL("img/metacritic_bg.png") + ');"><span>' + metauserscore + '</span><span class="ms_slash">/</span><span class="ms_base">100</span></div>';
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
							+ "<a class='linkbar' href='" + escapeHTML(data['hltb']['url']) + "' target='_blank'>" + localized_strings[language].more_information + " <img src='http://cdn2.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"
							+ "<a class='linkbar' href='" + escapeHTML(data['hltb']['submit_url']) + "' target='_blank'>" + localized_strings[language].hltb.submit + " <img src='http://cdn2.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"
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
			$('#demo_block').prepend('<a class="btnv6_blue_hoverfade btn_medium pcgw_btn" target="_blank" href="http://pcgamingwiki.com/api/appid.php?appid=' + appid + '" style="display: block; margin-bottom: 6px;"><span><i class="ico16" style="background-image:url(' + chrome.extension.getURL("img/pcgw.png") + ')"></i>&nbsp;&nbsp; ' + localized_strings[language].wiki_article.replace("__pcgw__","PCGamingWiki") + '</span></a>');
		}
	});
}

// Add link to Steam Card Exchange
function add_steamcardexchange_link(appid){
	storage.get(function(settings) {
		if (settings.showsteamcardexchange === undefined ){ settings.showsteamcardexchange = false; storage.set({'showsteamcardexchange': settings.showsteamcardexchange}); }
		if (settings.showsteamcardexchange) {
			if ($(".icon").find('img[src$="/ico_cards.png"]').length > 0) {
				$("#demo_block").prepend('<a class="btnv6_blue_hoverfade btn_medium cardexchange_btn" target="_blank" href="http://www.steamcardexchange.net/index.php?gamepage-appid-' + appid + '" style="display: block; margin-bottom: 6px;"><span><i class="ico16" style="background-image:url(' + chrome.extension.getURL("img/steamcardexchange.png") + ')"></i>&nbsp;&nbsp; ' + localized_strings[language].view_in + ' Steam Card Exchange</span></a>');
			}
		}
	});
}

function add_app_page_highlights() {
	storage.get(function(settings) {		
		if (settings.highlight_owned) {
			if ($(".game_area_already_owned").find(".ds_owned_flag").length > 0) {
				$(".apphub_AppName").css("color", settings.highlight_owned_color);
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
							var fkg = data["node"]["Grade4k"];
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
							if (path) { html += "</center><br><a class='linkbar' target='_blank' href='" + escapeHTML(path) + "'>" + localized_strings[language].rating_details + " <img src='http://cdn2.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"; }
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
							if ($(p).find(".market_listing_gainorloss").text().trim() === "+") {
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
							if ($(p).find(".market_listing_gainorloss").text().trim() === "-") {
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
				var count = 500;
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

				var complete = 0,
					base_page = false;

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
									if (complete == available_currencies.length - 1) start_total();
								});
							} else {
								complete += 1;
								if (complete == available_currencies.length - 1) start_total();
							}
						} else {
							get_http("//firefox.enhancedsteam.com/api/currency/?" + local_currency.toLowerCase() + "=1&local=" + currency_type.toLowerCase(), function(txt) {
								complete += 1;
								setValue(currency_type + "to" + local_currency, parseFloat(txt));
								setValue(currency_type + "to" + local_currency + "_time", parseInt(Date.now() / 1000, 10));
								if (complete == available_currencies.length - 1) start_total();
							});
						}
					}
				});

				function start_total() {
					if (window.location.pathname == "/account/") {
						base_page = true;
						$(".accountBalance").before("<div class='es_loading' style='text-align: center;'><span>" + localized_strings[language].loading + "</span></div>");
						$(document.body).append("<div id='store_transactions' style='display: none;'><div class='block'></div><div class='block'></div></div><div id='ingame_transactions' style='display: none;'></div><div id='market_transactions' style='display: none;'></div>");
						$("#store_transactions .block:first").load("https://store.steampowered.com/account/store_transactions #store_transactions .block:first .transactionRow", function() {
							$("#store_transactions .block:last").load("https://store.steampowered.com/account/store_transactions #store_transactions .block:last .transactionRow", function() {
								$("#ingame_transactions").load("https://store.steampowered.com/account/ingame_transactions #ingame_transactions .transactionRow", function() {
									$("#market_transactions").load("https://store.steampowered.com/account/market_transactions #market_transactions .transactionRow", function() {
										$(".es_loading").remove();
										get_total();
									});
								});
							});
						});
					} else {
						get_total();
					}
				}

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
						var currency_type = currency_symbol_to_type(currency_symbol),
							html = '';
						
						if (game_total != 0) {
							game_total = formatCurrency(parseFloat(game_total), currency_type);
							html += '<div class="accountRow accountBalance accountSpent">';
							html += '<div class="accountData price">' + game_total + '</div>';
							html += '<div class="accountLabel">' + localized_strings[language].store_transactions + ':</div></div>';
						}
						
						if (gift_total != 0) {
							gift_total = formatCurrency(parseFloat(gift_total), currency_type);
							html += '<div class="accountRow accountBalance accountSpent">';
							html += '<div class="accountData price">' + gift_total + '</div>';
							html += '<div class="accountLabel">' + localized_strings[language].gift_transactions + ':</div></div>';
						}
						
						if (ingame_total != 0) {
							ingame_total = formatCurrency(parseFloat(ingame_total), currency_type);
							html += '<div class="accountRow accountBalance accountSpent">';
							html += '<div class="accountData price">' + ingame_total + '</div>';
							html += '<div class="accountLabel">' + localized_strings[language].game_transactions + ':</div></div>';
						}
						
						if (market_total != 0) {
							market_total = formatCurrency(parseFloat(market_total), currency_type);
							html += '<div class="accountRow accountBalance accountSpent">';
							html += '<div class="accountData price">' + market_total + '</div>';
							html += '<div class="accountLabel">' + localized_strings[language].market_transactions + ':</div></div>';
							html += '<div class="inner_rule"></div>';
						}
						
						if (base_page) {
							total_total = formatCurrency(parseFloat(total_total), currency_type);
							html += '<div class="accountRow accountBalance accountSpent">';
							html += '<div class="accountData price">' + total_total + '</div>';
							html += '<div class="accountLabel">' + localized_strings[language].total_spent + ':</div></div>';
							html += '<div class="inner_rule"></div>';
						}

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
		es_market_helper.textContent = 'jQuery("#inventories").on("click", ".itemHolder, .newitem", function() { window.postMessage({ type: "es_sendmessage", information: [iActiveSelectView,g_ActiveInventory.selectedItem.marketable,g_ActiveInventory.appid,g_ActiveInventory.selectedItem.market_hash_name,g_ActiveInventory.selectedItem.market_fee_app,g_ActiveInventory.selectedItem.type,g_ActiveInventory.selectedItem.id] }, "*"); });';
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
	var assetID = response[6];
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

			function inventory_market_helper_get_price(url) {
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
			}

			if (getValue("steam_currency_number")) {
				inventory_market_helper_get_price("http://steamcommunity.com/market/priceoverview/?currency=" + getValue("steam_currency_number") + "&appid=" + global_id + "&market_hash_name=" + hash_name);
			} else {
				get_http("http://store.steampowered.com/app/220/", function(txt) {
					var currency = parse_currency($(txt).find(".price, .discount_final_price").text().trim());
					setValue("steam_currency_number", currency.currency_number);
					inventory_market_helper_get_price("http://steamcommunity.com/market/priceoverview/?currency=" + currency.currency_number + "&appid=" + global_id + "&market_hash_name=" + hash_name);
				});
			}
		} else {
			if (hash_name && hash_name.match(/Booster Pack/g)) {
				setTimeout(function() {
					var currency = parse_currency($("#iteminfo" + item + "_item_market_actions").text().match(/\:(.+)/)[1]);
					var api_url = "http://api.enhancedsteam.com/market_data/average_card_price/?appid=" + appid + "&cur=" + currency.currency_type.toLowerCase();

					get_http(api_url, function(price_data) {
						var booster_price = parseFloat(price_data,10) * 3;
						html = localized_strings[language].avg_price_3cards + ": " + formatCurrency(booster_price, currency.currency_type) + "<br>";
						$("#iteminfo" + item + "_item_market_actions").find("div:last").css("margin-bottom", "8px");
						$("#iteminfo" + item + "_item_market_actions").find("div:last").append(html);
					});
				}, 1000);
			}
			storage.get(function(settings) {
				if (settings.show1clickgoo === undefined) { settings.show1clickgoo = true; storage.set({'show1clickgoo': settings.show1clickgoo}); }
				if (settings.show1clickgoo) {
					$("#es_quickgrind").remove();
					var turn_word = $("#iteminfo" + item + "_item_scrap_link span").text();
					$("#iteminfo" + item + "_item_scrap_actions").find("div:last").before("<div><a class='btn_small btn_green_white_innerfade' id='es_quickgrind' appid='" + appid + "'assetid='" + assetID + "'><span>1-Click " + turn_word + "</span></div>");
					$("#es_quickgrind").on("click", function() {
						runInPageContext("function() { \
							var rgAJAXParams = {\
								sessionid: g_sessionID,\
								appid: " + $(this).attr("appid") + ",\
								assetid: " + $(this).attr("assetID") + ",\
								contextid: 6\
							};\
							var strActionURL = g_strProfileURL + '/ajaxgetgoovalue/';\
							$J.get( strActionURL, rgAJAXParams ).done( function( data ) {\
								strActionURL = g_strProfileURL + '/ajaxgrindintogoo/';\
								rgAJAXParams.goo_value_expected = data.goo_value;\
								$J.post( strActionURL, rgAJAXParams).done( function( data ) {\
									ReloadCommunityInventory();\
								});\
							});\
						}");
					});
				}
			});
		}
	}
}

function hide_empty_inventory_tabs() {
	var tab_count = 0;
	$('div.games_list_tabs > a[id^="inventory_link_"]').each(function() {
		var separator = $(this).next('div[class^="games_list_tab_"]');
		$(this).removeClass('first_tab fourth_tab');
		if (parseInt($(this).children('span.games_list_tab_number').html().replace(/,/g, '').match(/\d+/)[0]) == 0) {
			$(this).hide();
			separator.hide();
		} else {
			tab_count += 1;
		}

		tab_count == 1 && $(this).addClass('first_tab');
		tab_count == 4 && $(this).addClass('fourth_tab');
		separator.removeClass().addClass(((tab_count > 0) && (tab_count%4 == 0)) ? 'games_list_tab_row_separator' : 'games_list_tab_separator');
	});
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
		$bundle_price = $(".package_totals_area").find(".price:last");

	setTimeout(function() {
		$.each($(".tab_item"), function (i, node) {
			var price_container = $(node).find(".discount_final_price").text().trim(),
				itemPrice = 0;

			if (price_container) {
				var price = parse_currency(price_container);
				if (price) itemPrice = price.value;
			}
			if ($(node).find(".ds_owned_flag").length === 0) {
				not_owned_games_prices += itemPrice;
			}
		});

		var bundle_price = parse_currency($bundle_price.text());
		if (bundle_price) {
			var corrected_price = not_owned_games_prices - bundle_price.value;
			var $message = $('<div class="savings">' + formatCurrency(corrected_price, bundle_price.currency_type) + '</div>');
			if ($("#package_savings_bar").length === 0) {
				$(".package_totals_area").append("<div id='package_savings_bar'><div class='savings'></div><div class='message'>" + localized_strings[language].bundle_saving_text + "</div></div>");
			}
			if (corrected_price < 0) $message[0].style.color = "red";
			$('.savings').replaceWith($message);
		}
	}, 500);
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
                    html += "<div class='game_area_details_specs'><div class='icon'><img src='http://www.enhancedsteam.com/gamedata/icons/" + escapeHTML(value['icon']) + "' align='top'></div><a class='name' title='" + escapeHTML(value['text']) + "'>" + escapeHTML(index) + "</a></div>";
                });
			}

			html += "</div><a class='linkbar' style='margin-top: 10px;' href=\"http://www.enhancedsteam.com/gamedata/dlc_category_suggest.php?appid=" + appid + "&appname=" + appname + "\" target='_blank'>" + localized_strings[language].dlc_suggest + "</a></div></div></div>";

			$("#demo_block").after(html);
    	});
    }
}

function dlc_data_for_dlc_page() {
	var totalunowned = 0;
	var sessionid;
	var addunowned = "<form name=\"add_all_unowned_dlc_to_cart\" action=\"http://store.steampowered.com/cart/\" method=\"POST\"><input type=\"hidden\" name=\"action\" value=\"add_to_cart\">";

	window.setTimeout(function() {
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
						html += "<div class='game_area_details_specs'><div class='icon'><img src='http://www.enhancedsteam.com/gamedata/icons/" + escapeHTML(value['icon']) + "' align='top'></div><a class='name'><span title='" + escapeHTML(value['text']) + "' style='cursor: default;'>" + escapeHTML(index) + "</span></a></div>";
					});
				}

				html += "</div>";

				$(node).css("height", "144px");
				$(node).append(html);
			});

			if (!sessionid) {
				sessionid = $(node).find("input[name=sessionid]").attr("value");
				addunowned += "<input type=\"hidden\" name=\"sessionid\" value=\"" + sessionid + "\">";	
			} 
			if (appid) {
				if ($(node).find(".ds_owned_flag").length == 0) {
					addunowned += "<input type=\"hidden\" name=\"subid[]\" value=\"" + $(node).find("input[name=subid]").attr("value") + "\">";
					totalunowned = totalunowned + 1;
				}
			}
		});

		addunowned += "</form>";

		if (totalunowned > 0) {
			$("#dlc_purchaseAll").before(addunowned);
			var buttoncode = "<div class='btn_addtocart' style='float: right; margin-right: 15px;' id='dlc_purchaseAllunOwned'><a class='btnv6_green_white_innerfade btn_medium' href=\"javascript:document.forms['add_all_unowned_dlc_to_cart'].submit();\"><span>" + localized_strings[language].add_unowned_dlc_to_cart + "</span></a></div>";
			$("#dlc_purchaseAll").after(buttoncode);
		}
	}, 500);
}

function add_app_badge_progress(appid) {
	if (is_signed_in) {
		if ($(".icon").find('img[src$="/ico_cards.png"]').length > 0) {
			$("#category_block").after("<div class='block'><div class='block_header'><h4>Badge Progress</h4></div><div class='block_content_inner'><link rel='stylesheet' type='text/css' href='http://cdn.steamcommunity.com/public/css/skin_1/badges.css'><div class='es_badge_progress'></div><div class='es_foil_badge_progress'></div></div>");
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
						$(".es_badge_progress").after("<div class='game_area_details_specs'><div class='icon'><img src='http://store.akamai.steamstatic.com/public/images/v6/ico/ico_cards.png' width=24 height=16 border=0 align=top></div><a href='http://steamcommunity.com/my/gamecards/" + appid + "/' class='name'>" + localized_strings[language].view_badge + "</a></div>");
					} else {
						$(".es_badge_progress").after("<div class='game_area_details_specs'><div class='icon'><img src='http://store.akamai.steamstatic.com/public/images/v6/ico/ico_cards.png' width=24 height=16 border=0 align=top></div><a href='http://steamcommunity.com/my/gamecards/" + appid + "/' class='name'>" + localized_strings[language].badge_progress + "</a></div>");
					}
					if(show_card_num){
						$(".es_badge_progress").after("<div style='padding-top: 2px; padding-bottom: 10px; margin-left: 44px; color: #67c1f5;'>" + localized_strings[language].cards_owned.replace("__owned__", card_num_owned).replace("__possible__", card_num_total) + "</div>");
					}
					$(".es_badge_progress").after("<div style='padding-top: 10px; padding-bottom: 10px; margin-left: 44px; color: #67c1f5;'>" + $(responseText).find(".progress_info_bold").text() + "</div>");
					$(".es_badge_progress").after("<div style=\"clear: both\"></div>");
					$(".es_badge_progress .badge_info_description").css({"width":"275px"});
					$(".es_badge_progress .badge_empty_circle").css({"margin":"0px 46px 14px 8px","border-radius":"46px"});
					$(".es_badge_progress .badge_empty_right div:last-child").remove();
					$(".es_badge_progress .badge_empty_right").append("<div class=\"badge_empty_name\">" + localized_strings[language].badge_not_unlocked + "</div>").append("<div style=\"clear: both\"></div>");
				} else {
					$(".es_badge_progress").remove();
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
							$(".es_foil_badge_progress").after("<div class='game_area_details_specs'><div class='icon'><img src='http://store.akamai.steamstatic.com/public/images/v6/ico/ico_cards.png' width=24 height=16 border=0 align=top></div><a href='http://steamcommunity.com/my/gamecards/" + appid + "/' class='name'>" + localized_strings[language].view_badge_foil + "</a><div>");
						} else {
							$(".es_foil_badge_progress").after("<div class='game_area_details_specs'><div class='icon'><img src='http://store.akamai.steamstatic.com/public/images/v6/ico/ico_cards.png' width=24 height=16 border=0 align=top></div><a href='http://steamcommunity.com/my/gamecards/" + appid + "/' class='name'>" + localized_strings[language].badge_foil_progress + "</a><div>");
						}
						if(show_card_num){
							$(".es_foil_badge_progress").after("<div style='padding-top: 2px; padding-bottom: 10px; margin-left: 44px; color: #67c1f5;'>" + localized_strings[language].cards_owned.replace("__owned__", card_num_owned).replace("__possible__", card_num_total) + "</div>");
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
		if ($(this).find("input").val()) {
			$(this).find(".game_area_dlc_name").prepend("<input type='checkbox' class='es_dlc_selection' style='cursor: default;' id='es_select_dlc_" + $(this).find("input").val() + "' value='" + $(this).find("input").val() + "'><label for='es_select_dlc_" + $(this).find("input").val() + "' style='background-image: url( " + chrome.extension.getURL("img/check_sheet.png") + ");'></label>");
		} else {
			$(this).find(".game_area_dlc_name").css("margin-left", "23px");
		}	
	}).hover(function() { 
		$(this).find(".ds_flag").hide();
	}, function() { 
		$(this).find(".ds_flag").show();
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

	$(".game_area_dlc_section").find(".gradientbg").append("<a id='es_dlc_option_button'>" + localized_strings[language].thewordoptions + " ▾</a>");
	
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
			$("#achievement_block").append("<div class='game_area_details_specs'><div class='icon'><img src='" + chrome.extension.getURL("img/ico/astatsnl.png") + "' style='margin-left: 4px'></div><a class='name' href='http://astats.astats.nl/astats/Steam_Game_Info.php?AppID=" + appid + "' target='_blank'><span>" + localized_strings[language].view_astats + "</span></a>");
		}
	});
}

function add_achievement_completion_bar(appid) {
	$(".myactivity_block").find(".details_block").after("<div id='es_ach_stats' style='margin-bottom: 9px; margin-top: -16px; float: right;'></div>");
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
	storage.get(function(settings) {
		if (settings.show_early_access === undefined) { settings.show_early_access = true; storage.set({'show_early_access': settings.show_early_access}); }
		if (settings.show_early_access) {
			var href = ($(node).find("a").attr("href") || $(node).attr("href"));
			var appid = get_appid(href);
			if (appid === null) { 
				if ($(node).find("img").length > 0) {
					if ($(node).find("img").attr("src").match(/\/apps\/(\d+)\//)) {
						appid = $(node).find("img").attr("src").match(/\/apps\/(\d+)\//)[1];
					}
				}
			}
			var early_access = JSON.parse(ea_appids);
			if (early_access["ea"].indexOf(appid) >= 0) {
				var selector = "img";
				if (selector_modifier != undefined) selector += selector_modifier;
				overlay_img = $("<img class='es_overlay' src='" + chrome.extension.getURL("img/overlay/" + image_name) + "'>");
				$(overlay_img).css({"left":image_left+"px"});
				$(node).find(selector.trim()).before(overlay_img);
			}
		}
	});
}

// Add a blue banner to Early Access games
function process_early_access() {
	storage.get(function(settings) {
		if (settings.show_early_access === undefined) { settings.show_early_access = true; storage.set({'show_early_access': settings.show_early_access}); }
		if (settings.show_early_access) {
			ea_promise.done(function(){
				switch (window.location.host) {
					case "store.steampowered.com":
						switch (true) {
							case /^\/app\/.*/.test(window.location.pathname):
								$(".game_header_image").append("<a href='" + window.location.href + "'></a>");
								$(".game_header_image_ctn").each(function(index, value) { check_early_access($(this), "ea_292x136.png", $(this).position().left); });
								$(".small_cap").each(function(index, value) { check_early_access($(this), "ea_184x69.png", 15); });
								break;
							case /^\/(?:genre|browse|tag)\/.*/.test(window.location.pathname):
								$(".tab_item").each(function(index, value) { check_early_access($(this), "ea_231x87.png", 0, ":last"); });
								$(".special_tiny_cap").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", 0); });
								$(".cluster_capsule").each(function(index, value) { check_early_access($(this), "ea_467x181.png", 0); });
								$(".game_capsule").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", 0); });
								$(".dq_item:not(:first-child)").each(function(index, value) { check_early_access($(this), "ea_467x181.png", 0); });
								break;
							case /^\/search\/.*/.test(window.location.pathname):
								$(".search_result_row").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", 0); });
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
								$(".home_smallcap").each(function(index, value) { check_early_access($(this), "ea_184x69.png", 15); });
								$(".cap").each(function(index, value) { check_early_access($(this), "ea_292x136.png", 0); });
								$(".special").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", 0); });
								$(".game_capsule").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", 0); });
								$(".cluster_capsule").each(function(index, value) { check_early_access($(this), "ea_467x181.png", 0); });
								$(".recommended_spotlight_ctn").each(function(index, value) { check_early_access($(this), "ea_292x136.png", 0); });
								$(".curated_app_link").each(function(index, value) { check_early_access($(this), "ea_292x136.png", 0); });
								$(".tab_item").each(function(index, value) { check_early_access($(this), "ea_184x69.png", 0, ":last"); });
								$(".dailydeal_ctn").find("a").each(function(index, value) { check_early_access($(this), "ea_292x136.png", 0); });
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
							case /^\/(?:id|profiles)\/(.+)\/followedgames/.test(window.location.pathname):
								$(".gameLogo").each(function(index, value) { check_early_access($(this), "ea_184x69.png", 4); });
								break;
							case /^\/(?:id|profiles)\/.+\/\b(home|myactivity|status)\b/.test(window.location.pathname):
								$(".blotter_gamepurchase_content").find("a").each(function(index, value) {
									check_early_access($(this), "ea_231x87.png", $(this).position().left);
								});
								break;
							case /^\/(?:id|profiles)\/.+\/\b(reviews|recommended)\b/.test(window.location.pathname):
								$(".leftcol").each(function(index, value) { check_early_access($(this), "ea_184x69.png", $(this).position().left + 8); });
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
				if (sale) {
					all_game_areas = $(".sale_page_purchase_item").toArray();
				}
				var subid_info = [];
				var subid_array = [];

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
						$.each(subid_info,function(subid_index,package_info){
							currency_deferred.push(
								$.ajax({
									url:api_url,
									data:{
										packageids:package_info["subid"],
										cc:cc
									}
								}).done(function(data){
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
								})
							);
						});
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
									if (sale){
										switch(settings.showregionalprice){
											case "always":
												$(".sale_page_purchase_item").eq(index).css({"height":"auto", "min-height":"136px"}).prepend(app_pricing_div);
												break;
											default:
												$(".sale_page_purchase_item").eq(index).find(".game_purchase_action_bg").after(app_pricing_div);
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
												$(".game_purchase_action").css("z-index", "1");
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
											$(app_package).find(".discount_block").css({"padding-left":"25px","background-image":"url("+world+")","background-repeat":"no-repeat","background-position":"77px 8px","background-color":"#000000"});
											$(app_package).find(".discount_prices").css({"background":"none"});
										}
										$(app_package).find(".price, .discount_block")
										.mouseover(function() {
											var purchase_location = $(app_package).find("div.game_purchase_action_bg").offset();
											if (sale) {
												$("#es_pricing_" + subid).css("right", $(app_package).find(".game_purchase_action").width() + 25 +"px").css("top", "138px");
											} else if (sub) {
												$("#es_pricing_" + subid).css("right", $(app_package).find(".game_purchase_action").width() + 25 + "px").css("top", "70px");
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

function customize_app_page() {
	// Add a "Customize" button
	$(".purchase_area_spacer:last").after("<link rel='stylesheet' type='text/css' href='http://store.akamai.steamstatic.com/public/css/v6/home.css'><div id='es_customize_btn' class='home_actions_ctn'><div class='home_btn home_customize_btn'>" + localized_strings[language].customize + "</div></div>");

	storage.get(function(settings) {
		if (settings.show_apppage_recommendedbycurators === undefined) { settings.show_apppage_recommendedbycurators = true; storage.set({'show_apppage_recommendedbycurators': settings.show_apppage_recommendedbycurators}); }
		if (settings.show_apppage_recentupdates === undefined) { settings.show_apppage_recentupdates = true; storage.set({'show_apppage_recentupdates': settings.show_apppage_recentupdates}); }
		if (settings.show_apppage_reviews === undefined) { settings.show_apppage_reviews = true; storage.set({'show_apppage_reviews': settings.show_apppage_reviews}); }
		if (settings.show_apppage_about === undefined) { settings.show_apppage_about = true; storage.set({'show_apppage_about': settings.show_apppage_about}); }
		if (settings.show_apppage_sysreq === undefined) { settings.show_apppage_sysreq = true; storage.set({'show_apppage_sysreq': settings.show_apppage_sysreq}); }
		if (settings.show_apppage_legal === undefined) { settings.show_apppage_legal = true; storage.set({'show_apppage_legal': settings.show_apppage_legal}); }
		if (settings.show_apppage_morelikethis === undefined) { settings.show_apppage_morelikethis = true; storage.set({'show_apppage_morelikethis': settings.show_apppage_morelikethis}); }
		if (settings.show_apppage_customerreviews === undefined) { settings.show_apppage_customerreviews = true; storage.set({'show_apppage_customerreviews': settings.show_apppage_customerreviews}); }

		var html = "<div class='home_viewsettings_popup' style='display: none'><div class='home_viewsettings_instructions' style='font-size: 12px;'>" + localized_strings[language].apppage_sections + "</div>"
		html += "<div class='home_viewsettings_checkboxrow ellipsis disabled'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + localized_strings[language].apppage_purchase + "</div></div>";
		
		// Recommended by Curators
		if ($(".steam_curators_block").length > 0) {
			var text = $(".steam_curators_block").find("h2:first").text();		
			if (settings.show_apppage_recommendedbycurators) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_recommendedbycurators'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_recommendedbycurators'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$(".steam_curators_block").hide();
			}
		}
		
		// Recent updates
		if ($(".early_access_announcements").length > 0) {
			var text_search = $(".early_access_announcements").find("h2:first").clone();
			$("span", text_search).remove();
			text = $(text_search).text();
			if (settings.show_apppage_recentupdates) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_recentupdates'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_recentupdates'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$(".early_access_announcements").hide();
			}
		}
		
		// Reviews
		if ($("#game_area_reviews").length > 0) {
			text = $("#game_area_reviews").find("h2:first").text();
			if (settings.show_apppage_reviews) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_reviews'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_reviews'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$("#game_area_reviews").hide();
			}
		}

		// Rewards from Playfire
		if (settings.show_playfire_info) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_playfire'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + localized_strings[language].playfire_heading + "</div></div>"; }
		else {
			html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_playfire'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + localized_strings[language].playfire_heading + "</div></div>";
		}

		// About this game
		if ($("#game_area_description").length > 0) {
			text = $("#game_area_description").find("h2:first").text();
			if (settings.show_apppage_about) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_about'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_about'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$("#game_area_description").parent().parent().hide();
			}
		}

		// Steam charts
		if (settings.show_steamchart_info) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_current'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + localized_strings[language].charts.current + "</div></div>"; }
		else { 
			html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_current'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + localized_strings[language].charts.current + "</div></div>"; 
		}
		
		// System Requirements
		if ($(".sys_req").length > 0) {
			text = $(".sys_req").find("h2:first").text();
			if (settings.show_apppage_sysreq) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_sysreq'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_sysreq'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$(".sys_req").parent().hide();
			}
		}

		// Legal Information
		if ($("#game_area_legal").length > 0) {
			if (settings.show_apppage_legal) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_legal'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + localized_strings[language].apppage_legal + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_legal'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + localized_strings[language].apppage_legal + "</div></div>";
				$("#game_area_legal").hide();
			}
		}

		// More like this
		if ($("#recommended_block").length > 0) {
			text = $("#recommended_block").find("h4:first").text();
			if (settings.show_apppage_morelikethis) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_morelikethis'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_morelikethis'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$("#recommended_block").hide();
			}
		}

		// Helpful customer reviews
		if ($(".user_reviews_header").length > 0) {
			text_search = $(".user_reviews_header:first").clone();
			$("div", text_search).remove();
			text = $(text_search).text();
			if (settings.show_apppage_customerreviews) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_customerreviews'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_customerreviews'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$(".user_reviews_header").hide();
				$(".user_reviews_filter_bar").hide();
				$(".loading_more_reviews").hide();
				$(".user_reviews_container").hide();
				$("#app_reviews_hash").hide();
			}
		}

		$("#es_customize_btn").append(html);
		$("#es_customize_btn").after("<div style='clear: both;'></div>");

		$("#es_customize_btn").find(".home_customize_btn").click(function() {
			if ($(this).hasClass("active")) {
				$(this).removeClass("active");
			} else {
				$(this).addClass("active");
			}

			if ($(this).parent().find(".home_viewsettings_popup").is(":visible")) {
				$(this).parent().find(".home_viewsettings_popup").hide();
			} else {
				var pos_top = $("#es_customize_btn").offset().top + 20;
				var pos_left = $("#es_customize_btn").offset().left - 150;
				$(this).parent().find(".home_viewsettings_popup").css("top", pos_top + "px").css("left", pos_left + "px");
				$(this).parent().find(".home_viewsettings_popup").show();
			}
		});

		$('body').bind('click', function(e) {
			if($(e.target).closest("#es_customize_btn").length == 0) {
				if ($("#es_customize_btn").find(".home_customize_btn").hasClass("active")) {
					$("#es_customize_btn").find(".home_customize_btn").removeClass("active");
				}
				if ($("#es_customize_btn").find(".home_viewsettings_popup").is(":visible")) {
					$("#es_customize_btn").find(".home_viewsettings_popup").hide();
				}
			}
		});

		$("#show_apppage_recommendedbycurators").click(function() {
			if (settings.show_apppage_recommendedbycurators) {
				settings.show_apppage_recommendedbycurators = false;
				$(".steam_curators_block").hide();
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_apppage_recommendedbycurators = true;
				$(".steam_curators_block").show();
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
			}
			storage.set({'show_apppage_recommendedbycurators': settings.show_apppage_recommendedbycurators});
		});

		$("#show_apppage_recentupdates").click(function() {
			if (settings.show_apppage_recentupdates) {
				settings.show_apppage_recentupdates = false;
				$(".early_access_announcements").hide();
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_apppage_recentupdates = true;
				$(".early_access_announcements").show();
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
			}
			storage.set({'show_apppage_recentupdates': settings.show_apppage_recentupdates});
		});

		$("#show_apppage_reviews").click(function() {
			if (settings.show_apppage_reviews) {
				settings.show_apppage_reviews = false;
				$("#game_area_reviews").hide();
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_apppage_reviews = true;
				$("#game_area_reviews").show();
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
			}
			storage.set({'show_apppage_reviews': settings.show_apppage_reviews});
		});

		$("#show_apppage_playfire").click(function() {
			if (settings.show_playfire_info) {
				settings.show_playfire_info = false;
				$("#es_playfire").hide();
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_playfire_info = true;
				$("#es_playfire").show();
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
			}
			storage.set({'show_playfire_info': settings.show_playfire_info});

			if (settings.show_playfire_info && $("#es_playfire").length == 0) {
				var appid = get_appid(window.location.host + window.location.pathname);
				get_playfire_rewards(appid);
			}
		});

		$("#show_apppage_about").click(function() {
			if (settings.show_apppage_about) {
				settings.show_apppage_about = false;
				$("#game_area_description").parent().parent().hide();
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_apppage_about = true;
				$("#game_area_description").parent().parent().show();
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
			}
			storage.set({'show_apppage_about': settings.show_apppage_about});
		});

		$("#show_apppage_current").click(function() {
			if (settings.show_steamchart_info) {
				settings.show_steamchart_info = false;
				$("#steam-charts").hide();
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_steamchart_info = true;
				$("#steam-charts").show();
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
			}
			storage.set({'show_steamchart_info': settings.show_steamchart_info});

			if (settings.show_steamchart_info && $("#steam-charts").length == 0) {
				var appid = get_appid(window.location.host + window.location.pathname);
				add_steamchart_info(appid);
			}
		});

		$("#show_apppage_sysreq").click(function() {
			if (settings.show_apppage_sysreq) {
				settings.show_apppage_sysreq = false;
				$(".sys_req").parent().hide();
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_apppage_sysreq = true;
				$(".sys_req").parent().show();
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
			}
			storage.set({'show_apppage_sysreq': settings.show_apppage_sysreq});
		});

		$("#show_apppage_legal").click(function() {
			if (settings.show_apppage_legal) {
				settings.show_apppage_legal = false;
				$("#game_area_legal").hide();
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_apppage_legal = true;
				$("#game_area_legal").show();
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
			}
			storage.set({'show_apppage_legal': settings.show_apppage_legal});
		});

		$("#show_apppage_morelikethis").click(function() {
			if (settings.show_apppage_morelikethis) {
				settings.show_apppage_morelikethis = false;
				$("#recommended_block").hide();
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_apppage_morelikethis = true;
				$("#recommended_block").show();
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
			}
			storage.set({'show_apppage_morelikethis': settings.show_apppage_morelikethis});
		});

		$("#show_apppage_customerreviews").click(function() {
			if (settings.show_apppage_customerreviews) {
				settings.show_apppage_customerreviews = false;
				$(".user_reviews_header").hide();
				$(".user_reviews_filter_bar").hide();
				$(".loading_more_reviews").hide();
				$(".user_reviews_container").hide();
				$("#app_reviews_hash").hide();
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_apppage_customerreviews = true;
				$(".user_reviews_header").show();
				$(".user_reviews_filter_bar").show();				
				$("#Reviews_all").show();
				$("#app_reviews_hash").show();
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
			}
			storage.set({'show_apppage_customerreviews': settings.show_apppage_customerreviews});
		});
	});
}

function customize_home_page() {
	$(".home_page_content:first").append("<div id='es_customize_btn' class='home_actions_ctn' style='margin-bottom: 4px;'><div class='home_btn home_customize_btn' style='z-index: 13;'>" + localized_strings[language].customize + "</div></div><div style='clear: both;'></div>");
	$(".home_page_body_ctn:first").css("min-height", "400px");
	$(".has_takeover").css("min-height", "600px");

	storage.get(function(settings) {
		if (settings.show_homepage_carousel === undefined) { settings.show_homepage_carousel = true; storage.set({'show_homepage_carousel': settings.show_homepage_carousel}); }
		if (settings.show_homepage_spotlight === undefined) { settings.show_homepage_spotlight = true; storage.set({'show_homepage_spotlight': settings.show_homepage_spotlight}); }
		if (settings.show_homepage_newsteam === undefined) { settings.show_homepage_newsteam = true; storage.set({'show_homepage_newsteam': settings.show_homepage_newsteam}); }
		if (settings.show_homepage_updated === undefined) { settings.show_homepage_updated = true; storage.set({'show_homepage_updated': settings.show_homepage_updated}); }
		if (settings.show_homepage_recommended === undefined) { settings.show_homepage_recommended = true; storage.set({'show_homepage_recommended': settings.show_homepage_recommended}); }
		if (settings.show_homepage_explore === undefined) { settings.show_homepage_explore = true; storage.set({'show_homepage_explore': settings.show_homepage_explore}); }
		if (settings.show_homepage_curators === undefined) { settings.show_homepage_curators = true; storage.set({'show_homepage_curators': settings.show_homepage_curators}); }
		if (settings.show_homepage_tabs === undefined) { settings.show_homepage_tabs = true; storage.set({'show_homepage_tabs': settings.show_homepage_tabs}); }
		if (settings.show_homepage_specials === undefined) { settings.show_homepage_specials = true; storage.set({'show_homepage_specials': settings.show_homepage_specials}); }
		if (settings.show_homepage_under_ten === undefined) { settings.show_homepage_under_ten = true; storage.set({'show_show_homepage_under_ten': settings.show_homepage_under_ten}); }
		if (settings.show_homepage_sidebar === undefined) { settings.show_homepage_sidebar = true; storage.set({'show_homepage_sidebar': settings.show_homepage_sidebar}); }

		var html = "<div class='home_viewsettings_popup' style='display: none; z-index: 12; right: 18px;'><div class='home_viewsettings_instructions' style='font-size: 12px;'>" + localized_strings[language].apppage_sections + "</div>"

		// Carousel
		if ($("#home_main_cluster").length > 0) {
			text = localized_strings[language].homepage_carousel;
			if (settings.show_homepage_carousel) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_carousel'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_carousel'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$("#home_main_cluster").parent().hide();
			}
		}

		// Spotlight
		if ($("#spotlight_scroll").length > 0) {
			text = localized_strings[language].homepage_spotlight;
			if (settings.show_homepage_spotlight) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_spotlight'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_spotlight'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$("#spotlight_scroll").parent().parent().hide();
			}
		}

		// New on Steam
		if ($(".new_on_steam").length > 0) {
			text = $(".new_on_steam").find("a:first").text();
			if (settings.show_homepage_newsteam) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_newsteam'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_newsteam'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$(".new_on_steam").hide();
			}
		}

		// Recently Updated
		if ($(".recently_updated").length > 0) {
			text = $(".recently_updated").find("a:first").text();
			if (settings.show_homepage_updated) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_updated'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_updated'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$(".recently_updated").hide();
			}
		}

		// Recommended For You
		if ($(".recommended").length > 0) {
			text = $(".recommended").find("h2:first").text();
			if (settings.show_homepage_recommended) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_recommended'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_recommended'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$(".recommended").hide();
			}
		}

		// Explore Your Queue
		if ($(".discovery_queue_ctn").length > 0) {
			text = $(".discovery_queue_ctn").find("a:first").text();
			if (settings.show_homepage_explore) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_explore'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_explore'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$(".discovery_queue_ctn").hide();
				$("#content_callout").hide();
				$("#content_loading").hide();
			}
		}

		// Steam Curators
		if ($(".apps_recommended_by_curators_ctn").length > 0) {
			text = $(".apps_recommended_by_curators_ctn").find("a:first").text();
			if (settings.show_homepage_curators) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_curators'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_curators'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$(".apps_recommended_by_curators_ctn").hide();
				$(".steam_curators_ctn").hide();
			}
		}

		// Homepage Tabs
		if ($(".home_tab_col").length > 0) {
			text = localized_strings[language].homepage_tabs;
			if (settings.show_homepage_tabs) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_tabs'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_tabs'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$(".home_tab_col").hide();
			}
		}

		var specials_section_parent = $(".dailydeal_ctn").parent();
		specials_section_parent.parent().find("h2:first, .dailydeal_ctn, .home_specials_grid:first, .home_block_footer:first, .home_specials_spacer").wrapAll("<div id='es_specials_section' />");
		specials_section_parent.parent().find("h2:last, .home_specials_grid:last, .home_block_footer:last").wrapAll("<div id='es_under_ten_section' />");
		
		// Specials
		if ($("#es_specials_section").length > 0) {
			text = $("#es_specials_section h2").text();
			if (settings.show_homepage_specials) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_specials'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_specials'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$("#es_specials_section").hide();
			}
		}
    
		// Under 10€
		if ($("#es_under_ten_section").length > 0) {
			text = $("#es_under_ten_section h2").text();
			if (settings.show_homepage_under_ten) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_under_ten'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_under_ten'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$("#es_under_ten_section").hide();
			}
		}

		// Sidebar
		if ($(".home_page_gutter").length > 0) {
			text = localized_strings[language].homepage_sidebar;
			if (settings.show_homepage_sidebar) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_sidebar'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_sidebar'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$(".home_page_gutter").hide();
				$(".home_page_body_ctn").css("margin-left", "0px");
				$(".home_page_content").css("padding-left", "0px");
				$(".has_takeover").find(".page_background_holder").css("margin-left", "-202px");
			}
		}

		$("#es_customize_btn").append(html);

		$("#es_customize_btn").find(".home_customize_btn").click(function() {
			if ($(this).hasClass("active")) {
				$(this).removeClass("active");
			} else {
				$(this).addClass("active");
			}

			if ($(this).parent().find(".home_viewsettings_popup").is(":visible")) {
				$(this).parent().find(".home_viewsettings_popup").hide();
			} else {
				$(this).parent().find(".home_viewsettings_popup").show();
			}
		});

		$('body').bind('click', function(e) {
			if($(e.target).closest("#es_customize_btn").length == 0) {
				if ($("#es_customize_btn").find(".home_customize_btn").hasClass("active")) {
					$("#es_customize_btn").find(".home_customize_btn").removeClass("active");
				}
				if ($("#es_customize_btn").find(".home_viewsettings_popup").is(":visible")) {
					$("#es_customize_btn").find(".home_viewsettings_popup").hide();
				}
			}
		});

		$("#show_homepage_carousel").click(function() {
			if (settings.show_homepage_carousel) {
				settings.show_homepage_carousel = false;
				$("#home_main_cluster").parent().hide();
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_homepage_carousel = true;
				$("#home_main_cluster").parent().show();
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
			}
			storage.set({'show_homepage_carousel': settings.show_homepage_carousel});
		});

		$("#show_homepage_spotlight").click(function() {
			if (settings.show_homepage_spotlight) {
				settings.show_homepage_spotlight = false;
				$("#spotlight_scroll").parent().parent().hide();
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_homepage_spotlight = true;
				$("#spotlight_scroll").parent().parent().show();
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
			}
			storage.set({'show_homepage_spotlight': settings.show_homepage_spotlight});
		});

		$("#show_homepage_newsteam").click(function() {
			if (settings.show_homepage_newsteam) {
				settings.show_homepage_newsteam = false;
				$(".new_on_steam").hide();
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_homepage_newsteam = true;
				$(".new_on_steam").show();
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
			}
			storage.set({'show_homepage_newsteam': settings.show_homepage_newsteam});
		});

		$("#show_homepage_updated").click(function() {
			if (settings.show_homepage_updated) {
				settings.show_homepage_updated = false;
				$(".recently_updated").hide();
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_homepage_updated = true;
				$(".recently_updated").show();
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
			}
			storage.set({'show_homepage_updated': settings.show_homepage_updated});
		});

		$("#show_homepage_recommended").click(function() {
			if (settings.show_homepage_recommended) {
				settings.show_homepage_recommended = false;
				$(".recommended").hide();
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_homepage_recommended = true;
				$(".recommended").show();
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
			}
			storage.set({'show_homepage_recommended': settings.show_homepage_recommended});
		});

		$("#show_homepage_explore").click(function() {
			if (settings.show_homepage_explore) {
				settings.show_homepage_explore = false;
				$(".discovery_queue_ctn").hide();
				$("#content_callout").hide();
				$("#content_loading").hide();
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_homepage_explore = true;
				$(".discovery_queue_ctn").show();
				$("#content_callout").show();
				$("#content_loading").show();
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
			}
			storage.set({'show_homepage_explore': settings.show_homepage_explore});
		});

		$("#show_homepage_curators").click(function() {
			if (settings.show_homepage_curators) {
				settings.show_homepage_curators = false;
				$(".apps_recommended_by_curators_ctn").hide();
				$(".steam_curators_ctn").hide();
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_homepage_curators = true;
				if ($("#apps_recommended_by_curators").children().length > 0) {
					$(".apps_recommended_by_curators_ctn").show();
				} else {
					$(".steam_curators_ctn").show();
				}	
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
			}
			storage.set({'show_homepage_curators': settings.show_homepage_curators});
		});

		$("#show_homepage_tabs").click(function() {
			if (settings.show_homepage_tabs) {
				settings.show_homepage_tabs = false;
				$(".home_tab_col").hide();
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_homepage_tabs = true;
				$(".home_tab_col").show();
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
			}
			storage.set({'show_homepage_tabs': settings.show_homepage_tabs});
		});

		$("#show_homepage_specials").click(function() {
			if (settings.show_homepage_specials) {
				settings.show_homepage_specials = false;
				$("#es_specials_section").hide();
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_homepage_specials = true;
				$("#es_specials_section").show();
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
			}
			storage.set({'show_homepage_specials': settings.show_homepage_specials});
		});

		$("#show_homepage_under_ten").click(function() {
			if (settings.show_homepage_under_ten) {
				settings.show_homepage_under_ten = false;
				$("#es_under_ten_section").hide();
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_homepage_under_ten = true;
				$("#es_under_ten_section").show();
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
			}
			storage.set({'show_homepage_under_ten': settings.show_homepage_under_ten});
		});

		$("#show_homepage_sidebar").click(function() {
			if (settings.show_homepage_sidebar) {
				settings.show_homepage_sidebar = false;
				$(".home_page_gutter").hide();
				$(".home_page_body_ctn").css("margin-left", "0px");
				$(".home_page_content").css("padding-left", "0px");
				$(".has_takeover").find(".page_background_holder").css("margin-left", "-202px");
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_homepage_sidebar = true;
				$(".home_page_gutter").show();
				$(".home_page_content").css("padding-left", "204px");
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
				$(".has_takeover").find(".page_background_holder").css("margin-left", "0px");
			}
			storage.set({'show_homepage_sidebar': settings.show_homepage_sidebar});
		});
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

        get_http('https://store.steampowered.com/account/store_transactions', function (txt) {
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

				if (node.classList && node.classList.contains("tab_item")) {
					runInPageContext("function() { GDynamicStore.DecorateDynamicItems( jQuery('.tab_item') ) }");
					start_highlighting_node(node);
					check_early_access(node, "ea_231x87.png", 0, ":last");
				}

				if (node.id == "search_result_container") {
					processing = false;
					endless_scrolling();
					start_highlights_and_tags();
					process_early_access();
				}

				if ($(node).children('div')[0] && $(node).children('div')[0].classList.contains("blotter_day")) {
					start_friend_activity_highlights();
					process_early_access();
				}

				if (node.classList && node.classList.contains("browse_tag_games")) {
					start_highlights_and_tags();
					process_early_access();
				}

				if (node.classList && node.classList.contains("match")) { 
					start_highlighting_node(node);
					check_early_access(node, "ea_184x69.png", 0);
				}

				if (node.classList && node.classList.contains("search_result_row")) {
					start_highlighting_node(node);
					check_early_access(node, "ea_sm_120.png", 0);
				}

				if (node.classList && node.classList.contains("market_listing_row_link")) highlight_market_items();				
				if ($(node).parent()[0] && $(node).parent()[0].classList.contains("search_result_row")) start_highlighting_node($(node).parent()[0]);
			}
		});
	});
	observer.observe(document, { subtree: true, childList: true });
}

function start_highlights_and_tags(){
	// Batch all the document.ready appid lookups into one storefront call.
	var selectors = [
		"div.tab_row",				// Storefront rows
		"div.dailydeal_ctn",
		"div.wishlistRow",			// Wishlist rows
		"a.game_area_dlc_row",			// DLC on app pages
		"a.small_cap",				// Featured storefront items and "recommended" section on app pages
		"a.home_smallcap",
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
		"div.similar_grid_item",			// Items on the "Similarly tagged" pages
		"div.tab_item",			// Items on new homepage
		"div.special",			// new homepage specials
		"div.curated_app_item"	// curated app items!
	];
		
	setTimeout(function() {
		$.each(selectors, function (i, selector) {
			$.each($(selector), function(j, node){
				var node_to_highlight = node;
				if ($(node).hasClass("item")) { node_to_highlight = $(node).find(".info")[0]; }
				if ($(node).hasClass("home_area_spotlight")) { node_to_highlight = $(node).find(".spotlight_content")[0]; }

				if ($(node).find(".ds_owned_flag").length > 0) {
					highlight_owned(node_to_highlight);
				}

				if ($(node).find(".ds_wishlist_flag").length > 0) {
					highlight_wishlist(node_to_highlight);
				}

				if ($(node).find(".ds_incart_flag").length > 0) {
					highlight_cart(node_to_highlight);
				}

				if ($(node).hasClass("search_result_row") && $(node).find(".search_discount").not(":has('span')").length > 0) {
					highlight_nondiscounts(node_to_highlight);
				}

				var appid = get_appid(node.href || $(node).find("a").attr("href")) || get_appid_wishlist(node.id);
				if (appid) {
					if (getValue(appid + "guestpass")) highlight_inv_guestpass(node);
					if (getValue(appid + "coupon")) highlight_coupon(node, getValue(appid + "coupon_discount"));
					if (getValue(appid + "gift")) highlight_inv_gift(node);
					highlight_notinterested(node);
				}
			});
		});
	}, 500);
}

function start_friend_activity_highlights() {
	var owned_promise = (function () {
		var deferred = new $.Deferred();
		if (is_signed_in && window.location.protocol != "https:") {
			var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
			var last_updated = getValue("dynamicflist_time") || expire_time - 1;

			if (last_updated < expire_time) {
				get_http("http://store.steampowered.com/dynamicstore/userdata/", function(txt) {
					var data = JSON.parse(txt);
					if (data["rgOwnedApps"]) {
						setValue("owned_apps", data["rgOwnedApps"].toString());
					}
					if (data["rgWishlist"]) {
						setValue("wishlist_apps", data["rgWishlist"].toString());
					}
					setValue("dynamicflist_time", parseInt(Date.now() / 1000, 10));
					deferred.resolve();
				});
			} else {
				deferred.resolve();
			}
		} else {
			deferred.resolve();
		}
		
		return deferred.promise();
	})();

	$.when.apply($, [owned_promise]).done(function() {
		var selectors = [
			".blotter_author_block a",
			".blotter_gamepurchase_details a",
			".blotter_daily_rollup_line a"
		],
			ownedapps = getValue("owned_apps").split(","),
			wishlistapps = getValue("wishlist_apps").split(",");

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
					if (getValue(appid + "guestpass")) highlight_inv_guestpass(node);
					if (getValue(appid + "coupon")) highlight_coupon(node, getValue(appid + "coupon_discount"));
					if (getValue(appid + "gift")) highlight_inv_gift(node);
					if ($.inArray(appid, wishlistapps) !== -1) highlight_wishlist(node);
					if ($.inArray(appid, ownedapps) !== -1) highlight_owned(node);
				}
			});
		});
	});
}

function start_highlighting_node(node) {
	var node_to_highlight = node;
	if ($(node).hasClass("item")) { node_to_highlight = $(node).find(".info")[0]; }
	if ($(node).hasClass("home_area_spotlight")) { node_to_highlight = $(node).find(".spotlight_content")[0]; }

	if ($(node).find(".ds_owned_flag").length > 0) {
		highlight_owned(node_to_highlight);
	}

	if ($(node).find(".ds_wishlist_flag").length > 0) {
		highlight_wishlist(node_to_highlight);
	}

	if ($(node).find(".ds_incart_flag").length > 0) {
		highlight_cart(node_to_highlight);
	}

	if ($(node).hasClass("search_result_row") && $(node).find(".search_discount").not(":has('span')").length > 0) {
		highlight_nondiscounts(node_to_highlight);
	}

	var appid = get_appid(node.href || $(node).find("a")[0].href) || get_appid_wishlist(node.id);
	if (getValue(appid + "guestpass")) highlight_inv_guestpass(node);
	if (getValue(appid + "coupon")) highlight_coupon(node, getValue(appid + "coupon_discount"));
	if (getValue(appid + "gift")) highlight_inv_gift(node);
	highlight_notinterested(node);
}

// Add a link to an item's page on steamdb.info
function add_steamdb_links(appid, type) {
	storage.get(function(settings) {
		if (settings.showsteamdb === undefined) { settings.showsteamdb = true; storage.set({'showsteamdb': settings.showsteamdb}); }
		if (settings.showsteamdb) {
			switch (type) {
				case "gamehub":
					$(".apphub_OtherSiteInfo").append('<a class="btnv6_blue_hoverfade btn_medium steamdb_ico" target="_blank" href="http://steamdb.info/app/' + appid + '/"><span><i class="ico16" style="background-image:url('+ chrome.extension.getURL("img/steamdb_store.png") +')"></i>&nbsp; Steam Database</span></a>');
					break;
				case "gamegroup":
					$('#rightActionBlock' ).append('<div class="actionItemIcon"><img src="' + chrome.extension.getURL("img/steamdb.png") + '" width="16" height="16" alt=""></div><a class="linkActionMinor" target="_blank" href="http://steamdb.info/app/' + appid + '/">' + localized_strings[language].view_in + ' Steam Database</a>');
					break;
				case "app":
					$('#demo_block').prepend('<a class="btnv6_blue_hoverfade btn_medium steamdb_ico" target="_blank" href="http://steamdb.info/app/' + appid + '/" style="display: block; margin-bottom: 6px;"><span><i class="ico16" style="background-image:url('+ chrome.extension.getURL("img/steamdb_store.png") +')"></i>&nbsp; &nbsp;' + localized_strings[language].view_in + ' Steam Database</span></a>');
					break;
				case "sub":
					$(".share").before('<a class="btnv6_blue_hoverfade btn_medium steamdb_ico" target="_blank" href="http://steamdb.info/sub/' + appid + '/" style="display: block; margin-bottom: 6px;"><span><i class="ico16" style="background-image:url('+ chrome.extension.getURL("img/steamdb_store.png") +')"></i>&nbsp; &nbsp;' + localized_strings[language].view_in + ' Steam Database</span></a>');
					break;
			}

			$(".steamdb_ico").hover(
				function() {
					$(this).find("i").css("background-image", "url("+ chrome.extension.getURL("img/steamdb_store_black.png") +")");
				}, function() {
					$(this).find("i").css("background-image", "url("+ chrome.extension.getURL("img/steamdb_store.png") +")");
				}
			)
		}
	});
}

function add_familysharing_warning(appid) {
	var exfgls_appids, exfgls_promise = (function () {
		var deferred = new $.Deferred();
		if (window.location.protocol != "https:") {
			// is the data cached?
			var expire_time = parseInt(Date.now() / 1000, 10) - 8 * 60 * 60;
			var last_updated = getValue("exfgls_appids_time") || expire_time - 1;
			
			if (last_updated < expire_time) {
				// if no cache exists, pull the data from the website
				get_http("//api.enhancedsteam.com/exfgls/", function(txt) {
					exfgls_appids = txt;
					setValue("exfgls_appids", exfgls_appids);
					setValue("exfgls_appids_time", parseInt(Date.now() / 1000, 10));
					deferred.resolve();	
				});
			} else {
				exfgls_appids = getValue("exfgls_appids");
				deferred.resolve();
			}
			
			return deferred.promise();
		} else {
			deferred.resolve();
			return deferred.promise();
		}
	})();

	exfgls_promise.done(function(){
		var exfgls = JSON.parse(getValue("exfgls_appids"));
		if (exfgls["exfgls"].indexOf(appid) >= 0) {
			$("#game_area_purchase").before('<div id="purchase_note"><div class="notice_box_top"></div><div class="notice_box_content">' + localized_strings[language].family_sharing_notice + '</div><div class="notice_box_bottom"></div></div>');
		}
	});
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
								var value_to_add = "<div class='main_cap_status' style='font-size: 12px; line-height: normal;'>" + desc[1] + "</div>";
								$desc.append(value_to_add);
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

function add_achievement_comparison_link(node) {
	storage.get(function(settings) {
		if (settings.showcomparelinks === undefined) { settings.showcomparelinks = false; storage.set({'showcomparelinks': settings.showcomparelinks}); }
		if (settings.showcomparelinks) {
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
	});
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
				$(".apphub_Stats").prepend('<div class="btnv6_blue_hoverfade btn_medium" style="margin-right: 3px" id="es_wishlist"><span>' + localized_strings[language].add_to_wishlist + '</span>');
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

// Allows the user to intuitively remove an item from their wishlist on the app page
function add_app_page_wishlist_changes(appid) {
	if (is_signed_in) {
		if ($("#add_to_wishlist_area").length == 0 && $(".game_area_already_owned").length == 0) {
			$(".demo_area_button").find("a:first").removeAttr("href");
			$(".demo_area_button").find("a:first").wrap("<div id='add_to_wishlist_area_success' class='queue_control_button'></div>");
			
			// Add wishlist areas
			$(".demo_area_button").prepend("<div id='add_to_wishlist_area' style='display: none;' class='queue_control_button'><a class='btnv6_blue_hoverfade btn_medium' href='javascript:AddToWishlist( " + appid + ", \"add_to_wishlist_area\", \"add_to_wishlist_area_success\", \"add_to_wishlist_area_fail\", \"1_5_9__407\" );'><span>" + localized_strings[language].add_to_wishlist + "</span></a></div><div id='add_to_wishlist_area_fail' style='display: none;'></div>");

			$("#add_to_wishlist_area_success").hover(
				function() {
					$(this).find("img").attr("src", chrome.extension.getURL("img/remove.png"));
				}, function() {
					$(this).find("img").attr("src", "http://store.akamai.steamstatic.com/public/images/v6/ico/ico_selected.png");
				}
			)

			$("#add_to_wishlist_area_success").on("click", function() {
				// get community session variable (this is different from the store session)
				get_http("http://steamcommunity.com/my/wishlist", function(txt) {
					var session = txt.match(/sessionid" value="(.+)"/)[1];
					var user = $("#account_pulldown").text();

					$.ajax({
						type:"POST",
						url: "http://steamcommunity.com/id/" + user + "/wishlist",
						data:{
							sessionid: session,
							action: "remove",
							appid: appid
						},
						success: function( msg ) {
							setValue(appid + "wishlisted", false);
							$("#add_to_wishlist_area_success").hide();
							$("#add_to_wishlist_area").show();
						}
					});
				});
			});
		}
	}
}

function clear_cache() {
	localStorage.clear();
}

function change_user_background() {
	var steamID;
	if ($("#reportAbuseModal").length > 0) { steamID = document.getElementsByName("abuseID")[0].value; }
	if (steamID === undefined && document.documentElement.outerHTML.match(/steamid"\:"(.+)","personaname/)) { steamID = document.documentElement.outerHTML.match(/steamid"\:"(.+)","personaname/)[1]; }

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
				html += "</div></div><div style='clear: left;'></div><div class='background_selector_launch_area'></div></div><div class='background_selector_launch_area'>&nbsp;<div style='float: right;'><span id='es_background_remove_btn' class='btn_grey_white_innerfade btn_small'><span>Remove</span></span>&nbsp;<span id='es_background_save_btn' class='btn_grey_white_innerfade btn_small btn_disabled'><span>" + localized_strings[language].save + "</span></span></div></div><div class='formRowTitle'>" + localized_strings[language].custom_background + ":<span class='formRowHint' title='" + localized_strings[language].custom_background_help + "'>(?)</span></div></div></div>";
				html += "</form><form id='es_profile_remove' method='POST' action='http://www.enhancedsteam.com/gamedata/profile_bg_remove.php'>";
				html += "<input type='hidden' name='steam64' value='" + steam64 + "'>";
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

				$("#es_background_remove_btn").click(function() {
					$("#es_profile_remove").submit();
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
			if (window.location.href.match(/\/games\/\?tab=all/)) {
				$(".gameListRow").each(function(index, value) {
					var appid = get_appid_wishlist(value.id);
					if ($(value).html().match(/ico_stats.png/)) {
						// Get only items with play time
						if (!($(value).html().match(/<h5><\/h5>/))) {
							// Copy achievement stats to row
							$(value).find(".gameListRowItemName").append("<div class='recentAchievements' id='es_app_" + appid + "' style='padding-top: 14px; padding-right: 4px; width: 205px; float: right; font-size: 10px; font-weight: normal;'>");
							$("#es_app_" + appid).html(localized_strings[language].loading);
							get_http($(".profile_small_header_texture a")[0].href + '/stats/' + appid, function (txt) {
								txt = txt.replace(/[ ]src=/g," data-src=");
								var parsedhtml = $.parseHTML(txt);
								$("#es_app_" + appid).html($(parsedhtml).find("#topSummaryAchievements"));
								$("#es_app_" + appid).find("img").each(function() {
									var src = $(this).attr("data-src");
									$(this).attr("src", src);
								});
								var BarFull,
									BarEmpty;
								if ($("#es_app_" + appid).html().match(/achieveBarFull\.gif" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])" height="12"/)) {
									BarFull = $("#es_app_" + appid).html().match(/achieveBarFull\.gif" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])" height="12"/)[1];
								}
								if ($("#es_app_" + appid).html().match(/achieveBarEmpty\.gif" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])" height="12"/)) {
									BarEmpty = $("#es_app_" + appid).html().match(/achieveBarEmpty\.gif" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])" height="12"/)[1];
								}	
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
			}
		}
	});
}

function add_gamelist_common() {
	if($("label").attr("for")=="show_common_games") {
		get_http('http://api.enhancedsteam.com/steamapi/GetOwnedGames/?steamid=' + is_signed_in + '&include_played_free_games=1', function (txt) {
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
	if (window.location.href.match(/\/$/) || window.location.href.match(/p\=1$/)) {
		var filter_done = false;

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

			$('#es_badge_drops').click(function(event) {
				event.preventDefault();
				$("#es_badge_drops").find("input").prop("checked", true);

				// Load additinal badge sections if multiple pages are present
				if ($(".pagebtn").length > 0 && filter_done == false) {
					var base_url = window.location.origin + window.location.pathname + "?p=",
						last_page = parseFloat($(".profile_paging:first").find(".pagelink:last").text()),
						deferred = new $.Deferred(),
						promise = deferred.promise(),
						pages = [];

					for (page = 2; page <= last_page; page++) {
						pages.push(page);
					}

					$.each(pages, function (i, item) {
						promise = promise.then(function() {
							return $.ajax(base_url + item).done(function(data) {
								var html = $.parseHTML(data);
								$(html).find(".badge_row").each(function(i, obj) {
									$(".badges_sheet").append(obj);
								});
							});
						});
					});

					promise.done(function() {
						$(".profile_paging").css("display", "none");
						filter_done = true;
						add_badge_filter_processing();
					});
					
					deferred.resolve();	
				} else {
					add_badge_filter_processing();
				}

				function add_badge_filter_processing() {
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
				}
			});
		}
	}
}

function add_badge_sort() {
	if ( $(".profile_small_header_texture a")[0].href == $(".user_avatar a")[0].href) {
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

		function add_badge_sort_drops() {
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
			$("#es_badge_sort_drops").addClass("active");
			resetLazyLoader();
		}

		var sort_drops_done = false;

		$("#es_badge_sort_drops").on("click", function() {
			if ($(".pagebtn").length > 0 && sort_drops_done == false) {
				var base_url = window.location.origin + window.location.pathname + "?p=",
					last_page = parseFloat($(".profile_paging:first").find(".pagelink:last").text()),
					deferred = new $.Deferred(),
					promise = deferred.promise(),
					pages = [];

				for (page = 2; page <= last_page; page++) {
					pages.push(page);
				}

				$.each(pages, function (i, item) {
					promise = promise.then(function() {
						return $.ajax(base_url + item).done(function(data) {
							var html = $.parseHTML(data);
							$(html).find(".badge_row").each(function(i, obj) {
								$(".badges_sheet").append(obj);
							});
						});
					});
				});

				promise.done(function() {
					$(".profile_paging").css("display", "none");
					sort_drops_done = true;
					add_badge_sort_drops();
				});

				deferred.resolve();
			} else {
				add_badge_sort_drops();
			}
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
	if ( $(".profile_small_header_texture a")[0].href == $(".user_avatar a")[0].href) {
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
							if (card) var need = card[2] - card[1];
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

						if ($(".pagebtn").length < 0 && total_worth > 0) {
							$("#es_cards_worth").text(localized_strings[language].drops_worth_avg + " " + worth_formatted);
						}
					});
				}
			});
		});
	}
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
	if ( $(".profile_small_header_texture a")[0].href == $(".user_avatar a")[0].href) {
		var drops_count = 0,
			drops_games = 0,
			booster_games = 0,
			game_tiles = [];

		if ($(".pagebtn").length > 0) {
			if (window.location.href.match(/\/$/) || window.location.href.match(/p\=1$/)) {
				$(".profile_xp_block_right").html("<span id='es_calculations' style='color: #fff;'>" + localized_strings[language].drop_calc + "</span>").css("cursor", "pointer");

				$("#es_calculations").click(function() {
					$(".profile_xp_block_right").css("cursor", "default");
					$("#es_calculations").text(localized_strings[language].loading);

					// First, get the contents of the first page
					$(".progress_info_bold").each(function(i, obj) {
						var parent = $(obj).parent().parent();
						if (parent.html().trim().match(/^<div class="badge_title_stats">/)) {
							game_tiles.push(parent);
						}
					});

					// Now, get the rest of the pages
					var base_url = window.location.origin + window.location.pathname + "?p=",
						last_page = parseFloat($(".profile_paging:first").find(".pagelink:last").text()),
						deferred = new $.Deferred(),
						promise = deferred.promise(),
						pages = [];

					for (page = 2; page <= last_page; page++) {
						pages.push(page);
					}

					$.each(pages, function (i, item) {
						promise = promise.then(function() {
							return $.ajax(base_url + item).done(function(data) {
								var html = $.parseHTML(data);
								$(html).find(".progress_info_bold").each(function(i, obj) {
									var parent = $(obj).parent().parent();
									if (parent.html().trim().match(/^<div class="badge_title_stats">/)) {
										game_tiles.push(parent);
									}
								});
							});
						});
					});

					promise.done(function() {
						add_total_drops_count_calculations(game_tiles);
					});
					
					deferred.resolve();	
				});
			}
		} else {
			$(".progress_info_bold").each(function(i, obj) {
				var parent = $(obj).parent().parent();
				if (parent.html().trim().match(/^<div class="badge_title_stats">/)) {
					game_tiles.push(parent);
				}
			});
			add_total_drops_count_calculations(game_tiles);
		}

		function add_total_drops_count_calculations(games) {
			$(games).each(function(i, obj) {
				var obj_count = obj.find(".progress_info_bold")[0].innerHTML.match(/\d+/);
				if (obj_count) {
					drops_count += parseInt(obj_count[0]);
					drops_games = drops_games + 1;
				}
			});

			$(".profile_xp_block_right").html("<span id='es_calculations' style='color: #fff;'>" + localized_strings[language].card_drops_remaining.replace("__drops__", drops_count) + "<br>" + localized_strings[language].games_with_drops.replace("__dropsgames__", drops_games) + "</span>");

			get_http("http://steamcommunity.com/my/ajaxgetboostereligibility/", function(txt) {
				var eligible = $.parseHTML(txt);
				$(eligible).find(".booster_eligibility_games").children().each(function(i, obj) {
					booster_games += 1;
				});

				$("#es_calculations").append("<br>" + localized_strings[language].games_with_booster.replace("__boostergames__", booster_games));
			});
		}

		if ($(".badge_details_set_favorite").find(".btn_grey_black").length > 0) { $(".badge_details_set_favorite").append("<div class='btn_grey_black btn_small_thin' id='es_faq_link'><span>" + localized_strings[language].faqs + "</span></div>"); }
		$("#es_faq_link").click(function() {
			window.location = "http://steamcommunity.com/tradingcards/faq";
		});
	}
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

function add_decline_button() {
	if (window.location.href.match(/tradeoffers\/$/)) {
		$(".maincontent .profile_leftcol .tradeoffer").each(function(index) {
			var offerID = $(this).attr("id").replace("tradeofferid_", "");
			$(this).prepend("<a href='javascript:DeclineTradeOffer(\"" + offerID + "\");' style='background-image: url(" + chrome.extension.getURL("img/decline.png") + ");' class='btn_grey_grey btn_es_decline'>&nbsp;</a>");
		});
	}
}

function add_birthday_celebration() {
	var profile_id = is_signed_in;
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

function add_acrtag_warning() {
	storage.get(function(settings) {
		if (settings.show_acrtag_info === undefined) { settings.show_acrtag_info = false; storage.set({'show_acrtag_info': settings.show_acrtag_info}); }
		if (settings.show_acrtag_info) {
			var acrtag_subids, acrtag_promise = (function () {
				var deferred = new $.Deferred();
				if (window.location.protocol != "https:") {
					// is the data cached?
					var expire_time = parseInt(Date.now() / 1000, 10) - 8 * 60 * 60;
					var last_updated = getValue("acrtag_subids_time") || expire_time - 1;
					
					if (last_updated < expire_time) {
						// if no cache exists, pull the data from the website
						get_http("//api.enhancedsteam.com/acrtag/", function(txt) {
							acrtag_subids = txt;
							setValue("acrtag_subids", acrtag_subids);
							setValue("acrtag_subids_time", parseInt(Date.now() / 1000, 10));
							deferred.resolve();	
						});
					} else {
						acrtag_subids = getValue("acrtag_subids");
						deferred.resolve();
					}
					
					return deferred.promise();
				} else {
					deferred.resolve();
					return deferred.promise();
				}
			})();

			acrtag_promise.done(function(){
				var all_game_areas = $(".game_area_purchase_game");
				var acrtag = JSON.parse(getValue("acrtag_subids"));

				$.each(all_game_areas,function(index,app_package){
					var subid = $(app_package).find("input[name='subid']").val();
					if (subid > 0) {
						if (acrtag["acrtag"].indexOf(subid) >= 0) {
							$(this).after('<div class="DRM_notice" style="padding-left: 17px; margin-top: 0px; padding-top: 20px; min-height: 28px;"><div class="gift_icon"><img src="' + chrome.extension.getURL("img/trading.png") + '" style="float: left; margin-right: 13px;"></div><div data-store-tooltip="' + localized_strings[language].acrtag_tooltip + '">' + localized_strings[language].acrtag_msg + '.</div></div>');
							runInPageContext("function() {BindStoreTooltip(jQuery('.DRM_notice [data-store-tooltip]')) }");
						}
					}
				});
			});
		}
	});
}

function add_review_toggle_button() {
	$("#review_create").find("h1").append("<div style='float: right;'><a class='btnv6_lightblue_blue btn_mdium' id='es_review_toggle'><span>▲</span></a></div>");
	$("#review_container").find("p, .avatar_block, .content").wrapAll("<div id='es_review_section'></div>");

	if (getValue("show_review_section")) {
		$("#es_review_toggle").find("span").text("▼");
		$("#es_review_section").hide();
	}

	$("#es_review_toggle").on("click", function() {
		if (getValue("show_review_section") == true) {
			$("#es_review_toggle").find("span").text("▲");
			$("#es_review_section").slideDown();
			setValue("show_review_section", false);
		} else {
			$("#es_review_toggle").find("span").text("▼");
			$("#es_review_section").slideUp();			
			setValue("show_review_section", true);
		}
	});
}

function get_playfire_rewards(appid) {
	storage.get(function(settings) {
		if (settings.show_playfire_info === undefined) { settings.show_playfire_info = true; storage.set({'show_playfire_info': settings.show_playfire_info}); }
		if (settings.show_playfire_info) {
			get_http("http://api.enhancedsteam.com/playfire/?appid=" + appid, function(data) {
				if (data) {
					var rewards = JSON.parse(data),
						$rewards = $('<div id="es_playfire" class="game_area_rewards_section" />');

					$rewards.html('<h2>' + localized_strings[language].playfire_heading + '</h2>');
					$rewards.append('<ul>');

					$.each(rewards, function( index, value ) {
						var reward = value,
							$li = $('<li class="reward-detail-item">');

						$li.append('<div class="reward-img"><img src="' + reward.icon + '" class="actual" alt="' + reward.name + '"></div>');
						$li.append('<div class="left-side"><span class="title tooltip-truncate">' + reward.name + '</span><span class="text">' + reward.description + '</span><span class="validity">' + localized_strings[language].valid + ': ' + reward.starts + ' - ' + reward.ends + '</span></div>');
						$li.append('<div class="game_purchase_action"><div class="game_purchase_action_bg"><div class="game_purchase_price price">' + reward.prize + '</div></div></div>');
						
						$rewards.find('ul').append($li);
					});

					if (rewards.length > 0) {
						$rewards.find('ul').after('<span class="chart-footer" style="margin-top: -15px;">Powered by <a href="https://www.playfire.com/" target="_blank">playfire.com</a></span>');
						$('#game_area_description').closest('.game_page_autocollapse_ctn').before($rewards);
					} else {
						$("#show_apppage_playfire").remove();
					}
				} else {
					$("#show_apppage_playfire").remove();
				}
			});
		}
	});
}

function add_booster_prices() {	
	var gem_word = $(".booster_creator_goostatus:first").find(".goo_display").text().trim().replace(/\d/g, "");
	runInPageContext("function() { \
		$J('#booster_game_selector option').each(function(index) {\
			if ($J(this).val()) {\
				$J(this).append(' - ' + CBoosterCreatorPage.sm_rgBoosterData[$J(this).val()].price + ' " + gem_word + "');\
			}\
		});\
	}");
}

$(document).ready(function(){
	signed_in_promise.done(function(){
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
		if (is_signed_in) {
			replace_account_name();
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
						add_app_page_wishlist_changes(appid);
						display_coupon_message(appid);
						show_pricing_history(appid, "app");
						dlc_data_from_site(appid);

						drm_warnings("app");
						add_metacritic_userscore();
						add_steamreview_userscore(appid);
						display_purchase_date();

						add_widescreen_certification(appid);
						add_hltb_info(appid);
						add_pcgamingwiki_link(appid);
						add_steamcardexchange_link(appid);
						add_app_page_highlights();
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
						add_acrtag_warning();
						add_review_toggle_button();
						get_playfire_rewards(appid);

						customize_app_page();
						break;

					case /^\/sub\/.*/.test(window.location.pathname):
						var subid = get_subid(window.location.host + window.location.pathname);
						drm_warnings("sub");
						subscription_savings_check();
						show_pricing_history(subid, "sub");
						add_steamdb_links(subid, "sub");
						add_acrtag_warning();

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
						endless_scrolling();
						add_hide_buttons_to_search();
						break;

					case /^\/sale\/.*/.test(window.location.pathname):
						show_regional_pricing();
						break;

					// Storefront-front only
					case /^\/$/.test(window.location.pathname):
						add_popular_tab();
						add_allreleases_tab();
						set_homepage_tab();
						add_carousel_descriptions();
						window.setTimeout(function() { customize_home_page(); }, 500);
						break;
				}

				// Highlights & data fetching
				start_highlights_and_tags();

				// Storefront homepage tabs
				bind_ajax_content_highlighting();
				hide_trademark_symbols();
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
						hide_empty_inventory_tabs();
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

					case /^\/(?:id|profiles)\/.+\/tradeoffers/.test(window.location.pathname):
						add_decline_button();
						break;

					case /^\/(?:id|profiles)\/.+/.test(window.location.pathname):
						add_community_profile_links();
						add_wishlist_profile_link();
						add_supporter_badges();
						change_user_background();
						add_profile_store_links();
						fix_profile_image_not_found();
						hide_spam_comments();
						add_steamrep_api();
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
						add_app_page_wishlist(appid);
						hide_spam_comments();
						add_steamdb_links(appid, "gamehub");
						break;

					case /^\/games\/.*/.test(window.location.pathname):
						var appid = document.querySelector( 'a[href*="http://steamcommunity.com/app/"]' );
						appid = appid.href.match( /(\d)+/g );
						add_steamdb_links(appid, "gamegroup");
						break;

					case /^\/tradingcards\/boostercreator/.test(window.location.pathname):
						add_booster_prices();
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
});
