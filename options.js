
// Saves options to localStorage.
function save_options() {

	// Store Options
	highlight_bg = $("#highlight_bg").prop('checked');
	highlight_tag = $("#highlight_tag").prop('checked');
	bgcolor = $("#bgcolor").val();
	wlcolor = $("#wlcolor").val();
	ccolor = $("#ccolor").val();

	showowned = $("#showowned").prop('checked');
	showwishlist = $("#showwishlist").prop('checked');
	showcoupon = $("#showcoupon").prop('checked');
	hideinstallsteambutton = $("#hideinstallsteambutton").prop('checked');
	showdrm = $("#showdrm").prop('checked');
	showlowestprice = $("#showlowestprice").prop('checked');
	showmcus = $("#showmcus").prop('checked');
	showwsgf = $("#showwsgf").prop('checked');

	show_friends_want = $("#show_friends_want").prop('checked');
	show_friends_want_color = $("#show_friends_want_color").val();

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
		'highlight_bg': highlight_bg,
		'highlight_tag': highlight_tag,
		'bgcolor': bgcolor,
		'wlcolor': wlcolor,
		'ccolor': ccolor,

		'showowned': showowned,
		'showwishlist': showwishlist,
		'showcoupon': showcoupon,
		'hideinstallsteambutton': hideinstallsteambutton,
		'showdrm': showdrm,
		'showlowestprice': showlowestprice,
		'showmcus': showmcus,
		'showwsgf': showwsgf,

		'show_friends_want': show_friends_want,
		'show_friends_want_color': show_friends_want_color,

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
		if (settings.highlight_bg === undefined) { settings.highlight_bg = true;	chrome.storage.sync.set({'highlight_bg': settings.highlight_bg});}
		if (settings.highlight_tag === undefined) { settings.highlight_tag = true;	chrome.storage.sync.set({'highlight_tag': settings.highlight_tag});}
		if (settings.bgcolor === undefined) { settings.bgcolor = "#5c7836";	chrome.storage.sync.set({'bgcolor': settings.bgcolor});	}
		if (settings.wlcolor === undefined) { settings.wlcolor = "#496e93";	chrome.storage.sync.set({'wlcolor': settings.wlcolor}); }
		if (settings.ccolor === undefined) { settings.ccolor = "#6b2269";	chrome.storage.sync.set({'ccolor': settings.ccolor}); }
		if (settings.showowned === undefined) { settings.showowned = true; chrome.storage.sync.set({'showowned': settings.showowned}); }
		if (settings.showwishlist === undefined) { settings.showwishlist = true; chrome.storage.sync.set({'showwishlist': settings.showwishlist}); }
		if (settings.showcoupon === undefined) { settings.showcoupon = true; chrome.storage.sync.set({'showcoupon': settings.showcoupon}); }
		if (settings.showtotal === undefined) { settings.showtotal = true; chrome.storage.sync.set({'showtotal': settings.showtotal}); }
		if (settings.showmcus === undefined) { settings.showmcus = true; chrome.storage.sync.set({'showmcus': settings.showmcus}); }
		if (settings.showwsgf === undefined) { settings.showwsgf = true; chrome.storage.sync.set({'showwsgf': settings.showwsgf}); }
		if (settings.show_friends_want === undefined) { settings.show_friends_want = true; chrome.storage.sync.set({'show_friends_want': settings.show_friends_want}); }
		if (settings.show_friends_want_color === undefined) { settings.show_friends_want_color = "#7E4060"; chrome.storage.sync.set({'show_friends_want_color': settings.show_friends_want_color}); }
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
		$("#highlight_bg").attr('checked', settings.highlight_bg);
		$("#highlight_tag").attr('checked', settings.highlight_tag);
		$("#bgcolor").attr('value', settings.bgcolor);
		$("#wlcolor").attr('value', settings.wlcolor);
		$("#ccolor").attr('value', settings.ccolor);

		$("#showowned").attr('checked', settings.showowned);
		$("#showwishlist").attr('checked', settings.showwishlist);
		$("#showcoupon").attr('checked', settings.showcoupon);
		$("#hideinstallsteambutton").attr('checked', settings.hideinstallsteambutton);
		$("#showdrm").attr('checked', settings.showdrm);
		$("#showmcus").attr('checked', settings.showmcus);
		$("#showwsgf").attr('checked', settings.showwsgf);
		$("#show_friends_want").attr('checked', settings.show_friends_want);
		$("#show_friends_want_color").attr('value', settings.show_friends_want_color);
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

// Loads the default owned game color
function load_defaultbgcolor() {
	var bgtext = document.getElementById("bgcolor");
	bgtext.value = "#5c7836";
}

// Loads the default wishlist color
function load_defaultwlcolor() {
	var wltext = document.getElementById("wlcolor");
	wltext.value = "#496e93";
}

// Loads the default coupon color
function load_defaultccolor() {
	var ctext = document.getElementById("ccolor");
	ctext.value = "#6b2269";
}

function load_default_show_friends_want_color() {
	var ctext = document.getElementById("show_friends_want_color");
	ctext.value = "#7E4060";
}

document.addEventListener('DOMContentLoaded', restore_options);
document.addEventListener('DOMContentLoaded', function () {
// Wait until page has loaded to add events to DOM nodes
document.querySelector('#save').addEventListener('click', save_options);
document.querySelector('#bgdefault').addEventListener('click', load_defaultbgcolor);
document.querySelector('#wldefault').addEventListener('click', load_defaultwlcolor);
document.querySelector('#cdefault').addEventListener('click', load_defaultccolor);
document.querySelector('#show_friends_want_color_default').addEventListener('click', load_default_show_friends_want_color);
document.querySelector('#nav_store').addEventListener('click', load_store_tab);
document.querySelector('#nav_community').addEventListener('click', load_community_tab);
document.querySelector('#nav_news').addEventListener('click', load_news_tab);
document.querySelector('#nav_about').addEventListener('click', load_about_tab);
document.querySelector('#nav_donate').addEventListener('click', load_donate_tab);
});