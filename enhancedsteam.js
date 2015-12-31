var version = "8.3"

var console_info=["%c Enhanced %cSteam v"+version+" by jshackles %c http://www.enhancedsteam.com ","background: #000000;color: #7EBE45", "background: #000000;color: #ffffff",""];
console.log.apply(console,console_info);

var storage = chrome.storage.sync;
if (!storage) storage = chrome.storage.local;
var info = 0;

var total_requests = 0;
var processed_requests = 0;

var cookie = document.cookie;
var language;
$("script[src]").each(function() {
	var match = this.src.match(/(?:\?|&(?:amp;)?)l=([^&]+)/);
	if (match) {
		language = match[1];
		return false;
	}
});
if (language === undefined) {
	language = (cookie.match(/steam_language=([a-z]+)/i) || [])[1] || "english";
}

// Set language for options page
storage.set({'language': language});

var localized_strings = [];
var localization_promise = (function () {
	var l_deferred = new $.Deferred();
	var l_code = {"bulgarian": "bg",
		"czech": "cs",
		"danish": "da",
		"dutch": "nl",
		"finnish": "fi",
		"french": "fr",
		"greek": "el",
		"german": "de",
		"hungarian": "hu",
		"italian": "it",
		"japanese": "ja",
		"koreana": "ko",
		"norwegian": "no",
		"polish": "pl",
		"portuguese": "pt-PT",
		"brazilian": "pt-BR",
		"russian": "ru",
		"romanian": "ro",
		"schinese": "zh-CN",
		"spanish": "es-ES",
		"swedish": "sv-SE",
		"tchinese": "zh-TW",
		"thai": "th",
		"turkish": "tr",
		"ukrainian": "uk"}[language] || "en";
	$.getJSON(chrome.extension.getURL('/localization/' + l_code + '/strings.json'), function (data) {
		localized_strings = data;
		l_deferred.resolve();
	});
	return l_deferred.promise();
})();
var user_currency;
var currency_promise = (function() {
	var deferred = new $.Deferred();
	var currency_cache = $.parseJSON(localStorage.getItem("user_currency"));
	var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
	if (currency_cache && currency_cache.updated >= expire_time) {
		user_currency = currency_cache.currency_type;
		deferred.resolve();
	} else {		
		get_http("//store.steampowered.com/app/220", function(txt) {
			var currency = parse_currency($(txt).find(".price, .discount_final_price").text().trim());
			if (!currency) return;
			user_currency = currency.currency_type;
		}).fail(function() {
			user_currency = "USD";
		}).done(function() {
			localStorage.setItem("user_currency", JSON.stringify({currency_type: user_currency, updated: parseInt(Date.now() / 1000, 10)}));
		}).always(function() {
			deferred.resolve();
		});
	}
	return deferred.promise();
})();

