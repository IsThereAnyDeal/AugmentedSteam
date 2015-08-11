
// Saves options to localStorage.
function save_options() {
	// Store Options
	highlight_owned_color = $("#highlight_owned_color").val();
	highlight_wishlist_color = $("#highlight_wishlist_color").val();
	highlight_coupon_color = $("#highlight_coupon_color").val();
	highlight_inv_gift_color = $("#highlight_inv_gift_color").val();
	highlight_inv_guestpass_color = $("#highlight_inv_guestpass_color").val();

	tag_owned_color = $("#tag_owned_color").val();
	tag_owned_color = $("#tag_owned_color").val();
	tag_wishlist_color = $("#tag_wishlist_color").val();
	tag_coupon_color = $("#tag_coupon_color").val();
	tag_inv_gift_color = $("#tag_inv_gift_color").val();
	tag_inv_guestpass_color = $("#tag_inv_guestpass_color").val();

	highlight_owned = $("#highlight_owned").prop('checked');
	highlight_wishlist = $("#highlight_wishlist").prop('checked');
	highlight_coupon = $("#highlight_coupon").prop('checked');
	highlight_inv_gift = $("#highlight_inv_gift").prop('checked');
	highlight_inv_guestpass = $("#highlight_inv_guestpass").prop('checked');
	highlight_excludef2p = $("#highlight_excludef2p").prop('checked');

	tag_owned = $("#tag_owned").prop('checked');
	tag_wishlist = $("#tag_wishlist").prop('checked');
	tag_coupon = $("#tag_coupon").prop('checked');
	tag_inv_gift = $("#tag_inv_gift").prop('checked');
	tag_inv_guestpass = $("#tag_inv_guestpass").prop('checked');
	
	hide_owned = $("#hide_owned").prop('checked');
	hidetmsymbols = $("#hidetmsymbols").prop('checked');

	hideinstallsteambutton = $("#hideinstallsteambutton").prop('checked');
	hideaboutmenu = $("#hideaboutmenu").prop('checked');
	replaceaccountname = $("#replaceaccountname").prop('checked');
	showfakeccwarning = $("#showfakeccwarning").prop('checked');
	showlanguagewarning = $("#showlanguagewarning").prop('checked');
	showlanguagewarninglanguage = $("#warning_language").val();
	homepage_tab_selection = $("#homepage_tab_selection").val();
	send_age_info = $("#send_age_info").prop('checked');
	html5video = $("#html5video").prop('checked');
	contscroll = $("#contscroll").prop('checked');
	showdrm = $("#showdrm").prop('checked');
	show_acrtag_info = $("#showacrtag").prop('checked');
	showmcus = $("#showmcus").prop('checked');
	showhltb = $("#showhltb").prop('checked');
	showpcgw = $("#showpcgw").prop('checked');
	showsteamcardexchange = $("#showsteamcardexchange").prop('checked');
	showsteamdb = $("#showsteamdb").prop('checked');
	showastatslink = $("#showastatslink").prop('checked');
	showwsgf = $("#showwsgf").prop('checked');
	show_package_info = $("#show_package_info").prop('checked');
	show_sysreqcheck = $("#show_sysreqcheck").prop('checked');
	show_steamchart_info = $("#show_steamchart_info").prop('checked');
	show_steamspy_info = $("#show_steamspy_info").prop('checked');
	show_carousel_descriptions = $("#show_carousel_descriptions").prop('checked');
	show_early_access = $("#show_early_access").prop('checked');
	show_alternative_linux_icon = $("#show_alternative_linux_icon").prop('checked');
	
	// Price Options
	showlowestprice = $("#showlowestprice").prop('checked');
	showlowestprice_onwishlist = $("#showlowestprice_onwishlist").prop('checked');
	showlowestpricecoupon = $("#showlowestpricecoupon").prop('checked');
	showallstores = $("#stores_all").prop('checked');
	stores = [
		$("#steam").prop('checked'),
		$("#amazonus").prop('checked'),
		$("#impulse").prop('checked'),
		$("#gamersgate").prop('checked'),
		$("#greenmangaming").prop('checked'),
		$("#gamefly").prop('checked'),
		$("#origin").prop('checked'),
		$("#uplay").prop('checked'),
		$("#indiegalastore").prop('checked'),
		$("#gametap").prop('checked'),
		$("#gamesplanet").prop('checked'),
		$("#getgames").prop('checked'),
		$("#desura").prop('checked'),
		$("#gog").prop('checked'),
		$("#dotemu").prop('checked'),
		$("#gameolith").prop('checked'),
		$("#adventureshop").prop('checked'),
		$("#nuuvem").prop('checked'),
		$("#shinyloot").prop('checked'),
		$("#dlgamer").prop('checked'),			
		$("#humblestore").prop('checked'),
		$("#indiegamestand").prop('checked'),
		$("#squenix").prop('checked'),
		$("#bundlestars").prop('checked'),
		$("#fireflower").prop('checked'),
		$("#humblewidgets").prop('checked'),
		$("#newegg").prop('checked'),
		$("#gamesrepublic").prop('checked'),
		$("#coinplay").prop('checked'),
		$("#funstock").prop('checked')
	];
	showregionalprice = $("#regional_price_on").val();
	regional_hideworld = $("#regional_hideworld").prop('checked');
	regional_countries = $.map($('.regional_country'), function (el, i) {
		return $(el).val();
	});

	for(var i = regional_countries.length - 1; i >= 0; i--) {
	    if(regional_countries[i] === "") {
	       regional_countries.splice(i, 1);
	    }
	}

	// Community Options
	showtotal = $("#showtotal").prop('checked');
	showmarkettotal = $("#showmarkettotal").prop('checked');
	showsteamrepapi = $("#showsteamrepapi").prop('checked');
	showinvnav = $("#showinvnav").prop('checked');
	showesbg = $("#showesbg").prop('checked');
	quickinv = $("#quickinv").prop('checked');
	quickinv_diff = parseFloat($("#quickinv_diff").val().trim()).toFixed(2);
	showallachievements = $("#showallachievements").prop('checked');
	showcomparelinks = $("#showcomparelinks").prop('checked');
	showgreenlightbanner = $("#showgreenlightbanner").prop('checked');
	dynamicgreenlight = $("#dynamicgreenlight").prop('checked');
	disablegreenlightautoplay = $("#disablegreenlightautoplay").prop('checked');
	hideactivelistings = $("#hideactivelistings").prop('checked');
	hidespamcomments = $("#hidespamcomments").prop('checked');
	spamcommentregex = $("#spamcommentregex").val().trim();
	wlbuttoncommunityapp = $("#wlbuttoncommunityapp").prop('checked');
	show1clickgoo = $("#show1clickgoo").prop('checked');

	// Profile Link Options
	profile_steamgifts = $("#profile_steamgifts").prop('checked');
	profile_steamrep = $("#profile_steamrep").prop('checked');
	profile_steamdbcalc = $("#profile_steamdbcalc").prop('checked');
	profile_wastedonsteam = $("#profile_wastedonsteam").prop('checked');
	profile_astats = $("#profile_astats").prop('checked');
	profile_backpacktf = $("#profile_backpacktf").prop('checked');
	profile_astatsnl = $("#profile_astatsnl").prop('checked');
	profile_api_info = $("#profile_api_info").prop('checked');
	api_key = $("#api_key").val();
	profile_permalink = $("#profile_permalink").prop('checked');
	show_profile_link_images = $("#profile_link_images_dropdown").val();
	
	steamcardexchange = $("#steamcardexchange").prop('checked');

	chrome.storage.sync.set({
		'highlight_owned_color': highlight_owned_color,
		'highlight_wishlist_color': highlight_wishlist_color,
		'highlight_coupon_color': highlight_coupon_color,
		'highlight_inv_gift_color': highlight_inv_gift_color,
		'highlight_inv_guestpass_color': highlight_inv_guestpass_color,
		'highlight_excludef2p': highlight_excludef2p,

		'tag_owned_color': tag_owned_color,
		'tag_wishlist_color': tag_wishlist_color,
		'tag_coupon_color': tag_coupon_color,
		'tag_inv_gift_color': tag_inv_gift_color,
		'tag_inv_guestpass_color': tag_inv_guestpass_color,

		'highlight_owned': highlight_owned,
		'highlight_wishlist': highlight_wishlist,
		'highlight_coupon': highlight_coupon,
		'highlight_inv_gift': highlight_inv_gift,
		'highlight_inv_guestpass': highlight_inv_guestpass,

		'tag_owned': tag_owned,
		'tag_wishlist': tag_wishlist,
		'tag_coupon': tag_coupon,
		'tag_inv_gift': tag_inv_gift,
		'tag_inv_guestpass': tag_inv_guestpass,
		
		'hide_owned': hide_owned,
		'hidetmsymbols': hidetmsymbols,

		'hideinstallsteambutton': hideinstallsteambutton,
		'hideaboutmenu': hideaboutmenu,
		'replaceaccountname': replaceaccountname,
		'showfakeccwarning': showfakeccwarning,
		'showlanguagewarning': showlanguagewarning,
		'showlanguagewarninglanguage': showlanguagewarninglanguage,
		'homepage_tab_selection': homepage_tab_selection,
		'send_age_info': send_age_info,
		'html5video': html5video,
		'contscroll': contscroll,
		'showdrm': showdrm,
		'show_acrtag_info': show_acrtag_info,
		'showmcus': showmcus,
		'showhltb': showhltb,
		'showpcgw': showpcgw,
		'showsteamcardexchange': showsteamcardexchange,
		'showsteamdb': showsteamdb,
		'showastatslink': showastatslink,
		'showwsgf': showwsgf,
		'show_package_info': show_package_info,
		'show_sysreqcheck': show_sysreqcheck,
		'show_steamchart_info': show_steamchart_info,
		'show_steamspy_info': show_steamspy_info,
		'show_carousel_descriptions': show_carousel_descriptions,
		'show_early_access': show_early_access,
		'show_alternative_linux_icon': show_alternative_linux_icon,
		
		'showlowestprice': showlowestprice,
		'showlowestprice_onwishlist': showlowestprice_onwishlist,
		'showlowestpricecoupon': showlowestpricecoupon,
		'showallstores': showallstores,
		'stores': stores,
		'showregionalprice': showregionalprice,
		'regional_hideworld': regional_hideworld,
		'regional_countries': regional_countries,

		'showtotal': showtotal,
		'showmarkettotal': showmarkettotal,
		'showsteamrepapi': showsteamrepapi,
		'showinvnav': showinvnav,
		'showesbg': showesbg,
		'quickinv': quickinv,
		'quickinv_diff': quickinv_diff,
		'showallachievements': showallachievements,
		'showcomparelinks': showcomparelinks,
		'showgreenlightbanner': showgreenlightbanner,
		'dynamicgreenlight': dynamicgreenlight,
		'disablegreenlightautoplay': disablegreenlightautoplay,
		'hideactivelistings': hideactivelistings,
		'hidespamcomments': hidespamcomments,
		'spamcommentregex': spamcommentregex,
		'wlbuttoncommunityapp': wlbuttoncommunityapp,
		'show1clickgoo': show1clickgoo,

		'profile_steamgifts': profile_steamgifts,
		'profile_steamrep': profile_steamrep,
		'profile_steamdbcalc': profile_steamdbcalc,
		'profile_astats': profile_astats,
		'profile_backpacktf': profile_backpacktf,
		'profile_astatsnl': profile_astatsnl,
		'profile_api_info': profile_api_info,
		'api_key': api_key,
		'profile_permalink': profile_permalink,
		'show_profile_link_images': show_profile_link_images,
		
		'steamcardexchange': steamcardexchange
	});
	$("#saved").stop(true,true).fadeIn().delay(600).fadeOut();
}

