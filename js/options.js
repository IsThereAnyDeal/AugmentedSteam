
// Saves options to localStorage.
function save_options() {
	language = $("#language").val();

	// Store Options
	highlight_owned_color = $("#highlight_owned_color").val();
	highlight_wishlist_color = $("#highlight_wishlist_color").val();
	highlight_coupon_color = $("#highlight_coupon_color").val();
	highlight_inv_gift_color = $("#highlight_inv_gift_color").val();
	highlight_inv_guestpass_color = $("#highlight_inv_guestpass_color").val();
	highlight_friends_want_color = $("#highlight_friends_want_color").val();

	tag_owned_color = $("#tag_owned_color").val();
	tag_owned_color = $("#tag_owned_color").val();
	tag_wishlist_color = $("#tag_wishlist_color").val();
	tag_coupon_color = $("#tag_coupon_color").val();
	tag_inv_gift_color = $("#tag_inv_gift_color").val();
	tag_inv_guestpass_color = $("#tag_inv_guestpass_color").val();
	tag_friends_want_color = $("#tag_friends_want_color").val();
	tag_friends_own_color = $("#tag_friends_own_color").val();
	tag_friends_rec_color = $("#tag_friends_rec_color").val();

	highlight_owned = $("#highlight_owned").prop('checked');
	highlight_wishlist = $("#highlight_wishlist").prop('checked');
	highlight_coupon = $("#highlight_coupon").prop('checked');
	highlight_inv_gift = $("#highlight_inv_gift").prop('checked');
	highlight_inv_guestpass = $("#highlight_inv_guestpass").prop('checked');
	highlight_friends_want = $("#highlight_friends_want").prop('checked');
	highlight_excludef2p = $("#highlight_excludef2p").prop('checked');

	tag_owned = $("#tag_owned").prop('checked');
	tag_wishlist = $("#tag_wishlist").prop('checked');
	tag_coupon = $("#tag_coupon").prop('checked');
	tag_inv_gift = $("#tag_inv_gift").prop('checked');
	tag_inv_guestpass = $("#tag_inv_guestpass").prop('checked');
	tag_friends_want = $("#tag_friends_want").prop('checked');
	tag_friends_own = $("#tag_friends_own").prop('checked');
	tag_friends_rec = $("#tag_friends_rec").prop('checked');
	
	hide_owned = $("#hide_owned").prop('checked');
	hide_early_access = $("#hide_early_access").prop('checked');

	showlibrarymenu = $("#showlibrarymenu").prop('checked');
	showlibraryf2p = $("#showlibraryf2p").prop('checked');

	hideinstallsteambutton = $("#hideinstallsteambutton").prop('checked');
	hideaboutmenu = $("#hideaboutmenu").prop('checked');
	hidecommunitynew = $("#hidecommunitynew").prop('checked');
	replaceaccountname = $("#replaceaccountname").prop('checked');
	showfakeccwarning = $("#showfakeccwarning").prop('checked');
	send_age_info = $("#send_age_info").prop('checked');
	contscroll = $("#contscroll").prop('checked');
	showdrm = $("#showdrm").prop('checked');
	showlowestprice = $("#showlowestprice").prop('checked');
	showmcus = $("#showmcus").prop('checked');
	showhltb = $("#showhltb").prop('checked');
	showpcgw = $("#showpcgw").prop('checked');
	showsteamdb = $("#showsteamdb").prop('checked');
	showwsgf = $("#showwsgf").prop('checked');
	show_package_info = $("#show_package_info").prop('checked');
	show_carousel_descriptions = $("#show_carousel_descriptions").prop('checked');
	
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
			$("#beamdog").prop('checked'),
			$("#adventureshop").prop('checked'),
			$("#nuuvem").prop('checked'),
			$("#shinyloot").prop('checked'),
			$("#dlgamer").prop('checked'),			
			$("#humblestore").prop('checked')
	];

	// Community Options
	showtotal = $("#showtotal").prop('checked');
	showmarkettotal = $("#showmarkettotal").prop('checked');
	showinvmarket = $("#showinvmarket").prop('checked');
	showesbg = $("#showesbg").prop('checked');
	showallachievements = $("#showallachievements").prop('checked');
	showgreenlightbanner = $("#showgreenlightbanner").prop('checked');
	hideactivelistings = $("#hideactivelistings").prop('checked');

	// Profile Link Options
	profile_steamgifts = $("#profile_steamgifts").prop('checked');
	profile_steamtrades = $("#profile_steamtrades").prop('checked');
	profile_steamrep = $("#profile_steamrep").prop('checked');
	profile_wastedonsteam = $("#profile_wastedonsteam").prop('checked');
	profile_sapi = $("#profile_sapi").prop('checked');
	profile_backpacktf = $("#profile_backpacktf").prop('checked');
	profile_astats = $("#profile_astats").prop('checked');
	
	steamcardexchange = $("#steamcardexchange").prop('checked');

	chrome.storage.sync.set({
		'language': language,

		'highlight_owned_color': highlight_owned_color,
		'highlight_wishlist_color': highlight_wishlist_color,
		'highlight_coupon_color': highlight_coupon_color,
		'highlight_inv_gift_color': highlight_inv_gift_color,
		'highlight_inv_guestpass_color': highlight_inv_guestpass_color,
		'highlight_friends_want_color': highlight_friends_want_color,
		'highlight_excludef2p': highlight_excludef2p,

		'tag_owned_color': tag_owned_color,
		'tag_wishlist_color': tag_wishlist_color,
		'tag_coupon_color': tag_coupon_color,
		'tag_inv_gift_color': tag_inv_gift_color,
		'tag_inv_guestpass_color': tag_inv_guestpass_color,
		'tag_friends_want_color': tag_friends_want_color,
		'tag_friends_own_color': tag_friends_own_color,
		'tag_friends_rec_color': tag_friends_rec_color,

		'highlight_owned': highlight_owned,
		'highlight_wishlist': highlight_wishlist,
		'highlight_coupon': highlight_coupon,
		'highlight_inv_gift': highlight_inv_gift,
		'highlight_inv_guestpass': highlight_inv_guestpass,		
		'highlight_friends_want': highlight_friends_want,

		'tag_owned': tag_owned,
		'tag_wishlist': tag_wishlist,
		'tag_coupon': tag_coupon,
		'tag_inv_gift': tag_inv_gift,
		'tag_inv_guestpass': tag_inv_guestpass,
		'tag_friends_want': tag_friends_want,
		'tag_friends_own': tag_friends_own,
		'tag_friends_rec': tag_friends_rec,
		
		'hide_owned': hide_owned,
		'hide_early_access': hide_early_access,

		'hideinstallsteambutton': hideinstallsteambutton,
		'hideaboutmenu': hideaboutmenu,
		'hidecommunitynew': hidecommunitynew,
		'replaceaccountname': replaceaccountname,
		'showfakeccwarning': showfakeccwarning,
		'showlibrarymenu': showlibrarymenu,
		'showlibraryf2p': showlibraryf2p,
		'send_age_info': send_age_info,
		'contscroll': contscroll,
		'showdrm': showdrm,
		'showlowestprice': showlowestprice,
		'showmcus': showmcus,
		'showhltb': showhltb,
		'showpcgw': showpcgw,
		'showsteamdb': showsteamdb,
		'showwsgf': showwsgf,
		'show_package_info': show_package_info,
		'show_carousel_descriptions': show_carousel_descriptions,
		
		'showallstores': showallstores,
		'stores': stores,

		'showtotal': showtotal,
		'showmarkettotal': showmarkettotal,
		'showinvmarket': showinvmarket,
		'showesbg': showesbg,
		'showallachievements': showallachievements,
		'showgreenlightbanner': showgreenlightbanner,
		'hideactivelistings': hideactivelistings,

		'profile_steamgifts': profile_steamgifts,
		'profile_steamtrades': profile_steamtrades,
		'profile_steamrep': profile_steamrep,
		'profile_wastedonsteam': profile_wastedonsteam,
		'profile_sapi': profile_sapi,
		'profile_backpacktf': profile_backpacktf,
		'profile_astats': profile_astats,
		
		'steamcardexchange': steamcardexchange
	});
}

