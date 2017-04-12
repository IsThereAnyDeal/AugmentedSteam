var storage = chrome.storage.sync;
if (!storage) storage = chrome.storage.local;

var highlight_defaults = {
	"owned": "#5c7836",
	"wishlist": "#1c3788",
	"coupon": "#a26426",
	"inv_gift": "#800040",
	"inv_guestpass": "#008080",
	"notinterested": "#4f4f4f"
}

var settings_defaults = {
	"language": "eng",
	"highlight_owned_color": highlight_defaults.owned,
	"highlight_wishlist_color": highlight_defaults.wishlist,
	"highlight_coupon_color": highlight_defaults.coupon,
	"highlight_inv_gift_color": highlight_defaults.inv_gift,
	"highlight_inv_guestpass_color": highlight_defaults.inv_guestpass,
	"highlight_notinterested_color": highlight_defaults.notinterested,

	"tag_owned_color": highlight_defaults.owned,
	"tag_wishlist_color": highlight_defaults.wishlist,
	"tag_coupon_color": highlight_defaults.coupon,
	"tag_inv_gift_color": highlight_defaults.inv_gift,
	"tag_inv_guestpass_color": highlight_defaults.inv_guestpass,
	"tag_notinterested_color": highlight_defaults.notinterested,

	"highlight_owned": true,
	"highlight_wishlist": true,
	"highlight_coupon": false,
	"highlight_inv_gift": false,
	"highlight_inv_guestpass": false,
	"highlight_notinterested": false,
	"highlight_excludef2p": false,

	"tag_owned": false,
	"tag_wishlist": false,
	"tag_coupon": false,
	"tag_inv_gift": false,
	"tag_inv_guestpass": false,
	"tag_notinterested": true,
	"tag_short": false,

	"hide_owned": false,
	"hidetmsymbols": false,

	"showlowestprice": true,
	"showlowestprice_onwishlist": true,
	"showlowestpricecoupon": true,
	"showallstores": true,
	"stores": {
		"steam": true,
		"amazonus": true,
		"impulse": true,
		"gamersgate": true,
		"direct2drive": true,
		"origin": true,
		"uplay": true,
		"indiegalastore": true,
		"gamesplanet": true,
		"indiegamestand": true,
		"gog": true,
		"nuuvem": true,
		"dlgamer": true,
		"humblestore": true,
		"squenix": true,
		"bundlestars": true,
		"fireflower": true,
		"humblewidgets": true,
		"newegg": true,
		"coinplay": true,
		"wingamestore": true,
		"macgamestore": true,
		"gamebillet": true,
		"silagames": true,
		"itchio": true,
		"gamejolt": true,
		"paradox": true
	},
	"override_price": "auto",
	"showregionalprice": "mouse",
	"regional_countries": ["us", "gb", "eu1", "ru", "br", "au", "jp"],

	"showtotal": true,
	"showmarkettotal": true,
	"showsteamrepapi": true,
	"showmcus": true,
	"showoc": true,
	"showhltb": true,
	"showpcgw": true,
	"showclient": true,
	"showsteamcardexchange": false,
	"showsteamdb": true,
	"showastatslink": true,
	"showwsgf": true,
	"show_keylol_links": false,
	"show_package_info": false,
	"show_sysreqcheck": false,
	"show_steamchart_info": true,
	"show_steamspy_info": true,
	"show_early_access": true,
	"show_alternative_linux_icon": false,
	"show_itad_button": false,
	"skip_got_steam": false,
	
	"hideinstallsteambutton": false,
	"hideaboutmenu": false,
	"showemptywishlist": true,
	"version_show": true,
	"replaceaccountname": false,
	"showfakeccwarning": true,
	"showlanguagewarning": true,
	"showlanguagewarninglanguage": "English",
	"homepage_tab_selection": "remember",
	"send_age_info": true,
	"html5video": true,
	"contscroll": true,
	"showdrm": true,
	"show_acrtag_info": false,
	"regional_hideworld": false,
	"showinvnav": true,
	"showesbg": true,
	"quickinv": true,
	"quickinv_diff": -0.01,
	"showallachievements": false,
	"showachinstore": true,
	"showcomparelinks": false,
	"showgreenlightbanner": false,
	"dynamicgreenlight": false,
	"remembergreenlightfilter": false,
	"endlessscrollinggreenlight": true,
	"hideactivelistings": false,
	"hidespamcomments": false,
	"spamcommentregex": "[\\u2500-\\u25FF]",
	"wlbuttoncommunityapp": true,
	"removeguideslanguagefilter": false,
	"disablelinkfilter": false,
	"show1clickgoo": true,
	"show_profile_link_images": "gray",
	"profile_steamrepcn": true,
	"profile_steamgifts": true,
	"profile_steamtrades": true,
	"profile_steamrep": true,
	"profile_steamdbcalc": true,
	"profile_astats": true,
	"profile_backpacktf": true,
	"profile_astatsnl": true,
	"profile_permalink": true,
	"steamcardexchange": true,
	"purchase_dates": true,
	"add_wallet_balance": true,
	"add_to_cart_wishlist": true,
	"show_badge_progress": true,
	"show_wishlist_link": true,
	"show_wishlist_count": true
};

