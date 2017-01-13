var version = "9.2";

var console_info = ["%c Enhanced %cSteam v" + version + " by jshackles %c http://www.enhancedsteam.com ", "background: #000000;color: #7EBE45", "background: #000000;color: #ffffff", ""];
console.log.apply(console, console_info);

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
	$.ajax({
		url: chrome.extension.getURL('/localization/en/strings.json'),
		mimeType: "application/json",
		success: function (data) {
			if (l_code == "en") {
				localized_strings = data;
				l_deferred.resolve();
			} else {
				$.ajax({
					url: chrome.extension.getURL('/localization/' + l_code + '/strings.json'),
					mimeType: "application/json",
					success: function (data_localized) {
						localized_strings = $.extend(true, data, data_localized);
						l_deferred.resolve();
					}
				});
			}
		}
	});
	return l_deferred.promise();
})();

var user_currency;
var currency_promise = (function() {
	var deferred = new $.Deferred();
	storage.get(function(settings) {
		if (settings.override_price === undefined) { settings.override_price = "auto"; storage.set({'override_price': settings.override_price}); }
		if (settings.override_price != "auto") {
			user_currency = settings.override_price;
			deferred.resolve();
		} else {
			chrome.storage.local.get("user_currency", function(currency_cache) {
				var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
				if (currency_cache.user_currency && currency_cache.user_currency.currency_type && currency_cache.user_currency.updated >= expire_time) {
					user_currency = currency_cache.user_currency.currency_type;
					deferred.resolve();
				} else {
					get_http("//store.steampowered.com/steamaccount/addfunds", function(txt) {
						user_currency = $(txt).find("input[name=currency]").first().val();
					}, "xhrFields: { withCredentials: true }").fail(function() {
						get_http("//store.steampowered.com/app/220", function(txt) {
							var currency = parse_currency($(txt).find(".price, .discount_final_price").text().trim());
							if (!currency) return;
							user_currency = currency.currency_type;
						}, "xhrFields: { withCredentials: true }").fail(function() {
							user_currency = "USD";
						}).done(function() {
							chrome.storage.local.set({user_currency: {currency_type: user_currency, updated: parseInt(Date.now() / 1000, 10)}});
						}).always(function() {
							deferred.resolve();
						});
					}).done(function() {
						chrome.storage.local.set({user_currency: {currency_type: user_currency, updated: parseInt(Date.now() / 1000, 10)}});
						deferred.resolve();
					});
				}
			});
		}
	});
	return deferred.promise();
})();

// Check if the user is signed in
var is_signed_in = false;
var profile_url = false;
var profile_path = false;

var signed_in_promise = (function () {
	var deferred = new $.Deferred();
	if ($("#global_actions").find(".playerAvatar").length > 0) {
		profile_url = $("#global_actions").find(".playerAvatar")[0].href;
		if (profile_url.match(/\/(?:id|profiles)\/(.+?)\/$/)) {
			profile_path = profile_url.match(/\/(?:id|profiles)\/(.+?)\/$/)[0];
		}

		if (profile_path) {
			if (getValue("steamID")) {
				is_signed_in = getValue("steamID");
				deferred.resolve();
			} else {
				get_http("//steamcommunity.com/profiles/0/", function(txt) {
					if (txt.match(/g_steamID = "(\d+)";/)) {
						is_signed_in = txt.match(/g_steamID = "(\d+)";/)[1];
						setValue("steamID", is_signed_in);
					}
					deferred.resolve();
				}, { xhrFields: {withCredentials: true} });
			}
		} else {
			deferred.resolve();
		}
	} else {
		deferred.resolve();
	}
	return deferred.promise();
})();

