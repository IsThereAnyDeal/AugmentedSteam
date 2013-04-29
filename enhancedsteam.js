// version 3.0

function setValue(key, value) {
	sessionStorage.setItem(key, JSON.stringify(value));
}

function getValue(key) {
	var v = sessionStorage.getItem(key);
	if (v === undefined) return v;
	return JSON.parse(v);
}

var storage = chrome.storage.sync;

function startWith(str, prefix) {
	return str.lastIndexOf(prefix, 0) === 0;
}

function xpath_each(xpath, callback) {
	var res = document.evaluate(xpath, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	var node;
	for (var i = 0; i < res.snapshotLength; ++i) {
		node = res.snapshotItem(i);
		callback(node);
	}
}

function getelem(node, tag, className) {
	var ary = node.getElementsByTagName(tag);
	for (var i = 0, length = ary.length; i < length; i++) {
		var e = ary[i];
		if (e.className == className) return e;
	}
	return null;
}

function get_http(url, callback) {
	var http = new XMLHttpRequest();
	http.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			callback(this.responseText);
		}
	}
	http.open('GET', url, true);
	http.send(null);
}

function get_divContents(selector) {
	var nodeList = document.querySelectorAll(selector);
	for (var i = 0, length = nodeList.length; i < length; i++) {
		return nodeList[i].innerHTML;
	}
}

var owned;