// Saves options to localStorage
function save_options() {
	var saveSettings = {};
	
	$("[data-setting]").each(function(i, el) {
		var setting = $(el).data("setting");

		if (settings_defaults.hasOwnProperty(setting)) {
			if ($(el).is(":checkbox")) {
				saveSettings[setting] = $(el).prop("checked");
			} else {
				saveSettings[setting] = $(el).val();
			}
		}
	});

	// Get checked stores, but only if loaded already from storage
	if (!$("#stores_all").prop('checked') && $("#store_stores").hasClass("es_checks_loaded")) {
		saveSettings.stores = {};
		$("#store_stores").find("input[type='checkbox']").each(function(i, el) {
			saveSettings.stores[$(this).prop("id")] = $(this).prop("checked");
		});
	}

	if (!saveSettings.remembergreenlightfilter) {
		saveSettings.remembergreenlightfilter = [];
	}

	saveSettings.regional_countries = $.map($('.regional_country'), function(el, i) {
		return $(el).val();
	});
	// Remove empty countries
	for (var i = saveSettings.regional_countries.length - 1; i >= 0; i--) {
		if (saveSettings.regional_countries[i] === "") {
			saveSettings.regional_countries.splice(i, 1);
		}
	}

	saveSettings.quickinv_diff = parseFloat(saveSettings.quickinv_diff.trim()).toFixed(2);

	storage.set(saveSettings);

	$("#saved").stop(true, true).fadeIn().delay(600).fadeOut();
}

function toggle_stores() {
	if ($("#stores_all").prop('checked')) {
		$("#store_stores").hide();
	} else {
		$("#store_stores").show();
		storage.get(function(settings) {
			$("#store_stores").addClass("es_checks_loaded").find("input[type='checkbox']").each(function(i, checkbox) {
				$(checkbox).prop("checked", settings.stores[$(this).prop("id")]);
			});
		});
	}
}

function load_countries() {
	storage.get(function(settings) {
		$('.regional_country').each(function (i, el) {
			$(this).prop('value', settings.regional_countries[i]).siblings('.es_flag').addClass('es_flag_' + settings.regional_countries[i]);
		});
	});
}

var changelog_loaded,
	cc_data;

$.getJSON(chrome.extension.getURL('cc.json'), function (data) {
	cc_data = data;
});

