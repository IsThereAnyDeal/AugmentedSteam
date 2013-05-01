
// Saves options to localStorage.
function save_options() {

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

	highlight_owned = $("#highlight_owned").prop('checked');
	highlight_wishlist = $("#highlight_wishlist").prop('checked');
	highlight_coupon = $("#highlight_coupon").prop('checked');
	highlight_inv_gift = $("#highlight_inv_gift").prop('checked');
	highlight_inv_guestpass = $("#highlight_inv_guestpass").prop('checked');
	highlight_friends_want = $("#highlight_friends_want").prop('checked');

	tag_owned = $("#tag_owned").prop('checked');
	tag_wishlist = $("#tag_wishlist").prop('checked');
	tag_coupon = $("#tag_coupon").prop('checked');
	tag_inv_gift = $("#tag_inv_gift").prop('checked');
	tag_inv_guestpass = $("#tag_inv_guestpass").prop('checked');
	tag_friends_want = $("#tag_friends_want").prop('checked');

	hideinstallsteambutton = $("#hideinstallsteambutton").prop('checked');
	showdrm = $("#showdrm").prop('checked');
	showlowestprice = $("#showlowestprice").prop('checked');
	showmcus = $("#showmcus").prop('checked');
	showwsgf = $("#showwsgf").prop('checked');

	// Tagging Options


	// Community Options
	showtotal = $("#showtotal").prop('checked');
	showgroupevents = $("#showgroupevents").prop('checked');
	showgreenlightbanner = $("#showgreenlightbanner").prop('checked');

	// Profile Link Options
	profile_steamgifts = $("#profile_steamgifts").prop('checked');
	profile_steamtrades = $("#profile_steamtrades").prop('checked');
	profile_steamrep = $("#profile_steamrep").prop('checked');
	profile_wastedonsteam = $("#profile_wastedonsteam").prop('checked');
	profile_sapi = $("#profile_sapi").prop('checked');
	profile_backpacktf = $("#profile_backpacktf").prop('checked');
	profile_astats = $("#profile_astats").prop('checked');

	chrome.storage.sync.set({
		'highlight_owned_color': highlight_owned_color,
		'highlight_wishlist_color': highlight_wishlist_color,
		'highlight_coupon_color': highlight_coupon_color,
		'highlight_inv_gift_color': highlight_inv_gift_color,
		'highlight_inv_guestpass_color': highlight_inv_guestpass_color,
		'highlight_friends_want_color': highlight_friends_want_color,

		'tag_owned_color': tag_owned_color,
		'tag_wishlist_color': tag_wishlist_color,
		'tag_coupon_color': tag_coupon_color,
		'tag_inv_gift_color': tag_inv_gift_color,
		'tag_inv_guestpass_color': tag_inv_guestpass_color,
		'tag_friends_want_color': tag_friends_want_color,

		'highlight_owned': highlight_owned,
		'highlight_wishlist': highlight_wishlist,
		'highlight_coupon': highlight_coupon,
		'highlight_inv_gift': highlight_inv_gift,
		'highlight_inv_guestpass': highlight_inv_guestpass,
		'hideinstallsteambutton': hideinstallsteambutton,
		'highlight_friends_want': highlight_friends_want,

		'tag_owned': tag_owned,
		'tag_wishlist': tag_wishlist,
		'tag_coupon': tag_coupon,
		'tag_inv_gift': tag_inv_gift,
		'tag_inv_guestpass': tag_inv_guestpass,
		'hideinstallsteambutton': hideinstallsteambutton,
		'tag_friends_want': tag_friends_want,

		'showdrm': showdrm,
		'showlowestprice': showlowestprice,
		'showmcus': showmcus,
		'showwsgf': showwsgf,
		'showtotal': showtotal,
		'showgroupevents': showgroupevents,
		'showgreenlightbanner': showgreenlightbanner,

		'profile_steamgifts': profile_steamgifts,
		'profile_steamtrades': profile_steamtrades,
		'profile_steamrep': profile_steamrep,
		'profile_wastedonsteam': profile_wastedonsteam,
		'profile_sapi': profile_sapi,
		'profile_backpacktf': profile_backpacktf,
		'profile_astats': profile_astats
	}, function() {
		// Notify that we saved.
		var status = document.getElementById("save_space");
		status.innerHTML = "<button class='btn' id='save'>Saved.</button>";
		setTimeout(function() {location.reload();}, 750);
	});
}

// toggles pages
function load_store_tab() {
	var store = document.getElementById("maincontent_store");
	var community = document.getElementById("maincontent_community");
	var news = document.getElementById("maincontent_news");
	var about = document.getElementById("maincontent_about");
	var donate = document.getElementById("maincontent_donate");

	console.log("switching tabs to store");

	store.style.display = "block";
	community.style.display = "none";
	news.style.display = "none";
	about.style.display = "none";
	donate.style.display = "none";
}