function get_appid(t) {
	if (t && t.match(/^http:\/\/store\.steampowered\.com\/app\/(\d+)\//)) return RegExp.$1;
	else return null;
}

function get_appid_wishlist(t) {
	if (t && t.match(/game_(\d+)/)) return RegExp.$1;
	else return null;
}

function get_groupname(t) {
	if (t && t.match(/^http:\/\/steamcommunity\.com\/groups\/(\S+)/)) return RegExp.$1;
	else return null;
}

// colors the tile for owned games
function highlight_owned(node) {
	storage.get(function(settings) {
		if (settings.bgcolor === undefined) { settings.bgcolor = "#5c7836";	storage.set({'bgcolor': settings.bgcolor}); }
		if (settings.showowned === undefined) { settings.showowned = true; storage.set({'showowned': settings.showowned}); }
		if (settings.showowned) {
			node.style.backgroundImage = "none";
			node.style.backgroundColor = settings.bgcolor;
		}
	});
	owned = true;
}

// colors the tile for wishlist games
function highlight_wishlist(node) {
	storage.get(function(settings) {
		if (settings.wlcolor === undefined) { settings.wlcolor = "#496e93";	storage.set({'wlcolor': settings.wlcolor}); }
		if (settings.showwishlist === undefined) { settings.showwishlist = true; storage.set({'showwishlist': settings.showwishlist}); }
		if (settings.showwishlist) {
			node.style.backgroundImage = "none";
			node.style.backgroundColor = settings.wlcolor;
		}	
	});
}

// colors the tile for items with coupons
function highlight_coupon(node) {	
	storage.get(function(settings) {
		if (settings.ccolor === undefined) { settings.ccolor = "#6b2269"; storage.set({'ccolor': settings.ccolor}); }
		if (settings.showcoupon === undefined) { settings.showcoupon = true; storage.set({'showcoupon': settings.showcoupon}); }
		if (settings.showcoupon) {
			node.style.backgroundImage = "none";
			node.style.backgroundColor = settings.ccolor;
		}
	});
}

// colors the tile for items in inventory
function highlight_inv(node) {	
	storage.get(function(settings) {
		if (settings.icolor === undefined) { settings.icolor = "#a75124"; storage.set({'icolor': settings.icolor}); }
		node.style.backgroundImage = "none";
		node.style.backgroundColor = settings.icolor;
	});
}

// checks an item panel
function add_info(node, appid) {
	// loads values from cache to reduce response time	
	if (getValue(appid)) { highlight_owned(node); return; }	
	if (getValue(appid+"c")) { highlight_coupon(node); return }
	if (getValue(appid+"w")) { highlight_wishlist(node); return }
	if (getValue(appid+"i")) { highlight_inv(node); return }
	
	// sets GET request and returns as text for evaluation
	get_http('/app/' + appid + '/', function (txt) {		
		if (txt.search(/<a href="http:\/\/steamcommunity.com\/id\/.+\/wishlist">/) > 0) {
			if (txt.search(/<div id="add_to_wishlist_area_fail" style="display: none;">/) < 0) {
				setValue(appid+"w", true);
				highlight_wishlist(node);
			}		
		}
		if (txt.search(/<div class="game_area_already_owned">/) > 0) {
			setValue(appid, true);
			highlight_owned(node);
		}	
	});
		
	/* check to see if it's in inventory
	get_http('http://steamcommunity.com/my/inventory/json/753/1/', function (txt) {
		var has_inv = txt.indexOf('[{"name":"View in store","link":"http:\\/\\/store\.steampowered\.com\\/app\\/' + appid);
		if (has_inv > 0) {
			setValue(appid+"i", true);
			highlight_inv(node);
		}
	}); */		
}

function add_info_wishlist(node, appid) {
	// loads values from cache to reduce response time	
	if (getValue(appid)) { highlight_owned(node); return; }
	
	// sets GET request and returns as text for evaluation
	get_http('http://store.steampowered.com/app/' + appid + '/', function (txt) {		
		if (txt.search(/<div class="game_area_already_owned">/) > 0) {
			setValue(appid, true);
			highlight_owned(node);
		}	
	});
}

function find_purchase_date(appname) {	
	get_http('https://store.steampowered.com/account/', function (txt) {
		var apphtml = txt.substring(txt.indexOf('<div class="transactionRowTitle">' + appname), txt.indexOf('<div class="transactionRowTitle">' + appname) - 300);
		var appdate = apphtml.match(/<div class="transactionRowDate">(.+)<\/div>/);
		var found = 0;		
		xpath_each("//div[contains(@class,'game_area_already_owned')]", function (node) {
			if (found == 0) {
				if (appdate != undefined) {
					if (appdate !== "") {
						node.innerHTML = node.innerHTML + "(Purchased " + appdate[1] + ")";
						found = 1;
					}	
				}
			}	
		});
	});	
}

// Adds a link to options to the global menu (where is Install Steam button)
document.getElementById("global_action_menu").insertAdjacentHTML("afterend", '<div style="float: left; margin-right: 5px;"><a href="' + chrome.extension.getURL("options.html") + '" target="_blank" class="global_action_link">Enhanced Steam</a></div>');

// Removes the "Install Steam" button at the top of each page
storage.get(function(settings) {
	if (settings.hideinstallsteambutton === undefined) { settings.hideinstallsteambutton = false; storage.set({'hideinstallsteambutton': settings.hideinstallsteambutton}); }
	if (settings.hideinstallsteambutton) {
		$('div.header_installsteam_btn').replaceWith('');
	}
});

// on app page
var localurl = document.URL;
if (document.URL.indexOf(document.URL.length - 1, document.URL.length) !== "/") {
	localurl = localurl + "/";
}

var localappid = get_appid(localurl);

// Get User's Coupons
if (document.URL.indexOf("://store.steampowered.com/") >= 0) {	
	var done = getValue("coupondone");	
	if (done != "1") {		
		// Get JSON results
		get_http('http://steamcommunity.com/my/inventory/json/753/3/', function (txt) {
			var coupons = txt.split("/?list_of_subs=");
			for (var i=1;i<coupons.length;i++) {
				// For each coupon, load search page and return first appID in results (not sure how this works for multi-game coupons?)
				var searchID = coupons[i].substring(0, coupons[i].indexOf('","'));				
				get_http('http://store.steampowered.com/search/?list_of_subs=' + searchID, function (subtxt) {
					var couponAppID = subtxt.substring(subtxt.indexOf('<a href="http://store.steampowered.com/app/') + 43, subtxt.indexOf('/?snr=1_7_7_230_150_1" class="search_result_row even"'));
					var pageSearchID = subtxt.substring(subtxt.indexOf('<input type="hidden" name="list_of_subs" value="') + 48, subtxt.indexOf('<div class="search_controls" id="default_search_controls">') - 12);
					setValue(couponAppID+"c", true);
					setValue(couponAppID+"csub", pageSearchID);
					setValue("coupondone", "1");
				});
			}
		});
	}
}

var curcomma;
var currencysymbol;

// If app has a coupon, display message
if (getValue(localappid+"c")) {	
	// get JSON coupon results
	get_http('http://steamcommunity.com/my/inventory/json/753/3/', function (txt) {
		var coupons = txt.split('{"appid":"753","classid":"');
		for (var i=1;i<coupons.length;i++) {
			if (coupons[i].indexOf(getValue(localappid+"csub")) >= 0 ) {
				var couponimageurl = coupons[i].substring(coupons[i].indexOf('"icon_url"') + 12, coupons[i].indexOf('","icon_url_large"'));
				var coupontitle    = coupons[i].substring(coupons[i].indexOf('"name":"')   +  8, coupons[i].indexOf('","market_name":"'));
				var couponvalid    = coupons[i].substring(coupons[i].indexOf('{"value":"(Valid') + 10, coupons[i].indexOf('","color":"A75124"}'));
				var coupondisc     = "";
				var discamount     = coupons[i].match(/[1-9][0-9]%/);
				if (coupons[i].indexOf("Can't be applied with other discounts.") > 0) { coupondisc = "Can't be applied with other discounts."; }
				document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="early_access_header"><div class="heading"><h1 class="inset">You have a coupon available!</h1><h2 class="inset">A coupon in your inventory will be applied automatically at checkout.</h2><p><a href="https://support.steampowered.com/kb_article.php?ref=4210-YIPC-0275">Learn more</a> about Steam Coupons</p></div><div class="devnotes"><table border=0><tr><td rowspan=3><img src="http://cdn.steamcommunity.com/economy/image/' + couponimageurl + '"></td><td valign=center><h1>' + coupontitle + '</h1></td></tr><tr><td>' + coupondisc + '</td></tr><tr><td><font style="color:#A75124;">' + couponvalid + '</font></td></tr></table><p></div></div>');
				
				// Get the original price, discounted price, and AddToCartID, and currency symbol
				var pricediv = document.querySelector('[itemtype="http://schema.org/Offer"]').innerHTML;
				if (pricediv.indexOf(".") > 0) { 
					var originalprice  = pricediv.substring(pricediv.indexOf('<div class="game_purchase_price price" itemprop="price">') + 65, pricediv.indexOf('<a class="btn_addtocart_content" href="javascript:addToCart(') - 110);
					var addToCartID    = document.body.innerHTML.substring(document.body.innerHTML.indexOf('<input type="hidden" name="subid" value="') + 41, document.body.innerHTML.indexOf('<div class="game_area_purchase_platform">') - 17);
					var discountprice  = (originalprice - ((originalprice * discamount[0].substring(0,2)) / 100).toFixed(2)).toFixed(2);				
					currencysymbol     = pricediv.substring(pricediv.indexOf('<div class="game_purchase_price price" itemprop="price">') + 64, pricediv.indexOf('<div class="game_purchase_price price" itemprop="price">') + 65);
					if (document.body.innerHTML.indexOf('<div class="discount_block game_purchase_discount">') <= 0) {						
						document.querySelector('[itemtype="http://schema.org/Offer"]').innerHTML = '<div class="game_purchase_action_bg"><div class="discount_block game_purchase_discount"><div class="discount_pct">-' + discamount + '</div><div class="discount_prices"><div class="discount_original_price">' + currencysymbol + originalprice + '</div><div class="discount_final_price" itemprop="price">' + currencysymbol + discountprice + '</div></div></div><div class="btn_addtocart"><div class="btn_addtocart_left"></div><a class="btn_addtocart_content" href="javascript:addToCart( ' + addToCartID + ');">Add to Cart</a><div class="btn_addtocart_right"></div></div></div>';
					}
					else {
						if (coupondisc != "Can't be applied with other discounts.") {
							var newdiscount = originalprice.match(/<div class="discount_final_price" itemprop="price">(.+)<\/div>/);							
							var newdiscount2 = (Number(newdiscount[1].replace(/[^0-9\.]+/g,"")) - (Number(newdiscount[1].replace(/[^0-9\.]+/g,"")) * ((discamount[0].substring(0,2)) / 100))).toFixed(2);
							currencysymbol = pricediv.substring(pricediv.indexOf('<div class="discount_original_price">') + 37, pricediv.indexOf('<div class="discount_original_price">') + 38);							
							document.querySelector('[itemtype="http://schema.org/Offer"]').innerHTML = '<div class="game_purchase_action_bg"><div class="discount_block game_purchase_discount"><div class="discount_pct">-' + discamount + '</div><div class="discount_prices"><div class="discount_original_price">' + newdiscount[1] + '</div><div class="discount_final_price" itemprop="price">' + currencysymbol + newdiscount2 + '</div></div></div><div class="btn_addtocart"><div class="btn_addtocart_left"></div><a class="btn_addtocart_content" href="javascript:addToCart( ' + addToCartID + ');">Add to Cart</a><div class="btn_addtocart_right"></div></div></div>';							
						}
					}
				}
				if (pricediv.indexOf("USD") > 0) { 
					var originalprice  = pricediv.substring(pricediv.indexOf('<div class="game_purchase_price price" itemprop="price">') + 65, pricediv.indexOf('<a class="btn_addtocart_content" href="javascript:addToCart(') - 114);
					var addToCartID    = document.body.innerHTML.substring(document.body.innerHTML.indexOf('<input type="hidden" name="subid" value="') + 41, document.body.innerHTML.indexOf('<div class="game_area_purchase_platform">') - 17);
					var discountprice  = (originalprice - ((originalprice * discamount[0].substring(0,2)) / 100).toFixed(2)).toFixed(2);				
					currencysymbol     = pricediv.substring(pricediv.indexOf('<div class="game_purchase_price price" itemprop="price">') + 64, pricediv.indexOf('<div class="game_purchase_price price" itemprop="price">') + 65);
					if (document.body.innerHTML.indexOf('<div class="discount_block game_purchase_discount">') <= 0) {
						document.querySelector('[itemtype="http://schema.org/Offer"]').innerHTML = '<div class="game_purchase_action_bg"><div class="discount_block game_purchase_discount"><div class="discount_pct">-' + discamount + '</div><div class="discount_prices"><div class="discount_original_price">' + currencysymbol + originalprice + ' USD</div><div class="discount_final_price" itemprop="price">' + currencysymbol + discountprice + ' USD</div></div></div><div class="btn_addtocart"><div class="btn_addtocart_left"></div><a class="btn_addtocart_content" href="javascript:addToCart( ' + addToCartID + ');">Add to Cart</a><div class="btn_addtocart_right"></div></div></div>';
					}
				}				
				if (pricediv.indexOf(",") > 0) { 
					var originalprice  = pricediv.substring(pricediv.indexOf('<div class="game_purchase_price price" itemprop="price">') + 64, pricediv.indexOf('<a class="btn_addtocart_content" href="javascript:addToCart(') - 113);
					originalprice = originalprice.replace(",",".");
					var addToCartID    = document.body.innerHTML.substring(document.body.innerHTML.indexOf('<input type="hidden" name="subid" value="') + 41, document.body.innerHTML.indexOf('<div class="game_area_purchase_platform">') - 17);
					var discountprice  = (originalprice - ((originalprice * discamount[0].substring(0,2)) / 100).toFixed(2)).toFixed(2);				
					currencysymbol     = pricediv.substring(pricediv.indexOf('<div class="game_purchase_price price" itemprop="price">') + 69, pricediv.indexOf('<div class="game_purchase_price price" itemprop="price">') + 70);
					originalprice = originalprice.replace(".",",");
					discountprice = discountprice.replace(".",",");
					if (document.body.innerHTML.indexOf('<div class="discount_block game_purchase_discount">') <= 0) {
						document.querySelector('[itemtype="http://schema.org/Offer"]').innerHTML = '<div class="game_purchase_action_bg"><div class="discount_block game_purchase_discount"><div class="discount_pct">-' + discamount + '</div><div class="discount_prices"><div class="discount_original_price">' + originalprice + currencysymbol + '</div><div class="discount_final_price" itemprop="price">' + discountprice + currencysymbol + '</div></div></div><div class="btn_addtocart"><div class="btn_addtocart_left"></div><a class="btn_addtocart_content" href="javascript:addToCart( ' + addToCartID + ');">Add to Cart</a><div class="btn_addtocart_right"></div></div></div>';
					}
					else {
						if (coupondisc != "Can't be applied with other discounts.") {
							var newdiscount = originalprice.match(/<div class="discount_final_price" itemprop="price">(.+)<\/div>/);
							var newdiscount2 = (Number(newdiscount[1].replace(/[^0-9\.]+/g,"")) - (Number(newdiscount[1].replace(/[^0-9\.]+/g,"")) * ((discamount[0].substring(0,2)) / 100))).toFixed(0);
							console.log ((Number(newdiscount[1].replace(/[^0-9\.]+/g,"")) - (Number(newdiscount[1].replace(/[^0-9\.]+/g,"")) * ((discamount[0].substring(0,2)) / 100))));
							currencysymbol = pricediv.substring(pricediv.indexOf('<div class="discount_original_price">') + 42, pricediv.indexOf('<div class="discount_original_price">') + 43);
							console.log (currencysymbol);
							document.querySelector('[itemtype="http://schema.org/Offer"]').innerHTML = '<div class="game_purchase_action_bg"><div class="discount_block game_purchase_discount"><div class="discount_pct">-' + discamount + '</div><div class="discount_prices"><div class="discount_original_price">' + newdiscount[1] + '</div><div class="discount_final_price" itemprop="price">' + newdiscount2 + currencysymbol + '</div></div></div><div class="btn_addtocart"><div class="btn_addtocart_left"></div><a class="btn_addtocart_content" href="javascript:addToCart( ' + addToCartID + ');">Add to Cart</a><div class="btn_addtocart_right"></div></div></div>';							
						}
					}
				}
				if (pricediv.indexOf("pуб.") > 0) { 
					var originalprice  = pricediv.substring(pricediv.indexOf('<div class="game_purchase_price price" itemprop="price">') + 64, pricediv.indexOf('<a class="btn_addtocart_content" href="javascript:addToCart(') - 121);
					var addToCartID    = document.body.innerHTML.substring(document.body.innerHTML.indexOf('<input type="hidden" name="subid" value="') + 41, document.body.innerHTML.indexOf('<div class="game_area_purchase_platform">') - 17);
					var discountprice  = (originalprice - ((originalprice * discamount[0].substring(0,2)) / 100).toFixed(2)).toFixed(2);				
					currencysymbol     = "pуб.";					
					discountprice = discountprice.replace(".",",");
					if (document.body.innerHTML.indexOf('<div class="discount_block game_purchase_discount">') <= 0) {
						document.querySelector('[itemtype="http://schema.org/Offer"]').innerHTML = '<div class="game_purchase_action_bg"><div class="discount_block game_purchase_discount"><div class="discount_pct">-' + discamount + '</div><div class="discount_prices"><div class="discount_original_price">' + originalprice + " " + currencysymbol + '</div><div class="discount_final_price" itemprop="price">' + discountprice + " " + currencysymbol + '</div></div></div><div class="btn_addtocart"><div class="btn_addtocart_left"></div><a class="btn_addtocart_content" href="javascript:addToCart( ' + addToCartID + ');">Add to Cart</a><div class="btn_addtocart_right"></div></div></div>';
					}
				}
			}
		}
	});
}

// show pricing history
storage.get(function(settings) {	
	if (settings.showlowestprice === undefined) { settings.showlowestprice = true; storage.set({'showlowestprice': settings.showlowestprice}); }	
	if (settings.showlowestprice) {
		if (localappid !== null) {
			var sgsurl = "http://www.steamgamesales.com/app/" + localappid + "/";
			lowest_price = "<div class='game_purchase_area_friends_want' style='padding-top: 15px; height: 30px; border-top: 1px solid #4d4b49; border-left: 1px solid #4d4b49; border-right: 1px solid #4d4b49;' id='enhancedsteam_lowest_price'><div class='gift_icon' style='margin-top: -9px;'><img src='" + chrome.extension.getURL("img/line_chart.png") + "'></div><a href='" + sgsurl + "' target='_blank'>Click here to check pricing history</a>";
			document.getElementById('game_area_purchase').insertAdjacentHTML('afterbegin', lowest_price);			
		}
	}
});

//sale or sub
var not_have = 0;
var sub = startWith(location.pathname, '/sub/');
var checked = false;
var price = 0;
xpath_each("//div[contains(@class,'tab_row') or contains(@class,'sale_page_purchase_item')]", function (node) {
	if (node.checked) return;
	node.checked = checked = true;
	owned = false;
	var itemPrice;
	if (sub) {
		var e = getelem(node, 'div', 'tab_price').lastChild;
				
		if (e.nodeValue.indexOf(",") > 0) {
			var m = e.nodeValue.match(/[0-9]+.[0-9]+./);
			itemPrice = m ? parseFloat(m[0].replace(/[^0-9-.]/g, '')) : 0;
			curcomma = true;
			
			currencysymbol = e.nodeValue.replace(/\s+/g, ' ');
			if (currencysymbol.indexOf(" ") !== 0) { currencysymbol = " " + currencysymbol; }
			
			currencysymbol = currencysymbol.match(/. $/);			
			if (currencysymbol !== null) {
				currencysymbol = currencysymbol[0];
			}	
		}
		
		if (e.nodeValue.indexOf(".") > 0) { 
			var m = e.nodeValue.match(/[0-9\.]+/); 
			itemPrice = m ? parseFloat(m[0]) : 0;
			
			currencysymbol = e.nodeValue.replace(/\s+/g, ' ');
			if (currencysymbol.indexOf(" ") !== 0) { currencysymbol = " " + currencysymbol; }
			
			currencysymbol = currencysymbol.match(/^ ./);
			if (currencysymbol !== null) {
				currencysymbol = currencysymbol[0];
			}	
		}
				
		if (e.nodeValue.indexOf("p") > 0) {
			currencysymbol = "py6. ";
		}
		
	}
	
	var ret = node.getElementsByTagName('a');
	var appid;
	if (appid = get_appid(ret[0].href)) {
		add_info(node, appid);
		if (owned == false) {
			price = price + itemPrice;
		}	
	}

});

// overloads the Number object with a method for formatting money
Number.prototype.formatMoney = function(places, symbol, thousand, decimal) {
	places = !isNaN(places = Math.abs(places)) ? places : 2;
	symbol = symbol !== undefined ? symbol : "$";
	thousand = thousand || ",";
	decimal = decimal || ".";
	var number = this, 
	    negative = number < 0 ? "-" : "",
	    i = parseInt(number = Math.abs(+number || 0).toFixed(places), 10) + "",
	    j = (j = i.length) > 3 ? j % 3 : 0;
	return symbol + negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) + (places ? decimal + Math.abs(number - i).toFixed(places).slice(2) : "");
};

// calculates the savings of a pack or bundle and your savings based on games owned.
if (sub && checked) {

	var bundle_price = get_divContents('.discount_final_price');	
	if (bundle_price === undefined) { bundle_price = get_divContents('.game_purchase_price'); }
	var bundle_price2 = Number(bundle_price.replace(/[^0-9\.]+/g,""));
	price = price - bundle_price2;
	var message;
	
	if (price > 0) {
		message = '<div class="savings">' + price.formatMoney(2,currencysymbol,",",".") + '</div>';
		if (curcomma) {
			price = (price / 100);
			message = '<div class="savings">' + price.formatMoney(2,currencysymbol,",",",") + '</div>';
		}
		
	}
	else {
		message = '<div class="savings"><font color=red>' + price.formatMoney(2,currencysymbol,",",".") + '</font></div>';
		if (curcomma) {
			price = (price / 100);
			message = '<div class="savings"><font color=red>' + price.formatMoney(2,currencysymbol,",",",") + '</font></div>';
		}
	}
	
	xpath_each("//div[@class='package_totals_row']", function (node) {
		$('.savings').replaceWith(message);
	});
}

// DLC on App Page
xpath_each("//a[contains(@class,'game_area_dlc_row')]", function (node) {
	var appid;
	if (appid = get_appid(node.href)) {
		add_info(node, appid);
	}
});

// search result
xpath_each("//a[contains(@class,'search_result_row')]", function (node) {
	var appid;
	if (appid = get_appid(node.href)) {
		add_info(node, appid);
	}
});

// highlights featured homepage items
xpath_each("//a[contains(@class,'small_cap')]", function (node) {
	var appid;
	if (appid = get_appid(node.href)) {
		add_info(node, appid);
	}
});

// hightlight daily deal
xpath_each("//div[contains(@class,'dailydeal')]", function (node) {
		
	var appid;
	
	var dd_start = node.innerHTML.indexOf('<a href="http://store.steampowered.com/app/');
	var dd_end = node.innerHTML.indexOf('<img src=');
	
	var dailydeal = node.innerHTML.substring(dd_start + 9, dd_end - 8);	
	
	appid = get_appid(dailydeal);
	add_info(node, appid);
	
});

// wishlist owned
xpath_each("//div[contains(@class,'wishlistRow')]", function (node) {
	var appid;
	
	if (appid = get_appid_wishlist(node.id)) {
		add_info_wishlist(node, appid);
	} 
});

var appname;

xpath_each("//div[contains(@class,'apphub_AppName')]", function (app) {
	appname = app.innerHTML;
});
	
// find the date a game was purchased if owned
xpath_each("//div[contains(@class,'game_area_already_owned')]", function (node) {
	if (node.innerHTML.indexOf("You already own") > 0) {
		find_purchase_date(appname);
	}
});

// pull DLC gamedata from enhancedsteam.com
if (document.body.innerHTML.indexOf("<p>Requires the base game <a href=") > 0) { 
	get_http("http://www.enhancedsteam.com/gamedata/gamedata.php?appid=" + localappid + "&appname=" + appname , function (txt) {
		var block = "<div class='block'><div class='block_header'><h4>Downloadable Content Details</h4></div><div class='block_content'><div class='block_content_inner'>" + txt + "</div></div></div>";
	
		var dlc_categories = document.getElementById('demo_block');
		dlc_categories.insertAdjacentHTML('afterend', block);
	});
}

// Adds red warnings for 3rd party DRM
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
		var otherdrm;

		// Games for Windows Live detection
		if (document.body.innerHTML.indexOf("Games for Windows LIVE") > 0) { gfwl = true; }
		if (document.body.innerHTML.indexOf("Games for Windows Live") > 0) { gfwl = true; }
		if (document.body.innerHTML.indexOf("Games for Windows - Live") > 0) { gfwl = true; }
		if (document.body.innerHTML.indexOf("Games For Windows - Live") > 0) { gfwl = true; }
		if (document.body.innerHTML.indexOf("Games for Windows - LIVE") > 0) { gfwl = true; }
		if (document.body.innerHTML.indexOf("Games For Windows - LIVE") > 0) { gfwl = true; }
		if (document.body.innerHTML.indexOf("Online play requires log-in to Games For Windows") > 0) { gfwl = true; }
		if (document.body.innerHTML.indexOf("INSTALLATION OF THE GAMES FOR WINDOWS LIVE SOFTWARE") > 0) { gfwl = true; }
		if (document.body.innerHTML.indexOf("Multiplayer play and other LIVE features included at no charge") > 0) { gfwl = true; }
		if (document.body.innerHTML.indexOf("www.gamesforwindows.com/live") > 0) { gfwl = true; }

		// Ubisoft Uplay detection
		if (document.body.innerHTML.indexOf("Uplay Account") > 0) { uplay = true; }
		if (document.body.innerHTML.indexOf("UPLAY ACCOUNT") > 0) { uplay = true; }
		if (document.body.innerHTML.indexOf("UPlay account") > 0) { uplay = true; }
		if (document.body.innerHTML.indexOf("HIGH SPEED INTERNET CONNECTION AND CREATION OF A UBISOFT ACCOUNT ARE REQUIRED") > 0) { uplay = true; }
		if (document.body.innerHTML.indexOf("HIGH SPEED INTERNET ACCESS AND CREATION OF A UBISOFT ACCOUNT ARE REQUIRED") > 0) { uplay = true; }
		if (document.body.innerHTML.indexOf("CREATION OF A UBISOFT ACCOUNT") > 0) { uplay = true; }

		// Securom detection
		if (document.body.innerHTML.indexOf("SecuROM") > 0) { securom = true; }
		if (document.body.innerHTML.indexOf("SECUROM") > 0) { securom = true; }

		// Tages detection
		if (document.body.innerHTML.indexOf("Tages") > 0) { tages = true; }
		if (document.body.innerHTML.indexOf("Angebote des Tages") > 0) { tages = false; }
		if (document.body.innerHTML.indexOf("TAGES") > 0) { tages = true; }
		if (document.body.innerHTML.indexOf("SOLIDSHIELD") > 0) { tages = true; }		
		if (document.body.innerHTML.indexOf("Solidshield Tages") > 0) { tages = true; }
		if (document.body.innerHTML.indexOf("Tages Solidshield") > 0) { tages = true; }

		// Stardock account detection
		if (document.body.innerHTML.indexOf("Stardock account") > 0) { stardock = true; }

		// Rockstar social club detection
		if (document.body.innerHTML.indexOf("Rockstar Social Club") > 0) { rockstar = true; }
		if (document.body.innerHTML.indexOf("Rockstar Games Social Club") > 0) { rockstar = true; }

		// Kalypso Launcher detection
		if (document.body.innerHTML.indexOf("Requires a Kalypso account") > 0) { kalypso = true; }

		// Detect other DRM
		if (document.body.innerHTML.indexOf("3rd-party DRM") > 0) { otherdrm = true; }
		if (document.body.innerHTML.indexOf("No 3rd Party DRM") > 0) { otherdrm = false; }

		if (gfwl) {
			document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM (Games for Windows Live)</div>');
			otherdrm = false;
		}

		if (uplay) {
			document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM (Ubisoft Uplay)</div>');
			otherdrm = false;
		}

		if (securom) {
			document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM (SecuROM)</div>');
			otherdrm = false;
		}

		if (tages) {
			document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM (Tages)</div>');
			otherdrm = false;
		}

		if (stardock) {
			document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM (Stardock Account Required)</div>');
			otherdrm = false;
		}

		if (rockstar) { 
			document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM (Rockstar Social Club)</div>');
			otherdrm = false;
		}

		if (kalypso) { 
			document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM (Kalypso Launcher)</div>');
			otherdrm = false;
		}

		if (otherdrm) {
			document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">Warning: This title uses 3rd party DRM</div>');
		}
	}
});