// Restores select box state to saved value from SyncStorage.
function load_options() {
	storage.get(function(settings) {
		// Loops over the default settings and if the setting can't be found in storage the default is set
		function checkSettings(settings, settingsStrg) {
			var data = {};
			var dataToSet = {};

			$.each(settings, function(setting, defaultValue){
				if (typeof settingsStrg[setting] === 'undefined') {
					data[setting] = defaultValue;
					dataToSet[setting] = defaultValue;
				} else {
					data[setting] = settingsStrg[setting];
				}
			});

			if ($.isEmptyObject(dataToSet) === false) storage.set(dataToSet);

			return data;
		}

		// Initiate settings against the defaults
		settings = checkSettings(settings_defaults, settings);
		
		// Change the way we store stores settings
		if (settings.stores instanceof Array) {
			settings.stores = settings_defaults.stores;
			storage.set({"stores": settings_defaults.stores});
		}

		$("[data-parent-of]").on("change", function(){
			initParentOf($(this));
		});

		// Set the value or state for each input
		$("[data-setting]").each(function(){
			var setting = $(this).data("setting");

			if (settings_defaults.hasOwnProperty(setting)) {
				if ($(this).is(":checkbox")) {
					$(this).prop('checked', settings[setting]);
				} else {
					$(this).val(settings[setting]);
				}
			}

			if ($(this).data("parent-of")) {
				initParentOf($(this));
			}
		});

		if (!settings.profile_api_info){ $("#api_key_block").hide(); }
		if (settings.showregionalprice == "off") { $("#region_selects").hide(); }
		if (settings.showregionalprice != "mouse") { $("#regional_price_hideworld").hide(); }

		toggle_stores();
		populate_regional_selects();

		if (!changelog_loaded) {		
			$.get('changelog.txt', function(data) {
				$("#changelog_text").after("<textarea rows=28 cols=100 readonly>" + data + "</textarea>");
			});
			changelog_loaded = true;
		}

		load_translation();
		load_profile_link_images();
	});
}

function initParentOf(node) {
	var groupSel = $(node).data("parent-of"),
		state = !$(node).is(":checked");

	$(groupSel).toggleClass("disabled", state).find("input, select").prop("disabled", state);
}

var localized_strings = [];

function load_translation() {
	storage.get(function(settings) {		
		// Load translation
		if (settings.language === undefined) { settings.language = "english"; }

		var localization_promise = (function () {
			var l_deferred = new $.Deferred(),
				l_code;
			switch (settings.language) {
				case "bulgarian": l_code = "bg"; break;
				case "czech": l_code = "cs"; break;
				case "danish": l_code = "da"; break;
				case "dutch": l_code = "nl"; break;
				case "finnish": l_code = "fi"; break;
				case "french": l_code = "fr"; break;
				case "greek": l_code = "el"; break;
				case "german": l_code = "de"; break;
				case "hungarian": l_code = "hu"; break;
				case "italian": l_code = "it"; break;
				case "japanese": l_code = "ja"; break;
				case "koreana": l_code = "ko"; break;
				case "norwegian": l_code = "no"; break;
				case "polish": l_code = "pl"; break;
				case "portuguese": l_code = "pt-PT"; break;
				case "brazilian": l_code = "pt-BR"; break;
				case "russian": l_code = "ru"; break;
				case "romanian": l_code = "ro"; break;
				case "schinese": l_code = "zh-CN"; break;
				case "spanish": l_code = "es-ES"; break;
				case "swedish": l_code = "sv-SE"; break;
				case "tchinese": l_code = "zh-TW"; break;
				case "thai": l_code = "th"; break;
				case "turkish": l_code = "tr"; break;
				case "ukrainian": l_code = "ua"; break;
				default: l_code = "en"; break;
			}

			$.getJSON(chrome.extension.getURL('/localization/en/strings.json'), function (data) {
				if (l_code == "en") {
					localized_strings = data;
					l_deferred.resolve();
				} else {
					$.getJSON(chrome.extension.getURL('/localization/' + l_code + '/strings.json'), function (data_localized) {
						localized_strings = $.extend(true, data, data_localized);
						l_deferred.resolve();
					});
				}
			});

			return l_deferred.promise();
		})();

		// When locale files are loaded changed text on page accordingly
		localization_promise.done(function(){
			document.title = "Enhanced Steam " + localized_strings.thewordoptions;

			// Source: http://stackoverflow.com/a/24221895
			function resolveObjPath(obj, path) {
				path = path.split('.').reverse();
				var current = obj;

				while (path.length) {
					if (typeof current !== 'object') return undefined;
					current = current[path.pop()];
				}

				return current;
			}

			if (!(settings.language == "schinese" || settings.language == "tchinese")) {
				$("#profile_steamrepcn").parent().hide();
				$("#show_keylol_links").parent().hide();
			} else {
				if (settings.language == "schinese") { var title = "显示 Keylol 链接"; }
				if (settings.language == "tchinese") { var title = "顯示Keylol連結"; }
				$("#store_keylol_text").text(title);
			}

			// Localize elements with text
			$("[data-locale-text]").text(function(){
				return resolveObjPath( localized_strings, $(this).data("locale-text") );
			});

			// Localize elements with html
			$("[data-locale-html]").html(function(){
				return resolveObjPath( localized_strings, $(this).data("locale-html") );
			});

			$("#warning_language option").each(function() {
				var lang = $(this).text();
				var lang_trl = localized_strings.options.lang[this.value.toLowerCase()];
				if (lang != lang_trl) {
					$(this).text(lang + " (" + lang_trl + ")");
				}
			});

			$.each(localized_strings.options.lang, function(lang, lang_trl) {
				$(".language." + lang).text(lang_trl + ":");
			});
		});	
	});
}