// toggles pages
function load_store_tab() {
	document.getElementById("maincontent_store").style.display = "block";
	document.getElementById("maincontent_community").style.display = "none";
	document.getElementById("maincontent_news").style.display = "none";
	document.getElementById("maincontent_about").style.display = "none";
	document.getElementById("maincontent_credits").style.display = "none";
}

function load_community_tab() {
	document.getElementById("maincontent_store").style.display = "none";
	document.getElementById("maincontent_community").style.display = "block";
	document.getElementById("maincontent_news").style.display = "none";
	document.getElementById("maincontent_about").style.display = "none";
	document.getElementById("maincontent_credits").style.display = "none";
}

function load_news_tab() {
	document.getElementById("maincontent_store").style.display = "none";
	document.getElementById("maincontent_community").style.display = "none";
	document.getElementById("maincontent_news").style.display = "block";
	document.getElementById("maincontent_about").style.display = "none";
	document.getElementById("maincontent_credits").style.display = "none";
}

function load_about_tab() {
	document.getElementById("maincontent_store").style.display = "none";
	document.getElementById("maincontent_community").style.display = "none";
	document.getElementById("maincontent_news").style.display = "none";
	document.getElementById("maincontent_about").style.display = "block";
	document.getElementById("maincontent_credits").style.display = "none";
}