// Adds a link to SPUF to the top menu
var supernav_content = document.querySelectorAll("#supernav .supernav_content");
document.querySelectorAll("#supernav .supernav_content")[supernav_content.length - 2].innerHTML = document.querySelectorAll("#supernav .supernav_content")[supernav_content.length - 2].innerHTML.replace(
	'<a class="submenuitem" href="http://steamcommunity.com/workshop/">',
	'<a class="submenuitem" href="http://forums.steampowered.com/forums/" target="_blank">Forums</a><a class="submenuitem" href="http://steamcommunity.com/workshop/">'
);


// Changes Steam Community Groups pages
if (document.URL.indexOf("steamcommunity.com/groups/") >= 0) {
	var groupname = get_groupname(document.URL);
	if (groupname.indexOf("#") > 0) { groupname = groupname.substring(0, groupname.indexOf("#")); }
	
	storage.get(function(settings) {
		if (settings.showgroupevents === undefined) { settings.showgroupevents = true; storage.set({'showgroupevents': settings.showgroupevents}); }		
		if (settings.showgroupevents) {
	
			$('.group_summary').after('<div class="group_content_rule"></div><div class="group_content"><div class="group_content_header"><div class="group_content_header_viewmore"><a href="http://steamcommunity.com/groups/' + groupname + '/events/">VIEW ALL</a></div>Events</div><div id="enhancedsteam_group_events"></div>');
			
			get_http("http://steamcommunity.com/groups/" + groupname + "/events/", function (txt) {
			
				var events_start = txt.indexOf('<!-- events section -->');
				var events_end = txt.indexOf('<!-- /events section -->');				
				var events = txt.substring(events_start, events_end);
				
				// now that we have the information, put it on the page
				document.getElementById('enhancedsteam_group_events').innerHTML = events;
			});
		}
	});	
}