function load_profile_link_images() {
	storage.get(function(settings) {
		settings.show_profile_link_images = $("#profile_link_images_dropdown").val();
		$("#profile_link_images_dropdown").val(settings.show_profile_link_images);
		
		$(".es_sites_icons").show();
		$("#profile_links").toggleClass("es_gray", (settings.show_profile_link_images == "gray"));
		
		if (settings.show_profile_link_images == "false") {
			$(".es_sites_icons").hide();
		}
	});
}

function populate_regional_selects() {
	var add_another_wrapper = $('#add_another_region').parent(),
		region_selection = generate_region_select();

	storage.get(function (settings) {
		$.each(settings.regional_countries, function () {
			add_another_wrapper.before(region_selection.clone());
		});
	});

	load_countries();
}

function add_region_selector() {
	var add_another_wrapper = $('#add_another_region').parent(),
		region_selection = generate_region_select();

	add_another_wrapper.before(region_selection.clone());
}

function generate_region_select() {
	var region_selection = $('<li/>'),
		options = $();

	$.each(window.cc_data, function (index, value) {
		options = options.add($('<option/>').attr('value', index.toLowerCase()).text(value));
	});

	region_selection.append($('<span/>').addClass('es_flag'));
	region_selection.append($('<select/>').addClass('regional_country').append(options));
	region_selection.append($('<a/>').addClass('select2-search-choice-close remove_region'));

	return region_selection;
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

function steam_credits() {
	var credit_array = ["76561198040672342","76561198000198761"];
	get_http('http://api.enhancedsteam.com/steamapi/GetPlayerSummaries/?steamids=' + credit_array.join(","), function (txt) {
		var data = JSON.parse(txt).response.players;
		data.sort(function(a,b){return a["steamid"].localeCompare(b["steamid"])});
		$("#jshackles_steam").text(data[1]["personaname"]);
		$("#smashman_steam").text(data[0]["personaname"]);
	});
}

function clear_settings() {
	storage.get(function(settings) {
		var confirm_reset = confirm(localized_strings.options.clear);
		if (confirm_reset) {
			storage.clear();
			load_options();
			$("#reset_note").stop(true,true).fadeIn().delay(600).fadeOut();
		}
	});
}

function change_flag(node, selectnode) {
	node.removeClass();
	node.addClass("es_flag_" + selectnode.val() +" es_flag");
}

function load_default_countries() {
	regional_countries = ["us","gb","eu1","ru","br","au","jp"];
	storage.set({'regional_countries': regional_countries}, function() {
		$('#region_selects').find('li').remove();
		populate_regional_selects();
		$("#saved").stop(true,true).fadeIn().delay(600).fadeOut();
	});	
}


$(document).ready(function(){
	load_options();
	load_profile_link_images();

	$("#language").on("change", load_translation);
	$("#profile_link_images_dropdown").on("change", load_profile_link_images);

	$("#highlight_owned_default").on("click", function(){ $("#highlight_owned_color").val( highlight_defaults.owned ); });
	$("#highlight_wishlist_default").on("click", function(){ $("#highlight_wishlist_color").val( highlight_defaults.wishlist ); });
	$("#highlight_coupon_default").on("click", function(){ $("#highlight_coupon_color").val( highlight_defaults.coupon ); });
	$("#highlight_inv_gift_default").on("click", function(){ $("#highlight_inv_gift_color").val( highlight_defaults.inv_gift ); });
	$("#highlight_inv_guestpass_default").on("click", function(){ $("#highlight_inv_guestpass_color").val( highlight_defaults.inv_guestpass ); });
	$("#highlight_notinterested_default").on("click", function(){ $("#highlight_notinterested_color").val( highlight_defaults.notinterested ); });

	$("#tag_owned_color_default").on("click", function(){ $("#tag_owned_color").val( highlight_defaults.owned ); });
	$("#tag_wishlist_default").on("click", function(){ $("#tag_wishlist_color").val( highlight_defaults.wishlist ); });
	$("#tag_coupon_default").on("click", function(){ $("#tag_coupon_color").val( highlight_defaults.coupon ); });
	$("#tag_inv_gift_default").on("click", function(){ $("#tag_inv_gift_color").val( highlight_defaults.inv_gift ); });
	$("#tag_inv_guestpass_default").on("click", function(){ $("#tag_inv_guestpass_color").val( highlight_defaults.inv_guestpass ); });
	$("#tag_notinterested_default").on("click", function(){ $("#tag_notinterested_color").val( highlight_defaults.notinterested ); });

	$("#spamcommentregex_default").on("click", function(){ $("#spamcommentregex").val("[\\u2500-\\u25FF]"); });
	$("#quickinv_default").on("click", function() { $("#quickinv_diff").val("-0.01"); });
	$("#quickinv_diff").focusout(function() { if (isNaN(parseFloat($("#quickinv_diff").val()))) { $("#quickinv_diff").val("-0.01"); } });

	$("#show_spamcommentregex").on("click", function(){ $("#spamcommentregex_list").toggle(); });
	$("#show_quickinv_diff").on("click", function() { $("#quickinv_opt").toggle(); });
	$('#stores_all').on("change", toggle_stores);
	$("#reset_countries").on("click", load_default_countries);
	$('#region_selects').on('change', '.regional_country', function() {
		var $this = $(this);
		change_flag($this.siblings('.es_flag'), $this);
		save_options();
	}).on('click', '.remove_region', function(){
		$(this).closest('li').remove();
		save_options();
	});

	$('#add_another_region').on("click", add_region_selector);

	$("#regional_price_on").on("change", function() {
		$("#region_selects").toggle($(this).val() != "off");
		$("#regional_price_hideworld").toggle($(this).val() == "mouse");
	});

	$("#profile_api_info").on("change", function(){
		$("#api_key_block").toggle($(this).prop("checked"));
	});

	// Toggle tabs content
	$("a.tab_row").on("click", function(){
		var block_sel = $(this).data("block-sel");

		$(".content").hide();
		$(block_sel).show();

		$(".selected").removeClass("selected");
		$(this).addClass("selected");
	});

	$("input[type=checkbox]").on("change", save_options);
	$("input[type=text]").on("blur", save_options);
	$("button:not(#reset):not(#reset_countries):not(#add_another_region)").on("click", save_options);
	$(".colorbutton").on("change", save_options);
	$("select").on("change", save_options);

	$("#reset").on("click", clear_settings);

	steam_credits();
});