// Check if the user is signed in
var is_signed_in = false;
var signed_in_promise = (function () {
	var deferred = new $.Deferred();
	if ($("#global_actions").find(".playerAvatar").length > 0) {
		var user_name = $("#global_actions").find(".playerAvatar")[0].outerHTML.match(/\/id\/(.+?)"/);
		if (user_name) {
			if (getValue("steamID")) {
				is_signed_in = getValue("steamID");
				deferred.resolve();
			} else {
				get_http("//steamcommunity.com/id/" + user_name[1], function(txt) {
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
	return deferred.promise();
})();

// Global scope promise storage; to prevent unecessary API requests
var loading_inventory;

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
	"CNY": { places: 0, hidePlacesWhenZero: false, symbolFormat: "¥ ", thousand: ",", decimal: ".", right: false },
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
	"HKD": { places: 2, hidePlacesWhenZero: false, symbolFormat: "HK$ ", thousand: ",", decimal: ".", right: false },
	"TWD": { places: 0, hidePlacesWhenZero: false, symbolFormat: "NT$ ", thousand: ",", decimal: ".", right: false },
	"INR": { places: 0, hidePlacesWhenZero: false, symbolFormat: "₹ ", thousand: ",", decimal: ".", right: false },
	"SAR": { places: 2, hidePlacesWhenZero: false, symbolFormat: " SR", thousand: ",", decimal: ".", right: true },
	"ZAR": { places: 2, hidePlacesWhenZero: false, symbolFormat: "R ", thousand: " ", decimal: ".", right: false },
	"AED": { places: 2, hidePlacesWhenZero: false, symbolFormat: " DH", thousand: ",", decimal: ".", right: true },
	"CHF": { places: 2, hidePlacesWhenZero: false, symbolFormat: "CHF ", thousand: "'", decimal: ".", right: false },
	"CLP": { places: 0, hidePlacesWhenZero: true, symbolFormat: "CLP$ ", thousand: ".", decimal: ",", right: false },
	"PEN": { places: 2, hidePlacesWhenZero: false, symbolFormat: "S/.", thousand: ",", decimal: ".", right: false },
	"COP": { places: 0, hidePlacesWhenZero: true, symbolFormat: "COL$ ", thousand: ".", decimal: ",", right: false },
	"USD": { places: 2, hidePlacesWhenZero: false, symbolFormat: "$", thousand: ",", decimal: ".", right: false }
};

function formatCurrency(number, type) {
	var info = currency_format_info[type || user_currency];
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
	if (user_currency && currency_format_info[user_currency].symbolFormat == currency_format_info[currency_type].symbolFormat) currency_type = user_currency;
	var currency_number = currency_type_to_number(currency_type);
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
	return {"pуб": "RUB",
		"€": "EUR",
		"£": "GBP",
		"R$": "BRL",
		"¥": "JPY",
		"kr": "NOK",
		"Rp": "IDR",
		"RM": "MYR",
		"P": "PHP",
		"S$": "SGD",
		"฿": "THB",
		"₫": "VND",
		"₩": "KRW",
		"TL": "TRY",
		"₴": "UAH",
		"Mex$": "MXN",
		"CDN$": "CAD",
		"A$": "AUD",
		"HK$": "HKD",
		"NT$": "TWD",
		"₹": "INR",
		"SR": "SAR",
		"R ": "ZAR",
		"DH": "AED",
		"CHF": "CHF",
		"CLP$": "CLP",
		"S/.": "PEN",
		"COL$": "COP",
		"NZ$": "NZD"}[currency_symbol] || "USD";
}

function currency_type_to_number (currency_type) {
	return {"RUB": 5,
		"EUR": 3,
		"GBP": 2,
		"BRL": 7,
		"JPY": 8,
		"NOK": 9,
		"IDR": 10,
		"MYR": 11,
		"PHP": 12,
		"SGD": 13,
		"THB": 14,
		"VND": 15,
		"KRW": 16,
		"TRY": 17,
		"UAH": 18,
		"MXN": 19,
		"CAD": 20,
		"AUD": 21,
		"NZD": 22,
		"INR": 24,
		"CLP": 25,
		"PEN": 26,
		"COP": 27,
		"ZAR": 28,
		"HKD": 29,
		"TWD": 30,
		"SAR": 31,
		"AED": 32}[currency_type] || 1;
}

function currency_symbol_from_string (string_with_symbol) {
	var re = /(?:R\$|S\$|\$|RM|kr|Rp|€|¥|£|฿|pуб|P|₫|₩|TL|₴|Mex\$|CDN\$|A\$|HK\$|NT\$|₹|SR|R |DH|CHF|CLP\$|S\/\.|COL\$|NZ\$)/;
	var match = string_with_symbol.match(re);
	return match ? match[0] : '';
}
var currencyConversion = (function() {
	var deferred;
	var rates;
	
	function load(currency) {
		if (deferred) return deferred.promise();
		deferred = new $.Deferred();
		rates = cache_get(currency || user_currency);
		if (rates) {
			deferred.resolveWith(rates);
		} else {
			var apiurl = "//api.enhancedsteam.com/currencydata/?base=" + (currency || user_currency);
			get_http(apiurl, function(txt) {
				rates = JSON.parse(txt);
				cache_set(currency || user_currency, rates);
				deferred.resolveWith(rates);
			}).fail(deferred.reject);
		}
		return deferred.promise();
	}
	function convert(amount, currency_from, currency_to) {
		if (rates) {
			if (rates[currency_to]) return amount / rates[currency_to][currency_from];
			if (rates[currency_from]) return amount * rates[currency_from][currency_to];
		}
	}
	
	function cache_set(currency, rates) {
		var expires = parseInt(Date.now() / 1000, 10) + 24 * 60 * 60 * 3; // Three days from now
		var cached = {
			rates: rates[currency],
			expires: expires
		};
		localStorage.setItem("currencyConversion_" + currency, JSON.stringify(cached));
	}
	function cache_get(currency) {
		var cached = JSON.parse(localStorage.getItem("currencyConversion_" + currency));
		if (cached && cached.expires > parseInt(Date.now() / 1000, 10)) {
			var rates = {};
			rates[currency] = cached.rates;
			return rates;
		}
	}
	
	return {
		load: load,
		convert: convert
	};
})();

/**
 * Gets the country code of store region.
 *
 * First, look for fakeCC in cookie, which is set for users with store region
 * different from accessing IP;
 * if not found, look for steamCountry in cookie;
 * if not found, default to 'us'.
 */
function getStoreRegionCountryCode() {
	if (getCookie('fakeCC')) {
		return getCookie('fakeCC');
	} else if (getCookie('steamCountry')) {
		// steamCountry looks like:
		// GB|fae965...
		var steamCountry = getCookie('steamCountry');
		var matched = steamCountry.match(/^([a-z]{2})/i);
		if (matched) {
			return matched[1];
		}
	}
	return 'us';
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

function get_http(url, callback, settings) {
	total_requests += 1;
	if (localized_strings.ready) $("#es_progress").attr({"max": 100, "title": localized_strings.ready.loading});
	$("#es_progress").removeClass("complete");
	if (!settings) settings = {};
	if (!settings.dataType) settings.dataType = "text";
	var jqxhr = $.ajax(url, settings);
	jqxhr.done(function() {
		processed_requests += 1;
		var complete_percentage = (processed_requests / total_requests) * 100;
		$("#es_progress").val(complete_percentage);
		if (complete_percentage == 100) { $("#es_progress").addClass("complete").attr("title", localized_strings.ready.ready); }
	});
	jqxhr.done(callback);
	jqxhr.fail(function() {
			$("#es_progress").val(100).addClass("error").attr({"title":localized_strings.ready.errormsg, "max":1});
	});
	return jqxhr;
}

var storePageData = (function() {
	var deferred = new $.Deferred();
	var data;

	function load(appid, metalink) {
		data = cache_get(appid);
		if (data) {
			deferred.resolveWith(data);
		} else {
			var apiurl = "//api.enhancedsteam.com/storepagedata/?appid=" + appid;
			if (metalink) apiurl += "&mcurl=" + metalink;
			get_http(apiurl, function(txt) {
				data = JSON.parse(txt);
				cache_set(appid, data);
				deferred.resolveWith(data);
			}).fail(deferred.reject);
		}
		return deferred.promise();
	}
	function get(api, callback) {
		if (api && callback) deferred.done(function() {
			if (data[api]) callback(data[api]);
		});
		return deferred.promise();
	}

	function cache_set(appid, data) {
		var expires = parseInt(Date.now() / 1000, 10) + 1 * 60 * 60; // One hour from now
		var cached = {
			data: data,
			expires: expires
		};
		localStorage.setItem("storePageData_" + appid, JSON.stringify(cached));
	}
	function cache_get(appid) {
		var cached = $.parseJSON(localStorage.getItem("storePageData_" + appid));
		if (cached && cached.expires > parseInt(Date.now() / 1000, 10)) return cached.data;
	}

	return {
		load: load,
		get: get
	}
})();
var profileData = (function() {
	var deferred = new $.Deferred();
	var data;

	function load(steamid) {
		if (!steamid && $("#reportAbuseModal").length) steamid = $("[name=abuseID]").val();
		if (!steamid && $("html").html().match(/steamid"\:"(.+)","personaname/)) steamid = $("html").html().match(/steamid"\:"(.+)","personaname/)[1];

		data = cache_get(steamid);
		if (data) {
			deferred.resolveWith(data);
		} else {
			var apiurl = "//api.enhancedsteam.com/profiledata/?steam64=" + steamid;
			get_http(apiurl, function(txt) {
				data = JSON.parse(txt);
				cache_set(steamid, data);
				deferred.resolveWith(data);
			}).fail(deferred.reject);
		}
		return deferred.promise();
	}
	function get(api, callback) {
		if (api && callback) deferred.done(function() {
			if (data[api]) callback(data[api]);
		});
		return deferred.promise();
	}

	function cache_set(steamid, data) {
		var expires = parseInt(Date.now() / 1000, 10) + 24 * 60 * 60; // One day from now
		var cached = {
			data: data,
			expires: expires
		};
		localStorage.setItem("profileData_" + steamid, JSON.stringify(cached));
	}
	function cache_get(steamid) {
		var cached = $.parseJSON(localStorage.getItem("profileData_" + steamid));
		if (cached && cached.expires > parseInt(Date.now() / 1000, 10)) return cached.data;
	}
	function clearOwn() {
		localStorage.removeItem("profileData_" + is_signed_in);
	}

	return {
		load: load,
		get: get,
		clearOwn: clearOwn
	}
})();

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
		if (settings.highlight_owned === undefined) { settings.highlight_owned = true; storage.set({'highlight_owned': settings.highlight_owned}); }
		if (settings.hide_owned === undefined) { settings.hide_owned = false; storage.set({'hide_owned': settings.hide_owned}); }

		if (settings.highlight_owned) highlight_node(node, settings.highlight_owned_color);
		if (settings.hide_owned) hide_node(node);

		if (settings.tag_owned === undefined) { settings.tag_owned = false; storage.set({'tag_owned': settings.tag_owned}); }
		if (settings.tag_owned_color === undefined) { settings.tag_owned_color = "#5c7836";	storage.set({'tag_owned_color': settings.tag_owned_color}); }
		if (settings.tag_owned) add_tag(node, localized_strings.tag.owned, settings.tag_owned_color);
	});
}

// Color the tile for wishlist games
function highlight_wishlist(node) {
	storage.get(function(settings) {
		node.classList.add("es_highlight_wishlist");

		if (settings.highlight_wishlist_color === undefined) { settings.highlight_wishlist_color = "#d3deea";	storage.set({'highlight_wishlist_color': settings.highlight_wishlist_color}); }
		if (settings.highlight_wishlist === undefined) { settings.highlight_wishlist = true; storage.set({'highlight_wishlist': settings.highlight_wishlist}); }
		if (settings.hide_wishlist === undefined) { settings.hide_wishlist = false; storage.set({'hide_wishlist': settings.hide_wishlist}); }

		if (settings.highlight_wishlist) highlight_node(node, settings.highlight_wishlist_color);
		if (settings.hide_wishlist) hide_node(node);

		if (settings.tag_wishlist_color === undefined) { settings.tag_wishlist_color = "#d3deea";	storage.set({'tag_wishlist_color': settings.tag_wishlist_color}); }
		if (settings.tag_wishlist === undefined) { settings.tag_wishlist = false; storage.set({'tag_wishlist': settings.tag_wishlist}); }
		if (settings.tag_wishlist) add_tag(node, localized_strings.tag.wishlist, settings.highlight_wishlist_color);
	});
}

function highlight_cart(node) {
	storage.get(function(settings) {
		node.classList.add("es_highlight_cart");
		if (settings.hide_cart === undefined) { settings.hide_cart = false; storage.set({'hide_cart': settings.hide_cart}); }
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
		if (settings.tag_coupon) add_tag(node, localized_strings.tag.coupon + " (" + discount + "%)", settings.highlight_coupon_color);
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
		if (settings.tag_inv_gift) add_tag(node, localized_strings.tag.inv_gift, settings.highlight_inv_gift_color);
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
		if (settings.tag_inv_guestpass) add_tag(node, localized_strings.tag.inv_guestpass, settings.highlight_inv_guestpass_color);
	});
}

function highlight_nondiscounts(node) {
	storage.get(function(settings) {
		if (settings.hide_notdiscounted === undefined) { settings.hide_notdiscounted = false; storage.set({'hide_notdiscounted': settings.hide_notdiscounted}); }
		
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
				get_http("//store.steampowered.com/dynamicstore/userdata/", function(txt) {
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
			if (settings.hide_notinterested === undefined) { settings.hide_notinterested = false; storage.set({'hide_notinterested': settings.hide_notinterested}); }
			
			var notinterested = getValue("ignored_apps");
			if (notinterested) notinterested = notinterested.split(",");
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
			$node = $(node).find(".main_cap_content").parent();
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
		if ($node.parent().parent()[0]) {
			if ($node.parent().parent()[0].classList.contains("blotter_daily_rollup_line") || $node.parent().parent()[0].classList.contains("blotter_group_announcement_header") || $node.parent().parent()[0].classList.contains("blotter_author_block") || $node.parent().parent()[0].classList.contains("blotter_gamepurchase") || $node.parent().parent()[0].classList.contains("blotter_recommendation")) {
				$node.css("color", color);
				return;
			}
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
		if (settings.hide_owned === undefined) { settings.hide_owned = false; storage.set({'hide_owned': settings.hide_owned}); }
		if (settings.hide_dlcunownedgames === undefined) { settings.hide_dlcunownedgames = false; storage.set({'hide_dlcunownedgames': settings.hide_dlcunownedgames}); }

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
				"display": "inline-block",
				"margin-top": "2px",
				"vertical-align": "middle"
			});
			$tag_root.find("h4").prepend($tags);
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
			$tag_root.find(".wishlist_added_on").after($tags);
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
					$.each(data.rgDescriptions, function(id, obj) {
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
													setValue(app.id + "coupon_id", id);
													for (var i = 0; i < obj.descriptions.length; i++) {
														if (obj.descriptions[i].value.startsWith("Can't be applied with other discounts.")) {
															setValue(app.id + "coupon_discount_note", obj.descriptions[i].value);
															setValue(app.id + "coupon_discount_note_id", i);
															setValue(app.id + "coupon_discount_doesnt_stack", true);
														}
														else if (obj.descriptions[i].value.startsWith("(Valid")) {
															setValue(app.id + "coupon_valid_id", i);
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
			get_http(profileurl + '/inventory/json/753/1/?l=en', handle_inv_ctx1);

			// Context ID 3 is coupons
			get_http(profileurl + '/inventory/json/753/3/?l=en', handle_inv_ctx3);

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
			var empty_buttons = $("<div class='btn_save' id='es_empty_wishlist'>" + localized_strings.empty_wishlist + "</div>");
			$(".save_actions_enabled").filter(":last").after(empty_buttons);
			$("#es_empty_wishlist").click(empty_wishlist);
		}
	}
}

function add_wishlist_filter() {
	var html  = "<span>" + localized_strings.show + ": </span>";
		html += "<label class='es_sort' id='es_wl_all'><input type='radio' id='es_wl_all_box' name='es_wl_sort' checked><span><a>" + localized_strings.games_all + "</a></span></label>";
		html += "<label class='es_sort' id='es_wl_sale'><input type='radio' id='es_wl_sale_box' name='es_wl_sort'><span><a>" + localized_strings.games_discount + "</a></span></label>";
		html += "<label class='es_sort' id='es_wl_coupon'><input type='radio' id='es_wl_coupon_box' name='es_wl_sort'><span><a>" + localized_strings.games_coupon + "</a></span></label>";
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
		$("#wishlist_sort_options").find("a[href$='price']").after("&nbsp;&nbsp;<label id='es_wl_sort_discount'><a>" + localized_strings.discount + "</a></label>");
	} else {
		$("#wishlist_sort_options").find("span[class='selected_sort']").after("&nbsp;&nbsp;<label id='es_wl_sort_discount'><a>" + localized_strings.discount + "</a></label>");
	}

	$("#es_wl_sort_discount").on("click", function() {
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

		$(this).html("<span style='color: #B0AEAC;'>" + localized_strings.discount + "</span>");
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
	var apps = "";

	function calculate_node($node, search) {
		var parsed = parse_currency($node.find(search).text().trim());

		if (parsed) {
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

	total = formatCurrency(parseFloat(total));
	$(".games_list").after("<link href='//store.akamai.steamstatic.com/public/css/v6/game.css' rel='stylesheet' type='text/css'><div class='game_area_purchase_game' style='width: 600px; margin-top: 15px;'><h1>" + localized_strings.wishlist + "</h1><p class='package_contents'><b>" + localized_strings.bundle.includes.replace("__num__", items) + ":</b> " + gamelist + "</p><div class='game_purchase_action'><div class='game_purchase_action_bg'><div class='game_purchase_price price'>" + total + "</div></div></div></div></div></div>");
}

function add_wishlist_ajaxremove() {
	$("a[onclick*=wishlist_remove]").each(function() {		
		var appid = $(this).parent().parent().parent()[0].id.replace("game_", "");
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
		if (settings.showallstores === undefined) { settings.showallstores = true; storage.set({'showallstores': settings.showallstores}); }
		if (settings.stores === undefined) { settings.stores = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]; storage.set({'stores': settings.stores}); }
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
			if (settings.stores[28]) { storestring += "coinplay,"; }
			if (settings.stores[29]) { storestring += "funstock,"; }
			if (settings.stores[30]) { storestring += "wingamestore,"; }
			if (settings.stores[31]) { storestring += "gamebillet,"; }
			if (settings.showallstores) { storestring = "steam,amazonus,impulse,gamersgate,greenmangaming,gamefly,origin,uplay,indiegalastore,gametap,gamesplanet,getgames,gog,dotemu,gameolith,adventureshop,nuuvem,shinyloot,dlgamer,humblestore,squenix,bundlestars,fireflower,humblewidgets,newegg,gamesrepublic,coinplay,funstock,wingamestore,gamebillet"; }

			// Get country code from Steam cookie
			var cc = getStoreRegionCountryCode();

			function get_price_data(lookup_type, node, id) {
				html = "<div class='es_lowest_price' id='es_price_" + id + "' style='margin-bottom: 5px;'><div class='gift_icon' id='es_line_chart_" + id + "'><img src='" + chrome.extension.getURL("img/line_chart.png") + "'></div><span id='es_price_loading_" + id + "'>" + localized_strings.loading + "</span>";
				$(node).append(html);

				get_http("//api.enhancedsteam.com/pricev2/?search=" + lookup_type + "/" + id + "&stores=" + storestring + "&cc=" + cc + "&coupon=" + settings.showlowestpricecoupon, function (txt) {
					var data = JSON.parse(txt);
					if (data) {
						var activates = "", line1 = "", line2 = "", line3 = "", html, recorded;
						var currency_type = data[".meta"]["currency"];

	        			// "Lowest Price"
						if (data["price"]) {
	                        if (data["price"]["drm"] == "steam") {
	                        	activates = "(<b>" + localized_strings.activates + "</b>)";
	                    		if (data["price"]["store"] == "Steam") {
	                    			activates = "";
	                    		}
	                    	}

	                        line1 = localized_strings.lowest_price + ': ' + localized_strings.lowest_price_format.replace("__price__", formatCurrency(escapeHTML(data["price"]["price"].toString()), currency_type)).replace("__store__", '<a href="' + escapeHTML(data["price"]["url"].toString()) + '" target="_blank">' + escapeHTML(data["price"]["store"].toString()) + '</a>') + ' ' + activates + ' (<a href="' + escapeHTML(data["urls"]["info"].toString()) + '" target="_blank">' + localized_strings.info + '</a>)';
	                    	if (settings.showlowestpricecoupon) {
	                    		if (data["price"]["price_voucher"]) {
	                    			line1 = localized_strings.lowest_price + ': ' + localized_strings.lowest_price_format.replace("__price__", formatCurrency(escapeHTML(data["price"]["price"].toString()), currency_type)).replace("__store__", '<a href="' + escapeHTML(data["price"]["url"].toString()) + '" target="_blank">' + escapeHTML(data["price"]["store"].toString()) + '</a>') + ' ' + localized_strings.after_coupon + ' <b>' + escapeHTML(data["price"]["voucher"].toString()) + '</b> ' + activates + ' (<a href="' + escapeHTML(data["urls"]["info"].toString()) + '" target="_blank">' + localized_strings.info + '</a>)';
	                    		}
	                    	}
	                    }

						// "Historical Low"
						if (data["lowest"]) {
	                        recorded = new Date(data["lowest"]["recorded"]*1000);
	                        line2 = localized_strings.historical_low + ': ' + localized_strings.historical_low_format.replace("__price__", formatCurrency(escapeHTML(data["lowest"]["price"].toString()), currency_type)).replace("__store__", escapeHTML(data["lowest"]["store"].toString())).replace("__date__", recorded.toLocaleDateString()) + ' (<a href="' + escapeHTML(data["urls"]["history"].toString()) + '" target="_blank">' + localized_strings.info + '</a>)';
	                    }

						// "Number of times this game has been in a bundle"
						if (data["bundles"]["count"] > 0) {
							line3 = "<br>" + localized_strings.bundle.bundle_count + ": " + data["bundles"]["count"] + ' (<a href="' + escapeHTML(data["urls"]["bundle_history"].toString()) + '" target="_blank">' + localized_strings.info + '</a>)';
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
							$("#es_price_" + id).append(localized_strings.no_results_found);
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
				$(this).find(".bottom_controls .popup_block2 .popup_body2").append("<a class='popup_menu_item2 tight es_add_wishlist_note' id='es_add_wishlist_note_" + appid + "'><h5>"+localized_strings.add_wishlist_note+"</h5></a>");
				storage.get(function(settings) {
					var key = appid + "wishlist_note";
					var array = $.map(settings, function(value, index) {
						if (index == key) return [value];
					});
					var wl_note = array[0];
					if (wl_note) {
						$(node).find("h4").after("<div class='es_wishlist_note'>" + wl_note.toString() + "</div").css("padding-top", "6px");
						$("#es_add_wishlist_note_" + appid).find("h5").text(localized_strings.update_wishlist_note);
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
						var note = prompt(localized_strings.update_wishlist_note_prompt, wl_note);
					} else {
						var note = prompt(localized_strings.add_wishlist_note_prompt, "");
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
	var conf_text = localized_strings.empty_wishlist_confirm;
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
	var price = (Number(price_text.replace(/[^0-9\.]+/g,""))) / ways;
	price = (Math.ceil(price * 100) / 100);
	price_text = formatCurrency(price);
	$(node).find(".btn_addtocart").last().before(
		"<div class='es_each_box'><div class='es_each_price'>" + price_text + "</div><div class='es_each'>"+localized_strings.each+"</div></div>"
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
					htmlstr += '<a class="btnv6_blue_blue_innerfade btn_medium" href="//store.steampowered.com/sub/' + subid + '/"><span>' + localized_strings.package_info + '</span></a></div></div>';					
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
				storePageData.get("charts", function(data) {
					if (data["chart"]) {
						var html = '<div id="steam-charts" class="game_area_description"><h2>' + localized_strings.charts.current + '</h2>';
						html += '<div id="chart-heading" class="chart-content"><div id="chart-image"><img src="//cdn.akamai.steamstatic.com/steam/apps/' + appid + '/capsule_184x69.jpg" width="184" height="69"></div><div class="chart-stat">';
						html += '<span class="num">' + escapeHTML(data["chart"]["current"]) + '</span><br>' + localized_strings.charts.playing_now + '</div><div class="chart-stat">';
						html += '<span class="num">' + escapeHTML(data["chart"]["peaktoday"]) + '</span><br>' + localized_strings.charts.peaktoday + '</div><div class="chart-stat">';
						html += '<span class="num">' + escapeHTML(data["chart"]["peakall"]) + '</span><br>' + localized_strings.charts.peakall + '</div><span class="chart-footer">Powered by <a href="http://steamcharts.com/app/' + appid + '" target="_blank">SteamCharts.com</a></span></div></div>';

						if ($("#steam-spy").length) {
							$("#steam-spy").before(html);
						} else {
							$(".sys_req").parent().before(html);
						}
					}
				});
			}
		});
	}
}

function add_steamspy_info(appid) {
	if ($(".game_area_dlc_bubble").length == 0) {
		storage.get(function(settings) {
			if (settings.show_steamspy_info === undefined) { settings.show_steamspy_info = true; storage.set({'show_steamspy_info': settings.show_steamspy_info}); }
			if (settings.show_steamspy_info) {
				storePageData.get("steamspy", function(data) {
					if (data["owners"] != 0) {
						var owners1 = Number(parseInt(data["owners"]) - parseInt(data["owners_variance"])).toLocaleString("en"),
							owners2 = Number(parseInt(data["owners"]) + parseInt(data["owners_variance"])).toLocaleString("en"),
							players2weeks1 = Number(parseInt(data["players_2weeks"]) - parseInt(data["players_2weeks_variance"])).toLocaleString("en"),
							players2weeks2 = Number(parseInt(data["players_2weeks"]) + parseInt(data["players_2weeks_variance"])).toLocaleString("en"),
							players2weeksp = (parseInt(data["players_2weeks"]) / parseInt(data["owners"]) * 100).toFixed(2),
							players1 = Number(parseInt(data["players_forever"]) - parseInt(data["players_forever_variance"])).toLocaleString("en"),
							players2 = Number(parseInt(data["players_forever"]) + parseInt(data["players_forever_variance"])).toLocaleString("en"),
							playersp = (parseInt(data["players_forever"]) / parseInt(data["owners"]) * 100).toFixed(2)
							avg_hours = Math.floor(parseInt(data["average_forever"]) / 60),
							avg_minutes = parseInt(data["average_forever"]) % 60,
							avg_hours2 = Math.floor(parseInt(data["average_2weeks"]) / 60),
							avg_minutes2 = parseInt(data["average_2weeks"]) % 60;

						var html = '<div id="steam-spy" class="game_area_description"><h2>' + localized_strings.spy.player_data + '</h2>';
						html += "<div class='spy_details'>";
						html += "<b>" + localized_strings.spy.owners + ":</b> " + owners1 + " - " + owners2;
						html += "<br><b>" + localized_strings.spy.players_total + ":</b> " + players1 + " - " + players2 + " (" + playersp + "%)";
						html += "<br><b>" + localized_strings.spy.players_2weeks + ":</b> " + players2weeks1 + " - " + players2weeks2 + " (" + players2weeksp + "%)";
						html += "<br><b>" + localized_strings.spy.average_playtime + ":</b> " + localized_strings.spy.formatted_time.replace("__hours__", avg_hours).replace("__minutes__", avg_minutes);
						html += "<br><b>" + localized_strings.spy.average_playtime_2weeks + ":</b> " + localized_strings.spy.formatted_time.replace("__hours__", avg_hours2).replace("__minutes__", avg_minutes2);
						html += "<span class='chart-footer' style='padding-right: 13px;'>Powered by <a href='http://steamspy.com/app/" + appid + "' target='_blank'>steamspy.com</a></span>";
						html += "</div>";

						if ($("#steam-charts").length) {
							$("#steam-charts").after(html);
						} else {
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
			var html = "<a class='btnv6_blue_blue_innerfade btn_medium es_btn_systemreqs' href='steam://checksysreqs/" + appid + "'><span>" + localized_strings.check_system + "</span></a>";
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
	$dropdown_options_container.hide();
	$dropdown_options_container.css("margin-top", "-1px");

	// remove menu if click anywhere but on "Enhanced Steam". Commented out bit is for clicking on menu won't make it disappear either.
	$('body').bind('click', function(e) {
		if(/*$(e.target).closest(".popup_body").length == 0 && */$(e.target).closest("#enhanced_pulldown").length == 0) {
			if ($dropdown_options_container.css("display") == "block" || $dropdown_options_container.css("display") == "") {
				$dropdown_options_container.fadeOut(200);
				$dropdown.removeClass("focus");
			}
		}
	});

	$dropdown.click(function(){
		$dropdown_options_container.fadeToggle(200);
		$dropdown.toggleClass("focus");
	});

	$options_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\""+chrome.extension.getURL("options.html")+"\">"+localized_strings.thewordoptions+"</a>")
	$website_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"http://www.enhancedsteam.com\">" + localized_strings.website + "</a>");
	$contribute_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//github.com/jshackles/Enhanced_Steam\">" + localized_strings.contribute + "</a>");
	$translate_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//translation.enhancedsteam.com\">" + localized_strings.translate + "</a>");
	$bug_feature_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//github.com/jshackles/Enhanced_Steam/issues\">" + localized_strings.bug_feature + "</a>");
	$donation_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//enhancedsteam.com/donate.php\">" + localized_strings.donate + "</a>");
	$group_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//" + localized_strings.official_group_url + "\">" + localized_strings.official_group + "</a>");

	$clear_cache_link = $("<a class=\"popup_menu_item\" href=\"\">" + localized_strings.clear_cache + "</a>");
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

	$("#global_action_menu").prepend($dropdown);
	$("#account_dropdown").after($dropdown_options_container);
	$("#language_pulldown").after($dropdown_options_container);

	$("#global_actions").after("<progress id='es_progress' class='complete' value='1' max='1' title='" + localized_strings.ready.ready + "'></progress>");
}

// Display warning if browsing using non-account region
function add_fake_country_code_warning() {
	storage.get(function(settings) {
		if (settings.showfakeccwarning === undefined) { settings.showfakeccwarning = true; storage.set({'showfakeccwarning': settings.showfakeccwarning}); }
		if (settings.showfakeccwarning) {
			var LKGBillingCountry = getCookie("LKGBillingCountry");
			var fakeCC = getCookie("fakeCC");

			if (fakeCC && LKGBillingCountry && LKGBillingCountry.length == 2 && LKGBillingCountry != fakeCC) {
				$("#global_header").after('<div class=content style="background-image: url( ' + chrome.extension.getURL("img/red_banner.png") + '); height: 21px; text-align: center; padding-top: 8px;">' + localized_strings.using_store.replace("__current__", fakeCC) + '  <a href="#" id="reset_fake_country_code">' + localized_strings.using_store_return.replace("__base__", LKGBillingCountry) + '</a></div>');
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
			var currentLanguage = language.charAt(0).toUpperCase() + language.slice(1);

			if (settings.showlanguagewarninglanguage === undefined) { settings.showlanguagewarninglanguage = currentLanguage; storage.set({'showlanguagewarninglanguage': settings.showlanguagewarninglanguage}); }
			var lang = settings.showlanguagewarninglanguage.toLowerCase();

			var warning_language = settings.showlanguagewarninglanguage;

			if (warning_language != currentLanguage) {
				var l_code = {"bulgarian": "bg",
					"czech": "cs",
					"danish": "da",
					"dutch": "nl",
					"finnish": "fi",
					"french": "fr",
					"greek": "el",
					"german": "de",
					"hungarian": "hu",
					"italian": "it",
					"japanese": "ja",
					"koreana": "ko",
					"norwegian": "no",
					"polish": "pl",
					"portuguese": "pt-PT",
					"brazilian": "pt-BR",
					"russian": "ru",
					"romanian": "ro",
					"schinese": "zh-CN",
					"spanish": "es-ES",
					"swedish": "sv-SE",
					"tchinese": "zh-TW",
					"thai": "th",
					"turkish": "tr",
					"ukrainian": "uk"}[settings.showlanguagewarninglanguage.toLowerCase()] || "en";
				$.getJSON(chrome.extension.getURL('/localization/' + l_code + '/strings.json'), function (data) {
					localized_strings_native = data;
					$("#global_header").after('<div class=content style="background-image: url( ' + chrome.extension.getURL("img/red_banner.png") + '); color: #ffffff; font-size: 12px; height: 21px; text-align: center; padding-top: 8px;">' + localized_strings_native.using_language.replace("__current__", localized_strings_native.options.lang[currentLanguage.toLowerCase()]) + '  <a href="#" id="reset_language_code">' + localized_strings_native.using_language_return.replace("__base__", localized_strings_native.options.lang[warning_language.toLowerCase()]) + '</a></div>');
					$("#page_background_holder").css("top", "135px");
					$("#reset_language_code").click(function(e) {
						e.preventDefault();
						document.cookie = 'Steam_Language=' + settings.showlanguagewarninglanguage.toLowerCase() + ';path=/;';
						window.location.replace(window.location.href.replace(/[?&]l=[a-z]+/, ""));
					});
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
			$('div.header_installsteam_btn').remove();
		}
	});
}

// Remove the "About" menu item at the top of each page
function remove_about_menu() {
	storage.get(function(settings) {
		if (settings.hideaboutmenu === undefined) { settings.hideaboutmenu = false; storage.set({'hideaboutmenu': settings.hideaboutmenu}); }
		if (settings.hideaboutmenu) {
			$(".menuitem[href$='http://store.steampowered.com/about/']").remove();
		}
	});
}

function add_header_links() {
	var supernav_content = document.querySelectorAll("#supernav .supernav");
	if ($("#supernav").length > 0) {
		// add "Forums" after "Workshop"
		var community = $("#supernav").find("a[href='http://steamcommunity.com/']").attr("data-tooltip-content");
		if (community === undefined) community = $("#supernav").find("a[href='https://steamcommunity.com/']").attr("data-tooltip-content");
		var insertAt = community.match(/\/workshop\/">(.+)<\/a>/);
		community = community.substr(0, (insertAt.index + insertAt[0].length)) + '<a class="submenuitem" href="//forums.steampowered.com/forums/" target="_blank">' + localized_strings.forums + '</a>' + community.substr(insertAt.index + insertAt[0].length);
		$("#supernav").find("a[href='http://steamcommunity.com/']").attr("data-tooltip-content", community);

		if (is_signed_in) {
			var user = $("#supernav").find("a[href$='/home/']").attr("data-tooltip-content");
			var insertAt = user.match(/\/home\/">(.+)<\/a>/);
			user = user.substr(0, (insertAt.index + insertAt[0].length)) + '<a class="submenuitem" href="//steamcommunity.com/my/games/">' + localized_strings.games + '</a>' + user.substr(insertAt.index + insertAt[0].length);
			user = user + '<a class="submenuitem" href="//steamcommunity.com/my/recommended/">' + localized_strings.reviews + '</a>';
			$("#supernav").find("a[href$='/home/']").attr("data-tooltip-content", user);
		}
	}
}

// Replace account name with community name
function replace_account_name() {
	storage.get(function(settings) {
		if (settings.replaceaccountname === undefined) { settings.replaceaccountname = false; storage.set({'replaceaccountname': settings.replaceaccountname}); }
		if (settings.replaceaccountname) {
			var account_name = $("#account_pulldown").text().trim();
			var community_name = $("#global_header .username").text().trim();
			$("#account_pulldown").text(community_name);
			if ($(".pageheader").length) { // New-style header
				var pageheader = $(".pageheader").text().trim();
				if (pageheader.indexOf(account_name) >= 0) $(".pageheader").text(pageheader.replace(account_name, community_name));
			}
			if ($(".page_title > .blockbg").length) { // Old-style header
				var pagetitle = $(".page_title > .blockbg").text().trim();
				if (pagetitle.indexOf(account_name) >= 0) $(".page_title > .blockbg").text(pagetitle.replace(account_name, community_name));
			}
			if (document.title.indexOf(account_name) >= 0) document.title = document.title.replace(account_name, community_name);
		}
	});
}

function add_custom_wallet_amount() {
	var addfunds = $(".addfunds_area_purchase_game:first").clone();
	$(addfunds).addClass("es_custom_funds");
	$(addfunds).find(".btnv6_green_white_innerfade").addClass("es_custom_button");
	$(addfunds).find("h1").text(localized_strings.wallet.custom_amount);
	$(addfunds).find("p").text(localized_strings.wallet.custom_amount_text.replace("__minamount__", $(addfunds).find(".price").text().trim()));
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

			var display_coupon_message_localized = function(txt) {

				if (txt && !txt.startsWith("<")) {
					var data = $.parseJSON(txt);
					if (data.success) {
						var obj = data.rgDescriptions[getValue(appid + "coupon_id")];
						if (obj) {
							setValue(appid + "coupon_title", obj.name);
							setValue(appid + "coupon_discount_note", obj.descriptions[getValue(appid + "coupon_discount_note_id")].value);
							setValue(appid + "coupon_valid", coupon_date = obj.descriptions[getValue(appid + "coupon_valid_id")].value);
						}
						setValue(appid+"coupon_translated", true);
					}
				}

				var coupon_title = getValue(appid + "coupon_title");
				var coupon_discount_note = getValue(appid + "coupon_discount_note");
				var coupon_date = getValue(appid + "coupon_valid");
				if (coupon_discount_note === null) { coupon_discount_note = ""; }
				coupon_date = coupon_date.replace(/\[date](.+)\[\/date]/, function(m0, m1) {
					return new Date(m1 * 1000).toLocaleString();
				});

				$('#game_area_purchase').before($(""+
				"<div class=\"early_access_header\">" +
				"    <div class=\"heading\">" +
				"        <h1 class=\"inset\">" + localized_strings.coupon_available + "</h1>" +
				"        <h2 class=\"inset\">" + localized_strings.coupon_application_note + "</h2>" +
				"        <p>" + localized_strings.coupon_learn_more + "</p>" +
				"    </div>" +
				"    <div class=\"devnotes\">" +
				"        <table border=0>" +
				"            <tr>" +
				"                <td rowspan=3>" +
				"                    <img src=\"//cdn.steamcommunity.com/economy/image/" + getValue(appid + "coupon_imageurl") + "\"/>" +
				"                </td>" +
				"                <td valign=center>" +
				"                    <h1>" + coupon_title + "</h1>" +
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
					comma = actual_price_container.search(/,\d\d(?!\d)/);

				if (comma > -1) {
					actual_price_container = actual_price_container.replace(",", ".");
				} else {
					actual_price_container = actual_price_container.replace(",", "");
				}

				actual_price_container = actual_price_container.replace(/\s/g, "");

				var original_price = parseFloat(actual_price_container.match(/([0-9]+(?:(?:\,|\.)[0-9]+)?)/)[1]);
				var discounted_price = (original_price - (original_price * getValue(appid + "coupon_discount") / 100).toFixed(2)).toFixed(2);

				if (!($price_div.find(".game_purchase_discount").length > 0 && getValue(appid + "coupon_discount_doesnt_stack"))) {
					// If not (existing discounts and coupon does not stack)

					$price_div[0].innerHTML = ""+
						"<div class=\"game_purchase_action_bg\">" +
						"    <div class=\"discount_block game_purchase_discount\">" +
						"        <div class=\"discount_pct\">-" + getValue(appid + "coupon_discount") + "%</div>" +
						"        <div class=\"discount_prices\">" +
						"            <div class=\"discount_original_price\">" + formatCurrency(original_price) + "</div>" +
						"            <div class=\"discount_final_price\" itemprop=\"price\">" + formatCurrency(discounted_price) + "</div>" +
						"        </div>" +
						"    </div>" +
						"<div class=\"btn_addtocart\">" +
						"        <a class=\"btnv6_green_white_innerfade btn_medium\" href=\"javascript:addToCart( " + cart_id + ");\"><span>" + localized_strings.add_to_cart + "</span></a>" +
						"    </div>" +
						"</div>";
				}
			}
			if (getValue(appid+"coupon_translated")) {
				display_coupon_message_localized();
			} else {
				get_http(($(".user_avatar")[0].href || $(".user_avatar a")[0].href) + '/inventory/json/753/3/', display_coupon_message_localized);
			}
		}
	});
}

function show_pricing_history(appid, type) {
	storage.get(function(settings) {
		if (settings.showlowestprice === undefined) { settings.showlowestprice = true; storage.set({'showlowestprice': settings.showlowestprice}); }
		if (settings.showlowestpricecoupon === undefined) { settings.showlowestpricecoupon = true; storage.set({'showlowestpricecoupon': settings.showlowestpricecoupon}); }
		if (settings.showlowestprice_region === undefined) { settings.showlowestprice_region = "us"; storage.set({'showlowestprice_region': settings.showlowestprice_region}); }
		if (settings.showallstores === undefined) { settings.showallstores = true; storage.set({'showallstores': settings.showallstores}); }
		if (settings.stores === undefined) { settings.stores = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]; storage.set({'stores': settings.stores}); }
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
			if (settings.stores[28]) { storestring += "coinplay,"; }
			if (settings.stores[29]) { storestring += "funstock,"; }
			if (settings.stores[30]) { storestring += "wingamestore,"; }
			if (settings.stores[31]) { storestring += "gamebillet,"; }
			if (settings.showallstores) { storestring = "steam,amazonus,impulse,gamersgate,greenmangaming,gamefly,origin,uplay,indiegalastore,gametap,gamesplanet,getgames,gog,dotemu,gameolith,adventureshop,nuuvem,shinyloot,dlgamer,humblestore,squenix,bundlestars,fireflower,humblewidgets,newegg,gamesrepublic,coinplay,funstock,wingamestore,gamebillet"; }

			// Get country code from Steam cookie
			var cc = getStoreRegionCountryCode();

			// Get all of the subIDs on the page
			var subids = "";
			$("input[name=subid]").each(function(index, value) {
				subids += value.value + ",";
			});

			get_http("//api.enhancedsteam.com/pricev3/?subs=" + subids + "&stores=" + storestring + "&cc=" + cc + "&appid=" + appid + "&coupon=" + settings.showlowestpricecoupon, function (txt) {
				var price_data = JSON.parse(txt);
				if (price_data) {
					var bundles = [];
					var currency_type = price_data[".meta"]["currency"];
					$.each(price_data, function(key, data) {
						if (key != ".cached" && key != ".meta" && data) {
							var subid = key.replace("sub/", "");
							var activates = "", line1 = "", line2 = "", line3 = "", html, recorded;
							var node = $("input[name=subid][value=" + subid + "]").parent().parent();

							// "Lowest Price"
							if (data["price"]) {
								if (data["price"]["drm"] == "steam") {
									activates = "(<b>" + localized_strings.activates + "</b>)";
									if (data["price"]["store"] == "Steam") {
										activates = "";
									}
								}

								line1 = localized_strings.lowest_price + ': ' + localized_strings.lowest_price_format.replace("__price__", formatCurrency(escapeHTML(data["price"]["price"].toString()), currency_type)).replace("__store__", '<a href="' + escapeHTML(data["price"]["url"].toString()) + '" target="_blank">' + escapeHTML(data["price"]["store"].toString()) + '</a>') + ' ' + activates + ' (<a href="' + escapeHTML(data["urls"]["info"].toString()) + '" target="_blank">' + localized_strings.info + '</a>)';
								if (settings.showlowestpricecoupon) {
									if (data["price"]["price_voucher"]) {
										line1 = localized_strings.lowest_price + ': ' + localized_strings.lowest_price_format.replace("__price__", formatCurrency(escapeHTML(data["price"]["price"].toString()), currency_type)).replace("__store__", '<a href="' + escapeHTML(data["price"]["url"].toString()) + '" target="_blank">' + escapeHTML(data["price"]["store"].toString()) + '</a>') + ' ' + localized_strings.after_coupon + ' <b>' + escapeHTML(data["price"]["voucher"].toString()) + '</b> ' + activates + ' (<a href="' + escapeHTML(data["urls"]["info"].toString()) + '" target="_blank">' + localized_strings.info + '</a>)';
									}
								}
							}

							// "Historical Low"
							if (data["lowest"]) {
								recorded = new Date(data["lowest"]["recorded"]*1000);
								line2 = localized_strings.historical_low + ': ' + localized_strings.historical_low_format.replace("__price__", formatCurrency(escapeHTML(data["lowest"]["price"].toString()), currency_type)).replace("__store__", escapeHTML(data["lowest"]["store"].toString())).replace("__date__", recorded.toLocaleDateString()) + ' (<a href="' + escapeHTML(data["urls"]["history"].toString()) + '" target="_blank">' + localized_strings.info + '</a>)';
							}

							html = "<div class='es_lowest_price' id='es_price_" + subid + "'><div class='gift_icon' id='es_line_chart_" + subid + "'><img src='" + chrome.extension.getURL("img/line_chart.png") + "'></div>";

							// "Number of times this game has been in a bundle"
							if (data["bundles"]["count"] > 0) {
								line3 = "<br>" + localized_strings.bundle.bundle_count + ": " + data["bundles"]["count"] + ' (<a href="' + escapeHTML(data["urls"]["bundles"].toString()) + '" target="_blank">' + localized_strings.info + '</a>)';
							}

							if (line1 && line2) {
								$(node).before(html + line1 + "<br>" + line2 + line3);
								$("#es_line_chart_" + subid).css("top", (($("#es_price_" + subid).outerHeight() - 20) / 2) + "px");
							}

							if (data["bundles"]["live"].length > 0) {
								var length = data["bundles"]["live"].length;
								for (var i = 0; i < length; i++) {
									var enddate;
									if (data["bundles"]["live"][i]["expiry"]) {
										enddate = new Date(data["bundles"]["live"][i]["expiry"]*1000);
									}
									var currentdate = new Date().getTime();
									if (!enddate || currentdate < enddate) {
										var bundle = data["bundles"]["live"][i];
										var bundle_normalized = JSON.stringify({
											page:  bundle.page || "",
											title: bundle.title || "",
											url:   bundle.url || "",
											tiers: (function() {
												var tiers = [];
												for (var tier in bundle.tiers) {
													tiers.push((bundle.tiers[tier].games || []).sort());
												}
												return tiers;
											})()
										});
										if (bundles.indexOf(bundle_normalized) < 0) {
											bundles.push(bundle_normalized);
										} else {
											continue;
										}
										if (data["bundles"]["live"][i]["page"]) { purchase = '<div class="game_area_purchase_game"><div class="game_area_purchase_platform"></div><h1>' + localized_strings.buy_package.replace(/__package__/, data["bundles"]["live"][i]["page"] + ' ' + data["bundles"]["live"][i]["title"]) + '</h1>'; }
										else { purchase = '<div class="game_area_purchase_game_wrapper"><div class="game_area_purchase_game"><div class="game_area_purchase_platform"></div><h1>' + localized_strings.buy_package.replace(/__package__/, data["bundles"]["live"][i]["title"]) + '</h1>'; }
										if (enddate) purchase += '<p class="game_purchase_discount_countdown">' + localized_strings.bundle.offer_ends + ' ' + enddate + '</p>';
										purchase += '<p class="package_contents">';
										var tier_num = 1,
											bundle_price,
											app_name = $(".apphub_AppName").text();
										$.each(data["bundles"]["live"][i]["tiers"], function(index, value) {
											purchase += '<b>';
											if (Object.keys(data["bundles"]["live"][i]["tiers"]).length > 1) {
												var tier_name = value.note || localized_strings.bundle.tier.replace("__num__", tier_num);
												var tier_price = formatCurrency(value.price, currency_type);
												purchase += localized_strings.bundle.tier_includes.replace("__tier__", tier_name).replace("__price__", tier_price).replace("__num__", value.games.length);
											} else {
												purchase += localized_strings.bundle.includes.replace(/\(?__num__\)?/, value.games.length);
											}
											purchase += ':</b> ';
											$.each(value["games"], function(game_index, game_value) {
												if (game_value == app_name) { bundle_price = value["price"]; purchase += "<u>" + game_value + "</u>, "; }
												else { purchase += game_value + ", "; }
											});
											purchase = purchase.replace(/, $/, "");
											purchase += "<br>";
											tier_num += 1;
										});										
										purchase += '</p><div class="game_purchase_action"><div class="game_purchase_action_bg"><div class="btn_addtocart btn_packageinfo"><a class="btnv6_blue_blue_innerfade btn_medium" href="' + data["bundles"]["live"][i]["details"] + '" target="_blank"><span>' + localized_strings.bundle.info + '</span></a></div></div><div class="game_purchase_action_bg">';
										if (bundle_price && bundle_price > 0) {
											if (data["bundles"]["live"][i]["pwyw"]) {
												purchase += '<div class="es_each_box" itemprop="price">';
												purchase += '<div class="es_each">' + localized_strings.bundle.at_least + '</div><div class="es_each_price" style="text-align: right;">' + formatCurrency(bundle_price, currency_type) + '</div>';
											} else {
												purchase += '<div class="game_purchase_price price" itemprop="price">';
												purchase += formatCurrency(bundle_price, currency_type);
											}
											purchase += '</div>';
										}
										purchase += '<div class="btn_addtocart">';
										purchase += '<a class="btnv6_green_white_innerfade btn_medium" href="' + data["bundles"]["live"][i]["url"] + '" target="_blank">';
										purchase += '<span>' + localized_strings.buy + '</span>';
										purchase += '</a></div></div></div></div>';
										$("#game_area_purchase").after(purchase);
										
										$("#game_area_purchase").after("<h2 class='gradientbg'>" + localized_strings.bundle.header + " <img src='//cdn3.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></h2>");
									}
								}
							}
						}
					});
				}
			});
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
			if (text.match(/\buplay/i) && !text.match(/\btuplaydinprosessori/i)) { uplay = true; }

			// Securom detection
			if (text.toUpperCase().indexOf("SECUROM") > 0) { securom = true; }

			// Tages detection			
			if (text.match(/\btages\b/i)) { tages = true; }
			if (text.match(/angebote des tages/i)) { tages = false; }
			if (text.match(/\bsolidshield\b/i)) { tages = true; }

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
			if (type == "app") { string_type = localized_strings.drm_third_party; } else { string_type = localized_strings.drm_third_party_sub; }
			
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
	addtext = "<a href='#' class='es_empty btnv6_green_white_innerfade btn_medium continue' style='float: left;'><span>" + localized_strings.empty_cart + "</span></a>";

	$('.checkout_content').prepend(addtext);
	if ($(".cart_row").length === 0) {
		$(".es_empty").addClass("btn_disabled");
	}

	$(".es_empty").click(function() {
		document.cookie = "shoppingCartGID=0; path=/; expires=Thu, 01-Jan-1970 00:00:01 GMT;";
		window.location.assign('//store.steampowered.com/cart');
	});
}

// User profile pages
function add_community_profile_links() {
	if ($("#reportAbuseModal").length > 0) { var steamID = document.getElementsByName("abuseID")[0].value; }
	if (steamID === undefined && document.documentElement.outerHTML.match(/steamid"\:"(.+)","personaname/)) { var steamID = document.documentElement.outerHTML.match(/steamid"\:"(.+)","personaname/)[1]; }
	var icon_color='';
	var profile_link_icon_background = '';
	storage.get(function(settings) {
		if (settings.profile_steamgifts === undefined) { settings.profile_steamgifts = true; storage.set({'profile_steamgifts': settings.profile_steamgifts}); }
		if (settings.profile_steamrep === undefined) { settings.profile_steamrep = true; storage.set({'profile_steamrep': settings.profile_steamrep}); }
		if (settings.profile_steamdbcalc === undefined) { settings.profile_steamdbcalc = true; storage.set({'profile_steamdbcalc': settings.profile_steamdbcalc}); }
		if (settings.profile_astats === undefined) { settings.profile_astats = true; storage.set({'profile_astats': settings.profile_astats}); }
		if (settings.profile_backpacktf === undefined) { settings.profile_backpacktf = true; storage.set({'profile_backpacktf': settings.profile_backpacktf}); }
		if (settings.profile_astatsnl === undefined) { settings.profile_astatsnl = true; storage.set({'profile_astatsnl': settings.profile_astatsnl}); }
		if (settings.profile_permalink === undefined) { settings.profile_permalink = true; storage.set({'profile_permalink': settings.profile_permalink}); }
		if (settings.show_profile_link_images === undefined) { settings.show_profile_link_images = "gray"; storage.set({'show_profile_link_images': settings.show_profile_link_images}); }
		if (settings.show_profile_link_images!="false"){if(settings.show_profile_link_images=="color"){icon_color="_col";profile_link_icon_background=" profile_link_icon_background"}}
		if (settings.profile_api_info === undefined){ settings.profile_api_info = false; storage.set({'profile_api_info': settings.profile_api_info});}
		if (settings.api_key == false||settings.api_key==""||settings.api_key===undefined){ settings.profile_api_info = false; storage.set({'profile_api_info': settings.profile_api_info});}

		var htmlstr = '';
		if (settings.profile_steamrep) {
			htmlstr += '<div class="profile_count_link"><a href="//steamrep.com/profiles/' + steamID + '" target="_blank"><span class="count_link_label">SteamRep</span>&nbsp;<span class="profile_count_link_total">';
			if (settings.show_profile_link_images!="false"){htmlstr += '<img src="' + chrome.extension.getURL('img/ico/steamrep'+icon_color+'.png') + '" class="profile_link_icon'+profile_link_icon_background+'">';}
			else {htmlstr += '&nbsp;'}
			htmlstr += '</span></a></div>';
		}
		if (settings.profile_steamdbcalc) {
			htmlstr += '<div class="profile_count_link"><a href="//steamdb.info/calculator/?player=' + steamID + '" target="_blank"><span class="count_link_label">SteamDB</span>&nbsp;<span class="profile_count_link_total">';
			if (settings.show_profile_link_images!="false"){htmlstr += '<img src="' + chrome.extension.getURL('img/ico/steamdb.png') + '" class="profile_link_icon">';}
			else {htmlstr += '&nbsp;'}
			htmlstr += '</span></a></div>';
		}
		if (settings.profile_steamgifts) {
			htmlstr += '<div class="profile_count_link"><a href="http://www.steamgifts.com/go/user/' + steamID + '" target="_blank"><span class="count_link_label">SteamGifts</span>&nbsp;<span class="profile_count_link_total">';
			if (settings.show_profile_link_images!="false"){htmlstr += '<img src="' + chrome.extension.getURL('img/ico/steamgifts'+icon_color+'.png') + '" class="profile_link_icon">';}
			else {htmlstr += '&nbsp;'}
			htmlstr += '</span></a></div>';
		}
		if (settings.profile_astats) {
			htmlstr += '<div class="profile_count_link"><a href="//www.achievementstats.com/index.php?action=profile&playerId=' + steamID + '" target="_blank"><span class="count_link_label">Achievement Stats</span>&nbsp;<span class="profile_count_link_total">';
			if (settings.show_profile_link_images!="false"){htmlstr += '<img src="' + chrome.extension.getURL('img/ico/achievementstats'+icon_color+'.png') + '" class="profile_link_icon">';}
			else {htmlstr += '&nbsp;'}
			htmlstr += '</span></a></div>';
		}
		if (settings.profile_backpacktf) {
			htmlstr += '<div class="profile_count_link"><a href="//backpack.tf/profiles/' + steamID + '" target="_blank"><span class="count_link_label">Backpack.tf</span>&nbsp;<span class="profile_count_link_total">';
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
			htmlstr += "<div class=\"profile_count_link\" id=\"es_permalink_div\"><span id=\"es_permalink_text\">"+localized_strings.permalink+"</span><input type=\"text\" id=\"es_permalink\" value=\"//steamcommunity.com/profiles/"+steamID+"\" readonly></div>";
		}

		if (settings.profile_api_info) {
			htmlstr += '<div class="profile_count_link"><a href="//api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=' + settings.api_key + '&steamids='+steamID+'" target="_blank"><span class="count_link_label">API Information</span><span class="profile_count_link_total">&nbsp;</span></div>';
		}
		
		if (htmlstr != '') { $(".profile_item_links").append(htmlstr + "<div style='clear: both;'></div>"); }

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

	$(".profile_item_links").find(".profile_count_link:first").after("<div class='profile_count_link' id='es_wishlist_link'><a href='//steamcommunity.com/profiles/" + steamID + "/wishlist'><span class='count_link_label'>" + localized_strings.wishlist + "</span>&nbsp;<span class='profile_count_link_total' id='es_wishlist_count'></span></a></div>");

	// Get count of wishlisted items
	get_http("//steamcommunity.com/profiles/" + steamID + "/wishlist", function(txt) {
		var html = $.parseHTML(txt);
		var count = ($(html).find(".wishlistRow").length);

		if (count) { $("#es_wishlist_count").text(count); } else { $('#es_wishlist_link').remove(); }
	});	
}

// Add supporter badges to supporter's profiles
function add_supporter_badges() {
	profileData.get("supporter", function(data) {
		var badge_count = data["badges"].length;

		if (badge_count > 0) {
			var html = '<div class="profile_badges" id="es_supporter_badges"><div class="profile_count_link"><a href="http://www.EnhancedSteam.com"><span class="count_link_label">' + localized_strings.es_supporter + '</span>&nbsp;<span class="profile_count_link_total">' + badge_count + '</span></a></div>';

			for (i=0; i < data["badges"].length; i++) {
				if (data["badges"][i].link) {
					html += '<div class="profile_badges_badge" data-community-tooltip="Enhanced Steam<br>' + data["badges"][i].title + '"><a href="' + data["badges"][i].link + '"><img src="' + data["badges"][i].img + '"></a></div>';
				} else {
					html += '<div class="profile_badges_badge" data-community-tooltip="Enhanced Steam<br>' + data["badges"][i].title + '"><img src="' + data["badges"][i].img + '"></div>';
				}
			}

			html += '<div style="clear: left;"></div></div>';
			$(".profile_badges").after(html);
			$("#es_supporter_badges .profile_badges_badge:last").addClass("last");
			runInPageContext(function() { BindCommunityTooltip( $J('[data-community-tooltip]') ); });
		}
	});
}

function add_twitch_info() {
	$(".profile_customization_area").prepend("<div class='profile_customization' id='es_twitch' style='display: none;'></div>");
	var search = $(".profile_summary").find("a[href*='twitch.tv/']")[0];
	if (search) {
		var twitch_id = $(search).attr("href").match(/twitch\.tv\/(.+)/)[1];
		if (twitch_id) {
			twitch_id = twitch_id.replace(/\//g, "");
			get_http("//api.enhancedsteam.com/twitch/?channel=" + twitch_id, function (txt) {
				var data = JSON.parse(txt);
				if (data["streams"].length > 0) {
					var html = "<div class='profile_customization_header'>" + localized_strings.twitch.now_streaming.replace("__username__", data["streams"][0]["channel"]["display_name"]) + "</div><div class='profile_customization_block'><div class='favoritegame_showcase' id='es_twitch'></div></div></div>";
					html += "<div class='showcase_content_bg' style='height: 120px;'><div class='favoritegame_showcase_game showcase_slot'><div class='favorite_game_cap'><a class='whiteLink' href='" + data["streams"][0]["channel"]["url"] + "' target='_blank'>";
					html += "<img style='width: 160px; height: 90px; margin-top: 6px;' src='" + data["streams"][0]["preview"]["template"].replace("{width}", "160").replace("{height}", "90") + "'></a></div><div class='showcase_item_detail_title' style='margin-left: -25px; padding-top: 0px;'>";
					html += "<a class='whiteLink' href='" + data["streams"][0]["channel"]["url"] + "' target='_blank'>" + data["streams"][0]["channel"]["game"] + "</a></div>";
					html += "<div class='favoritegroup_description' style='margin-left: -25px; height: 16px; overflow: hidden;'>" + data["streams"][0]["channel"]["status"] + "</div>";
					html += "<div class='favoritegroup_stats showcase_stats_row' style='position: inherit; margin-left: -25px; margin-top: 8px;'>";
					html += "<div class='showcase_stat favoritegroup_ingame'><div class='value'>" + data["streams"][0]["viewers"].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "</div><div class='label'>" + localized_strings.twitch.viewers + "</div></div>";
					html += "<div class='showcase_stat favoritegroup_online'><div class='value'>" + data["streams"][0]["channel"]["followers"].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "</div><div class='label'>" + localized_strings.twitch.followers + "</div></div>";
					html += "<div class='showcase_stat'><div class='value'>" + data["streams"][0]["channel"]["views"].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "</div><div class='label'>" + localized_strings.twitch.views + "</div></div>";
					$("#es_twitch").html(html);
					$("#es_twitch").slideDown();
				}
			});
		}
	}
}

function alternative_linux_icon() {
	storage.get(function(settings) {
		if (settings.show_alternative_linux_icon === undefined) { settings.show_alternative_linux_icon = false; storage.set({'show_alternative_linux_icon': settings.show_alternative_linux_icon}); }
		if (settings.show_alternative_linux_icon) {
			$("head").append("<style>span.platform_img.linux {background-image: url("+chrome.extension.getURL("img/alternative_linux_icon.png")+")}</style>")
		}
	});
}

function appdata_on_wishlist() {
	if ($('a.btnv6_blue_hoverfade').length < 200) {
		$('a.btnv6_blue_hoverfade').each(function (index, node) {
			var app = get_appid(node.href);
			get_http('//store.steampowered.com/api/appdetails/?appids=' + app, function (data) {
				var storefront_data = JSON.parse(data);
				$.each(storefront_data, function(appid, app_data) {
					if (app_data.success) {
						storage.get(function(settings) {
							if (settings.store_sessionid) {
								// Add "Add to Cart" button
								if (app_data.data.packages && app_data.data.packages[0]) {
									var htmlstring = '<form name="add_to_cart_' + app_data.data.packages[0] + '" action="http://store.steampowered.com/cart/" method="POST">';
									htmlstring += '<input type="hidden" name="snr" value="1_5_9__403">';
									htmlstring += '<input type="hidden" name="action" value="add_to_cart">';
									htmlstring += '<input type="hidden" name="sessionid" value="' + settings.store_sessionid + '">';
									htmlstring += '<input type="hidden" name="subid" value="' + app_data.data.packages[0] + '">';
									htmlstring += '</form>';
									$(node).before('</form>' + htmlstring + '<a href="#" onclick="document.forms[\'add_to_cart_' + app_data.data.packages[0] + '\'].submit();" class="btnv6_green_white_innerfade btn_small"><span>' + localized_strings.add_to_cart + '</span></a>  ');
								}
							}
						});
						// Add platform information
						if (app_data.data.platforms) {
							var htmlstring = "";
							var platforms = 0;
							if (app_data.data.platforms.windows) { htmlstring += "<span class='platform_img win'></span>"; platforms += 1; }
							if (app_data.data.platforms.mac) { htmlstring += "<span class='platform_img mac'></span>"; platforms += 1; }
							if (app_data.data.platforms.linux) { htmlstring += "<span class='platform_img linux'></span>"; platforms += 1; }
							if (platforms > 1) { htmlstring = htmlstring + "<span class='platform_img steamplay'></span>"; }
							$(node).parent().parent().parent().find(".bottom_controls").append(htmlstring);
						}
					}
				});
			});
		});
	}
}

var processing = false;
var search_page = 2;

function load_search_results () {
	if (!processing) {
		processing = true;
		var search = document.URL.match(/(.+)\/(.+)/)[2].replace(/\&page=./, "").replace(/\#/g, "&");
		if ($(".LoadingWrapper").length === 0) {
			$(".search_pagination:last").before('<div class="LoadingWrapper"><div class="LoadingThrobber" style="margin-bottom: 15px;"><div class="Bar Bar1"></div><div class="Bar Bar2"></div><div class="Bar Bar3"></div></div><div id="LoadingText">' + localized_strings.loading + '</div></div>');
		}	
		$.ajax({
			url: 'store.steampowered.com/search/results' + search + '&page=' + search_page + '&snr=es'
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
			$(".search_pagination:last").before("<div style='text-align: center; margin-top: 16px;' id='es_error_msg'>" + localized_strings.search_error + ". <a id='es_retry' style='cursor: pointer;'>" + localized_strings.search_error_retry + ".</a></div>");

			$("#es_retry").click(function() {
				processing = false;
				$("#es_error_msg").remove();
				load_search_results();
			});
		});
	}
}

function load_search_results_greenlight () {
	if (!processing) {
		processing = true;
		var search_url = document.URL.replace(/(?:[?&]p=\d+|(#)|$)/, "&p=" + search_page + "$1");
		if ($(".LoadingWrapper").length === 0) {
			$(".workshopBrowseRow").last().after('<div class="LoadingWrapper"><div class="LoadingThrobber" style="margin-bottom: 15px;"><div class="Bar Bar1"></div><div class="Bar Bar2"></div><div class="Bar Bar3"></div></div><div id="LoadingText">' + localized_strings.loading + '</div></div>');
		}
		$.ajax({
			url: search_url
		}).done(function(data) {
			var dom = $.parseHTML(data, true);
			var rows = $(dom).find(".workshopBrowseRow");
			var script = "";
			$(dom).find(".workshopBrowseRow script").each(function() {
				script += $(this).text() + "\n";
				$(this).remove()
			});
			rows.first().addClass("page_" + search_page);

			$(".LoadingWrapper").remove();
			$(".workshopBrowseRow").last().after(rows);
			runInPageContext("function() {\n" + script + "}");
			search_page++;
			processing = false;

			if (is_element_in_viewport(rows.first().prev()) || is_element_in_viewport(rows.first())) history.replaceState("", "", search_url);
			preview_greenlight_votes();
		}).fail(function() {
			$(".LoadingWrapper").remove();
			$(".workshopBrowseRow").last().after("<div style='text-align: center; margin-top: 16px;' id='es_error_msg'>" + localized_strings.search_error + ". <a id='es_retry' style='cursor: pointer;'>" + localized_strings.search_error_retry + ".</a></div>");

			$("#es_retry").click(function() {
				processing = false;
				$("#es_error_msg").remove();
				load_search_results_greenlight();
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
			$(document.body).append('<link rel="stylesheet" type="text/css" href="//store.akamai.steamstatic.com/public/css/v6/home.css">');
			$(".search_pagination_right").css("display", "none");
			var match = $(".search_pagination_left").text().trim().match(/(\d+)(?:\D+(\d+)\D+(\d+))?/);
			if (match) {
				result_count = match[2] ? Math.max.apply(Math, match.slice(1, 4)) : match[1];
				$(".search_pagination_left").text(localized_strings.results.replace("__num__", result_count));
			}

			search_page = 2;
			$(window).scroll(function () {
				// if the pagination element is in the viewport, continue loading
				if (is_element_in_viewport($(".search_pagination_left"))) {
					if (result_count > $('.search_result_row').length)
						load_search_results();
					else
						$(".search_pagination_left").text(localized_strings.all_results.replace("__num__", result_count));
				}
			});
		}
	});
}

function endless_scrolling_greenlight() {
	storage.get(function(settings) {
		if (settings.endlessscrollinggreenlight === undefined) { settings.endlessscrollinggreenlight = true; storage.set({'endlessscrollinggreenlight': settings.endlessscrollinggreenlight}); }
		if (settings.endlessscrollinggreenlight) {
			$(document.body).append('<link rel="stylesheet" type="text/css" href="//store.akamai.steamstatic.com/public/css/v6/home.css">');
			var result_count;
			var page_match = document.URL.match(/\?(?:[^#]+&)*p=(\d+)/);
			var curr_page = page_match ? parseInt(page_match[1]) : 1;
			search_page = curr_page + 1;
			$(".workshopBrowseRow").first().addClass("page_" + curr_page);
			var last_page = parseInt($(".workshopBrowsePagingControls .pagelink").last().text());
			$(".workshopBrowsePaging *").remove();
			var match = $(".workshopBrowsePagingInfo").text().replace(/\d{1,3}([,. ]?\d{3})*\s*-\s*\d{1,3}([,. ]?\d{3})*/, "").match(/\d{1,3}([,. ]?\d{3})*/);
			if (match) {
				result_count = match[0].replace(/[^\d]/, "");
				$(".workshopBrowsePagingInfo").text(localized_strings.results.replace("__num__", result_count));
			}

			$(window).scroll(function () {
				if (is_element_in_viewport($(".workshopBrowsePaging"))) {
					if (search_page <= last_page) {
						load_search_results_greenlight();
					} else {
						$(".workshopBrowsePagingInfo").text(localized_strings.all_results.replace("__num__", result_count));
					}
				}
				for (var page = 1; page <= last_page; page++) {
					var row = $(".workshopBrowseRow.page_" + page);
					if (row.length && is_element_in_viewport(row)) {
						var curr_url = document.URL.replace(/(?:[?&]p=\d+|(#)|$)/, "&p=" + page + "$1");
						if (curr_url != document.URL) {
							history.replaceState("", "", curr_url);
						}
						break;
					}
				}
			});
		}
	});
}

function add_hide_buttons_to_search() {
	storage.get(function(settings) {
		if (settings.hide_owned === undefined) { settings.hide_owned = false; storage.set({'hide_owned': settings.hide_owned}); }
		if (settings.hide_wishlist === undefined) { settings.hide_wishlist = false; storage.set({'hide_wishlist': settings.hide_wishlist}); }
		if (settings.hide_cart === undefined) { settings.hide_cart = false; storage.set({'hide_cart': settings.hide_cart}); }
		if (settings.hide_notdiscounted === undefined) { settings.hide_notdiscounted = false; storage.set({'hide_notdiscounted': settings.hide_notdiscounted}); }
		if (settings.hide_notinterested === undefined) { settings.hide_notinterested = false; storage.set({'hide_notinterested': settings.hide_notinterested}); }
		
		$("#advsearchform").find(".rightcol").prepend("<div class='block' id='es_hide_menu'><div class='block_header'><div>" + localized_strings.hide + "</div></div><div class='block_content block_content_inner'><div class='tab_filter_control' id='es_owned_games'><div class='tab_filter_control_checkbox'></div><span class='tab_filter_control_label'>" + localized_strings.options.owned + "</span></div><div class='tab_filter_control' id='es_wishlist_games'><div class='tab_filter_control_checkbox'></div><span class='tab_filter_control_label'>" + localized_strings.options.wishlist + "</span></div><div class='tab_filter_control' id='es_cart_games'><div class='tab_filter_control_checkbox'></div><span class='tab_filter_control_label'>" + localized_strings.options.cart + "</span></div><div class='tab_filter_control' id='es_notdiscounted'><div class='tab_filter_control_checkbox'></div><span class='tab_filter_control_label'>" + localized_strings.notdiscounted + "</span></div><div class='tab_filter_control' id='es_notinterested'><div class='tab_filter_control_checkbox'></div><span class='tab_filter_control_label'>" + localized_strings.notinterested + "</span></div></div></div>")

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
				storage.set({'hide_owned': false });
			} else {
				$("#es_owned_games").addClass("checked");
				storage.set({'hide_owned': true });
			}
			add_hide_buttons_to_search_click();
		});

		$("#es_wishlist_games").click(function() {
			if ($("#es_wishlist_games").hasClass("checked")) {
				$("#es_wishlist_games").removeClass("checked");
				storage.set({'hide_wishlist': false });
			} else {
				$("#es_wishlist_games").addClass("checked");
				storage.set({'hide_wishlist': true });
			}
			add_hide_buttons_to_search_click();
		});

		$("#es_cart_games").click(function() {
			if ($("#es_cart_games").hasClass("checked")) {
				$("#es_cart_games").removeClass("checked");
				storage.set({'hide_cart': false });
			} else {
				$("#es_cart_games").addClass("checked");
				storage.set({'hide_cart': true });
			}
			add_hide_buttons_to_search_click();
		});

		$("#es_notdiscounted").click(function() {
			if ($("#es_notdiscounted").hasClass("checked")) {
				$("#es_notdiscounted").removeClass("checked");
				storage.set({'hide_notdiscounted': false });
			} else {
				$("#es_notdiscounted").addClass("checked");
				storage.set({'hide_notdiscounted': true });
			}
			add_hide_buttons_to_search_click();
		});

		$("#es_notinterested").click(function() {
			if ($("#es_notinterested").hasClass("checked")) {
				$("#es_notinterested").removeClass("checked");
				storage.set({'hide_notinterested': false });
			} else {
				$("#es_notinterested").addClass("checked");
				storage.set({'hide_notinterested': true });
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
	$(".home_tabs_row").find(".home_tab:last").after("<div class='home_tab' id='es_popular'><div class='tab_content'>" + localized_strings.popular + "</div></div>");
	var tab_html = "<div id='tab_popular_content' class='tab_content' style='display: none;'>";

	$(".home_tabs_content").append(tab_html);

	$("#es_popular").on("click", function() {
		$(".home_tabs_row").find(".active").removeClass("active");
		$(".home_tabs_content").find(".tab_content").hide();
		$("#es_popular").addClass("active");
		$("#tab_popular_content").show();

		if ($("#tab_popular_content").find("div").length == 0) {
			get_http("//store.steampowered.com/stats", function(txt) {
				var return_text = $.parseHTML(txt);
				var i = 0;
				$(return_text).find(".player_count_row").each(function() {
					if (i < 10) {
						var appid = get_appid($(this).find("a").attr("href"));
						var game_name = $(this).find("a").text();
						var currently = $(this).find(".currentServers:first").text();
						var html = "<div class='tab_item app_impression_tracked' data-ds-appid='" + appid + "' onmouseover='GameHover( this, event, \"global_hover\", {\"type\":\"app\",\"id\":\"" + appid + "\",\"public\":0,\"v6\":1} );' onmouseout='HideGameHover( this, event, \"global_hover\" )' id='tab_row_popular_" + appid + "'>";
						html += "<a class='tab_item_overlay' href='//store.steampowered.com/app/" + appid + "/?snr=1_4_4__106'><img src='//store.akamai.steamstatic.com/public/images/blank.gif'></a><div class='tab_item_overlay_hover'></div>";
						html += "<img class='tab_item_cap' src='//cdn.akamai.steamstatic.com/steam/apps/" + appid + "/capsule_184x69.jpg'>";
						html += "<div class='tab_item_content'><div class='tab_item_name'>" + game_name + "</div><div class='tab_item_details'>" + currently + " " + localized_strings.charts.playing_now + "</div><br clear='all'></div>";

						html += "</div>";
						$("#tab_popular_content").append(html);
						i++;
					}
				});
				$("#tab_popular_content").append("<div class='tab_see_more'>"+localized_strings.see_more+": <a href='//store.steampowered.com/stats/' class='btnv6_blue_hoverfade btn_small_tall'><span>"+localized_strings.popular+"</span></a></div>");
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
		get_http("//store.steampowered.com/search/?sort_by=Released_DESC&category1=" + search, function(txt) {
			var return_text = $.parseHTML(txt);
			$(return_text).find(".search_result_row").each(function(i, item) {
				var appid = get_appid($(this).attr("href"));
				var game_name = $(this).find(".title").text();
				var platform = $(this).find(".search_name p:last").html();
				var release_date = $(this).find(".search_released").text();
				var discount_pct = $(this).find(".search_discount span:last").text();
				var price = $(this).find(".search_price").html();
				var html = "<div class='tab_item app_impression_tracked' data-ds-appid='" + appid + "' onmouseover='GameHover( this, event, \"global_hover\", {\"type\":\"app\",\"id\":\"" + appid + "\",\"public\":0,\"v6\":1} );' onmouseout='HideGameHover( this, event, \"global_hover\" )' id='tab_row_popular_" + appid + "'>";
				html += "<a class='tab_item_overlay' href='//store.steampowered.com/app/" + appid + "/?snr=1_4_4__106'><img src='//store.akamai.steamstatic.com/public/images/blank.gif'></a><div class='tab_item_overlay_hover'></div>";
				html += "<img class='tab_item_cap' src='//cdn.akamai.steamstatic.com/steam/apps/" + appid + "/capsule_184x69.jpg'>";
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
			$("#tab_allreleases_content").append("<div id='es_allreleases_btn' class='home_actions_ctn' style='margin-bottom: 4px; display: none; visibility: visible; position: relative;'><div class='home_btn home_customize_btn' style='z-index: 13; position: absolute; right: -2px;'>" + localized_strings.customize + "</div></div>");
			
			storage.get(function(settings) {
				if (settings.show_allreleases_games === undefined) { settings.show_allreleases_games = true; storage.set({'show_allreleases_games': settings.show_allreleases_games}); }
				if (settings.show_allreleases_video === undefined) { settings.show_allreleases_video = true; storage.set({'show_allreleases_video': settings.show_allreleases_video}); }
				if (settings.show_allreleases_demos === undefined) { settings.show_allreleases_demos = true; storage.set({'show_allreleases_demos': settings.show_allreleases_demos}); }
				if (settings.show_allreleases_mods === undefined) { settings.show_allreleases_mods = true; storage.set({'show_allreleases_mods': settings.show_allreleases_mods}); }
				if (settings.show_allreleases_packs === undefined) { settings.show_allreleases_packs = true; storage.set({'show_allreleases_packs': settings.show_allreleases_packs}); }
				if (settings.show_allreleases_dlc === undefined) { settings.show_allreleases_dlc = true; storage.set({'show_allreleases_dlc': settings.show_allreleases_dlc}); }
				if (settings.show_allreleases_guide === undefined) { settings.show_allreleases_guide = true; storage.set({'show_allreleases_guide': settings.show_allreleases_guide}); }
				if (settings.show_allreleases_softw === undefined) { settings.show_allreleases_softw = true; storage.set({'show_allreleases_softw': settings.show_allreleases_softw}); }

				var html = "<div class='home_viewsettings_popup' style='display: none; z-index: 12; right: 0px; top: 19px;'><div class='home_viewsettings_instructions' style='font-size: 12px;'>" + localized_strings.allreleases_products + "</div>"

				// Games
				text = localized_strings.games;
				if (settings.show_allreleases_games) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_games'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
				else { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_games'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }

				// Videos / Trailers
				text = localized_strings.videos;
				if (settings.show_allreleases_video) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_video'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
				else { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_video'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";	}

				// Demos
				text = localized_strings.demos;
				if (settings.show_allreleases_demos) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_demos'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
				else { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_demos'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }

				// Mods
				text = localized_strings.mods;
				if (settings.show_allreleases_mods) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_mods'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
				else { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_mods'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }

				// Packs
				text = localized_strings.packs;
				if (settings.show_allreleases_packs) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_packs'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
				else { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_packs'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";	}

				// Downloadable Content
				text = localized_strings.dlc;
				if (settings.show_allreleases_dlc) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_dlc'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
				else { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_dlc'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }

				// Guides
				text = localized_strings.guides;
				if (settings.show_allreleases_guide) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_guide'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
				else { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_allreleases_guide'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }

				// Software
				text = localized_strings.software;
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

			var greenlight_info = '<link rel="stylesheet" type="text/css" href="//cdn.steamcommunity.com/public/shared/css/apphub.css">';
			greenlight_info += '<div class="apphub_HeaderTop es_greenlight"><div class="apphub_AppName ellipsis">Greenlight</div><div style="clear: both"></div>'
			greenlight_info += '<div class="apphub_sectionTabs">';
			greenlight_info += '<a class="apphub_sectionTab" id="games_apphub_sectionTab" href="//steamcommunity.com/workshop/browse/?appid=765&section=items"><span>'+localized_strings.games+'</span></a>';
			greenlight_info += '<a class="apphub_sectionTab" id="software_apphub_sectionTab" href="//steamcommunity.com/workshop/browse/?appid=765&section=software"><span>'+localized_strings.software+'</span></a>';
			greenlight_info += '<a class="apphub_sectionTab" id="concepts_apphub_sectionTab" href="//steamcommunity.com/workshop/browse/?appid=765&section=concepts"><span>'+localized_strings.concepts+'</span></a>';
			greenlight_info += '<a class="apphub_sectionTab" id="collections_apphub_sectionTab" href="//steamcommunity.com/workshop/browse/?appid=765&section=collections"><span>'+localized_strings.collections+'</span></a>';
			greenlight_info += '<a class="apphub_sectionTab" href="//steamcommunity.com/workshop/discussions/?appid=765"><span>'+localized_strings.discussions+'</span></a>';
			greenlight_info += '<a class="apphub_sectionTab" href="//steamcommunity.com/workshop/about/?appid=765&section=faq"><span>'+localized_strings.about_greenlight+'</span></a>';
			greenlight_info += '<a class="apphub_sectionTab" href="//steamcommunity.com/workshop/news/?appid=765"><span>'+localized_strings.news+'</span></a>';
			greenlight_info += '</div>';
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
					case localized_strings.games:
						$("#games_apphub_sectionTab").toggleClass("active");
						break;
					case localized_strings.software:
						$("#software_apphub_sectionTab").toggleClass("active");
						break;
					case localized_strings.concepts:
						$("#concepts_apphub_sectionTab").toggleClass("active");
						break;
					case localized_strings.collections:
						breadcrumbs.before(greenlight_info);
						$("#collections_apphub_sectionTab").toggleClass("active");
						break;
				}
			}
		}
	});
}

function remember_greenlight_filter() {
	var deferred = new $.Deferred();
	storage.get(function(settings) {
		if (settings.remembergreenlightfilter === undefined) { settings.remembergreenlightfilter = false; storage.set({'remembergreenlightfilter': settings.remembergreenlightfilter}); }
		if (settings.greenlightfilteroptions === undefined) { settings.greenlightfilteroptions = []; storage.set({'greenlightfilteroptions': settings.greenlightfilteroptions}); }
		if (settings.remembergreenlightfilter && !$(".searchedForTerm[onclick^=RemoveSearchTerm]").length) {
			function setGreenlightFilter(option, checked) {
				var i = $.inArray(option, settings.greenlightfilteroptions);
				if (checked && i == -1) {
					settings.greenlightfilteroptions.push(option);
				} else if (!checked && i > -1) {
					settings.greenlightfilteroptions.splice(i, 1);
				}
				settings.greenlightfilteroptions.sort();
				storage.set({'greenlightfilteroptions': settings.greenlightfilteroptions});
			}

			var checkboxes = $(".filterOption input[type=checkbox]");

			if (!$(".searchedForTerm").length && settings.greenlightfilteroptions.length) {
				var form = $("#TagsFilterForm").clone();
				form.find("#workshopSearchText").remove();
				var ajax_url = "//" + document.location.host + document.location.pathname + "?" + form.serialize();
				checkboxes.each(function() {
					var option = this.id;
					var i = $.inArray(option, settings.greenlightfilteroptions);
					if (i > -1) {
						this.checked = true;
						ajax_url += "&" + encodeURIComponent(this.name) + "=" + encodeURIComponent(this.value);
					}
				});
				get_http(ajax_url, function(txt) {
					var parent = $("div.workshopBrowsePagingWithBG").parent();
					parent.find("> div").remove();
					var dom = $.parseHTML(txt, true);
					var script = "";
					var divs = $(dom).find("div.workshopBrowsePagingWithBG").parent().find("> div");
					divs.find("script").each(function() {
						script += $(this).text() + "\n";
						$(this).remove();
					});
					parent.append(divs);
					runInPageContext("function() {\n" + script + "}");
					history.replaceState("", "", ajax_url);
					deferred.resolve();
				});
			} else {
				deferred.resolve();
			}

			checkboxes.click(function() {
				setGreenlightFilter(this.id, this.checked);
			});

			$(".searchedForTerm").click(function() {
				var match = this.getAttribute("onclick").match(/RemoveSearchTagCheckbox\(\s*'([^']+)'\s*\)/);
				if (match) {
					setGreenlightFilter(match[1], false);
				}
			});
		} else {
			deferred.resolve();
		}
	});
	return deferred.promise();
}

var greenlightCache = (function() {
	function greenlightCache_clean(cache) {
		var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
		$.each(cache, function(key, values) {
			if (values[3] < expire_time) {
				delete cache[key];
			}
		});
	}
	function greenlightCache_set(id, cache_item) {
		var cache = $.parseJSON(localStorage.getItem("greenlightCache")) || {};
		greenlightCache_clean(cache);
		cache[id] = [cache_item.vote, cache_item.favorited, cache_item.followed, parseInt(Date.now() / 1000, 10)];
		localStorage.setItem("greenlightCache", JSON.stringify(cache));
	}
	function greenlightCache_get(id) {
		var cache = $.parseJSON(localStorage.getItem("greenlightCache")) || {};
		greenlightCache_clean(cache);
		if (cache[id]) {
			return {
				vote: cache[id][0],
				favorited: cache[id][1],
				followed: cache[id][2]
			};
		}
	}
	return {
		get: greenlightCache_get,
		set: greenlightCache_set
	}
})();

function preview_greenlight_votes() {
	if (!is_signed_in) return;
	storage.get(function(settings) {
		if (settings.dynamicgreenlight === undefined) { settings.dynamicgreenlight = false; storage.set({'dynamicgreenlight': settings.dynamicgreenlight}); }
		if (settings.dynamicgreenlight) {
			var items = $(".workshopItem:not(.gh_checked) > a:first-child");
			items.each(function() {
				var match = this.href.match("^[^:]+://steamcommunity\\.com/sharedfiles/filedetails/\\?id=(\\d+)");
				if (match) {
					var id = parseInt(match[1], 10);
					var parent = $(this).parent();
					parent.addClass("gh_checked");
					var promise;
					var cache_item = greenlightCache.get(id);
					if (cache_item) {
						var deferred = new $.Deferred();
						promise = deferred.promise();
						deferred.resolve();
					} else {
						cache_item = {
							vote: null,
							favorited: false,
							followed: false
						};
						promise = get_http(this.href, function (data) {
							if (data.match(/<[^>]*FavoriteItemOptionFavorited[^>]*selected[^>]*>([^<]*)</)) cache_item.favorited = true;
							if (data.match(/<[^>]*FollowItemOptionFollowed[^>]*selected[^>]*>([^<]*)</)) cache_item.followed = true;
							var match_vote = data.match(/<a[^>]*toggled[^>]*id="Vote(Up|Down|Later)Btn"[^>]*>/);
							if (match_vote) {
								cache_item.vote = match_vote[1].toLowerCase();
								greenlightCache.set(id, cache_item);
							}
						}, {context: parent}).promise();
					}
					promise.done(function() {
						var match_favorited = cache_item.favorited;
						var match_followed = cache_item.followed;
						if (match_favorited || match_followed) {
							var indicators_right = $("<div class='gh_indicators gh_indicators_right'></div>");
							if (match_favorited) {
								indicators_right.append("<div class='gh_indicators gh_favorited' title='"+localized_strings.favorited+"'></div>");
							}
							if (match_followed) {
								indicators_right.append("<div class='gh_indicators gh_followed' title='"+localized_strings.followed+"'></div>");
							}
							parent.prepend(indicators_right);
						}
						if (cache_item.vote) {
							parent.addClass("gh_fade");
							parent.addClass("gh_vote_" + cache_item.vote);
						}
					});
				}
			});
		}
	});
}

function hide_spam_comments() {
	storage.get(function(settings) {
		if (settings.hidespamcomments === undefined) { settings.hidespamcomments = false; storage.set({'hidespamcomments': settings.hidespamcomments}); }
		if(settings.hidespamcomments) {
			if (settings.spamcommentregex === undefined) { settings.spamcommentregex = "[\\u2500-\\u27BF]"; storage.set({'spamcommentregex': settings.spamcommentregex}); }
			var spam_regex = new RegExp(settings.spamcommentregex);
			var spam_comment_show = "<div class='es_bad_comment_num' title=\"" + localized_strings.spam_comment_warn + "\">" + localized_strings.spam_comment_show+"</div>"
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
			profileData.get("steamrep", function(txt) {
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

function add_posthistory_link() {
	$("#profile_action_dropdown .popup_body .profile_actions_follow").after("<a class='popup_menu_item' href='" + window.location.pathname + "/posthistory'><img src='//steamcommunity-a.akamaihd.net/public/images/skin_1/icon_btn_comment.png'>&nbsp; " + localized_strings.post_history + "</a>");
}

function add_profile_style() {
	profileData.get("profile_style", function(data) {
		var txt = data.style;
		var available_styles = ["clear", "green", "holiday2014", "orange", "pink", "purple", "red", "teal", "yellow", "blue"];
		if ($.inArray(txt, available_styles) > -1) {
			switch (txt) {
				case "holiday2014":
					$("head").append("<link rel='stylesheet' type='text/css' href='http://steamcommunity-a.akamaihd.net/public/css/skin_1/holidayprofile.css'>");
					$(".profile_header_bg_texture").append("<div class='holidayprofile_header_overlay'></div>");
					$(".profile_page").addClass("holidayprofile");
					$.getScript("http://steamcommunity-a.akamaihd.net/public/javascript/holidayprofile.js").done(function() {
						runInPageContext("function() { StartAnimation(); }");
					});
					break;
				case "clear":
					$("head").append("<link rel='stylesheet' type='text/css' href='" + chrome.extension.getURL("img/profile_styles/" + txt + "/style.css") + "'>");
					$(".profile_header_bg").css("background-image", "url('" + chrome.extension.getURL("img/profile_styles/" + txt + "/profile_header_bg.png") + "')");
					$(".profile_header_bg_texture").css("background-image", "none");
					break;
				default:
					$("head").append("<link rel='stylesheet' type='text/css' href='" + chrome.extension.getURL("img/profile_styles/" + txt + "/style.css") + "'>");
					$(".profile_header_bg_texture").css("background-image", "url('" + chrome.extension.getURL("img/profile_styles/" + txt + "/header.jpg") + "')");
					$(".profile_customization").css("background-image", "url('" + chrome.extension.getURL("img/profile_styles/" + txt + "/showcase.png") + "')");
					break;
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

// Add Metacritic user scores to store page
function add_metacritic_userscore() {
	// Add metacritic user reviews
	storage.get(function(settings) {
		if (settings.showmcus === undefined) { settings.showmcus = true; storage.set({'showmcus': settings.showmcus}); }
		if (settings.showmcus) {
			if ($("#game_area_metascore")) {
				var metalink = $("#game_area_metalink").find("a").attr("href");
				storePageData.get("metacritic", function(data) {
					if (data.userscore) {
						var metauserscore = data.userscore*10;
						var newmeta = '<div id="game_area_metascore" style="background-image: url(' + chrome.extension.getURL("img/metacritic_bg.png") + ');"><span>' + metauserscore + '</span><span class="ms_slash">/</span><span class="ms_base">100</span></div>';
						if (!isNaN(metauserscore)) $("#game_area_metascore").after(newmeta);
					}
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
			$(".game_details").find(".details_block:first").before('<div id="es_review_score"><div style="display: inline-block; margin-right: 25px;"><img src="//store.akamai.steamstatic.com/public/shared/images/userreviews/icon_thumbsUp_v6.png" width="24" height="24" class="es_review_image"><span class="es_review_text"> ' + pos_percent + '%</span></div><div style="display: inline-block;"><img src="//store.akamai.steamstatic.com/public/shared/images/userreviews/icon_thumbsDown_v6.png" width="24" height="24" class="es_review_image"><span class="es_review_text"> ' + neg_percent + '%</span></div><div style="clear: both;"></div></div>');
		}
	}
}

function add_hltb_info(appid) {
	storage.get(function(settings) {
		if (settings.showhltb === undefined) { settings.showhltb = true; storage.set({'showhltb': settings.showhltb}); }
		if (settings.showhltb) {
			storePageData.get("hltb", function(data) {
				if (data["hltb"]) {
					how_long_html = "<div class='block game_details underlined_links'>"
						+ "<div class='block_header'><h4>How Long to Beat</h4></div>"
						+ "<div class='block_content'><div class='block_content_inner'><div class='details_block'>";
					if (data["hltb"]["main_story"]){
						how_long_html += "<b>" + localized_strings.hltb.main + ":</b><span style='float: right;'>" + escapeHTML(data['hltb']['main_story']) + "</span><br>";
					}
					if (data["hltb"]["main_extras"]){
						how_long_html += "<b>" + localized_strings.hltb.main_e + ":</b><span style='float: right;'>" + escapeHTML(data['hltb']['main_extras']) + "</span><br>";
					}
					if (data["hltb"]["comp"]) {
						how_long_html += "<b>" + localized_strings.hltb.compl + ":</b><span style='float: right;'>" + escapeHTML(data['hltb']['comp']) + "</span><br>"
					}
					how_long_html += "</div>"
						+ "<a class='linkbar' href='" + escapeHTML(data['hltb']['url']) + "' target='_blank'>" + localized_strings.more_information + " <img src='//cdn2.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"
						+ "<a class='linkbar' href='" + escapeHTML(data['hltb']['submit_url']) + "' target='_blank'>" + localized_strings.hltb.submit + " <img src='//cdn2.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"
						+ "</div></div></div>";
					$("div.game_details:first").after(how_long_html);
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
			$('#ReportAppBtn').parent().prepend('<a class="btnv6_blue_hoverfade btn_medium pcgw_btn" target="_blank" href="http://pcgamingwiki.com/api/appid.php?appid=' + appid + '" style="display: block; margin-bottom: 6px;"><span><i class="ico16" style="background-image:url(' + chrome.extension.getURL("img/pcgw.png") + ')"></i>&nbsp;&nbsp; ' + localized_strings.wiki_article.replace("__pcgw__","PCGamingWiki") + '</span></a>');
		}
	});
}

// Add link to Steam Card Exchange
function add_steamcardexchange_link(appid){
	storage.get(function(settings) {
		if (settings.showsteamcardexchange === undefined ){ settings.showsteamcardexchange = false; storage.set({'showsteamcardexchange': settings.showsteamcardexchange}); }
		if (settings.showsteamcardexchange) {
			if ($(".icon").find('img[src$="/ico_cards.png"]').length > 0) {
				$("#ReportAppBtn").parent().prepend('<a class="btnv6_blue_hoverfade btn_medium cardexchange_btn" target="_blank" href="http://www.steamcardexchange.net/index.php?gamepage-appid-' + appid + '" style="display: block; margin-bottom: 6px;"><span><i class="ico16" style="background-image:url(' + chrome.extension.getURL("img/steamcardexchange.png") + ')"></i>&nbsp;&nbsp; ' + localized_strings.view_in + ' Steam Card Exchange</span></a>');
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
				storePageData.get("wsgf", function(data) {
					if (data.node) {
						$("div.game_details:first").each(function (index, node) {
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
									wsg_text = localized_strings.wsgf.gold.replace(/__type__/g, "Widescreen");
									break;
								case "B":
									wsg_icon = chrome.extension.getURL("img/wsgf/ws-silver.png");
									wsg_text = localized_strings.wsgf.silver.replace(/__type__/g, "Widescreen");
									break;
								case "C":
									wsg_icon = chrome.extension.getURL("img/wsgf/ws-limited.png");
									wsg_text = localized_strings.wsgf.limited.replace(/__type__/g, "Widescreen");
									break;
								case "Incomplete":
									wsg_icon = chrome.extension.getURL("img/wsgf/ws-incomplete.png");
									wsg_text = localized_strings.wsgf.incomplete;
									break;
								case "Unsupported":
									wsg_icon = chrome.extension.getURL("img/wsgf/ws-unsupported.png");
									wsg_text = localized_strings.wsgf.unsupported.replace(/__type__/g, "Widescreen");
									break;
							}

							switch (mmg) {
								case "A":
									mmg_icon = chrome.extension.getURL("img/wsgf/mm-gold.png");
									mmg_text = localized_strings.wsgf.gold.replace(/__type__/g, "Multi-Monitor");
									break;
								case "B":
									mmg_icon = chrome.extension.getURL("img/wsgf/mm-silver.png");
									mmg_text = localized_strings.wsgf.silver.replace(/__type__/g, "Multi-Monitor");
									break;
								case "C":
									mmg_icon = chrome.extension.getURL("img/wsgf/mm-limited.png");
									mmg_text = localized_strings.wsgf.limited.replace(/__type__/g, "Multi-Monitor");
									break;
								case "Incomplete":
									mmg_icon = chrome.extension.getURL("img/wsgf/mm-incomplete.png");
									mmg_text = localized_strings.wsgf.incomplete;
									break;
								case "Unsupported":
									mmg_icon = chrome.extension.getURL("img/wsgf/mm-unsupported.png");
									mmg_text = localized_strings.wsgf.unsupported.replace(/__type__/g, "Multi-Monitor");
									break;
							}

							switch (uws) {
								case "A":
									uws_icon = chrome.extension.getURL("img/wsgf/uw-gold.png");
									uws_text = localized_strings.wsgf.gold.replace(/__type__/g, "Ultra-Widescreen");
									break;
								case "B":
									uws_icon = chrome.extension.getURL("img/wsgf/uw-silver.png");
									uws_text = localized_strings.wsgf.silver.replace(/__type__/g, "Ultra-Widescreen");
									break;
								case "C":
									uws_icon = chrome.extension.getURL("img/wsgf/uw-limited.png");
									uws_text = localized_strings.wsgf.limited.replace(/__type__/g, "Ultra-Widescreen");
									break;
								case "Incomplete":
									uws_icon = chrome.extension.getURL("img/wsgf/uw-incomplete.png");
									uws_text = localized_strings.wsgf.incomplete;
									break;
								case "Unsupported":
									uws_icon = chrome.extension.getURL("img/wsgf/uw-unsupported.png");
									uws_text = localized_strings.wsgf.unsupported.replace(/__type__/g, "Ultra-Widescreen");
									break;
							}

							switch (fkg) {
								case "A":
									fkg_icon = chrome.extension.getURL("img/wsgf/4k-gold.png");
									fkg_text = localized_strings.wsgf.gold.replace(/__type__/g, "4k UHD");
									break;
								case "B":
									fkg_icon = chrome.extension.getURL("img/wsgf/4k-silver.png");
									fkg_text = localized_strings.wsgf.silver.replace(/__type__/g, "4k UHD");
									break;
								case "C":
									fkg_icon = chrome.extension.getURL("img/wsgf/4k-limited.png");
									fkg_text = localized_strings.wsgf.limited.replace(/__type__/g, "4k UHD");
									break;
								case "Incomplete":
									fkg_icon = chrome.extension.getURL("img/wsgf/4k-incomplete.png");
									fkg_text = localized_strings.wsgf.incomplete;
									break;
								case "Unsupported":
									fkg_icon = chrome.extension.getURL("img/wsgf/4k-unsupported.png");
									fkg_text = localized_strings.wsgf.unsupported.replace(/__type__/g, "4k UHD");
									break;
							}

							var html = "<div class='block underlined_links'><div class='block_header'><h4>"+localized_strings.wsgf.certifications+"</h4></div><div class='block_content'><div class='block_content_inner'><div class='details_block'><center>";

							if (wsg != "Incomplete") { html += "<a target='_blank' href='" + escapeHTML(path) + "'><img src='" + escapeHTML(wsg_icon) + "' height='120' title='" + escapeHTML(wsg_text) + "' border=0></a>&nbsp;&nbsp;&nbsp;"; }
							if (mmg != "Incomplete") { html += "<a target='_blank' href='" + escapeHTML(path) + "'><img src='" + escapeHTML(mmg_icon) + "' height='120' title='" + escapeHTML(mmg_text) + "' border=0></a>&nbsp;&nbsp;&nbsp;"; }
							if (uws != "Incomplete") { html += "<a target='_blank' href='" + escapeHTML(path) + "'><img src='" + escapeHTML(uws_icon) + "' height='120' title='" + escapeHTML(uws_text) + "' border=0></a>&nbsp;&nbsp;&nbsp;"; }
							if (fkg != "Incomplete") { html += "<a target='_blank' href='" + escapeHTML(path) + "'><img src='" + escapeHTML(fkg_icon) + "' height='120' title='" + escapeHTML(fkg_text) + "' border=0></a>&nbsp;&nbsp;&nbsp;"; }
							if (path) { html += "</center><br><a class='linkbar' target='_blank' href='" + escapeHTML(path) + "'>" + localized_strings.rating_details + " <img src='//cdn2.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"; }
							html += "</div></div></div></div>";
							$(node).after(html);
						});
						
					}
				});
			}
		}
	});
}

function add_dlc_page_link(appid) {
	if ($(".game_area_dlc_section").length > 0) {
		var html = $(".game_area_dlc_section").html();
		title = html.match(/<h2 class=\"gradientbg">(.+)<\/h2>/)[1];
		html = html.replace(title, "<a href='//store.steampowered.com/dlc/" + appid + "'>" + title + "</a>");
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
				$("#moreInfo").before('<div id="es_summary"><div class="market_search_sidebar_contents"><h2 class="market_section_title">'+ localized_strings.market_transactions +'</h2><div class="market_search_game_button_group" id="es_market_summary" style="width: 238px"><img src="//cdn.steamcommunity.com/public/images/login/throbber.gif"><span>'+ localized_strings.loading +'</span></div></div></div>');

				var pur_total = 0.0;
				var sale_total = 0.0;

				function get_market_data(txt) {
					var data = JSON.parse(txt);
					market = data['results_html'];
					
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
					var net = sale_total - pur_total;

					var html = localized_strings.purchase_total + ":<span class='es_market_summary_item'>" + formatCurrency(parseFloat(pur_total)) + "</span><br>";
					html += localized_strings.sales_total + ":<span class='es_market_summary_item'>" + formatCurrency(parseFloat(sale_total)) + "</span><br>";
					if (net > 0) {
						html += localized_strings.net_gain + ":<span class='es_market_summary_item' style='color: green;'>" + formatCurrency(parseFloat(net)) + "</span>";
					} else {
						html += localized_strings.net_spent + ":<span class='es_market_summary_item' style='color: red;'>" + formatCurrency(parseFloat(net)) + "</span>";
					}

					$("#es_market_summary").html(html);
				}

				var start = 0;
				var count = 500;
				var i = 1;
				get_http("//steamcommunity.com/market/myhistory/render/?query=&start=0&count=1", function (last_transaction) {
					var data = JSON.parse(last_transaction);
					var total_count = data["total_count"];
					var loops = Math.ceil(total_count / count);

					if (loops) {
						while ((start + count) < (total_count + count)) {
							get_http("//steamcommunity.com/market/myhistory/render/?query=&start=" + start + "&count=" + count, function (txt) {
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
		});
		
		if (total != 0) {
			total = formatCurrency(parseFloat(total));
			total_after = formatCurrency(parseFloat(total_after));
			$(".my_listing_section:first .market_recent_listing_row:last").clone().appendTo($(".my_listing_section:first .market_recent_listing_row:last").parent()).attr("id", "es_selling_total");
			$("#es_selling_total").find("img").remove();
			$("#es_selling_total").find(".market_listing_edit_buttons").empty();
			$("#es_selling_total").find(".market_listing_listed_date").empty();
			$("#es_selling_total").find(".market_listing_item_name_block").empty();
			$("#es_selling_total").find(".market_table_value").css("margin-top", "3px").css("margin-bottom", "3px");
			$("#es_selling_total").find(".market_listing_price").html("<span style='color: white'>" + total + "</span><br><span style='color: #AFAFAF'>(" + total_after + ")</span></span></span><br><span class='market_listing_game_name'>" + localized_strings.sales_total + "</span>");
		}

		var total = 0;
		
		$(".my_listing_section:nth-child(2)").find(".market_listing_row").find(".market_listing_my_price:first").each(function() {
			var qty = $(this).parent().find(".market_listing_my_price:last").text().trim();
			var price = parse_currency($(this).text().replace(/.+@/, "").trim());
			total += Number(price.value) * Number(qty);
		});
		
		if (total != 0) {
			total = formatCurrency(parseFloat(total));
			//$(".my_listing_section:nth-child(2)").append("<div class='market_listing_row market_recent_listing_row'><div class='market_listing_right_cell market_listing_edit_buttons placeholder'></div><div class='market_listing_my_price es_active_total'><span class='market_listing_item_name' style='color: white'>" + escapeHTML(total) + "</span><br><span class='market_listing_game_name'>" + escapeHTML(localized_strings.buying_total) + "</span></div></div>");
			$(".my_listing_section:nth-child(2) .market_recent_listing_row:last").clone().appendTo($(".my_listing_section:nth-child(2) .market_recent_listing_row:last").parent()).attr("id", "es_buying_total");
			$("#es_buying_total").find("img").remove();
			$("#es_buying_total").find(".market_listing_edit_buttons").empty();
			$("#es_buying_total").find(".market_listing_item_name_block").empty();
			$("#es_buying_total").find(".market_listing_buyorder_qty").empty();
			$("#es_buying_total").find(".market_table_value").css("margin-top", "3px").css("margin-bottom", "3px");
			$("#es_buying_total").find(".market_listing_price").html("<span style='color: white'>" + total + "</span><br><span class='market_listing_game_name'>" + localized_strings.buying_total + "</span>");
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

// Show the lowest market price for items you're selling
function add_lowest_market_price() {
	$("#tabContentsMyListings .market_listing_table_header span:first").css("width", "200px");
	$("#tabContentsMyListings .market_listing_table_header span:first").after("<span class='market_listing_right_cell market_listing_my_price'><a class='es_market_lowest_button'>" + localized_strings.lowest + "</a></span>");
	$("#tabContentsMyListings .my_listing_section:first .market_listing_row").each(function() {
		$(this).find(".market_listing_edit_buttons:first").css("width", "200px");
		$(this).find(".market_listing_edit_buttons:first").after("<div class='market_listing_right_cell market_listing_my_price market_listing_es_lowest'>&nbsp;</div>");
		$(this).find(".market_listing_edit_buttons.actual_content").appendTo($(this).find(".market_listing_edit_buttons:first")).css("width", "inherit");
	});

	function add_lowest_market_price_data(item_id) {
		var cc = "us";
		var currency = currency_type_to_number(user_currency);

		// Get country code from Steam cookie
		var cookies = document.cookie;
		var matched = cookies.match(/fakeCC=([a-z]{2})/i);
		if (matched != null && matched.length == 2) {
			cc = matched[1];
		} else {
			matched = cookies.match(/steamCC(?:_\d+){4}=([a-z]{2})/i);
			if (matched != null && matched.length == 2) {
				cc = matched[1];
			}
		}

		if (item_id) {
			var node = $("#" + item_id);
			var link = node.find(".market_listing_item_name_link").attr("href");
			if (link) {
				var appid = link.match(/\/(\d+)\/.+$/)[1];
				var market_hash_name = link.match(/\/\d+\/(.+)$/)[1];
				get_http("//steamcommunity.com/market/priceoverview/?country=" + cc + "&currency=" + currency + "&appid=" + appid + "&market_hash_name=" + market_hash_name, function(json) {
					var data = JSON.parse(json);
					if (data["success"]) {
						node.find(".market_listing_es_lowest").html(data["lowest_price"]);
						var my_price = parse_currency($(node).find(".market_listing_price span span:first").text().trim());
						var low_price = parse_currency(node.find(".market_listing_es_lowest").text());

						// Ours matches the lowest price
						if (my_price.value <= low_price.value) {
							node.find(".market_listing_es_lowest").addClass("es_percentage_lower");
						}

						// Our price is higher than the lowest price
						if (my_price.value > low_price.value) {
							node.find(".market_listing_es_lowest").addClass("es_percentage_higher");
						}
					}
				});
			}
		} else {
			$("#tabContentsMyListings .market_listing_row").each(function() {
				var node = $(this);
				var link = node.find(".market_listing_item_name_link").attr("href");
				if (link) {
					var appid = link.match(/\/(\d+)\/.+$/)[1];
					var market_hash_name = link.match(/\/\d+\/(.+)$/)[1];
					get_http("//steamcommunity.com/market/priceoverview/?country=" + cc + "&currency=" + currency + "&appid=" + appid + "&market_hash_name=" + market_hash_name, function(json) {
						var data = JSON.parse(json);
						if (data["success"]) {
							node.find(".market_listing_es_lowest").html(data["lowest_price"]);
							var my_price = parse_currency($(node).find(".market_listing_price span span:first").text().trim());
							var low_price = parse_currency(node.find(".market_listing_es_lowest").text());

							// Ours matches the lowest price
							if (my_price.value <= low_price.value) {
								node.find(".market_listing_es_lowest").addClass("es_percentage_lower");
							}

							// Our price is higher than the lowest price
							if (my_price.value > low_price.value) {
								node.find(".market_listing_es_lowest").addClass("es_percentage_higher");
							}
						}
					});
				}
			});
		}
	}

	if ($("#tabContentsMyListings .market_listing_row").length <= 11 ) {
		add_lowest_market_price_data();
	} else {
		$(".market_listing_es_lowest").html("<a class='es_market_lowest_button'><img src='//store.akamai.steamstatic.com/public/images/v6/ico/ico_cloud.png' height=24 style='margin-top: 13px;'></a>");
		$("#es_selling_total .market_listing_es_lowest").html("&nbsp;");
	}
	$(".es_market_lowest_button").click(function() {
		add_lowest_market_price_data($(this).parent().parent().attr("id"));
	});
}

// Add a "Total spent on Steam" to the account details page
function account_total_spent() {
	storage.get(function(settings) {
		if (settings.showtotal === undefined) { settings.showtotal = true; storage.set({'showtotal': settings.showtotal}); }
		if (settings.showtotal) {
			if ($('.accountBalance').length !== 0) {
				currencyConversion.load().done(function() {
					if (window.location.pathname.match("/account(/store_transactions)?/?$")) {
						$(".account_setting_block:first .account_setting_sub_block:nth-child(2)").prepend("<div id='es_total' class='es_loading' style='text-align: center;'><span>" + localized_strings.loading + "</span></div>");

						var game_total = 0,
							gift_total = 0,
							ingame_total = 0,
							market_total = 0;

						// Gather data
						function add_it_up(txt) {
							var history = JSON.parse(txt);
							var history_html = $.parseHTML(history["html"]);
							if (history_html) {
								$.each(history_html, function() {
									var type = $(this).find(".wht_type div:first").text().trim(),
										amount = $(this).find(".wht_total").text().trim(),
										items = $(this).find(".wht_items").text().trim();
									if (amount && !amount.match("Credit") && type && !items.match("Wallet Credit")) {
										var parsed = parse_currency(amount),
											calc_value;
										if (parsed.currency_type != user_currency) {
											calc_value = currencyConversion.convert(parsed.value, parsed.currency_type, user_currency);
										} else {
											calc_value = parsed.value;
										}
										if (type.match(/^Purchase/)) game_total += calc_value;
										if (type.match("Market Transaction")) market_total += calc_value;
										if (type.match("Gift Purchase")) { gift_total += calc_value; }
										if (type.match("In-Game Purchase")) ingame_total += calc_value;
									}
								});
								return history["cursor"];
							}
						}

						var sessionid = $(".page_header_ctn").text().match(/g_sessionID = \"(.+)\";/)[1];
						var history_promise = (function () {
							var deferred = new $.Deferred();
							get_http("//store.steampowered.com/account/AjaxLoadMoreHistory/?l=en&sessionid=" + sessionid, function(txt) {
								var next = add_it_up(txt);
								while (next) {
									$.ajax({
										async: false,
										url: "//store.steampowered.com/account/AjaxLoadMoreHistory/?l=en&cursor%5Btimestamp_newest%5D=" + next["timestamp_newest"] + "&sessionid=" + sessionid
									}).done(function(data) {
										next = add_it_up(JSON.stringify(data));
									});
								}
								deferred.resolve();
							});
							return deferred.promise();
						})();

						$.when.apply($, [history_promise]).done(function() {
							var total_total = game_total + gift_total + ingame_total + market_total, html = '';
							
							if (game_total != 0) {
								game_total = formatCurrency(parseFloat(game_total));
								html += '<div class="accountRow accountBalance">';
								html += '<div class="accountData price">' + game_total + '</div>';
								html += '<div class="accountLabel" style="text-align: left;">' + localized_strings.store_transactions + ':</div></div>';
							}
							
							if (gift_total != 0) {
								gift_total = formatCurrency(parseFloat(gift_total));
								html += '<div class="accountRow accountBalance">';
								html += '<div class="accountData price">' + gift_total + '</div>';
								html += '<div class="accountLabel" style="text-align: left;">' + localized_strings.gift_transactions + ':</div></div>';
							}
							
							if (ingame_total != 0) {
								ingame_total = formatCurrency(parseFloat(ingame_total));
								html += '<div class="accountRow accountBalance">';
								html += '<div class="accountData price">' + ingame_total + '</div>';
								html += '<div class="accountLabel" style="text-align: left;">' + localized_strings.game_transactions + ':</div></div>';
							}
							
							if (market_total != 0) {
								market_total = formatCurrency(parseFloat(market_total));
								html += '<div class="accountRow accountBalance">';
								html += '<div class="accountData price">' + market_total + '</div>';
								html += '<div class="accountLabel" style="text-align: left;">' + localized_strings.market_transactions + ':</div></div>';
							}
							
							if (total_total != 0) {
								total_total = formatCurrency(parseFloat(total_total));
								html += '<div class="inner_rule" style="margin: 5px 0px 5px 0px;"></div>';
								html += '<div class="accountRow accountBalance">';
								html += '<div class="accountData price">' + total_total + '</div>';
								html += '<div class="accountLabel" style="text-align: left;">' + localized_strings.total_spent + ':</div></div>';
							}

							$('#es_total').html(html);
						});
					}
				});
			}
		}
	});
}

function inventory_market_prepare() {
		$("#es_market_helper").remove();
		var es_market_helper = document.createElement("script");
		es_market_helper.type = "text/javascript";
		es_market_helper.id = "es_market_helper";
		es_market_helper.textContent = 'jQuery("#inventories").on("click", ".itemHolder, .newitem", function() { window.postMessage({ type: "es_sendmessage", information: [iActiveSelectView,g_ActiveInventory.selectedItem.marketable,g_ActiveInventory.appid,g_ActiveInventory.selectedItem.market_hash_name,g_ActiveInventory.selectedItem.market_fee_app,g_ActiveInventory.selectedItem.type,g_ActiveInventory.selectedItem.id,g_sessionID,g_ActiveInventory.selectedItem.contextid] }, "*"); });';
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
	var sessionID = response[7];
	var contextID = response[8];
	var gift = false;
	if (response[5] && response[5].match(/Gift/)) gift = true;
	var html;

	if (gift) {
		$("#es_item" + item).remove();
		if ($("#iteminfo" + item + "_item_actions").find("a").length > 0) {
			var gift_appid = get_appid($("#iteminfo" + item + "_item_actions").find("a")[0].href);
			get_http("//store.steampowered.com/api/appdetails/?appids=" + gift_appid + "&filters=price_overview", function(txt) {
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
		if ($(".profile_small_header_name .whiteLink").attr("href").replace(/\/$/, "") !== $(".playerAvatar").find("a").attr("href").replace(/\/$/, "")) {
			if ($('#es_item0').length == 0) { $("#iteminfo0_item_market_actions").after("<div class='item_market_actions es_item_action' id=es_item0></div>"); }
			if ($('#es_item1').length == 0) { $("#iteminfo1_item_market_actions").after("<div class='item_market_actions es_item_action' id=es_item1></div>"); }
			$('.es_item_action').html("");
			
			if (marketable == 0) { $('.es_item_action').remove(); return; }
			$("#es_item" + item).html("<img src='//cdn.steamcommunity.com/public/images/login/throbber.gif'><span>"+ localized_strings.loading+"</span>");

			function inventory_market_helper_get_price(url) {
				get_http(url, function (txt) {
					data = JSON.parse(txt);
					$("#es_item" + item).html("");
					if (data.success) {
						html = "<div><div style='height: 24px;'><a href='//steamcommunity.com/market/listings/" + global_id + "/" + hash_name + "'>" + localized_strings.view_in_market + "</a></div>";
						html += "<div style='min-height: 3em; margin-left: 1em;'>" + localized_strings.starting_at + ": " + data.lowest_price;
						if (data.volume) {
							html += "<br>" + localized_strings.last_24.replace("__sold__", data.volume);
						}

						$("#es_item" + item).html(html);
					} else {
						$("#es_item" + item).remove();
					}
				});
			}

			if (getValue("steam_currency_number")) {
				inventory_market_helper_get_price("//steamcommunity.com/market/priceoverview/?currency=" + getValue("steam_currency_number") + "&appid=" + global_id + "&market_hash_name=" + hash_name);
			} else {
				var currency_number = currency_type_to_number(user_currency);
				setValue("steam_currency_number", currency_number);
				inventory_market_helper_get_price("//steamcommunity.com/market/priceoverview/?currency=" + currency_number + "&appid=" + global_id + "&market_hash_name=" + hash_name);
			}
		} else {
			if (hash_name && hash_name.match(/Booster Pack/g)) {
				setTimeout(function() {
					var api_url = "//api.enhancedsteam.com/market_data/average_card_price/?appid=" + appid + "&cur=" + user_currency.toLowerCase();

					get_http(api_url, function(price_data) {
						var booster_price = parseFloat(price_data,10) * 3;
						html = localized_strings.avg_price_3cards + ": " + formatCurrency(booster_price) + "<br>";
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
				if (settings.quickinv === undefined) { settings.quickinv = true; storage.set({'quickinv': settings.quickinv}); }
				if (settings.quickinv_diff === undefined) { settings.quickinv_diff = -0.01; storage.set({'quickinv_diff': settings.quickinv_diff}); }
				if (settings.quickinv) {
					if (marketable == 0 || contextID != 6 || global_id != 753 || $(".profile_small_header_name .whiteLink").attr("href").replace(/\/$/, "") !== $(".playerAvatar").find("a").attr("href").replace(/\/$/, "") || $("#iteminfo" + item + "_item_market_actions .item_market_action_button").css("display") == "none") { return; }
					$("#iteminfo" + item + "_item_market_actions .item_market_action_button").hide();
					$("#iteminfo" + item + "_item_market_actions").append("<a class='btn_small btn_green_white_innerfade es_market_btn' id='es_sell' href='javascript:SellCurrentSelection()'><span>" + $("#iteminfo" + item + "_item_market_actions .item_market_action_button_contents").text() + "</span></a>");
					var url = $("#iteminfo" + item + "_item_market_actions a").attr("href");
					get_http(url, function(txt) {
						var market_id = txt.match(/Market_LoadOrderSpread\( (\d+) \)/);
						if (market_id) {
							market_id = market_id[1];
							get_http("//steamcommunity.com/market/itemordershistogram?language=english&currency=" + currency_type_to_number(user_currency) + "&item_nameid=" + market_id, function(market_txt) {
								var market = JSON.parse(market_txt);
								var price_high = parseFloat(market.lowest_sell_order / 100) + parseFloat(settings.quickinv_diff);								
								var price_low = market.highest_buy_order / 100;
								if (price_high < 0.03) price_high = 0.03;
								price_high = parseFloat(price_high).toFixed(2);
								price_low = parseFloat(price_low).toFixed(2);

								// Add Quick Sell button
								if (price_high > price_low) {
									$("#iteminfo" + item + "_item_market_actions").append("<br><a class='btn_small btn_green_white_innerfade es_market_btn' id='es_quicksell" + item + "' price='" + price_high + "'><span>" + localized_strings.quick_sell.replace("__amount__", formatCurrency(price_high)) + "</span></a>");
								}

								// Add Instant Sell button
								if (market.highest_buy_order) {
									$("#iteminfo" + item + "_item_market_actions").append("<br><a class='btn_small btn_green_white_innerfade es_market_btn' id='es_instantsell" + item + "' price='" + price_low + "'><span>" + localized_strings.instant_sell.replace("__amount__", formatCurrency(price_low)) + "</span></a>");
								}

								$("#es_instantsell" + item + ", #es_quicksell" + item).click(function() {
									$("#es_sell, #es_instantsell" + item + ", #es_quicksell" + item).addClass("btn_disabled");
									$("#es_sell, #es_instantsell" + item + ", #es_quicksell" + item).css("pointer-events", "none");
									$("#iteminfo" + item + "_item_market_actions div:first").html("<div class='es_loading' style='min-height: 66px;'><img src='//cdn.steamcommunity.com/public/images/login/throbber.gif'><span>"+ localized_strings.selling +"</div>");
									var sell_price = $(this).attr("price") * 100;
									runInPageContext("function() { var fee = CalculateFeeAmount (" + sell_price + ", 0.10); window.postMessage({ type: 'es_sendfee_" + assetID + "', information: fee }, '*'); }");
									
									window.addEventListener("message", function(event) {
										if (event.source != window)	return;
										if (event.data.type && (event.data.type == "es_sendfee_" + assetID)) { 
											sell_price = sell_price - event.data.information.fees;
											$.ajax({
												url:"https://steamcommunity.com/market/sellitem/",
												type: "POST",
												data:{
													"sessionid": sessionID,
													"appid": global_id,
													"contextid": contextID,
													"assetid": assetID,
													"amount": 1,
													"price": sell_price
												},
												crossDomain: true,
												xhrFields: { withCredentials: true }
											}).done(function(data){
												$("#iteminfo" + item + "_item_market_actions").slideUp();
												$("#item" + global_id + "_" + contextID + "_" + assetID).addClass("btn_disabled");
												$("#item" + global_id + "_" + contextID + "_" + assetID).removeClass("activeInfo");
												$("#item" + global_id + "_" + contextID + "_" + assetID).css("pointer-events", "none");
											});
										}
									}, false);
								});
							});
						}
					});
				}
			});
		}
	}
}

function add_relist_button() {
	$("#market_removelisting_dialog_cancel").on("click", function() {
		$("#es_relist_confirm").hide();
		$("#market_removelisting_dialog_title").show();
		$("#market_removelisting_dialog_title_relist").hide();
		$("#market_removelisting_dialog_description").show();
		$("#market_removelisting_dialog_description_relist").hide();
		$("#es_relist").show();
		$("#es_sell").hide();
	});

	$("#market_removelisting_dialog_accept").on("click", function() {
		$("#es_relist").hide();
	});

	$(".market_listing_cancel_button").on("click", function() {
		if ($(this).find("a").attr("href").match(/'mylisting', '\d+', 753, '\d+', '\d+'/)) {
			if ($("#es_relist").length == 0) {
				$("#market_removelisting_dialog_accept").after("<a id='es_relist' href='#' style='margin-right: 0.2em;' class='btn_green_white_innerfade btn_medium_wide'><span>" + localized_strings.edit_price + "</span></a>");		
			} else {
				$("#es_relist").show();
			}
			$("#es_relist").on("click", function() {
				if ($("#market_removelisting_dialog_title_relist").length == 0) {
					$("#market_removelisting_dialog_title").clone().attr("id", "market_removelisting_dialog_title_relist").text(localized_strings.relist_an_item).appendTo("#market_removelisting_dialog .market_dialog_title");
				} else {
					$("#market_removelisting_dialog_title_relist").show();
				}
				$("#market_removelisting_dialog_title").hide();
				if ($("#market_removelisting_dialog_description_relist").length == 0) {
					$("#market_removelisting_dialog_confirmation div:first").attr("id", "market_removelisting_dialog_description");
					$("#market_removelisting_dialog_description").clone().attr("id", "market_removelisting_dialog_description_relist").text(localized_strings.relist_text).prependTo("#market_removelisting_dialog_confirmation");
				} else {
					$("#market_removelisting_dialog_description_relist").text(localized_strings.relist_text);
					$("#market_removelisting_dialog_description_relist").show();
				}
				$("#market_removelisting_dialog_description").hide();
				$("#market_removelisting_dialog_accept").hide();
				$("#market_removelisting_dialog_cancelbtn").hide();
				$("#es_relist").hide();
				if ($("#es_relist_confirm").length == 0) {
					$("#es_relist").before("<a id='es_relist_confirm' href='#' style='float: right; margin-right: 10px;' class='btn_green_white_innerfade btn_medium_wide btn_disabled'><span>" + localized_strings.relist + "</span></a><div id='es_sell'></div>");
				} else {
					$("#es_relist_confirm").show();
					$("#es_sell").show();
				}	
				var pricepattern = "^[^\\d,.]*\s*([1-9]\\d{0,2}?(?:([,. ]?)\\d{3}(?:\\2\\d{3})*)?|0)?(?:([,.])(\\d{1,2}))?\s*[^\\d,.]*$"
				if ($(".market_sell_dialog_input_group").length == 0) {
					$("#es_sell").load("//steamcommunity.com/my/inventory/ .market_sell_dialog_input_group:last", function() { 
						$(".market_sell_dialog_input_group").css("float", "right");
						$("#market_sell_buyercurrency_input").focus();
						$("#market_sell_buyercurrency_input").on('keyup', function(e) { if (e.keyCode==13) { $('#es_relist_confirm').click(); } });
						$("#market_sell_buyercurrency_input")[0].pattern = pricepattern;
						$("#es_relist_confirm").removeClass("btn_disabled");
					});
				} else {
					$("#market_sell_buyercurrency_input").val("");
					$(".market_sell_dialog_input_group").show();
					$("#market_sell_buyercurrency_input").focus();
					$("#es_relist_confirm").removeClass("btn_disabled");
				}
				
				$("#es_relist_confirm").on("click", function() {
					var pricematch = $("#market_sell_buyercurrency_input").val().match(pricepattern);
					if (pricematch) {
						var sell_price = parseFloat((pricematch[1] || "").replace(/[^\d]/, "") + "." + (pricematch[4] || 0)) * 100;
					} else {
						return;
					}

					$("#es_relist_confirm").hide();
					$(".market_sell_dialog_input_group").hide();
					$("#market_removelisting_dialog_accept_throbber").show();
					runInPageContext("function() { var sessionid = g_sessionID; var fee = CalculateFeeAmount (" + sell_price + ", 0.10); window.postMessage({ type: 'es_relist', information: [sessionid,fee] }, '*'); }");
					window.addEventListener("message", function(event) {
						if (event.source != window)	return;
						if (event.data.type && (event.data.type == "es_relist")) { 
							var sessionid = event.data.information[0];
							var fee = event.data.information[1];
							sell_price = sell_price -fee.fees;
							var item_link = $("#market_removelisting_dialog_itemname a").attr("href");
							var item_page = $(".market_listing_item_name_block .market_listing_item_name_link[href$='" + item_link + "']");
							var item_remove = $(item_page).parent().parent().parent().find(".market_listing_cancel_button a").attr("href");
							var matches = item_remove.match(/'mylisting', '(\d+)', (\d+), '(\d+)', '(\d+)'/);
							if (matches) {
								var listingid = matches[1],
									appid = matches[2],
									contextid = matches[3],
									itemid = matches[4];
								$.ajax({
									url:"https://steamcommunity.com/market/removelisting/" + listingid,
									type: "POST",
									data:{
										"sessionid": sessionid
									}
								}).done(function(){
									$.ajax({
										url:"https://steamcommunity.com/market/sellitem/",
										type: "POST",
										data:{
											"sessionid": sessionid,
											"appid": appid,
											"contextid": contextid,
											"assetid": itemid,
											"amount": 1,
											"price": sell_price
										},
										crossDomain: true,
										xhrFields: { withCredentials: true }
									}).done(function(){
										// For now, simply reload the page.
										window.location.reload();
									}).fail(function(data){
										var response = JSON.parse(data.responseText);
										$("#market_removelisting_dialog_description_relist").html("<b>" + response.message + "</b>");
										$("#market_removelisting_dialog_accept_throbber").hide();
									});
								});
							}
						}
					});
				});
			});
		} else {
			$("#es_relist").remove();
		}
	});
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

function keep_ssa_checked() {
	storage.get(function(settings) {
		if (settings.keepssachecked === undefined) { settings.keepssachecked = false; storage.set({'keepssachecked': settings.keepssachecked}); }
		if (settings.keepssachecked) {
			$("#market_sell_dialog_accept_ssa").attr("checked", true);
			$("#market_buynow_dialog_accept_ssa").attr("checked", true);
		}

		$("#market_sell_dialog_accept_ssa, #market_buynow_dialog_accept_ssa").click(function() {
			if (settings.keepssachecked) {
				settings.keepssachecked = false;
			} else {
				settings.keepssachecked = true;
			}
			storage.set({'keepssachecked': settings.keepssachecked});
		});
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
			var $message = $('<div class="savings">' + formatCurrency(corrected_price) + '</div>');
			if ($("#package_savings_bar").length === 0) {
				$(".package_totals_area").append("<div id='package_savings_bar'><div class='savings'></div><div class='message'>" + localized_strings.bundle_saving_text + "</div></div>");
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
		get_http("//api.enhancedsteam.com/gamedata/?appid=" + appid + "&appname=" + appname, function (txt) {
    		var data;
			if (txt != "{\"dlc\":}}") {
				data = JSON.parse(txt);
			}
            var html = "<div class='block'><div class='block_header'><h4>" + localized_strings.dlc_details + "</h4></div><div class='block_content'><div class='block_content_inner'><div class='details_block'>";

            if (data) {
                $.each(data["dlc"], function(index, value) {
                    html += "<div class='game_area_details_specs'><div class='icon'><img src='http://www.enhancedsteam.com/gamedata/icons/" + escapeHTML(value['icon']) + "' align='top'></div><a class='name' title='" + escapeHTML(value['text']) + "'>" + escapeHTML(index) + "</a></div>";
                });
			}

			html += "</div><a class='linkbar' style='margin-top: 10px;' href=\"http://www.enhancedsteam.com/gamedata/dlc_category_suggest.php?appid=" + appid + "&appname=" + appname + "\" target='_blank'>" + localized_strings.dlc_suggest + "</a></div></div></div>";

			$("#friend_block").before(html);
    	});
    }
}

function survey_data_from_site(appid) {
	storage.get(function(settings) {
		if (settings.show_apppage_surveys === undefined) { settings.show_apppage_surveys = true; storage.set({'show_apppage_surveys': settings.show_apppage_surveys}); }
		if (settings.show_apppage_surveys) {
			if ($("div.game_area_dlc_bubble").length == 0 && $(".game_area_purchase_game:first").find(".streamingvideo").length == 0) {
				storePageData.get("survey", function(data) {
					var html = "<div id='performance_survey' class='game_area_description'><h2>" + localized_strings.survey.performance_survey + "</h2>";
					if (data["success"]) {
						html += "<p>" + localized_strings.survey.users.replace("__users__", data["responses"]) + ".</p>";
						html += "<p><b>" + localized_strings.survey.framerate + "</b>: " + Math.round(data["frp"]) + "% " + localized_strings.survey.framerate_response + " "
						switch (data["fr"]) {
							case "30": html += "<span style='color: #8f0e10;'>" + localized_strings.survey.framerate_30 + "</span>"; break;
						 	case "fi": html += "<span style='color: #e1c48a;'>" + localized_strings.survey.framerate_fi + "</span>"; break;
						 	case "va": html += "<span style='color: #8BC53F;'>" + localized_strings.survey.framerate_va + "</span>"; break;
						}
						html += "<br><b>" + localized_strings.survey.resolution + "</b>: " + localized_strings.survey.resolution_support + " "
						switch (data["mr"]) {
							case "less": html += "<span style='color: #8f0e10;'>" + localized_strings.survey.resolution_less.replace("__pixels__", "1920x1080") + "</span>"; break;
							case "hd": html += "<span style='color: #8BC53F;'>" + localized_strings.survey.resolution_up.replace("__pixels__", "1920x1080 (HD)") + "</span>"; break;
							case "wqhd": html += "<span style='color: #8BC53F;'>" + localized_strings.survey.resolution_up.replace("__pixels__", "2560x1440 (WQHD)") + "</span>"; break;
							case "4k": html += "<span style='color: #8BC53F;'>" + localized_strings.survey.resolution_up.replace("__pixels__", "3840x2160 (4K)") + "</span>"; break;
						}
						html += "<br><b>" + localized_strings.survey.graphics_settings + "</b>: ";
						if (data["gs"]) {
							html += "<span style='color: #8BC53F;'>" + localized_strings.survey.gs_y + "</span></p>";
						} else {
							html += "<span style='color: #8f0e10;'>" + localized_strings.survey.gs_n + "</span></p>";
						}
						if (data["nvidia"] !== undefined || data["amd"] !== undefined || data["intel"] !== undefined || data["other"] !== undefined) {
							html += "<p><b>" + localized_strings.survey.satisfaction + "</b>:";
							html += "<div class='performance-graph'>";
							if (data["nvidia"] !== undefined) {
								if (data["nvidia"] > 90 || data["nvidia"] < 10) {
									html += "<div class='row'><div class='left-bar nvidia' style='width: " + parseInt(data["nvidia"]).toString() + "%;'><span>Nvidia&nbsp;" + data["nvidia"] + "%</span></div><div class='right-bar' style='width: " + parseInt(100-data["nvidia"]) + "%;'></div></div>";
								} else {
									html += "<div class='row'><div class='left-bar nvidia' style='width: " + parseInt(data["nvidia"]).toString() + "%;'><span>Nvidia</span></div><div class='right-bar' style='width: " + parseInt(100-data["nvidia"]) + "%;'><span>" + data["nvidia"] + "%</span></div></div>";
								}
							}
							if (data["amd"] !== undefined) {
								if (data["amd"] > 90 || data["amd"] < 10) {
									html += "<div class='row'><div class='left-bar amd' style='width: " + parseInt(data["amd"]).toString() + "%;'><span>AMD&nbsp;" + data["amd"] + "%</span></div><div class='right-bar' style='width: " + parseInt(100-data["amd"]) + "%'></div></div>";
								} else {
									html += "<div class='row'><div class='left-bar amd' style='width: " + parseInt(data["amd"]).toString() + "%;'><span>AMD</span></div><div class='right-bar' style='width: " + parseInt(100-data["amd"]) + "%'><span>" + data["amd"] + "%</span></div></div>";
								}
							}
							if (data["intel"] !== undefined) {
								if (data["intel"] > 90 || data["intel"] < 10) {
									html += "<div class='row'><div class='left-bar intel' style='width: " + parseInt(data["intel"]).toString() + "%;'><span>Intel&nbsp;" + data["intel"] + "%</span></div><div class='right-bar' style='width: " + parseInt(100-data["intel"]) + "%'></div></div>";
								} else {
									html += "<div class='row'><div class='left-bar intel' style='width: " + parseInt(data["intel"]).toString() + "%;'><span>Intel</span></div><div class='right-bar' style='width: " + parseInt(100-data["intel"]) + "%'><span>" + data["intel"] + "%</span></div></div>";
								}
							}
							if (data["other"] !== undefined) {
								if (data["other"] > 90 || data["other"] < 10) {
									html += "<div class='row'><div class='left-bar other' style='width: " + parseInt(data["other"]).toString() + "%;'><span>Other&nbsp;" + data["other"] + "%</span></div><div class='right-bar' style='width: " + parseInt(100-data["other"]) + "%'></div></div>";
								} else {
									html += "<div class='row'><div class='left-bar other' style='width: " + parseInt(data["other"]).toString() + "%;'><span>Other</span></div><div class='right-bar' style='width: " + parseInt(100-data["other"]) + "%'><span>" + data["other"] + "%</span></div></div>";
								}
							}
							html += "</div>";
						}
					} else {
						html += "<p>" + localized_strings.survey.nobody + ".</p>";
					}
					if ($(".game_area_already_owned").length > 0 && $(".hours_played").length > 0) {
						html += "<a class='btnv6_blue_blue_innerfade btn_medium es_btn_systemreqs' href='//enhancedsteam.com/survey/?appid=" + appid + "'><span>" + localized_strings.survey.take + "</span></a>";
					}
					html += "</div>";
					$(".sys_req").parent().after(html);
				});
			}
		}
	});
}

function dlc_data_for_dlc_page() {
	var totalunowned = 0;
	var sessionid;
	var addunowned = "<form name=\"add_all_unowned_dlc_to_cart\" action=\"http://store.steampowered.com/cart/\" method=\"POST\"><input type=\"hidden\" name=\"action\" value=\"add_to_cart\">";

	window.setTimeout(function() {
		$.each($("div.dlc_page_purchase_dlc"), function(j, node){
			var appid = get_appid(node.href || $(node).find("a")[0].href) || get_appid_wishlist(node.id);
			get_http("//api.enhancedsteam.com/gamedata/?appid=" + appid, function (txt) {
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
			var buttoncode = "<div class='btn_addtocart' style='float: right; margin-right: 15px;' id='dlc_purchaseAllunOwned'><a class='btnv6_green_white_innerfade btn_medium' href=\"javascript:document.forms['add_all_unowned_dlc_to_cart'].submit();\"><span>" + localized_strings.add_unowned_dlc_to_cart + "</span></a></div>";
			$("#dlc_purchaseAll").after(buttoncode);
		}
	}, 500);
}

function add_app_badge_progress(appid) {
	if (is_signed_in) {
		if ($(".icon").find('img[src$="/ico_cards.png"]').length > 0) {
			$("#category_block").after("<div class='block'><div class='block_header'><h4>Badge Progress</h4></div><div class='block_content_inner'><link rel='stylesheet' type='text/css' href='//cdn.steamcommunity.com/public/css/skin_1/badges.css'><div class='es_badge_progress'></div><div class='es_foil_badge_progress'></div></div>");
			$(".es_badge_progress").load("//steamcommunity.com/my/gamecards/" + appid + "/ .badge_current", function(responseText) {
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
						$(".es_badge_progress").after("<div class='game_area_details_specs'><div class='icon'><img src='//store.akamai.steamstatic.com/public/images/v6/ico/ico_cards.png' width=24 height=16 border=0 align=top></div><a href='//steamcommunity.com/my/gamecards/" + appid + "/' class='name'>" + localized_strings.view_badge + "</a></div>");
					} else {
						$(".es_badge_progress").after("<div class='game_area_details_specs'><div class='icon'><img src='//store.akamai.steamstatic.com/public/images/v6/ico/ico_cards.png' width=24 height=16 border=0 align=top></div><a href='//steamcommunity.com/my/gamecards/" + appid + "/' class='name'>" + localized_strings.badge_progress + "</a></div>");
					}
					if(show_card_num){
						$(".es_badge_progress").after("<div style='padding-top: 2px; padding-bottom: 10px; margin-left: 44px; color: #67c1f5;'>" + localized_strings.cards_owned.replace("__owned__", card_num_owned).replace("__possible__", card_num_total) + "</div>");
					}
					$(".es_badge_progress").after("<div style='padding-top: 10px; padding-bottom: 10px; margin-left: 44px; color: #67c1f5;'>" + $(responseText).find(".progress_info_bold").text() + "</div>");
					$(".es_badge_progress").after("<div style=\"clear: both\"></div>");
					$(".es_badge_progress .badge_info_description").css({"width":"275px"});
					$(".es_badge_progress .badge_empty_circle").css({"margin":"0px 46px 14px 8px","border-radius":"46px"});
					$(".es_badge_progress .badge_empty_right div:last-child").remove();
					$(".es_badge_progress .badge_empty_right").append("<div class=\"badge_empty_name\">" + localized_strings.badge_not_unlocked + "</div>").append("<div style=\"clear: both\"></div>");
				} else {
					$(".es_badge_progress").remove();
				}
			});
			$(".es_foil_badge_progress").load("//steamcommunity.com/my/gamecards/" + appid + "/?border=1 .badge_current", function(responseText) {
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
						$(".es_foil_badge_progress .badge_empty_right").append("<div class=\"badge_empty_name\">" + localized_strings.badge_not_unlocked + "</div>")
						if (badge_completed){
							$(".es_foil_badge_progress").after("<div class='game_area_details_specs'><div class='icon'><img src='//store.akamai.steamstatic.com/public/images/v6/ico/ico_cards.png' width=24 height=16 border=0 align=top></div><a href='//steamcommunity.com/my/gamecards/" + appid + "/' class='name'>" + localized_strings.view_badge_foil + "</a><div>");
						} else {
							$(".es_foil_badge_progress").after("<div class='game_area_details_specs'><div class='icon'><img src='//store.akamai.steamstatic.com/public/images/v6/ico/ico_cards.png' width=24 height=16 border=0 align=top></div><a href='//steamcommunity.com/my/gamecards/" + appid + "/' class='name'>" + localized_strings.badge_foil_progress + "</a><div>");
						}
						if(show_card_num){
							$(".es_foil_badge_progress").after("<div style='padding-top: 2px; padding-bottom: 10px; margin-left: 44px; color: #67c1f5;'>" + localized_strings.cards_owned.replace("__owned__", card_num_owned).replace("__possible__", card_num_total) + "</div>");
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
		$("#game_area_dlc_expanded").after("<div class='game_purchase_action game_purchase_action_bg' style='float: left; margin-top: 4px; margin-bottom: 10px; display: none;' id='es_selected_btn'><div class='btn_addtocart'><a class='btnv6_green_white_innerfade btn_medium' href='javascript:document.forms[\"add_selected_dlc_to_cart\"].submit();'><span>" + localized_strings.add_selected_dlc_to_cart + "</span></a></div></div>");
		$(".game_area_dlc_section").after("<div style='clear: both;'></div>");
	} else {
		$(".gameDlcBlocks").after("<div class='game_purchase_action game_purchase_action_bg' style='float: left; margin-top: 4px; display: none;' id='es_selected_btn'><div class='btn_addtocart'><a class='btnv6_green_white_innerfade btn_medium' href='javascript:document.forms[\"add_selected_dlc_to_cart\"].submit();'><span>" + localized_strings.add_selected_dlc_to_cart + "</span></a></div></div>");
	}
	$("#es_selected_btn").before("<form name=\"add_selected_dlc_to_cart\" action=\"//store.steampowered.com/cart/\" method=\"POST\" id=\"es_selected_cart\">");
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

	$("#es_dlc_option_panel").append("<div class='es_dlc_option' id='unowned_dlc_check'>" + localized_strings.select.unowned_dlc + "</div>");
	$("#unowned_dlc_check").on("click", function() {		
		$(".game_area_dlc_section").find(".game_area_dlc_row").each(function() {
			if (!($(this).hasClass("es_highlight_owned"))) {
				$(this).find("input").prop("checked", true).change();				
			}
		});
	});

	$("#es_dlc_option_panel").append("<div class='es_dlc_option' id='wl_dlc_check'>" + localized_strings.select.wishlisted_dlc + "</div>");
	$("#wl_dlc_check").on("click", function() {		
		$(".game_area_dlc_section").find(".game_area_dlc_row").each(function() {
			if ($(this).hasClass("es_highlight_wishlist")) {
				$(this).find("input").prop("checked", true).change();
			}	
		});
	});

	$("#es_dlc_option_panel").append("<div class='es_dlc_option' id='no_dlc_check'>" + localized_strings.select.none + "</div>");
	$("#no_dlc_check").on("click", function() {		
		$(".game_area_dlc_section").find(".game_area_dlc_row").each(function() {
			$(this).find("input").prop("checked", false).change();
		});
	});

	$(".game_area_dlc_section").find(".gradientbg").append("<a id='es_dlc_option_button'>" + localized_strings.thewordoptions + " ▾</a>");
	
	$("#es_dlc_option_button").on("click", function() {
		$("#es_dlc_option_panel").toggle();
		if ($("#es_dlc_option_button").text().match("▾")) {
			$("#es_dlc_option_button").text(localized_strings.thewordoptions + " ▴");
		} else {
			$("#es_dlc_option_button").text(localized_strings.thewordoptions + " ▾");
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
			$("#achievement_block").append("<div class='game_area_details_specs'><div class='icon'><img src='" + chrome.extension.getURL("img/ico/astatsnl.png") + "' style='margin-left: 4px'></div><a class='name' href='http://astats.astats.nl/astats/Steam_Game_Info.php?AppID=" + appid + "' target='_blank'><span>" + localized_strings.view_astats + "</span></a>");
		}
	});
}

function add_achievement_completion_bar(appid) {
	$(".myactivity_block").find(".details_block").after("<link href='http://steamcommunity-a.akamaihd.net/public/css/skin_1/playerstats_generic.css' rel='stylesheet' type='text/css'><div id='es_ach_stats' style='margin-bottom: 9px; margin-top: -16px; float: right;'></div>");
	$("#es_ach_stats").load("//steamcommunity.com/my/stats/" + appid + "/ #topSummaryAchievements", function(response, status, xhr) {				
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

var ea_promise, early_access;

// Check for Early Access titles
function check_early_access(node, image_left, selector_modifier, callback) {
	storage.get(function(settings) {
		if (settings.show_early_access === undefined) { settings.show_early_access = true; storage.set({'show_early_access': settings.show_early_access}); }
		if (settings.show_early_access) {
			if (!ea_promise) {
				ea_promise = (function () {
					var deferred = new $.Deferred();
					if (window.location.protocol != "https:") {
						// is the data cached?
						var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
						var last_updated = getValue("ea_appids_time") || expire_time - 1;
						if (last_updated < expire_time) {
							// if no cache exists, pull the data from the website
							get_http("//api.enhancedsteam.com/early_access/", function(txt) {
								early_access = JSON.parse(txt);
								setValue("ea_appids", txt);
								setValue("ea_appids_time", parseInt(Date.now() / 1000, 10));
								deferred.resolve();	
							});
						} else {
							early_access = JSON.parse(getValue("ea_appids"));
							deferred.resolve();
						}
					} else {
						deferred.resolve();
					}
					return deferred.promise();
				})();
			}
			ea_promise.done(function(){
				var href = ($(node).find("a").attr("href") || $(node).attr("href"));
				var appid = get_appid(href);
				if (appid === null) { 
					if ($(node).find("img").length > 0) {
						if ($(node).find("img").attr("src").match(/\/apps\/(\d+)\//)) {
							appid = $(node).find("img").attr("src").match(/\/apps\/(\d+)\//)[1];
						}
					}
				}
				if (early_access) {
					if (early_access["ea"].indexOf(appid) >= 0) {
						var selector = "img";
						if (selector_modifier != undefined) selector += selector_modifier;
						var image_name = "img/overlay/early_access_banner_english.png";
						if (["brazlian", "french", "italian", "japanese", "koreana", "polish", "portuguese", "russian", "schinese", "spanish", "tchinese", "thai"].indexOf(language) > -1) { image_name = "img/overlay/early_access_banner_" + language + ".png"; }
						overlay_img = $("<img class='es_overlay' src='" + chrome.extension.getURL(image_name) + "'>");
						$(overlay_img).css({"left":image_left+"px"});
						var height = $(node).height() / 1.6;
						if (height > 120) height = 120;
						$(overlay_img).css({"height":height+"px"});
						$(overlay_img).css("width", "initial");
						$(node).find(selector.trim()).before(overlay_img);
						callback && callback();
					}
				}
			});
		}
	});
}

// Add a blue banner to Early Access games
function process_early_access() {
	storage.get(function(settings) {
		if (settings.show_early_access === undefined) { settings.show_early_access = true; storage.set({'show_early_access': settings.show_early_access}); }
		if (settings.show_early_access) {
			switch (window.location.host) {
				case "store.steampowered.com":
					switch (true) {
						case /^\/app\/.*/.test(window.location.pathname):
							$(".game_header_image").append("<a href='" + window.location.href + "'></a>");
							$(".game_header_image_ctn").each(function(index, value) { check_early_access($(this), $(this).position().left); });
							$(".small_cap").each(function(index, value) { check_early_access($(this), 15); });
							break;
						case /^\/(?:genre|browse|tag)\/.*/.test(window.location.pathname):
							$(".tab_item").each(function(index, value) { check_early_access($(this), 0, ":last"); });
							$(".special_tiny_cap").each(function(index, value) { check_early_access($(this)); });
							$(".cluster_capsule").each(function(index, value) { check_early_access($(this)); });
							$(".game_capsule").each(function(index, value) { check_early_access($(this)); });
							$(".dq_item:not(:first-child)").each(function(index, value) { check_early_access($(this)); });
							$(".discovery_queue:not(:first-child)").each(function(index, value) { check_early_access($(this)); });
							break;
						case /^\/search\/.*/.test(window.location.pathname):
							$(".search_result_row").each(function(index, value) { check_early_access($(this)); });
							break;
						case /^\/recommended/.test(window.location.pathname):
							$(".friendplaytime_appheader").each(function(index, value) { check_early_access($(this), $(this).position().left); });
							$(".header_image").each(function(index, value) { check_early_access($(this)); });
							$(".appheader").each(function(index, value) { check_early_access($(this), $(this).position().left); });
							$(".recommendation_carousel_item").each(function(index, value) { check_early_access($(this), $(this).position().left + 8); });
							$(".game_capsule_area").each(function(index, value) { check_early_access($(this), $(this).position().left + 8); });
							$(".game_capsule").each(function(index, value) { check_early_access($(this), $(this).position().left); });
							$(".similar_grid_capsule").each(function(index, value) { check_early_access($(this)); });
							break;
						case /^\/tag\/.*/.test(window.location.pathname):
							$(".cluster_capsule").each(function(index, value) { check_early_access($(this)); });
							$(".tab_row").each(function(index, value) { check_early_access($(this)); });
							$(".browse_tag_game_cap").each(function(index, value) { check_early_access($(this), $(this).position().left); });
							break;
						case /^\/$/.test(window.location.pathname):
							$(".home_smallcap").each(function(index, value) { $(this).find("img").wrap("<div class='es-img-prep' href='" + $(this).attr("href") + "'></div>"); check_early_access($(this).find(".es-img-prep"), 15); });
							$(".cap").each(function(index, value) { check_early_access($(this)); });
							$(".special").each(function(index, value) { check_early_access($(this)); });
							$(".game_capsule").each(function(index, value) { check_early_access($(this)); });
							$(".cluster_capsule").each(function(index, value) { check_early_access($(this)); });
							$(".recommended_spotlight_ctn").each(function(index, value) { check_early_access($(this)); });
							$(".curated_app_link").each(function(index, value) { check_early_access($(this)); });
							$(".tab_item").each(function(index, value) { check_early_access($(this), 0, ":last"); });
							$(".dailydeal_ctn").find("a").each(function(index, value) { check_early_access($(this)); });

							// Sales fields
							$(".large_sale_caps").find("a").each(function(index, value) { check_early_access($(this)); });
							$(".small_sale_caps").find("a").each(function(index, value) { check_early_access($(this)); });
							$(".sale_capsule_image").parent().each(function(index, value) { check_early_access($(this)); });
							break;
					}
				case "steamcommunity.com":
					switch(true) {
						case /^\/(?:id|profiles)\/.+\/wishlist/.test(window.location.pathname):
							$(".gameListRowLogo").each(function(index, value) { check_early_access($(this)); });
							break;
						case /^\/(?:id|profiles)\/(.+)\/games/.test(window.location.pathname):
							$(".gameListRowLogo").each(function(index, value) { check_early_access($(this)); });
							break;
						case /^\/(?:id|profiles)\/(.+)\/followedgames/.test(window.location.pathname):
							$(".gameListRowLogo").each(function(index, value) { check_early_access($(this)); });
							break;
						case /^\/(?:id|profiles)\/.+\/\b(home|myactivity|status)\b/.test(window.location.pathname):
							$(".blotter_gamepurchase_content").find("a").each(function(index, value) {
								check_early_access($(this), $(this).position().left);
							});
							break;
						case /^\/(?:id|profiles)\/.+\/\b(reviews|recommended)\b/.test(window.location.pathname):
							$(".leftcol").each(function(index, value) { check_early_access($(this), $(this).position().left + 8); });
							break;
						case /^\/(?:id|profiles)\/.+/.test(window.location.pathname):
							$(".game_info_cap").each(function(index, value) { check_early_access($(this)); });
							$(".showcase_gamecollector_game").each(function(index, value) { check_early_access($(this)); });
							$(".favoritegame_showcase_game").each(function(index, value) { check_early_access($(this)); });
							break;
						case /^\/app\/.*/.test(window.location.pathname):
							if ($(".apphub_EarlyAccess_Title").length > 0) {
								var logo = $(".apphub_StoreAppLogo:first").wrap(
									"<div id='es_ea_apphub'><a href='" + window.location.href + "'></a></div>"
								);

								var wrapper = $('#es_ea_apphub');

								// Manually set the wrapper's height because
								// the logo is a floating element :(
								wrapper.css('height', logo.css('height'));

								check_early_access(wrapper, null, null, function () {
									wrapper.css('height', '');
								});
							}
					}
			}
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
			var api_url = "//store.steampowered.com/api/packagedetails/";
			var countries = settings.regional_countries;
			var pricing_div = "<div class='es_regional_container'></div>";
			var world = chrome.extension.getURL("img/flags/world.png");
			var currency_deferred = [];
			var local_country;
			var sale;
			var sub;
			var region_appended=0;
			
			if (/^\/sale\/.*/.test(window.location.pathname)) {
				sale=true;
				pricing_div = $(pricing_div).addClass("es_regional_sale");
			}
			if (/^\/sub\/.*/.test(window.location.pathname)) {
				sub=true;
				pricing_div = $(pricing_div).addClass("es_regional_sub");
			}
			local_country = getStoreRegionCountryCode().toLowerCase();
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
					var formatted_converted_price = formatCurrency(converted_price);
					
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
					var regional_price_div = "<div class=\"es_regional_price\"><span class=\"es_regional_unavailable\">"+localized_strings.region_unavailable+"</span></div>";
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
						currencyConversion.load().done(function() {
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
											var converted_price = currencyConversion.convert(parseFloat(app_price), country_currency, user_currency);
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
												$(".sale_page_purchase_item").eq(index).find(".sale_page_purchase_content").before(app_pricing_div);
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
							$.when.apply($, [format_deferred]).done(function(){
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
													$("#es_pricing_" + subid).css("right", $(app_package).find(".game_purchase_action_bg:last").width() + $(app_package).find(".btnv6_blue_blue_innerfade").width() + 25 +"px").css("top", $(app_package).find(".sale_page_purchase_header").height() + "px");													
												} else if (sub) {
													$("#es_pricing_" + subid).css("right", $(app_package).find(".game_purchase_action_bg").width() + 25 + "px").css("top", "95px");
												} else {
													$("#es_pricing_" + subid).css("right", $(app_package).find(".game_purchase_action_bg:last").width() + 20 + "px");
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
					});
				});
			}
		}
	});
}

function customize_app_page() {
	// Add a "Customize" button
	$(".purchase_area_spacer:last").after("<link rel='stylesheet' type='text/css' href='//store.akamai.steamstatic.com/public/css/v6/home.css'><div id='es_customize_btn' class='home_actions_ctn' style='visibility: visible;'><div class='home_btn home_customize_btn'>" + localized_strings.customize + "</div></div>");

	storage.get(function(settings) {
		if (settings.show_apppage_recommendedbycurators === undefined) { settings.show_apppage_recommendedbycurators = true; storage.set({'show_apppage_recommendedbycurators': settings.show_apppage_recommendedbycurators}); }
		if (settings.show_apppage_recentupdates === undefined) { settings.show_apppage_recentupdates = true; storage.set({'show_apppage_recentupdates': settings.show_apppage_recentupdates}); }
		if (settings.show_apppage_reviews === undefined) { settings.show_apppage_reviews = true; storage.set({'show_apppage_reviews': settings.show_apppage_reviews}); }
		if (settings.show_apppage_about === undefined) { settings.show_apppage_about = true; storage.set({'show_apppage_about': settings.show_apppage_about}); }
		if (settings.show_apppage_sysreq === undefined) { settings.show_apppage_sysreq = true; storage.set({'show_apppage_sysreq': settings.show_apppage_sysreq}); }
		if (settings.show_apppage_legal === undefined) { settings.show_apppage_legal = true; storage.set({'show_apppage_legal': settings.show_apppage_legal}); }
		if (settings.show_apppage_morelikethis === undefined) { settings.show_apppage_morelikethis = true; storage.set({'show_apppage_morelikethis': settings.show_apppage_morelikethis}); }
		if (settings.show_apppage_customerreviews === undefined) { settings.show_apppage_customerreviews = true; storage.set({'show_apppage_customerreviews': settings.show_apppage_customerreviews}); }

		var html = "<div class='home_viewsettings_popup' style='display: none'><div class='home_viewsettings_instructions' style='font-size: 12px;'>" + localized_strings.apppage_sections + "</div>"
		html += "<div class='home_viewsettings_checkboxrow ellipsis disabled'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + localized_strings.apppage_purchase + "</div></div>";
		
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
		if (settings.show_steamchart_info) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_current'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + localized_strings.charts.current + "</div></div>"; }
		else { 
			html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_current'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + localized_strings.charts.current + "</div></div>"; 
		}

		// Steam spy
		if (settings.show_steamspy_info) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_spy'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + localized_strings.spy.player_data + "</div></div>"; }
		else { 
			html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_spy'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + localized_strings.spy.player_data + "</div></div>"; 
		}

		// Performance surveys
		if (settings.show_apppage_surveys) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_surveys'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + localized_strings.survey.performance_survey + "</div></div>"; }
		else { 
			html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_surveys'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + localized_strings.survey.performance_survey + "</div></div>"; 
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
			if (settings.show_apppage_legal) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_legal'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + localized_strings.apppage_legal + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_apppage_legal'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + localized_strings.apppage_legal + "</div></div>";
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

		$("#show_apppage_spy").click(function() {
			if (settings.show_steamspy_info) {
				settings.show_steamspy_info = false;
				$("#steam-spy").hide();
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_steamspy_info = true;
				$("#steam-spy").show();
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
			}
			storage.set({'show_steamspy_info': settings.show_steamspy_info});

			if (settings.show_steamspy_info && $("#steam-spy").length == 0) {
				var appid = get_appid(window.location.host + window.location.pathname);
				add_steamspy_info(appid);
			}
		});

		$("#show_apppage_surveys").click(function() {
			if (settings.show_apppage_surveys) {
				settings.show_apppage_surveys = false;
				$("#performance_survey").hide();
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_apppage_surveys = true;
				$("#performance_survey").show();
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
			}
			storage.set({'show_apppage_surveys': settings.show_apppage_surveys});

			if (settings.show_apppage_surveys && $("#performance_survey").length == 0) {
				var appid = get_appid(window.location.host + window.location.pathname);
				survey_data_from_site(appid);
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

function add_help_button(appid) {
	$(".game_area_play_stats .already_owned_actions").after("<div class='game_area_already_owned_btn'><a class='btnv6_lightblue_blue btnv6_border_2px btn_medium' href='https://help.steampowered.com/#HelpWithGame/?appid=" + appid + "'><span>" + localized_strings.get_help + "</span></a></div>");
}

function customize_home_page() {
	$(".home_page_content:first").append("<div id='es_customize_btn' class='home_actions_ctn' style='margin-bottom: 4px; visibility: visible;'><div class='home_btn home_customize_btn' style='z-index: 13;'>" + localized_strings.customize + "</div></div><div style='clear: both;'></div>");
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

		var html = "<div class='home_viewsettings_popup' style='display: none; z-index: 12; right: 18px;'><div class='home_viewsettings_instructions' style='font-size: 12px;'>" + localized_strings.apppage_sections + "</div>"

		// Carousel
		if ($("#home_main_cluster").length > 0) {
			text = localized_strings.homepage_carousel;
			if (settings.show_homepage_carousel) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_carousel'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_carousel'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$("#home_main_cluster").parent().hide();
			}
		}

		// Spotlight
		if ($("#spotlight_scroll").length > 0) {
			text = localized_strings.homepage_spotlight;
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
			text = localized_strings.homepage_tabs;
			if (settings.show_homepage_tabs) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_tabs'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_tabs'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$(".home_tab_col").hide();
			}
		}

		var specials_section_parent = $(".dailydeal_ctn").parent();
		specials_section_parent.parent().find("h2:first, .dailydeal_ctn, .home_specials_ctn:first").wrapAll("<div id='es_specials_section' />");
		specials_section_parent.parent().find(".home_specials_ctn:last").wrapAll("<div id='es_under_ten_section' />");
		
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
			text = localized_strings.homepage_sidebar;
			if (settings.show_homepage_sidebar) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_sidebar'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_sidebar'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$(".home_page_gutter").hide();
				$(".home_page_body_ctn").css("margin-left", "0px");
				$(".home_page_content").css("padding-left", "0px");
				$("#global_header .content:first").css("right", "10px");
				$(".hardware_ctn").css("padding-left", "0px");
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
				$("#global_header .content:first").css("right", "10px");
				$(".has_takeover").find(".page_background_holder").css("margin-left", "-202px");
				$(".hardware_ctn").css("padding-left", "0px");
				$(this).find(".home_viewsettings_checkbox").removeClass("checked");
			} else {
				settings.show_homepage_sidebar = true;
				$(".home_page_gutter").show();
				$(".home_page_content").css("padding-left", "204px");
				$(this).find(".home_viewsettings_checkbox").addClass("checked");
				$(".has_takeover").find(".page_background_holder").css("margin-left", "0px");
				$("#global_header .content:first").css("right", "-90px");
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

		get_http('https://store.steampowered.com/account/licenses/', function (txt) {
			var purchaseDate = $(txt).find("td:contains(" + appname + "):last").parent().find(".license_date_col").text();
			$(".game_area_already_owned:first").each(function (index, node) {
				if (purchaseDate) {
					$(".game_area_already_owned:first .already_in_library").append(" " + localized_strings.purchase_date.replace("__date__", purchaseDate));
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
					check_early_access(node, 0, ":last");
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
					check_early_access(node);
				}

				if (node.classList && node.classList.contains("search_result_row")) {
					start_highlighting_node(node);
					check_early_access(node);
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
		"div.curated_app_item",	// curated app items!
		"a.summersale_dailydeal" // Summer sale daily deal
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
				get_http("//store.steampowered.com/dynamicstore/userdata/", function(txt) {
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
			".blotter_daily_rollup_line a",
			".blotter_group_announcement_header_text a"
		];
		var ownedapps = getValue("owned_apps");
		if (ownedapps) ownedapps = ownedapps.split(",");
		var wishlistapps = getValue("wishlist_apps");
		if (wishlistapps) wishlistapps = wishlistapps.split(",");

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
					$(".apphub_OtherSiteInfo").append('<a class="btnv6_blue_hoverfade btn_medium steamdb_ico" target="_blank" href="//steamdb.info/app/' + appid + '/"><span><i class="ico16" style="background-image:url('+ chrome.extension.getURL("img/steamdb_store.png") +')"></i>&nbsp; Steam Database</span></a>');
					break;
				case "gamegroup":
					$('#rightActionBlock' ).append('<div class="actionItemIcon"><img src="' + chrome.extension.getURL("img/steamdb.png") + '" width="16" height="16" alt=""></div><a class="linkActionMinor" target="_blank" href="//steamdb.info/app/' + appid + '/">' + localized_strings.view_in + ' Steam Database</a>');
					break;
				case "app":
					$('#ReportAppBtn').parent().prepend('<a class="btnv6_blue_hoverfade btn_medium steamdb_ico" target="_blank" href="//steamdb.info/app/' + appid + '/" style="display: block; margin-bottom: 6px;"><span><i class="ico16" style="background-image:url('+ chrome.extension.getURL("img/steamdb_store.png") +')"></i>&nbsp; &nbsp;' + localized_strings.view_in + ' Steam Database</span></a>');
					break;
				case "sub":
					$(".share").before('<a class="btnv6_blue_hoverfade btn_medium steamdb_ico" target="_blank" href="//steamdb.info/sub/' + appid + '/" style="display: block; margin-bottom: 6px;"><span><i class="ico16" style="background-image:url('+ chrome.extension.getURL("img/steamdb_store.png") +')"></i>&nbsp; &nbsp;' + localized_strings.view_in + ' Steam Database</span></a>');
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

	if (type == "app") {
		$('#ReportAppBtn').parent().parent().prependTo($('#ReportAppBtn').parent().parent().parent());
	}
}

function add_familysharing_warning(appid) {
	storePageData.get("exfgls", function(data) {
		if (data.excluded) {
			$("#game_area_purchase").before('<div id="purchase_note"><div class="notice_box_top"></div><div class="notice_box_content">' + localized_strings.family_sharing_notice + '</div><div class="notice_box_bottom"></div></div>');
		}
	});
}

// Display app descriptions on storefront carousel
function add_carousel_descriptions() {
	storage.get(function(settings) {
		if (settings.show_carousel_descriptions === undefined) { settings.show_carousel_descriptions = true; storage.set({'show_carousel_descriptions': settings.show_carousel_descriptions}); }
		if (settings.show_carousel_descriptions) {
			if ($(".main_cluster_content").length > 0) {
				var description_height_to_add = 56,
					heightvar = parseInt($(".main_cluster_content").css("height").replace("px", ""), 10) + description_height_to_add + "px";
				$(".main_cluster_content").css("height", heightvar);
				$("#main_cluster_scroll .cluster_capsule").css("height", heightvar);
				$("#main_cluster_scroll .discount_block").css("bottom", "98px");
				
				setTimeout(function() {
					$.each($(".cluster_capsule"), function(i, _obj) {
						var appid = get_appid(_obj.href),
							$desc = $(_obj).find(".main_cap_content");
						
						$desc.css("height", parseInt($desc.css("height").replace("px", ""), 10) + description_height_to_add + "px");
						$desc.parent().css("height", parseInt($desc.parent().css("height").replace("px", ""), 10) + description_height_to_add + "px");

						var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
						var last_updated = getValue(appid + "carousel_time") || expire_time - 1;

						if (last_updated < expire_time) {
							get_http('//store.steampowered.com/app/' + appid, function(txt) {
								var desc = txt.match(/textarea name="w_text" placeholder="(.+)" maxlength/);
								if (desc) {
									var elem_to_add = $("<div class='main_cap_status' style='font-size: 12px; line-height: normal;'>" + desc[1] + "</div>");
									elem_to_add.html(elem_to_add.text());
									setValue(appid + "carousel", elem_to_add.text());
									setValue(appid + "carousel_time", parseInt(Date.now() / 1000, 10));
									$desc.append(elem_to_add);
								}
							});
						} else {
							var desc = getValue(appid + "carousel");
							var value_to_add = "<div class='main_cap_status' style='font-size: 12px; line-height: normal;'>" + desc + "</div>";
							$desc.append(value_to_add);
						}
					});
				}, 750);

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
						$(node).find("span:not(.nickname_block,.nickname_name)").append("<br><a href='//steamcommunity.com" + html[1] + "compare' class='es_achievement_compare' target='_blank' style='font-size: 10px; float: right; margin-right: 6px;'>(" + localized_strings.compare + ")</a>");
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

function get_store_session() {
	if (is_signed_in) {
		if (cookie.match(/sessionid+=([^\\s;]*);/)) {
			storage.set({'store_sessionid': cookie.match(/sessionid+=([^\\s;]*);/)[1] });
		}	
	}
}

function add_app_page_wishlist(appid) {
	storage.get(function(settings) {
		if (settings.wlbuttoncommunityapp === undefined) { settings.wlbuttoncommunityapp = true; storage.set({'wlbuttoncommunityapp': settings.wlbuttoncommunityapp}); }
		if (settings.wlbuttoncommunityapp) {
			var wishlisted = getValue(appid + "wishlisted");
			var owned = getValue(appid+"owned");
			if(!wishlisted && !owned){
				$(".apphub_Stats").prepend('<div class="btnv6_blue_hoverfade btn_medium" style="margin-right: 3px" id="es_wishlist"><span>' + localized_strings.add_to_wishlist + '</span>');
				$("#es_wishlist").click(function() {
					$.ajax({
						type:"POST",
						url:"store.steampowered.com/api/addtowishlist",
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
			$(".queue_actions_ctn").find("img[src='http://store.akamai.steamstatic.com/public/images/v6/ico/ico_selected.png']").parent().parent().wrap("<div id='add_to_wishlist_area' style='display: inline-block;'></div>");
			$("#add_to_wishlist_area").find("a:first").removeAttr("href");
			$("#add_to_wishlist_area").find("a:first").wrap("<div id='add_to_wishlist_area_success' class='queue_control_button'></div>");
			
			// Add wishlist areas
			$("#add_to_wishlist_area").prepend("<div id='es_wishlist_area' style='display: none;' class='queue_control_button'><a class='btnv6_blue_hoverfade btn_medium' href='javascript:AddToWishlist( " + appid + ", \"add_to_wishlist_area\", \"add_to_wishlist_area_success\", \"add_to_wishlist_area_fail\", \"1_5_9__407\" );'><span>" + localized_strings.add_to_wishlist + "</span></a></div><div id='add_to_wishlist_area_fail' style='display: none;'></div>");

			$("#add_to_wishlist_area_success").hover(
				function() {
					$(this).find("img").attr("src", chrome.extension.getURL("img/remove.png"));
				}, function() {
					$(this).find("img").attr("src", "//store.akamai.steamstatic.com/public/images/v6/ico/ico_selected.png");
				}
			)

			$("#add_to_wishlist_area_success").on("click", function() {
				// get community session variable (this is different from the store session)
				get_http("//steamcommunity.com/my/wishlist", function(txt) {
					var session = txt.match(/sessionid" value="(.+)"/)[1];
					var user = ($(".user_avatar").attr('href')).split("/");
					user = user[user.length - 2];

					$.ajax({
						type:"POST",
						url: "//steamcommunity.com/id/" + user + "/wishlist",
						data:{
							sessionid: session,
							action: "remove",
							appid: appid
						},
						success: function( msg ) {
							setValue(appid + "wishlisted", false);
							$("#add_to_wishlist_area_success").hide();
							$("#es_wishlist_area").show();
						}
					});
				});
			});

			$("#es_wishlist_area").on("click", function() {
				$("#add_to_wishlist_area_success").show();
				$("#es_wishlist_area").hide();
				setTimeout(function() { $("#add_to_wishlist_area").show(); },1000);
			});
		}
	}
}

function clear_cache() {
	localStorage.clear();
}

function change_user_background() {
	profileData.get("profile", function(data) {
		var txt = data.background;
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
				html += "<div class='formRow'><div class='formRowTitle' style='overflow: visible;'>" + localized_strings.custom_background + ":<span class='formRowHint' title='" + localized_strings.custom_background_help + "'>(?)</span></div><div class='formRowFields'><div class='profile_background_current'><div class='profile_background_current_img_ctn'><div class='es_loading'><img src='//cdn.steamcommunity.com/public/images/login/throbber.gif'><span>"+ localized_strings.loading +"</div>";
				html += "<img id='es_profile_background_current_image' src=''>";
				html += "</div><div class='profile_background_current_description'><div id='es_profile_background_current_name'>";
				html += "</div></div><div style='clear: left;'></div><div class='background_selector_launch_area'></div></div><div class='background_selector_launch_area'>&nbsp;<div style='float: right;'><span id='es_background_remove_btn' class='btn_grey_white_innerfade btn_small'><span>" + localized_strings.remove + "</span></span>&nbsp;<span id='es_background_save_btn' class='btn_grey_white_innerfade btn_small btn_disabled'><span>" + localized_strings.save + "</span></span></div></div></div></div>";
				html += "</form><form id='es_profile_remove' method='POST' action='http://www.enhancedsteam.com/gamedata/profile_bg_remove.php'>";
				html += "<input type='hidden' name='steam64' value='" + steam64 + "'>";
				html += "</form>";
				$(".group_content_bodytext").before(html);

				get_http("//api.enhancedsteam.com/profile-select-v2/?steam64=" + steam64, function (txt) {
					var data = JSON.parse(txt);
					var select_html = "<select name='es_background_gamename' id='es_background_gamename' class='gray_bevel dynInput'><option value='0' id='0'>" + localized_strings.noneselected + "</option>";
					
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

					profileData.get("profile", function(data) {
						$("#es_profile_background_current_image").attr("src", escapeHTML(data["background-small"]));
					});

					$("#es_background_gamename").change(function() {						
						var appid = $("#es_background_gamename option:selected").attr("id");
						$("#appid").attr("value", appid);
						$("#es_background_selection").remove();
						if (appid == 0) {
							$("#es_profile_background_current_image").attr("src", "");
						} else {
							$("#es_profile_background_current_name").after("<div class='es_loading'><img src='//cdn.steamcommunity.com/public/images/login/throbber.gif'><span>"+ localized_strings.loading +"</div>");							

							get_http("//api.enhancedsteam.com/profile-select-v2-game/?appid=" + appid + "&steam64=" + steam64, function (txt) {
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
								profileData.clearOwn();
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

function add_es_style_selection() {
	if (window.location.pathname.indexOf("/settings") < 0) {
		var steam64 = $(document.body).html().match(/g_steamID = \"(.+)\";/)[1];
		var html = "<form id='es_profile_style' method='POST' action='http://api.enhancedsteam.com/profile_style/profile_style_save.php'><div class='group_content group_summary'>";
		html += "<input type='hidden' name='steam64' value='" + steam64 + "'>";
		html += "<div class='formRow'><div class='formRowTitle'>" + localized_strings.custom_style + ":<span class='formRowHint' title='" + localized_strings.custom_style_help + "'>(?)</span></div><div class='formRowFields'><div class='profile_background_current'><div class='profile_background_current_img_ctn'><div id='es_style_loading'><img src='//cdn.steamcommunity.com/public/images/login/throbber.gif'><span>"+ localized_strings.loading +"</div>";
		html += "<img id='es_profile_style_current_image' src='' style='margin-bottom: 12px;'>";
		html += "</div><div class='profile_style_current_description'><div id='es_profile_style_current_name'>";
		html += "</div></div><div style='clear: left;'></div><div class='background_selector_launch_area'></div></div><div class='background_selector_launch_area'>&nbsp;<div style='float: right;'><span id='es_style_remove_btn' class='btn_grey_white_innerfade btn_small'><span>" + localized_strings.remove + "</span></span>&nbsp;<span id='es_style_save_btn' class='btn_grey_white_innerfade btn_small btn_disabled'><span>" + localized_strings.save + "</span></span></div></div></div></div>";
		html += "</form><form id='es_style_remove' method='POST' action='http://api.enhancedsteam.com/profile_style/profile_style_remove.php'>";
		html += "<input type='hidden' name='steam64' value='" + steam64 + "'>";
		html += "</form>";
		$(".group_content_bodytext").before(html);

		profileData.get("profile_style", function (data) {
			var txt = data.style;
			var select_html = "<select name='es_style' id='es_style' class='gray_bevel dynInput'><option value='remove' id='remove'>" + localized_strings.noneselected + "</option>";
			select_html += "<option id='blue' value='blue'>Blue Theme</option>";
			select_html += "<option id='clear' value='clear'>Clear Theme</option>";
			select_html += "<option id='green' value='green'>Green Theme</option>";
			select_html += "<option id='holiday2014' value='holiday2014'>Holiday Profile 2014</option>";
			select_html += "<option id='orange' value='orange'>Orange Theme</option>"
			select_html += "<option id='pink' value='pink'>Pink Theme</option>"
			select_html += "<option id='purple' value='purple'>Purple Theme</option>";
			select_html += "<option id='red' value='red'>Red Theme</option>";
			select_html += "<option id='teal' value='teal'>Teal Theme</option>";
			select_html += "<option id='yellow' value='yellow'>Yellow Theme</option>";
			select_html += "</select>";
			
			$("#es_style_loading").remove();
			$("#es_profile_style_current_name").html(select_html);
			if (txt != "") {
				$("#es_style").val(txt); 
				$("#es_profile_style_current_image").attr("src", chrome.extension.getURL("img/profile_styles/" + txt + "/preview.png"));
			}
		
			$("#es_style").change(function() {
				if ($("#es_style").val() == "remove") {
					$("#es_profile_style_current_image").hide();
				} else {
					$("#es_profile_style_current_image").show();
					$("#es_profile_style_current_image").attr("src", chrome.extension.getURL("img/profile_styles/" + $("#es_style").val() + "/preview.png"));
				}

				// Enable the "save" button
				$("#es_style_save_btn").removeClass("btn_disabled");
				$("#es_style_save_btn").click(function(e) {
					profileData.clearOwn();
					$("#es_profile_style").submit();
				});
			});
		});

		$("#es_style_remove_btn").click(function() {
			$("#es_style_remove").submit();
		});
	}
}

function add_profile_store_links() {
	$(".game_name").find(".whiteLink").each(function() {
		var href = this.href.replace("//steamcommunity.com", "//store.steampowered.com");		
		$(this).after("<br><a class='whiteLink' style='font-size: 10px;' href=" + href + ">" + localized_strings.visit_store + "</a>");
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
	$(".clientConnChangingText").before("<div style='float:right;'><p class='clientConnHeaderText'>" + localized_strings.total_size + ":</p><p class='clientConnMachineText'>" +total + " GiB</p></div.");
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
	$(".clientConnChangingText").before("<div style='float:right;'><p class='clientConnHeaderText'>" + localized_strings.total_time + ":</p><p class='clientConnMachineText'>" +total + " Hours</p></div>");
}

function add_gamelist_sort() {
	if ($(".clientConnChangingText").length > 0) {
		$("#gameslist_sort_options").append("&nbsp;&nbsp;<label id='es_gl_sort_size'><a>" + localized_strings.size + "</a></label>");

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

			$(this).html("<span style='color: #B0AEAC;'>" + localized_strings.size + "</span>");
			var html = $("#gameslist_sort_options").find("span[class='selected_sort']").html();
			html = "<a onclick='location.reload()'>" + html + "</a>";
			$("#gameslist_sort_options").find("span[class='selected_sort']").html(html);
		});
	}
}

function add_gamelist_filter() {
	if ($(".clientConnChangingText").length > 0) {
		var html  = "<span>" + localized_strings.show + ": </span>";
		html += "<label class='es_sort' id='es_gl_all'><input type='radio' name='es_gl_sort' id='es_gl_all_input' checked><span><a>" + localized_strings.games_all + "</a></span></label>";
		html += "<label class='es_sort' id='es_gl_installed'><input type='radio' name='es_gl_sort' id='es_gl_installed_input'><span><a>" + localized_strings.games_installed + "</a></span></label>";
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
							$(value).find(".gameListRowItemName").append("<div class='es_recentAchievements' id='es_app_" + appid + "'>");
							$("#es_app_" + appid).html(localized_strings.loading);
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
		get_http('//steamcommunity.com/profiles/' + is_signed_in + '/games/?xml=1', function (txt) {
			var dom = $.parseXML(txt);
			$("#gameFilter").parent().after("<input type=\"checkbox\" id=\"es_gl_show_notcommon_games\"><label for=\"es_gl_show_notcommon_games\" id=\"es_gl_show_notcommon_games_label\">"+localized_strings.notcommon_label+"</label>");
			$("#gameFilter").parent().after("<input type=\"checkbox\" id=\"es_gl_show_common_games\"><label for=\"es_gl_show_common_games\" id=\"es_gl_show_common_games_label\">"+localized_strings.common_label+"</label>");
			$("#show_common_games, [for=show_common_games]").hide();
			function game_id_toggle(show_toggle) {
				$(dom).find("gamesList games game appID").each(function() {
					$("#game_" + $(this).text()).toggle();
				});
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

		if ( $(".profile_small_header_texture a")[0].href == $(".playerAvatar:first a")[0].href.replace(/\/$/, "")) {
			var html  = "<div style='text-align: right;'><span>" + localized_strings.show + ": </span>";
				html += "<label class='badge_sort_option whiteLink es_badges' id='es_badge_all'><input type='radio' name='es_badge_sort' checked><span>" + localized_strings.badges_all + "</span></label>";
				html += "<label class='badge_sort_option whiteLink es_badges' id='es_badge_drops'><input type='radio' name='es_badge_sort'><span>" + localized_strings.badges_drops + "</span></label>";
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
	if ( $(".profile_small_header_texture a")[0].href == $(".playerAvatar:first a")[0].href.replace(/\/$/, "")) {
		if ($(".profile_badges_sortoptions").find("a[href$='sort=r']").length > 0) {
			$(".profile_badges_sortoptions").find("a[href$='sort=r']").after("&nbsp;&nbsp;<a class='badge_sort_option whiteLink' id='es_badge_sort_drops'>" + localized_strings.most_drops + "</a>&nbsp;&nbsp;<a class='badge_sort_option whiteLink' id='es_badge_sort_value'>" + localized_strings.drops_value + "</a>");
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
					push[1] = localized_strings.drops_worth_avg;
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
	if ($("#personalAchieve").length > 0) {
		$("#tabs").before("<div id='achievement_sort_options' class='sort_options'>" + localized_strings.sort_by + "<span id='achievement_sort_default'>" + localized_strings.theworddefault + "</span><span id='achievement_sort_date' class='es_achievement_sort_link'>" + localized_strings.date_unlocked + "</span></div>");
		$("#personalAchieve").clone().insertAfter("#personalAchieve").attr("id", "personalAchieveSorted").css("padding", "0px 16px").hide();

		var ajax_url = window.location.href.replace(/(\?[^#]*)?(?:#.*)?$/, function(string, search) {
			return (search ? search + "&" : "?" ) + "xml=1"
		});
		get_http(ajax_url, function(data) {
			var unlocktimes = {};
			$($.parseXML(data)).find("unlockTimestamp").each(function() {
				var imagesrc = $(this).siblings("iconClosed").text();
				var unlocktime = parseInt($(this).text());
				unlocktimes[imagesrc] = unlocktime;
			});

			var achRows = [];
			$("#personalAchieveSorted .achieveUnlockTime").each(function() {
				var achRow = $(this).closest(".achieveRow").remove();
				var unlocktime = unlocktimes[achRow.find(".achieveImgHolder img")[0].src];
				achRows.push([achRow, unlocktime]);
			});

			$(achRows.sort()).each(function() {
				$("#personalAchieveSorted").prepend(this[0]);
			});
		});

		$("#achievement_sort_default").on("click", function() {
			$(this).removeClass('es_achievement_sort_link');
			$("#achievement_sort_date").addClass("es_achievement_sort_link");
			$("#personalAchieve").show();
			$("#personalAchieveSorted").hide();
		});

		$("#achievement_sort_date").on("click", function() {
			$(this).removeClass('es_achievement_sort_link');
			$("#achievement_sort_default").addClass("es_achievement_sort_link");
			$("#personalAchieve").hide();
			$("#personalAchieveSorted").show();
		});
	}
}

function add_friends_sort() {
	var friends = $(".friendBlock.persona.offline");
	if (friends) {
		storage.get(function(settings) {
			if (settings.sortfriendsby === undefined) { settings.sortfriendsby = "default"; storage.set({'sortfriendsby': settings.sortfriendsby}); }
			var ajax_url = document.URL.replace(/\/?(?:[?#].*)?$/, "?l=en");
			get_http(ajax_url, function(txt) {
				var downtimes = [];
				var sorted = { default: [], lastonline: [] };
				var dom = $.parseHTML(txt);
				$(dom).find(".friendBlock.persona.offline").each(function(i) {
					var href = $(this).find("a")[0].href;
					var lastonline = $(this).find(".friendSmallText").text().match(/Last Online (?:(\d+) days)?(?:, )?(?:(\d+) hrs)?(?:, )?(?:(\d+) mins)? ago/)
					if (lastonline) {
						var days = parseInt(lastonline[1]) || 0;
						var hours = parseInt(lastonline[2]) || 0;
						var minutes = parseInt(lastonline[3]) || 0;
						var downtime = (days * 24 + hours) * 60 + minutes;
						downtimes.push([href, downtime, i]);
					} else {
						downtimes.push([href, Infinity, i]);
					}
				});
				downtimes.sort(function(a, b) {
					if (a[1] < b[1]) return -1;
					if (a[1] > b[1]) return 1;
					if (a[2] < b[2]) return -1;
					if (a[2] > b[2]) return 1;
					return 0;
				});
				friends.each(function() {
					sorted.default.push(this);
					var href = $(this).find("a")[0].href;
					for (var i = 0; i < downtimes.length; i++) {
						if (downtimes[i][0] == href) {
							sorted.lastonline[i] = this;
							break;
						}
					}
				});

				var sort_friends = function() {
					if (!$(this).hasClass("es_friends_sort_link")) return;
					$(this).removeClass("es_friends_sort_link");
					var order = this.id.replace(/^friends_sort_/, "");
					var after = $(".friendBlock.persona").last().next();
					after.before(sorted[order]);
					settings.sortfriendsby = order;
					storage.set({'sortfriendsby': settings.sortfriendsby});
					$("#friends_sort_options span:not(#"+this.id+")").addClass("es_friends_sort_link");
				};

				var sort_options = $("<div id=friends_sort_options>" + localized_strings.sort_by + "<span id=friends_sort_default>" + localized_strings.theworddefault + "</span><span id=friends_sort_lastonline class=es_friends_sort_link>" + localized_strings.lastonline + "</span></div>");
				if ($(".manage_friends_btn_ctn").length) {
					$(".manage_friends_btn_ctn").after(sort_options);
				} else {
					$(".maincontent").prepend(sort_options);
				}
				sort_options.find("span").on("click", sort_friends);
				$("#friends_sort_"+settings.sortfriendsby).click();
			});
		});
	}
}

function add_badge_view_options() {
	var html  = "<div style='text-align: right;'><span>" + localized_strings.view + ": </span>";
		html += "<label class='badge_sort_option whiteLink es_badges' id='es_badge_view_default'><input type='radio' name='es_badge_view' checked><span>" + localized_strings.theworddefault + "</span></label>";
		html += "<label class='badge_sort_option whiteLink es_badges' id='es_badge_view_binder'><input type='radio' name='es_badge_view'><span>" + localized_strings.binder_view + "</span></label>";
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
				"margin": "7px auto 0px auto",
				"width": "100%"
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
			$(".gamecards_inventorylink").append("<a class='btn_grey_grey btn_small_thin' href='" + window.location.origin + window.location.pathname + "?"+url_parameters_out+"'><span>"+localized_strings.view_normal_badge+"</span></a>");
		}
		else {
			$(".gamecards_inventorylink").append("<a class='btn_grey_grey btn_small_thin' href='" + window.location.origin + window.location.pathname + "'><span>"+localized_strings.view_normal_badge+"</span></a>");
		}
	}
	else {
		if(url_parameters_array[0]!=""){
			url_parameters_array.push("border=1");
			var url_parameters_out = url_parameters_array.join("&");
			$(".gamecards_inventorylink").append("<a class='btn_grey_grey btn_small_thin' href='" + window.location.origin + window.location.pathname + "?"+url_parameters_out+"'><span>"+localized_strings.view_foil_badge+"</span></a>");
		}
		else {
			$(".gamecards_inventorylink").append("<a class='btn_grey_grey btn_small_thin' href='" + window.location.origin + window.location.pathname + "?border=1'><span>"+localized_strings.view_foil_badge+"</span></a>");
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

	var price_type = user_currency == "USD" ? "price" : "price_" + user_currency.toLowerCase();

	get_http("//api.enhancedsteam.com/market_data/card_prices/?appid=" + game, function(txt) {
		var data = JSON.parse(txt);
		var converter=$("<div>");
		$(".badge_card_set_card").each(function() {
			var node = $(this);
			var cardname = $(this).html().match(/(.+)<div style=\"/)[1].trim().replace(/&amp;/g, '&');
			if (cardname == "") { cardname = $(this).html().match(/<div class=\"badge_card_set_text\">(.+)<\/div>/)[1].trim().replace(/&amp;/g, '&'); }

			var newcardname = converter.text(cardname).html();
			if (foil) { newcardname += " (Foil)"; }

			for (var i = 0; i < data.length; i++) {
				if (data[i].name == newcardname) {
					var marketlink = "//steamcommunity.com/market/listings/" + data[i].url;
					var card_price = formatCurrency(data[i][price_type]);
					if ($(node).hasClass("unowned")) cost += parseFloat(data[i][price_type]);
				}
			}

			if (!(marketlink)) { 
				if (foil) { newcardname = newcardname.replace("(Foil)", "(Foil Trading Card)"); } else { newcardname += " (Trading Card)"; }
				for (var i = 0; i < data.length; i++) {
					if (data[i].name == newcardname) {
						var marketlink = "//steamcommunity.com/market/listings/" + data[i].url;
						var card_price = formatCurrency(data[i][price_type]);
						if ($(node).hasClass("unowned")) cost += parseFloat(data[i][price_type]);
					}
				}
			}

			if (marketlink && card_price) {
				var html = "<a class=\"es_card_search\" href=\"" + marketlink + "\">" + localized_strings.lowest_price + ": " + card_price + "</a>";
				$(this).children("div:contains('" + cardname + "')").parent().append(html);
			}
		});
		if (cost > 0 && $(".profile_small_header_name .whiteLink").attr("href") == $(".user_avatar:first").attr("href").replace(/\/$/, "")) {
			cost = formatCurrency(cost);
			$(".badge_empty_name:last").after("<div class='badge_info_unlocked' style='color: #5c5c5c;'>" + localized_strings.badge_completion_cost+ ": " + cost + "</div>");
			$(".badge_empty_right").css("margin-top", "7px");
			$(".gamecard_badge_progress .badge_info").css("width", "296px");
		}
	});
}

// Display the cost estimate of crafting a game badge by purchasing unowned trading cards
function add_badge_completion_cost() {
	if (is_signed_in) {
		if ( $(".profile_small_header_texture:first a")[0].href == $(".playerAvatar:first a")[0].href.replace(/\/$/, "").replace(/\/$/, "")) {
			$(".profile_xp_block_right").html("<div id='es_cards_worth'></div>");
			var total_worth = 0, count = 0;

			// Gather appid info
			var appids = [],
				foil_appids = [],
				nodes = [],
				foil_nodes = [];
			$(".badge_row").each(function() {
				var game = $(this).find(".badge_row_overlay").attr("href").match(/\/(\d+)\//),
					foil = $(this).find("a:last").attr("href").match(/\?border=1/),
					node = $(this),
					push = [];

				if (game) {
					push[0] = game[1];
					push[1] = node[0];
					if (foil) {
						foil_appids.push(game[1]);
						foil_nodes.push(push);
					} else {
						appids.push(game[1]);
						nodes.push(push);
					}
				}
			});

			// Next, get the average card values
			if (appids.length > 0) {
				get_http("//api.enhancedsteam.com/market_data/average_card_prices/?cur=" + user_currency.toLowerCase() + "&appids=" + appids.join(), function(json) {
					var data = JSON.parse(json);
					$.each(nodes, function(index, value) {
						var appid = value[0],
							node = value[1];

						if (appid in data["avg_values"]) {
							if ($(node).find("div[class$='badge_progress_info']").text()) {
								var card = $(node).find("div[class$='badge_progress_info']").text().trim().match(/(\d+)\D*(\d+)/);
								if (card) var need = card[2] - card[1];
							}

							var cost = (need * parseFloat(data["avg_values"][appid])).toFixed(2);
							if ($(node).find(".progress_info_bold").text()) {
								var drops = $(node).find(".progress_info_bold").text().match(/\d+/);
								if (drops) { var worth = (drops[0] * parseFloat(data["avg_values"][appid])).toFixed(2); }
							}

							if (worth > 0) {
								total_worth = total_worth + parseFloat(worth);
							}

							cost = formatCurrency(cost);
							card = formatCurrency(worth);
							worth_formatted = formatCurrency(total_worth);

							if (worth > 0) {
								$(node).find(".how_to_get_card_drops").after("<span class='es_card_drop_worth'>" + localized_strings.drops_worth_avg + " " + card + "</span>")
								$(node).find(".how_to_get_card_drops").remove();
							}

							$(node).find(".badge_empty_name:last").after("<div class='badge_info_unlocked' style='color: #5c5c5c;'>" + localized_strings.badge_completion_avg + ": " + cost + "</div>");
							$(node).find(".badge_empty_right").css("margin-top", "7px");
							$(node).find(".gamecard_badge_progress .badge_info").css("width", "296px");

							$("#es_cards_worth").text(localized_strings.drops_worth_avg + " " + worth_formatted);
						}
					});
				});
			}

			// Finally, do the foils
			if (foil_appids.length > 0) {
				get_http("//api.enhancedsteam.com/market_data/average_card_prices/?cur=" + user_currency.toLowerCase() + "&foil=true&appids=" + foil_appids.join(), function(json) {
					var foil_data = JSON.parse(json);
					$.each(foil_nodes, function(index, value) {
						var appid = value[0],
							node = value[1];

						if (appid in foil_data["avg_values"]) {
							if ($(node).find("div[class$='badge_progress_info']").text()) {
								var card = $(node).find("div[class$='badge_progress_info']").text().trim().match(/(\d+)\D*(\d+)/);
								if (card) var need = card[2] - card[1];
							}

							var cost = (need * parseFloat(foil_data["avg_values"][appid])).toFixed(2);
							cost = formatCurrency(cost);
							$(node).find(".badge_empty_name:last").after("<div class='badge_info_unlocked' style='color: #5c5c5c;'>" + localized_strings.badge_completion_avg + ": " + cost + "</div>");
							$(node).find(".badge_empty_right").css("margin-top", "7px");
							$(node).find(".gamecard_badge_progress .badge_info").css("width", "296px");
						}
					});
				});
			}
		}
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
		$(".badge_detail_tasks_rule").next().next().after('<div class="gamecards_inventorylink"><a href="http://steamcommunity.com/app/'+appid+'/tradingforum/" class="btn_grey_grey btn_medium"><span>' + localized_strings.visit_trade_forum + '</span></a></div>');
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
	if ( $(".profile_small_header_texture a")[0].href == $(".playerAvatar:first a")[0].href.replace(/\/$/, "")) {
		var drops_count = 0,
			drops_games = 0,
			booster_games = 0,
			game_tiles = [],
			completed = false;

		if ($(".pagebtn").length > 0) {
			if (window.location.href.match(/\/$/) || window.location.href.match(/p\=1$/)) {				
				$(".profile_xp_block_right").prepend("<span id='es_calculations' style='color: #fff;'>" + localized_strings.drop_calc + "</span>").css("cursor", "pointer");

				$("#es_calculations").click(function() {
					if (completed == false) {
						$(".profile_xp_block_right").css("cursor", "default");
						$("#es_calculations").text(localized_strings.loading);

						// First, get the contents of the first page
						$(".progress_info_bold").each(function(i, obj) {
							var parent = $(obj).parent().parent();
							if ($(parent).find(".progress_info_bold")[0]) {
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
										if ($(parent).find(".progress_info_bold")[0]) {
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
						completed = true;
					}
				});
			}
		} else {
			$(".profile_xp_block_right").prepend("<span id='es_calculations' style='color: #fff;'>" + localized_strings.drop_calc + "</span>");
			$(".progress_info_bold").each(function(i, obj) {
				var parent = $(obj).parent().parent();
				if ($(parent).find(".progress_info_bold")[0]) {
					game_tiles.push(parent);
				}
			});
			add_total_drops_count_calculations(game_tiles);
		}

		function add_total_drops_count_calculations(games) {
			$(games).each(function(i, obj) {
				var obj_count = obj.find(".progress_info_bold")[0].innerHTML.match(/\d+/);
				if (obj_count && obj_count[0]!='0') {
					drops_count += parseInt(obj_count[0]);
					drops_games = drops_games + 1;
				}
			});

			$("#es_calculations").html(localized_strings.card_drops_remaining.replace("__drops__", drops_count) + "<br>" + localized_strings.games_with_drops.replace("__dropsgames__", drops_games));

			get_http("//steamcommunity.com/my/ajaxgetboostereligibility/", function(txt) {
				var eligible = $.parseHTML(txt);
				$(eligible).find(".booster_eligibility_games").children().each(function(i, obj) {
					booster_games += 1;
				});

				$("#es_calculations").append("<br>" + localized_strings.games_with_booster.replace("__boostergames__", booster_games));
			});
		}

		if ($(".badge_details_set_favorite").find(".btn_grey_black").length > 0) { $(".badge_details_set_favorite").append("<div class='btn_grey_black btn_small_thin' id='es_faq_link'><span>" + localized_strings.faqs + "</span></div>"); }
		$("#es_faq_link").click(function() {
			window.location = "//steamcommunity.com/tradingcards/faq";
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
				html += localized_strings.all_friends_own.replace('__friendcount__', friendsown.length);
				html += ' <span class="underScoreColor">_</span>';
				html += '</div>';

				html += '<div class="profile_friends" style="height: ' + (48 * friendsown.length / 3) + 'px;">';

				for (var i = 0; i < friendsown.length; i++) {
					var steamID = friendsown[i].steamid.slice(4) - 1197960265728;
					var friend_html = $(friends_html.find('.friendBlock[data-miniprofile=' + steamID + ']')[0].outerHTML);
					var friend_small_text = localized_strings.hours_short.replace('__hours__', Math.round(friendsown[i].playtime_twoweeks / 60 * 10) / 10);
					friend_small_text += ' / ' + localized_strings.hours_short.replace('__hours__', Math.round(friendsown[i].playtime_total / 60 * 10) / 10);
					var compare_url = friend_html.find('.friendBlockLinkOverlay')[0].href + '/stats/' + appid + '/compare';
					friend_small_text += '<br><a class="whiteLink friendBlockInnerLink" href="' + compare_url + '">' + localized_strings.view_stats + '</a>';
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

function add_friends_playtime_sort() {
	if ($("#memberList").find(".mainSectionHeader").length == 3) { var section = 1; } else { var section = 2; }
	$("#memberList").find(".mainSectionHeader").eq(section).append(" (<span id='es_default_sort' style='text-decoration: underline; cursor: pointer;'>" + localized_strings.sort_by.replace(":", "") + " " + localized_strings.theworddefault + "</span> | <span id='es_playtime_sort' style='cursor: pointer;'>" + localized_strings.sort_by.replace(":", "") + " Playtime</span>)");
	$("#memberList").children(".profile_friends").eq(section).attr("id", "es_friends_default");
	var sorted = $("#es_friends_default").clone();
	$(sorted).attr("id", "es_friends_playtime").hide();
	$("#es_friends_default").after("<div style='clear: both'></div>").after(sorted);

	$("#es_playtime_sort").click(function() {
		$("#es_playtime_sort").css("text-decoration", "underline");
		$("#es_default_sort").css("text-decoration", "none");
		$("#es_friends_default").hide();
		$("#es_friends_playtime").show();
		var friendArray = [];
		$("#es_friends_default").find(".friendBlock").each(function(index, value) {
			var push = new Array();
			push[0] = $(value).clone();
			push[1] = $(value).find(".friendSmallText").text().match(/(\d+(\.\d+)?)/)[0];
			friendArray.push(push);
		});
		friendArray.sort(function(a,b) { return parseFloat(b[1]) - parseFloat(a[1]); });
		$("#es_friends_playtime").html("");
		$(friendArray).each(function(index, value) {
			$("#es_friends_playtime").append(value[0]);
		});
	});

	$("#es_default_sort").click(function() {
		$("#es_default_sort").css("text-decoration", "underline");
		$("#es_playtime_sort").css("text-decoration", "none");
		$("#es_friends_playtime").hide();
		$("#es_friends_default").show();
	});
}

function add_decline_button() {
	if (window.location.href.match(/tradeoffers\/?$/)) {
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
			get_http('//api.enhancedsteam.com/steamapi/GetPlayerSummaries/?steamids=' + profile_id, function (txt) {
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
					var message = localized_strings["birthday_message"].replace("__username__", username).replace("__age__", years);
					$("#logo_holder img").attr({"title":message,"alt":message,"height":100,"src":chrome.extension.getURL("img/birthday_logo.png")}).css('margin-top', '-14px');
					$(".logo").css({"height":"60px","padding-top":"14px"});

					switch (window.location.host) {
						case "store.steampowered.com":
							switch (true) {
								case /^\/$/.test(window.location.pathname):
									if ($("#parental_notice").length == 0) {
										$("#global_header").append("<div style='background-image: url("+chrome.extension.getURL("img/birthday_bg.png")+");' class='birthday'></div>");
									}
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
							$(this).after('<div class="DRM_notice" style="padding-left: 17px; margin-top: 0px; padding-top: 20px; min-height: 28px;"><div class="gift_icon"><img src="' + chrome.extension.getURL("img/trading.png") + '" style="float: left; margin-right: 13px;"></div><div data-store-tooltip="' + localized_strings.acrtag_tooltip + '">' + localized_strings.acrtag_msg + '.</div></div>');
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

function launch_random_button() {
	$("#es_popup").append("<div class='hr'></div><a id='es_random_game' class='popup_menu_item' style='cursor: pointer;'>" + localized_strings.launch_random + "</a>");

	$("#es_random_game").on("click", function() {
		var owned_promise = (function () {
			var deferred = new $.Deferred();
			var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
			var last_updated = getValue("owned_list_time") || expire_time - 1;

			if (last_updated < expire_time) {
				get_http("//api.enhancedsteam.com/steamapi/GetOwnedGames/?steamid=" + is_signed_in, function(txt) {
					setValue("owned_apps", txt);
					setValue("owned_list_time", parseInt(Date.now() / 1000, 10));
					deferred.resolve();
				});
			} else {
				deferred.resolve();
			}
			return deferred.promise();
		})();

		$.when.apply($, [owned_promise]).done(function() {
			var owned = getValue("owned_apps");
			var data = JSON.parse(owned);
			var games = data.response.games;
			var rand = games[Math.floor(Math.random() * games.length)];
			runInPageContext(
				"function() {\
					var prompt = ShowConfirmDialog('" + localized_strings.play_game.replace("__gamename__", rand.name.replace("'", "").trim()) + "', '<img src=//cdn.akamai.steamstatic.com/steam/apps/" + rand.appid + "/header.jpg>', null, null, '" + localized_strings.visit_store + "'); \
					prompt.done(function(result) {\
						if (result == 'OK') { window.location.assign('steam://run/" + rand.appid + "'); }\
						if (result == 'SECONDARY') { window.location.assign('//store.steampowered.com/app/" + rand.appid + "'); }\
					});\
				 }"
			);
		});
	});
}

function add_itad_button() {
	storage.get(function(settings) {
		if (settings.show_itad_button === undefined) { settings.show_itad_button = false; storage.set({'show_itad_button': settings.show_itad_button}); }
		if (settings.show_itad_button) {
			$("#es_popup").append("<a id='es_itad' class='popup_menu_item' style='cursor: pointer;'>" + localized_strings.itad.send_to_itad + "</a>");

			$("#es_itad").on("click", function() {
				var ripc = function () {
					var dialog = ShowBlockingWaitDialog("", "");
					var url = "http://store.steampowered.com/dynamicstore/userdata/" + g_AccountID;
					$J.get(url).done(function(data) {
						var form = "<form name='itad_import' method='POST' action='https://isthereanydeal.com/outside/user/collection/3rdparty/steam'>"
							+"<input type='hidden' name='json' value='" + JSON.stringify(data) + "'>"
							+"<input type='hidden' name='returnTo' value='" + window.location.href + "'>"
							+"</form>";
						$J(form).appendTo("#global_action_menu").submit();
					});
				};

				runInPageContext(ripc);
				$(".newmodal_header .ellipsis").text(localized_strings.loading);
				$(".waiting_dialog_container").append(localized_strings.itad.sending);
			});
		}
	});
}

$(document).ready(function(){
	var path = window.location.pathname.replace(/\/+/g, "/");

	// Don't interfere with Storefront API requests
	if (path.startsWith("/api")) return;

	$.when(localization_promise, signed_in_promise, currency_promise).done(function(){
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
				launch_random_button();
				add_itad_button();
			}			

			// Attach event to the logout button
			$('a[href$="javascript:Logout();"]').bind('click', clear_cache);

			switch (window.location.host) {
				case "store.steampowered.com":

					switch (true) {
						case /^\/cart\/.*/.test(path):
							add_empty_cart_button();
							break;

						case /^\/app\/.*/.test(path):
							var appid = get_appid(window.location.host + path);
							var metalink = $("#game_area_metalink").find("a").attr("href");
							storePageData.load(appid, metalink);

							add_app_page_wishlist_changes(appid);
							display_coupon_message(appid);
							show_pricing_history(appid, "app");
							dlc_data_from_site(appid);

							survey_data_from_site(appid);

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
							add_steamspy_info(appid);
							add_system_requirements_check(appid);
							add_app_badge_progress(appid);
							add_dlc_checkboxes();
							fix_achievement_icon_size();
							add_astats_link(appid);
							add_achievement_completion_bar(appid);

							show_regional_pricing();
							add_acrtag_warning();
							add_review_toggle_button();

							customize_app_page();
							add_help_button(appid);
							break;

						case /^\/sub\/.*/.test(path):
							var subid = get_subid(window.location.host + path);
							drm_warnings("sub");
							subscription_savings_check();
							show_pricing_history(subid, "sub");
							add_steamdb_links(subid, "sub");
							add_acrtag_warning();

							show_regional_pricing();
							break;

						case /^\/agecheck\/.*/.test(path):
							send_age_verification();
							break;

						case /^\/dlc\/.*/.test(path):
							dlc_data_for_dlc_page();
							break;

						case /^\/account(\/.*)?/.test(path):
							account_total_spent();
							replace_account_name();
							return;
							break;

						case /^\/steamaccount\/addfunds/.test(path):
							add_custom_wallet_amount();
							break;

						case /^\/search\/.*/.test(path):
							//add_cart_to_search();
							endless_scrolling();
							add_hide_buttons_to_search();
							break;

						case /^\/sale\/.*/.test(path):
							show_regional_pricing();
							break;

						// Storefront-front only
						case /^\/$/.test(path):
							add_popular_tab();
							add_allreleases_tab();
							set_homepage_tab();
							add_carousel_descriptions();
							window.setTimeout(function() { customize_home_page(); }, 500);
							break;
					}

					// Alternative Linux icon
					alternative_linux_icon();

					// Highlights & data fetching
					start_highlights_and_tags();

					// Storefront homepage tabs
					bind_ajax_content_highlighting();
					hide_trademark_symbols();
					set_html5_video();
					get_store_session();
					break;

				case "steamcommunity.com":

					add_wallet_balance_to_header();

					switch (true) {
						case /^\/(?:id|profiles)\/.+\/wishlist/.test(path):
							alternative_linux_icon();
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
							load_inventory().done(function() {
								start_highlights_and_tags();
							});	
							break;

						case /^\/(?:id|profiles)\/.+\/\b(home|myactivity|status)\b\/?$/.test(path):
							start_friend_activity_highlights();
							bind_ajax_content_highlighting();
							hide_activity_spam_comments();
							break;

						case /^\/(?:id|profiles)\/.+\/edit/.test(path):
							profileData.clearOwn();
							profileData.load();
							add_es_background_selection();
							add_es_style_selection();
							break;

						case /^\/(?:id|profiles)\/.+\/inventory/.test(path):
							bind_ajax_content_highlighting();
							inventory_market_prepare();
							hide_empty_inventory_tabs();
							keep_ssa_checked();
							break;

						case /^\/(?:id|profiles)\/(.+)\/games/.test(path):
							total_time();
							total_size();
							add_gamelist_achievements();
							add_gamelist_sort();
							add_gamelist_filter();
							add_gamelist_common();
							break;

						case /^\/(?:id|profiles)\/.+\/badges/.test(path):
							add_badge_completion_cost();
							add_total_drops_count();
							add_cardexchange_links();
							add_badge_filter();
							add_badge_sort();
							add_badge_view_options();
							break;

						case /^\/(?:id|profiles)\/.+\/stats/.test(path):
							add_achievement_sort();
							break;

						case /^\/(?:id|profiles)\/.+\/gamecards/.test(path):
							var gamecard = get_gamecard(path);
							add_cardexchange_links(gamecard);
							add_gamecard_market_links(gamecard);
							add_gamecard_foil_link();
							add_gamecard_trading_forum();
							break;

						case /^\/(?:id|profiles)\/.+\/friendsthatplay/.test(path):
							add_friends_that_play();
							add_friends_playtime_sort();
							break;

						case /^\/(?:id|profiles)\/.+\/friends(?:[/#?]|$)/.test(path):
							add_friends_sort();
							break;

						case /^\/(?:id|profiles)\/.+\/tradeoffers/.test(path):
							add_decline_button();
							break;

						case /^\/(?:id|profiles)\/.+/.test(path):
							profileData.load();
							add_community_profile_links();
							add_wishlist_profile_link();
							add_supporter_badges();
							add_twitch_info();
							change_user_background();
							add_profile_store_links();
							fix_profile_image_not_found();
							hide_spam_comments();
							add_steamrep_api();
							add_posthistory_link();
							add_profile_style();
							break;

						case /^\/sharedfiles\/browse/.test(path):
							remember_greenlight_filter().done(
								endless_scrolling_greenlight
							);

						case /^\/sharedfiles\/.*/.test(path):
							hide_greenlight_banner();
							hide_spam_comments();
							break;

						case /^\/workshop\/.*/.test(path):
							remember_greenlight_filter().done(
								endless_scrolling_greenlight,
								preview_greenlight_votes
							);
							hide_greenlight_banner();
							hide_spam_comments();
							break;

						case /^\/greenlight\/.*/.test(path):
							preview_greenlight_votes();
							break;

						case /^\/market\/.*/.test(path):
							load_inventory().done(function() {
								highlight_market_items();
								bind_ajax_content_highlighting();
							});
							add_market_total();
							add_active_total();
							minimize_active_listings();
							add_lowest_market_price();
							add_relist_button();
							keep_ssa_checked();
							break;

						case /^\/app\/.*/.test(path):
							var appid = get_appid(window.location.host + path);
							add_app_page_wishlist(appid);
							hide_spam_comments();
							add_steamdb_links(appid, "gamehub");
							break;

						case /^\/games\/.*/.test(path):
							var appid = document.querySelector( 'a[href*="http://steamcommunity.com/app/"]' );
							appid = appid.href.match( /(\d)+/g );
							add_steamdb_links(appid, "gamegroup");
							break;

						case /^\/tradingcards\/boostercreator/.test(path):
							add_booster_prices();
							break;

						case /^\/$/.test(path):
							hide_spam_comments();
							hide_trademark_symbols(true);
							break;
					}
					break;
			}
	});
});