function load_credits_tab() {
	document.getElementById("maincontent_store").style.display = "none";
	document.getElementById("maincontent_community").style.display = "none";
	document.getElementById("maincontent_news").style.display = "none";
	document.getElementById("maincontent_about").style.display = "none";
	document.getElementById("maincontent_credits").style.display = "block";
}

function toggle_stores() {
	var all_stores = $("#stores_all").prop('checked');
	switch (all_stores) {
		case true: 
			document.getElementById("store_stores").style.display = "none";
			break;
		case false:
			document.getElementById("store_stores").style.display = "block";
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
				$("#beamdog").prop('checked', settings.stores[15]);
				$("#adventureshop").prop('checked', settings.stores[16]);
				$("#nuuvem").prop('checked', settings.stores[17]);
				$("#shinyloot").prop('checked', settings.stores[18]);
				$("#dlgamer").prop('checked', settings.stores[19]);
				$("#humblestore").prop('checked', settings.stores[20]);
			});
			break;
	}
}

// Loads changelog.txt
jQuery.get('changelog.txt', function(data) {
	document.getElementById("maincontent_news").innerHTML = "Changelog:<br><textarea rows=28 cols=100 readonly>" + data + "</textarea>";
});

// Restores select box state to saved value from SyncStorage.
function load_options() {
	chrome.storage.sync.get(function(settings) {
		// Load default values for settings if they do not exist (and sync them to Google)
		if (settings.language === undefined) { settings.language = "en"; chrome.storage.sync.set({'language': settings.language}); }
		if (settings.highlight_owned_color === undefined) { settings.highlight_owned_color = "#5c7836";	chrome.storage.sync.set({'highlight_owned_color': settings.highlight_owned_color});	}
		if (settings.highlight_wishlist_color === undefined) { settings.highlight_wishlist_color = "#496e93";	chrome.storage.sync.set({'highlight_wishlist_color': settings.highlight_wishlist_color}); }
		if (settings.highlight_coupon_color === undefined) { settings.highlight_coupon_color = "#6b2269";	chrome.storage.sync.set({'highlight_coupon_color': settings.highlight_coupon_color}); }
		if (settings.highlight_inv_gift_color === undefined) { settings.highlight_inv_gift_color = "#a75124";	chrome.storage.sync.set({'highlight_inv_gift_color': settings.highlight_inv_gift_color}); }
		if (settings.highlight_inv_guestpass_color === undefined) { settings.highlight_inv_guestpass_color = "#a75124";	chrome.storage.sync.set({'highlight_inv_guestpass_color': settings.highlight_inv_guestpass_color}); }
		if (settings.highlight_friends_want_color === undefined) { settings.highlight_friends_want_color = "#7E4060"; chrome.storage.sync.set({'highlight_friends_want_color': settings.highlight_friends_want_color}); }

		if (settings.tag_owned_color === undefined) { settings.tag_owned_color = "#5c7836";	chrome.storage.sync.set({'tag_owned_color': settings.tag_owned_color});	}
		if (settings.tag_wishlist_color === undefined) { settings.tag_wishlist_color = "#496e93";	chrome.storage.sync.set({'tag_wishlist_color': settings.tag_wishlist_color}); }
		if (settings.tag_coupon_color === undefined) { settings.tag_coupon_color = "#6b2269";	chrome.storage.sync.set({'tag_coupon_color': settings.tag_coupon_color}); }
		if (settings.tag_inv_gift_color === undefined) { settings.tag_inv_gift_color = "#a75124";	chrome.storage.sync.set({'tag_inv_gift_color': settings.tag_inv_gift_color}); }
		if (settings.tag_inv_guestpass_color === undefined) { settings.tag_inv_guestpass_color = "#a75124";	chrome.storage.sync.set({'tag_inv_guestpass_color': settings.tag_inv_guestpass_color}); }
		if (settings.tag_friends_want_color === undefined) { settings.tag_friends_want_color = "#7E4060"; chrome.storage.sync.set({'tag_friends_want_color': settings.tag_friends_want_color}); }
		if (settings.tag_friends_own_color === undefined) { settings.tag_friends_own_color = "#5b9504"; chrome.storage.sync.set({'tag_friends_own_color': settings.tag_friends_own_color}); }
		if (settings.tag_friends_rec_color === undefined) { settings.tag_friends_rec_color = "#2e3d54"; chrome.storage.sync.set({'tag_friends_rec_color': settings.tag_friends_rec_color}); }

		if (settings.highlight_owned === undefined) { settings.highlight_owned = true; chrome.storage.sync.set({'highlight_owned': settings.highlight_owned}); }
		if (settings.highlight_wishlist === undefined) { settings.highlight_wishlist = true; chrome.storage.sync.set({'highlight_wishlist': settings.highlight_wishlist}); }
		if (settings.highlight_coupon === undefined) { settings.highlight_coupon = false; chrome.storage.sync.set({'highlight_coupon': settings.highlight_coupon}); }
		if (settings.highlight_inv_gift === undefined) { settings.highlight_inv_gift = false; chrome.storage.sync.set({'highlight_inv_gift': settings.highlight_inv_gift}); }
		if (settings.highlight_inv_guestpass === undefined) { settings.highlight_inv_guestpass = false; chrome.storage.sync.set({'highlight_inv_guestpass': settings.highlight_inv_guestpass}); }
		if (settings.highlight_friends_want === undefined) { settings.highlight_friends_want = false; chrome.storage.sync.set({'highlight_friends_want': settings.highlight_friends_want}); }
		if (settings.highlight_excludef2p === undefined) { settings.highlight_excludef2p = false; chrome.storage.sync.set({'highlight_excludef2p': settings.highlight_excludef2p}); }

		if (settings.tag_owned === undefined) { settings.tag_owned = false; chrome.storage.sync.set({'tag_owned': settings.tag_owned}); }
		if (settings.tag_wishlist === undefined) { settings.tag_wishlist = false; chrome.storage.sync.set({'tag_wishlist': settings.tag_wishlist}); }
		if (settings.tag_coupon === undefined) { settings.tag_coupon = true; chrome.storage.sync.set({'tag_coupon': settings.tag_coupon}); }
		if (settings.tag_inv_gift === undefined) { settings.tag_inv_gift = true; chrome.storage.sync.set({'tag_inv_gift': settings.tag_inv_gift}); }
		if (settings.tag_inv_guestpass === undefined) { settings.tag_inv_guestpass = true; chrome.storage.sync.set({'tag_inv_guestpass': settings.tag_inv_guestpass}); }
		if (settings.tag_friends_want === undefined) { settings.tag_friends_want = true; chrome.storage.sync.set({'tag_friends_want': settings.tag_friends_want}); }
		if (settings.tag_friends_own === undefined) { settings.tag_friends_own = true; chrome.storage.sync.set({'tag_friends_own': settings.tag_friends_own}); }
		if (settings.tag_friends_rec === undefined) { settings.tag_friends_rec = false; chrome.storage.sync.set({'tag_friends_rec': settings.tag_friends_rec}); }
		
		if (settings.hide_owned === undefined) { settings.hide_owned = false; chrome.storage.sync.set({'hide_owned': settings.hide_owned}); }
		if (settings.hide_early_access === undefined) { settings.hide_early_access = false; chrome.storage.sync.set({'hide_early_access': settings.hide_early_access}); }

		if (settings.showallstores === undefined) { settings.showallstores = true; chrome.storage.sync.set({'showallstores': settings.showallstores}); }
		if (settings.stores === undefined) { settings.stores = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]; chrome.storage.sync.set({'stores': settings.stores}); }
		
		if (settings.showtotal === undefined) { settings.showtotal = true; chrome.storage.sync.set({'showtotal': settings.showtotal}); }
		if (settings.showmarkettotal === undefined) { settings.showmarkettotal = true; chrome.storage.sync.set({'showmarkettotal': settings.showmarkettotal}); }
		if (settings.showmcus === undefined) { settings.showmcus = true; chrome.storage.sync.set({'showmcus': settings.showmcus}); }
		if (settings.showhltb === undefined) { settings.showhltb = true; chrome.storage.sync.set({'showhltb': settings.showhltb}); }
		if (settings.showpcgw === undefined) { settings.showpcgw = true; chrome.storage.sync.set({'showpcgw': settings.showpcgw}); }
		if (settings.showsteamdb === undefined) { settings.showsteamdb = true; chrome.storage.sync.set({'showsteamdb': settings.showsteamdb}); }
		if (settings.showwsgf === undefined) { settings.showwsgf = true; chrome.storage.sync.set({'showwsgf': settings.showwsgf}); }
		if (settings.show_package_info === undefined) { settings.show_package_info = false; chrome.storage.sync.set({'show_package_info': settings.show_package_info}); }
		if (settings.show_carousel_descriptions === undefined) { settings.show_carousel_descriptions = true; chrome.storage.sync.set({'show_carousel_descriptions': settings.show_carousel_descriptions}); }

		if (settings.showlibrarymenu === undefined) { settings.showlibrarymenu = true; chrome.storage.sync.set({'showlibrarymenu': settings.showlibrarymenu}); }
		if (settings.showlibraryf2p === undefined) { settings.showlibraryf2p = true; chrome.storage.sync.set({'showlibraryf2p': settings.showlibraryf2p}); }
		
		if (settings.hideinstallsteambutton === undefined) { settings.hideinstallsteambutton = false; chrome.storage.sync.set({'hideinstallsteambutton': settings.hideinstallsteambutton}); }
		if (settings.hideaboutmenu === undefined) { settings.hideaboutmenu = false; chrome.storage.sync.set({'hideaboutmenu': settings.hideaboutmenu}); }
		if (settings.hidecommunitynew === undefined) { settings.hidecommunitynew = true; chrome.storage.sync.set({'hidecommunitynew': settings.hidecommunitynew}); }
		if (settings.replaceaccountname === undefined) { settings.replaceaccountname = false; chrome.storage.sync.set({'replaceaccountname': settings.replaceaccountname}); }
		if (settings.showfakeccwarning === undefined) { settings.showfakeccwarning = true; chrome.storage.sync.set({'showfakeccwarning': settings.showfakeccwarning}); }
		if (settings.send_age_info === undefined) { settings.send_age_info = true; chrome.storage.sync.set({'send_age_info': settings.send_age_info}); }		
		if (settings.contscroll === undefined) { settings.contscroll = true; chrome.storage.sync.set({'contscroll': settings.contscroll}); }		
		if (settings.showdrm === undefined) { settings.showdrm = true; chrome.storage.sync.set({'showdrm': settings.showdrm}); }
		if (settings.showlowestprice === undefined) { settings.showlowestprice = true;	chrome.storage.sync.set({'showlowestprice': settings.showlowestprice}); }
		if (settings.showinvmarket === undefined) { settings.showinvmarket = false; chrome.storage.sync.set({'showinvmarket': settings.showinvmarket}); }
		if (settings.showesbg === undefined) { settings.showesbg = true; chrome.storage.sync.set({'showesbg': settings.showesbg}); }
		if (settings.showallachievements === undefined) { settings.showallachievements = false; chrome.storage.sync.set({'showallachievements': settings.showallachievements}); }
		if (settings.showgreenlightbanner === undefined) { settings.showgreenlightbanner = false; chrome.storage.sync.set({'showgreenlightbanner': settings.showgreenlightbanner}); }
		if (settings.hideactivelistings === undefined) { settings.hideactivelistings = false; chrome.storage.sync.set({'hideactivelistings': settings.hideactivelistings}); }
		if (settings.profile_steamgifts === undefined) { settings.profile_steamgifts = true; chrome.storage.sync.set({'profile_steamgifts': settings.profile_steamgifts}); }
		if (settings.profile_steamtrades === undefined) { settings.profile_steamtrades = true; chrome.storage.sync.set({'profile_steamtrades': settings.profile_steamtrades}); }
		if (settings.profile_steamrep === undefined) { settings.profile_steamrep = true; chrome.storage.sync.set({'profile_steamrep': settings.profile_steamrep}); }
		if (settings.profile_wastedonsteam === undefined) { settings.profile_wastedonsteam = true; chrome.storage.sync.set({'profile_wastedonsteam': settings.profile_wastedonsteam}); }
		if (settings.profile_sapi === undefined) { settings.profile_sapi = true; chrome.storage.sync.set({'profile_sapi': settings.profile_sapi}); }
		if (settings.profile_backpacktf === undefined) { settings.profile_backpacktf = true; chrome.storage.sync.set({'profile_backpacktf': settings.profile_backpacktf}); }
		if (settings.profile_astats === undefined) { settings.profile_astats = true; chrome.storage.sync.set({'profile_astats': settings.profile_astats}); }
		if (settings.steamcardexchange == undefined) { settings.steamcardexchange = true; chrome.storage.sync.set({'steamcardexchange': settings.steamcardexchange}); }
		
		// Load Store Options
		$("#highlight_owned_color").attr('value', settings.highlight_owned_color);
		$("#highlight_wishlist_color").attr('value', settings.highlight_wishlist_color);
		$("#highlight_coupon_color").attr('value', settings.highlight_coupon_color);
		$("#highlight_inv_gift_color").attr('value', settings.highlight_inv_gift_color);
		$("#highlight_inv_guestpass_color").attr('value', settings.highlight_inv_guestpass_color);
		$("#highlight_friends_want_color").attr('value', settings.highlight_friends_want_color);

		$("#tag_owned_color").attr('value', settings.tag_owned_color);
		$("#tag_owned_color").attr('value', settings.tag_owned_color);
		$("#tag_wishlist_color").attr('value', settings.tag_wishlist_color);
		$("#tag_coupon_color").attr('value', settings.tag_coupon_color);
		$("#tag_inv_gift_color").attr('value', settings.tag_inv_gift_color);
		$("#tag_inv_guestpass_color").attr('value', settings.tag_inv_guestpass_color);
		$("#tag_friends_want_color").attr('value', settings.tag_friends_want_color);
		$("#tag_friends_own_color").attr('value', settings.tag_friends_own_color);
		$("#tag_friends_rec_color").attr('value', settings.tag_friends_rec_color);

		$("#highlight_owned").attr('checked', settings.highlight_owned);
		$("#highlight_wishlist").attr('checked', settings.highlight_wishlist);
		$("#highlight_coupon").attr('checked', settings.highlight_coupon);
		$("#highlight_inv_gift").attr('checked', settings.highlight_inv_gift);
		$("#highlight_inv_guestpass").attr('checked', settings.highlight_inv_guestpass);
		$("#highlight_friends_want").attr('checked', settings.highlight_friends_want);
		$("#highlight_excludef2p").attr('checked', settings.highlight_excludef2p);

		$("#tag_owned").attr('checked', settings.tag_owned);
		$("#tag_wishlist").attr('checked', settings.tag_wishlist);
		$("#tag_coupon").attr('checked', settings.tag_coupon);
		$("#tag_inv_gift").attr('checked', settings.tag_inv_gift);
		$("#tag_inv_guestpass").attr('checked', settings.tag_inv_guestpass);
		$("#tag_friends_want").attr('checked', settings.tag_friends_want);
		$("#tag_friends_own").attr('checked', settings.tag_friends_own);
		$("#tag_friends_rec").attr('checked', settings.tag_friends_rec);
		
		$("#hide_owned").attr('checked', settings.hide_owned);
		$("#hide_early_access").attr('checked', settings.hide_early_access);

		$("#showlibrarymenu").attr('checked', settings.showlibrarymenu);
		$("#showlibraryf2p").attr('checked', settings.showlibraryf2p);

		$("#hideinstallsteambutton").attr('checked', settings.hideinstallsteambutton);
		$("#hideaboutmenu").attr('checked', settings.hideaboutmenu);
		$("#hidecommunitynew").attr('checked', settings.hidecommunitynew);replaceaccountname
		$("#replaceaccountname").attr('checked', settings.replaceaccountname);
		$("#showfakeccwarning").attr('checked', settings.showfakeccwarning);
		$("#send_age_info").attr('checked', settings.send_age_info);
		$("#contscroll").attr('checked', settings.contscroll);
		$("#showdrm").attr('checked', settings.showdrm);
		$("#showmcus").attr('checked', settings.showmcus);
		$("#showhltb").attr('checked', settings.showhltb);
		$("#showpcgw").attr('checked', settings.showpcgw);
		$("#showsteamdb").attr('checked', settings.showsteamdb);
		$("#showwsgf").attr('checked', settings.showwsgf);
		$("#show_package_info").attr('checked', settings.show_package_info);
		$("#show_carousel_descriptions").attr('checked', settings.show_carousel_descriptions);
		$("#showlowestprice").attr('checked', settings.showlowestprice);		
		
		$("#stores_all").attr('checked', settings.showallstores);
		toggle_stores();
		

		// Load Community Options
		$("#showtotal").attr('checked', settings.showtotal);
		$("#showmarkettotal").attr('checked', settings.showmarkettotal);
		$("#showinvmarket").attr('checked', settings.showinvmarket);
		$("#showesbg").attr('checked', settings.showesbg);
		$("#showallachievements").attr('checked', settings.showallachievements);
		$("#showgreenlightbanner").attr('checked', settings.showgreenlightbanner);
		$("#hideactivelistings").attr('checked', settings.hideactivelistings);

		// Load Profile Link Options
		$("#profile_steamgifts").attr('checked', settings.profile_steamgifts);
		$("#profile_steamtrades").attr('checked', settings.profile_steamtrades);
		$("#profile_steamrep").attr('checked', settings.profile_steamrep);
		$("#profile_wastedonsteam").attr('checked', settings.profile_wastedonsteam);
		$("#profile_sapi").attr('checked', settings.profile_sapi);
		$("#profile_backpacktf").attr('checked', settings.profile_backpacktf);
		$("#profile_astats").attr('checked', settings.profile_astats);
		$("#steamcardexchange").attr('checked', settings.steamcardexchange);
		
		$("#language").attr('value', settings.language);
		
		load_translation()
	});
}