// toggles pages
function load_store_tab() {
	$(".content").hide();
	$("#maincontent_store").show();	
	$(".selected").removeClass("selected");
	$("#nav_store").addClass("selected");
}

function load_price_tab() {
	$(".content").hide();
	$("#maincontent_price").show();	
	$(".selected").removeClass("selected");
	$("#nav_price").addClass("selected");
}

function load_community_tab() {
	$(".content").hide();
	$("#maincontent_community").show();
	$(".selected").removeClass("selected");
	$("#nav_community").addClass("selected");
}

function load_news_tab() {
	$(".content").hide();	
	$("#maincontent_news").show();
	$(".selected").removeClass("selected");
	$("#nav_news").addClass("selected");
}

function load_about_tab() {
	$(".content").hide();
	$("#maincontent_about").show();
	$(".selected").removeClass("selected");
	$("#nav_about").addClass("selected");
}

function load_credits_tab() {
	$(".content").hide();	
	$("#maincontent_credits").show();
	$(".selected").removeClass("selected");
	$("#nav_credits").addClass("selected");
}

function toggle_stores() {
	var all_stores = $("#stores_all").prop('checked');
	switch (all_stores) {
		case true: 
		$("#store_stores").hide();
		break;
		case false:
		$("#store_stores").show();
		chrome.storage.sync.get(function(settings) {
			$("#steam").prop('checked', settings.stores[0]);
			$("#amazonus").prop('checked', settings.stores[1]);
			$("#impulse").prop('checked', settings.stores[2]);
			$("#gamersgate").prop('checked', settings.stores[3]);
			$("#greenmangaming").prop('checked', settings.stores[4]);
			$("#gamefly").prop('checked', settings.stores[5]);
			$("#origin").prop('checked', settings.stores[6]);
			$("#uplay").prop('checked', settings.stores[7]);
			$("#indiegalastore").prop('checked', settings.stores[8]);
			$("#gametap").prop('checked', settings.stores[9]);
			$("#gamesplanet").prop('checked', settings.stores[10]);
			$("#getgames").prop('checked', settings.stores[11]);
			$("#desura").prop('checked', settings.stores[12]);
			$("#gog").prop('checked', settings.stores[13]);
			$("#dotemu").prop('checked', settings.stores[14]);
			$("#gameolith").prop('checked', settings.stores[15]);
			$("#adventureshop").prop('checked', settings.stores[16]);
			$("#nuuvem").prop('checked', settings.stores[17]);
			$("#shinyloot").prop('checked', settings.stores[18]);
			$("#dlgamer").prop('checked', settings.stores[19]);
			$("#humblestore").prop('checked', settings.stores[20]);
			$("#indiegamestand").prop('checked', settings.stores[21]);
			$("#squenix").prop('checked', settings.stores[22]);
			$("#bundlestars").prop('checked', settings.stores[23]);
			$("#fireflower").prop('checked', settings.stores[24]);
			$("#humblewidgets").prop('checked', settings.stores[25]);
			$("#newegg").prop('checked', settings.stores[26]);
			$("#gamesrepublic").prop('checked', settings.stores[27]);
			$("#coinplay").prop('checked', settings.stores[28]);
			$("#funstock").prop('checked', settings.stores[29]);
		});
		break;
	}
}