// User profile pages
if (document.URL.indexOf("://steamcommunity.com/id/") >= 0 || document.URL.indexOf("://steamcommunity.com/profiles/") >= 0) {
	// Changes the profile page
	if (document.getElementById("profileBlock")) {
		var steamID = document.getElementsByName("abuseID")[0].value;
		
		storage.get(function(settings) {
			var htmlstr = '<hr>';
			if (settings.profile_steamgifts === undefined) { settings.profile_steamgifts = true; chrome.storage.sync.set({'profile_steamgifts': settings.profile_steamgifts}); }
			if (settings.profile_steamtrades === undefined) { settings.profile_steamtrades = true; chrome.storage.sync.set({'profile_steamtrades': settings.profile_steamtrades}); }
			if (settings.profile_steamrep === undefined) { settings.profile_steamrep = true; chrome.storage.sync.set({'profile_steamrep': settings.profile_steamrep}); }
			if (settings.profile_wastedonsteam === undefined) { settings.profile_wastedonsteam = true; chrome.storage.sync.set({'profile_wastedonsteam': settings.profile_wastedonsteam}); }
			if (settings.profile_sapi === undefined) { settings.profile_sapi = true; chrome.storage.sync.set({'profile_sapi': settings.profile_sapi}); }
			if (settings.profile_backpacktf === undefined) { settings.profile_backpacktf = true; chrome.storage.sync.set({'profile_backpacktf': settings.profile_backpacktf}); }
			if (settings.profile_astats === undefined) { settings.profile_astats = true; chrome.storage.sync.set({'profile_astats': settings.profile_astats}); }
			
			if (settings.profile_steamgifts === true) {	htmlstr += '<div class="actionItemIcon"><a href="http://www.steamgifts.com/user/id/' + steamID + '" target="_blank"><img src="' + chrome.extension.getURL('img/ico/steamgifts.ico') + '" width="16" height="16" border="0" /></a></div><div class="actionItem"><a class="linkActionMinor" href="http://www.steamgifts.com/user/id/' + steamID + '" target="_blank">SteamGifts</a></div>'; }
			if (settings.profile_steamtrades === true) { htmlstr += '<div class="actionItemIcon"><a href="http://www.steamtrades.com/user/id/' + steamID + '" target="_blank"><img src="' + chrome.extension.getURL('img/ico/steamtrades.ico') + '" width="16" height="16" border="0" /></a></div><div class="actionItem"><a class="linkActionMinor" href="http://www.steamtrades.com/user/id/' + steamID + '" target="_blank">SteamTrades</a></div>'; }
			if (settings.profile_steamrep === true) { htmlstr += '<div class="actionItemIcon"><a href="http://steamrep.com/profiles/' + steamID + '" target="_blank"><img src="' + chrome.extension.getURL('img/ico/steamrep.ico') + '" width="16" height="16" border="0" /></a></div><div class="actionItem"><a class="linkActionMinor" href="http://steamrep.com/profiles/' + steamID + '" target="_blank">SteamRep</a></div>'; }
			if (settings.profile_wastedonsteam === true) { htmlstr += '<div class="actionItemIcon"><a href="http://wastedonsteam.com/id/' + steamID + '" target="_blank"><img src="' + chrome.extension.getURL('img/ico/wastedonsteam.ico') + '" width="16" height="16" border="0" /></a></div><div class="actionItem"><a class="linkActionMinor" href="http://wastedonsteam.com/id/' + steamID + '" target="_blank">Wasted On Steam</a></div>'; }
			if (settings.profile_sapi === true) { htmlstr += '<div class="actionItemIcon"><a href="http://sapi.techieanalyst.net/?page=profile&id=' + steamID + '" target="_blank"><img src="' + chrome.extension.getURL('img/ico/sapi.ico') + '" width="16" height="16" border="0" /></a></div><div class="actionItem"><a class="linkActionMinor" href="http://sapi.techieanalyst.net/?page=profile&id=' + steamID + '" target="_blank">sAPI</a></div>'; }
			if (settings.profile_backpacktf === true) { htmlstr += '<div class="actionItemIcon"><a href="http://backpack.tf/profiles/' + steamID + '" target="_blank"><img src="' + chrome.extension.getURL('img/ico/backpacktf.ico') + '" width="16" height="16" border="0" /></a></div><div class="actionItem"><a class="linkActionMinor" href="http://backpack.tf/profiles/' + steamID + '" target="_blank">backpack.tf</a></div>'; }
			if (settings.profile_astats === true) { htmlstr += '<div class="actionItemIcon"><a href="http://www.achievementstats.com/index.php?action=profile&playerId=' + steamID + '" target="_blank"><img src="' + chrome.extension.getURL('img/ico/achievementstats.ico') + '" width="16" height="16" border="0" /></a></div><div class="actionItem"><a class="linkActionMinor" href="http://www.achievementstats.com/index.php?action=profile&playerId=' + steamID + '" target="_blank">Achievement Stats</a></div>'; }
			
			if (htmlstr != '<hr>') { document.getElementById("rightActionBlock").insertAdjacentHTML('beforeend', htmlstr); }
		});
		
	}

	// Changes user's wishlist
	else if (document.URL.indexOf("/wishlist") >= 0) {
		xpath_each("//a[contains(@class,'btn_visit_store')]", function (node) {
			var appid = node.href;
			var appid2 = get_appid(appid + "/");
			
			// get page, find cart string
			get_http(appid + '/', function (txt) {
				var subid = txt.match(/<input type="hidden" name="subid" value="([0-9]+)">/);
				var htmlstring = $(txt).find('form');			
				node.insertAdjacentHTML('beforebegin', '</form>' + htmlstring[1].outerHTML + '<a href="#" onclick="document.forms[\'add_to_cart_' + subid[1] + '\'].submit();" class="btn_visit_store">Add to Cart</a>  ');
			});
		});
	}

	// Changes user's edit page
	else if (document.URL.indexOf("/edit") >= 0) {
		htmlstr = '<div class="tab" id="returnTabOff">';
		htmlstr += '<div class="tabOffL"><img src="http://cdn.steamcommunity.com/public/images/skin_1/greyCornerUpLeftDark.gif" width="2" height="2" border="0"></div>';
		htmlstr += '<div class="tabOff"><a href="http://steamcommunity.com/my/">Return to profile</a></div>';
		htmlstr += '<div class="tabOffR"><img src="http://cdn.steamcommunity.com/public/images/skin_1/greyCornerUpRightDark.gif" width="2" height="2" border="0"></div>';
		htmlstr += '</div>';

		document.getElementById("tabs").insertAdjacentHTML('beforeend', htmlstr);
	}
}