function load_community_tab() {
	var store = document.getElementById("maincontent_store");
	var community = document.getElementById("maincontent_community");
	var news = document.getElementById("maincontent_news");
	var about = document.getElementById("maincontent_about");
	var donate = document.getElementById("maincontent_donate");

	console.log("switching tabs to community");

	store.style.display = "none";
	community.style.display = "block";
	news.style.display = "none";
	about.style.display = "none";
	donate.style.display = "none";
}

function load_news_tab() {
	var store = document.getElementById("maincontent_store");
	var community = document.getElementById("maincontent_community");
	var news = document.getElementById("maincontent_news");
	var about = document.getElementById("maincontent_about");
	var donate = document.getElementById("maincontent_donate");

	console.log("switching tabs to news");

	store.style.display = "none";
	community.style.display = "none";
	news.style.display = "block";
	about.style.display = "none";
	donate.style.display = "none";
}

function load_about_tab() {
	var store = document.getElementById("maincontent_store");
	var community = document.getElementById("maincontent_community");
	var news = document.getElementById("maincontent_news");
	var about = document.getElementById("maincontent_about");
	var donate = document.getElementById("maincontent_donate");

	console.log("switching tabs to about");

	store.style.display = "none";
	community.style.display = "none";
	news.style.display = "none";
	about.style.display = "block";
	donate.style.display = "none";
}

function load_donate_tab() {
	var store = document.getElementById("maincontent_store");
	var community = document.getElementById("maincontent_community");
	var news = document.getElementById("maincontent_news");
	var about = document.getElementById("maincontent_about");
	var donate = document.getElementById("maincontent_donate");

	console.log("switching tabs to donate");

	store.style.display = "none";
	community.style.display = "none";
	news.style.display = "none";
	about.style.display = "none";
	donate.style.display = "block";
}

// Loads changelog.txt
jQuery.get('changelog.txt', function(data) {
	var changelog = document.getElementById("maincontent_news");
	changelog.innerHTML = "Changelog:<br><textarea rows=28 cols=84>" + data + "</textarea>";
    //alert(data);
});

