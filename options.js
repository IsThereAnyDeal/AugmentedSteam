// Save this script as `options.js`

// Saves options to localStorage.
function save_options() {
	var select = document.getElementById("showtotal");
	var bgcolortext = document.getElementById("bgcolor");
	var wlcolortext = document.getElementById("wlcolor");
	var selectdrm = document.getElementById("showdrm");
	var selectlowestprice = document.getElementById("showlowestprice");
	var selectgroupevents = document.getElementById("showgroupevents");
	var selectgreenlightbanner = document.getElementById("showgreenlightbanner");
	var selectmcus = document.getElementById("showmcus");
	var selectwsgf = document.getElementById("showwsgf");
	
	var showtotal = select.children[select.selectedIndex].value;
	var showdrm = selectdrm.children[selectdrm.selectedIndex].value;
	var showlowestprice = selectlowestprice.children[selectlowestprice.selectedIndex].value;	
	var showgroupevents = selectgroupevents.children[selectgroupevents.selectedIndex].value;
	var showgreenlightbanner = selectgreenlightbanner.children[selectgreenlightbanner.selectedIndex].value;	
	var bgcolor = bgcolortext.value;
	var wlcolor = wlcolortext.value;
	var showmcus = selectmcus.children[selectmcus.selectedIndex].value;
	var showwsgf = selectwsgf.children[selectwsgf.selectedIndex].value;
		
	chrome.storage.sync.set({'showtotal': showtotal, 'showmcus': showmcus, 'showwsgf': showwsgf, 'showdrm': showdrm, 'showlowestprice': showlowestprice, 'showgroupevents': showgroupevents, 'showgreenlightbanner': showgreenlightbanner, 'bgcolor': bgcolor, 'wlcolor': wlcolor}, function() {
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
			
		showtotal = settings['showtotal'];
		showdrm = settings['showdrm'];
		showlowestprice = settings['showlowestprice'];		
		showgroupevents = settings['showgroupevents'];
		showgreenlightbanner = settings['showgreenlightbanner'];
		bgcolor = settings['bgcolor'];
		wlcolor = settings['wlcolor'];
		showmcus = settings['showmcus'];
		showwsgf = settings['showwsgf'];
		
		if (settings.showtotal === undefined) {
			showtotal = "Yes";
			chrome.storage.sync.set({'showtotal': showtotal}, function() {
				console.log("set showtotal to default.");
			});
		}
		
		if (settings.showmcus === undefined) {
			showmcus = "Yes";
			chrome.storage.sync.set({'showmcus': showmcus}, function() {
				console.log("set showmcus to default.");
			});
		}
		
		if (settings.showwsgf === undefined) {
			showwsgf = "Yes";
			chrome.storage.sync.set({'showwsgf': showwsgf}, function() {
				console.log("set showwsgf to default.");
			});
		}
		
		if (settings.showdrm === undefined) {
			showdrm = "Yes";
			chrome.storage.sync.set({'showdrm': showdrm}, function() {
				console.log("set showdrm to default.");
			});
		}
		
		if (settings.showlowestprice === undefined) {
			showlowestprice = "Yes";
			chrome.storage.sync.set({'showlowestprice': showlowestprice}, function() {
				console.log("set showlowestprice to default.");
			});
		}
		
		if (settings.showgroupevents === undefined) {
			showgroupevents = "Yes";
			chrome.storage.sync.set({'showgroupevents': showgroupevents}, function() {
				console.log("set showgroupevents to default.");
			});
		}
		
		if (settings.showgreenlightbanner === undefined) {
			showgreenlightbanner = "No";
			chrome.storage.sync.set({'showgreenlightbanner': showgreenlightbanner}, function() {
				console.log("set showgreenlightbanner to default.");
			});
		}
					
		if (settings.bgcolor === undefined) {
			bgcolor = "#5c7836";
			chrome.storage.sync.set({'bgcolor': bgcolor}, function() {
				console.log("set bgcolor to default.");
			});
		}
		
		if (wlcolor === undefined) {
			wlcolor = "#496e93";
			chrome.storage.sync.set({'wlcolor': wlcolor}, function() {
				console.log("set wlcolor to default.");
			});
		}
		
		var bgtext = document.getElementById("bgcolor");
		bgtext.value = bgcolor;
		
		var wltext = document.getElementById("wlcolor");
		wltext.value = wlcolor;
		
		var selectdrm = document.getElementById("showdrm");
		for (var i = 0; i < selectdrm.children.length; i++) {
			var child = selectdrm.children[i];
			if (child.value == showdrm) {
				child.selected = "true";
			break;
			}
		}
		
		var selectmcus = document.getElementById("showmcus");
		for (var i = 0; i < selectmcus.children.length; i++) {
			var child = selectmcus.children[i];
			if (child.value == showmcus) {
				child.selected = "true";
			break;
			}
		}
		
		var selectwsgf = document.getElementById("showwsgf");
		for (var i = 0; i < selectwsgf.children.length; i++) {
			var child = selectwsgf.children[i];
			if (child.value == showwsgf) {
				child.selected = "true";
			break;
			}
		}
		
		var selectlowestprice = document.getElementById("showlowestprice");
		for (var i = 0; i < selectlowestprice.children.length; i++) {
			var child = selectlowestprice.children[i];
			if (child.value == showlowestprice) {
				child.selected = "true";
			break;
			}
		}
		
		var selectgroupevents = document.getElementById("showgroupevents");
		for (var i = 0; i < selectgroupevents.children.length; i++) {
			var child = selectgroupevents.children[i];
			if (child.value == showgroupevents) {
				child.selected = "true";
			break;
			}
		}
		
		var selectgreenlightbanner = document.getElementById("showgreenlightbanner");
		for (var i = 0; i < selectgreenlightbanner.children.length; i++) {
			var child = selectgreenlightbanner.children[i];
			if (child.value == showgreenlightbanner) {
				child.selected = "true";
			break;
			}
		}
	
		var select = document.getElementById("showtotal");
		for (var i = 0; i < select.children.length; i++) {
			var child = select.children[i];
			if (child.value == showtotal) {
				child.selected = "true";
			break;
			}
		}
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

function reset () {
	chrome.storage.sync.clear;
	chrome.storage.sync.clear(function() {
		// Notify that we saved.
		var status = document.getElementById("status");
		status.innerHTML = "Options Cleared.";
		setTimeout(function() {status.innerHTML = "";}, 750);
	});  
}

document.addEventListener('DOMContentLoaded', restore_options);
document.addEventListener('DOMContentLoaded', function () {
// Wait until page has loaded to add events to DOM nodes
document.querySelector('#save').addEventListener('click', save_options);
document.querySelector('#bgdefault').addEventListener('click', load_defaultbgcolor);
document.querySelector('#wldefault').addEventListener('click', load_defaultwlcolor);
document.querySelector('#nav_store').addEventListener('click', load_store_tab);
document.querySelector('#nav_community').addEventListener('click', load_community_tab);
document.querySelector('#nav_news').addEventListener('click', load_news_tab);
document.querySelector('#nav_about').addEventListener('click', load_about_tab);
document.querySelector('#nav_donate').addEventListener('click', load_donate_tab);
});