// Changes Steam Greenlight pages
if (document.URL.indexOf("steamcommunity.com/sharedfiles/") >= 0) {	
	// insert the "top bar" found on all other Steam games
	
	storage.get(function(settings) {
		if (settings.showgreenlightbanner === undefined) { settings.showgreenlightbanner = false; storage.set({'showgreenlightbanner': settings.showgreenlightbanner}); }		
		if (settings.showgreenlightbanner) {	
			var banner = document.getElementById('ig_top_workshop');
			var html;
			html = '<link href="' + chrome.extension.getURL("enhancedsteam.css") + '" rel="stylesheet" type="text/css">';
			html = html + '<div id="store_nav_area"><div class="store_nav_bg"><div class="store_nav">';
			html = html + '<a class="tab " href="http://steamcommunity.com/workshop/browse/?appid=765&section=items"><span>Games</a>';
			html = html + '<a class="tab " href="http://steamcommunity.com/workshop/browse/?appid=765&section=software"><span>Software</a>';
			html = html + '<a class="tab " href="http://steamcommunity.com/workshop/browse/?appid=765&section=concepts"><span>Concepts</a>';
			html = html + '<a class="tab " href="http://steamcommunity.com/workshop/browse/?appid=765&section=collections"><span>Collections</a>';
			html = html + '<a class="tab " href="http://steamcommunity.com/workshop/discussions/?appid=765"><span>Discussions</a>';
			html = html + '<a class="tab " href="http://steamcommunity.com/workshop/about/?appid=765&section=faq"><span>About Greenlight</a>';
			html = html + '<a class="tab " href="http://steamcommunity.com/workshop/news/?appid=765"><span>News</a>';
			banner.insertAdjacentHTML('beforebegin', html);
			
			// now hide the greenlight banner	
			if (banner) { banner.hidden = true;	}
		} 
	});
}	