// Restores select box state to saved value from SyncStorage.
function restore_options() {
	chrome.storage.sync.get(function(settings) {

		// Load default values for settings if they do not exist (and sync them to Google)
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

		if (settings.highlight_owned === undefined) { settings.highlight_owned = true; chrome.storage.sync.set({'highlight_owned': settings.highlight_owned}); }
		if (settings.highlight_wishlist === undefined) { settings.highlight_wishlist = true; chrome.storage.sync.set({'highlight_wishlist': settings.highlight_wishlist}); }
		if (settings.highlight_coupon === undefined) { settings.highlight_coupon = true; chrome.storage.sync.set({'highlight_coupon': settings.highlight_coupon}); }
		if (settings.highlight_inv_gift === undefined) { settings.highlight_inv_gift = true; chrome.storage.sync.set({'highlight_inv_gift': settings.highlight_inv_gift}); }
		if (settings.highlight_inv_guestpass === undefined) { settings.highlight_inv_guestpass = true; chrome.storage.sync.set({'highlight_inv_guestpass': settings.highlight_inv_guestpass}); }
		if (settings.highlight_friends_want === undefined) { settings.highlight_friends_want = false; chrome.storage.sync.set({'highlight_friends_want': settings.highlight_friends_want}); }

		if (settings.tag_owned === undefined) { settings.tag_owned = false; chrome.storage.sync.set({'tag_owned': settings.tag_owned}); }
		if (settings.tag_wishlist === undefined) { settings.tag_wishlist = true; chrome.storage.sync.set({'tag_wishlist': settings.tag_wishlist}); }
		if (settings.tag_coupon === undefined) { settings.tag_coupon = true; chrome.storage.sync.set({'tag_coupon': settings.tag_coupon}); }
		if (settings.tag_inv_gift === undefined) { settings.tag_inv_gift = true; chrome.storage.sync.set({'tag_inv_gift': settings.tag_inv_gift}); }
		if (settings.tag_inv_guestpass === undefined) { settings.tag_inv_guestpass = true; chrome.storage.sync.set({'tag_inv_guestpass': settings.tag_inv_guestpass}); }
		if (settings.tag_friends_want === undefined) { settings.tag_friends_want = true; chrome.storage.sync.set({'tag_friends_want': settings.tag_friends_want}); }

		if (settings.showtotal === undefined) { settings.showtotal = true; chrome.storage.sync.set({'showtotal': settings.showtotal}); }
		if (settings.showmcus === undefined) { settings.showmcus = true; chrome.storage.sync.set({'showmcus': settings.showmcus}); }
		if (settings.showwsgf === undefined) { settings.showwsgf = true; chrome.storage.sync.set({'showwsgf': settings.showwsgf}); }
		if (settings.hideinstallsteambutton === undefined) { settings.hideinstallsteambutton = false; chrome.storage.sync.set({'hideinstallsteambutton': settings.hideinstallsteambutton}); }
		if (settings.showdrm === undefined) { settings.showdrm = true; chrome.storage.sync.set({'showdrm': settings.showdrm}); }
		if (settings.showlowestprice === undefined) { settings.showlowestprice = true;	chrome.storage.sync.set({'showlowestprice': settings.showlowestprice}); }
		if (settings.showgroupevents === undefined) { settings.showgroupevents = true;	chrome.storage.sync.set({'showgroupevents': settings.showgroupevents});	}
		if (settings.showgreenlightbanner === undefined) { settings.showgreenlightbanner = false; chrome.storage.sync.set({'showgreenlightbanner': settings.showgreenlightbanner}); }
		if (settings.profile_steamgifts === undefined) { settings.profile_steamgifts = true; chrome.storage.sync.set({'profile_steamgifts': settings.profile_steamgifts}); }
		if (settings.profile_steamtrades === undefined) { settings.profile_steamtrades = true; chrome.storage.sync.set({'profile_steamtrades': settings.profile_steamtrades}); }
		if (settings.profile_steamrep === undefined) { settings.profile_steamrep = true; chrome.storage.sync.set({'profile_steamrep': settings.profile_steamrep}); }
		if (settings.profile_wastedonsteam === undefined) { settings.profile_wastedonsteam = true; chrome.storage.sync.set({'profile_wastedonsteam': settings.profile_wastedonsteam}); }
		if (settings.profile_sapi === undefined) { settings.profile_sapi = true; chrome.storage.sync.set({'profile_sapi': settings.profile_sapi}); }
		if (settings.profile_backpacktf === undefined) { settings.profile_backpacktf = true; chrome.storage.sync.set({'profile_backpacktf': settings.profile_backpacktf}); }
		if (settings.profile_astats === undefined) { settings.profile_astats = true; chrome.storage.sync.set({'profile_astats': settings.profile_astats}); }

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

		$("#highlight_owned").attr('checked', settings.highlight_owned);
		$("#highlight_wishlist").attr('checked', settings.highlight_wishlist);
		$("#highlight_coupon").attr('checked', settings.highlight_coupon);
		$("#highlight_inv_gift").attr('checked', settings.highlight_inv_gift);
		$("#highlight_inv_guestpass").attr('checked', settings.highlight_inv_guestpass);
		$("#highlight_friends_want").attr('checked', settings.highlight_friends_want);

		$("#tag_owned").attr('checked', settings.tag_owned);
		$("#tag_wishlist").attr('checked', settings.tag_wishlist);
		$("#tag_coupon").attr('checked', settings.tag_coupon);
		$("#tag_inv_gift").attr('checked', settings.tag_inv_gift);
		$("#tag_inv_guestpass").attr('checked', settings.tag_inv_guestpass);
		$("#tag_friends_want").attr('checked', settings.tag_friends_want);

		$("#hideinstallsteambutton").attr('checked', settings.hideinstallsteambutton);
		$("#showdrm").attr('checked', settings.showdrm);
		$("#showmcus").attr('checked', settings.showmcus);
		$("#showwsgf").attr('checked', settings.showwsgf);
		$("#showlowestprice").attr('checked', settings.showlowestprice);



		// Load Community Options
		$("#showtotal").attr('checked', settings.showtotal);
		$("#showgroupevents").attr('checked', settings.showgroupevents);
		$("#showgreenlightbanner").attr('checked', settings.showgreenlightbanner);

		// Load Profile Link Options
		$("#profile_steamgifts").attr('checked', settings.profile_steamgifts);
		$("#profile_steamtrades").attr('checked', settings.profile_steamtrades);
		$("#profile_steamrep").attr('checked', settings.profile_steamrep);
		$("#profile_wastedonsteam").attr('checked', settings.profile_wastedonsteam);
		$("#profile_sapi").attr('checked', settings.profile_sapi);
		$("#profile_backpacktf").attr('checked', settings.profile_backpacktf);
		$("#profile_astats").attr('checked', settings.profile_astats);
	});
}

// Deal with this shite before you commit
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

document.addEventListener('DOMContentLoaded', restore_options);
document.addEventListener('DOMContentLoaded', function () {
// Wait until page has loaded to add events to DOM nodes
document.querySelector('#save').addEventListener('click', save_options);

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

document.querySelector('#nav_store').addEventListener('click', load_store_tab);
document.querySelector('#nav_community').addEventListener('click', load_community_tab);
document.querySelector('#nav_news').addEventListener('click', load_news_tab);
document.querySelector('#nav_about').addEventListener('click', load_about_tab);
document.querySelector('#nav_donate').addEventListener('click', load_donate_tab);
});