function load_translation() {
	chrome.storage.sync.get(function(settings) {
				
		if (settings.language === undefined) { settings.language = "eng"; chrome.storage.sync.set({'language': settings.language}); }
		settings.language = $("#language").val();			
		$("#language").attr('value', settings.language);
		
		// Load translation
		localization_promise.done(function(){
			document.title = "Enhanced Steam " + localized_strings[settings.language].options;
			
			$("#header_store").text(localized_strings[settings.language].store);
			$("#header_community").text(localized_strings[settings.language].community);
			$("#header_news").text(localized_strings[settings.language].news);
			$("#header_about").text(localized_strings[settings.language].about);
			$("#header_credits").text(localized_strings[settings.language].credits);
			$("#header_donate").text(localized_strings[settings.language].donate);
			
			$("#language_text").text(localized_strings[settings.language].language);
			
			$("#highlight_text").text(localized_strings[settings.language].highlight);
			$("#highlight_owned_text").text(localized_strings[settings.language].options_owned);
			$("#highlight_wishlist_text").text(localized_strings[settings.language].options_wishlist);
			$("#highlight_coupon_text").text(localized_strings[settings.language].options_coupon);
			$("#highlight_gift_text").text(localized_strings[settings.language].options_gift);
			$("#highlight_guest_text").text(localized_strings[settings.language].options_guest);
			$("#highlight_friends_wishlist_text").text(localized_strings[settings.language].options_friends_wishlist);
			$("#highlight_excludef2p_text").text(localized_strings[settings.language].options_excludef2p);
						
			$("#tag_text").text(localized_strings[settings.language].tag);
			$("#tag_owned_text").text(localized_strings[settings.language].options_owned);
			$("#tag_wishlist_text").text(localized_strings[settings.language].options_wishlist);
			$("#tag_coupon_text").text(localized_strings[settings.language].options_coupon);
			$("#tag_gift_text").text(localized_strings[settings.language].options_gift);
			$("#tag_guest_text").text(localized_strings[settings.language].options_guest);
			$("#tag_friends_wishlist_text").text(localized_strings[settings.language].options_friends_wishlist);
			$("#tag_friends_own_text").text(localized_strings[settings.language].options_friends_own);
			$("#tag_friends_rec_text").text(localized_strings[settings.language].options_friends_rec);
			
			$("#hide_text").text(localized_strings[settings.language].hide);
			$("#hide_owned_text").text(localized_strings[settings.language].options_owned);
			$("#hide_early_access_text").text(localized_strings[settings.language].options_hide_early_access);
			
			$("#store_show_library_text").text(localized_strings[settings.language].options_library);
			$("#store_show_library_f2p_text").text(localized_strings[settings.language].options_library_f2p);

			$("#store_hide_install_text").text(localized_strings[settings.language].options_hide_install);
			$("#store_hide_about_menu").text(localized_strings[settings.language].options_hide_about);
			$("#store_hide_new_heading").text(localized_strings[settings.language].options_hide_new_heading);
			$("#store_replace_account_name").text(localized_strings[settings.language].options_replace_account_name);
			$("#header_showfakeccwarning_text").text(localized_strings[settings.language].options_show_regionwarning);
			$("#send_age_info_text").text(localized_strings[settings.language].options_send_age_info);
			$("#contscroll_text").text(localized_strings[settings.language].options_contscroll);
			$("#store_drm_text").text(localized_strings[settings.language].options_drm);
			$("#store_lowestprice_text").text(localized_strings[settings.language].options_lowestprice);
			$("#store_metacritic_text").text(localized_strings[settings.language].options_metacritic);
			$("#store_hltb_text").text(localized_strings[settings.language].options_hltb);
			$("#store_pcgw_text").text(localized_strings[settings.language].options_pcgw);
			$("#store_steamdb_text").text(localized_strings[settings.language].options_steamdb);
			$("#store_wsgf_text").text(localized_strings[settings.language].options_wsgf);
			$("#store_show_package_info_text").text(localized_strings[settings.language].options_show_package_info);
			$("#store_carousel_descriptions_text").text(localized_strings[settings.language].options_carousel_description);
			$("#lowestprice_stores_text").text(localized_strings[settings.language].stores);
			$("#lowestprice_stores_all_text").text(localized_strings[settings.language].all);
			
			$("#profile_link_text").text(localized_strings[settings.language].options_profile_links + ":");
			$("#total_spent_text").text(localized_strings[settings.language].options_total_spent);
			$("#market_total_text").text(localized_strings[settings.language].options_market_total);
			$("#inventory_market_text").text(localized_strings[settings.language].inventory_market_text);
			$("#es_background_text").text(localized_strings[settings.language].options_es_bg);
			$("#allachievements_text").text(localized_strings[settings.language].options_showallachievements);
			$("#greenlight_banner_text").text(localized_strings[settings.language].options_greenlight_banner);
			$("#hideactivelistings_text").text(localized_strings[settings.language].options_hideactivelistings);
			$("#steamcardexchange_text").text(localized_strings[settings.language].options_steamcardexchange);
						
			$("#highlight_owned_default").text(localized_strings[settings.language].theworddefault);
			$("#highlight_wishlist_default").text(localized_strings[settings.language].theworddefault);
			$("#highlight_coupon_default").text(localized_strings[settings.language].theworddefault);
			$("#highlight_inv_gift_default").text(localized_strings[settings.language].theworddefault);
			$("#highlight_inv_guestpass_default").text(localized_strings[settings.language].theworddefault);
			$("#highlight_friends_want_color_default").text(localized_strings[settings.language].theworddefault);
			$("#tag_owned_color_default").text(localized_strings[settings.language].theworddefault);
			$("#tag_wishlist_default").text(localized_strings[settings.language].theworddefault);
			$("#tag_coupon_default").text(localized_strings[settings.language].theworddefault);
			$("#tag_inv_gift_default").text(localized_strings[settings.language].theworddefault);
			$("#tag_inv_guestpass_default").text(localized_strings[settings.language].theworddefault);
			$("#tag_friends_want_color_default").text(localized_strings[settings.language].theworddefault);
			$("#tag_friends_own_color_default").text(localized_strings[settings.language].theworddefault);
			$("#tag_friends_rec_color_default").text(localized_strings[settings.language].theworddefault);
			
			$("#es_about_text").html(localized_strings[settings.language].options_about_text);
			
			$("#programming_text").text(localized_strings[settings.language].programming);
			$("#translation_text").text(localized_strings[settings.language].translation);
			
			$("#save_store").text(localized_strings[settings.language].save);
			$("#save_community").text(localized_strings[settings.language].save);
		});	
	});
}