// adds "empty cart" button at checkout
if (document.URL.indexOf("store.steampowered.com/cart/") >= 0) {
	addtext = "<a href='javascript:document.cookie=\"shoppingCartGID=0; path=/\";location.reload();' class='btn_checkout_blue' style='float: left; margin-top: 14px;'><div class='leftcap'></div><div class='rightcap'></div>Empty Cart</a>";

	var loc = 0;	
	xpath_each("//div[contains(@class,'checkout_content')]", function (node) {
		loc = loc + 1;
		if (loc == 2) { node.insertAdjacentHTML('afterbegin', addtext); }
	});
} 

// adds metacritic user reviews
storage.get(function(settings) {
	if (settings.showmcus === undefined) { settings.showmcus = true; storage.set({'showmcus': settings.showmcus}); }	
	if (settings.showmcus) {
		var metahtml = document.getElementById("game_area_metascore");
		var metauserscore = 0;
		if (metahtml) {
			var metalink = document.getElementById("game_area_metalink");
			meta = metalink.getElementsByTagName("a");
			for (var i = 0; i < meta.length; i++)
			var meta_real_link = meta[i].href;
			get_http("http://www.enhancedsteam.com/gamedata/metacritic.php?mcurl=" + meta_real_link, function (txt) {
				metauserscore = txt;
				metauserscore = metauserscore.replace(".","");		
				var newmeta = '<div id="game_area_metascore" style="background-image: url(' + chrome.extension.getURL("img/metacritic_bg.png") + ');">' + metauserscore + '</div>';
				metahtml.insertAdjacentHTML('afterend', newmeta);
			});
		}
	}
});