// TODO: We should store the data in ES's storage to ensure that is in sync across Store and Community
var dynamicstore_promise = (function () {
	var deferred = new $.Deferred();

	if (is_signed_in) {
		var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60 * 24, // 24 hours ago
			last_updated = getValue("dynamicstore_time") || expire_time - 1,
			dynamicstore_data = getValue("dynamicstore_data"),
			dataVersion = sessionStorage.getItem("unUserdataVersion") || 0,
			dataVersion_cache = getValue("unUserdataVersion") || 0;

		// Return data from cache if available
		if (dynamicstore_data) {
			deferred.resolve(dynamicstore_data);
		}

		// Update data if needed
		if ((last_updated < expire_time || !dynamicstore_data || dataVersion && dataVersion !== dataVersion_cache) && window.location.protocol != "https:") {
			var accountidtext = $('script:contains("g_AccountID")').text() || "",
				accountid = /g_AccountID = (\d+);/.test(accountidtext) ? accountidtext.match(/g_AccountID = (\d+);/)[1] : 0;

			get_http("//store.steampowered.com/dynamicstore/userdata/" + (accountid ? "?id=" + accountid + "&v=" + dataVersion : "?v=" + expire_time), function(txt) {
				var data = JSON.parse(txt);
				if (data && data.hasOwnProperty("rgOwnedApps") && !$.isEmptyObject(data.rgOwnedApps)) {
					setValue("dynamicstore_data", data);
					setValue("dynamicstore_time", parseInt(Date.now() / 1000, 10));

					deferred.resolve(data);
				} else {
					deferred.reject();
				}
			}).fail(function(){
				deferred.reject();
			});

			setValue("unUserdataVersion", dataVersion);
		}
	} else {
		deferred.reject();
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
	if (!v) return v;
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

function get_currency_from_DOM() {
	var currency_node = document.querySelector('meta[itemprop="priceCurrency"]');
	if (currency_node && currency_node.hasAttribute("content")) return currency_node.getAttribute("content");
	return null;
}

var page_currency;
function memoized_get_currency_from_DOM() {
	if(!page_currency) {
		page_currency = { value: get_currency_from_DOM() };
	}
	return page_currency.value;
}

function parse_currency(str) {
	var currency_symbol = currency_symbol_from_string(str);
	var currency_type = memoized_get_currency_from_DOM() || currency_symbol_to_type(currency_symbol);
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
		"CNY": 23,
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

function currency_number_to_type (currency_number) {
	return {5: "RUB",
		3: "EUR",
		2: "GBP",
		7: "BRL",
		8: "JPY",
		9: "NOK",
		10: "IDR",
		11: "MYR",
		12: "PHP",
		13: "SGD",
		14: "THB",
		15: "VND",
		16: "KRW",
		17: "TRY",
		18: "UAH",
		19: "MXN",
		20: "CAD",
		21: "AUD",
		22: "NZD",
		23: "CNY",
		24: "INR",
		25: "CLP",
		26: "PEN",
		27: "COP",
		28: "ZAR",
		29: "HKD",
		30: "TWD",
		31: "SAR",
		32: "AED"}[currency_number] || "USD";
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
			}, {timeout: 10000}).fail(function(){
				rates = cache_get(currency || user_currency, true);
				if (rates) {
					deferred.resolveWith(rates);
				} else {
					deferred.reject();
				}
			});
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
	function cache_get(currency, get_cached) {
		var cached = JSON.parse(localStorage.getItem("currencyConversion_" + currency));
		if (cached && (cached.expires > parseInt(Date.now() / 1000, 10) || get_cached)) {
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
 */
function getStoreRegionCountryCode() {
	var cc = "us",
		cookies = document.cookie,
		matched = cookies.match(/fakeCC=([a-z]{2})/i);
	if (matched != null && matched.length == 2) {
		cc = matched[1];
	} else {
		matched = cookies.match(/steamCC(?:_\d+){4}=([a-z]{2})/i);
		if (matched != null && matched.length == 2) {
			cc = matched[1];
		} else {
			matched = cookies.match(/steamCountry=([a-z]{2})/i);
			if (matched != null && matched.length == 2) {
				cc = matched[1];
			}
		}
	}
	return cc;
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

	if (localized_strings.ready) {
		$("#es_progress").attr({"max": 100, "title": localized_strings.ready.loading});
	}
	$("#es_progress").removeClass("complete");
	
	if (!settings) settings = {};
	if (!settings.dataType) settings.dataType = "text";
	
	var jqxhr = $.ajax(url, settings);
	
	jqxhr.done(function(){
		processed_requests += 1;
		var complete_percentage = (processed_requests / total_requests) * 100;
		
		$("#es_progress").val(complete_percentage);
		if (complete_percentage == 100) {
			$("#es_progress").addClass("complete").attr("title", localized_strings.ready.ready);
		}
	});
	
	jqxhr.done(callback);
	
	jqxhr.fail(function(jqxhr, textStatus, errorThrown) {
		$("#es_progress").val(100).addClass("error").attr({"title": "", "max": 1});

		if (!$(".es_progress_error").length) {
			$("#es_progress").after('<div class="es_progress_error">' + localized_strings.ready.failed + ':' + '<ul></ul></div>');
		}
		
		if (!settings.errorMessage) {
			settings.errorMessage = "<span>" + this.url + "</span>";
			if (jqxhr.status) settings.errorMessage +=  " (" + jqxhr.status + ": " + errorThrown + ")";
		}

		$(".es_progress_error ul").append('<li>' + settings.errorMessage + '</li>');
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
			var all = parseInt($("#review_type_all").next().find(".user_reviews_count").text().replace(/\(|\)|\,/g, "")),
				pos = parseInt($("#review_type_positive").next().find(".user_reviews_count").text().replace(/\(|\)|\,/g, "")),
				stm = parseInt($("#purchase_type_steam").next().find(".user_reviews_count").text().replace(/\(|\)|\,/g, ""));
			var apiurl = "//api.enhancedsteam.com/storepagedata/?appid=" + appid;
			if (all && pos && stm) apiurl += "&r_all=" + all + "&r_pos=" + pos + "&r_stm=" + stm;
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

var storePageDataCN = (function() {
	var deferred = new $.Deferred();
	var data;

	function load(appid) {
		data = cache_get(appid);
		if (data) {
			deferred.resolveWith(data);
		} else {
			var apiurl = "//api.enhancedsteam.com/storepagedatacn/?appid=" + appid;
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
		localStorage.setItem("storePageDataCN_" + appid, JSON.stringify(cached));
	}

	function cache_get(appid) {
		var cached = $.parseJSON(localStorage.getItem("storePageDataCN_" + appid));
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
		} else if (steamid) {
			var apiurl = "//api.enhancedsteam.com/profiledata/?steam64=" + steamid;
			get_http(apiurl, function(txt) {
				data = JSON.parse(txt);
				cache_set(steamid, data);
				deferred.resolveWith(data);
			}).fail(deferred.reject);
		} else {
			deferred.reject;
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

var highlight_defaults = {
	"owned": "#5c7836",
	"wishlist": "#1c3788",
	"coupon": "#a26426",
	"inv_gift": "#800040",
	"inv_guestpass": "#008080",
	"notinterested": "#4f4f4f"
}

// Color the tile for owned games
function highlight_owned(node) {
	storage.get(function(settings) {
		node.classList.add("es_highlight_checked");

		if (settings.highlight_owned_color === undefined) { settings.highlight_owned_color = highlight_defaults.owned; storage.set({'highlight_owned_color': settings.highlight_owned_color}); }
		if (settings.highlight_owned === undefined) { settings.highlight_owned = true; storage.set({'highlight_owned': settings.highlight_owned}); }
		if (settings.hide_owned === undefined) { settings.hide_owned = false; storage.set({'hide_owned': settings.hide_owned}); }

		if (settings.highlight_owned) { $(node).addClass("es_highlighted es_highlighted_owned"); highlight_node(node, settings.highlight_owned_color); }
		if (settings.hide_owned) hide_node(node);

		if (settings.tag_owned === undefined) { settings.tag_owned = false; storage.set({'tag_owned': settings.tag_owned}); }
		if (settings.tag_owned_color === undefined) { settings.tag_owned_color = highlight_defaults.owned;	storage.set({'tag_owned_color': settings.tag_owned_color}); }
		if (settings.tag_owned) add_tag(node, "owned");
	});
}

// Color the tile for wishlist games
function highlight_wishlist(node) {
	storage.get(function(settings) {
		node.classList.add("es_highlight_checked");

		if (settings.highlight_wishlist_color === undefined) { settings.highlight_wishlist_color = highlight_defaults.wishlist; storage.set({'highlight_wishlist_color': settings.highlight_wishlist_color}); }
		if (settings.highlight_wishlist === undefined) { settings.highlight_wishlist = true; storage.set({'highlight_wishlist': settings.highlight_wishlist}); }
		if (settings.hide_wishlist === undefined) { settings.hide_wishlist = false; storage.set({'hide_wishlist': settings.hide_wishlist}); }

		if (settings.highlight_wishlist) { $(node).addClass("es_highlighted es_highlighted_wishlist"); highlight_node(node, settings.highlight_wishlist_color); }
		if (settings.hide_wishlist) hide_node(node);

		if (settings.tag_wishlist_color === undefined) { settings.tag_wishlist_color = highlight_defaults.wishlist;	storage.set({'tag_wishlist_color': settings.tag_wishlist_color}); }
		if (settings.tag_wishlist === undefined) { settings.tag_wishlist = false; storage.set({'tag_wishlist': settings.tag_wishlist}); }
		if (settings.tag_wishlist) add_tag(node, "wishlist");
	});
}

function highlight_cart(node) {
	storage.get(function(settings) {
		if (settings.hide_cart === undefined) { settings.hide_cart = false; storage.set({'hide_cart': settings.hide_cart}); }
		if (settings.hide_cart) {
			node.classList.add("es_highlight_checked es_highlighted es_highlighted_hidden");
			hide_node(node);
		}
	});
}

// Color the tile for items with coupons
function highlight_coupon(node, discount) {
	storage.get(function(settings) {
		node.classList.add("es_highlight_checked");

		if (settings.highlight_coupon_color === undefined) { settings.highlight_coupon_color = highlight_defaults.coupon; storage.set({'highlight_coupon_color': settings.highlight_coupon_color}); }
		if (settings.highlight_coupon === undefined) { settings.highlight_coupon = false; storage.set({'highlight_coupon': settings.highlight_coupon}); }
		if (settings.highlight_coupon) { $(node).addClass("es_highlighted es_highlighted_coupon"); highlight_node(node, settings.highlight_coupon_color); }

		if (settings.tag_coupon_color === undefined) { settings.tag_coupon_color = highlight_defaults.coupon; storage.set({'tag_coupon_color': settings.tag_coupon_color}); }
		if (settings.tag_coupon === undefined) { settings.tag_coupon = false; storage.set({'tag_coupon': settings.tag_coupon}); }
		if (settings.tag_coupon) add_tag(node, "coupon");
	});
}

// Color the tile for items in inventory
function highlight_inv_gift(node) {
	storage.get(function(settings) {
		node.classList.add("es_highlight_checked");

		if (settings.highlight_inv_gift_color === undefined) { settings.highlight_inv_gift_color = highlight_defaults.inv_gift; storage.set({'highlight_inv_gift_color': settings.highlight_inv_gift_color}); }
		if (settings.highlight_inv_gift === undefined) { settings.highlight_inv_gift = false; storage.set({'highlight_inv_gift': settings.highlight_inv_gift}); }
		if (settings.highlight_inv_gift) { $(node).addClass("es_highlighted es_highlighted_inv_gift"); highlight_node(node, settings.highlight_inv_gift_color); }

		if (settings.tag_inv_gift_color === undefined) { settings.tag_inv_gift_color = highlight_defaults.inv_gift; storage.set({'tag_inv_gift_color': settings.tag_inv_gift_color}); }
		if (settings.tag_inv_gift === undefined) { settings.tag_inv_gift = false; storage.set({'tag_inv_gift': settings.tag_inv_gift}); }
		if (settings.tag_inv_gift) add_tag(node, "inv_gift");
	});
}

// Color the tile for items in inventory
function highlight_inv_guestpass(node) {
	storage.get(function(settings) {
		node.classList.add("es_highlight_checked");

		if (settings.highlight_inv_guestpass_color === undefined) { settings.highlight_inv_guestpass_color = highlight_defaults.inv_guestpass; storage.set({'highlight_inv_guestpass_color': settings.highlight_inv_guestpass_color}); }
		if (settings.highlight_inv_guestpass === undefined) { settings.highlight_inv_guestpass = false; storage.set({'highlight_inv_guestpass': settings.highlight_inv_guestpass}); }
		if (settings.highlight_inv_guestpass) { $(node).addClass("es_highlighted es_highlighted_inv_guestpass"); highlight_node(node, settings.highlight_inv_guestpass_color); }

		if (settings.tag_inv_guestpass_color === undefined) { settings.tag_inv_guestpass_color = highlight_defaults.inv_guestpass; storage.set({'tag_inv_guestpass_color': settings.tag_inv_guestpass_color}); }
		if (settings.tag_inv_guestpass === undefined) { settings.tag_inv_guestpass = false; storage.set({'tag_inv_guestpass': settings.tag_inv_guestpass}); }
		if (settings.tag_inv_guestpass) add_tag(node, "inv_guestpass");
	});
}

function highlight_nondiscounts(node) {
	storage.get(function(settings) {
		if (settings.hide_notdiscounted === undefined) { settings.hide_notdiscounted = false; storage.set({'hide_notdiscounted': settings.hide_notdiscounted}); }
		if (settings.hide_notdiscounted) {
			$(node).hide();
		}
	});
}

function highlight_notinterested(node) {
	$.when.apply($, [dynamicstore_promise]).done(function(data) {
		storage.get(function(settings) {
			var appid = parseInt(get_appid(node.href || $(node).find("a").attr("href")) || get_appid_wishlist(node.id));
			if (appid && $.inArray(appid, data.rgIgnoredApps) != -1) {
				if ($(node).hasClass("home_area_spotlight")) {
					node = $(node).find(".spotlight_content")[0];
				}

				node.classList.add("es_highlight_checked");

				// Highlight games marked not interested
				if (settings.highlight_notinterested_color === undefined) { settings.highlight_notinterested_color = highlight_defaults.notinterested; storage.set({'highlight_notinterested_color': settings.highlight_notinterested_color}); }
				if (settings.highlight_notinterested === undefined) { settings.highlight_notinterested = false; storage.set({'highlight_notinterested': settings.highlight_notinterested}); }
				if (settings.highlight_notinterested) {
					$(node).addClass("es_highlighted es_highlighted_notinterested");
					highlight_node(node, settings.highlight_notinterested_color);
				}

				// Tag games marked not interested
				if (settings.tag_notinterested_color === undefined) { settings.tag_notinterested_color = highlight_defaults.notinterested; storage.set({'tag_notinterested_color': settings.tag_notinterested_color}); }
				if (settings.tag_notinterested === undefined) { settings.tag_notinterested = true; storage.set({'tag_notinterested': settings.tag_notinterested}); }
				if (settings.tag_notinterested) add_tag(node, "notinterested");
			
				// Hide not interested search results
				if (settings.hide_notinterested === undefined) { settings.hide_notinterested = false; storage.set({'hide_notinterested': settings.hide_notinterested}); }
				if ($(node).hasClass("search_result_row") && settings.hide_notinterested === true) {
					$(node).hide();
				}
			}
		});
	});
}

function apply_rate_filter (node) {
	storage.get(function (settings) {
		if (settings.hide_mixed && $(node).find('.search_reviewscore').children('span.search_review_summary.mixed').length > 0) { $(node).hide(); }
		if (settings.hide_negative && $(node).find('.search_reviewscore').children('span.search_review_summary.negative').length > 0) { $(node).hide(); }
		if ($(document).height() <= $(window).height()) {
			load_search_results()
		}
	})
}

function apply_price_filter (node) {
	storage.get(function (settings) {
		if (settings.hide_priceabove
		&& settings.priceabove_value !== '' 
		&& !(Number.isNaN(settings.priceabove_value))) { 
			var html = $(node).find("div.col.search_price.responsive_secondrow").html()
			var intern = html.replace(/<([^ >]+)[^>]*>.*?<\/\1>/, "").replace(/<\/?.+>/, "");
			var parsed = parse_currency(intern.trim());
			if (parsed && parsed.value > settings.priceabove_value) {
				$(node).hide()
			}
		}
		if ($(document).height() <= $(window).height()) {
			load_search_results()
		}
	})
}

function validate_price (priceText, event) {
	if(event.key === 'Enter' ) return true;
	priceText += event.key;
	var price = Number(priceText);
	return !(Number.isNaN(price));
}

function hexToRgb(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

var highlight_css_loaded = false;

function highlight_node(node, color) {
	var $node = $(node);

	storage.get(function(settings) {
		if (settings.highlight_excludef2p === undefined) { settings.highlight_excludef2p = false; storage.set({'highlight_excludef2p': settings.highlight_excludef2p}); }
		if (settings.highlight_excludef2p) {
			if ($(node).html().match(/<div class="(tab_price|large_cap_price|col search_price|main_cap_price|price)">\n?(.+)?(Free to Play|Play for Free!)(.+)?<\/div>/i)) {
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

		if (!highlight_css_loaded) {
			highlight_css_loaded = true;

			var hlCss = "",
				hlNames = ["notinterested", "owned", "wishlist", "inv_guestpass", "coupon", "inv_gift"];
			
			$(hlNames).each(function (i, name) {
				hlCss += '.es_highlighted_' + name + ' { background: ' + settings["highlight_" + name + "_color"] + ' linear-gradient(135deg, rgba(0, 0, 0, 0.70) 10%, rgba(0, 0, 0, 0) 100%) !important; }\n';
			});

			$("head").append('<style id="es_highlight_styles" type="text/css">' + hlCss + '</style>');
		}

		// Carousel item
		if (node.classList.contains("cluster_capsule")) {
			$node = $(node).find(".main_cap_content").parent();
		}

		// Genre Carousel items
		if (node.classList.contains("large_cap")) {
			$node = $(node).find(".large_cap_content");
		}

		// App and community hub page headers // won't work
		/*if (node.classList.contains("apphub_HeaderTop") || node.classList.contains("apphub_HeaderStandardTop")) {
			$node = $(node).find(".apphub_AppName");
			$node.css("color", color);
			return;
		}*/

		$(node).removeClass("ds_flagged").find(".ds_flag").remove();
		$(node).find(".ds_flagged").removeClass("ds_flagged");
	});
}

function hide_node(node) {
	storage.get(function(settings) {
		if (settings.hide_owned === undefined) { settings.hide_owned = false; storage.set({'hide_owned': settings.hide_owned}); }
		if (settings.hide_dlcunownedgames === undefined) { settings.hide_dlcunownedgames = false; storage.set({'hide_dlcunownedgames': settings.hide_dlcunownedgames}); }

		if ($(node).hasClass("info") || $(node).hasClass("dailydeal") || $(node).hasClass("spotlight_content") || $(node).hasClass("browse_tag_game_cap")) { node = $(node).parent()[0]; }

		if (settings.hide_owned) {
			if (node.classList.contains("search_result_row") || node.classList.contains("item") || node.classList.contains("cluster_capsule") || node.classList.contains("browse_tag_game")) {
				$(node).hide();
				if ($(document).height() <= $(window).height()) {
					load_search_results();
				}
			}
		}
		
		// Hide DLC for unowned items
		if (settings.hide_dlcunownedgames) {
			if (node.classList.contains("search_result_row") || node.classList.contains("game_area_dlc_row") || node.classList.contains("item") || node.classList.contains("cluster_capsule")) {
				$(node).hide();
			}
		}
	});
}

var tag_css_loaded = false;

function add_tag(node, tag) {
	storage.get(function(settings) {
		if (settings.tag_short === undefined) { settings.tag_short = true; storage.set({'tag_short': settings.tag_short}); }

		// Load the colors CSS for tags
		if (!tag_css_loaded) {
			tag_css_loaded = true;
			
			var tagCss = "";
			tagNames = ["notinterested", "owned", "wishlist", "inv_guestpass", "coupon", "inv_gift"];
		
			$(tagNames).each(function (i, name) {
				tagCss += '.es_tag_' + name + ' { background-color: ' + settings["tag_" + name + "_color"] + ' }\n';
			});

			$("head").append('<style id="es_tag_styles" type="text/css">' + tagCss + '</style>');
		}

		var $tags = $(node).find(".es_tags");

		// Add the tags container if needed
		if (!$tags.length) {
			$tags = $('<div class="es_tags' + (settings.tag_short ? ' es_tags_short' : '') + '" />');

			var $tag_root;
			if (node.classList.contains("tab_row")) { // can't find it
				$tag_root = $(node).find(".tab_desc").removeClass("with_discount");

				$(node).find(".tab_discount").css("top","15px");
				
				$tag_root.find("h4").after($tags);
			}
			else if (node.classList.contains("home_smallcap")) { // done
				$(node).find(".home_smallcap_title").prepend($tags);
			}
			else if (node.classList.contains("curated_app_item")) { // done
				$(node).find(".home_headerv5_title").prepend($tags);
			}
			else if (node.classList.contains("tab_item")) { // done
				$(node).find(".tab_item_name").after($tags);
			}
			else if (node.classList.contains("search_result_row")) { // done
				$(node).find("p").prepend($tags);
			}
			else if (node.classList.contains("dailydeal")) { // can't find it
				$tag_root = $(node).parent();

				$tag_root.find(".game_purchase_action").before($tags);
				$tag_root.find(".game_purchase_action").before($('<div style="clear: right;"></div>'));
			}
			else if (node.classList.contains("small_cap")) { // done
				$(node).find("h4").prepend($tags);
			}
			else if (node.classList.contains("browse_tag_game")) { // can't find it
				$tag_root = $(node);

				$tags.css("display", "table");
				$tags.css("margin-left", "8px");
				$tag_root.find(".browse_tag_game_price").after($tags);
			}
			else if (node.classList.contains("game_area_dlc_row")) { // done
				$(node).find(".game_area_dlc_price").prepend($tags);
			}
			else if (node.classList.contains("wishlistRow")) { // done
				$(node).find(".wishlist_added_on").after($tags);
			}
			else if (node.classList.contains("match")) { // done
				$(node).find(".match_price").after($tags);
			}
			else if (node.classList.contains("cluster_capsule")) { // done
				$(node).find(".main_cap_platform_area").append($tags);
			}
			else if (node.classList.contains("recommendation_highlight")) { // can't find it
				$tag_root = $(node);
				
				if ($(".game_purchase_action").length > 0) {
					$tags.css("float", "left");
					$tag_root.find(".game_purchase_action").before($tags);
					$tag_root.find(".game_purchase_action").before($("<div style=\"clear: right;\"></div>"));
				} else {
					$tags.css("float", "right");
					$tag_root.find(".price").parent().before($tags);
				}	
			}
			else if (node.classList.contains("similar_grid_item")) { // can't find it
				$tag_root = $(node);

				$tags.css("float", "right");
				$tag_root.find(".similar_grid_price").find(".price").append($tags);
			}
			else if (node.classList.contains("recommendation_carousel_item")) { // can't find it
				$tag_root = $(node);

				$tags.css("float", "left");

				$tag_root.find(".buttons").before($tags);
			}
			else if (node.classList.contains("friendplaytime_game")) { // can't find it
				$tag_root = $(node);

				$tags.css("float", "left");

				$tag_root.find(".friendplaytime_buttons").before($tags);
			}
			/*else if (node.classList.contains("inline_tags")) { // can't find it
				$tag_root = $(node);

				$tags.css("display", "inline-block");
				$tags.css("margin-left", "3px");

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
			else if (node.classList.contains("apphub_HeaderStandardTop")) { // won't work
				$tag_root = $(node);
				// Height to accomodate tags
				$tag_root.css("height", "auto");

				$tags.css({
					"float": "left",
					"margin-top": "4px",
					"margin-left": "3px"
				});

				$tag_root.find(".apphub_AppName").after($tags);
				$tag_root.find(".apphub_AppName").after($('<div style="clear: right;"></div>'));
			}
			else if (node.classList.contains("apphub_HeaderTop")) { // won't work
				$tag_root = $(node);

				$tag_root.find(".apphub_AppName").css("width", "0px")

				$tags.css({
					"float": "left",
					"margin-top": "4px",
					"margin-left": "3px"
				});

				$tag_root.find(".apphub_OtherSiteInfo").append($tags);
				$tag_root.find(".apphub_AppName").after($("<div style=\"clear: right;\"></div>"));

				var max_width = 948-($(".apphub_OtherSiteInfo").width() + 69);

				$tag_root.find(".apphub_AppName").css("max-width", max_width+"px").attr("title", $tag_root.find(".apphub_AppName").text());
				$tag_root.find(".apphub_AppName").css("width", "auto")
				$tag_root.find(".apphub_AppName").css("overflow", "hidden");
			}*/
		} 

		// Add the tag
		if (!$tags.find(".es_tag_" + tag).length) {
			$tags.append('<span class="es_tag_' + tag + '">' + localized_strings.tag[tag] + '</span>');
		}
	});
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
	if (is_signed_in && window.location.href.startsWith(profile_url)) {
		storage.get(function(settings) {
			if (settings.showemptywishlist === undefined) { 
				settings.showemptywishlist = true; 
				storage.set({'showemptywishlist': settings.showemptywishlist}); 
			}

			if (settings.showemptywishlist) {
				var empty_buttons = $("<div class='btn_save' id='es_empty_wishlist'>" + localized_strings.empty_wishlist + "</div>");
				$(".save_actions_enabled").filter(":last").after(empty_buttons);
				$("#es_empty_wishlist").click(empty_wishlist);
			}
		});
	}
}

function add_wishlist_filter() {
	var html  = "<span>" + localized_strings.show + " </span>";
		html += '<div class="store_nav"><div class="tab flyout_tab" id="es_filter_tab" data-flyout="es_filter_flyout" data-flyout-align="right" data-flyout-valign="bottom"><span class="pulldown"><div id="es_filter_active" style="display: inline;">' + localized_strings.games_all + '</div><span></span></span></div></div>';
		html += '<div class="popup_block_new flyout_tab_flyout responsive_slidedown" id="es_filter_flyout" style="visibility: visible; top: 42px; left: 305px; display: none; opacity: 1;"><div class="popup_body popup_menu">'
		html += '<a class="popup_menu_item es_wl_filter" data-filter-by="all">' + localized_strings.games_all + '</a>';
		html += '<a class="popup_menu_item es_wl_filter" data-filter-by="sale">' + localized_strings.games_discount + '</a>';
		html += '<a class="popup_menu_item es_wl_filter" data-filter-by="coupon">' + localized_strings.games_coupon + '</a>';		
		html += "</div></div>";

	$("#wishlist_sort_options").append("<div class='es_wishlist_filter'>" + html + "</div>");

	$(document).on("click", "a.es_wl_filter", function(e) {
		e.preventDefault();
		var filter_type = $(this).data("filter-by");

		if (filter_type === "sale") {
			$(".wishlistRow").hide();
			$(".discount_block_inline").closest(".wishlistRow").show();
		}
		else if (filter_type === "coupon") {
			$(".wishlistRow").hide();
			$(".es_highlight_coupon").show();
		}
		else {
			$(".wishlistRow").show();
		}
		$("#es_filter_active").text($(this).text());
		$("#es_filter_flyout").fadeOut();
	});
}

function add_wishlist_discount_sort() {
	var sorts = ["rank", "added", "name", "price", "discount", "discountabs"],
		sorted = getCookie("wishlist_sort2") || "rank",
		linksHtml = "";

	// Build dropdown links HTML
	$("#wishlist_sort_options").children("a, span").hide().each(function(i, link){
		linksHtml += '<a class="es_wl_sort popup_menu_item by_' + sorts[i] + '" data-sort-by="' + sorts[i] + '" href="?sort=' + sorts[i] + '">' + $(this).text().trim() + '</a>';
	});
	linksHtml += '<a class="es_wl_sort popup_menu_item by_discount" data-sort-by="discount" href="?sort=discount">' + localized_strings.discountper + '</a>';
	linksHtml += '<a class="es_wl_sort popup_menu_item by_discountabs" data-sort-by="discountabs" href="?sort=discountabs">' + localized_strings.discountabs + '</a>';

	// Cleanup spaces 
	$("#wishlist_sort_options").contents().each(function(i, node){
		if (i === 0) $(node).wrap("<span />");
		node.nodeValue = $(node).text().trim();
	});

	// Insert dropdown options links
	$("#wishlist_sort_options").append(`
		<div id="es_sort_flyout" class="popup_block_new flyout_tab_flyout responsive_slidedown" style="visibility: visible; top: 42px; left: 305px; display: none; opacity: 1;">
			<div class="popup_body popup_menu">` + linksHtml + `</div>
		</div>
	`);

	// Insert dropdown button
	$("#wishlist_sort_options").find("span").first().after(`
		<div class="store_nav">
			<div class="tab flyout_tab" id="es_sort_tab" data-flyout="es_sort_flyout" data-flyout-align="right" data-flyout-valign="bottom">
				<span class="pulldown">
					<div id="es_sort_active" style="display: inline;">` + $("#es_sort_flyout").find("a.by_" + sorted).text() + `</div>
					<span></span>
				</span>
			</div>
		</div>
	`);
	
	runInPageContext(function() { BindAutoFlyoutEvents(); });

	// Initiate "discounted" sorts if necessary
	if (sorted == "discount") {
		sort_wishlist(".discount_pct", sorted, true, function(val){
			return parseInt(val);
		});
	} else if (sorted == "discountabs") {
		add_wishlist_discountabs();
		sort_wishlist(".es_discountabs_raw", sorted, true, function(val){
			return parseFloat(val);
		});
	} else {
		$("a.by_" + sorted).addClass("active");
	}

	// Bind sort actions to links
	$(document).on("click", "a.es_wl_sort:not(.by_added)", function(e){
		e.preventDefault();

		// Don't sort again if sort is active
		if (!$(this).hasClass("active")) {
			var sort_by = $(this).data("sort-by");
			switch (sort_by) {
				case "rank":
					sort_wishlist(".wishlist_rank, .wishlist_rank_ro", sort_by, true);
					break;
				case "added":
					// Can't do this one... could make a request for it tho...
					break;
				case "name":
					sort_wishlist("h4.ellipsis", sort_by, null, function(val){
						return val.toLowerCase();
					});
					break;
				case "price":
					sort_wishlist(".price, .discount_final_price", sort_by, true, function(val){
						return Number(val.replace(/\-/g, "0").replace(/[^0-9\.]+/g, "")) || 31337;
					});
					break;
				case "discount":
					sort_wishlist(".discount_pct", sort_by, true, function(val){
						return parseInt(val);
					});
					break;
				case "discountabs":
					add_wishlist_discountabs();
					sort_wishlist(".es_discountabs_raw", sort_by, true, function(val){
						return parseFloat(val);
					});
					break;
			}

			// Change text of dropdown button to reflect current selection
			$("#es_sort_active").text($(this).text());
		}

		$("#es_sort_flyout").fadeOut();
	});

	function sort_wishlist(sel, cookieVal, asc, fn) {
		asc = asc === undefined ? false : asc;
		fn = fn || function(val){ return val };

		var T = asc === true ? 1 : -1,
			F = asc === true ? -1 : 1;

		var $rows = $(sel).closest(".wishlistRow");

		$rows.sort(function(a, b){
			a = fn($(a).find(sel).val() || $(a).find(sel).text().trim());
			b = fn($(b).find(sel).val() || $(b).find(sel).text().trim());

			if (a == b) return 0;
			if (asc === true) {
				return a - b;
			} else if (asc === false) {
				return b - a;
			} else {
				return a < b ? T : F;
			}
		});

		$rows.detach().prependTo($("#wishlist_items"));
		
		if (cookieVal) {
			var dateExpires = new Date();
			dateExpires.setTime( dateExpires.getTime() + 1000 * 60 * 60 * 1 );
			document.cookie = 'wishlist_sort2=' + cookieVal + '; expires=' + dateExpires.toGMTString() + ';path=/';

			$("a.es_wl_sort").removeClass("active");
			$("a.by_" + cookieVal).addClass("active");
		}
	}
}

// Calculate absolute discount value of each discounted item on wishlist
function add_wishlist_discountabs() {
	var price_cache = {};

	$(".discount_pct").not(".es_has_discountabs").each(function(){
		var $this = $(this).addClass("es_has_discountabs"),
			absolute_discount = absolute_discount_for_wishlist_row($this.closest(".wishlistRow"), price_cache);

		$this.append("<div class='es_discountabs'>(" + formatCurrency(absolute_discount) + ")</div><input class='es_discountabs_raw' type='hidden' value='" + absolute_discount + "' />");
	});
}

function absolute_discount_for_wishlist_row($this, price_cache) {
	var finalPrice = memoized_parse_currency($this.find(".discount_final_price").text(), price_cache),
		originalPrice = memoized_parse_currency($this.find(".discount_original_price").text(), price_cache);

	return finalPrice.value - originalPrice.value;
}

function memoized_parse_currency(str, cache) {
	if (!cache[str]) {
		cache[str] = { value: parse_currency(str) };
	}

	return cache[str].value;
}

// Calculate total cost of all items on wishlist
function add_wishlist_total(showTotal) {
	if ($('.wishlistRow').length < 100 || showTotal) {
		var total = 0,
			items = 0,
			gamelist = "",
			apps = "";

		function calculate_node($node, search) {
			var parsed = parse_currency($node.find(search).text().trim());

			if (parsed) {
				gamelist += $node.find("h4").text().trim() + ", ";
				total += parsed.value;
				apps += get_appid($node.find(".btnv6_blue_hoverfade").attr("href")) + ",";
				items ++;
			}
		}

		$('.wishlistRow').each(function(){
			var $this = $(this);

			if ($this.find("div[class='price']").length != 0 && $this.find("div[class='price']").text().trim() != "")
				calculate_node($this, "div[class='price']");

			if ($this.find("div[class='discount_final_price']").length != 0)
				calculate_node($this, "div[class='discount_final_price']");
		});
		gamelist = gamelist.replace(/, $/, "");

		total = formatCurrency(parseFloat(total));

		$(".games_list").after(`
			<div class='es_wishlist_total'>
				<div class='game_area_purchase_game'>
					<h1>` + localized_strings.wishlist + `</h1>
					<p class='package_contents'><b>` + localized_strings.bundle.includes.replace("__num__", items) + `:</b> ` + gamelist + `</p>
					<div class='game_purchase_action'>
						<div class='game_purchase_action_bg'>
							<div class='game_purchase_price price'>` + total + `</div>
						</div>
					</div>
				</div>
			</div>
		`);
	} else {
		$(".games_list").after("<div class='es_show_wishlist_total btn_darkblue_white_innerfade'><span>" + localized_strings.show_wishlist_total + "<span></div>");
		$(document).on("click", ".es_show_wishlist_total", function(){
			$(this).remove();
			add_wishlist_total(true);
		});
	}
}

function add_wishlist_ajaxremove() {
	// Remove "onclick"
	runInPageContext(function(){ $J("a[onclick*=wishlist_remove]").removeAttr("onclick").addClass("es_wishlist_remove"); });

	$.when.apply($, [get_store_session]).done(function(store_sessionid) {
		$(".es_wishlist_remove").on("click", function(e) {
			e.preventDefault();

			var appid = $(this).parent().parent().parent()[0].id.replace("game_", "");
			$.ajax({
				type: "POST",
				url: "//store.steampowered.com/api/removefromwishlist",
				data: {
					sessionid: store_sessionid,
					action: "remove",
					appid: appid
				},
				success: function( msg ) {
					var currentRank = parseFloat($("#game_" + appid + " .wishlist_rank")[0].value);
					if ($("#es_price_" + appid).length > 0) { $("#es_price_" + appid).remove(); }
					$("#game_" + appid).fadeOut("fast", function(){ $(this).remove(); });
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
		if (settings.stores === undefined || settings.stores instanceof Array) {
			settings.stores = {
				"steam": true,
				"amazonus": true,
				"impulse": true,
				"gamersgate": true,
				"greenmangaming": true,
				"direct2drive": true,
				"origin": true,
				"uplay": true,
				"indiegalastore": true,
				"gamesplanet": true,
				"indiegamestand": true,
				"gog": true,
				"dotemu": true,
				"nuuvem": true,
				"dlgamer": true,
				"humblestore": true,
				"squenix": true,
				"bundlestars": true,
				"fireflower": true,
				"humblewidgets": true,
				"newegg": true,
				"gamesrepublic": true,
				"coinplay": true,
				"funstock": true,
				"wingamestore": true,
				"gamebillet": true,
				"silagames": true,
				"playfield": true,
				"imperialgames": true
			};
			storage.set({'stores': settings.stores});
		}

		if (settings.showlowestprice_onwishlist) {
			// Get List of stores we're searching for
			var storestring = "";
			$.each(settings.stores, function(store, value) {
				if (settings.stores[store] === true || settings.showallstores) {
					storestring += store + ",";
				}
			});

			if (storestring !== "") {
				// Get country code from Steam cookie
				var cc = getStoreRegionCountryCode();

				function get_price_data(lookup_type, node, id) {
					html = "<div class='es_lowest_price' id='es_price_" + id + "'><div class='gift_icon' id='es_line_chart_" + id + "'><img src='" + chrome.extension.getURL("img/line_chart.png") + "'></div><span id='es_price_loading_" + id + "'>" + localized_strings.loading + "</span>";
					$(node).append(html);

					get_http("//api.enhancedsteam.com/pricev2/?search=" + lookup_type + "/" + id + "&stores=" + storestring + "&cc=" + cc + "&coupon=" + settings.showlowestpricecoupon, function (txt) {
						var data = JSON.parse(txt);
						if (data) {
							var activates = "", line1 = "", line2 = "", line3 = "", html, recorded, lowest, lowesth;
							var currency_type = data[".meta"]["currency"];

							// "Lowest Price"
							if (data["price"]) {
								if (data["price"]["drm"] == "steam") {
									activates = "(<b>" + localized_strings.activates + "</b>)";
									if (data["price"]["store"] == "Steam") {
										activates = "";
									}
								}

								if (settings.override_price != "auto") {
									currencyConversion.load().done(function() {
										lowest = currencyConversion.convert(data["price"]["price"], data[".meta"]["currency"], settings.override_price);
										currency_type = settings.override_price;
									});
								} else {
									lowest = data["price"]["price"].toString();
								}

								line1 = localized_strings.lowest_price + ': ' + localized_strings.lowest_price_format.replace("__price__", formatCurrency(lowest, currency_type)).replace("__store__", '<a href="' + escapeHTML(data["price"]["url"].toString()) + '" target="_blank">' + escapeHTML(data["price"]["store"].toString()) + '</a>') + ' ' + activates + ' (<a href="' + escapeHTML(data["urls"]["info"].toString()) + '" target="_blank">' + localized_strings.info + '</a>)';
								if (settings.showlowestpricecoupon) {
									if (data["price"]["price_voucher"]) {
										line1 = localized_strings.lowest_price + ': ' + localized_strings.lowest_price_format.replace("__price__", formatCurrency(lowest, currency_type)).replace("__store__", '<a href="' + escapeHTML(data["price"]["url"].toString()) + '" target="_blank">' + escapeHTML(data["price"]["store"].toString()) + '</a>') + ' ' + localized_strings.after_coupon + ' <b>' + escapeHTML(data["price"]["voucher"].toString()) + '</b> ' + activates + ' (<a href="' + escapeHTML(data["urls"]["info"].toString()) + '" target="_blank">' + localized_strings.info + '</a>)';
									}
								}
							}

							// "Historical Low"
							if (data["lowest"]) {
								if (settings.override_price != "auto") {
									currencyConversion.load().done(function() {
										lowesth = currencyConversion.convert(data["lowest"]["price"], data[".meta"]["currency"], settings.override_price);
										currency_type = settings.override_price;
									});
								} else {
									lowesth = data["lowest"]["price"].toString();
								}
								recorded = new Date(data["lowest"]["recorded"]*1000);
								line2 = localized_strings.historical_low + ': ' + localized_strings.historical_low_format.replace("__price__", formatCurrency(lowesth, currency_type)).replace("__store__", escapeHTML(data["lowest"]["store"].toString())).replace("__date__", recorded.toLocaleDateString()) + ' (<a href="' + escapeHTML(data["urls"]["history"].toString()) + '" target="_blank">' + localized_strings.info + '</a>)';
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
		}
	});
}

function add_wishlist_notes() {
	if (is_signed_in && window.location.href.startsWith(profile_url)) {
		var noteTemplate = "<div class='es_wishlist_note'><span>__note__</span></div>";
		var noteModalTemplate = `<form id="es_note_modal" data-appid="__appid__">
				<div id="es_note_modal_content">
					<div class="newmodal_prompt_with_textarea gray_bevel fullwidth">
						<textarea name="es_note_input" id="es_note_input" rows="6" cols="12" maxlength="512">__note__</textarea>
					</div>
					<div class="es_note_buttons" style="float: right">
						<button type="submit" class="btn_green_white_innerfade btn_medium">
							<span>` + localized_strings.save + `</span>
						</button>
						<div class="es_note_modal_close btn_grey_white_innerfade btn_medium">
							<span>` + localized_strings.cancel + `</span>
						</div>
					</div>
				</div>
			</form>`;

		// Get notes and insert them into the page
		chrome.storage.local.get("wishlist_notes", function(data) {
			if (data.wishlist_notes) {
				$.each(data.wishlist_notes, function(appid, note) {
					var bottomCtrls = $("#game_" + appid).find(".bottom_controls");
					$(bottomCtrls).after( noteTemplate.replace("__note__", note) );
					$(bottomCtrls).find(".pullup_item").addClass("es_has_note_button");
					$(bottomCtrls).find(".popup_block2 .popup_body2").append("<a class='es_add_wishlist_note popup_menu_item2 tight' id='es_add_wishlist_note_" + appid + "'><h5>" + localized_strings.update_wishlist_note + "</h5></a>");
				});
			} else {
				// Wishlist note storage method needs updating
				storage.get(function(settings) {		
					var notes = {};

					$.map(settings, function(value, index) {
						if (index.match(/(\d+)wishlist_note/i)) {
							var appid = index.match(/(\d+)wishlist_note/i)[1];
							notes[appid] = escapeHTML(value);
							// TODO: Also delete these keys
						}
					});
					chrome.storage.local.set({"wishlist_notes": notes});

					console.info("Wishlist notes storage method was changed, reload the page to take effect!");
					return;
				});
			}
		});

		// Show note input modal
		$(document).on("click", ".es_add_wishlist_note", function(){
			var appid = $(this).attr("id").replace("es_add_wishlist_note_", ""),
				appRow = $(this).closest(".wishlistRowItem"),
				gameTitle = $(appRow).find("h4.ellipsis").text(),
				note =  $(appRow).find(".es_wishlist_note").text() || "";

			$(".popup_block2").hide();

			runInPageContext('function() { ShowDialog("' + localized_strings.note_for + ' ' + gameTitle + '", \`' + noteModalTemplate.replace("__appid__", appid).replace("__note__", note) + '\`); }');
		});

		// Insert the "add wishlist note" button only when necessary
		$(document).on("click", ".pullup_item:not(.es_has_note_button)", function(){
			var appRow = $(this).closest(".wishlistRow"),
				appid = $(appRow).attr("id").replace("game_", "");

			$(this).addClass("es_has_note_button");

			$(appRow).find(".bottom_controls .popup_block2 .popup_body2").append("<a class='es_add_wishlist_note popup_menu_item2 tight' id='es_add_wishlist_note_" + appid + "'><h5>" + localized_strings.add_wishlist_note + "</h5></a>");
		});

		// Process note changes
		$(document).on("submit", "#es_note_modal", function(e) {
			e.preventDefault();
			var appid = $(this).data("appid"),
				note = escapeHTML($("#es_note_input").val().trim().replace(/\s\s+/g, " ").substring(0, 512));

			chrome.storage.local.get("wishlist_notes", function(data) {
				var notes = data.wishlist_notes || {},
					appRow = $("#game_" + appid);

				if (note === "" && notes.hasOwnProperty(appid)) {
					delete notes[appid];
					$(appRow).find(".es_wishlist_note").remove();
					$("#es_add_wishlist_note_" + appid).find("h5").text( localized_strings.add_wishlist_note );
				} else if (note !== "") {
					notes[appid] = note;
					$(appRow).find(".es_wishlist_note").remove();
					$(appRow).find(".bottom_controls").after( noteTemplate.replace("__note__", note) );
					$("#es_add_wishlist_note_" + appid).find("h5").text( localized_strings.update_wishlist_note );
				}
				
				// Update wishlist notes cache
				chrome.storage.local.set({"wishlist_notes": notes});
			});

			runInPageContext( function(){ CModal.DismissActiveModal(); } );
		});

		// Bind the "Cancel" button to close the modal
		$(document).on("click", ".es_note_modal_close", function(){
			runInPageContext( function(){ CModal.DismissActiveModal(); } );
		});
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
				profile = $(".playerAvatar a")[0].href.replace(window.location.protocol + "//steamcommunity.com/", ""),
				session = decodeURIComponent(cookie.match(/sessionid=(.+?);/i)[1]);

			$.ajax({
				type:"POST",
				url: window.location.protocol + "//steamcommunity.com/" + profile + "/wishlist/",
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
	$(node).find(".btn_addtocart").last().parent().prepend(`
		<div class="es_each_box">
			<div class="es_each_price">` + price_text + `</div>
			<div class="es_each">` + localized_strings.each + `</div>
		</div>
	`);
}

function add_pack_breakdown() {
	$(".game_area_purchase_game_wrapper").each(function() {
		var title = $(this).find("h1").text().trim();
		title = title.toLowerCase().replace(/-/g, ' ');
		if (!title || !title.contains('pack')) return;
		if (title.contains('pack') && title.contains('season')) return;

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

			if ($("#ageYear").length) {
				var myYear = Math.floor(Math.random()*75)+10;
				var ageYear = "19" + myYear;
				$("#ageYear").val(ageYear);
				$(".btnv6_blue_hoverfade")[0].click();
			} else {
				if ($(".agegate_text_container.btns a:first").attr("href") == "#") {
					$(".agegate_text_container.btns a:first")[0].click();
				}
			}

			// Automatically confirm age gate verification
			if ($("#age_gate_btn_continue").length) {
				$("#age_gate_btn_continue").click();
			}
		}
	});
}

// Display Steam Wallet funds in header
function add_wallet_balance_to_header() {
	storage.get(function(settings) {
		if (settings.add_wallet_balance === undefined) { settings.add_wallet_balance = true; storage.set({'add_wallet_balance': settings.add_wallet_balance}); }
		if (settings.add_wallet_balance) {
			$("#global_action_menu").append("<div id='es_wallet' style='text-align:right; line-height: normal;'>");
			$("#es_wallet").load('//store.steampowered.com/about/ #header_wallet_ctn');
		}
	});
}

// Checks to see if the extension has been updated
function version_check() {
	storage.get(function(settings) {
		if (settings.version === undefined) { 
			// New installation detected
			settings.version = version; storage.set({'version': settings.version});
			return;
		}
		if (settings.version_show === undefined) { settings.version_show = true; storage.set({'version_show': settings.version_show}); }
		if ((version !== settings.version) && settings.version_show) {
			// User is loading a new version of Enhanced Steam for the first time
			$.get(chrome.extension.getURL('changelog_new.html'), function(data) {
				var dialog = "<div style=\"height:100%; display:flex; flex-direction:row;\"><div style=\"float: left; margin-right: 21px;\"><img src=\"" + chrome.extension.getURL("img/enhancedsteam.png") + "\"></div><div style=\"float: right;\">" + localized_strings.update.changes.replace(/'/g, "\\'") + ":<ul class=\"es_changelog\">" + data.replace(/\r?\n|\r/g, "").replace(/'/g, "\\'") + "</ul></div></div>";
				runInPageContext(
					"function() {\
						var prompt = ShowConfirmDialog(\"" + localized_strings.update.updated.replace("__version__", version) + "\", '" + dialog + "' , '" + localized_strings.donate.replace(/'/g, "\\'") + "', '" + localized_strings.close.replace(/'/g, "\\'") + "', '" + localized_strings.update.dont_show.replace(/'/g, "\\'") + "'); \
						prompt.done(function(result) {\
							if (result == 'OK') { window.location.assign('//www.enhancedsteam.com/donate/'); }\
							if (result == 'SECONDARY') { window.postMessage({ type: 'es_sendmessage_change', information: [ true ]}, '*'); }\
						});\
					}"
				);
			}, "html");
			storage.set({'version': version});
		}
	});

	window.addEventListener("message", function(event) {
		if (event.source !== window) return;
		if (event.data.type && (event.data.type === "es_sendmessage_change")) { 
			storage.set({'version_show': false});
		}
	}, false);
}

// Add a link to options to the global menu (where is Install Steam button)
function add_enhanced_steam_options() {
	$('#global_action_menu').prepend(`
		<div id="es_menu">
			<span id="es_pulldown" class="pulldown global_action_link" onclick="ShowMenu( this, 'es_popup', 'right', 'bottom', true );">Enhanced Steam</span>
			<div id="es_popup" class="popup_block_new">
				<div class="popup_body popup_menu">
					<a class="popup_menu_item" target="_blank" href="${ chrome.extension.getURL("options.html") }">${ localized_strings.thewordoptions }</a>
					<a class="popup_menu_item" id="es_clear_cache" href="#clear_cache">${ localized_strings.clear_cache }</a>
					<div class="hr"></div>
					<a class="popup_menu_item" target="_blank" href="//github.com/jshackles/Enhanced_Steam">${ localized_strings.contribute }</a>
					<a class="popup_menu_item" target="_blank" href="//translation.enhancedsteam.com">${ localized_strings.translate }</a>
					<a class="popup_menu_item" target="_blank" href="//github.com/jshackles/Enhanced_Steam/issues">${ localized_strings.bug_feature }</a>
					<div class="hr"></div>
					<a class="popup_menu_item" target="_blank" href="//www.enhancedsteam.com">${ localized_strings.website }</a>
					<a class="popup_menu_item" target="_blank" href="//${ localized_strings.official_group_url }">${ localized_strings.official_group }</a>
					<a class="popup_menu_item" target="_blank" href="//enhancedsteam.com/donate/">${ localized_strings.donate }</a>
				</div>
			</div>
		</div>
	`);

	$('#es_clear_cache').on('click', function(e){
		e.preventDefault();

		clear_cache();
		location.reload();
	});

	// Add ES progress indicator
	$('#global_actions').after(`<div class="es_progress_wrap"><progress id="es_progress" class="complete" value="1" max="1" title="${ localized_strings.ready.ready }"></progress></div>`);
}

// Display warning if browsing using non-account region
function add_fake_country_code_warning() {
	storage.get(function(settings) {
		if (settings.showfakeccwarning === undefined) { settings.showfakeccwarning = true; storage.set({'showfakeccwarning': settings.showfakeccwarning}); }
		if (settings.showfakeccwarning) {
			var LKGBillingCountry = getCookie("LKGBillingCountry");
			var fakeCC = getCookie("fakeCC");

			if (fakeCC && LKGBillingCountry && LKGBillingCountry.length == 2 && LKGBillingCountry != fakeCC) {
				$("#global_header").after(`
					<div class="es_language_warning">` + localized_strings.using_store.replace("__current__", fakeCC) + `
						<a href="#" id="es_reset_fake_country_code">` + localized_strings.using_store_return.replace("__base__", LKGBillingCountry) + `</a>
					</div>
				`);
				$("#es_reset_fake_country_code").click(function(e) {
					e.preventDefault();
					document.cookie = 'fakeCC=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;';
					window.location.replace(window.location.href.replace(/[?&]cc=.{2}/, ""));
				});
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
				$.ajax({
					url: chrome.extension.getURL('/localization/' + l_code + '/strings.json'),
					mimeType: "application/json",
					success: function (data) {
						localized_strings_native = data;
						$("#global_header").after(`
							<div class="es_language_warning">` + localized_strings_native.using_language.replace("__current__", localized_strings_native.options.lang[currentLanguage.toLowerCase()]) + `
								<a href="#" id="es_reset_language_code">` + localized_strings_native.using_language_return.replace("__base__", localized_strings_native.options.lang[warning_language.toLowerCase()]) + `</a>
							</div>
						`);
						$("#es_reset_language_code").on("click", function(e) {
							e.preventDefault();

							runInPageContext("function(){ ChangeLanguage( '" + settings.showlanguagewarninglanguage.toLowerCase() + "' ) }");
						});
					}
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
	if ($(".supernav_container").length > 0) {
		// add "Forums" after "Workshop"
		$(".submenu_community").find("a[href='" + window.location.protocol + "//steamcommunity.com/workshop/']").after('<a class="submenuitem" href="//forums.steampowered.com/forums/" target="_blank">' + localized_strings.forums + '</a>');
		
		if (is_signed_in) {
			$(".submenu_username").find("a:first").after('<a class="submenuitem" href="//steamcommunity.com/my/games/">' + localized_strings.games + '</a>');
			$(".submenu_username").append('<a class="submenuitem" href="//steamcommunity.com/my/recommended/">' + localized_strings.reviews + '</a>');
			$(".submenu_community .submenuitem:nth-of-type(3)").after('<a class="submenuitem" style="cursor: pointer" onclick="window.open(\'https://steamcommunity.com/chat/\', \'\', \'height=790,width=1015,resize=yes,scrollbars=yes\')">' + localized_strings.chat + '</a>');
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
							setValue(appid + "coupon_discount_note", "");
							if (getValue(appid + "coupon_discount_note_id")) {
								setValue(appid + "coupon_discount_note", obj.descriptions[getValue(appid + "coupon_discount_note_id")].value);
							}
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
		if (settings.stores === undefined || settings.stores instanceof Array) {
			settings.stores = {
				"steam": true,
				"amazonus": true,
				"impulse": true,
				"gamersgate": true,
				"greenmangaming": true,
				"direct2drive": true,
				"origin": true,
				"uplay": true,
				"indiegalastore": true,
				"gamesplanet": true,
				"indiegamestand": true,
				"gog": true,
				"dotemu": true,
				"nuuvem": true,
				"dlgamer": true,
				"humblestore": true,
				"squenix": true,
				"bundlestars": true,
				"fireflower": true,
				"humblewidgets": true,
				"newegg": true,
				"gamesrepublic": true,
				"coinplay": true,
				"funstock": true,
				"wingamestore": true,
				"gamebillet": true,
				"silagames": true,
				"playfield": true,
				"imperialgames": true
			};
			storage.set({'stores': settings.stores});
		}

		if (settings.showlowestprice) {
			var storestring = "";
			$.each(settings.stores, function(store, value) {
				if (settings.stores[store] === true || settings.showallstores) {
					storestring += store + ",";
				}
			});

			if (storestring !== "") {
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
								var activates = "", line1 = "", line2 = "", line3 = "", html, recorded, lowest, lowesth;
								var node = $("input[name=subid][value=" + subid + "]").parent().parent();

								// "Lowest Price"
								if (data["price"]) {
									if (data["price"]["drm"] == "steam") {
										activates = "(<b>" + localized_strings.activates + "</b>)";
										if (data["price"]["store"] == "Steam") {
											activates = "";
										}
									}

									if (settings.override_price != "auto") {
										currencyConversion.load().done(function() {
											lowest = currencyConversion.convert(data["price"]["price"], price_data[".meta"]["currency"], settings.override_price);
											currency_type = settings.override_price;
										});
									} else {
										lowest = data["price"]["price"].toString();
									}

									line1 = localized_strings.lowest_price + ': ' + localized_strings.lowest_price_format.replace("__price__", formatCurrency(lowest, currency_type)).replace("__store__", '<a href="' + escapeHTML(data["price"]["url"].toString()) + '" target="_blank">' + escapeHTML(data["price"]["store"].toString()) + '</a>') + ' ' + activates + ' (<a href="' + escapeHTML(data["urls"]["info"].toString()) + '" target="_blank">' + localized_strings.info + '</a>)';
									if (settings.showlowestpricecoupon) {
										if (data["price"]["price_voucher"]) {
											line1 = localized_strings.lowest_price + ': ' + localized_strings.lowest_price_format.replace("__price__", formatCurrency(lowest, currency_type)).replace("__store__", '<a href="' + escapeHTML(data["price"]["url"].toString()) + '" target="_blank">' + escapeHTML(data["price"]["store"].toString()) + '</a>') + ' ' + localized_strings.after_coupon + ' <b>' + escapeHTML(data["price"]["voucher"].toString()) + '</b> ' + activates + ' (<a href="' + escapeHTML(data["urls"]["info"].toString()) + '" target="_blank">' + localized_strings.info + '</a>)';
										}
									}
								}

								// "Historical Low"
								if (data["lowest"]) {
									if (settings.override_price != "auto") {
										currencyConversion.load().done(function() {
											lowesth = currencyConversion.convert(data["lowest"]["price"], price_data[".meta"]["currency"], settings.override_price);
											currency_type = settings.override_price;
										});
									} else {
										lowesth = data["lowest"]["price"].toString();
									}

									recorded = new Date(data["lowest"]["recorded"]*1000);
									line2 = localized_strings.historical_low + ': ' + localized_strings.historical_low_format.replace("__price__", formatCurrency(lowesth, currency_type)).replace("__store__", escapeHTML(data["lowest"]["store"].toString())).replace("__date__", recorded.toLocaleDateString()) + ' (<a href="' + escapeHTML(data["urls"]["history"].toString()) + '" target="_blank">' + localized_strings.info + '</a>)';
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
													var tier_price = value.price;
													if (settings.override_price != "auto") {
														currencyConversion.load().done(function() {
															tier_price = currencyConversion.convert(value.price, price_data[".meta"]["currency"], settings.override_price);
															currency_type = settings.override_price;
														});
													}
													tier_price = formatCurrency(tier_price, currency_type);
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
												if (settings.override_price != "auto") {
													currencyConversion.load().done(function() {
														bundle_price = currencyConversion.convert(bundle_price, price_data[".meta"]["currency"], settings.override_price);
														currency_type = settings.override_price;
													});
												}
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
		}
	});
}

// Add red warnings for 3rd party DRMs
function drm_warnings(type) {
	storage.get(function(settings) {
		if (settings.showdrm === undefined) { settings.showdrm = true; storage.set({'showdrm': settings.showdrm}); }
		if (settings.showdrm) {

			var gfwl, uplay, securom, tages, stardock, rockstar, kalypso, denuvo, drm;

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

			// Denuvo Antitamper detection
			if (text.match(/\bdenuvo\b/i)) { denuvo = true; }

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
			if (denuvo) { drm_string += "Denuvo Antitamper, "; drm = true; }

			if (drm_string == "(") {
				drm_string = "";
			} else {
				drm_string = drm_string.substring(0, drm_string.length - 2);
				drm_string += ")";
			}

			// Prevent false-positives
			var appid = get_appid(window.location.host + window.location.pathname);
			if (appid == 21690) { drm = false; } // Resident Evil 5, at Capcom's request

			if (drm) {
				if ($("#game_area_purchase").find(".game_area_description_bodylabel").length > 0) {
					$("#game_area_purchase").find(".game_area_description_bodylabel").after('<div class="game_area_already_owned es_drm_warning"><span>' + string_type + ' ' + drm_string + '</span></div>');
				} else {
					$("#game_area_purchase").prepend('<div class="game_area_already_owned es_drm_warning"><span>' + string_type + ' ' + drm_string + '</span></div>');
				}	
			}	
		}
	});
}

// Remove all items from cart
function add_empty_cart_button() {
	$("div.checkout_content").prepend(`
		<button class='es_empty_cart btnv6_green_white_innerfade btn_small continue' style='float: left;'>
			<span>${ localized_strings.empty_cart }</span>
		</button>
	`);

	if (!$(".cart_row").length) {
		$(".es_empty_cart").addClass("btn_disabled").prop("disabled", true);
	}

	$(".es_empty_cart").on("click", function() {
		runInPageContext(`function(){
			var prompt = ShowConfirmDialog('` + localized_strings.empty_cart + `', '` + localized_strings.empty_cart_confirmation + `');
			prompt.done(function(result) {
				if (result == 'OK') {
					document.cookie = "shoppingCartGID=0; path=/; expires=Thu, 01-Jan-1970 00:00:01 GMT;";
					window.location.assign('//store.steampowered.com/cart/');
				}
			});
		}`);
	});
}

// User profile pages
function add_community_profile_links() {
	if ($("#reportAbuseModal").length > 0) { var steamID = document.getElementsByName("abuseID")[0].value; }
	if (steamID === undefined && document.documentElement.outerHTML.match(/steamid"\:"(.+)","personaname/)) { var steamID = document.documentElement.outerHTML.match(/steamid"\:"(.+)","personaname/)[1]; }

	storage.get(function(settings) {
		if (settings.profile_steamgifts === undefined) { settings.profile_steamgifts = true; storage.set({'profile_steamgifts': settings.profile_steamgifts}); }
		if (settings.profile_steamtrades === undefined) { settings.profile_steamtrades = true; storage.set({'profile_steamtrades': settings.profile_steamtrades}); }
		if (settings.profile_steamrep === undefined) { settings.profile_steamrep = true; storage.set({'profile_steamrep': settings.profile_steamrep}); }
		if (settings.profile_steamdbcalc === undefined) { settings.profile_steamdbcalc = true; storage.set({'profile_steamdbcalc': settings.profile_steamdbcalc}); }
		if (settings.profile_astats === undefined) { settings.profile_astats = true; storage.set({'profile_astats': settings.profile_astats}); }
		if (settings.profile_backpacktf === undefined) { settings.profile_backpacktf = true; storage.set({'profile_backpacktf': settings.profile_backpacktf}); }
		if (settings.profile_astatsnl === undefined) { settings.profile_astatsnl = true; storage.set({'profile_astatsnl': settings.profile_astatsnl}); }
		if (settings.profile_steamrepcn === undefined) { settings.profile_steamrepcn = true; storage.set({'profile_steamrepcn': settings.profile_steamrepcn}); }
		
		if (settings.profile_permalink === undefined) { settings.profile_permalink = true; storage.set({'profile_permalink': settings.profile_permalink}); }
		
		if (settings.show_profile_link_images === undefined) { settings.show_profile_link_images = "gray"; storage.set({'show_profile_link_images': settings.show_profile_link_images}); }
		
		var icon_type = "none";
		if (settings.show_profile_link_images != "false") {
			icon_type = (settings.show_profile_link_images == "color" ? "color" : "gray");
		}

		var links = {
			"steamrep": {
				"link": `//steamrep.com/profiles/${ steamID }`,
				"name": "SteamRep",
			},
			"steamdbcalc": {
				"link": `//steamdb.info/calculator/?player=${ steamID }`,
				"name": "SteamDB",
			},
			"steamgifts": {
				"link": `//www.steamgifts.com/go/user/${ steamID }`,
				"name": "SteamGifts",
			},
			"steamtrades": {
				"link": `//www.steamtrades.com/user/${ steamID }`,
				"name": "SteamTrades",
			},
			"astats": {
				"link": `//www.achievementstats.com/index.php?action=profile&playerId=${ steamID }`,
				"name": "Achievement Stats",
			},
			"backpacktf": {
				"link": `//backpack.tf/profiles/${ steamID }`,
				"name": "Backpack.tf",
			},
			"astatsnl": {
				"link": `//astats.astats.nl/astats/User_Info.php?steamID64=${ steamID }`,
				"name": "AStats.nl",
			}
		};

		// Add "SteamRepCN"	
		if (language == "schinese" || language == "tchinese") {
			links = $.extend({
					"steamrepcn": {
						"link": `//steamrepcn.com/profiles/${ steamID }`,
						"name": (language == "schinese" ? "查看信誉记录" : "確認信譽記錄"),
					}
				},
				links
			);
		}

		// Build the links HTML
		var htmlstr = "";
		$.each(links, function(site, info){
			if (settings["profile_" + site]) {
				htmlstr += `
					<div class="es_profile_link profile_count_link">
						<a class="es_sites_icons es_${ site }_icon es_${ icon_type }" href="${ info.link }" target="_blank">
							<span class="count_link_label">${ info.name }</span>
						</a>
					</div>
				`;
			}
		});

		// Do the "Permalink" input separately
		if (settings.profile_permalink) {
			htmlstr += `
				<div id="es_permalink_div" class="profile_count_link">
					<span class="count_link_label">${ localized_strings.permalink }</span>
					<input id="es_permalink" type="text" value="http://steamcommunity.com/profiles/${ steamID }" readonly />
				</div>
			`;
		}

		// Insert the links HMTL into the page
		if (htmlstr) {
			if ($(".profile_item_links").length) {
				$(".profile_item_links").append(htmlstr + '<div style="clear: both;"></div>');
			} else {
				$(".profile_rightcol").append('<div class="profile_item_links">' + htmlstr + '</div>');
				$(".profile_rightcol").after('<div style="clear: both;"></div>');
			}
		}

		$("#es_permalink").on("click", function(){
			$(this).select();
		});
	});
}

function add_wishlist_profile_link() {
	if ($(".profile_item_links").length) {
		var steamID = $("input[name='abuseID']").val();
	
		if (!steamID) {
			var rgData = $("script:contains('g_rgProfileData')").text();
			if (rgData && /steamid"\:"\d+","personaname/.test(rgData)) {
				steamID = rgData.match(/steamid"\:"(\d+)","personaname/)[1];
			}
		}

		if (steamID) {
			$(".profile_item_links").find(".profile_count_link:first").after("<div class='profile_count_link' id='es_wishlist_link'><a href='//steamcommunity.com/profiles/" + steamID + "/wishlist'><span class='count_link_label'>" + localized_strings.wishlist + "</span>&nbsp;<span class='profile_count_link_total' id='es_wishlist_count'></span></a></div>");

			// Get count of wishlisted items
			get_http("//steamcommunity.com/profiles/" + steamID + "/wishlist", function(txt) {
				var count = txt.match(/id="game_(\d+)"/g);

				if (count) {
					$("#es_wishlist_count").text(count.length);
				} else {
					$("#es_wishlist_link").remove();
				}
			});
		}
	}
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
				if (txt) {
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
				}
			});
		}
	}
}

function chat_dropdown_options(in_chat) {
	if (is_signed_in) {
		var $send_button = $("div.profile_header_actions > a[href*=LaunchWebChat]");
		if ($send_button.length > 0) {
			var href = $send_button.attr("href");
			var friendID = href.match(/javascript:LaunchWebChat\( {friend: (\d+) } \);/)[1];
			var friendSteamID = $("script:contains('g_rgProfileData')").text().match(/"steamid":"(\d+)",/)[1];

			$send_button.replaceWith(`
				<span class="btn_profile_action btn_medium" id="profile_chat_dropdown_link" onclick="ShowMenu( this, \'profile_chat_dropdown\', \'right\' );">
					<span>` + $send_button.text() + `<img src="//steamcommunity-a.akamaihd.net/public/images/profile/profile_action_dropdown.png"></span>
				</span>
				<div class="popup_block" id="profile_chat_dropdown" style="visibility: visible; top: 168px; left: 679px; display: none; opacity: 1;">
					<div class="popup_body popup_menu shadow_content" style="box-shadow: 0 0 12px #000">
						<a class="popup_menu_item webchat" href="` + href + `"><img src="//steamcommunity-a.akamaihd.net/public/images/skin_1/icon_btn_comment.png">&nbsp; ` + localized_strings.web_browser_chat + `</a>
						<a class="popup_menu_item" href="steam://friends/message/` + friendSteamID + `"><img src="//steamcommunity-a.akamaihd.net/public/images/skin_1/icon_btn_comment.png">&nbsp; ` + localized_strings.steam_client_chat + `</a>
					</div>
				</div>
			`);

			// Fixing Valve's mistakes, part 1
			if (window.location.protocol != "https:") {
				$(".webchat").on("click", function(){
					chrome.storage.local.set({rgChatStartupParam: {friend: friendID}});
				});
			}
		}
	}

	// Fixing Valve's mistakes, part 2
	if (in_chat) { // we don't include this in the "is_signed_in" condition since "signed_in_promise" fails in chat, however, the page is unreachable if not logged in
		chrome.storage.local.get("rgChatStartupParam", function(data) {
			if (data.rgChatStartupParam) {
				runInPageContext("function(){ Chat.RunStartupParam(" + JSON.stringify(data.rgChatStartupParam) + "); }");
				chrome.storage.local.remove("rgChatStartupParam");
			}
		});
	}
}

function ingame_name_link() {
	var $ingameAppIdSel = $("input[name='ingameAppID']");

	if ($ingameAppIdSel.length && $ingameAppIdSel.val()) {
		var tooltip = localized_strings.view_in + ' ' + localized_strings.store;

		$(".profile_in_game_name").wrapInner('<a data-community-tooltip="' + tooltip + '" href="//store.steampowered.com/app/' + $ingameAppIdSel.val() + '" target="_blank" />');
		runInPageContext(function() { BindCommunityTooltip( $J('[data-community-tooltip]') ); });
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

var get_subid = function(appid) {
	var deferred = new $.Deferred();

	// Try to retrieve the subid from Steam's API
	$.ajax({
		url: '//store.steampowered.com/api/appdetails/?appids=' + appid,
		crossDomain: true,
		xhrFields: { withCredentials: true }
	}).done(function(data) {
		$.each(data, function(appid, app_data) {
			if (app_data.success) {
				deferred.resolve(app_data.data.packages[0]);
			} else {
				deferred.reject();
			}
		});
	}).fail(function(){
	// Steam API call failed, try to retrieve it from app's store page
		$.ajax({
			url: '//store.steampowered.com/app/' + appid + '/',
			crossDomain: true,
			xhrFields: { withCredentials: true }
		}).done(function(txt) {
			var subid = (txt.match(/name="subid" value="(\d+)"/i) || [])[1];
			
			if (subid) {
				deferred.resolve(subid);
			} else {
				deferred.reject();
			}
		}).fail(function(){
			deferred.reject();
		});
	});

	return deferred.promise();
};

function wishlist_add_to_cart() {
	storage.get(function(settings){
		if (settings.add_to_cart_wishlist === undefined) { settings.add_to_cart_wishlist = true; storage.set({'add_to_cart_wishlist': settings.add_to_cart_wishlist}); }
		if (settings.add_to_cart_wishlist) {

			$("div.gameListPriceData").each(function(i, node) {
				if ($(node).find("div.discount_block").length || $.inArray($(node).find("div.price").text().trim(), ['', 'Free to Play']) == -1) {
					$(node).find("div.storepage_btn_ctn").prepend(`
						<button type="submit" class="es_add_to_cart btnv6_green_white_innerfade btn_small">
							<span>${ localized_strings.add_to_cart }
							<img class="es_loading_img" style="display:none;" src="//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif" />
							</span>
						</button>
					`);
				}
			});

			$(".es_add_to_cart").on("click", function(e){
				e.preventDefault();
				
				if (!$(this).is(".es_loading_cart")) {
					var thisBtn = $(this).addClass("es_loading_cart");
					var appid = get_appid($(this).next("a").prop("href"));

					$(thisBtn).find(".es_loading_img").fadeIn();
					
					$.when(get_store_session, get_subid(appid)).done(function(store_sessionid, subid) {
						$.ajax({
							type: 'POST',
							url: '//store.steampowered.com/cart/',
							data: {
								snr: '1_5_9__403',
								action: 'add_to_cart',
								sessionid: store_sessionid,
								subid: subid
							},
							crossDomain: true,
							xhrFields: { withCredentials: true }
						}).done(function(txt) {
							$(thisBtn).addClass("btn_disabled").prop("disabled", true);
						}).complete(function() {
							$(thisBtn).removeClass("es_loading_cart").find(".es_loading_img").fadeOut();
						});
					});
				}
			});
		}
	});
}

// TODO: Cache this data, but only the required entries! Store the data combined in one row
// but update apps individually based on "release_date.coming_soon". Unreleased apps will be
// updated at least once a day while others can be updated once a week. If more than three
// subsequent API request errors occur when pulling or updating data delay the process for a while.
function appdata_on_wishlist() {
	if ($('a.btnv6_blue_hoverfade').length < 200) {
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
							if (platforms > 1) { htmlstring = htmlstring + "<span class='platform_img steamplay'></span>"; }
							$(node).parent().parent().parent().find(".bottom_controls").append('<span class="es_platform">' + htmlstring + '</span>');
						}

						// Add release date info to unreleased apps
						if (app_data.data.release_date.coming_soon == true) {
							$(node).parent().before('<div class="releasedate">' + localized_strings.available + ': ' + app_data.data.release_date.date + '</div>');
						}
					}
				});
			});
		});
	}
}

function wishlist_dynamic_data() {
	storage.get(function(settings) {
		$.when.apply($, [dynamicstore_promise, get_store_session]).done(function(data, store_sessionid) {
			var ownedapps = data.rgOwnedApps;
			var wishlistapps = data.rgWishlist;

			if (is_signed_in && ($(".profile_small_header_bg a:first").attr("href").replace(/\/$/, "") != $("#global_actions .playerAvatar:first").attr("href").replace(/\/$/, ""))) {
				$('a.btnv6_blue_hoverfade').each(function (index, node) {
					var appid = Number(get_appid(node.href));
					
					var owned = ownedapps.indexOf(appid);
					var wishlisted = wishlistapps.indexOf(appid);

					if (owned == -1 && wishlisted == -1 && store_sessionid) {
						$(node).parent().parent().siblings(".wishlist_added_on").append('(<a class="es_wishlist_add" id="es_wishlist_' + appid + '"><span>' + localized_strings.add_to_wishlist + '</span></a>)');
						$("#es_wishlist_" + appid).click(function() {
							$.ajax({
								type:"POST",
								url:"//store.steampowered.com/api/addtowishlist",
								data:{
									sessionid: store_sessionid,
									appid: appid
								},
								success: function( msg ) {
									$("#es_wishlist_" + appid).addClass("btn_disabled");
									$("#es_wishlist_" + appid).off("click");
									$("#es_wishlist_" + appid).html("<span>" + localized_strings.on_wishlist + "</span>");
								},
								error: function(e){
									console.log('Error: '+e);
								}
							});
						});
					}

					if (owned != -1) {
						$(node).parents(".wishlistRow").addClass("ds_collapse_flag ds_flagged ds_owned");
						if (settings.highlight_owned) {
							highlight_owned($(node).parents(".wishlistRow")[0]);
						} else {
							$(node).parents(".wishlistRow").append('<div class="ds_flag ds_owned_flag">' + localized_strings.library.in_library.toUpperCase() + '&nbsp;&nbsp;</div>');
						}
					}

					if (wishlisted != -1) {
						$(node).parents(".wishlistRow").addClass("ds_collapse_flag ds_flagged ds_wishlist");
						if (settings.highlight_wishlist) {
							highlight_wishlist($(node).parents(".wishlistRow")[0]);
						} else {
							$(node).parents(".wishlistRow").append('<div class="ds_flag ds_wishlist_flag">' + localized_strings.on_wishlist.toUpperCase() + '&nbsp;&nbsp;</div>');
						}	
					}
				});
			}
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
			$(".search_pagination:last").before('<div class="LoadingWrapper"><div class="LoadingThrobber" style="margin-bottom: 15px;"><div class="Bar Bar1"></div><div class="Bar Bar2"></div><div class="Bar Bar3"></div></div><div id="LoadingText">' + localized_strings.loading + '</div></div>');
		}	

		if (search.substring(0,1) == "&") { search = "?" + search.substring(1, search.length); }
		if (search.substring(0,1) != "?") { search = "?" + search; }

		$.ajax({
			url: '//store.steampowered.com/search/results' + search + '&page=' + search_page + '&snr=es'
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
			$(".search_pagination_right").hide();
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
	if ($(".greenlit_items").length) {
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
}

function add_exclude_tags_to_search() {
	var tagfilter_divs = $('#TagFilter_Container')[0].children;
	var tagfilter_exclude_divs = [];
	//tag numbers from the URL are already in the element with id #tags
	var tags = decodeURIComponent($("#tags").val()).split(',');
	$.each(tagfilter_divs, function(i,val) {
		var item_checked=tags.indexOf("-"+this.dataset.value)>-1?"checked":"";
		var exclude_item = $(`<div class="tab_filter_control  ${item_checked}" data-param="tags" data-value="-${this.dataset.value}" data-loc="${this.dataset.loc}">
			<div class="tab_filter_control_checkbox"></div>
			<span class="tab_filter_control_label">${this.dataset.loc}</span>
			</div>`);
		exclude_item.click(function() {
			var strValues = decodeURIComponent($("#tags").val());
			var value = String(this.dataset.value);
			if (!$(this).hasClass('checked')) {
				var rgValues;
				if(!strValues) {
					rgValues = [value];
				} else {
					rgValues = strValues.split(',');
					if($.inArray(value, rgValues) == -1) { rgValues.push(value); }
				}
				$("#tags").val(rgValues.join(','));
				$(this).addClass('checked');
			} else {
				var rgValues = strValues.split(',');
				if(rgValues.indexOf(value) != -1) { rgValues.splice(rgValues.indexOf(value), 1); }
				$("#tags").val(rgValues.join(','));
				$(this).removeClass('checked');
			}
			runInPageContext(function() {AjaxSearchResults();});
		});
		tagfilter_exclude_divs.push(exclude_item);
	});

	var dom_item = `
		<div class='block' id='es_tagfilter_exclude'>
			<div class='block_header'>
				<div>${localized_strings.exclude_tags}</div>
			 </div>
			 <div class='block_content block_content_inner'>
				<div style='max-height: 150px; overflow: hidden;' id='es_tagfilter_exclude_container'></div>
				<input type="text" id="es_tagfilter_exclude_suggest" class="blur es_input_text">
			</div>
		</div>
	`;

	$("#TagFilter_Container").parent().parent().after(dom_item);
	$("#es_tagfilter_exclude_container").append(tagfilter_exclude_divs);
	runInPageContext(function() {
		$J('#es_tagfilter_exclude_container').tableFilter({ maxvisible: 15, control: '#es_tagfilter_exclude_suggest', dataattribute: 'loc', 'defaultText': jQuery("#TagSuggest")[0].value });
	});

	var observer = new MutationObserver(function(mutations) {
		$.each(mutations,function(mutation_index, mutation){
			if(mutations[mutation_index]["addedNodes"]){
				$.each(mutations[mutation_index]["addedNodes"], function(node_index, node){
					if ($(node).hasClass("tag_dynamic") && parseFloat($(node).attr("data-tag_value")) < 0) {
						$(node).find(".label").text(localized_strings.not.replace("__tag__", $(node).text()));
					}
				});
			}
		});
	});
	observer.observe($(".termcontainer")[0], {childList:true, subtree:true});
	runInPageContext(function() {UpdateTags()});
}

function add_hide_buttons_to_search() {
	storage.get(function(settings) {
		if (settings.hide_owned === undefined) { settings.hide_owned = false; storage.set({'hide_owned': settings.hide_owned}); }
		if (settings.hide_wishlist === undefined) { settings.hide_wishlist = false; storage.set({'hide_wishlist': settings.hide_wishlist}); }
		if (settings.hide_cart === undefined) { settings.hide_cart = false; storage.set({'hide_cart': settings.hide_cart}); }
		if (settings.hide_notdiscounted === undefined) { settings.hide_notdiscounted = false; storage.set({'hide_notdiscounted': settings.hide_notdiscounted}); }
		if (settings.hide_notinterested === undefined) { settings.hide_notinterested = false; storage.set({'hide_notinterested': settings.hide_notinterested}); }
		if (settings.hide_mixed === undefined) { settings.hide_mixed = false; storage.set({'hide_mixed': settings.hide_mixed}); }
		if (settings.hide_negative === undefined) { settings.hide_negative = false; storage.set({'hide_negative': settings.hide_negative}); }
		if (settings.hide_priceabove === undefined) { settings.hide_priceabove = false; storage.set({'hide_priceabove': settings.hide_priceabove}); }
		if (settings.priceabove_value === undefined) { settings.priceabove_value = ''; storage.set({'priceabove_value': settings.priceabove_value}); }
		
		$("#advsearchform").find(".rightcol").prepend(`
			<div class='block' id='es_hide_menu'>
				<div class='block_header'><div>` + localized_strings.hide + `</div></div>
				<div class='block_content block_content_inner' style='height: 150px;' id='es_hide_options'>
					<div class='tab_filter_control' id='es_owned_games'>
						<div class='tab_filter_control_checkbox'></div>
						<span class='tab_filter_control_label'>` + localized_strings.options.owned + `</span>
					</div>
					<div class='tab_filter_control' id='es_wishlist_games'>
						<div class='tab_filter_control_checkbox'></div>
						<span class='tab_filter_control_label'>` + localized_strings.options.wishlist + `</span>
					</div>
					<div class='tab_filter_control' id='es_cart_games'>
						<div class='tab_filter_control_checkbox'></div>
						<span class='tab_filter_control_label'>` + localized_strings.options.cart + `</span>
					</div>
					<div class='tab_filter_control' id='es_notdiscounted'>
						<div class='tab_filter_control_checkbox'></div>
						<span class='tab_filter_control_label'>` + localized_strings.notdiscounted + `</span>
					</div>
					<div class='tab_filter_control' id='es_notinterested'>
						<div class='tab_filter_control_checkbox'></div>
						<span class='tab_filter_control_label'>` + localized_strings.notinterested + `</span>
					</div>
					<div class='tab_filter_control' id='es_notmixed'>
						<div class='tab_filter_control_checkbox'></div>
						<span class='tab_filter_control_label'>` + localized_strings.mixed_item + `</span>
					</div>
					<div class='tab_filter_control' id='es_notnegative'>
						<div class='tab_filter_control_checkbox'></div>
						<span class='tab_filter_control_label'>` + localized_strings.negative_item + `</span>
					</div>
					<div class='tab_filter_control' id='es_notpriceabove'>
						<div class='tab_filter_control_checkbox'></div>
						<span class='tab_filter_control_label'>` + localized_strings.price_above + `</span>
						<div>
						<input type="number" id='es_notpriceabove_val' class='es_input_number' step=0.01></input>
						</div>
					</div>
				</div>
				<a class="see_all_expander" href="#" id="es_hide_expander" onclick="ExpandOptions(this, 'es_hide_options'); return false;"></a>
			</div>
		`);
		$("#es_hide_expander").text($(".see_all_expander:last").text());

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

		if (settings.hide_mixed) {
			$("#es_notmixed").addClass("checked");
			$("#es_hide_options").css("height", "auto");
			$("#es_hide_expander").hide();
			$(".search_result_row").each(function() {
				if ($(this).find(".search_reviewscore").children("span.search_review_summary.mixed").length > 0) { $(this).hide(); }
			});
		}

		if (settings.hide_negative) {
			$("#es_notnegative").addClass("checked");
			$("#es_hide_options").css("height", "auto");
			$("#es_hide_expander").hide();
			$(".search_result_row").each(function() {
				if ($(this).find(".search_reviewscore").children("span.search_review_summary.negative").length > 0) { $(this).hide(); }
			});
		}
		
		if (settings.hide_priceabove) {
			$("#es_notpriceabove").addClass("checked");
			$("#es_hide_options").css("height", "auto");
			$("#es_hide_expander").hide();
			$(".search_result_row").each(function() { apply_price_filter(this); });	
		}
		if (settings.priceabove_value ) {
			$("#es_notpriceabove_val").val(settings.priceabove_value);
		}

		function add_hide_buttons_to_search_click() {
			$(".search_result_row").each(function() {
				$(this).css("display", "block");
				if ($("#es_owned_games").is(".checked") && $(this).is(".ds_owned")) { $(this).hide(); }
				if ($("#es_wishlist_games").is(".checked") && $(this).is(".ds_wishlist")) { $(this).hide(); }
				if ($("#es_cart_games").is(".checked") && $(this).is(".ds_incart")) { $(this).hide(); }
				if ($("#es_notdiscounted").is(".checked") && $(this).find(".search_discount").children("span").length == 0) { $(this).hide(); }
				if ($("#es_notinterested").is(".checked")) { highlight_notinterested(this); }
				if ($("#es_notmixed").is(".checked") && $(this).find(".search_reviewscore").children("span.search_review_summary.mixed").length > 0) { $(this).hide(); }
				if ($("#es_notnegative").is(".checked") && $(this).find(".search_reviewscore").children("span.search_review_summary.negative").length > 0) { $(this).hide(); }
				if ($("#es_notpriceabove").is(".checked")) { apply_price_filter(this); }
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

		$("#es_notmixed").click(function() {
			if ($("#es_notmixed").hasClass("checked")) {
				$("#es_notmixed").removeClass("checked");
				storage.set({'hide_mixed': false });
			} else {
				$("#es_notmixed").addClass("checked");
				storage.set({'hide_mixed': true });
			}
			add_hide_buttons_to_search_click();
		});

		$("#es_notnegative").click(function() {
			if ($("#es_notnegative").hasClass("checked")) {
				$("#es_notnegative").removeClass("checked");
				storage.set({'hide_negative': false });
			} else {
				$("#es_notnegative").addClass("checked");
				storage.set({'hide_negative': true });
			}
			add_hide_buttons_to_search_click();
		});
		
		$("#es_notpriceabove").click(function() {
			if ($("#es_notpriceabove").hasClass("checked")) {
				$("#es_notpriceabove").removeClass("checked");
				storage.set({'hide_priceabove': false });
			} else {
				$("#es_notpriceabove").addClass("checked");
				storage.set({'hide_priceabove': true });
			}
			add_hide_buttons_to_search_click();
		});
		document.getElementById("es_notpriceabove").title = localized_strings.price_above_tooltip;
		
		var elem = document.getElementById("es_notpriceabove_val");
		if (elem !== undefined && elem !== null) {
			elem.title = localized_strings.price_above_tooltip;
			elem.onclick = function(ev){
				ev.stopPropagation()
			}
			elem.onkeypress = function(ev){
				return validate_price(this.value, ev);
			};
			elem.onchange = function(){
				var price = '';
				if(this.value != ''){
					var price = Number(this.value);
					if( Number.isNaN(price) ) {
						price = '';
					}
				}
				storage.set({"priceabove_value": price });
				add_hide_buttons_to_search_click()
			}
		}
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
						html += "<div class='tab_item_cap'><img class='tab_item_cap_img' src='//cdn.akamai.steamstatic.com/steam/apps/" + appid + "/capsule_184x69.jpg' /></div>";
						html += "<div class='tab_item_content'><div class='tab_item_name'>" + game_name + "</div><div class='tab_item_details'>" + currently + " " + localized_strings.charts.playing_now + "</div><br clear='all'></div>";

						html += "</div>";
						$("#tab_popular_content").append(html);
						i++;
					}
				});
				$("#tab_popular_content").append("<div class='tab_see_more'>"+localized_strings.see_more+": <a href='//store.steampowered.com/stats/' class='btnv6_blue_hoverfade btn_small_tall'><span>"+localized_strings.popular+"</span></a></div>");
				runInPageContext("function() { GHomepage.InstrumentTabbedSection(); }");
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
				html += "<div class='tab_item_cap'><img class='tab_item_cap_img' src='//cdn.akamai.steamstatic.com/steam/apps/" + appid + "/capsule_184x69.jpg' /></div>";
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
			runInPageContext("function() { GHomepage.InstrumentTabbedSection(); }");
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
			var observer = new MutationObserver(function(mutations) {
				check_hide_comments();
			});
			if($("#AppHubContent").html()) {
				var modal_content_observer = new MutationObserver(function(mutations) {
					var frame_comment_observer = new MutationObserver(function(mutations) {
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
	$("#profile_action_dropdown .popup_body .profile_actions_follow").after("<a class='popup_menu_item' id='es_posthistory' href='" + window.location.pathname + "/posthistory'><img src='//steamcommunity-a.akamaihd.net/public/images/skin_1/icon_btn_comment.png'>&nbsp; " + localized_strings.post_history + "</a>");
}

function add_nickname_link() {
	if ($("#profile_action_dropdown .popup_body").find("img[src*='notification_icon_edit_bright']").length == 0) {
		$("#es_posthistory").after("<a class='popup_menu_item' href='#' onclick='ShowNicknameModal(); HideMenu( \"profile_action_dropdown_link\", \"profile_action_dropdown\" ); return false;'><img src='//steamcommunity-a.akamaihd.net/public/images/skin_1/notification_icon_edit_bright.png'>&nbsp; " + localized_strings.add_nickname + "</a>");
	}
}

function add_profile_style() {
	if (!$(".profile_page.private_profile").length) {
		profileData.get("profile_style", function(data) {
			var txt = data.style;
			var available_styles = ["clear", "green", "holiday2014", "orange", "pink", "purple", "red", "teal", "yellow", "blue"];
			if ($.inArray(txt, available_styles) > -1) {
				$("body").addClass("es_profile_style");
				switch (txt) {
					case "holiday2014":
						$("head").append("<link rel='stylesheet' type='text/css' href='//steamcommunity-a.akamaihd.net/public/css/skin_1/holidayprofile.css'>");
						$(".profile_header_bg_texture").append("<div class='holidayprofile_header_overlay'></div>");
						$(".profile_page").addClass("holidayprofile");
						$.getScript("//steamcommunity-a.akamaihd.net/public/javascript/holidayprofile.js").done(function() {
							runInPageContext("function() { StartAnimation(); }");
						});
						break;
					case "clear":
						$("body").addClass("es_style_clear");
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
}

function add_background_preview_link() {
	if (is_signed_in) {
		var isSteamPage = /\/market\/listings\/753\//.test(window.location.pathname);
		var $viewFullLink = $("#largeiteminfo_item_actions").find("a").first();
		if (isSteamPage && $viewFullLink.length) {
			var bgLink = $viewFullLink[0].href.match(/images\/items\/(\d+)\/([a-z0-9\.]+)/i);
			if (bgLink) {
				$viewFullLink.after('<a class="es_preview_background btn_small btn_darkblue_white_innerfade" target="_blank" href="' + profile_url + "#previewBackground/" + bgLink[1] + "/" + bgLink[2] + '"><span>' + localized_strings.preview_background + '</span></a>');
			}
		}
	}
}

function hide_activity_spam_comments() {
	var blotter_content_observer = new MutationObserver(function(mutations) {
		hide_spam_comments();
	});
	blotter_content_observer.observe($("#blotter_content")[0], {childList:true, subtree:true});
}

// Add Metacritic user scores to store page
function add_metacritic_userscore() {
	storage.get(function(settings) {
		if (settings.showmcus === undefined) { settings.showmcus = true; storage.set({'showmcus': settings.showmcus}); }
		if (settings.showmcus) {
			if ($("#game_area_metascore").length) {
				storePageData.get("metacritic", function(data) {
					if (data.userscore) {
						var metauserscore = data.userscore * 10;
						if (!isNaN(metauserscore)) {
							$("#game_area_metascore").after("<div id='game_area_userscore'></div>");
							var rating;
							if (metauserscore >= 75) { rating = "high"; } else {
								if (metauserscore >= 50) { rating = "medium"; } else { rating = "low"; }
							}
							$("#game_area_userscore").append("<div class='score " + rating + "'>" + metauserscore + "</div><div class='logo'></div><div class='wordmark'><div class='metacritic'>" + localized_strings.user_score + "</div></div>");
						}
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
	if ($(".game_area_dlc_bubble").length === 0) {
		storage.get(function(settings) {
			if (settings.showhltb === undefined) { settings.showhltb = true; storage.set({'showhltb': settings.showhltb}); }
			if (settings.showhltb) {
				storePageData.get("hltb", function(data) {
					if (data["success"]) {
						how_long_html = "<div class='block game_details underlined_links'>"
							+ "<div class='block_header'><h4>How Long to Beat</h4></div>"
							+ "<div class='block_content'><div class='block_content_inner'><div class='details_block'>";
						if (data["main_story"]){
							how_long_html += "<b>" + localized_strings.hltb.main + ":</b><span style='float: right;'>" + escapeHTML(data['main_story']) + "</span><br>";
						}
						if (data["main_extras"]){
							how_long_html += "<b>" + localized_strings.hltb.main_e + ":</b><span style='float: right;'>" + escapeHTML(data['main_extras']) + "</span><br>";
						}
						if (data["comp"]) {
							how_long_html += "<b>" + localized_strings.hltb.compl + ":</b><span style='float: right;'>" + escapeHTML(data['comp']) + "</span><br>"
						}
						how_long_html += "</div>"
							+ "<a class='linkbar' href='" + escapeHTML(data['url']) + "' target='_blank'>" + localized_strings.more_information + " <img src='//cdn2.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"
							+ "<a class='linkbar' href='" + escapeHTML(data['submit_url']) + "' target='_blank'>" + localized_strings.hltb.submit + " <img src='//cdn2.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"
							+ "<a class='linkbar' href='//www.enhancedsteam.com/gamedata/hltb_link_suggest.php' id='suggest'>" + localized_strings.hltb.wrong + " - " + localized_strings.hltb.help + " <img src='//cdn2.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"
							+ "</div></div></div>";
						$("div.game_details:first").after(how_long_html);
					} else {
						how_long_html = "<div class='block game_details underlined_links'>"
							+ "<div class='block_header'><h4>How Long to Beat</h4></div>"
							+ "<div class='block_content'><div class='block_content_inner'><div class='details_block'>"
							+ localized_strings.hltb.no_data + "</div>"
							+ "<a class='linkbar' href='//www.enhancedsteam.com/gamedata/hltb_link_suggest.php' id='suggest'>" + localized_strings.hltb.help + " <img src='//cdn2.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"
							+ "</div></div></div>";
						$("div.game_details:first").after(how_long_html);
					}
					$("#suggest").on("click", function() {
						delValue("storePageData_" + appid);
					});
				});
			}
		});
	}
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

function add_steam_client_link(appid) {
	storage.get(function(settings) {
		if (settings.showclient === undefined) { settings.showclient = true; storage.set({'showclient': settings.showclient}); }
		if (settings.showclient) {
			$('#ReportAppBtn').parent().prepend('<a class="btnv6_blue_hoverfade btn_medium steam_client_btn" href="steam://url/StoreAppPage/' + appid + '" style="display: block; margin-bottom: 6px;"><span><i class="ico16" style="background-image:url(http://store.steampowered.com/favicon.ico)"></i>&nbsp;&nbsp; ' + localized_strings.viewinclient + '</span></a>');
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
		if ($(".game_area_dlc_bubble").length <= 0) {
			if (settings.showwsgf) {
				// Check to see if game data exists
				storePageData.get("wsgf", function(data) {
					$("div.game_details:first").each(function (index, node) {
						var path = data["Path"];
						var wsg = data["WideScreenGrade"];
						var mmg = data["MultiMonitorGrade"];
						var fkg = data["Grade4k"];
						var uws = data["UltraWideScreenGrade"];
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
				});
			}
		}
	});
}

function add_dlc_page_link(appid) {
	$(".game_area_dlc_section").find("h2.gradientbg").wrapInner(`<a href="//store.steampowered.com/dlc/${ appid }"></a>`);
}

// Fix "No image available" on apps image header
function fix_app_image_not_found() {
	$("img[src$='338200c5d6c4d9bdcf6632642a2aeb591fb8a5c2.gif']").attr("src", function(){		
		var appid = get_appid($(this).parent()[0].href);
		if (appid == 223530) { return; };
		return "//steamcdn-a.akamaihd.net/steam/apps/" + appid + "/capsule_184x69.jpg";
	});
}

function add_market_total() {
	storage.get(function(settings) {
		if (settings.showmarkettotal === undefined) { settings.showmarkettotal = true; storage.set({'showmarkettotal': settings.showmarkettotal}); }
		if (settings.showmarkettotal) {
			if (window.location.pathname.match(/^\/market\/$/)) {
				$("#moreInfo").before('<div id="es_summary"><div class="market_search_sidebar_contents"><h2 class="market_section_title">'+ localized_strings.market_transactions +'</h2><div class="market_search_game_button_group" id="es_market_summary" style="width: 238px"><img src="//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif"><span>'+ localized_strings.loading +'</span></div></div></div>');

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

function add_market_sort() {
	if (window.location.pathname.match(/^\/market\/$/)) {
		var dateSortIntd = false;
		
		// Indicate default sort and add buttons to header
		$("#es_selling").find(".market_listing_table_header span:last").parent().wrap("<span id='es_marketsort_name' class='es_marketsort market_sortable_column'></span>");
		$("#es_selling").find(".market_listing_table_header .market_listing_listed_date").addClass("market_sortable_column").wrap("<span id='es_marketsort_date' class='es_marketsort active asc'></span>");
		$("#es_selling").find(".market_listing_table_header .market_listing_my_price:last").addClass("market_sortable_column").wrap("<span id='es_marketsort_price' class='es_marketsort'></span>");
		$("#es_marketsort_name").before("<span id='es_marketsort_game' class='es_marketsort market_sortable_column'><span>" + localized_strings.game_name.toUpperCase() + "</span></span>");
		
		// Add header click handlers
		$(".es_marketsort").on("click", function(){
			var state = $(this).hasClass("asc");

			$(".es_marketsort").removeClass("active");
			$(this).addClass("active").toggleClass("asc", !state).toggleClass("desc", state);

			// Initiate and save the default sorting, which is by date, this way later we can reliably sort by date no matter the language set
			if (!dateSortIntd) {
				dateSortIntd = true;

				$(".market_listing_listed_date").each(function(i, node) {
					$(node).append("<div class='market_listing_listed_position'>" + i + "</div>");
				});
			}

			market_sort_rows($(this).attr("id"), state);
		});

		function market_sort_rows(parent, asc) {
			asc = asc === undefined ? false : asc;

			var sel, isNumber;
			var T = asc === true ? 1 : -1,
				F = asc === true ? -1 : 1;
			var $rows = $("#es_selling").find(".market_listing_row:not(#es_selling_total)");
			
			switch (parent) {
				case "es_marketsort_name":
					sel = ".market_listing_item_name";
					break;
				case "es_marketsort_date":
					sel = ".market_listing_listed_position";
					isNumber = true;
					break;
				case "es_marketsort_price":
					sel = ".market_listing_price";
					break;
				case "es_marketsort_game":
					sel = ".market_listing_game_name";
					break;
			}

			$rows.sort(function(a, b){
				a = $(a).find(sel).text().trim();
				b = $(b).find(sel).text().trim();

				if (a == b) return 0;
				if (isNumber) {
					if (asc === true) {
						return b - a;
					} else {
						return a - b;
					}
				} else {
					return a < b ? T : F;
				}
			});

			$rows.detach().insertBefore($("#es_selling_total"));
		}
	}
}

function collapse_game_list() {
	if (window.location.pathname.match(/^\/market\/$/)) {
		$("#browseItems .market_search_game_button_group").find("a").wrapAll("<div id='es_market_game_list'></div>");
		$("#browseItems .market_search_sidebar_section_tip_small").append("<span style='float: right; margin-right: 11px; cursor: pointer;' id='es_market_game_toggle'>▲</span>");
		
		if (getValue("show_market_games_section")) {
			$("#es_market_game_toggle").text("▼");
			$("#es_market_game_list").hide();
		}

		$("#browseItems .market_search_sidebar_section_tip_small").on("click", function() {
			if (getValue("show_market_games_section") == true) {
				$("#es_market_game_toggle").text("▲");
				$("#es_market_game_list").slideDown();
				setValue("show_market_games_section", false);
			} else {
				$("#es_market_game_toggle").text("▼");
				$("#es_market_game_list").slideUp();
				setValue("show_market_games_section", true);
			}
		});
	}
}

function add_active_total() {
	if (window.location.pathname.match(/^\/market\/$/)) {
		
		// Give proper IDs to each relevant DOM node
		$("#my_market_listingsonhold_number").parents(".my_listing_section").attr("id", "es_listingsonhold");
		$("#my_market_listingstoconfirm_number").parents(".my_listing_section").attr("id", "es_listingsawaiting");
		$("#my_market_selllistings_number").parents(".my_listing_section").attr("id", "es_selling");
		$("#my_market_buylistings_number").parents(".my_listing_section").attr("id", "es_buying");

		// Listings on hold
		var total = 0;
		var total_after = 0;
		$("#es_listingsonhold .market_listing_row .market_listing_my_price").each(function() {
			var temp = $(this).text().trim().replace(/pуб./g,"").replace(/,(\d\d(?!\d))/g, ".$1").replace(/[^0-9(\.]+/g,"").split("(");
			total += Number(temp[0]);
			total_after += Number(temp[1]);
		});
		
		if (total != 0) {
			total = formatCurrency(parseFloat(total));
			total_after = formatCurrency(parseFloat(total_after));
			$("#es_listingsonhold .market_recent_listing_row:last").clone().appendTo($("#es_listingsonhold .market_recent_listing_row:last").parent()).attr("id", "es_listingsonhold_total");
			$("#es_listingsonhold_total").find("img").remove();
			$("#es_listingsonhold_total").find(".market_listing_edit_buttons").empty();
			$("#es_listingsonhold_total").find(".market_listing_listed_date").empty();
			$("#es_listingsonhold_total").find(".market_listing_item_name_block").empty();
			$("#es_listingsonhold_total").find(".market_table_value").css("margin-top", "3px").css("margin-bottom", "3px");
			$("#es_listingsonhold_total").find(".market_listing_price").html("<span style='color: white'>" + total + "</span><br><span style='color: #AFAFAF'>(" + total_after + ")</span></span></span><br><span class='market_listing_game_name'>" + localized_strings.hold_total + "</span>");
		}

		// Listings awaiting confirmation
		var total = 0;
		var total_after = 0;
		$("#es_listingsawaiting .market_listing_row .market_listing_my_price").each(function() {
			var temp = $(this).text().trim().replace(/pуб./g,"").replace(/,(\d\d(?!\d))/g, ".$1").replace(/[^0-9(\.]+/g,"").split("(");
			total += Number(temp[0]);
			total_after += Number(temp[1]);
		});

		
		if (total != 0) {
			total = formatCurrency(parseFloat(total));
			total_after = formatCurrency(parseFloat(total_after));
			$("#es_listingsawaiting .market_recent_listing_row:last").clone().appendTo($("#es_listingsawaiting .market_recent_listing_row:last").parent()).attr("id", "es_listingsawaiting_total");
			$("#es_listingsawaiting_total").find("img").remove();
			$("#es_listingsawaiting_total").find(".market_listing_edit_buttons").empty();
			$("#es_listingsawaiting_total").find(".market_listing_listed_date").empty();
			$("#es_listingsawaiting_total").find(".market_listing_item_name_block").empty();
			$("#es_listingsawaiting_total").find(".market_table_value").css("margin-top", "3px").css("margin-bottom", "3px");
			$("#es_listingsawaiting_total").find(".market_listing_price").html("<span style='color: white'>" + total + "</span><br><span style='color: #AFAFAF'>(" + total_after + ")</span></span></span><br><span class='market_listing_game_name'>" + localized_strings.hold_total + "</span>");
		}

		// Sell listings		
		var total = 0;
		var total_after = 0;		
		$("#es_selling .market_listing_row .market_listing_my_price").each(function() {
			var temp = $(this).text().trim().replace(/pуб./g,"").replace(/,(\d\d(?!\d))/g, ".$1").replace(/[^0-9(\.]+/g,"").split("(");
			total += Number(temp[0]);
			total_after += Number(temp[1]);
		});
		
		if (total != 0) {
			total = formatCurrency(parseFloat(total));
			total_after = formatCurrency(parseFloat(total_after));
			$("#es_selling .market_recent_listing_row:last").clone().appendTo($("#es_selling .market_recent_listing_row:last").parent()).attr("id", "es_selling_total");
			$("#es_selling_total").find("img").remove();
			$("#es_selling_total").find(".market_listing_edit_buttons").empty();
			$("#es_selling_total").find(".market_listing_listed_date").empty();
			$("#es_selling_total").find(".market_listing_item_name_block").empty();
			$("#es_selling_total").find(".market_table_value").css("margin-top", "3px").css("margin-bottom", "3px");
			$("#es_selling_total").find(".market_listing_price").html("<span style='color: white'>" + total + "</span><br><span style='color: #AFAFAF'>(" + total_after + ")</span></span></span><br><span class='market_listing_game_name'>" + localized_strings.sales_total + "</span>");
		}

		// Buy orders
		var total = 0;		
		$("#es_buying .market_listing_row").each(function() {
			var qty = $(this).find(".market_listing_my_price:last").text().trim();
			var priceEl = $(this).find(".market_listing_my_price:first .market_listing_price").contents().filter(function () {
				return this.nodeType === 3;
			});
			var price = parse_currency(priceEl.text().trim());
			total += Number(price.value) * Number(qty);
		});
		
		if (total != 0) {
			total = formatCurrency(parseFloat(total));			
			$("#es_buying .market_recent_listing_row:last").clone().appendTo($("#es_buying .market_recent_listing_row:last").parent()).attr("id", "es_buying_total");
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
				$("#tabContentsMyListings").hide();
				$("#tabMyListings").removeClass("market_tab_well_tab_active");
				$("#tabMyListings").addClass("market_tab_well_tab_inactive");
			}
		}
	});
}

// Show the lowest market price for items you're selling
function add_lowest_market_price() {
	$("#es_selling, #es_listingsonhold").find(".market_listing_table_header span:first").css("width", "200px");
	$("#es_selling, #es_listingsonhold").find(".market_listing_table_header span:first").after("<span class='market_listing_right_cell market_listing_my_price'><span class='es_market_lowest_button'>" + localized_strings.lowest + "</span></span>");
	$("#es_selling, #es_listingsonhold").find(".market_listing_row").each(function() {
		$(this).find(".market_listing_edit_buttons:first").css("width", "200px");
		$(this).find(".market_listing_edit_buttons:first").after("<div class='market_listing_right_cell market_listing_my_price market_listing_es_lowest'>&nbsp;</div>");
		$(this).find(".market_listing_edit_buttons.actual_content").appendTo($(this).find(".market_listing_edit_buttons:first")).css("width", "inherit");
	});

	function add_lowest_market_price_data(section, item_id) {
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
			$("#" + section + " .market_listing_row").each(function() {
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

	if ($("#es_listingsonhold .market_listing_row").length <= 11 ) {
		add_lowest_market_price_data("es_listingsonhold");
	} else {
		$("#es_listingsonhold .market_listing_es_lowest").html("<a class='es_market_lowest_button'><img src='//store.akamai.steamstatic.com/public/images/v6/ico/ico_cloud.png' height=24 style='vertical-align: middle;'></a>");
		$("#es_listingsonhold_total .market_listing_es_lowest").html("&nbsp;");
	}

	if ($("#es_selling .market_listing_row").length <= 11 ) {
		add_lowest_market_price_data("es_selling");
	} else {
		$("#es_selling .market_listing_es_lowest").html("<a class='es_market_lowest_button'><img src='//store.akamai.steamstatic.com/public/images/v6/ico/ico_cloud.png' height=24 style='vertical-align: middle;'></a>");
		$("#es_selling_total .market_listing_es_lowest").html("&nbsp;");
	}

	$(".es_market_lowest_button").click(function() {
		add_lowest_market_price_data("ind", $(this).parent().parent().attr("id"));
	});
}

function add_badge_page_link() {
	var badgeAppID = document.URL.match("(?:\/753\/)([0-9]+)(?=-)");
	if (badgeAppID[1]) {
		var badgeAppID = badgeAppID[1];
		var cardType = "";
		if (document.URL.endsWith("%20%28Foil%29")) {
			cardType = "?border=1";
		}
		$("div.market_listing_nav").append('<a class="btn_grey_grey btn_medium" target="_blank" href="//steamcommunity.com/my/gamecards/' + badgeAppID + cardType +'" style="float: right; margin-top: -10px;"><span><img src="//store.akamai.steamstatic.com/public/images/v6/ico/ico_cards.png" style="margin: 7px 0px;" width="24" height="16" border="0" align="top">&nbsp; ' + localized_strings.view_badge + '</span></a>');
	}
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

// Source: https://greasyfork.org/en/scripts/12228-setmutationhandler/code
function setMutationHandler(baseNode, selector, cb, options) {
	var ob = new MutationObserver(function(mutations) {
		for (var i=0, ml=mutations.length, m; (i<ml) && (m=mutations[i]); i++)
			switch (m.type) {
				case 'childList':
					if (m.addedNodes[0] && m.addedNodes[0].nodeType == 3) { // Node.TEXT_NODE
						if (m.target.matches(selector) && !cb.call(ob, [m.target], m))
							return;
						//continue; // commented as it seems to break the code...
					}
					for (var j=0, nodes=m.addedNodes, nl=nodes.length, n; (j<nl) && (n=nodes[j]); j++)
						if (n.nodeType == 1) 
							if ((n = n.matches(selector) ? [n] : n.querySelectorAll(selector)) && n.length)
								if (!cb.call(ob, Array.prototype.slice.call(n), m))
									return;
					break;
				case 'attributes':
					if (m.target.matches(selector) && !cb.call(ob, [m.target], m))
						return;
					break;
				case 'characterData':
					if (m.target.parentNode && m.target.parentNode.matches(selector) && !cb.call(ob, [m.target.parentNode], m))
						return;
					break;
			}
	});
	ob.observe(baseNode, options || {subtree:true, childList:true}); 
	return ob;
}

function inventory_market_prepare() {
	runInPageContext(`function(){
		$J(document).on("click", ".inventory_item_link, .newitem", function(){
			if (!g_ActiveInventory.selectedItem.description.market_hash_name) {
				g_ActiveInventory.selectedItem.description.market_hash_name = g_ActiveInventory.selectedItem.description.name
			}
			window.postMessage({
				type: "es_sendmessage",
				information: [
					iActiveSelectView, 
					g_ActiveInventory.selectedItem.description.marketable,
					g_ActiveInventory.appid,
					g_ActiveInventory.selectedItem.description.market_hash_name,
					(g_ActiveInventory.selectedItem.description.market_hash_name.match(/^([0-9]+)\-/) || [])[1],
					g_ActiveInventory.selectedItem.description.type,
					g_ActiveInventory.selectedItem.assetid,
					g_sessionID,
					g_ActiveInventory.selectedItem.contextid,
					g_rgWalletInfo.wallet_currency,
					g_ActiveInventory.m_owner.strSteamId,
					g_ActiveInventory.selectedItem.description.market_marketable_restriction
				]
			}, "*");
		});
	}`);

	window.addEventListener("message", function(event) {
		if (event.source !== window) return;
		if (event.data.type && (event.data.type === "es_sendmessage")) { inventory_market_helper(event.data.information); }
		if (event.data.type && (event.data.type == "es_sendfee_" + assetID)) { 
			var sell_price = event.data.information.amount - event.data.information.fees;
			$.ajax({
				url: "https://steamcommunity.com/market/sellitem/",
				type: "POST",
				data: {
					"sessionid": event.data.sessionID,
					"appid": event.data.global_id,
					"contextid": event.data.contextID,
					"assetid": event.data.assetID,
					"amount": 1,
					"price": sell_price
				},
				crossDomain: true,
				xhrFields: { withCredentials: true }
			}).complete(function(data){
				$("#es_instantsell" + event.data.assetID).parent().slideUp();
				$("#" + event.data.global_id + "_" + event.data.contextID + "_" + event.data.assetID).addClass("btn_disabled activeInfo").css("pointer-events", "none");
			});
		}
	}, false);
}

function inventory_market_helper(response) {
	var html = "",
		item = response[0],
		marketable = response[1],
		global_id = response[2],
		hash_name = response[3],
		appid = response[4];
		assetID = response[6],
		sessionID = response[7],
		contextID = response[8];
		wallet_currency = response[9],
		owner_steamid = response[10],
		restriction = response[11],
		is_gift = response[5] && /Gift/i.test(response[5]),
		is_booster = hash_name && /Booster Pack/i.test(hash_name),
		owns_inventory = (owner_steamid === is_signed_in);

	var thisItem = "#" + global_id +"_"+ contextID +"_"+ assetID;
	var $sideActs = $("#iteminfo" + item + "_item_actions");
	var $sideMarketActs = $("#iteminfo" + item + "_item_market_actions");

	// Set as background option
	var $viewFullBtn = $sideActs.find("a").first();
	if (owns_inventory && $(".inventory_links").length && !$sideActs.find(".es_set_background").length && /public\/images\/items/.test($viewFullBtn.attr("href"))) {
		$viewFullBtn.after('<a class="es_set_background btn_small btn_darkblue_white_innerfade' + ($(thisItem).hasClass('es_isset_background') ? " btn_disabled" : "") + '"><span>' + localized_strings.set_as_background + '</span></a><img class="es_background_loading" src="//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif">');
		
		$(".es_set_background").on("click", function(e){
			e.preventDefault();

			var el = $(this);

			// Do nothing if loading or already done
			if (!$(".es_background_loading").is(":visible") && !$(el).hasClass("btn_disabled")) {
				$(".es_background_loading").show();
				$(".es_isset_background").removeClass("es_isset_background");
				$(thisItem).addClass("es_isset_background");

				get_http(profile_url + "/edit", function(txt){
					// Make sure the background we are trying to set is not set already
					var currentBg = txt.match(/SetCurrentBackground\( {\"communityitemid\":\"(\d+)\"/i),
						currentBg = currentBg ? currentBg[1] : false;
					if (currentBg !== assetID) {
						var rHtml = $.parseHTML(txt);
						$(rHtml).find("#profile_background").attr("value", assetID);
						var sData = $(rHtml).find("#editForm").serializeArray();
						$.ajax({url: profile_url + "/edit",
								type: "POST",
								data: sData,
								xhrFields: {withCredentials: true}
						}).done(function(txt){
							// Check if it was truly a succesful change
							if (/"saved_changes_msg"/i.test(txt)) {
								$(el).addClass("btn_disabled");
							}
						}).complete(function(){
							$(".es_background_loading").fadeOut("fast");
						});
					} else {
						$(el).addClass("btn_disabled");
						$(".es_background_loading").fadeOut("fast");
					}
				}, { xhrFields: {withCredentials: true} });
			}
		});
	}

	// Show prices for gifts
	if (is_gift) {
		$("#es_item" + item).remove();
		if ($sideActs.find("a").length > 0) {
			var link = $sideActs.find("a")[0].href;
			var gift_appid = get_appid(link); // || get_subid(link);

			// TODO: Add support for package(sub)
			if (gift_appid) {
				get_http("//store.steampowered.com/api/appdetails/?appids=" + gift_appid + "&filters=price_overview", function(txt) {
					var data = JSON.parse(txt);
					if (data[gift_appid].success && data[gift_appid]["data"]["price_overview"]) {
						var currency = data[gift_appid]["data"]["price_overview"]["currency"];
						var discount = data[gift_appid]["data"]["price_overview"]["discount_percent"];
						var price = formatCurrency(data[gift_appid]["data"]["price_overview"]["final"] / 100, currency);

						$sideActs.css("height", "50px");
						if (discount > 0) {
							var original_price = formatCurrency(data[gift_appid]["data"]["price_overview"]["initial"] / 100, currency);
							$sideActs.append("<div class='es_game_purchase_action' style='float: right;'><div class='es_game_purchase_action_bg'><div class='es_discount_block es_game_purchase_discount'><div class='es_discount_pct'>-" + discount + "%</div><div class='es_discount_prices'><div class='es_discount_original_price'>" + original_price + "</div><div class='es_discount_final_price'>" + price + "</div></div></div></div>");
						} else {
							$sideActs.append("<div class='es_game_purchase_action' style='float: right;'><div class='es_game_purchase_action_bg'><div class='es_game_purchase_price es_price'>" + price + "</div></div>");
						}	
					}
				});
			}
		}
	} else {
		if (owns_inventory) {
			// If is a booster pack add the average price of three cards
			if (is_booster) {
				var $sideMarketActsDiv = $sideMarketActs.find("div").last().css("margin-bottom", "8px"),
					dataCardsPrice = $(thisItem).data("cards-price");

				$(`#iteminfo${ item }_item_owner_actions`).prepend(`
					<a class="btn_small btn_grey_white_innerfade" href="//steamcommunity.com/my/gamecards/${ appid }/"><span>${ localized_strings.badge_progress }</span></a>
				`);

				// Monitor for when the price and volume are added
				setMutationHandler(document, ".item_market_actions div:last-child br:last-child", function(){
					if (dataCardsPrice) {
						$sideMarketActsDiv.append(localized_strings.avg_price_3cards + ": " + dataCardsPrice + "<br>");
					} else {
						var api_url = "//api.enhancedsteam.com/market_data/average_card_price/?appid=" + appid + "&cur=" + user_currency.toLowerCase();

						get_http(api_url, function(price_data) {
							var booster_price = formatCurrency(parseFloat(price_data,10) * 3);

							$(thisItem).data("cards-price", booster_price);
							$sideMarketActsDiv.append(localized_strings.avg_price_3cards + ": " + booster_price + "<br>");
						});
					}

					this.disconnect();
				});
			}

			storage.get(function(settings) {
				// 1-Click turn into gems option
				if (settings.show1clickgoo === undefined) { settings.show1clickgoo = true; storage.set({'show1clickgoo': settings.show1clickgoo}); }
				if (settings.show1clickgoo) {
					var turn_word = $("#iteminfo" + item + "_item_scrap_link span").text();

					$("#es_quickgrind").parent().remove();
					$("#iteminfo" + item + "_item_scrap_actions").find("div:last").before("<div><a class='btn_small btn_green_white_innerfade' id='es_quickgrind' appid='" + appid + "' assetid='" + assetID + "'><span>1-Click " + turn_word + "</span></div>");

					// TODO: Add prompt?
					$("#es_quickgrind").on("click", function() {
						runInPageContext(`function() {
							var rgAJAXParams = {
								sessionid: g_sessionID,
								appid: ` + $(this).attr("appid") + `,
								assetid: ` + $(this).attr("assetID") + `,
								contextid: 6
							};
							var strActionURL = g_strProfileURL + '/ajaxgetgoovalue/';
							$J.get( strActionURL, rgAJAXParams ).done( function( data ) {
								strActionURL = g_strProfileURL + '/ajaxgrindintogoo/';
								rgAJAXParams.goo_value_expected = data.goo_value;
								$J.post( strActionURL, rgAJAXParams).done( function( data ) {
									ReloadCommunityInventory();
								});
							});
						}`);
					});
				}

				// Quick sell options
				if (settings.quickinv === undefined) { settings.quickinv = true; storage.set({'quickinv': settings.quickinv}); }
				if (settings.quickinv_diff === undefined) { settings.quickinv_diff = -0.01; storage.set({'quickinv_diff': settings.quickinv_diff}); }
				if (settings.quickinv) {
					if (marketable && contextID == 6 && global_id == 753) {
						// Replace the "Sell" button
						$sideMarketActs.find("a.item_market_action_button").replaceWith("<a class='btn_small btn_green_white_innerfade es_market_btn' id='es_sell' href='javascript:SellCurrentSelection()'><span>" + $sideMarketActs.find(".item_market_action_button_contents").text() + "</span></a>");

						if (!$(thisItem).hasClass("es-loading")) {
							var url = $sideMarketActs.find("a")[0].href;

							$(thisItem).addClass("es-loading");

							// Add the links with no data, so we can bind actions to them, we add the data later
							$sideMarketActs.append("<a style='display:none' class='btn_small btn_green_white_innerfade es_market_btn' id='es_quicksell" + assetID + "'></a>");
							$sideMarketActs.append("<a style='display:none' class='btn_small btn_green_white_innerfade es_market_btn' id='es_instantsell" + assetID + "'></a>");

							// Check if price is stored in data
							if ($(thisItem).hasClass("es-price-loaded")) {
								var price_high = $(thisItem).data("price-high"),
									price_low = $(thisItem).data("price-low");

								// Add Quick Sell button
								if (price_high) {
									$("#es_quicksell" + assetID).attr("price", price_high).html("<span>" + localized_strings.quick_sell.replace("__amount__", formatCurrency(price_high, currency_number_to_type(wallet_currency))) + "</span>").show().before("<br class='es-btn-spacer'>");
								}
								// Add Instant Sell button
								if (price_low) {
									$("#es_instantsell" + assetID).attr("price", price_low).html("<span>" + localized_strings.instant_sell.replace("__amount__", formatCurrency(price_low, currency_number_to_type(wallet_currency))) + "</span>").show().before("<br class='es-btn-spacer'>");
								}

								$(thisItem).removeClass("es-loading");
							} else {
								get_http(url, function(txt) {
									var market_id = txt.match(/Market_LoadOrderSpread\( (\d+) \)/);

									if (market_id) {
										market_id = market_id[1];

										get_http("//steamcommunity.com/market/itemordershistogram?language=english&currency=" + wallet_currency + "&item_nameid=" + market_id, function(market_txt) {
											var market = JSON.parse(market_txt),
												price_high = parseFloat(market.lowest_sell_order / 100) + parseFloat(settings.quickinv_diff),
												price_low = market.highest_buy_order / 100;

											if (price_high < 0.03) price_high = 0.03;
											price_high = parseFloat(price_high).toFixed(2);
											price_low = parseFloat(price_low).toFixed(2);

											// Store prices as data
											if (price_high > price_low) {
												$(thisItem).data("price-high", price_high);
											}
											if (market.highest_buy_order) {
												$(thisItem).data("price-low", price_low);
											}
											// Fixes multiple buttons
											if ($(".item.activeInfo").is($(thisItem))) {
												$(thisItem).addClass("es-price-loaded");
												// Add "Quick Sell" button
												if (price_high > price_low) {
													$("#es_quicksell" + assetID).attr("price", price_high).html("<span>" + localized_strings.quick_sell.replace("__amount__", formatCurrency(price_high, currency_number_to_type(wallet_currency))) + "</span>").show().before("<br class='es-btn-spacer'>");
												}
												// Add "Instant Sell" button
												if (market.highest_buy_order) {
													$("#es_instantsell" + assetID).attr("price", price_low).html("<span>" + localized_strings.instant_sell.replace("__amount__", formatCurrency(price_low, currency_number_to_type(wallet_currency))) + "</span>").show().before("<br class='es-btn-spacer'>");
												}
											}
										}).complete(function(){
											$(thisItem).removeClass("es-loading");
										});
									}
								});
							}
						}

						// Bind actions to "Quick Sell" and "Instant Sell" buttons
						$("#es_quicksell" + assetID + ", #es_instantsell" + assetID).on("click", function(e){
							e.preventDefault();

							var sell_price = $(this).attr("price") * 100;
							$("#es_sell, #es_quicksell" + assetID + ", #es_instantsell" + assetID).addClass("btn_disabled").css("pointer-events", "none");
							$sideMarketActs.find("div").first().html("<div class='es_loading' style='min-height: 66px;'><img src='//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif'><span>" + localized_strings.selling + "</div>");

							runInPageContext("function() { var fee_info = CalculateFeeAmount(" + sell_price + ", 0.10); window.postMessage({ type: 'es_sendfee_" + assetID + "', information: fee_info, sessionID: '" + sessionID + "', global_id: '" + global_id + "', contextID: '" + contextID + "', assetID: '" + assetID + "' }, '*'); }");
						});
					}
				}
			});

			// Item in user's inventory is not marketable due to market restriction
			if (restriction > 0 && marketable == 0) {
				var dataLowest = $(thisItem).data("lowest-price"),
					dataSold = $(thisItem).data("sold-volume");

				$sideMarketActs.show().html("<img class='es_loading' src='//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif' />");

				// "View in market" link
				html += '<div style="height: 24px;"><a href="//steamcommunity.com/market/listings/' + global_id + '/' + encodeURI(hash_name) + '">' + localized_strings.view_in_market + '</a></div>';

				// Check if price is stored in data
				if (dataLowest) {
					html += '<div style="min-height: 3em; margin-left: 1em;">';

					if (dataLowest !== "nodata") {
						html += localized_strings.starting_at + ': ' + dataLowest;
						// Check if volume is stored in data
						if (dataSold) {
							html += '<br>' + localized_strings.last_24.replace("__sold__", dataSold);
						}
					} else {
						html += localized_strings.no_price_data;
					}

					html += '</div>';

					$sideMarketActs.html(html);
				} else {
					get_http("//steamcommunity.com/market/priceoverview/?currency=" + currency_type_to_number(user_currency) + "&appid=" + global_id + "&market_hash_name=" + encodeURI(hash_name), function(txt) {
						var data = JSON.parse(txt);

						html += '<div style="min-height: 3em; margin-left: 1em;">';

						if (data && data.success) {
							$(thisItem).data("lowest-price", data.lowest_price || "nodata");
							if (data.lowest_price) {
								html += localized_strings.starting_at + ': ' + data.lowest_price;
								if (data.volume) { 
									$(thisItem).data("sold-volume", data.volume);
									html += '<br>' + localized_strings.last_24.replace("__sold__", data.volume);
								}
							} else {
								html += localized_strings.no_price_data;
							}
						} else {
							html += localized_strings.no_price_data;
						}

						html += '</div>';

						$sideMarketActs.html(html);
					}).fail(function(){ // At least show the "View in Market" link
						$sideMarketActs.html(html);
					});
				}
			}
		}
		// If is not own inventory but the item is marketable then we need to build the HTML for showing info
		else if (marketable) {
			var dataLowest = $(thisItem).data("lowest-price"),
				dataSold = $(thisItem).data("sold-volume");

			$sideMarketActs.show().html("<img class='es_loading' src='//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif' />");

			// "View in market" link
			html += '<div style="height: 24px;"><a href="//steamcommunity.com/market/listings/' + global_id + '/' + encodeURI(hash_name) + '">' + localized_strings.view_in_market + '</a></div>';

			// Check if price is stored in data
			if (dataLowest) {
				html += '<div style="min-height: 3em; margin-left: 1em;">';

				if (dataLowest !== "nodata") {
					html += localized_strings.starting_at + ': ' + dataLowest;
					// Check if volume is stored in data
					if (dataSold) {
						html += '<br>' + localized_strings.last_24.replace("__sold__", dataSold);
					}
				} else {
					html += localized_strings.no_price_data;
				}

				html += '</div>';

				$sideMarketActs.html(html);
			} else {
				get_http("//steamcommunity.com/market/priceoverview/?currency=" + currency_type_to_number(user_currency) + "&appid=" + global_id + "&market_hash_name=" + encodeURI(hash_name), function(txt) {
					var data = JSON.parse(txt);

					html += '<div style="min-height: 3em; margin-left: 1em;">';

					if (data && data.success) {
						$(thisItem).data("lowest-price", data.lowest_price || "nodata");
						if (data.lowest_price) {
							html += localized_strings.starting_at + ': ' + data.lowest_price;
							if (data.volume) { 
								$(thisItem).data("sold-volume", data.volume);
								html += '<br>' + localized_strings.last_24.replace("__sold__", data.volume);
							}
						} else {
							html += localized_strings.no_price_data;
						}
					} else {
						html += localized_strings.no_price_data;
					}

					html += '</div>';

					$sideMarketActs.html(html);
				}).fail(function(){ // At least show the "View in Market" link
					$sideMarketActs.html(html);
				});
			}
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
					/*var pricematch = $("#market_sell_buyercurrency_input").val().match(pricepattern);
					if (pricematch) {
						var sell_price = parseFloat((pricematch[1] || "").replace(/[^\d]/, "") + "." + (pricematch[4] || 0)) * 100;
					} else {
						return;
					}*/

					$("#es_relist_confirm").hide();
					$(".market_sell_dialog_input_group").hide();
					$("#market_removelisting_dialog_accept_throbber").show();
					
					runInPageContext("function() { var sessionid = g_sessionID; var fee = CalculateFeeAmount (GetPriceValueAsInt($J('#market_sell_buyercurrency_input').val()), 0.10); window.postMessage({ type: 'es_relist', information: [sessionid, fee] }, '*'); }");
					window.addEventListener("message", function(event) {
						if (event.source != window)	return;
						if (event.data.type && (event.data.type == "es_relist")) { 
							var sessionid = event.data.information[0],
								fee = event.data.information[1],
								sell_price = fee.amount - fee.fees,
								item_link = $("#market_removelisting_dialog_itemname a").attr("href"),
								item_page = $(".market_listing_item_name_block .market_listing_item_name_link[href$='" + item_link + "']"),
								item_remove = $(item_page).parent().parent().parent().find(".market_listing_cancel_button a").attr("href"),
								matches = item_remove.match(/'mylisting', '(\d+)', (\d+), '(\d+)', '(\d+)'/);

							//console.log(sell_price, fee);
							
							if (matches) {
								var listingid = matches[1],
									appid = matches[2],
									contextid = matches[3],
									itemid = matches[4];
								$.ajax({
									url: "https://steamcommunity.com/market/removelisting/" + listingid,
									type: "POST",
									data: {
										"sessionid": sessionid
									}
								}).done(function(){
									$.ajax({
										url: "https://steamcommunity.com/market/sellitem/",
										type: "POST",
										data: {
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
		var separator = $(this).next('div[class^="games_list_tab_"]'),
			number_element = $(this).find('span.games_list_tab_number').first(),
			items_number = number_element.length ? parseInt(number_element.text().replace(/[^0-9]+/g, '')) : 0;

		$(this).removeClass('first_tab fourth_tab');

		if (items_number == 0) {
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
		if (settings.showinvnav === undefined) { settings.showinvnav = true; storage.set({'showinvnav': settings.showinvnav}); }
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
				 "  var nPageWidth = this.m_$Inventory.children('.inventory_page:first').width();",
				 "	var iCurPage = this.m_iCurrentPage;",
				 "	var iNextPage = Math.min(Math.max(0, --page), this.m_cPages-1);",
				 "  var iPages = this.m_cPages",
				 "  var _this = this;",
				 "  if (iCurPage < iNextPage) {",
				 "    if (iCurPage < iPages - 1) {",
				 "      this.PrepPageTransition( nPageWidth, iCurPage, iNextPage );",
				 "      this.m_$Inventory.css( 'left', '0' );",
				 "      this.m_$Inventory.animate( {left: -nPageWidth}, 250, null, function() { _this.FinishPageTransition( iCurPage, iNextPage ); } );",
				 "    }",
				 "  } else if (iCurPage > iNextPage) {",
				 "    if (iCurPage > 0) {",
				 "      this.PrepPageTransition( nPageWidth, iCurPage, iNextPage );",
				 "      this.m_$Inventory.css( 'left', '-' + nPageWidth + 'px' );",
				 "      this.m_$Inventory.animate( {left: 0}, 250, null, function() { _this.FinishPageTransition( iCurPage, iNextPage ); } );",
				 "    }",
				 "  }",
				 "}",
				 "function InventoryLastPage(){",
				 "	g_ActiveInventory.GoToPage(g_ActiveInventory.m_cPages);",
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
			
			var es_pagebtn_observer = new MutationObserver(function(mutations) {
				mutations.forEach(function(mutation) {
					if ($(mutation.target).attr("id") == "pagebtn_next" && mutation.attributeName === 'class') {
						if ($(mutation.target).hasClass("disabled")) {
							$("#pagebtn_last").addClass("disabled");
						} else {
							$("#pagebtn_last").removeClass("disabled");
						}
					}
					if ($(mutation.target).attr("id") == "pagebtn_previous" && mutation.attributeName === 'class') {
						if ($(mutation.target).hasClass("disabled")) {
							$("#pagebtn_first").addClass("disabled");
						} else {
							$("#pagebtn_first").removeClass("disabled");
						}
					}
				});
			});
			es_pagebtn_observer.observe($('#pagebtn_next')[0], { attributes: true });
			es_pagebtn_observer.observe($('#pagebtn_previous')[0], { attributes: true });

			// Go to first page
			$("#pagebtn_previous").after("<a href='javascript:InventoryFirstPage();' id='pagebtn_first' class='pagebtn pagecontrol_element disabled'><<</a>");

			// Go to last page
			$("#pagebtn_next").before("<a href='javascript:InventoryLastPage();' id='pagebtn_last' class='pagebtn pagecontrol_element'>>></a>");

			$(".pagebtn").css({"padding": "0", "width": "32px", "margin": "0 3px" });
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
			goto_btn.textContent = localized_strings.go;
			goto_btn.id = "gotopage_btn";
			goto_btn.classList.add("pagebtn");
			goto_btn.href = "javascript:InventoryGoToPage();";
			goto_btn.style.width = "32px";
			goto_btn.style.padding = "0";
			goto_btn.style.margin = "0 6px";
			goto_btn.style.textAlign = "center";
			$(page_go).append(goto_btn);

			$("#inventory_pagecontrols").before(page_go);
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
		storage.get(function(settings) {
			if (settings.show_badge_progress === undefined) { settings.show_badge_progress = true; storage.set({'show_badge_progress': settings.show_badge_progress}); }
			if (settings.show_badge_progress && $(".icon").find('img[src$="/ico_cards.png"]').length) {
				$("head").append('<link rel="stylesheet" type="text/css" href="//cdn.steamcommunity.com/public/css/skin_1/badges.css">');

				$("#category_block").after(`
					<div class="es_badges_progress_block block" style="display: none;">
						<div class="block_header">
							<h4>${ localized_strings.badge_progress }</h4>
						</div>
						<div class="block_content_inner">
							<div class="es_normal_badge_progress es_progress_block" style="display: none;"></div>
							<div class="es_foil_badge_progress es_progress_block" style="display: none;"></div>
						</div>
					</div>
				`);

				$(".es_normal_badge_progress").load("//steamcommunity.com/my/gamecards/" + appid + "/ .badge_current", function(responseText) {
					display_badge_info(responseText, this);
				});

				$(".es_foil_badge_progress").load("//steamcommunity.com/my/gamecards/" + appid + "/?border=1 .badge_current", function(responseText) {
					display_badge_info(responseText, this);
				});

				function display_badge_info(responseText, blockSel) {
					var $responseText = $(responseText);

					if ($responseText.find(".friendPlayerLevelNum").length != 1) {
						var card_num_owned = $responseText.find(".badge_detail_tasks .owned").length,
							card_num_total = $responseText.find(".badge_detail_tasks .badge_card_set_card").length,
							progress_text_length = $responseText.find(".gamecard_badge_progress").text().trim().length,
							next_level_empty_badge = $responseText.find(".gamecard_badge_progress .badge_info").length,
							show_card_num = (card_num_owned > 0 && progress_text_length == 0) || (card_num_owned > 0 && !badge_completed),
							badge_completed = (progress_text_length > 0 && next_level_empty_badge == 0),
							isNormalBadge = $(blockSel).is(".es_normal_badge_progress");

						if (isNormalBadge || (card_num_owned > 0 || !$(blockSel).find(".badge_empty_circle").length)) {
							$(".es_badges_progress_block").show();

							$(blockSel).show().append(`
								<div class="es_cards_numbers">
									<div class="es_cards_remaining">${ $responseText.find(".progress_info_bold").text() }</div>
								</div>
								<div class="game_area_details_specs">
									<div class="icon"><img src="//store.akamai.steamstatic.com/public/images/v6/ico/ico_cards.png" width="24" height="16" border="0" align="top"></div>
									<a href="//steamcommunity.com/my/gamecards/${ appid + (isNormalBadge ? `/` : `?border=1`) }" class="name">${ badge_completed ? localized_strings.view_badge : localized_strings.view_badge_progress }</a>
								</div>
							`);

							if (show_card_num) {
								$(blockSel).find(".es_cards_numbers").append(`
									<div class="es_cards_owned">${ localized_strings.cards_owned.replace("__owned__", card_num_owned).replace("__possible__", card_num_total) }</div>
								`);
							}

							$(blockSel).find(".badge_empty_right div:last-child").addClass("badge_empty_name").prop("style", "").text(localized_strings.badge_not_unlocked);
						}
					} else {
						$(blockSel).remove();
					}
				}
			}
		});
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

function add_astats_link(appid) {
	storage.get(function(settings) {
		if (settings.showastatslink === undefined) { settings.showastatslink = true; storage.set({'showastatslink': settings.showastatslink}); }
		if (settings.showastatslink) {
			$("#achievement_block").append("<div class='game_area_details_specs'><div class='icon'><img src='" + chrome.extension.getURL("img/ico/astatsnl.png") + "' style='margin-left: 4px; width: 16px;'></div><a class='name' href='http://astats.astats.nl/astats/Steam_Game_Info.php?AppID=" + appid + "' target='_blank'><span>" + localized_strings.view_astats + "</span></a>");
		}
	});
}

function add_achievement_completion_bar(appid) {
	storage.get(function(settings) {
		if (settings.showachinstore === undefined) { settings.showachinstore = true; storage.set({'showachinstore': settings.showachinstore}); }
		if (settings.showachinstore) {
			$(".myactivity_block").find(".details_block:first").after("<link href='http://steamcommunity-a.akamaihd.net/public/css/skin_1/playerstats_generic.css' rel='stylesheet' type='text/css'><div id='es_ach_stats' style='margin-bottom: 9px; margin-top: -16px; float: right;'></div>");
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
	});
}

var ea_promise = (function() {
	var deferred = new $.Deferred();

	var ea_cache = getValue("ea_appids");
	if (ea_cache) {
		//console.info("EA cache was hit!")
		deferred.resolve(ea_cache);
	}

	// Check if cache needs updating
	var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
	var last_updated = getValue("ea_appids_time") || expire_time - 1;

	// Update cache in the background
	if (last_updated < expire_time) {
		//console.info("EA cache needs to be updated...");
		// If no cache exists, pull the data from the website
		get_http("//api.enhancedsteam.com/early_access/", function(txt) {
			early_access_data = JSON.parse(txt);
			setValue("ea_appids", early_access_data);
			setValue("ea_appids_time", parseInt(Date.now() / 1000, 10));
			
			//console.info("EA cache update was succesful!");
			deferred.resolve(early_access_data);
		}).fail(function(){
			//console.info("EA cache update failed!");
			deferred.reject();
		});
	}

	return deferred.promise();
})();

// Check for Early Access titles
function check_early_access(node, selector_modifier) {
	storage.get(function(settings) {
		if (settings.show_early_access === undefined) { settings.show_early_access = true; storage.set({'show_early_access': settings.show_early_access}); }
		if (settings.show_early_access) {
			$(node).not(".es_ea_checked").each(function(i, node) {
				$(node).addClass("es_ea_checked");

				ea_promise.done(function(early_access_data){
					if (typeof early_access_data !== "object") {
						early_access_data = JSON.parse(early_access_data);
					}
					if (early_access_data) {
						var href = ($(node).find("a").attr("href") || $(node).attr("href")),
							imgHeader = $(node).find("img" + (selector_modifier ? selector_modifier : "")),
							appid = get_appid(href) || (imgHeader.length && /\/apps\/(\d+)\//.test(imgHeader[0].src) && imgHeader[0].src.match(/\/apps\/(\d+)\//)[1]);

						if (appid && early_access_data["ea"].indexOf(appid) >= 0) {
							var image_name = "img/overlay/early_access_banner_english.png";
							if (["brazlian", "french", "italian", "japanese", "koreana", "polish", "portuguese", "russian", "schinese", "spanish", "tchinese", "thai"].indexOf(language) > -1) { image_name = "img/overlay/early_access_banner_" + language + ".png"; }
							$(node).addClass("es_early_access");
							$(imgHeader).wrap('<span class="es_overlay_container" />').before('<span class="es_overlay"><img title="' + localized_strings.early_access + '" src="' + chrome.extension.getURL(image_name) + '" /></span>');
						}
					}
				});
			});
		}
	});
}

function add_wishlist_search() {
	// Simply use Valve's function for filtering and we just provide the games list
	runInPageContext(`function () {
		$J("#tabs_basebg").prepend('<div class="es_games_filter">` + localized_strings.filter_games + ` <div class="gray_bevel for_text_input"><input type="text" id="gameFilter" name="gameFilter"></div></div>');
		$J("#gameFilter").on("keyup", function () {
			if (typeof rgGames === "undefined") {
				rgGames = [];
				$J(".wishlistRow").each(function (id, node) {
					var appName = $J(node).find("h4.ellipsis").text(),
						appId = node.id.replace("game_", "");
					rgGames.push({"name": appName, "appid": appId});
				});
			}
			filterApps();
		});
	}`);
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
							check_early_access(".game_header_image_ctn, .small_cap");
							break;
						case /^\/(?:genre|browse|tag)\/.*/.test(window.location.pathname):
							check_early_access(".tab_item", ":last");
							check_early_access(`.special_tiny_cap,
												.cluster_capsule,
												.game_capsule,
												.browse_tag_game,
												.dq_item:not(:first-child),
												.discovery_queue:not(:first-child)`);
							break;
						case /^\/search\/.*/.test(window.location.pathname):
							check_early_access(".search_result_row");
							break;
						case /^\/recommended/.test(window.location.pathname):
							check_early_access(`.friendplaytime_appheader,
												.header_image,
												.appheader,
												.recommendation_carousel_item .carousel_cap,
												.game_capsule,
												.game_capsule_area,
												.similar_grid_capsule`);
							break;
						case /^\/tag\/.*/.test(window.location.pathname):
							check_early_access(`.cluster_capsule,
												.tab_row,
												.browse_tag_game_cap`);
							break;
						case /^\/$/.test(window.location.pathname):
							$(".home_smallcap").each(function(index, value) { $(this).find("img").wrap("<div class='es-img-prep' href='" + $(this).attr("href") + "'></div>"); });
							check_early_access($(".home_smallcap").find(".es-img-prep"));
							check_early_access(`.cap,
												.special,
												.game_capsule,
												.cluster_capsule,
												.recommended_spotlight_ctn,
												.curated_app_link,
												.dailydeal_ctn a`);
							check_early_access(".tab_item", ":last");
							
							//Sales fields
							check_early_access(".large_sale_caps a, .small_sale_caps a, .spotlight_img");
							check_early_access($(".sale_capsule_image").parent());
							break;
					}
				case "steamcommunity.com":
					switch(true) {
						// wishlist, games, and followedgames can be combined in one regex expresion
						case /^\/(?:id|profiles)\/.+\/wishlist/.test(window.location.pathname):
							check_early_access(".gameListRowLogo");
							break;
						case /^\/(?:id|profiles)\/(.+)\/games/.test(window.location.pathname):
							check_early_access(".gameListRowLogo");
							break;
						case /^\/(?:id|profiles)\/(.+)\/followedgames/.test(window.location.pathname):
							check_early_access(".gameListRowLogo");
							break;
						case /^\/(?:id|profiles)\/.+\/\b(home|myactivity|status)\b/.test(window.location.pathname):
							check_early_access(".blotter_gamepurchase_content a");
							break;
						case /^\/(?:id|profiles)\/.+\/\b(reviews|recommended)\b/.test(window.location.pathname):
							check_early_access(".leftcol");
							break;
						case /^\/(?:id|profiles)\/.+/.test(window.location.pathname):
							check_early_access(`.game_info_cap,
												.showcase_gamecollector_game,
												.favoritegame_showcase_game`);
							break;
						case /^\/app\/.*/.test(window.location.pathname):
							if ($(".apphub_EarlyAccess_Title").length > 0) {
								// using span instead of a div makes the banner proportions correct
								var logo = $(".apphub_StoreAppLogo:first").wrap(
									"<span id='es_ea_apphub'><a href='" + window.location.href + "'></a></span>"
								);
								check_early_access("#es_ea_apphub");
							}
					}
			}
		}
	});
}

function init_hd_player() {
	var addedHdOpts = false;

	// Initiate the HD options only when "Autoplay" is active or when selecting a video
	if (getCookie("bGameHighlightAutoplayDisabled") === "false") {
		add_hd_options();
	} else {
		$("video.highlight_movie").on("loadedmetadata", function(){
			setTimeout(function(){ // prevents a bug in Chrome which causes videos to stop playing after changing the src
				add_hd_options();
			}, 150);

			$("video.highlight_movie").off("loadedmetadata");
		});
	}

	function add_hd_options() {
		if (!addedHdOpts) {
			addedHdOpts = true;

			var playInHD = getValue("playback_hd");

			// Add "HD" button and "sd-src" to all videos and set definition
			$("video.highlight_movie").each(function(i, videoControl){
				if ($(videoControl).data("hd-src")) {
					$(videoControl).data("sd-src", videoControl.src);
					$(videoControl).parent().find(".time").after('<div class="es_hd_toggle"><span>HD</span></div>');
				}

				toggle_video_definition( videoControl, playInHD );
			});

			// When the "HD" button is clicked change the definition for all videos accordingly
			$(document).on("click", ".es_hd_toggle", function(){
				var videoControl = $(this).closest("div.highlight_movie").find("video")[0],
					playInHD = toggle_video_definition( videoControl );

				$("video.highlight_movie").not(videoControl).each(function(){
					toggle_video_definition( $(this)[0], playInHD );
				});

				setValue("playback_hd", playInHD);
			});

			// When the slider is expanded first time after the page was loaded set videos definition to HD
			$(document).one("click", ".es_slider_toggle", function(){
				if ($(this).hasClass("es_expanded")) {
					$("video.highlight_movie.es_video_sd").each(function(){
						toggle_video_definition( $(this)[0], true );
					});

					setValue("playback_hd", true);
				}
			});

			// When fullscreen button is pressed first time the definition is set to HD
			// so we set the definition indicator to HD also, but don't save the setting
			$(".fullscreen_button").on("click", function(){
				var $videoCntr = $(this).closest("div.highlight_movie");

				$videoCntr.removeClass("es_playback_sd").addClass("es_playback_hd");
				$videoCntr.find("video.highlight_movie").removeClass("es_video_sd").addClass("es_video_hd");
				$(this).off("click");
			});
		}
	}

	function toggle_video_definition(videoControl, setHD) {
		var videoIsVisible = $(videoControl).parent().is(":visible"),
			videoIsHD = false,
			loadedSrc = $(videoControl).hasClass("es_loaded_src"),
			playInHD = getValue("playback_hd") || $(videoControl).hasClass("es_video_hd");

		if (videoIsVisible) {
			var videoPosition = videoControl.currentTime,
				videoPaused = videoControl.paused;

			videoControl.preload = "metadata";
			
			$(videoControl).on("loadedmetadata", function() {
				this.currentTime = videoPosition;
				if (!videoPaused) videoControl.play();

				$(videoControl).off("loadedmetadata");
			});
		}

		if (!playInHD && setHD === undefined || setHD === true) {
			videoIsHD = true;
			videoControl.src = $(videoControl).data("hd-src");
		} else if (loadedSrc) {
			videoControl.src = $(videoControl).data("sd-src");
		}

		if (videoIsVisible && loadedSrc) {
			videoControl.load();
		}

		$(videoControl).addClass("es_loaded_src").toggleClass("es_video_sd", !videoIsHD).toggleClass("es_video_hd", videoIsHD);
		$(videoControl).parent().toggleClass("es_playback_sd", !videoIsHD).toggleClass("es_playback_hd", videoIsHD);

		return videoIsHD;
	}
}

function media_slider_expander(in_store) {
	var detailsBuilt = false,
		details = in_store ? $("#game_highlights").find(".rightcol").first() : $(".workshop_item_header").find(".col_right").first();

	if (details.length) {
		$("#highlight_player_area").append(`
			<div class="es_slider_toggle btnv6_blue_hoverfade btn_medium">
				<div data-slider-tooltip="` + localized_strings.expand_slider + `" class="es_slider_expand"><i class="es_slider_toggle_icon"></i></div>
				<div data-slider-tooltip="` + localized_strings.contract_slider + `" class="es_slider_contract"><i class="es_slider_toggle_icon"></i></div>
			</div>
		`);

		// Initiate tooltip
		runInPageContext(function() { $J('[data-slider-tooltip]').v_tooltip({'tooltipClass': 'store_tooltip community_tooltip', 'dataName': 'sliderTooltip' }); });

		function build_side_details() {
			if (!detailsBuilt) {
				detailsBuilt = true;

				if (in_store) {
					var $detailsClone = $(details).find(".glance_ctn").clone().addClass("es_side_details block responsive_apppage_details_left").hide().prependTo($("div.rightcol.game_meta_data").first()).wrap('<div class="es_side_details_wrap" />');
					// There are some issues with having duplicates of these on page when trying to add tags
					$detailsClone.find(".app_tag.add_button, .glance_tags_ctn.your_tags_ctn").remove();
				} else {
					$(details).clone().attr("class", "panel es_side_details").prepend('<div class="title">' + localized_strings.details + '</div><div class="hr padded"></div>').hide().prependTo(".sidebar");
					// Sometimes for a split second the slider pushes the details down, this fixes it
					$(".highlight_ctn").wrap('<div class="leftcol" style="width: 638px; float: left; position: relative; z-index: 1;" />');

					// Don't overlap Sketchfab's "X"
					if ($(".highlight_sketchfab_model").length) {
						$("#highlight_player_area").hover(function(){
							if ($(this).find(".highlight_sketchfab_model").not(":hidden").length) {
								$(".es_slider_toggle").css("top", "32px");
							}
						}, function(){
							$(".es_slider_toggle").removeAttr("style");
						});
					}
				}
			}
		}

		var expand_slider = getValue("expand_slider") || false;
		if (expand_slider === true) {
			build_side_details();

			$(".es_slider_toggle, #game_highlights, .workshop_item_header, .es_side_details, .es_side_details_wrap").addClass("es_expanded");
			$(".es_side_details_wrap, .es_side_details").show();

			// Triggers the adjustment of the slider scroll bar
			setTimeout(function(){
				window.dispatchEvent(new Event("resize"));
			}, 250);
		}

		$(".es_slider_toggle").on("click", function(e) {
			e.preventDefault();

			var el = $(this);

			$(details).hide();
			build_side_details();

			if (!$(el).hasClass("es_expanded")) {
				$(".es_side_details_wrap").show();
			}

			// Animate 
			$(".es_side_details").stop().slideToggle(250, function(){
				if (!$(el).hasClass("es_expanded")) $(".es_side_details_wrap").hide();
			});

			// On every animation/transition end check the slider state
			$(".highlight_ctn").one("transitionend", function() {
				// Save slider state
				setValue("expand_slider", $(el).hasClass("es_expanded"));

				// If slider was contracted show the extended details
				if (!$(el).hasClass("es_expanded")) $(details).hide().fadeIn("fast");

				// Triggers the adjustment of the slider scroll bar
				setTimeout(function(){
					window.dispatchEvent(new Event("resize"));
				}, 250);
			});

			$(".es_slider_toggle, #game_highlights, .workshop_item_header, .es_side_details, .es_side_details_wrap").toggleClass("es_expanded");
		});
	}
}

// Display a regional price comparison
function show_regional_pricing(type) {
	storage.get(function(settings) {
		if (settings.showregionalprice === undefined) { settings.showregionalprice = "mouse"; storage.set({'showregionalprice': settings.showregionalprice}); }
		if (settings.regional_countries === undefined) { settings.regional_countries = ["us", "gb", "eu1", "ru", "br", "au", "jp"]; storage.set({'regional_countries': settings.regional_countries}); }
		if (settings.regional_hideworld === undefined) { settings.regional_hideworld = false; storage.set({'regional_hideworld': settings.regional_hideworld}); }
		if (settings.regional_countries < 1) { settings.showregionalprice = "off"; }

		if (settings.showregionalprice !== "off") {
			var api_url = "//store.steampowered.com/api/packagedetails/";
			var countries = settings.regional_countries;
			var pricing_div = $('<div class="es_regional_container es_regional_' + (type || 'app') + '"></div>');
			var currency_deferred = [];
			var local_country;
			var sale = (type === "sale");
			var sub = (type === "sub");

			local_country = getStoreRegionCountryCode().toLowerCase();
			if (countries.indexOf(local_country) === -1) {
				countries.push(local_country);
			}

			if (settings.showregionalprice === "mouse") {
				$(pricing_div).prepend('<div class="miniprofile_arrow right" style="position: absolute; top: 12px; right: -8px;"></div>');
			}

			var subid_info = [];
			var subid_array = [];
			var all_game_areas = (sale ? $(".sale_page_purchase_item") : $(".game_area_purchase_game")).toArray();

			function formatPriceData(sub_info, country, converted_price) {
				var regional_price_div = "";
				
				if (sub_info["prices"][country]) {
					converted_price = (converted_price / 100).toFixed(2);

					var price = sub_info["prices"][country]["final"] / 100;
					var local_price = sub_info["prices"][local_country]["final"] / 100;
					var currency = sub_info["prices"][country]["currency"];
					var formatted_price = formatCurrency(price, currency);
					var formatted_converted_price = formatCurrency(converted_price);
					var percentage_indicator = "es_percentage_equal";
					var percentage;

					if (settings.override_price != "auto") {
						local_price = currencyConversion.convert(local_price, sub_info["prices"][local_country]["currency"], settings.override_price);
					}

					percentage = (((converted_price / local_price) * 100) - 100).toFixed(2);
					if (percentage < 0) {
						percentage = Math.abs(percentage);
						percentage_indicator = "es_percentage_lower";
					} else if (percentage > 0) {
						percentage_indicator = "es_percentage_higher";
					}

					regional_price_div = '<div class="es_regional_price es_flag es_flag_' + country + '">' + formatted_price + ' <span class="es_regional_converted">(' + formatted_converted_price + ')</span><span class="es_percentage ' + percentage_indicator + '">' + percentage + '%</span></div>';
				} else {
					regional_price_div = '<div class="es_regional_price es_flag es_flag_' + country + '"><span class="es_regional_unavailable">' + localized_strings.region_unavailable + '</span></div>';
				}

				return regional_price_div;
			}

			$.each(all_game_areas, function(index, app_package) {
				var subid = $(app_package).find("input[name='subid']").val();
				
				if (subid > 0) {
					subid_info.push({
						subid: subid,
						prices: []
					});
					subid_array.push(subid);
				} else {
					subid_info.push({
						subid: "0",
						prices: []
					});
				}
			});

			if (subid_array.length) {
				$.each(countries, function(index, country) {
					$.each(subid_info, function(subid_index, package_info) {
						if (package_info["subid"] != 0) {
							currency_deferred.push(
								$.ajax({
									url: api_url,
									data: {
										packageids: package_info["subid"],
										// conversion for "eu2" should to be removed since "eu" regions were merged
										cc: (country === "eu1" ? "fr" : (country === "eu2" ? "it" : country))
									}
								}).done(function(data) {
									$.each(data, function(data_subid) {
										if (package_info) {
											if (package_info["subid"] === data_subid) {
												if (data[data_subid]["data"]) {
													var price = data[data_subid]["data"]["price"];

													subid_info[subid_index]["prices"][country] = price;
													pricing_div = $(pricing_div).append(price);
												}
											}
										}
									});
								})
							);
						};
					});
				});

				$.when.apply(null, currency_deferred).done(function(){
					currencyConversion.load().done(function(){
						$.each(subid_info, function(index, subid) {
							if (subid["subid"] != 0) {
								var sub_formatted = [];
								var app_pricing_div = $(pricing_div).clone().attr("id", "es_pricing_" + subid["subid"].toString());

								// Format prices for each country
								$.each(countries, function(country_index, country) {
									if (country !== local_country) {
										if (subid["prices"][country]) {
											var country_currency = subid["prices"][country]["currency"].toString().toUpperCase();
											var app_price = subid["prices"][country]["final"];
											var converted_price = currencyConversion.convert(parseFloat(app_price), country_currency, user_currency);
											var regional_price = formatPriceData(subid, country, converted_price);

											sub_formatted.push(regional_price);	
										} else {
											var regional_price = formatPriceData(subid, country);
	
											sub_formatted.push(regional_price);
										}
									}
								});

								$(app_pricing_div).append(sub_formatted);

								// Insert regional prices into the page
								var price_container;
								if (sale) {
									price_container = $(".sale_page_purchase_item").eq(index).addClass("es_regional_prices");
									
									if (settings.showregionalprice === "always") {
										$(price_container).addClass("es_regional_always").prepend(app_pricing_div);
									} else {
										$(price_container).addClass("es_regional_onmouse").find(".game_purchase_action_bg").last().append(app_pricing_div);
									}
								} else {
									price_container = $(".game_area_purchase_game").eq(index).addClass("es_regional_prices");
									
									if (settings.showregionalprice === "always") {
										$(price_container).addClass("es_regional_always").find(".game_purchase_action").before(app_pricing_div);
									} else {
										$(price_container).addClass("es_regional_onmouse").find(".game_purchase_action_bg").last().append(app_pricing_div);
									}
								}

								// Add the "globe" icon
								if (settings.showregionalprice === "mouse" && !(settings.regional_hideworld)) {
									$(price_container).find(".price, .discount_prices").addClass("es_regional_icon");
								}
							}
						});
					});
				});
			}
		}
	});
}

function customize_app_page() {
	// Add a "Customize" button
	$(".purchase_area_spacer:last").after("<link rel='stylesheet' type='text/css' href='//store.akamai.steamstatic.com/public/css/v6/home.css'><div id='es_customize_btn' class='home_actions_ctn'><div class='home_btn home_customize_btn'>" + localized_strings.customize + "</div></div>");

	storage.get(function(settings) {
		if (settings.show_apppage_recommendedbycurators === undefined) { settings.show_apppage_recommendedbycurators = true; storage.set({'show_apppage_recommendedbycurators': settings.show_apppage_recommendedbycurators}); }
		if (settings.show_apppage_recentupdates === undefined) { settings.show_apppage_recentupdates = true; storage.set({'show_apppage_recentupdates': settings.show_apppage_recentupdates}); }
		if (settings.show_apppage_reviews === undefined) { settings.show_apppage_reviews = true; storage.set({'show_apppage_reviews': settings.show_apppage_reviews}); }
		if (settings.show_apppage_about === undefined) { settings.show_apppage_about = true; storage.set({'show_apppage_about': settings.show_apppage_about}); }
		if (settings.show_apppage_sysreq === undefined) { settings.show_apppage_sysreq = true; storage.set({'show_apppage_sysreq': settings.show_apppage_sysreq}); }
		if (settings.show_apppage_legal === undefined) { settings.show_apppage_legal = true; storage.set({'show_apppage_legal': settings.show_apppage_legal}); }
		if (settings.show_apppage_morelikethis === undefined) { settings.show_apppage_morelikethis = true; storage.set({'show_apppage_morelikethis': settings.show_apppage_morelikethis}); }
		if (settings.show_apppage_customerreviews === undefined) { settings.show_apppage_customerreviews = true; storage.set({'show_apppage_customerreviews': settings.show_apppage_customerreviews}); }
		if (settings.show_apppage_surveys === undefined) { settings.show_apppage_surveys = true; storage.set({'show_apppage_surveys': settings.show_apppage_surveys}); }

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

function add_chinese_name() {
	storePageDataCN.get("chineseName", function(data) {
		$(".breadcrumbs").find("span[itemprop='name']").append("「" + data + "」");
		$(".apphub_AppName:first").append("「" + data + "」");
		var title = $(document).prop('title');
		$(document).prop('title', title + "「" + data + "」");
	});
}

function add_keylol_link() {
	storage.get(function(settings) {
		if (settings.show_keylol_links === undefined) { settings.show_keylol_links = false; storage.set({'show_keylol_links': settings.show_keylol_links}); }
		if (settings.show_keylol_links) {
			storePageDataCN.get("link", function(data) {
				$('#ReportAppBtn').parent().prepend('<a class="btnv6_blue_hoverfade btn_medium keylol_btn" href="' + data + '" style="display: block; margin-bottom: 6px;"><span><i class="ico16" style="background-image:url(' + chrome.extension.getURL("img/ico/keylol.png") + ')"></i>&nbsp;&nbsp; 查看其乐据点</span></a>');

				storePageDataCN.get("averageRating", function(score) {
					var html = "<div class='block game_details underlined_links es_keylol'><div style='background-image: url(" + chrome.extension.getURL("img/keylol_bg.png") + "); background-repeat: no-repeat; height: 35px; font-size: 24px; color: #8BC53F; text-align: right; font-family: Motiva Sans Light, Arial, Helvetica, sans-serif; width: 270px;'>";
					html += "<span>" + score + "</span>";
					html += "<span style='color: #61686d; font-size: 25px;'>/</span>"
					html += "<span style='color: #61686d; font-size: 11px;'>10</span></div>"
					if (language == "schinese") { var title = "阅读游戏评测"; }
					if (language == "tchinese") { var title = "閱覽遊戲評測"; }
					html += "<a href='" + data + "/timeline'>" + title + "</a>&nbsp;";
					html += "<img src='http://store.akamai.steamstatic.com/public/images/ico/iconExternalLink.gif' border='0' align='bottom'>";
					html += "</div></div>";
					$("div.game_details:first").after(html);
				});
			});
		}
	});
}

function add_steamcn_mods() {
	if (language == "schinese") { var heading = "第三方汉化"; }
	if (language == "tchinese") { var heading = "第三方漢化"; }
	$(".game_language_options").parent().append("<div class='block_title' style='margin-top: 10px;'>" + heading + ":</div><span id='es_c_mods'></span>");

	storePageDataCN.get("chineseLocalizations", function(data) {
		$.each(data, function() {
			$("#es_c_mods").append("<a class='linkbar' href='" + this.link + "' target='_blank'>" + this.title + "</a>");
		});
	});

	storePageDataCN.get("link", function(data) {
		if (language == "schinese") { var link = "完整汉化情报"; }
		if (language == "tchinese") { var link = "更多漢化信息"; }
		$("#es_c_mods").after("<a href='" + data + "/intel' class='all_languages' target='_blank'>" + link + "</a>&nbsp;<img src='http://store.akamai.steamstatic.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'>");
	});
}

function customize_home_page() {
	$(".home_page_content:first").append("<div id='es_customize_btn' class='home_actions_ctn' style='margin-bottom: 4px; visibility: visible;'><div class='home_btn home_customize_btn' style='z-index: 13;'>" + localized_strings.customize + "</div></div><div style='clear: both;'></div>");
	$(".home_page_body_ctn:first").css("min-height", "400px");
	$(".has_takeover").css("min-height", "600px");

	storage.get(function(settings) {
		if (settings.show_homepage_carousel === undefined) { settings.show_homepage_carousel = true; storage.set({'show_homepage_carousel': settings.show_homepage_carousel}); }
		if (settings.show_homepage_spotlight === undefined) { settings.show_homepage_spotlight = true; storage.set({'show_homepage_spotlight': settings.show_homepage_spotlight}); }
		if (settings.show_homepage_friends === undefined) { settings.show_homepage_friends = true; storage.set({'show_homepage_friends': settings.show_homepage_friends}); }
		if (settings.show_homepage_newsteam === undefined) { settings.show_homepage_newsteam = true; storage.set({'show_homepage_newsteam': settings.show_homepage_newsteam}); }
		if (settings.show_homepage_updated === undefined) { settings.show_homepage_updated = true; storage.set({'show_homepage_updated': settings.show_homepage_updated}); }
		if (settings.show_homepage_recommended === undefined) { settings.show_homepage_recommended = true; storage.set({'show_homepage_recommended': settings.show_homepage_recommended}); }
		if (settings.show_homepage_explore === undefined) { settings.show_homepage_explore = true; storage.set({'show_homepage_explore': settings.show_homepage_explore}); }
		if (settings.show_homepage_curators === undefined) { settings.show_homepage_curators = true; storage.set({'show_homepage_curators': settings.show_homepage_curators}); }
		if (settings.show_homepage_hardware === undefined) { settings.show_homepage_hardware = true; storage.set({'show_homepage_hardware': settings.show_homepage_hardware}); }
		if (settings.show_homepage_tabs === undefined) { settings.show_homepage_tabs = true; storage.set({'show_homepage_tabs': settings.show_homepage_tabs}); }
		if (settings.show_homepage_specials === undefined) { settings.show_homepage_specials = true; storage.set({'show_homepage_specials': settings.show_homepage_specials}); }
		if (settings.show_homepage_marketing === undefined) { settings.show_homepage_marketing = true; storage.set({'show_show_homepage_marketing': settings.show_homepage_marketing}); }
		if (settings.show_homepage_sidebar === undefined) { settings.show_homepage_sidebar = true; storage.set({'show_homepage_sidebar': settings.show_homepage_sidebar}); }

		var html = "<div class='home_viewsettings_popup'><div class='home_viewsettings_instructions' style='font-size: 12px;'>" + localized_strings.apppage_sections + "</div>"

		// Carousel
		if ($("#home_maincap_v7").length > 0) {
			text = $("#home_maincap_v7").parent().find("h2").text().toLowerCase();
			if (settings.show_homepage_carousel) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_carousel'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_carousel'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$("#home_maincap_v7").parent().addClass("es_hide");
				$("#home_maincap_v7").parent().parent().css({"padding-top": "0px", "padding-bottom": "0px", "margin-top": "0px"});
			}
		}

		// Special Offers
		if ($("#spotlight_carousel").length > 0) {
			text = $("#spotlight_carousel").parent().find("h2:first").contents().filter(function() { return this.nodeType === 3; })[0].data.toLowerCase();
			if (settings.show_homepage_spotlight) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_spotlight'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_spotlight'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$("#spotlight_carousel").parent().parent().addClass("es_hide");
			}
		}

		// Trending Among Friends
		if ($("#friends_carousel").length > 0) {
			text = $("#friends_carousel").parent().find("h2:first").contents().filter(function() { return this.nodeType === 3; })[0].data.toLowerCase();
			if (settings.show_homepage_friends) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_friends'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_friends'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$("#friends_carousel").parent().parent().addClass("es_hide");
			}
		}

		// Your Discovery Queue
		if ($(".discovery_queue_ctn").length > 0) {
			text = $(".discovery_queue_ctn").find("h2:first").contents().filter(function() { return this.nodeType === 3; })[0].data.toLowerCase();
			if (settings.show_homepage_explore) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_explore'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_explore'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$(".discovery_queue_ctn").addClass("es_hide");
			}
		}

		// Steam Curators
		if ($(".steam_curators_ctn").length > 0) {
			text = $(".steam_curators_ctn").find("a:first").contents().filter(function() { return this.nodeType === 3; })[0].data.toLowerCase();
			if (settings.show_homepage_curators) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_curators'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_curators'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$(".apps_recommended_by_curators_ctn").css("height", "0px").css("overflow", "hidden");
				$(".steam_curators_ctn").addClass("es_hide");
			}
		}

		// Recently Updated
		if ($(".recently_updated_block").length > 0) {
			text = $(".recently_updated_block").find("h2").contents().filter(function() { return this.nodeType === 3; })[0].data.toLowerCase();
			if (settings.show_homepage_updated) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_updated'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_updated'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$(".recently_updated_block").addClass("es_hide");
			}
		}

		// Hardware Ads
		if ($(".hardware_content").length > 0) {
			text = localized_strings.hardwareads;
			if (settings.show_homepage_hardware) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_hardware'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_hardware'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$(".hardware_content").parent().addClass("es_hide");
			}
		}

		// Homepage Tabs
		if ($(".home_tab_col").length > 0) {
			text = localized_strings.homepage_tabs;
			if (settings.show_homepage_tabs) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_tabs'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_tabs'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$(".home_tab_col").parent().addClass("es_hide");
			}
		}

		// Under $10
		if ($(".specials_under10").length > 0) {
			text = $(".specials_under10").find("h2:first").contents().filter(function() { return this.nodeType === 3; })[0].data.toLowerCase();
			if (settings.show_homepage_specials) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_specials'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_specials'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$(".specials_under10").parent().parent().addClass("es_hide");
			}
		}

		// Updates and Offers
		if ($(".marketingmessage_area").length > 0) {
			text = $(".marketingmessage_area").find("h2").contents().filter(function() { return this.nodeType === 3; })[0].data.toLowerCase();
			if (settings.show_homepage_marketing) { html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_marketing'><div class='home_viewsettings_checkbox checked'></div><div class='home_viewsettings_label'>" + text + "</div></div>"; }
			else {
				html += "<div class='home_viewsettings_checkboxrow ellipsis' id='show_homepage_marketing'><div class='home_viewsettings_checkbox'></div><div class='home_viewsettings_label'>" + text + "</div></div>";
				$(".marketingmessage_area").addClass("es_hide");
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

		function addToggleHandler(name, element) {
			var obj = {};
			obj[name] = settings[name];
			$("#" + name).click(function() {
				element.removeClass("es_hide").removeClass("es_show");
				if (obj[name]) {
					obj[name] = false;
					element.slideUp();
					if (name == "show_homepage_carousel") {
						element.parent().css({"padding-top": "0px", "padding-bottom": "0px", "margin-top": "0px"});
					}
					$(this).find(".home_viewsettings_checkbox").removeClass("checked");
				} else {
					obj[name] = true;
					element.slideDown();
					$(this).find(".home_viewsettings_checkbox").addClass("checked");
				}
				storage.set(obj);
			});
		}

		addToggleHandler("show_homepage_carousel", $("#home_maincap_v7").parent());
		addToggleHandler("show_homepage_spotlight", $("#spotlight_carousel").parent().parent());
		addToggleHandler("show_homepage_friends", $("#friends_carousel").parent().parent());
		addToggleHandler("show_homepage_updated", $(".recently_updated_block"));
		addToggleHandler("show_homepage_explore", $(".discovery_queue_ctn"));
		addToggleHandler("show_homepage_curators", $(".steam_curators_ctn"));
		addToggleHandler("show_homepage_hardware", $(".hardware_content").parent());
		addToggleHandler("show_homepage_tabs", $(".home_tab_col").parent());
		addToggleHandler("show_homepage_specials", $(".specials_under10").parent().parent());
		addToggleHandler("show_homepage_marketing", $(".marketingmessage_area"));

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
			
			$.each(selectors, function(index, selector){
				$(selector).each(function(){
					$(this).html(replace_symbols($(this).html()));
				});
			});
			var observer = new MutationObserver(function(mutations) {
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

// Replaces "R", "C" and "TM" signs
function replace_symbols(input){
	return input.replace(/[\u00AE\u00A9\u2122]/g, "");
}

// Purchase dates promise
var purchase_dates_promise = function(lang, appname) {
	var deferred = new $.Deferred();

	var purchase_dates = getValue("purchase_dates") || {},
		expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60, // 1 hour ago
		last_updated = getValue("purchase_dates_time") || expire_time - 1;

	// Return date from cache
	if (purchase_dates && purchase_dates[lang] && purchase_dates[lang][appname]) {
		deferred.resolve(purchase_dates[lang][appname]);
	}

	// Update cache if needed
	if (last_updated < expire_time || !purchase_dates[lang]) {
		get_http('https://store.steampowered.com/account/licenses/?l=' + lang, function(txt) {
			var replace_strings = [];

			[	"- Complete Pack",
				"Standard Edition",
				"Steam Store and Retail Key",
				"- Hardware Survey",
				"ComputerGamesRO -",
				"Founder Edition",
				"Retail( Key)?",
				"Complete$",
				"Free$",
				"(RoW)",
				"ROW",
				":",
			].forEach(function(str) {
				replace_strings.push(new RegExp(str, "ig"));
			});

			purchase_dates[lang] = {};

			$(txt).find("#main_content").find(".license_date_col").not(":eq(0)").each(function(i, node) {
				var $nameTd = $(node).next("td");
				$nameTd.find("div").remove();

				// Clean game name
				var game_name = replace_symbols($nameTd.text()).trim();
				replace_strings.forEach(function(regex) {
					game_name = game_name.replace(regex, "");
				});

				purchase_dates[lang][game_name.trim()] = $(node).text();
			});

			setValue("purchase_dates", purchase_dates);
			setValue("purchase_dates_time", parseInt(Date.now() / 1000, 10));
			
			deferred.resolve(purchase_dates[lang][appname]);
		}).fail(function(){
			deferred.reject();
		});
	}

	return deferred.promise();
};

// Display purchase date for owned games
function display_purchase_date() {
	storage.get(function(settings) {
		if (settings.purchase_dates === undefined) { settings.purchase_dates = true; storage.set({'purchase_dates': settings.purchase_dates}); }
		if (settings.purchase_dates && $(".game_area_already_owned").length) {
			var appname = replace_symbols($(".apphub_AppName").text().replace(":", "")).trim();

			$.when(purchase_dates_promise(language, appname)).done(function(purchaseDate) {
				if (purchaseDate) {
					$(".game_area_already_owned:first .already_in_library").append(" " + localized_strings.purchase_date.replace("__date__", purchaseDate));
				}
			});
		}
	});
}

function bind_ajax_content_highlighting() {
	// Check content loaded via AJAX
	var observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			for (var i = 0; i < mutation.addedNodes.length; i++) {
				var node = mutation.addedNodes[i];
				// Check the node is what we want and not some unrelated DOM change
				if (node.classList && node.classList.contains("inventory_page")) {
					add_inventory_gotopage();
				}

				if (node.classList && node.classList.contains("tab_item")) {
					runInPageContext("function() { GDynamicStore.DecorateDynamicItems( jQuery('.tab_item') ) }");
					start_highlighting_node(node);
					check_early_access(node, ":last");
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
					apply_rate_filter(node);
					apply_price_filter(node);
				}

				if (node.classList && node.classList.contains("market_listing_row_link")) highlight_market_items();				
			}
		});
	});
	observer.observe(document, { subtree: true, childList: true });
}

function start_highlights_and_tags(){
	// Batch all the document.ready appid lookups into one storefront call.
	var selectors = [
		"div.tab_row",					// Storefront rows
		"div.dailydeal_ctn",
		"div.wishlistRow",				// Wishlist rows
		"a.game_area_dlc_row",			// DLC on app pages
		"a.small_cap",					// Featured storefront items and "recommended" section on app pages
		"a.home_smallcap",
		"a.search_result_row",			// Search result rows
		"a.match",						// Search suggestions rows
		"a.cluster_capsule",			// Carousel items
		"div.recommendation_highlight",	// Recommendation pages
		"div.recommendation_carousel_item",	// Recommendation pages
		"div.friendplaytime_game",		// Recommendation pages
		"div.dlc_page_purchase_dlc",	// DLC page rows
		"div.sale_page_purchase_item",	// Sale pages
		"div.item",						// Sale pages / featured pages
		"div.home_area_spotlight",		// Midweek and weekend deals
		"div.browse_tag_game",			// Tagged games
		"div.similar_grid_item",		// Items on the "Similarly tagged" pages
		".tab_item",					// Items on new homepage
		"a.special",					// new homepage specials
		"div.curated_app_item",			// curated app items!
		"a.summersale_dailydeal"		// Summer sale daily deal
	];
		
	setTimeout(function() {
		$.each(selectors, function (i, selector) {
			$.each($(selector).not(".es_highlighted"), function(j, node){
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
				}

				highlight_notinterested(node);
			});
		});
	}, 500);
}

function start_friend_activity_highlights() {
	$.when.apply($, [dynamicstore_promise]).done(function(data) {
		var ownedapps = data.rgOwnedApps;
		var wishlistapps = data.rgWishlist;

		// Get all appids and nodes from selectors
		$(".blotter_block").not(".es_highlight_checked").addClass("es_highlight_checked").find("a").not(".blotter_gamepurchase_logo").each(function (i, node) {
			var appid = get_appid(node.href);

			if (appid && !$(node).hasClass("blotter_userstats_game")) {
				if (getValue(appid + "guestpass")) highlight_inv_guestpass(node);
				if (getValue(appid + "coupon")) highlight_coupon(node, getValue(appid + "coupon_discount"));
				if (getValue(appid + "gift")) highlight_inv_gift(node);
				if ($.inArray(parseFloat(appid), wishlistapps) !== -1) highlight_wishlist(node);
				if ($.inArray(parseFloat(appid), ownedapps) !== -1) {
					highlight_owned(node);
					// Add achievements comparison link
					if ($(node).parent().parent().hasClass("blotter_daily_rollup_line")) {
						add_achievement_comparison_link($(node).parent(), appid);
					}
				}
			}
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
	if (appid) {
		if (getValue(appid + "guestpass")) highlight_inv_guestpass(node);
		if (getValue(appid + "coupon")) highlight_coupon(node, getValue(appid + "coupon_discount"));
		if (getValue(appid + "gift")) highlight_inv_gift(node);
	}

	highlight_notinterested(node);
}

// Monitor and highlight wishlishted recommendations at the bottom of Store's front page
function highlight_recommendations() {
	if ($("#content_more").length) {
		setMutationHandler($("#content_more")[0], ".home_content_item.ds_wishlist, .gamelink.ds_wishlist", function(nodes){
			$.each(nodes, function(i, node){
				if ($(node).parent().hasClass("single")) {
					node = $(node).parent().parent()[0];
				}
				highlight_wishlist(node);
			});

			return true;
		});
	}
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
		var useful_links = $('#ReportAppBtn').parent().parent().addClass("es_useful_links");
		if ($(".es_side_details_wrap").length) {
			$(useful_links).insertAfter(".es_side_details_wrap");
		} else {
			$(useful_links).prependTo($("div.rightcol.game_meta_data").first());
		}
	}
}

function add_familysharing_warning(appid) {
	storePageData.get("exfgls", function(data) {
		if (data.excluded) {
			$("#game_area_purchase").before('<div id="purchase_note"><div class="notice_box_top"></div><div class="notice_box_content">' + localized_strings.family_sharing_notice + '</div><div class="notice_box_bottom"></div></div>');
		}
	});
}

var memoized_stats_link = {};
function memoize_stats_link(appid, state, cappid) {
	if (!memoized_stats_link.hasOwnProperty(appid) || memoized_stats_link[appid].state !== "loaded") {
		memoized_stats_link[appid] = { "state": state, "cappid": cappid };
	}

	return memoized_stats_link[appid];
}

function add_achievement_comparison_link(node, appid) {
	storage.get(function(settings) {
		if (settings.showcomparelinks === undefined) { settings.showcomparelinks = false; storage.set({'showcomparelinks': settings.showcomparelinks}); }
		if (settings.showcomparelinks) {
			var $node = $(node).addClass("es_achievements");

			memoized_stats_link[appid] = memoized_stats_link[appid] || memoize_stats_link(appid, "toload");

			if ($node.next().is("img") && memoized_stats_link[appid].state !== "failed") {
				var links = $node.find("a");

				// Prepare the link
				$node.append("<br><a class='es_achievement_compare' data-appid='" + appid + "' href='" + links[0].href + "/stats/" + "' target='_blank'></a>");

				if (memoized_stats_link[appid].state === "loaded") {
					$node.find(".es_achievement_compare").addClass("es_has_compare").text("(" + localized_strings.compare + ")").prop("href", function(){ return ($(this).prop("href") + memoized_stats_link[appid].cappid + "/compare") });
				} else if (memoized_stats_link[appid].state === "toload") {
					memoize_stats_link(appid, "loading");

					get_http(links[0].href + "/stats/" + appid, function(txt) {
						var html = txt.match(/<a href=".*\/stats\/(.+)\/compare">/);
						
						if (html) {
							memoize_stats_link(appid, "loaded", html[1]);
							// We do all links that have been revealed while loading
							$(".es_achievement_compare[data-appid='" + appid + "']").not(".es_has_compare").addClass("es_has_compare").text("(" + localized_strings.compare + ")").prop("href", function(){ return ($(this).prop("href") + memoized_stats_link[appid].cappid + "/compare") });
						} else {
							memoize_stats_link(appid, "failed");
							// Remove compare links for this app if there is there no data
							$(".es_achievement_compare[data-appid='" + appid + "']").remove();
						}
					}).fail(function(){
						// If it failed mark it for another attempt
						memoize_stats_link(appid, "toload");
					});
				}
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
					if (settings.highlight_owned_color === undefined) { settings.highlight_owned_color = highlight_defaults.owned;	storage.set({'highlight_owned_color': settings.highlight_owned_color}); }
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

var get_store_session = (function () {
	var deferred = new $.Deferred();

	if (is_signed_in) {
		var sessionid = false;

		chrome.storage.local.get("store_sessionid", function(data) {
			// Return from cache if available
			if (data.store_sessionid) {
				deferred.resolve(data.store_sessionid.id);
			}

			// Check if cache needs updating
			var expire_time = parseInt(Date.now() / 1000, 10) - 12 * 60 * 60; // 12 hours ago
			var last_updated = data.store_sessionid && data.store_sessionid.updated || expire_time - 1;

			if (!data.store_sessionid || last_updated < expire_time) {
				if (window.location.host === "store.steampowered.com") {
					sessionid = (cookie.match(/sessionid+=([^\\s;]*);/) || $("body").text().match(/g_sessionID = "(.+)";/i) || [])[1];

					if (sessionid) {
						chrome.storage.local.set({
							'store_sessionid': {
								'id': sessionid,
								'updated': parseInt(Date.now() / 1000, 10)
							}
						});
						deferred.resolve(sessionid);
					} else {
						deferred.reject();
					}
				} else {
					get_http("//store.steampowered.com/about/", function(txt) {
						sessionid = (txt.match(/g_sessionID = "(.+)"/i) || [])[1];

						if (sessionid) {
							chrome.storage.local.set({
								'store_sessionid': {
									'id': sessionid,
									'updated': parseInt(Date.now() / 1000, 10)
								}
							});
							deferred.resolve(sessionid);
						} else {
							deferred.reject();
						}
					}, {
						xhrFields: {
							withCredentials: true
						}
					}).fail(function(){
						deferred.reject();
					});
				}
			}
		});
	} else {
		deferred.reject();
	}

	return deferred.promise();
})();

function add_app_page_wishlist(appid) {
	storage.get(function(settings) {
		if (settings.wlbuttoncommunityapp === undefined) { settings.wlbuttoncommunityapp = true; storage.set({'wlbuttoncommunityapp': settings.wlbuttoncommunityapp}); }
		if (settings.wlbuttoncommunityapp) {
			// Get dynamic store data
			$.when.apply($, [dynamicstore_promise, get_store_session]).done(function(data, store_sessionid) {
				var ownedapps = data.rgOwnedApps;
				var wishlistapps = data.rgWishlist;

				// Check if owned already and highlight
				if ($.inArray(parseFloat(appid), ownedapps) !== -1) {
					highlight_owned($(".apphub_StoreInfoHeader")[0]);
				} else {
					// Check if wished already and highlight
					if ($.inArray(parseFloat(appid), wishlistapps) !== -1) {
						highlight_wishlist($(".apphub_StoreInfoHeader")[0]);
					} else {
						$(".apphub_StoreAppData").append('<a id="es_wishlist" class="btnv6_blue_hoverfade btn_medium" style="margin-right: 3px"><span>' + localized_strings.add_to_wishlist + '</span></a>');
						$("#es_wishlist").on("click", function(e) {
							e.preventDefault();

							var $el = $(this);

							$.ajax({
								type: "POST",
								url: "//store.steampowered.com/api/addtowishlist",
								data: {
									sessionid: store_sessionid,
									appid: appid
								},
								success: function( msg ) {
									$el.addClass("btn_disabled");
									$el.off("click");
									$el.html("<span>" + localized_strings.on_wishlist + "</span>");

									highlight_wishlist($(".apphub_StoreInfoHeader")[0]);

									// Invalidate dynamic store data cache
									delValue("dynamicstore_time");
								},
								error: function(e){
									console.log('Error: ' + e);
								}
							});
						});
					}
				}
			});
		}
	});
}

// Allows the user to intuitively remove an item from their wishlist on the app page
function add_app_page_wishlist_changes(appid) {
	if (is_signed_in) {
		if ($("#add_to_wishlist_area").length == 0 && $(".game_area_already_owned").length == 0) {
			$(".queue_actions_ctn").find("a.queue_btn_active:first").wrap("<div id='add_to_wishlist_area_success' style='display: inline-block;'></div>");
			$("#add_to_wishlist_area_success").before("<div id='add_to_wishlist_area' style='display: none;'><a class='btnv6_blue_hoverfade btn_medium' href='javascript:AddToWishlist( " + appid + ", \"add_to_wishlist_area\", \"add_to_wishlist_area_success\", \"add_to_wishlist_area_fail\", \"1_5_9__407\" );'><span>" + localized_strings.add_to_wishlist + "</span></a></div>");
			$("#add_to_wishlist_area_success").before("<div id='add_to_wishlist_area_fail' style='display: none;'></div>");
		}

		$("#add_to_wishlist_area_success img:last-child").addClass("es-in-wl");

		$(".es-in-wl").after("<img class='es-remove-wl' src='" + chrome.extension.getURL("img/remove.png") + "' style='display:none' />");
		$(".es-in-wl").after("<img class='es-loading-wl' src='//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif' style='display:none; width:16px' />");

		// Find the script tag that contains the session id and extract it
		var session_txt = $('script:contains("g_sessionID")').text();
		var sessionid = session_txt.match(/g_sessionID = "(.+)"/)[1];

		$("#add_to_wishlist_area_success").on("click", function(e) {
			e.preventDefault();

			var el = $(this),
				parent = $(this).parent();

			if ( !$(parent).hasClass("loading") ) {
				$(parent).addClass("loading");

				$(el).find("img").hide();
				$('.es-loading-wl').show();

				$.ajax({
					type: "POST",
					url: "//store.steampowered.com/api/removefromwishlist",
					data: {
						sessionid: sessionid,
						appid: appid
					},
					success: function( msg ) {
						setValue(appid + "wishlisted", false);
						$("#add_to_wishlist_area").show();
						$("#add_to_wishlist_area_success").hide();

						// Invalidate dynamic store data cache
						runInPageContext("function(){ GDynamicStore.InvalidateCache(); }");
					},
					complete: function() {
						$(parent).removeClass("loading");
						$(el).find("img").hide();
						$('.es-in-wl').show();
					}
				});
			}
		});
	}
}

function clear_cache() {
	localStorage.clear();
	chrome.storage.local.remove("user_currency");
	chrome.storage.local.remove("store_sessionid");
}

function change_user_background() {
	var prevHash = window.location.hash.match(/#previewBackground\/(\d+)\/([a-z0-9\.]+)/i);
	if (prevHash) {
		var imgUrl = "//steamcdn-a.akamaihd.net/steamcommunity/public/images/items/" + prevHash[1] + "/" + prevHash[2];
		// Make sure the url is for a valid background image
		$("body").append('<img class="es_bg_test" style="display: none" src="' + imgUrl + '" />');
		$("img.es_bg_test").on('load', function() {
			$(".no_header.profile_page, .profile_background_image_content").css("background-image", "url('" + imgUrl + "')");
			$(".es_bg_test").remove();
		});
	} else {
		if (!$(".profile_page.private_profile").length) {
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
	}
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
				html += "<div class='formRow'><div class='formRowTitle' style='overflow: visible;'>" + localized_strings.custom_background + ":<span class='formRowHint' data-community-tooltip='" + localized_strings.custom_background_help + "'>(?)</span></div><div class='formRowFields'><div class='profile_background_current'><div class='profile_background_current_img_ctn'><div class='es_loading'><img src='//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif'><span>"+ localized_strings.loading +"</div>";
				html += "<img id='es_profile_background_current_image' src=''>";
				html += "</div><div class='profile_background_current_description'><div id='es_profile_background_current_name'>";
				html += "</div></div><div style='clear: left;'></div><div class='background_selector_launch_area'></div></div><div class='background_selector_launch_area'>&nbsp;<div style='float: right;'><span id='es_background_remove_btn' class='btn_grey_white_innerfade btn_small'><span>" + localized_strings.remove + "</span></span>&nbsp;<span id='es_background_save_btn' class='btn_grey_white_innerfade btn_small btn_disabled'><span>" + localized_strings.save + "</span></span></div></div></div></div>";
				html += "</form><form id='es_profile_remove' method='POST' action='http://www.enhancedsteam.com/gamedata/profile_bg_remove.php'>";
				html += "<input type='hidden' name='steam64' value='" + steam64 + "'>";
				html += "</form>";
				$(".group_content_bodytext").before(html);
				runInPageContext(function() { BindCommunityTooltip( $J('.formRowHint') ); });

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
							$("#es_profile_background_current_name").after("<div class='es_loading'><img src='//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif'><span>"+ localized_strings.loading +"</div>");							

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
					profileData.clearOwn();
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
		html += "<div class='formRow'><div class='formRowTitle'>" + localized_strings.custom_style + ":<span class='formRowHint' data-community-tooltip='" + localized_strings.custom_style_help + "'>(?)</span></div><div class='formRowFields'><div class='profile_background_current'><div class='profile_background_current_img_ctn'><div id='es_style_loading'><img src='//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif'><span>"+ localized_strings.loading +"</div>";
		html += "<img id='es_profile_style_current_image' src='' style='margin-bottom: 12px;'>";
		html += "</div><div class='profile_style_current_description'><div id='es_profile_style_current_name'>";
		html += "</div></div><div style='clear: left;'></div><div class='background_selector_launch_area'></div></div><div class='background_selector_launch_area'>&nbsp;<div style='float: right;'><span id='es_style_remove_btn' class='btn_grey_white_innerfade btn_small'><span>" + localized_strings.remove + "</span></span>&nbsp;<span id='es_style_save_btn' class='btn_grey_white_innerfade btn_small btn_disabled'><span>" + localized_strings.save + "</span></span></div></div></div></div>";
		html += "</form><form id='es_style_remove' method='POST' action='http://api.enhancedsteam.com/profile_style/profile_style_remove.php'>";
		html += "<input type='hidden' name='steam64' value='" + steam64 + "'>";
		html += "</form>";
		$(".group_content_bodytext").before(html);
		runInPageContext(function() { BindCommunityTooltip( $J('.formRowHint') ); });

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
			profileData.clearOwn();
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
	$(".clientConnChangingText").before(`
		<div style="float:right;">
			<p class="clientConnHeaderText">` + localized_strings.total_size + `</p>
			<p class="clientConnMachineText">` + total + ` GiB</p>
		</div>
	`);
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
	$(".clientConnChangingText").before(`
		<div style="float: right; margin-left: 10px;">
			<p class="clientConnHeaderText">` + localized_strings.total_time + `:</p>
			<p class="clientConnMachineText">` + localized_strings.hours_short.replace("__hours__", total) + `</p>
		</div>
	`);
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
			$('.gameListRowItem').find(".color_uninstalled").parent().parent().hide();
			$('.gameListRowItem').find(".color_disabled").parent().parent().hide();
			$("#es_gl_installed_input").prop("checked", true);
			// Triggers the loading of out-of-view app images
			window.dispatchEvent(new Event("resize"));
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
								var $topSummaryAchievements = $(parsedhtml).find("#topSummaryAchievements");
								var $img = $topSummaryAchievements.find("img");
								if ($img.length > 0) {
									var $text = $($img[0].previousElementSibling.previousSibling);
									$topSummaryAchievements.html('').append($("<div>").text($text.text().trim()), $img);
								}
								$("#es_app_" + appid).html($topSummaryAchievements);
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

function add_badge_filter() {
	var filter_done = false;

	if ($(".profile_small_header_texture a")[0].href == ($("a.playerAvatar").prop("href") || "").replace(/\/$/, "")) {
		var html  = '<span>' + localized_strings.show + ' </span>';
			html += '<div class="store_nav"><div class="tab flyout_tab" id="es_filter_tab" data-flyout="es_filter_flyout" data-flyout-align="right" data-flyout-valign="bottom"><span class="pulldown"><div id="es_filter_active" style="display: inline;">' + localized_strings.badges_all + '</div><span></span></span></div></div>';
			html += '<div class="popup_block_new flyout_tab_flyout responsive_slidedown" id="es_filter_flyout" style="visibility: visible; top: 42px; left: 305px; display: none; opacity: 1;"><div class="popup_body popup_menu">'
			html += '<a class="popup_menu_item es_bg_filter" id="es_badge_all">' + localized_strings.badges_all + '</a>';
			html += '<a class="popup_menu_item es_bg_filter" id="es_badge_drops">' + localized_strings.badges_drops + '</a>';
			html += "</div></div>";

		$("#wishlist_sort_options").prepend("<div class='es_badge_filter' style='float: right; margin-left: 18px;'>" + html + "</div>");
		
		$('#es_badge_all').on('click', function() {
			$('.is_link').css('display', 'block');
			$("#es_filter_active").text(localized_strings.badges_all);
			$("#es_filter_flyout").fadeOut();
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
					$(".profile_paging").hide();
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
						$(this).hide();
					} else if (parseFloat($(this).html().match(/progress_info_bold".+?(\d+)/)[1]) == 0) {
						$(this).hide();
					} else {
						if ($(this).html().match(/badge_info_unlocked/)) {
							if (!($(this).html().match(/badge_current/))) {
								$(this).hide();
							}
						}
						// Hide foil badges too
						if (!($(this).html().match(/progress_info_bold/))) {
							$(this).hide();
						}
					}
				});
				$("#es_filter_active").text(localized_strings.badges_drops);
				$("#es_filter_flyout").fadeOut();
				resetLazyLoader();
			}
		});
	}
}

function add_badge_sort() {
	var is_own_profile = $(".profile_small_header_texture a")[0].href == ($("a.playerAvatar").prop("href") || "").replace(/\/$/, ""),
		sorts = ["c", "a", "r"],
		sorted = $("a.badge_sort_option.active")[0].search.replace("?sort=", "") || (is_own_profile ? "p" : "c"),
		linksHtml = "";
	
	if (is_own_profile) {
		sorts.unshift("p");
	}

	// Build dropdown links HTML
	$(".profile_badges_sortoptions").children("a").hide().each(function(i, link){
		linksHtml += '<a class="badge_sort_option popup_menu_item by_' + sorts[i] + '" data-sort-by="' + sorts[i] + '" href="?sort=' + sorts[i] + '">' + $(this).text().trim() + '</a>';
	});
	if (is_own_profile) {
		linksHtml += '<a class="badge_sort_option popup_menu_item by_d" data-sort-by="d" id="es_badge_sort_drops">' + localized_strings.most_drops + '</a>';
		linksHtml += '<a class="badge_sort_option popup_menu_item by_v" data-sort-by="v" id="es_badge_sort_value">' + localized_strings.drops_value + '</a>';
	}

	$(".profile_badges_sortoptions").wrap("<span id='wishlist_sort_options'></span>");

	// Insert dropdown options links
	$(".profile_badges_sortoptions").append(`
		<div id="es_sort_flyout" class="popup_block_new flyout_tab_flyout responsive_slidedown" style="visibility: visible; top: 42px; left: 305px; display: none; opacity: 1;">
			<div class="popup_body popup_menu">` + linksHtml + `</div>
		</div>
	`);

	// Insert dropdown button
	$(".profile_badges_sortoptions").find("span").first().after(`
		<span id="wishlist_sort_options">
			<div class="store_nav">
				<div class="tab flyout_tab" id="es_sort_tab" data-flyout="es_sort_flyout" data-flyout-align="right" data-flyout-valign="bottom">
					<span class="pulldown">
						<div id="es_sort_active" style="display: inline;">` + $("#es_sort_flyout").find("a.by_" + sorted).text() + `</div>
						<span></span>
					</span>
				</div>
			</div>
		</span>
	`);

	runInPageContext(function() { BindAutoFlyoutEvents(); });

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

		$('.badge_row').each(function () { $(this).hide(); });

		$(badgeRows).each(function() {
			$(".badges_sheet:first").append(this[0]);
		});

		$(".active").removeClass("active");
		$("#es_badge_sort_drops").addClass("active");
		resetLazyLoader();
	}

	var sort_drops_done = false;

	$("#es_badge_sort_drops").on("click", function() {
		var sort_text = $(this).text();
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
				$(".profile_paging").hide();
				sort_drops_done = true;
				add_badge_sort_drops();
				$("#es_sort_active").text(sort_text);
				$("#es_sort_flyout").fadeOut();
			});

			deferred.resolve();
		} else {
			add_badge_sort_drops();
		}
	});

	$("#es_badge_sort_value").on("click", function() {
		var sort_text = $(this).text();
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

		$('.badge_row').each(function () { $(this).hide(); });

		$(badgeRows).each(function() {
			$(".badges_sheet:first").append(this[0]);
		});

		resetLazyLoader();
		$("#es_sort_active").text(sort_text);
		$("#es_sort_flyout").fadeOut();
	});
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
	var html  = '<span>' + localized_strings.view + ' </span>';
		html += '<div class="store_nav"><div class="tab flyout_tab" id="es_badgeview_tab" data-flyout="es_badgeview_flyout" data-flyout-align="right" data-flyout-valign="bottom"><span class="pulldown"><div id="es_badgeview_active" style="display: inline;">' + localized_strings.theworddefault + '</div><span></span></span></div></div>';
		html += '<div class="popup_block_new flyout_tab_flyout responsive_slidedown" id="es_badgeview_flyout" style="visibility: visible; top: 42px; left: 305px; display: none; opacity: 1;"><div class="popup_body popup_menu">'
		html += '<a class="popup_menu_item es_bg_view" data-view="defaultview">' + localized_strings.theworddefault + '</a>';
		html += '<a class="popup_menu_item es_bg_view" data-view="binderview">' + localized_strings.binder_view + '</a>';
		html += "</div></div>";

	$("#wishlist_sort_options").prepend("<div class='es_badge_view' style='float: right; margin-left: 18px;'>" + html + "</div>");

	// Change hash when selecting view
	$(".es_bg_view").on("click", function() {
		window.location.hash = $(this).attr("data-view");
	});

	// Monitor for hash changes
	$(window).on("hashchange", function(){
		toggleBinderView();
	});

	toggleBinderView();

	function toggleBinderView(state) {
		if (window.location.hash === "#binderview" || state === true) {
			$("div.maincontent").addClass("es_binder_view");
			
			$(".es_badge_view_binder input").prop("checked", true);

			// Don't attempt changes again if already loaded
			if (!$("div.maincontent").hasClass("es_binder_loaded")) {
				$("div.maincontent").addClass("es_binder_loaded");
				$("div.badge_row.is_link").each(function () {
					var $this = $(this);

					var stats = $this.find("span.progress_info_bold").html();
					if (stats && stats.match(/\d+/)) {
						$this.find("div.badge_content").first().append("<span class='es_game_stats'>" + stats + "</span>");
					}

					if ($this.find("div.badge_progress_info").text()) {
						var card = $this.find("div.badge_progress_info").text().trim().match(/(\d+)\D*(\d+)/),
							text = (card) ? card[1] + " / " + card[2] : '';
						$this.find(".badge_progress_info").before('<div class="es_badge_progress_info">' + text + '</div>');
					}
				});
			}

			// Add hash to pagination links
			$("div.pageLinks").find("a.pagelink, a.pagebtn").attr("href", function(){
				return $(this).attr("href") + "#binderview";
			});
			// Triggers the loading of out-of-view badge images
			window.dispatchEvent(new Event("resize"));
			$("#es_badgeview_active").text(localized_strings.binder_view);
		} else {
			$("div.maincontent").removeClass("es_binder_view");
			// Remove hash from pagination links
			$("div.pageLinks").find("a.pagelink, a.pagebtn").attr("href", function(){
				return $(this).attr("href").replace("#binderview", "");
			});
			$("#es_badgeview_active").text(localized_strings.theworddefault);
		}
	}
}

function add_gamecard_foil_link() {
	var foil;
	var foil_index;
	var url_search = window.location.search;
	var url_parameters_array = url_search.replace("?","").split("&");

	$.each(url_parameters_array,function(index,url_parameter){
		if (url_parameter == "border=1"){
			foil = true;
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
		if (url_parameters_array[0] != ""){
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

	$.each(url_parameters_array, function(index,url_parameter){
		if(url_parameter=="border=1"){
			foil=true;
		}
	});

	var price_type = user_currency == "USD" ? "price" : "price_" + user_currency.toLowerCase();

	get_http("//api.enhancedsteam.com/market_data/card_prices/?appid=" + game, function(txt) {
		var data = JSON.parse(txt);
		var converter = $("<div>");

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
		if ($(".profile_small_header_texture:first a")[0].href == $(".playerAvatar:first a")[0].href.replace(/\/$/, "").replace(/\/$/, "")) {
			var faq_html = $(".profile_xp_block_right").html();
			$(".profile_xp_block_mid").append("<div class='es_faq_cards'>" + faq_html + "</div>");
			
			$(".profile_xp_block_right").html("<div id='es_cards_worth'></div>");
			
			var total_worth = 0, count = 0;

			// Gather appid info
			var appids = [],
				foil_appids = [],
				nodes = [],
				foil_nodes = [];
			$(".badge_row.is_link").each(function() {
				var game = $(this).find(".badge_row_overlay")[0].href.match(/gamecards\/(\d+)\//),
					foil = /\?border=1/.test($(this).find("a:last")[0].href),
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

function add_trade_forum_link(appid) {
	$(".gamecards_inventorylink").append('<a class="es_visit_tforum btn_grey_grey btn_medium" style="float: right; margin-top: -10px;" href="//steamcommunity.com/app/' + appid + '/tradingforum/" ><span>' + localized_strings.visit_trade_forum + '</span></a>');	
}

function add_total_drops_count() {
	if (is_signed_in && $(".profile_small_header_texture a")[0].href == $(".playerAvatar:first a")[0].href.replace(/\/$/, "")) {
		var drops_count = 0,
			drops_games = 0,
			completed = false;

		if ($(".pagebtn").length) {
			$(".profile_xp_block_right").prepend("<div id='es_calculations'><div class='btn_grey_black btn_small_thin'><span>" + localized_strings.drop_calc + "</span></div></div>");

			$("#es_calculations").click(function() {
				if (completed == false) {
					$("#es_calculations").text(localized_strings.loading);

					// First, get the contents of the first page
					$(".badge_title_stats_drops").find(".progress_info_bold").each(function(i, node) {
						var count = $(node).text().match(/(\d+)/);

						if (count) {
							drops_games = drops_games + 1;
							drops_count += +count[1];
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
								$(data).find(".badge_title_stats_drops").find(".progress_info_bold").each(function(i, node) {
									var count = $(node).text().match(/(\d+)/);

									if (count) {
										drops_games = drops_games + 1;
										drops_count += +count[1];
									}
								});
							});
						});
					});

					promise.done(function() {
						add_drops_count();
					});
					
					deferred.resolve();
					completed = true;
				}
			});
		} else {
			$(".profile_xp_block_right").prepend("<div id='es_calculations'>" + localized_strings.drop_calc + "</div>");
			$(".badge_title_stats_drops").find(".progress_info_bold").each(function(i, node) {
				var count = $(node).text().match(/(\d+)/);

				if (count) {
					drops_games = drops_games + 1;
					drops_count += +count[1];
				}
			});

			add_drops_count();
		}

		function add_drops_count() {
			$("#es_calculations").html(localized_strings.card_drops_remaining.replace("__drops__", drops_count) + "<br>" + localized_strings.games_with_drops.replace("__dropsgames__", drops_games));

			get_http("//steamcommunity.com/my/ajaxgetboostereligibility/", function(txt) {
				var booster_games = txt.match(/class="booster_eligibility_game"/g),
					booster_games = booster_games && booster_games.length || 0;

				$("#es_calculations").append("<br>" + localized_strings.games_with_booster.replace("__boostergames__", booster_games));
			});
		}

		//if ($(".badge_details_set_favorite").find(".btn_grey_black").length > 0) {
		//	$(".badge_details_set_favorite").append("<a class='btn_grey_black btn_small_thin' href='//steamcommunity.com/tradingcards/faq'><span>" + localized_strings.faqs + "</span></a>");
		//}
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
				runInPageContext("function(){ InitMiniprofileHovers(); }");
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

function add_birthday_celebration(in_store) {
	var setting_name = is_signed_in + "birthday";
	var obj = {};
	storage.get(function(settings) {
		if (settings[setting_name] === undefined) {
			get_http('//api.enhancedsteam.com/steamapi/GetPlayerSummaries/?steamids=' + is_signed_in, function (txt) {
				var data = JSON.parse(txt);
				var timecreated = data["response"]["players"][0]["timecreated"];
				obj[setting_name] = timecreated;
				storage.set(obj);
			});
		} else {
			var username = $("#global_header .username").text().trim();
			var birth_date_unix = settings[setting_name];
			var birth_date = new Date(birth_date_unix * 1000);
			var now = new Date();
			var years = 0;
			if (now.getMonth() == birth_date.getMonth() && now.getDate() == birth_date.getDate()) {
				years = now.getFullYear() - birth_date.getFullYear();
				var message = localized_strings["birthday_message"].replace("__username__", username).replace("__age__", years);
				$("body").addClass("es_birthday" + (in_store && $(".home_ctn").length ? " es_store_front" : ""));
				$("#logo_holder img").attr({"title": message, "alt": message});
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

function groups_leave_options() {
	if (is_signed_in && !$('.error_ctn').length) {
		var sessionID = $('#sessionID').val();

		// Insert required data into the DOM
		$('.sectionText').append(`
			<div class="es-leave-options">
				<button class="es-group-leave-button es-leave-selected" disabled>` + localized_strings.leave_group_selected + `</button>
				<button class="es-group-leave-button es-leave-all">` + localized_strings.leave_group_all + `</button>
				<input type="checkbox" class="es-check-all es-select-checkbox" />
			</div>
		`);
		$('.groupLeftBlock').append('<input type="checkbox" class="es-leave-group es-select-checkbox" />').wrapInner('<span class="es-links-wrap" />');

		// Bind actions to "leave" buttons
		$('.es-leave-selected').on('click', function(){ leave_group(); });
		$('.es-leave-all').on('click', function(){
			if (window.confirm( localized_strings.leave_group_all_confirm )) {
				// Disable the button until action is complete
				$('.es-leave-all').prop('disabled', true);
				$('.es-select-checkbox:visible').prop('checked', true).trigger('change');
				leave_group();
			}
		});

		// (De)Select all groups checkbox
		$('.es-check-all').on('click', function() {
			$('.es-select-checkbox:visible').prop('checked', $(this).prop('checked')).trigger('change');
		});

		// Replace Steam's way of leaving groups
		$('.groupLeftBlock .linkStandard:last-of-type').on('click', function(e) {
			e.preventDefault();

			leave_group($(this));
		});

		// Highlight group row when selected
		$('.es-select-checkbox').change(function(e){
			$(this).closest('.groupBlock').toggleClass('es-row-selected', $(this).prop('checked'));
			$(".es-leave-selected").prop("disabled", !$(".es-select-checkbox:checked").length > 0);
		});

		// Re-Join a group
		$(document.body).on('click', '.es-rejoin-group', function(e) {
			e.preventDefault();

			var el	= $(this),
				row	= $(el).closest('.groupBlock');

			if (!$(row).hasClass('es-inaction')) {
				$(row).addClass('es-inaction');
				$.post($(el).attr('href'), { action: "join", sessionID: sessionID }, function() {
					$(row).animate({opacity: '1'}, 500);
					$(el).hide('fast', function(){
						$(el).parent().find('.es-links-wrap').show('fast');
						$(row).removeClass('es-inaction');
					});
				});
			}
		});

		// Leave group(s)
		function leave_group(elSelector) {
			// Look for the first checkbox relative to the document...
			var el = $('.es-leave-group.es-select-checkbox:visible:checked').first();
			// ...unless an element was defined in which case look for a checkbox relative to it
			if (elSelector !== undefined) {
				el = $(elSelector).parent().find('.es-leave-group.es-select-checkbox:visible');
			}

			// Check if there is any group selected
			if ($(el).length > 0 && !$(el).hasClass('es-group-skipped')) {
				var row	= $(el).closest('.groupBlock');
				// Make sure it wasn't acted upon already
				if (!$(row).hasClass('es-inaction')) {
					var idRegex		= /javascript:leaveGroupPrompt\('(\d+)','(.*)'\)/,
						links		= $(el).closest('.es-links-wrap').find('.linkStandard'),
						leaveLink	= $(links).last().attr('href'),
						groupData	= idRegex.exec(leaveLink);
						joinGroupEl	= $(el).parent().parent().find('.es-rejoin-group');

					var joinGroupEl = joinGroupEl.length ? joinGroupEl : $(row).find('.linkTitle').clone().attr({class: 'es-rejoin-group', id: groupData[1]}).html( localized_strings.join_group ).prependTo($(row).find('.groupLeftBlock'));

					$(row).addClass('es-inaction');

					// If the user is Admin in this group confirmation before leaving is needed
					if ($(links).length === 1 || window.confirm( localized_strings.leave_group_admin_confirm.replace("__groupname__", groupData[2]) )) {
						$.ajax({method: 'POST',
								url: profile_url + 'home_process',
								data: { action: 'leaveGroup', groupId: groupData[1], sessionID: sessionID },
								beforeSend: function(){ $(row).addClass('es-progress'); }
						}).done(function() {
							$(row).addClass('es-complete').animate({opacity: '.30'}, 500, function(){
								$(row).removeClass('es-inaction es-progress es-complete');
							});
							$(el).parent().hide('fast', function(){
								$(joinGroupEl).show('fast');
								$(el).prop('checked', false).trigger('change');
							});
							// Wait some time between requests
							setTimeout(function() {
								leave_group(elSelector);
							}, 500);
						}).fail(function() {
							$('.es-leave-all').prop('disabled', false);
							$(row).removeClass('es-inaction es-progress es-complete');
							alert( localized_strings.wrong_try_again );
						});
					} else {
						$(el).addClass('es-group-skipped').prop('checked', false).trigger('change');
						$(row).removeClass('es-inaction es-progress es-complete');
						leave_group(elSelector);
					}
				}
			} else {
				$('.es-leave-all').prop('disabled', false);
				$('.es-group-skipped.es-select-checkbox:visible').removeClass('es-group-skipped');
			}
		}
	}
}

var owned_playable_promise = function() {
	var deferred = new $.Deferred();

	var owned_playable_cache = getValue("owned_apps"),
		expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60 * 24, // 24 hours
		last_updated = getValue("owned_list_time") || expire_time - 1;

	// Return data from cache if available
	if (owned_playable_cache) {
		deferred.resolve(owned_playable_cache);
	}

	// Update cache if needed
	if (last_updated < expire_time) {
		get_http("//api.enhancedsteam.com/steamapi/GetOwnedGames/?steamid=" + is_signed_in, function(txt) {
			var data = JSON.parse(txt);
			if (data && data.hasOwnProperty("response")) {
				setValue("owned_apps", data);
				setValue("owned_list_time", parseInt(Date.now() / 1000, 10));

				deferred.resolve(data);
			}
		}).fail(function(){
			deferred.reject();
		});
	}

	return deferred.promise();
};

function launch_random_button() {
	$("#es_popup").find(".popup_menu").append("<div class='hr'></div><a id='es_random_game' class='popup_menu_item' style='cursor: pointer;'>" + localized_strings.launch_random + "</a>");

	$("#es_random_game").on("click", function() {
		$.when(owned_playable_promise()).done(function(data) {
			var games = data.response.games,
				rand = games[Math.floor(Math.random() * games.length)];

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
			$("#es_popup").find(".popup_menu").append("<a id='es_itad' class='popup_menu_item' style='cursor: pointer;'>" + localized_strings.itad.send_to_itad + "</a>");

			$("#es_itad").on("click", function() {
				var ripc = function () {
					var dialog = ShowBlockingWaitDialog("", "");
					var url = "//store.steampowered.com/dynamicstore/userdata/" + g_AccountID;
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

function remove_guides_language_filter() {
	storage.get(function(settings) {
		if (settings.removeguideslanguagefilter === undefined) { settings.removeguideslanguagefilter = false; storage.set({'removeguideslanguagefilter': settings.removeguideslanguagefilter}); }
		if (settings.removeguideslanguagefilter) {
			$("[onclick*=" + language + "]").each(function(elem) {
				var newOnClick = this.getAttribute("onclick").trim().replace(new RegExp("([?&])requiredtags(?:%5B0?%5D|\\[\\])=" + language), "$1").replace(/(?:([?&])&|[?&](')$)/, "$1$2");
				$(this).replaceWith($(this).attr("onclick", newOnClick).clone());
			});
			$("[href*=" + language + "]").each(function(elem) {
				var newHref = this.href.trim().replace(new RegExp("([?&])requiredtags(?:%5B0?%5D|\\[\\])=" + language), "$1").replace(/(?:([?&])&|[?&]$)/, "$1");
				this.href = newHref;
			});
		}
	});
}

function skip_got_steam() {
	storage.get(function(settings) {
		if (settings.skip_got_steam === undefined) { settings.skip_got_steam = false; storage.set({'skip_got_steam': settings.skip_got_steam}); }
		if (settings.skip_got_steam) {
			$("a[href^='javascript:ShowGotSteamModal']").prop("href", function(){
				return this.href.split("'")[1];
			});
		}
	});
}

function disable_link_filter() {
	storage.get(function(settings) {
		if (settings.disablelinkfilter === undefined) { settings.disablelinkfilter = false; storage.set({'disable_link_filter': settings.disablelinkfilter}); }
		if (settings.disablelinkfilter) {
			remove_links_filter();

			setMutationHandler(document, "#announcementsContainer, .commentthread_comments, .newmodal", function(){
				remove_links_filter();

				return true; // keep on monitoring
			});
		}
	});

	function remove_links_filter() {
		$("a.bb_link[href*='/linkfilter/']").prop("href", function(){
			return this.href.replace("https://steamcommunity.com/linkfilter/?url=", "");
		});
	}
}

// Fix Store's main menu dropdown not being hidden on mouse out
function fix_menu_dropdown() {
	runInPageContext(function(){
		$J('div.tab.flyout_tab').on('mouseleave', function() {
			$J('#' + $J(this).data('flyout')).data('flyout-event-running', false);
		});
	});
}

$(document).ready(function(){
	var path = window.location.pathname.replace(/\/+/g, "/");

	$.when(localization_promise, signed_in_promise, currency_promise).done(function(){
			// On window load
			version_check();
			add_enhanced_steam_options();
			add_fake_country_code_warning();
			add_language_warning();
			remove_install_steam_button();
			remove_about_menu();
			add_header_links();
			process_early_access();
			disable_link_filter();
			if (is_signed_in) {
				replace_account_name();
				launch_random_button();
				add_itad_button();
			}

			// Attach event to the logout button
			$('a[href$="javascript:Logout();"]').bind('click', clear_cache);

			switch (window.location.host) {
				case "store.steampowered.com":

					if (is_signed_in) {
						add_birthday_celebration(true);
					}

					switch (true) {
						case /^\/cart(\/)?.*/.test(path):
							add_empty_cart_button();
							break;

						case /\bagecheck\b/.test(path):
							send_age_verification();
							break;

						case /^\/app\/.*/.test(path):
							var appid = get_appid(window.location.host + path);
							var metalink = $("#game_area_metalink").find("a").attr("href");

							media_slider_expander(true);
							init_hd_player();

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
							add_steam_client_link(appid);
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
							add_astats_link(appid);
							add_achievement_completion_bar(appid);

							show_regional_pricing("app");
							add_acrtag_warning();
							add_review_toggle_button();

							customize_app_page();
							add_help_button(appid);
							skip_got_steam();

							if (language == "schinese" || language == "tchinese") {
								storePageDataCN.load(appid);
								add_keylol_link();
								add_steamcn_mods();
								if (language == "schinese") add_chinese_name();
							}

							break;

						case /^\/sub\/.*/.test(path):
							var subid = get_subid(window.location.host + path);
							drm_warnings("sub");
							subscription_savings_check();
							show_pricing_history(subid, "sub");
							add_steamdb_links(subid, "sub");
							add_acrtag_warning();

							show_regional_pricing("sub");
							skip_got_steam();
							break;

						case /^\/dlc\/.*/.test(path):
							dlc_data_for_dlc_page();
							break;

						case /^\/video\/.*/.test(path):
							skip_got_steam();
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
							endless_scrolling();
							add_hide_buttons_to_search();
							add_exclude_tags_to_search();
							break;

						case /^\/sale\/.*/.test(path):
							show_regional_pricing("sale");
							break;

						// Storefront-front only
						case /^\/$/.test(path):
							add_popular_tab();
							add_allreleases_tab();
							set_homepage_tab();
							highlight_recommendations();
							customize_home_page();
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
					//get_store_session();
					fix_menu_dropdown();
					break;

				case "steamcommunity.com":

					if (is_signed_in) {
						add_birthday_celebration();
						add_wallet_balance_to_header();
					}

					switch (true) {
						case /^\/(?:id|profiles)\/.+\/wishlist/.test(path):
							alternative_linux_icon();
							appdata_on_wishlist();
							wishlist_dynamic_data();
							fix_app_image_not_found();
							add_empty_wishlist_buttons();
							add_wishlist_filter();
							add_wishlist_discount_sort();
							add_wishlist_total();
							add_wishlist_ajaxremove();
							add_wishlist_pricehistory();
							add_wishlist_notes();
							add_wishlist_search();
							wishlist_add_to_cart();

							// Wishlist highlights
							load_inventory().done(function() {
								start_highlights_and_tags();
							});	
							break;

						case /^\/chat\//.test(path):
							chat_dropdown_options(true);
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
							add_inventory_gotopage();
							break;

						case /^\/(?:id|profiles)\/(.+)\/games/.test(path):
							total_time();
							total_size();
							add_gamelist_achievements();
							add_gamelist_sort();
							add_gamelist_filter();
							add_gamelist_common();
							break;

						case /^\/(?:id|profiles)\/.+\/badges(?!\/[0-9]+$)/.test(path):
							add_badge_completion_cost();
							add_total_drops_count();
							add_cardexchange_links();
							add_badge_sort();
							add_badge_filter();
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
							add_trade_forum_link(gamecard);
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

						case /^\/(?:id|profiles)\/.+\/groups/.test(path):
							groups_leave_options();
							break;

						case /^\/(?:id|profiles)\/.+/.test(path):
							profileData.load();
							add_community_profile_links();
							add_wishlist_profile_link();
							add_supporter_badges();
							add_twitch_info();
							change_user_background();
							add_profile_store_links();
							fix_app_image_not_found();
							hide_spam_comments();
							add_steamrep_api();
							add_posthistory_link();
							add_nickname_link();
							add_profile_style();
							chat_dropdown_options();
							ingame_name_link();
							break;

						case /^\/sharedfiles\/browse/.test(path):
							remember_greenlight_filter().done(
								endless_scrolling_greenlight,
								preview_greenlight_votes
							);
							hide_greenlight_banner();

						case /^\/sharedfiles\/.*/.test(path):
							hide_greenlight_banner();
							hide_spam_comments();
							media_slider_expander();
							break;

						case /^\/workshop\/.*/.test(path):							
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
							collapse_game_list();
							add_active_total();
							minimize_active_listings();
							add_lowest_market_price();
							add_relist_button();
							keep_ssa_checked();
							add_background_preview_link();
							add_market_sort();
							add_badge_page_link();
							break;

						case /^\/app\/[^\/]*\/guides/.test(path):
							remove_guides_language_filter();

						case /^\/app\/.*/.test(path):
							var appid = get_appid(window.location.host + path);
							add_app_page_wishlist(appid);
							hide_spam_comments();
							add_steamdb_links(appid, "gamehub");
							send_age_verification();
							break;

						case /^\/games\/.*/.test(path):
							var appid = document.querySelector( 'a[href*="' + window.location.protocol + '//steamcommunity.com/app/"]' );
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