function load_countries() {
	chrome.storage.sync.get(function(settings) {
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
	chrome.storage.sync.get(function(settings) {

		// Load default values for settings if they do not exist (and sync them to Google)
		if (settings.language === undefined) { settings.language = "eng"; chrome.storage.sync.set({'language': settings.language}); }
		if (settings.highlight_owned_color === undefined) { settings.highlight_owned_color = "#5c7836";	chrome.storage.sync.set({'highlight_owned_color': settings.highlight_owned_color});	}
		if (settings.highlight_wishlist_color === undefined) { settings.highlight_wishlist_color = "#d3deea";	chrome.storage.sync.set({'highlight_wishlist_color': settings.highlight_wishlist_color}); }
		if (settings.highlight_coupon_color === undefined) { settings.highlight_coupon_color = "#6b2269";	chrome.storage.sync.set({'highlight_coupon_color': settings.highlight_coupon_color}); }
		if (settings.highlight_inv_gift_color === undefined) { settings.highlight_inv_gift_color = "#a75124";	chrome.storage.sync.set({'highlight_inv_gift_color': settings.highlight_inv_gift_color}); }
		if (settings.highlight_inv_guestpass_color === undefined) { settings.highlight_inv_guestpass_color = "#a75124";	chrome.storage.sync.set({'highlight_inv_guestpass_color': settings.highlight_inv_guestpass_color}); }

		if (settings.tag_owned_color === undefined) { settings.tag_owned_color = "#5c7836";	chrome.storage.sync.set({'tag_owned_color': settings.tag_owned_color});	}
		if (settings.tag_wishlist_color === undefined) { settings.tag_wishlist_color = "#d3deea";	chrome.storage.sync.set({'tag_wishlist_color': settings.tag_wishlist_color}); }
		if (settings.tag_coupon_color === undefined) { settings.tag_coupon_color = "#6b2269";	chrome.storage.sync.set({'tag_coupon_color': settings.tag_coupon_color}); }
		if (settings.tag_inv_gift_color === undefined) { settings.tag_inv_gift_color = "#a75124";	chrome.storage.sync.set({'tag_inv_gift_color': settings.tag_inv_gift_color}); }
		if (settings.tag_inv_guestpass_color === undefined) { settings.tag_inv_guestpass_color = "#a75124";	chrome.storage.sync.set({'tag_inv_guestpass_color': settings.tag_inv_guestpass_color}); }

		if (settings.highlight_owned === undefined) { settings.highlight_owned = false; chrome.storage.sync.set({'highlight_owned': settings.highlight_owned}); }
		if (settings.highlight_wishlist === undefined) { settings.highlight_wishlist = false; chrome.storage.sync.set({'highlight_wishlist': settings.highlight_wishlist}); }
		if (settings.highlight_coupon === undefined) { settings.highlight_coupon = false; chrome.storage.sync.set({'highlight_coupon': settings.highlight_coupon}); }
		if (settings.highlight_inv_gift === undefined) { settings.highlight_inv_gift = false; chrome.storage.sync.set({'highlight_inv_gift': settings.highlight_inv_gift}); }
		if (settings.highlight_inv_guestpass === undefined) { settings.highlight_inv_guestpass = false; chrome.storage.sync.set({'highlight_inv_guestpass': settings.highlight_inv_guestpass}); }
		if (settings.highlight_excludef2p === undefined) { settings.highlight_excludef2p = false; chrome.storage.sync.set({'highlight_excludef2p': settings.highlight_excludef2p}); }

		if (settings.tag_owned === undefined) { settings.tag_owned = false; chrome.storage.sync.set({'tag_owned': settings.tag_owned}); }
		if (settings.tag_wishlist === undefined) { settings.tag_wishlist = false; chrome.storage.sync.set({'tag_wishlist': settings.tag_wishlist}); }
		if (settings.tag_coupon === undefined) { settings.tag_coupon = false; chrome.storage.sync.set({'tag_coupon': settings.tag_coupon}); }
		if (settings.tag_inv_gift === undefined) { settings.tag_inv_gift = false; chrome.storage.sync.set({'tag_inv_gift': settings.tag_inv_gift}); }
		if (settings.tag_inv_guestpass === undefined) { settings.tag_inv_guestpass = false; chrome.storage.sync.set({'tag_inv_guestpass': settings.tag_inv_guestpass}); }

		if (settings.hide_owned === undefined) { settings.hide_owned = false; chrome.storage.sync.set({'hide_owned': settings.hide_owned}); }
		if (settings.hidetmsymbols === undefined) { settings.hidetmsymbols = false; chrome.storage.sync.set({'hidetmsymbols': settings.hidetmsymbols}); }

		if (settings.showlowestprice === undefined) { settings.showlowestprice = true; chrome.storage.sync.set({'showlowestprice': settings.showlowestprice}); }
		if (settings.showlowestprice_onwishlist === undefined) { settings.showlowestprice_onwishlist = true; chrome.storage.sync.set({'showlowestprice_onwishlist': settings.showlowestprice_onwishlist}); }
		if (settings.showlowestpricecoupon === undefined) { settings.showlowestpricecoupon = true; chrome.storage.sync.set({'showlowestpricecoupon': settings.showlowestpricecoupon}); }
		if (settings.showallstores === undefined) { settings.showallstores = true; chrome.storage.sync.set({'showallstores': settings.showallstores}); }
		if (settings.stores === undefined) { settings.stores = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]; chrome.storage.sync.set({'stores': settings.stores}); }
		if (settings.showregionalprice === undefined) { settings.showregionalprice = "mouse"; chrome.storage.sync.set({'showregionalprice': settings.showregionalprice}); }
		if (settings.regional_countries === undefined) { settings.regional_countries = ["us","gb","eu1","eu2","ru","br","au","jp"]; chrome.storage.sync.set({'regional_countries': settings.regional_countries}); }

		if (settings.showtotal === undefined) { settings.showtotal = true; chrome.storage.sync.set({'showtotal': settings.showtotal}); }
		if (settings.showmarkettotal === undefined) { settings.showmarkettotal = true; chrome.storage.sync.set({'showmarkettotal': settings.showmarkettotal}); }
		if (settings.showsteamrepapi === undefined) { settings.showsteamrepapi = true; chrome.storage.sync.set({'showsteamrepapi': settings.showsteamrepapi}); }
		if (settings.showmcus === undefined) { settings.showmcus = true; chrome.storage.sync.set({'showmcus': settings.showmcus}); }
		if (settings.showhltb === undefined) { settings.showhltb = true; chrome.storage.sync.set({'showhltb': settings.showhltb}); }
		if (settings.showpcgw === undefined) { settings.showpcgw = true; chrome.storage.sync.set({'showpcgw': settings.showpcgw}); }
		if (settings.showsteamcardexchange === undefined) { settings.showsteamcardexchange = false; chrome.storage.sync.set({'showsteamcardexchange': settings.showsteamcardexchange}); }
		if (settings.showsteamdb === undefined) { settings.showsteamdb = true; chrome.storage.sync.set({'showsteamdb': settings.showsteamdb}); }
		if (settings.showastatslink === undefined) { settings.showastatslink = true; chrome.storage.sync.set({'showastatslink': settings.showastatslink}); }
		if (settings.showwsgf === undefined) { settings.showwsgf = true; chrome.storage.sync.set({'showwsgf': settings.showwsgf}); }
		if (settings.show_package_info === undefined) { settings.show_package_info = false; chrome.storage.sync.set({'show_package_info': settings.show_package_info}); }
		if (settings.show_sysreqcheck === undefined) { settings.show_sysreqcheck = false; chrome.storage.sync.set({'show_sysreqcheck': settings.show_sysreqcheck}); }
		if (settings.show_steamchart_info === undefined) { settings.show_steamchart_info = true; chrome.storage.sync.set({'show_steamchart_info': settings.show_steamchart_info}); }
		if (settings.show_steamspy_info === undefined) { settings.show_steamspy_info = true; chrome.storage.sync.set({'show_steamspy_info': settings.show_steamspy_info}); }
		if (settings.show_carousel_descriptions === undefined) { settings.show_carousel_descriptions = true; chrome.storage.sync.set({'show_carousel_descriptions': settings.show_carousel_descriptions}); }
		if (settings.show_early_access === undefined) { settings.show_early_access = true; chrome.storage.sync.set({'show_early_access': settings.show_early_access}); }
		if (settings.show_alternative_linux_icon === undefined) { settings.show_alternative_linux_icon = false; chrome.storage.sync.set({'show_alternative_linux_icon': settings.show_alternative_linux_icon}); }
		
		if (settings.hideinstallsteambutton === undefined) { settings.hideinstallsteambutton = false; chrome.storage.sync.set({'hideinstallsteambutton': settings.hideinstallsteambutton}); }
		if (settings.hideaboutmenu === undefined) { settings.hideaboutmenu = false; chrome.storage.sync.set({'hideaboutmenu': settings.hideaboutmenu}); }
		if (settings.replaceaccountname === undefined) { settings.replaceaccountname = false; chrome.storage.sync.set({'replaceaccountname': settings.replaceaccountname}); }
		if (settings.showfakeccwarning === undefined) { settings.showfakeccwarning = true; chrome.storage.sync.set({'showfakeccwarning': settings.showfakeccwarning}); }
		if (settings.showlanguagewarning === undefined) { settings.showlanguagewarning = true; chrome.storage.sync.set({'showlanguagewarning': settings.showlanguagewarning}); }
		if (settings.showlanguagewarninglanguage === undefined) { settings.showlanguagewarninglanguage = "English"; chrome.storage.sync.set({'showlanguagewarninglanguage': settings.showlanguagewarninglanguage}); }
		if (settings.homepage_tab_selection === undefined) { settings.homepage_tab_selection = "remember"; chrome.storage.sync.set({'homepage_tab_selection': settings.homepage_tab_selection}); }
		if (settings.send_age_info === undefined) { settings.send_age_info = true; chrome.storage.sync.set({'send_age_info': settings.send_age_info}); }
		if (settings.html5video === undefined) { settings.html5video = true; chrome.storage.sync.set({'html5video': settings.html5video}); }
		if (settings.contscroll === undefined) { settings.contscroll = true; chrome.storage.sync.set({'contscroll': settings.contscroll}); }
		if (settings.showdrm === undefined) { settings.showdrm = true; chrome.storage.sync.set({'showdrm': settings.showdrm}); }
		if (settings.show_acrtag_info === undefined) { settings.show_acrtag_info = false; chrome.storage.sync.set({'show_acrtag_info': settings.show_acrtag_info}); }
		if (settings.regional_hideworld===undefined) { settings.regional_hideworld = false; chrome.storage.sync.set({'regional_hideworld': settings.regional_hideworld});}
		if (settings.showinvnav === undefined) { settings.showinvnav = false; chrome.storage.sync.set({'showinvnav': settings.showinvnav}); }
		if (settings.showesbg === undefined) { settings.showesbg = true; chrome.storage.sync.set({'showesbg': settings.showesbg}); }
		if (settings.quickinv === undefined) { settings.quickinv = true; chrome.storage.sync.set({'quickinv': settings.quickinv}); }
		if (settings.quickinv_diff === undefined) { settings.quickinv_diff = -0.01; chrome.storage.sync.set({'quickinv_diff': settings.quickinv_diff}); }
		if (settings.showallachievements === undefined) { settings.showallachievements = false; chrome.storage.sync.set({'showallachievements': settings.showallachievements}); }
		if (settings.showcomparelinks === undefined) { settings.showcomparelinks = false; chrome.storage.sync.set({'showcomparelinks': settings.showcomparelinks}); }
		if (settings.showgreenlightbanner === undefined) { settings.showgreenlightbanner = false; chrome.storage.sync.set({'showgreenlightbanner': settings.showgreenlightbanner}); }
		if (settings.dynamicgreenlight === undefined) { settings.dynamicgreenlight = false; chrome.storage.sync.set({'dynamicgreenlight': settings.dynamicgreenlight}); }
		if (settings.disablegreenlightautoplay === undefined) { settings.disablegreenlightautoplay = false; chrome.storage.sync.set({'disablegreenlightautoplay': settings.disablegreenlightautoplay}); }
		if (settings.hideactivelistings === undefined) { settings.hideactivelistings = false; chrome.storage.sync.set({'hideactivelistings': settings.hideactivelistings}); }
		if (settings.hidespamcomments === undefined) { settings.hidespamcomments = false; chrome.storage.sync.set({'hidespamcomments': settings.hidespamcomments}); }
		if (settings.spamcommentregex === undefined) { settings.spamcommentregex = "[\\u2500-\\u25FF]"; chrome.storage.sync.set({'spamcommentregex': settings.spamcommentregex}); }
		if (settings.wlbuttoncommunityapp === undefined) { settings.wlbuttoncommunityapp = true; chrome.storage.sync.set({'wlbuttoncommunityapp': settings.wlbuttoncommunityapp}); }
		if (settings.show1clickgoo === undefined) { settings.show1clickgoo = true; chrome.storage.sync.set({'show1clickgoo': settings.show1clickgoo}); }
		if (settings.show_profile_link_images === undefined) { settings.show_profile_link_images = "gray"; chrome.storage.sync.set({'show_profile_link_images': settings.show_profile_link_images}); }
		if (settings.profile_steamgifts === undefined) { settings.profile_steamgifts = true; chrome.storage.sync.set({'profile_steamgifts': settings.profile_steamgifts}); }
		if (settings.profile_steamrep === undefined) { settings.profile_steamrep = true; chrome.storage.sync.set({'profile_steamrep': settings.profile_steamrep}); }
		if (settings.profile_steamdbcalc === undefined) { settings.profile_steamdbcalc = true; chrome.storage.sync.set({'profile_steamdbcalc': settings.profile_steamdbcalc}); }
		if (settings.profile_astats === undefined) { settings.profile_astats = true; chrome.storage.sync.set({'profile_astats': settings.profile_astats}); }
		if (settings.profile_backpacktf === undefined) { settings.profile_backpacktf = true; chrome.storage.sync.set({'profile_backpacktf': settings.profile_backpacktf}); }
		if (settings.profile_astatsnl === undefined) { settings.profile_astatsnl = true; chrome.storage.sync.set({'profile_astatsnl': settings.profile_astatsnl}); }
		if (settings.profile_api_info === undefined) { settings.profile_api_info = false; chrome.storage.sync.set({'profile_api_info': settings.profile_api_info}); }
		if (settings.api_key == false||settings.api_key==""||settings.api_key===undefined){ settings.profile_api_info = false; chrome.storage.sync.set({'profile_api_info': settings.profile_api_info});}
		if (settings.profile_permalink === undefined) { settings.profile_permalink = true; chrome.storage.sync.set({'profile_permalink': settings.profile_permalink}); }
		if (settings.steamcardexchange == undefined) { settings.steamcardexchange = true; chrome.storage.sync.set({'steamcardexchange': settings.steamcardexchange}); }
		
		// Load Store Options
		$("#highlight_owned_color").val(settings.highlight_owned_color);
		$("#highlight_wishlist_color").val(settings.highlight_wishlist_color);
		$("#highlight_coupon_color").val(settings.highlight_coupon_color);
		$("#highlight_inv_gift_color").val(settings.highlight_inv_gift_color);
		$("#highlight_inv_guestpass_color").val(settings.highlight_inv_guestpass_color);

		$("#tag_owned_color").val(settings.tag_owned_color);
		$("#tag_owned_color").val(settings.tag_owned_color);
		$("#tag_wishlist_color").val(settings.tag_wishlist_color);
		$("#tag_coupon_color").val(settings.tag_coupon_color);
		$("#tag_inv_gift_color").val(settings.tag_inv_gift_color);
		$("#tag_inv_guestpass_color").val(settings.tag_inv_guestpass_color);

		$("#highlight_owned").prop('checked', settings.highlight_owned);
		$("#highlight_wishlist").prop('checked', settings.highlight_wishlist);
		$("#highlight_coupon").prop('checked', settings.highlight_coupon);
		$("#highlight_inv_gift").prop('checked', settings.highlight_inv_gift);
		$("#highlight_inv_guestpass").prop('checked', settings.highlight_inv_guestpass);
		$("#highlight_excludef2p").prop('checked', settings.highlight_excludef2p);

		$("#tag_owned").prop('checked', settings.tag_owned);
		$("#tag_wishlist").prop('checked', settings.tag_wishlist);
		$("#tag_coupon").prop('checked', settings.tag_coupon);
		$("#tag_inv_gift").prop('checked', settings.tag_inv_gift);
		$("#tag_inv_guestpass").prop('checked', settings.tag_inv_guestpass);
		
		$("#hide_owned").prop('checked', settings.hide_owned);
		$("#hidetmsymbols").prop('checked', settings.hidetmsymbols);

		$("#hideinstallsteambutton").prop('checked', settings.hideinstallsteambutton);
		$("#hideaboutmenu").prop('checked', settings.hideaboutmenu);
		$("#replaceaccountname").prop('checked', settings.replaceaccountname);
		$("#showfakeccwarning").prop('checked', settings.showfakeccwarning);
		$("#showlanguagewarning").prop('checked', settings.showlanguagewarning);
		$("#warning_language").val(settings.showlanguagewarninglanguage);
		$("#homepage_tab_selection").val(settings.homepage_tab_selection);
		$("#send_age_info").prop('checked', settings.send_age_info);
		$("#html5video").prop('checked', settings.html5video);
		$("#contscroll").prop('checked', settings.contscroll);
		$("#showdrm").prop('checked', settings.showdrm);
		$("#showacrtag").prop('checked', settings.show_acrtag_info);
		$("#showmcus").prop('checked', settings.showmcus);
		$("#showhltb").prop('checked', settings.showhltb);
		$("#showpcgw").prop('checked', settings.showpcgw);
		$("#showsteamcardexchange").prop('checked', settings.showsteamcardexchange);
		$("#showsteamdb").prop('checked', settings.showsteamdb);
		$("#showastatslink").prop('checked', settings.showastatslink);
		$("#showwsgf").prop('checked', settings.showwsgf);
		$("#show_package_info").prop('checked', settings.show_package_info);
		$("#show_sysreqcheck").prop('checked', settings.show_sysreqcheck);
		$("#show_steamchart_info").prop('checked', settings.show_steamchart_info);
		$("#show_steamspy_info").prop('checked', settings.show_steamspy_info);
		$("#show_carousel_descriptions").prop('checked', settings.show_carousel_descriptions);
		$("#show_early_access").prop('checked', settings.show_early_access);
		$("#show_alternative_linux_icon").prop('checked', settings.show_alternative_linux_icon);
				
		// Load Price Options
		$("#showlowestprice").prop('checked', settings.showlowestprice);
		$("#showlowestprice_onwishlist").prop('checked', settings.showlowestprice_onwishlist);
		$("#showlowestpricecoupon").prop('checked', settings.showlowestpricecoupon);
		$("#stores_all").prop('checked', settings.showallstores);
		toggle_stores();
		$("#regional_price_on").val(settings.showregionalprice);
		$("#regional_hideworld").prop('checked', settings.regional_hideworld);
		if (settings.showregionalprice == "off") { $("#region_selects").hide(); }
		if (settings.showregionalprice != "mouse") { $("#regional_price_hideworld").hide(); }
		populate_regional_selects();

		// Load Community Options
		$("#showtotal").prop('checked', settings.showtotal);
		$("#showmarkettotal").prop('checked', settings.showmarkettotal);
		$("#showsteamrepapi").prop('checked', settings.showsteamrepapi);
		$("#showinvnav").prop('checked', settings.showinvnav);
		$("#showesbg").prop('checked', settings.showesbg);
		$("#quickinv").prop('checked', settings.quickinv);
		$("#quickinv_diff").val(settings.quickinv_diff);
		$("#showallachievements").prop('checked', settings.showallachievements);
		$("#showcomparelinks").prop('checked', settings.showcomparelinks);
		$("#showgreenlightbanner").prop('checked', settings.showgreenlightbanner);
		$("#dynamicgreenlight").prop('checked', settings.dynamicgreenlight);
		$("#disablegreenlightautoplay").prop('checked', settings.disablegreenlightautoplay);
		$("#hideactivelistings").prop('checked', settings.hideactivelistings);
		$("#hidespamcomments").prop('checked', settings.hidespamcomments);
		$("#spamcommentregex").val(settings.spamcommentregex);
		$("#wlbuttoncommunityapp").prop('checked', settings.wlbuttoncommunityapp);
		$("#show1clickgoo").prop('checked', settings.show1clickgoo);
		$("#profile_link_images_dropdown").val(settings.show_profile_link_images);

		// Load Profile Link Options
		$("#profile_steamgifts").prop('checked', settings.profile_steamgifts);
		$("#profile_steamrep").prop('checked', settings.profile_steamrep);
		$("#profile_steamdbcalc").prop('checked', settings.profile_steamdbcalc);
		$("#profile_wastedonsteam").prop('checked', settings.profile_wastedonsteam);
		$("#profile_astats").prop('checked', settings.profile_astats);
		$("#profile_backpacktf").prop('checked', settings.profile_backpacktf);
		$("#profile_astatsnl").prop('checked', settings.profile_astatsnl);
		$("#profile_api_info").prop('checked', settings.profile_api_info);
		if(!settings.profile_api_info){$("#api_key_block").hide()}
		$("#api_key").val(settings.api_key)
		$("#profile_permalink").prop('checked', settings.profile_permalink);
		$("#steamcardexchange").prop('checked', settings.steamcardexchange);
		
		if(!changelog_loaded) {		
			jQuery.get('changelog.txt', function(data) {
				$("#changelog_text").after("<textarea rows=28 cols=100 readonly>" + data + "</textarea>");
			});
			changelog_loaded=true;
		}

		load_translation();
		load_profile_link_images();
	});
}

function load_translation() {
	chrome.storage.sync.get(function(settings) {		
		// Load translation
		if (settings.language === undefined) { settings.language = "english"; }

		var localized_strings = [];
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
				case "ukrainian": l_code = "uk"; break;
				default: l_code = "en"; break;
			}
			$.getJSON(chrome.extension.getURL('/localization/' + l_code + '/strings.json'), function (data) {
				localized_strings = data;
				l_deferred.resolve();
			});
			return l_deferred.promise();
		})();

		localization_promise.done(function(){
			document.title = "Enhanced Steam " + localized_strings.thewordoptions;
			
			$("#nav_store").text(localized_strings.store);
			$("#nav_price").text(localized_strings.price);
			$("#nav_community").text(localized_strings.community);
			$("#nav_news").text(localized_strings.news);
			$("#nav_about").text(localized_strings.about);
			$("#nav_credits").text(localized_strings.credits);
			$("#nav_donate").text(localized_strings.donate);
			
			$("#language_text").text(localized_strings.language);
			
			$("#highlight_text").text(localized_strings.highlight);
			$("#highlight_owned_text").text(localized_strings.options.owned);
			$("#highlight_wishlist_text").text(localized_strings.options.wishlist);
			$("#highlight_coupon_text").text(localized_strings.options.coupon);
			$("#highlight_gift_text").text(localized_strings.options.gift);
			$("#highlight_guest_text").text(localized_strings.options.guest);
			$("#highlight_excludef2p_text").text(localized_strings.options.excludef2p);

			$("#tag_text").text(localized_strings.options.tag);
			$("#tag_owned_text").text(localized_strings.options.owned);
			$("#tag_wishlist_text").text(localized_strings.options.wishlist);
			$("#tag_coupon_text").text(localized_strings.options.coupon);
			$("#tag_gift_text").text(localized_strings.options.gift);
			$("#tag_guest_text").text(localized_strings.options.guest);
			
			$("#hide_text").text(localized_strings.hide);
			$("#hide_owned_text").text(localized_strings.options.hide_owned);
			$("#hidetmsymbols_text").text(localized_strings.options.hidetmsymbols);

			$("#store_hide_install_text").text(localized_strings.options.hide_install);
			$("#store_hide_about_menu").text(localized_strings.options.hide_about);
			$("#store_replace_account_name").text(localized_strings.options.replace_account_name);
			$("#store_general").text(localized_strings.options.general);
			$("#header_showfakeccwarning_text").text(localized_strings.options.show_regionwarning);
			$("#store_show_languagewarning_text").text(localized_strings.options.show_languagewarning);
			$("#send_age_info_text").text(localized_strings.options.send_age_info);
			$("#html5video_text").text(localized_strings.options.html5video);
			$("#contscroll_text").text(localized_strings.options.contscroll);
			$("#store_drm_text").text(localized_strings.options.drm);
			$("#store_acrtag_text").text(localized_strings.options.acrtag);
			$("#store_lowestprice_text").text(localized_strings.options.lowestprice);
			$("#store_lowestprice_onwishlist_text").text(localized_strings.options.lowestprice_onwishlist);
			$("#store_lowestprice_coupon_text").text(localized_strings.options.lowestprice_coupon);
			$("#store_lowestprice_header").text(localized_strings.options.lowestprice_header);
			$("#store_metacritic_text").text(localized_strings.options.metacritic);
			$("#store_hltb_text").text(localized_strings.options.hltb);
			$("#store_pcgw_text").text(localized_strings.options.pcgw);
			$("#store_steamcards_text").text(localized_strings.options.store_steamcards);
			$("#store_steamdb_text").text(localized_strings.options.steamdb);
			$("#store_astatslink_text").text(localized_strings.options.show_astatslink);
			$("#store_wsgf_text").text(localized_strings.options.wsgf);
			$("#store_package_info_text").text(localized_strings.options.show_package_info);
			$("#show_sysreqcheck_text").text(localized_strings.options.show_sysreqcheck);
			$("#store_steamchart_info_text").text(localized_strings.options.show_steamchart_info);
			$("#store_steamspy_info_text").text(localized_strings.options.show_steamspy_info);
			$("#store_carousel_descriptions_text").text(localized_strings.options.carousel_description);
			$("#show_early_access_text").text(localized_strings.options.show_early_access_text);
			$("#show_alternative_linux_icon_text").text(localized_strings.options.show_alternative_linux_icon);
			
			$("#lowestprice_stores_text").text(localized_strings.stores);
			$("#lowestprice_stores_all_text").text(localized_strings.options.stores_all);
			$("#store_regionalprice_header").text(localized_strings.options.regional_price);
			$("#showregionalprice_text").text(localized_strings.options.regional_price_on);
			$('select option:contains("Always")').text(localized_strings.always);
			$('select option:contains("Never")').text(localized_strings.never);
			$('select option:contains("on Price Mouseover")').text(localized_strings.options.regional_price_mouse);
			
			$("#community_general").text(localized_strings.options.general);
			$("#community_market").text(localized_strings.options.market);
			$("#community_inventory").text(localized_strings.options.inventory);
			$("#community_profile").text(localized_strings.options.profile);
			$("#profile_link_text").text(localized_strings.options.profile_links + ":");
			$("#show_profile_link_images_text").text(localized_strings.options.profile_link_images + ":");
			$("#profile_link_images_gray").text(localized_strings.options.profile_link_images_gray);
			$("#profile_link_images_color").text(localized_strings.options.profile_link_images_color);
			$("#profile_link_images_none").text(localized_strings.options.profile_link_images_none);
			$("#profile_permalink_text").text(localized_strings.options.profile_permalink);
			$("#total_spent_text").text(localized_strings.options.total_spent);
			$("#steamrep_api_text").text(localized_strings.options.steamrepapi);
			$("#market_total_text").text(localized_strings.options.market_total);
			$("#inventory_nav_text").text(localized_strings.options.inventory_nav_text);
			$("#es_background_text").text(localized_strings.options.es_bg);
			$("#quickinv_text").text(localized_strings.options.quickinv);
			$("#quickinv_diff_text").text(localized_strings.options.quickinv_diff);
			$("#allachievements_text").text(localized_strings.options.showallachievements);
			$("#showcomparelinks_text").text(localized_strings.options.showcomparelinks);
			$("#greenlight_banner_text").text(localized_strings.options.greenlight_banner);
			$("#dynamicgreenlight_text").text(localized_strings.options.dynamicgreenlight);
			$("#disablegreenlightautoplay_text").text(localized_strings.options.disablegreenlightautoplay);
			$("#spamcommentregex_text").text(localized_strings.options.spamcommentregex);
			$("#show_spamcommentregex").text(localized_strings.options.customizespamcommentregex);
			$("#steamcardexchange_text").text(localized_strings.options.steamcardexchange);
			$("#wlbuttoncommunityapp_text").text(localized_strings.options.wlbuttoncommunityapp);
			$("#show1clickgoo_text").text(localized_strings.options.show1clickgoo);

			$("#highlight_owned_default").text(localized_strings.theworddefault);
			$("#highlight_wishlist_default").text(localized_strings.theworddefault);
			$("#highlight_coupon_default").text(localized_strings.theworddefault);
			$("#highlight_inv_gift_default").text(localized_strings.theworddefault);
			$("#highlight_inv_guestpass_default").text(localized_strings.theworddefault);
			$("#highlight_friends_want_color_default").text(localized_strings.theworddefault);
			$("#tag_owned_color_default").text(localized_strings.theworddefault);
			$("#tag_wishlist_default").text(localized_strings.theworddefault);
			$("#tag_coupon_default").text(localized_strings.theworddefault);
			$("#tag_inv_gift_default").text(localized_strings.theworddefault);
			$("#tag_inv_guestpass_default").text(localized_strings.theworddefault);
			$("#tag_friends_want_color_default").text(localized_strings.theworddefault);
			$("#tag_friends_own_color_default").text(localized_strings.theworddefault);
			$("#tag_friends_rec_color_default").text(localized_strings.theworddefault);
			$("#reset_countries").text(localized_strings.theworddefault);

			$("#regional_hideworld_text").text(localized_strings.options.regional_hideworld);
			
			$("#es_about_text").html(localized_strings.options.about_text);
			$("#changelog_text").text(localized_strings.options.changelog);
			
			$("#programming_text").text(localized_strings.programming);
			$("#view_all").html("<a href='https://github.com/jshackles/Enhanced_Steam/graphs/contributors'>" + localized_strings.view_all + "</a>");
			$("#translation_text").text(localized_strings.translation);
			$("#graphics_text").text(localized_strings.graphics);

			$("#reset").text(localized_strings.options.reset);
			$("#saved").text(localized_strings.options.saved_note);
			$("#reset_note").text(localized_strings.options.reset_note);

			$("#foot_link").text(localized_strings.options.foot_link);
			$("#author_info").text(localized_strings.options.author_info);
		});	
	});
}