// adds widescreen certification icons
storage.get(function(settings) {	
	if (settings.showwsgf === undefined) { settings.showwsgf = true; storage.set({'showwsgf': settings.showwsgf}); }	
	if (document.URL.indexOf("store.steampowered.com/app/") >= 0) {	
		if (document.body.innerHTML.indexOf("<p>Requires the base game <a href=") <= 0) { 
			if (settings.showwsgf) {
				// check to see if game data exists
				get_http("http://www.enhancedsteam.com/gamedata/wsgf.php?appid=" + localappid, function (txt) {
					found = 0;
					
					xpath_each("//div[contains(@class,'game_details')]", function (node) {
						if (found == 0) {						
							node.insertAdjacentHTML('afterend', txt);
							found = 1;
						}
					});
				});						
			}
		}	
	}
});	

		
// fixes "Image not found" in wishlist
var items = document.getElementById("wishlist_items");
if (items) {
	imgs = items.getElementsByTagName("img");
	for (var i = 0; i < imgs.length; i++)	
	if (imgs[i].src == "http://media.steampowered.com/steamcommunity/public/images/avatars/33/338200c5d6c4d9bdcf6632642a2aeb591fb8a5c2.gif") {
		var gameurl = imgs[i].parentNode.href;
		imgs[i].src = "http://cdn.steampowered.com/v/gfx/apps/" + gameurl.substring(gameurl.lastIndexOf("/") + 1) + "/header.jpg";
	}
}