function clear_settings() {
	console.log ("clearing settings");
	chrome.storage.sync.clear();
	location.reload(true);
}

function load_default_highlight_owned_color() { document.getElementById("highlight_owned_color").value = "#5c7836"; }
function load_default_highlight_wishlist_color() { document.getElementById("highlight_wishlist_color").value = "#496e93"; }
function load_default_highlight_coupon_color() { document.getElementById("highlight_coupon_color").value = "#6b2269"; }
function load_default_highlight_inv_gift_color() { document.getElementById("highlight_inv_gift_color").value = "#a75124"; }
function load_default_highlight_inv_guestpass_color() { document.getElementById("highlight_inv_guestpass_color").value = "#a75124"; }
function load_default_highlight_friends_want_color() { document.getElementById("highlight_friends_want_color").value = "#7E4060"; }

function load_default_tag_owned_color() { document.getElementById("tag_owned_color").value = "#5c7836"; }
function load_default_tag_wishlist_color() { document.getElementById("tag_wishlist_color").value = "#496e93"; }
function load_default_tag_coupon_color() { document.getElementById("tag_coupon_color").value = "#6b2269"; }
function load_default_tag_inv_gift_color() { document.getElementById("tag_inv_gift_color").value = "#a75124"; }
function load_default_tag_inv_guestpass_color() { document.getElementById("tag_inv_guestpass_color").value = "#a75124"; }
function load_default_tag_friends_want_color() { document.getElementById("tag_friends_want_color").value = "#7E4060"; }
function load_default_tag_friends_own_color() { document.getElementById("tag_friends_own_color").value = "#5b9504"; }
function load_default_tag_friends_rec_color() { document.getElementById("tag_friends_rec_color").value = "#2e3d54"; }