function load_profile_link_images() {
	chrome.storage.sync.get(function(settings) {
		settings.show_profile_link_images = $("#profile_link_images_dropdown").val();
		$("#profile_link_images_dropdown").val(settings.show_profile_link_images);
		switch(settings.show_profile_link_images) {
			case "gray":
				$(".site_icon").show();
				$(".site_icon_col").hide();
				break;
			case "color":
				$(".site_icon").show();
				$(".site_icon_gray").hide();
				break;
			case "false":
				$(".site_icon").hide();
				break;
			default:
				break;
		}
	});
}

function populate_regional_selects() {
	var add_another_wrapper = $('#add_another_region').parent(),
		region_selection = generate_region_select();

	chrome.storage.sync.get(function (settings) {
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

	region_selection.append($('<span/>').addClass('es_flag').css("background-image", "url("+chrome.extension.getURL("img/flags/flags.png")+")"));
	region_selection.append($('<select/>').addClass('regional_country').append(options));
	region_selection.append($('<a/>').addClass('select2-search-choice-close remove_region'));

	return region_selection;
}

function remove_region() {
	$(this).closest('li').remove();
	save_options();
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
	chrome.storage.sync.get(function(settings) {
		var confirm_reset = confirm(localized_strings.options.clear)
		if(confirm_reset){
			chrome.storage.sync.clear();
			load_options();
			$("#reset_note").stop(true,true).fadeIn().delay(600).fadeOut();
		}
	});
}

function change_flag(node, selectnode) {
	node.removeClass();
	node.addClass("es_flag_" + selectnode.val() +" es_flag");
}

function load_default_highlight_owned_color() { $("#highlight_owned_color").val("#5c7836"); }
function load_default_highlight_wishlist_color() { $("#highlight_wishlist_color").val("#d3deea"); }
function load_default_highlight_coupon_color() { $("#highlight_coupon_color").val("#6b2269"); }
function load_default_highlight_inv_gift_color() { $("#highlight_inv_gift_color").val("#a75124"); }
function load_default_highlight_inv_guestpass_color() { $("#highlight_inv_guestpass_color").val("#a75124"); }

function load_default_tag_owned_color() { $("#tag_owned_color").val("#5c7836"); }
function load_default_tag_wishlist_color() { $("#tag_wishlist_color").val("#d3deea"); }
function load_default_tag_coupon_color() { $("#tag_coupon_color").val("#6b2269"); }
function load_default_tag_inv_gift_color() { $("#tag_inv_gift_color").val("#a75124"); }
function load_default_tag_inv_guestpass_color() { $("#tag_inv_guestpass_color").val("#a75124"); }

function load_default_countries() {
	regional_countries = ["us","gb","eu1","eu2","ru","br","au","jp"];
	chrome.storage.sync.set({'regional_countries': regional_countries}, function() {
		$('#region_selects').find('li').remove();
		populate_regional_selects();
		$("#saved").stop(true,true).fadeIn().delay(600).fadeOut();
	});	
}

function toggle_regex() {$("#spamcommentregex_list").toggle()}
function load_default_spamcommentregex(){$("#spamcommentregex").val("[\\u2500-\\u25FF]")}

$(document).ready(function(){
	load_options();
	$("#language").change(load_translation);
	load_profile_link_images();
	$("#profile_link_images_dropdown").change(load_profile_link_images);
	$("#highlight_owned_default").click(load_default_highlight_owned_color);
	$("#highlight_wishlist_default").click(load_default_highlight_wishlist_color);
	$("#highlight_coupon_default").click(load_default_highlight_coupon_color);
	$("#highlight_inv_gift_default").click(load_default_highlight_inv_gift_color);
	$("#highlight_inv_guestpass_default").click(load_default_highlight_inv_guestpass_color);

	$("#tag_owned_color_default").click(load_default_tag_owned_color);
	$("#tag_wishlist_default").click(load_default_tag_wishlist_color);
	$("#tag_coupon_default").click(load_default_tag_coupon_color);
	$("#tag_inv_gift_default").click(load_default_tag_inv_gift_color);
	$("#tag_inv_guestpass_default").click(load_default_tag_inv_guestpass_color);

	$("#spamcommentregex_default").click(load_default_spamcommentregex);
	$("#quickinv_default").click(function() { $("#quickinv_diff").val("-0.01"); });
	$("#quickinv_diff").focusout(function() { if (isNaN(parseFloat($("#quickinv_diff").val()))) { $("#quickinv_diff").val("-0.01"); } });

	$('#nav_store').click(load_store_tab);
	$('#nav_price').click(load_price_tab);
	$('#nav_community').click(load_community_tab);
	$('#nav_news').click(load_news_tab);
	$('#nav_about').click(load_about_tab);
	$('#nav_credits').click(load_credits_tab);

	$("#show_spamcommentregex").click(toggle_regex);
	$("#show_quickinv_diff").click(function() { $("#quickinv_opt").toggle() });
	$('#stores_all').click(toggle_stores);
	$("#reset_countries").click(load_default_countries);
	$('#region_selects').on('change', '.regional_country', function() {
		var $this = $(this);
		change_flag($this.siblings('.es_flag'), $this);
		save_options();
	}).on('click', '.remove_region', remove_region);

	$('#add_another_region').click(add_region_selector);

	$("#regional_price_on").change(function() {
		if ($(this).val() == "off") { $("#region_selects").hide(); } else { $("#region_selects").show(); }
		if ($(this).val() == "mouse") {
			$("#regional_price_hideworld").show();
		} else {
			$("#regional_price_hideworld").hide();
		}
	});

	$("#profile_api_info").change(function(){
		if($(this).prop("checked")) {$("#api_key_block").show()}
		else{$("#api_key_block").hide()}
	})

	$("input[type=checkbox]").click(save_options);
	$("input[type=text]").blur(save_options);
	$("button:not(#reset):not(#reset_countries):not(#add_another_region)").click(save_options);
	$("#reset").click(clear_settings);
	$(".colorbutton").change(save_options);
	$("select").change(save_options);

	steam_credits();
});