// removes "onclick" events which Steam uses to add javascript to it's search functions 
var allElements, thisElement;
allElements = document.evaluate("//a[contains(@onclick, 'SearchLinkClick( this ); return false;')]", document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
for (var i = 0; i < allElements.snapshotLength; i++) {
	thisElement = allElements.snapshotItem(i);
	if (thisElement.nodeName.toUpperCase() == 'A') {
		thisElement.removeAttribute('onclick');
	}
}

// adds a "total spent on Steam" to the account details page
storage.get(function(settings) {	
	if (settings.showtotal === undefined) { settings.showtotal = true; storage.set({'showtotal': settings.showtotal}); }	
	if (settings.showtotal) {
		if ($('.transactionRow').length != 0) {						
			totaler = function (p, i) {				
				if (p.innerHTML.indexOf("class=\"transactionRowEvent\">Wallet Credit</div>") < 0) {
					var regex = /(\d+\.\d\d+)/;
					price = regex.exec($(p).html());
					if (price != null) {
						return parseFloat(price);
					}
				}
			};
				
			prices = jQuery.map($('.transactionRow'),  totaler);
			
			var total = 0.0;
			jQuery.map(prices, function (p, i) {
				total += p
			});
			total = total.toFixed(2);
			
			$('.accountInfoBlock .block_content_inner .accountBalance').after('<div class="accountRow accountBalance accountSpent"></div>');
			$('.accountSpent').append('<div class="accountData price">$' + total + '</div>');
			$('.accountSpent').append('<div class="accountLabel" style="color: #C00; font-weight: bold; font-size: 100%">Total Spent:</div>');
		}
	}
});

// checks content loaded via AJAX
var observer = new WebKitMutationObserver(function(mutations) {
	mutations.forEach(function(mutation) {
		for (var i = 0; i < mutation.addedNodes.length; i++)
			var node = mutation.addedNodes[i];
			if (node) {
				if (node.innerHTML) {
					var appid = node.innerHTML.match(/<a href="http:\/\/store.steampowered.com\/app\/(.+)\//);
					if (appid) {
						add_info(node, appid[1]);
					}	
				}
			}
	});
});
observer.observe(document, { subtree: true, childList: true });