document.addEventListener('DOMContentLoaded', load_options);
document.addEventListener('DOMContentLoaded', function () {
// Wait until page has loaded to add events to DOM nodes
document.querySelector('#language').addEventListener('change', load_translation);

document.querySelector('#highlight_owned_default').addEventListener('click', load_default_highlight_owned_color);
document.querySelector('#highlight_wishlist_default').addEventListener('click', load_default_highlight_wishlist_color);
document.querySelector('#highlight_coupon_default').addEventListener('click', load_default_highlight_coupon_color);
document.querySelector('#highlight_inv_gift_default').addEventListener('click', load_default_highlight_inv_gift_color);
document.querySelector('#highlight_inv_guestpass_default').addEventListener('click', load_default_highlight_inv_guestpass_color);
document.querySelector('#highlight_friends_want_color_default').addEventListener('click', load_default_highlight_friends_want_color);

document.querySelector('#tag_owned_color_default').addEventListener('click', load_default_tag_owned_color);
document.querySelector('#tag_wishlist_default').addEventListener('click', load_default_tag_wishlist_color);
document.querySelector('#tag_coupon_default').addEventListener('click', load_default_tag_coupon_color);
document.querySelector('#tag_inv_gift_default').addEventListener('click', load_default_tag_inv_gift_color);
document.querySelector('#tag_inv_guestpass_default').addEventListener('click', load_default_tag_inv_guestpass_color);
document.querySelector('#tag_friends_want_color_default').addEventListener('click', load_default_tag_friends_want_color);
document.querySelector('#tag_friends_own_color_default').addEventListener('click', load_default_tag_friends_own_color);
document.querySelector('#tag_friends_rec_color_default').addEventListener('click', load_default_tag_friends_rec_color);

document.querySelector('#nav_store').addEventListener('click', load_store_tab);
document.querySelector('#nav_community').addEventListener('click', load_community_tab);
document.querySelector('#nav_news').addEventListener('click', load_news_tab);
document.querySelector('#nav_about').addEventListener('click', load_about_tab);
document.querySelector('#nav_credits').addEventListener('click', load_credits_tab);

document.querySelector('#stores_all').addEventListener('click', toggle_stores);

$("input").on("click", save_options);
$("button").on("click", save_options);
$(".colorbutton").change(save_options);
});