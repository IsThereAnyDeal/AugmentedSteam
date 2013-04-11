
// Saves options to localStorage.
function save_options() {
	
	// Store Options
	bgcolor = $("#bgcolor").val();
	wlcolor = $("#wlcolor").val();
	ccolor = $("#ccolor").val();
	showdrm = $("#showdrm").val();
	showlowestprice = $("#showlowestprice").val();	
	showmcus = $("#showmcus").val();
	showwsgf = $("#showwsgf").val();
	
	// Community Options
	showtotal = $("#showtotal").val();
	showgroupevents = $("#showgroupevents").val();
	showgreenlightbanner = $("#showgreenlightbanner").val();
	
	// Profile Link Options
	profile_steamgifts = $("#profile_steamgifts").prop('checked');
	profile_steamtrades = $("#profile_steamtrades").prop('checked');
	profile_steamrep = $("#profile_steamrep").prop('checked');	
	profile_wastedonsteam = $("#profile_wastedonsteam").prop('checked');
	profile_sapi = $("#profile_sapi").prop('checked');
	profile_backpacktf = $("#profile_backpacktf").prop('checked');	
		
	chrome.storage.sync.set({
		'showtotal': showtotal,
		'showmcus': showmcus,
		'showwsgf': showwsgf,
		'showdrm': showdrm,
		'showlowestprice': showlowestprice,
		'showgroupevents': showgroupevents,
		'showgreenlightbanner': showgreenlightbanner,
		'bgcolor': bgcolor,
		'wlcolor': wlcolor,
		'ccolor': ccolor,
		'profile_steamgifts': profile_steamgifts,
		'profile_steamtrades': profile_steamtrades,
		'profile_steamrep': profile_steamrep,
		'profile_wastedonsteam': profile_wastedonsteam,
		'profile_sapi': profile_sapi,
		'profile_backpacktf': profile_backpacktf		
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
		if (settings.bgcolor === undefined) { settings.bgcolor = "#5c7836";	chrome.storage.sync.set({'bgcolor': settings.bgcolor});	}
		if (settings.wlcolor === undefined) { settings.wlcolor = "#496e93";	chrome.storage.sync.set({'wlcolor': settings.wlcolor}); }
		if (settings.ccolor === undefined) { settings.ccolor = "#6b2269";	chrome.storage.sync.set({'ccolor': settings.ccolor}); }
		if (settings.showtotal === undefined) {	settings.showtotal = "Yes";	chrome.storage.sync.set({'showtotal': settings.showtotal}); }		
		if (settings.showmcus === undefined) { settings.showmcus = "Yes"; chrome.storage.sync.set({'showmcus': settings.showmcus}); }		
		if (settings.showwsgf === undefined) { settings.showwsgf = "Yes"; chrome.storage.sync.set({'showwsgf': settings.showwsgf}); }
		if (settings.showdrm === undefined) { settings.showdrm = "Yes";	chrome.storage.sync.set({'showdrm': settings.showdrm}); }
		if (settings.showlowestprice === undefined) { settings.showlowestprice = "Yes";	chrome.storage.sync.set({'showlowestprice': settings.showlowestprice}); }		
		if (settings.showgroupevents === undefined) { settings.showgroupevents = "Yes";	chrome.storage.sync.set({'showgroupevents': settings.showgroupevents});	}		
		if (settings.showgreenlightbanner === undefined) { settings.showgreenlightbanner = "No"; chrome.storage.sync.set({'showgreenlightbanner': settings.showgreenlightbanner}); }	
		if (settings.profile_steamgifts === undefined) { settings.profile_steamgifts = true; chrome.storage.sync.set({'profile_steamgifts': settings.profile_steamgifts}); }
		if (settings.profile_steamtrades === undefined) { settings.profile_steamtrades = true; chrome.storage.sync.set({'profile_steamtrades': settings.profile_steamtrades}); }
		if (settings.profile_steamrep === undefined) { settings.profile_steamrep = true; chrome.storage.sync.set({'profile_steamrep': settings.profile_steamrep}); }
		if (settings.profile_wastedonsteam === undefined) { settings.profile_wastedonsteam = true; chrome.storage.sync.set({'profile_wastedonsteam': settings.profile_wastedonsteam}); }
		if (settings.profile_sapi === undefined) { settings.profile_sapi = true; chrome.storage.sync.set({'profile_sapi': settings.profile_sapi}); }
		if (settings.profile_backpacktf === undefined) { settings.profile_backpacktf = true; chrome.storage.sync.set({'profile_backpacktf': settings.profile_backpacktf}); }
		
		// Load Store Options
		$("#bgcolor").attr('value', settings.bgcolor);
		$("#wlcolor").attr('value', settings.wlcolor);
		$("#ccolor").attr('value', settings.ccolor);
		$("#showdrm").attr('value', settings.showdrm);
		$("#showmcus").attr('value', settings.showmcus);
		$("#showwsgf").attr('value', settings.showwsgf);
		$("#showlowestprice").attr('value', settings.showlowestprice);
				
		// Load Community Options
		$("#showtotal").attr('value', settings.showtotal);
		$("#showgroupevents").attr('value', settings.showgroupevents);
		$("#showgreenlightbanner").attr('value', settings.showgreenlightbanner);
		
		// Load Profile Link Options
		$("#profile_steamgifts").attr('checked', settings.profile_steamgifts);
		$("#profile_steamtrades").attr('checked', settings.profile_steamtrades);
		$("#profile_steamrep").attr('checked', settings.profile_steamrep);
		$("#profile_wastedonsteam").attr('checked', settings.profile_wastedonsteam);
		$("#profile_sapi").attr('checked', settings.profile_sapi);
		$("#profile_backpacktf").attr('checked', settings.profile_backpacktf);	
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

document.addEventListener('DOMContentLoaded', restore_options);
document.addEventListener('DOMContentLoaded', function () {
// Wait until page has loaded to add events to DOM nodes
document.querySelector('#save').addEventListener('click', save_options);
document.querySelector('#bgdefault').addEventListener('click', load_defaultbgcolor);
document.querySelector('#wldefault').addEventListener('click', load_defaultwlcolor);
document.querySelector('#cdefault').addEventListener('click', load_defaultccolor);
document.querySelector('#nav_store').addEventListener('click', load_store_tab);
document.querySelector('#nav_community').addEventListener('click', load_community_tab);
document.querySelector('#nav_news').addEventListener('click', load_news_tab);
document.querySelector('#nav_about').addEventListener('click', load_about_tab);
document.querySelector('#nav_donate').addEventListener('click', load_donate_tab);
});