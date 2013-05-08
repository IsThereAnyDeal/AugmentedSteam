<<<<<<< HEAD
﻿// version 3.0
=======
﻿// version 3.1
var storage = chrome.storage.sync;
var apps;
var language;
storage.get(function (settings) {
	language = settings.language || "en";
});


// Global scope promise storage; to prevent unecessary API requests.
var loading_inventory;
var appid_promises = {};
>>>>>>> origin/dev


//Chrome storage functions.
function setValue(key, value) {
	sessionStorage.setItem(key, JSON.stringify(value));
}

function getValue(key) {
	var v = sessionStorage.getItem(key);
	if (v === undefined) return v;
	return JSON.parse(v);
}

// Helper prototypes

<<<<<<< HEAD
function startWith(str, prefix) {
	return str.lastIndexOf(prefix, 0) === 0;
}
=======
String.prototype.startsWith = function(prefix) {
	return this.indexOf(prefix) === 0;
};

Number.prototype.formatMoney = function(places, symbol, thousand, decimal) {
	//FIXME: Puts symbol on wrong end for rubles and euros.

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
>>>>>>> origin/dev

// DOM helpers
function xpath_each(xpath, callback) {
	//TODO: Replace instances with jQuery selectors.
	var res = document.evaluate(xpath, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	var node;
	for (var i = 0; i < res.snapshotLength; ++i) {
		node = res.snapshotItem(i);
		callback(node);
	}
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

function get_appid(t) {
	if (t && t.match(/(?:store\.steampowered|steamcommunity)\.com\/app\/(\d+)\/?/)) return RegExp.$1;
	else return null;
}

function get_subid(t) {
	if (t && t.match(/(?:store\.steampowered|steamcommunity)\.com\/sub\/(\d+)\/?/)) return RegExp.$1;
	else return null;
}

function get_appid_wishlist(t) {
	if (t && t.match(/game_(\d+)/)) return RegExp.$1;
	else return null;
}

function get_groupname(t) {
	if (t && t.match(/steamcommunity\.com\/groups\/(\S+)/)) return RegExp.$1;
	else return null;
}

function ensure_appid_deferred(appid) {
	if (!appid_promises[appid]) {
		var deferred = new $.Deferred();
		appid_promises[appid] = {
			"resolve": deferred.resolve,
			"promise": deferred.promise()
		};
	}
}

// colors the tile for owned games
function highlight_owned(node) {
	storage.get(function(settings) {
<<<<<<< HEAD
		if (settings.bgcolor === undefined) { settings.bgcolor = "#5c7836";	storage.set({'bgcolor': settings.bgcolor}); }
		if (settings.showowned === undefined) { settings.showowned = true; storage.set({'showowned': settings.showowned}); }
		if (settings.showowned) {
			node.style.backgroundImage = "none";
			node.style.backgroundColor = settings.bgcolor;
		}
=======
		if (settings.highlight_owned_color === undefined) { settings.highlight_owned_color = "#5c7836";	storage.set({'highlight_owned_color': settings.highlight_owned_color}); }
		if (settings.highlight_owned === undefined) { settings.highlight_owned = true; storage.set({'highlight_owned': settings.highlight_owned}); }
		if (settings.highlight_owned) highlight_node(node, settings.highlight_owned_color);

		if (settings.tag_owned === undefined) { settings.tag_owned = false; storage.set({'tag_owned': settings.tag_owned}); }
		if (settings.tag_owned_color === undefined) { settings.tag_owned_color = "#5c7836";	storage.set({'tag_owned_color': settings.tag_owned_color}); }
		if (settings.tag_owned) add_tag(node, localized_strings[language].tag_owned, settings.tag_owned_color);
>>>>>>> origin/dev
	});
}

// colors the tile for wishlist games
function highlight_wishlist(node) {
	storage.get(function(settings) {
<<<<<<< HEAD
		if (settings.wlcolor === undefined) { settings.wlcolor = "#496e93";	storage.set({'wlcolor': settings.wlcolor}); }
		if (settings.showwishlist === undefined) { settings.showwishlist = true; storage.set({'showwishlist': settings.showwishlist}); }
		if (settings.showwishlist) {
			node.style.backgroundImage = "none";
			node.style.backgroundColor = settings.wlcolor;
		}	
=======
		if (settings.highlight_wishlist_color === undefined) { settings.highlight_wishlist_color = "#496e93";	storage.set({'highlight_wishlist_color': settings.highlight_wishlist_color}); }
		if (settings.highlight_wishlist === undefined) { settings.highlight_wishlist = true; storage.set({'highlight_wishlist': settings.highlight_wishlist}); }
		if (settings.highlight_wishlist) highlight_node(node, settings.highlight_wishlist_color);

		if (settings.tag_wishlist_color === undefined) { settings.tag_wishlist_color = "#496e93";	storage.set({'tag_wishlist_color': settings.tag_wishlist_color}); }
		if (settings.tag_wishlist === undefined) { settings.tag_wishlist = false; storage.set({'tag_wishlist': settings.tag_wishlist}); }
		if (settings.tag_wishlist) add_tag(node, localized_strings[language].tag_wishlist, settings.highlight_wishlist_color);
>>>>>>> origin/dev
	});
}

// colors the tile for items with coupons
function highlight_coupon(node) {
	storage.get(function(settings) {
<<<<<<< HEAD
		if (settings.ccolor === undefined) { settings.ccolor = "#6b2269"; storage.set({'ccolor': settings.ccolor}); }
		if (settings.showcoupon === undefined) { settings.showcoupon = true; storage.set({'showcoupon': settings.showcoupon}); }
		if (settings.showcoupon) {
			node.style.backgroundImage = "none";
			node.style.backgroundColor = settings.ccolor;
		}
=======
		if (settings.highlight_coupon_color === undefined) { settings.highlight_coupon_color = "#6b2269"; storage.set({'highlight_coupon_color': settings.highlight_coupon_color}); }
		if (settings.highlight_coupon === undefined) { settings.highlight_coupon = false; storage.set({'highlight_coupon': settings.highlight_coupon}); }
		if (settings.highlight_coupon) highlight_node(node, settings.highlight_coupon_color);

		if (settings.tag_coupon_color === undefined) { settings.tag_coupon_color = "#6b2269"; storage.set({'tag_coupon_color': settings.tag_coupon_color}); }
		if (settings.tag_coupon === undefined) { settings.tag_coupon = true; storage.set({'tag_coupon': settings.tag_coupon}); }
		if (settings.tag_coupon) add_tag(node, localized_strings[language].tag_coupon, settings.highlight_coupon_color);
>>>>>>> origin/dev
	});
}

// colors the tile for items in inventory
function highlight_inv_gift(node) {
	storage.get(function(settings) {
<<<<<<< HEAD
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
=======
		if (settings.highlight_inv_gift_color === undefined) { settings.highlight_inv_gift_color = "#a75124"; storage.set({'highlight_inv_gift_color': settings.highlight_inv_gift_color}); }
		if (settings.highlight_inv_gift === undefined) { settings.highlight_inv_gift = false; storage.set({'highlight_inv_gift': settings.highlight_inv_gift}); }
		if (settings.highlight_inv_gift) highlight_node(node, settings.highlight_inv_gift_color);

		if (settings.tag_inv_gift_color === undefined) { settings.tag_inv_gift_color = "#a75124"; storage.set({'tag_inv_gift_color': settings.tag_inv_gift_color}); }
		if (settings.tag_inv_gift === undefined) { settings.tag_inv_gift = true; storage.set({'tag_inv_gift': settings.tag_inv_gift}); }
		if (settings.tag_inv_gift) add_tag(node, localized_strings[language].tag_inv_gift, settings.highlight_inv_gift_color);
>>>>>>> origin/dev
	});
}
// colors the tile for items in inventory
function highlight_inv_guestpass(node) {
	storage.get(function(settings) {
		if (settings.highlight_inv_guestpass_color === undefined) { settings.highlight_inv_guestpass_color = "#a75124"; storage.set({'highlight_inv_guestpass_color': settings.highlight_inv_guestpass_color}); }
		if (settings.highlight_inv_guestpass === undefined) { settings.highlight_inv_guestpass = false; storage.set({'highlight_inv_guestpass': settings.highlight_inv_guestpass}); }
		if (settings.highlight_inv_guestpass) highlight_node(node, settings.highlight_inv_guestpass_color);

		if (settings.tag_inv_guestpass_color === undefined) { settings.tag_inv_guestpass_color = "#a75124"; storage.set({'tag_inv_guestpass_color': settings.tag_inv_guestpass_color}); }
		if (settings.tag_inv_guestpass === undefined) { settings.tag_inv_guestpass = true; storage.set({'tag_inv_guestpass': settings.tag_inv_guestpass}); }
		if (settings.tag_inv_guestpass) add_tag(node, localized_strings[language].tag_inv_guestpass, settings.highlight_inv_guestpass_color);
	});
}

<<<<<<< HEAD
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
=======
function highlight_friends_want(node, appid) {
	storage.get(function(settings) {
		if (settings.highlight_friends_want === undefined) { settings.highlight_friends_want = false; storage.set({'highlight_friends_want': settings.highlight_friends_want});}
		if (settings.highlight_friends_want_color === undefined) { settings.highlight_friends_want_color = "#7E4060"; storage.set({'highlight_friends_want_color': settings.highlight_friends_want_color});}
		if (settings.highlight_friends_want) highlight_node(node, settings.highlight_friends_want_color);

		if (settings.tag_friends_want === undefined) { settings.tag_friends_want = true; storage.set({'tag_friends_want': settings.tag_friends_want});}
		if (settings.tag_friends_want_color === undefined) { settings.tag_friends_want_color = "#7E4060"; storage.set({'tag_friends_want_color': settings.tag_friends_want_color});}
		if (settings.tag_friends_want) add_tag(
			node,
			localized_strings[language].tag_friends_want.replace("__appid__", appid).replace("__friendcount__", getValue(appid + "friendswant")),
			settings.tag_friends_want_color
		);
	});
>>>>>>> origin/dev
}

function highlight_node(node, color) {
	storage.get(function(settings) {
		var $node = $(node);
		// Carousel item
		if (node.classList.contains("cluster_capsule")) {
			$node = $(node).find(".main_cap_content");
		}
		
		// Genre Carousel items
		if (node.classList.contains("large_cap")) {
			$node = $(node).find(".large_cap_content");
		}
		
		$node.css("backgroundImage", "none");
		$node.css("backgroundColor", color);

<<<<<<< HEAD
// Removes the "Install Steam" button at the top of each page
storage.get(function(settings) {
	if (settings.hideinstallsteambutton === undefined) { settings.hideinstallsteambutton = false; storage.set({'hideinstallsteambutton': settings.hideinstallsteambutton}); }
	if (settings.hideinstallsteambutton) {
		$('div.header_installsteam_btn').replaceWith('');
	}
});
=======
		// Set text colour to not conflict with highlight.
		if (node.classList.contains("tab_row")) $node.find(".tab_desc").css("color", "lightgrey");
		if (node.classList.contains("search_result_row")) $node.find(".search_name").css("color", "lightgrey");
	});
}
>>>>>>> origin/dev

function add_tag (node, string, color) {
	/* To add coloured tags to the end of app names instead of colour
	highlighting; this allows an to be "highlighted" multiple times; e.g.
	inventory and owned. */
	node.tags = node.tags || [];
	var tagItem = [string, color];
	var already_tagged = false;

	// Check its not already tagged.
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
		$tag.css("backgroundColor", tag[1]);
		$tag.css("color", "white");
		$tag.css("float", "right");
		$tag.css("padding", "2px");
		$tag.css("margin-right", "4px");
		$tag.css("margin-bottom", "4px");
		$tag.css("border", "1px solid #262627");
		return $tag;
	};

	// Check for discount percentage; if exists convert into tag.
	var discount_pct =  $(node).find(".discount_pct");
	var discount_as_int;

	if (discount_pct.length > 0) {
		discount_as_int = parseInt(discount_pct.text().match(/(\-[1-9][0-9])%/)[1], 10);
		discount_pct.remove();

		node.tags.splice(0, 0, [discount_as_int + "%", "#4C6B22"]);
	}

	if (node.tags) {

<<<<<<< HEAD
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
=======
		// Make tags.
		$tags = $("<div class=\"tags\"></div>");
		for (var i = 0; i < node.tags.length; i++) {
			var tag = node.tags[i];
			var $tag = new_display_tag(tag[0], tag[1]);
			$tags.append($tag);
		}

		// Gotta apply tags differently per type of node.
		var $tag_root;
		if (node.classList.contains("tab_row")) {
			$tag_root = $(node).find(".tab_desc").removeClass("with_discount");
			remove_existing_tags($tag_root);

			$tag_root.find("h4").after($tags);
		}
		else if (node.classList.contains("search_result_row")) {
			$tag_root = $(node).find(".search_name");
			remove_existing_tags($tag_root);

			$tags.css("display", "inline-block");
			$tags.css("vertical-align", "middle");
			$tags.css("font-size", "small");

			var $p = $tag_root.find("p"),
				$imgs = $p.find("img").remove(),
				$text = $p.text(),
				$new_p = $("<p></p>");

			$p.replaceWith($new_p.append($imgs).append($tags).append($text));

			// Remove margin-bottom, border, and tweak padding on carousel lists.
			$.each($tag_root.find(".tags span"), function (i, obj) {
				$(obj).css("margin-bottom", "0");
				$(obj).css("border", "0");
				$(obj).css("padding", "3px");
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

			$tags.css("display", "table");
			$tags.css("margin-top", "4px");
			$tag_root.find("h4").before($tags);
		}
		else if (node.classList.contains("game_area_dlc_row")) {
			$tag_root = $(node);
			remove_existing_tags($tag_root);

			$tags.css("margin-right", "60px");
			$tag_root.find(".game_area_dlc_price").before($tags);

			// Remove margin-bottom on DLC lists, else horrible pyramidding.
			$.each($tag_root.find(".tags span"), function (i, obj) {
				$(obj).css("margin-bottom", "0");
				$(obj).css("padding", "0 2px");
			});
		}
		else if (node.classList.contains("wishlistRow")) {
			$tag_root = $(node).find(".wishlistRowItem");
			remove_existing_tags($tag_root);

			$tags.css("float", "left");
			$tag_root.find(".bottom_controls").append($tags);
		}
		else if (node.classList.contains("match")) {
			$tag_root = $(node);
			remove_existing_tags($tag_root);

			$tags.css("float", "right");
			$tags.css("width", "130px");
			$tags.css("margin-top", "4px");
			$tag_root.find(".match_price").after($tags);
		}
		else if (node.classList.contains("cluster_capsule")) {
			$tag_root = $(node);
			remove_existing_tags($tag_root);

			$tags.css("display", "inline-block");
			$tags.css("vertical-align", "middle");
			$tags.css("font-size", "small");
			$tag_root.find(".main_cap_platform_area").append($tags);

			// Remove margin-bottom, border, and tweak padding on carousel lists.
			$.each($tag_root.find(".tags span"), function (i, obj) {
				$(obj).css("margin-bottom", "0");
				$(obj).css("border", "0");
				$(obj).css("padding", "3px");
			});
		}
		else if (node.classList.contains("recommendation_highlight")) {
			$tag_root = $(node);
			remove_existing_tags($tag_root);

			$tags.css("float", "left");

			$tag_root.find(".game_purchase_action").before($tags);
			$tag_root.find(".game_purchase_action").before($("<div style=\"clear: right;\"></div>"));
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
			// display inline as text only.
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
>>>>>>> origin/dev
				}
			});
			$tag_root.after($tags);
		}
		else if (node.classList.contains("apphub_HeaderStandardTop")) {
			$tag_root = $(node);
			$tag_root.css("height", "60px"); // Height to accomodate tags.

			remove_existing_tags($tag_root);

<<<<<<< HEAD
// show pricing history
storage.get(function(settings) {	
	if (settings.showlowestprice === undefined) { settings.showlowestprice = true; storage.set({'showlowestprice': settings.showlowestprice}); }	
	if (settings.showlowestprice) {
		if (localappid !== null) {
			var sgsurl = "http://www.steamgamesales.com/app/" + localappid + "/";
			lowest_price = "<div class='game_purchase_area_friends_want' style='padding-top: 15px; height: 30px; border-top: 1px solid #4d4b49; border-left: 1px solid #4d4b49; border-right: 1px solid #4d4b49;' id='enhancedsteam_lowest_price'><div class='gift_icon' style='margin-top: -9px;'><img src='" + chrome.extension.getURL("img/line_chart.png") + "'></div><a href='" + sgsurl + "' target='_blank'>Click here to check pricing history</a>";
			document.getElementById('game_area_purchase').insertAdjacentHTML('afterbegin', lowest_price);			
=======
			$tags.css("float", "left");
			$tags.css("margin-top", "4px");
			$tags.css("margin-left", "4px");

			$tag_root.find(".apphub_AppName").after($tags);
			$tag_root.find(".apphub_AppName").after($("<div style=\"clear: right;\"></div>"));
>>>>>>> origin/dev
		}
		else if (node.classList.contains("apphub_HeaderTop")) {
			$tag_root = $(node);
			$tag_root.css("height", "90px"); // Height to accomodate tags.
			$tag_root.find(".apphub_sectionTabs").css("padding-top", "2px"); // Height to accomodate tags.

			remove_existing_tags($tag_root);

			$tags.css("float", "left");
			$tags.css("margin-top", "4px");
			$tags.css("margin-left", "4px");

			$tag_root.find(".apphub_AppName").after($tags);
			$tag_root.find(".apphub_AppName").after($("<div style=\"clear: right;\"></div>"));
		}
	}
}

function load_inventory() {
	var profileurl = $(".user_avatar")[0].href || $(".user_avatar a")[0].href;
	var gift_deferred = new $.Deferred();
	var coupon_deferred = new $.Deferred();

	var handle_inv_ctx1 = function (txt) {
		if (txt.charAt(0) != "<") {
			
			localStorage.setItem("inventory_1", txt);
			var data = JSON.parse(txt);
			if (data.success) {
				$.each(data.rgDescriptions, function(i, obj) {
					if (obj.actions) {
						var appid = get_appid(obj.actions[0].link);
						setValue(appid + (obj.type === "Gift" ? "gift" : "guestpass"), true);
					}
				});
			}
			gift_deferred.resolve();
		}
	};
	var handle_inv_ctx3 = function (txt) {
		if (txt.charAt(0) != "<") {
			localStorage.setItem("inventory_3", txt);
			var data = JSON.parse(txt);
			if (data.success) {
				$.each(data.rgDescriptions, function(i, obj) {
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
												setValue(app.id + "coupon", true);
												setValue(app.id + "coupon_sub", package_id);
												setValue(app.id + "coupon_imageurl", obj.icon_url);
												setValue(app.id + "coupon_title", obj.name);
												setValue(app.id + "coupon_discount", obj.name.match(/([1-9][0-9])%/)[1]);
												for (var i = 0; i < obj.descriptions.length; i++) {
													if (obj.descriptions[i].value.startsWith("Can't be applied with other discounts.")) {
														setValue(app.id + "coupon_discount_note", obj.descriptions[i].value);
														setValue(app.id + "coupon_discount_doesnt_stack", true);
													}
													else if (obj.descriptions[i].value.startsWith("(Valid")) {
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

	//TODO: Expire delay in options.
	var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
	var last_updated = localStorage.getItem("inventory_time") || expire_time - 1;
	if (last_updated < expire_time || !localStorage.getItem("inventory_1") || !localStorage.getItem("inventory_3")) {
		localStorage.setItem("inventory_time", parseInt(Date.now() / 1000, 10))

		// Context ID 1 is gifts and guest passes
		get_http(profileurl + '/inventory/json/753/1/', handle_inv_ctx1);

		// Context ID 3 is coupons
		get_http(profileurl + '/inventory/json/753/3/', handle_inv_ctx3);
	}
	else {
		// No need to load anything, its all in localStorage.
		handle_inv_ctx1(localStorage.getItem("inventory_1"));
		handle_inv_ctx3(localStorage.getItem("inventory_3"));

		gift_deferred.resolve();
		coupon_deferred.resolve();
	}

	var deferred = new $.Deferred();
	$.when.apply(null, [gift_deferred.promise(), coupon_deferred.promise()]).done(function (){
		deferred.resolve();
	});
	return deferred.promise();
}

function add_empty_wishlist_button() {
	var profile = $(".playerAvatar a")[0].href.replace("http://steamcommunity.com", "");
	if (window.location.pathname.startsWith(profile)) {
		var empty_button = $("<div class='btn_save' style='border-color:red'><a>" + localized_strings[language].empty_wishlist + "</a></div>");
		empty_button.click(empty_wishlist);
		$("#games_list_container").after(empty_button);
	}
}

function empty_wishlist() {
	var conf = confirm("Are you sure you want to empty your wishlist?\n\nThis action cannot be undone!");
	if (conf) {
		var deferreds = $(".wishlistRow").map(function(i, $obj) {
			var deferred = new $.Deferred();
			var appid = get_appid_wishlist($obj.id),
				http = new XMLHttpRequest(),
				profile = $(".returnLink a")[0].href.replace("http://steamcommunity.com/", "");

			http.onreadystatechange = function () {
				if (this.readyState == 4 && this.status == 200) {
					deferred.resolve();
				}
			};
			http.open('POST', "http://steamcommunity.com/" + profile + "/wishlist/", true);
			http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			http.send("action=remove&appid=" + encodeURIComponent(appid));

			return deferred.promise();
		});

		$.when.apply(null, deferreds).done(function(){
			location.reload();
		});
	}
}

function find_purchase_date(appname) {
	get_http('http://store.steampowered.com/account/', function (txt) {
		var apphtml = txt.substring(txt.indexOf('<div class="transactionRowTitle">' + appname), txt.indexOf('<div class="transactionRowTitle">' + appname) - 300);
		var appdate = apphtml.match(/<div class="transactionRowDate">(.+)<\/div>/);
		var found = 0;
		xpath_each("//div[contains(@class,'game_area_already_owned')]", function (node) {
			if (found === 0) {
				if (appdate) {
					node.innerHTML = node.innerHTML + localized_strings[language].purchase_date.replace("__date__", appdate[1]);
					found = 1;
				}
			}
		});
	});
}

// Adds a link to options to the global menu (where is Install Steam button)
function add_enhanced_steam_options() {
	$dropdown = $("<span class=\"pulldown\" id=\"account_pulldown\">Enhanced Steam</span>");
	$dropdown_options_container = $("<div class=\"popup_block\"><div class=\"popup_body popup_menu\"></div></div>");
	$dropdown_options = $dropdown_options_container.find(".popup_body");
	$dropdown_options.css("display", "none");

	$dropdown.click(function(){
		if ($dropdown_options.css("display") === "none") {
			$dropdown_options.css("display", "");
		}
		else {
			$dropdown_options.css("display", "none");
		}
	});

	$options_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"" + chrome.extension.getURL("options.html") + "\">" + localized_strings[language].options + "</a>");
	$website_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"http://www.enhancedsteam.com\">" + localized_strings[language].website + "</a>");
	$contribute_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//github.com/jshackles/Enhanced_Steam\">" + localized_strings[language].contribute + "</a>");
	$donation_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//enhancedsteam.com/donate.php\">" + localized_strings[language].donate + "</a>");

	$clear_cache_link = $("<a class=\"popup_menu_item\" href=\"\">" + localized_strings[language].clear_cache + "</a>");
	$clear_cache_link.click(function(){
		localStorage.clear();
		sessionStorage.clear();
		location.reload();
	});

	$spacer = $("<div class=\"hr\"></div>");

	$dropdown_options.append($options_link);
	$dropdown_options.append($clear_cache_link);
	$dropdown_options.append($spacer);
	$dropdown_options.append($website_link);
	$dropdown_options.append($contribute_link);
	$dropdown_options.append($donation_link);

	$("#global_action_menu")
		.before($dropdown)
		.before($dropdown_options_container);
}

// Removes the "Install Steam" button at the top of each page
function remove_install_steam_button() {
	storage.get(function(settings) {
		if (settings.hideinstallsteambutton === undefined) { settings.hideinstallsteambutton = false; storage.set({'hideinstallsteambutton': settings.hideinstallsteambutton}); }
		if (settings.hideinstallsteambutton) {
			$('div.header_installsteam_btn').replaceWith('');
		}
	});
}

<<<<<<< HEAD
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
=======
// Adds a link to SPUF to the top menu
function add_spuf_link() {
	var supernav_content = document.querySelectorAll("#supernav .supernav_content");
	document.querySelectorAll("#supernav .supernav_content")[supernav_content.length - 2].innerHTML = document.querySelectorAll("#supernav .supernav_content")[supernav_content.length - 2].innerHTML.replace(
		'<a class="submenuitem" href="http://steamcommunity.com/workshop/">',
		'<a class="submenuitem" href="http://forums.steampowered.com/forums/" target="_blank">' + localized_strings[language].forums + '</a><a class="submenuitem" href="http://steamcommunity.com/workshop/">'
	);
}
>>>>>>> origin/dev

// If app has a coupon, display message
function display_coupon_message(appid) {
	// get JSON coupon results
	// debugger;
	$('#game_area_purchase').before($(""+
	"<div class=\"early_access_header\">" +
	"    <div class=\"heading\">" +
	"        <h1 class=\"inset\">" + localized_strings[language].coupon_available + "</h1>" +
	"        <h2 class=\"inset\">" + localized_strings[language].coupon_application_note + "</h2>" +
	"        <p>" + localized_strings[language].coupon_learn_more + "</p>" +
	"    </div>" +
	"    <div class=\"devnotes\">" +
	"        <table border=0>" +
	"            <tr>" +
	"                <td rowspan=3>" +
	"                    <img src=\"http://cdn.steamcommunity.com/economy/image/" + getValue(appid + "coupon_imageurl") + "\"/>" +
	"                </td>" +
	"                <td valign=center>" +
	"                    <h1>" + getValue(appid + "coupon_title") + "</h1>" +
	"                </td>" +
	"            </tr>" +
	"            <tr>" +
	"                <td>" + getValue(appid + "coupon_discount_note") + "</td>" +
	"            </tr>" +
	"            <tr>" +
	"                <td>" +
	"                    <font style=\"color:#A75124;\">" + getValue(appid + "coupon_valid") + "</font>" +
	"                </td>" +
	"            </tr>" +
	"        </table>" +
	"    </div>" +
	"</div>"));

	var $price_div = $("[itemtype=\"http://schema.org/Offer\"]"),
		cart_id = $(document).find("[name=\"subid\"]")[0].value,
		actual_price_container = $price_div.find("[itemprop=\"price\"]")[0].innerText,
		original_price = parseFloat(actual_price_container.match(/([0-9]+(?:(?:\,|\.)[0-9]+)?)/)[1].replace(",", ".")),
		currency_symbol = actual_price_container.match(/(?:R\$|\$|€|£|pуб)/)[0], // Lazy but effective
		comma = (actual_price_container.indexOf(",") > -1);

	var discounted_price = (original_price - (original_price * getValue(appid + "coupon_discount") / 100).toFixed(2)).toFixed(2);

	if (!($price_div.find(".game_purchase_discount").length > 0 && getValue(appid + "coupon_discount_doesnt_stack"))) {
		// If not (existing discounts and coupon does not stack)
		// debugger;

		if (comma) {
			currency_symbol = currency_symbol.replace(".", ",");
			discounted_price = discounted_price.replace(".", ",");
		}

		var original_price_with_symbol,
			discounted_price_with_symbol;

		// Super simple way to put currency symbol on correct end.

		switch (currency_symbol) {
			case "€":
				original_price_with_symbol = original_price + currency_symbol;
				discounted_price_with_symbol = discounted_price + currency_symbol;
				break;

			case "pуб":
				original_price_with_symbol = parseFloat(original_price).toFixed(0) + " " + currency_symbol;
				discounted_price_with_symbol = parseFloat(discounted_price).toFixed(0) + " " + currency_symbol;
				break;

			default:
				original_price_with_symbol = currency_symbol + original_price;
				discounted_price_with_symbol = currency_symbol + discounted_price;
				break;
		}


		$price_div[0].innerHTML = ""+
			"<div class=\"game_purchase_action_bg\">" +
			"    <div class=\"discount_block game_purchase_discount\">" +
			"        <div class=\"discount_pct\">-" + getValue(appid + "coupon_discount") + "%</div>" +
			"        <div class=\"discount_prices\">" +
			"            <div class=\"discount_original_price\">" + original_price_with_symbol + "</div>" +
			"            <div class=\"discount_final_price\" itemprop=\"price\">" + discounted_price_with_symbol + "</div>" +
			"        </div>" +
			"    </div>" +
			"<div class=\"btn_addtocart\">" +
			"    <div class=\"btn_addtocart_left\"></div>" +
			"        <a class=\"btn_addtocart_content\" href=\"javascript:addToCart( " + cart_id + ");\">" + localized_strings[language].add_to_cart + "</a>" +
			"        <div class=\"btn_addtocart_right\"></div>" +
			"    </div>" +
			"</div>";

	}


}

function show_pricing_history(appid, type) {
	storage.get(function(settings) {
		if (settings.showlowestprice === undefined) { settings.showlowestprice = true; storage.set({'showlowestprice': settings.showlowestprice}); }
		if (settings.showlowestprice_region === undefined) { settings.showlowestprice_region = "us"; storage.set({'showlowestprice_region': settings.showlowestprice_region}); }
		if (settings.showlowestprice) {
			get_http("http://www.enhancedsteam.com/gamedata/price.php?search=" + type + "/" + appid + "&region=" + settings.showlowestprice_region, function (txt) {
				document.getElementById('game_area_purchase').insertAdjacentHTML('afterbegin', txt);
			});
		}
	});
}

// Adds red warnings for 3rd party DRM
function drm_warnings() {
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
				document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">' + localized_strings[language].drm_third_party + ' (Games for Windows Live)</div>');
				otherdrm = false;
			}

			if (uplay) {
				document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">' + localized_strings[language].drm_third_party + ' (Ubisoft Uplay)</div>');
				otherdrm = false;
			}

			if (securom) {
				document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">' + localized_strings[language].drm_third_party + ' (SecuROM)</div>');
				otherdrm = false;
			}

			if (tages) {
				document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">' + localized_strings[language].drm_third_party + ' (Tages)</div>');
				otherdrm = false;
			}

			if (stardock) {
				document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">' + localized_strings[language].drm_third_party + ' (Stardock Account Required)</div>');
				otherdrm = false;
			}

			if (rockstar) {
				document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">' + localized_strings[language].drm_third_party + ' (Rockstar Social Club)</div>');
				otherdrm = false;
			}

			if (kalypso) {
				document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">' + localized_strings[language].drm_third_party + ' (Kalypso Launcher)</div>');
				otherdrm = false;
			}

			if (otherdrm) {
				document.getElementById('game_area_purchase').insertAdjacentHTML('beforebegin', '<div class="game_area_already_owned" style="background-image: url( ' + chrome.extension.getURL("img/game_area_warning.png") + ' );">' + localized_strings[language].drm_third_party + '</div>');
			}
		}
	});
}

function add_empty_cart_button() {
	addtext = "<a href='javascript:document.cookie=\"shoppingCartGID=0; path=/\";location.reload();' class='btn_checkout_blue' style='float: left; margin-top: 14px;'><div class='leftcap'></div><div class='rightcap'></div>" + localized_strings[language].empty_cart + "</a>";

	var loc = 0;
	xpath_each("//div[contains(@class,'checkout_content')]", function (node) {
		loc = loc + 1;
		if (loc == 2) { node.insertAdjacentHTML('afterbegin', addtext); }
	});
}

// Changes Steam Community Groups pages
function add_group_events() {
	var groupname = get_groupname(document.URL);
	if (groupname.indexOf("#") > 0) { groupname = groupname.substring(0, groupname.indexOf("#")); }

	storage.get(function(settings) {
<<<<<<< HEAD
		if (settings.showgroupevents === undefined) { settings.showgroupevents = true; storage.set({'showgroupevents': settings.showgroupevents}); }		
		if (settings.showgroupevents) {
	
			$('.group_summary').after('<div class="group_content_rule"></div><div class="group_content"><div class="group_content_header"><div class="group_content_header_viewmore"><a href="http://steamcommunity.com/groups/' + groupname + '/events/">VIEW ALL</a></div>Events</div><div id="enhancedsteam_group_events"></div>');
			
			get_http("http://steamcommunity.com/groups/" + groupname + "/events/", function (txt) {
			
=======
		if (settings.showgroupevents === undefined) { settings.showgroupevents = true; storage.set({'showgroupevents': settings.showgroupevents}); }
		if (settings.showgroupevents) {

			$('.group_summary').after('<div class="group_content_rule"></div><div class="group_content"><div class="group_content_header"><div class="group_content_header_viewmore"><a href="http://steamcommunity.com/groups/' + groupname + '/events/">' + localized_strings[language].events_view_all + '</a></div>' + localized_strings[language].events + '</div><div id="enhancedsteam_group_events"></div>');

			get_http("//steamcommunity.com/groups/" + groupname + "/events/", function (txt) {

>>>>>>> origin/dev
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
function add_community_profile_links() {
	// Changes the profile page
<<<<<<< HEAD
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
=======
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
function add_cart_on_wishlist() {
	xpath_each("//a[contains(@class,'btn_visit_store')]", function (node) {
		var app = node.href;

		// get page, find cart string
		get_http(app, function (txt) {
			var subid = txt.match(/<input type="hidden" name="subid" value="([0-9]+)">/);
			if (subid) {
				// subid is undefined for games not yet available for purchase.
				var htmlstring = $(txt).find('form[name="add_to_cart_' + subid[1] + '"]')[0];
				node.insertAdjacentHTML('beforebegin', '</form>' + htmlstring.outerHTML + '<a href="#" onclick="document.forms[\'add_to_cart_' + subid[1] + '\'].submit();" class="btn_visit_store">' + localized_strings[language].add_to_cart + '</a>  ');
			}
>>>>>>> origin/dev
		});
	});
}

// Changes user's edit page
function add_return_to_profile_tab() {
	htmlstr = '<div class="tab" id="returnTabOff">';
	htmlstr += '<div class="tabOffL"><img src="http://cdn.steamcommunity.com/public/images/skin_1/greyCornerUpLeftDark.gif" width="2" height="2" border="0"></div>';
	htmlstr += '<div class="tabOff"><a href="http://steamcommunity.com/my/">Return to profile</a></div>';
	htmlstr += '<div class="tabOffR"><img src="http://cdn.steamcommunity.com/public/images/skin_1/greyCornerUpRightDark.gif" width="2" height="2" border="0"></div>';
	htmlstr += '</div>';

	document.getElementById("tabs").insertAdjacentHTML('beforeend', htmlstr);
}


// Changes Steam Greenlight pages
function hide_greenlight_banner() {
	// insert the "top bar" found on all other Steam games

	storage.get(function(settings) {
<<<<<<< HEAD
		if (settings.showgreenlightbanner === undefined) { settings.showgreenlightbanner = false; storage.set({'showgreenlightbanner': settings.showgreenlightbanner}); }		
		if (settings.showgreenlightbanner) {	
=======
		if (settings.showgreenlightbanner === undefined) { settings.showgreenlightbanner = false; storage.set({'showgreenlightbanner': settings.showgreenlightbanner}); }
		if (settings.showgreenlightbanner) {
>>>>>>> origin/dev
			var banner = document.getElementById('ig_top_workshop');
			var html;
			html = '<link href="' + chrome.extension.getURL("css/enhancedsteam.css") + '" rel="stylesheet" type="text/css">';
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

<<<<<<< HEAD
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
=======
function add_metracritic_userscore() {
	// adds metacritic user reviews
	storage.get(function(settings) {
		if (settings.showmcus === undefined) { settings.showmcus = true; storage.set({'showmcus': settings.showmcus}); }
		if (settings.showmcus) {
			var metahtml = document.getElementById("game_area_metascore");
			var metauserscore = 0;
			if (metahtml) {
				var metalink = document.getElementById("game_area_metalink");
				meta = metalink.getElementsByTagName("a");
				for (var i = 0; i < meta.length; i++) {
					var meta_real_link = meta[i].href;
					get_http("http://www.enhancedsteam.com/gamedata/metacritic.php?mcurl=" + meta_real_link, function (txt) {
						metauserscore = txt;
						metauserscore = metauserscore.replace(".","");
						var newmeta = '<div id="game_area_metascore" style="background-image: url(' + chrome.extension.getURL("img/metacritic_bg.png") + ');">' + metauserscore + '</div>';
						metahtml.insertAdjacentHTML('afterend', newmeta);
					});
				}
			}
>>>>>>> origin/dev
		}
	});
}

function add_widescreen_certification() {
	//FIXME: Constantly returns nothing?

<<<<<<< HEAD
// adds widescreen certification icons
storage.get(function(settings) {	
	if (settings.showwsgf === undefined) { settings.showwsgf = true; storage.set({'showwsgf': settings.showwsgf}); }	
	if (document.URL.indexOf("store.steampowered.com/app/") >= 0) {	
		if (document.body.innerHTML.indexOf("<p>Requires the base game <a href=") <= 0) { 
=======
	// adds widescreen certification icons
	var appid = get_appid(window.location.host + window.location.pathname);
	storage.get(function(settings) {
		if (settings.showwsgf === undefined) { settings.showwsgf = true; storage.set({'showwsgf': settings.showwsgf}); }
		if (document.body.innerHTML.indexOf("<p>Requires the base game <a href=") <= 0) {
>>>>>>> origin/dev
			if (settings.showwsgf) {
				// check to see if game data exists
				get_http("http://www.enhancedsteam.com/gamedata/wsgf.php?appid=" + appid, function (txt) {
					found = 0;

					xpath_each("//div[contains(@class,'game_details')]", function (node) {
						if (found === 0) {
							node.insertAdjacentHTML('afterend', txt);
							found = 1;
						}
					});
				});
			}
		}
	});
}


function fix_wishlist_image_not_found() {
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
}

function account_total_spent() {
	// adds a "total spent on Steam" to the account details page
	storage.get(function(settings) {
		if (settings.showtotal === undefined) { settings.showtotal = true; storage.set({'showtotal': settings.showtotal}); }
		if (settings.showtotal) {
			if ($('.transactionRow').length !== 0) {
				var currency_symbol;
				totaler = function (p, i) {
					if (p.innerHTML.indexOf("class=\"transactionRowEvent\">Wallet Credit</div>") < 0) {
						var priceContainer = $(p).find(".transactionRowPrice");
						if (priceContainer.length > 0) {
							var priceText = $(priceContainer).text();
							var regex = /(\d+\.\d\d+)/,
								price = regex.exec(priceText);
							// debugger;

							if (price !== null && price !== "Total") {
								currency_symbol = priceText.match(/(?:R\$|\$|€|£|pуб)/)[0]; // Lazy but effective
								return parseFloat(price);
							}
						}
					}
				};

				prices = jQuery.map($('.transactionRow'),  totaler);

				var total = 0.0;
				jQuery.map(prices, function (p, i) {
					total += p;
				});

				if (currency_symbol) {
					switch (currency_symbol) {
						case "€":
							total_with_symbol = parseFloat(total).toFixed(2) + currency_symbol;
							break;

						case "pуб":
							total_with_symbol = parseFloat(total).toFixed(0) + " " + currency_symbol;
							break;

						default:
							total_with_symbol = currency_symbol + parseFloat(total).toFixed(2);
							break;
					}

					$('.accountInfoBlock .block_content_inner .accountBalance').after('<div class="accountRow accountBalance accountSpent"></div>');
					$('.accountSpent').append('<div class="accountData price">' + total_with_symbol + '</div>');
					$('.accountSpent').append('<div class="accountLabel" style="color: #C00; font-weight: bold; font-size: 100%">Total Spent:</div>');
				}
			}
		}
	});
}

function subscription_savings_check() {
	var not_owned_games_prices = 0,
		appid_info_deferreds = [],
		sub_apps = [],
		sub_app_prices = {},
		comma,
		currency_symbol;

	// For each app, load its info.
	$.each($(".tab_row"), function (i, node) {
		var appid = get_appid(node.querySelector("a").href),
			// Remove children, leaving only text (price or only discounted price, if there are discounts)
			price_container = $(node).find(".tab_price").children().remove().end().text().trim();

		if (price_container !== "N/A")
		{
			itemPrice = parseFloat(price_container.match(/([0-9]+(?:(?:\,|\.)[0-9]+)?)/)[1].replace(",", "."));
			if (!currency_symbol) currency_symbol = price_container.match(/(?:R\$|\$|€|£|pуб)/)[0];
			if (!comma) comma = (price_container.indexOf(",") > -1);
		}
		else {
			itemPrice = 0;
		}

		// Batch app ids, checking for existing promises, then do this.
		ensure_appid_deferred(appid);

		appid_info_deferreds.push(appid_promises[appid].promise);

		sub_apps.push(appid);
		sub_app_prices[appid] = itemPrice;

	});

	// When we have all the app info
	$.when.apply(null, appid_info_deferreds).done(function() {
		for (var i = 0; i < sub_apps.length; i++) {
			if (!getValue(sub_apps[i] + "owned")) not_owned_games_prices += sub_app_prices[sub_apps[i]];
		}
		var $bundle_price = $(".discount_final_price");
		if ($bundle_price.length === 0) $bundle_price = $(".game_purchase_price");

		var bundle_price = Number(($bundle_price[0].innerText).replace(/[^0-9\.]+/g,""));

		var corrected_price = not_owned_games_prices - bundle_price;

		var $message = $('<div class="savings">' + (comma ? corrected_price / 100 : corrected_price).formatMoney(2, currency_symbol, ",", comma ? "," : ".") + '</div>');
		if (corrected_price < 0) $message[0].style.color = "red";

		$('.savings').replaceWith($message);

	});
}

function dlc_data_from_site(appid) {
	// pull DLC gamedata from enhancedsteam.com
	if (document.body.innerHTML.indexOf("<p>Requires the base game <a href=") > 0) {
		get_http("http://www.enhancedsteam.com/gamedata/gamedata.php?appid=" + appid, function (txt) {
			var block = "<div class='block'><div class='block_header'><h4>" + localized_strings[language].dlc_data_header + "</h4></div><div class='block_content'><div class='block_content_inner'>" + txt + "</div></div></div>";

			var dlc_categories = document.getElementById('demo_block');
			dlc_categories.insertAdjacentHTML('afterend', block);
		});
	}
}

<<<<<<< HEAD
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
=======
function check_if_purchased() {
	// find the date a game was purchased if owned
	var ownedNode = $(".game_area_already_owned");

	if (ownedNode.length > 0) {
		var appname = $(".apphub_AppName")[0].innerText;
		find_purchase_date(appname);
	}
}

function bind_ajax_content_highlighting() {
	// checks content loaded via AJAX
	var observer = new WebKitMutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			for (var i = 0; i < mutation.addedNodes.length; i++) {
				var node = mutation.addedNodes[i];
				// Check the node is what we want, and not some unrelated DOM change.
				if (node.classList && node.classList.contains("tab_row")) start_highlights_and_tags();
			}
		});
	});
	observer.observe(document, { subtree: true, childList: true });

	$("#search_results").bind("DOMSubtreeModified", start_highlights_and_tags);
	$("#search_suggestion_contents").bind("DOMSubtreeModified", start_highlights_and_tags);
	$("#blotter_content").bind("DOMNodeInserted", start_friend_activity_highlights);
}


function start_highlights_and_tags(){
	/* Batches all the document.ready appid lookups into one storefront call. */

	var selectors = [
			"div.tab_row",			// Storefront rows
			"div.dailydeal",		// Christmas deals; https://www.youtube.com/watch?feature=player_detailpage&v=2gGopKNPqVk#t=52s
			"div.wishlistRow",		// Wishlist row
			"a.game_area_dlc_row",	// DLC on app pages
			"a.small_cap",			// Featured storefront items, and "recommended" section on app pages.
			"a.search_result_row",	// Search result row.
			"a.match",				// Search suggestions row.
			"a.cluster_capsule",	// Carousel items.
			"div.recommendation_highlight",	// Recommendation page.
			"div.recommendation_carousel_item",	// Recommendation page.
			"div.friendplaytime_game"	// Recommendation page.
		];

	// Get all appids and nodes from selectors.
	$.each(selectors, function (i, selector) {
		$.each($(selector), function(j, node){
			var appid = get_appid(node.href || $(node).find("a")[0].href) || get_appid_wishlist(node.id);
			if (appid) {
				on_app_info(appid, function(){
					highlight_app(appid, node);
				});
			}
		});
	});
}

function add_steamdb_links(appid, type) {
	storage.get(function(settings) {
		if (settings.showsteamdb === undefined) { settings.showsteamdb = true; storage.set({'showsteamdb': settings.showsteamdb}); }
		if (settings.showsteamdb) {
			switch (type) {
				case "gamehub":
					$(".apphub_OtherSiteInfo").append('<a href="http://steamdb.info/app/' + appid + '/" class="btn_darkblue_white_innerfade btn_medium" target="_blank"><span>Steam Database</span>');
					break;
				case "gamegroup":
					$('#rightActionBlock' ).append('<div class="actionItemIcon"><img src="' + chrome.extension.getURL("img/steamdb.png") + '" width="16" height="16" alt=""></div><a class="linkActionMinor" target="_blank" href="http://steamdb.info/app/' + appid + '/">' + localized_strings[language].view_in + ' Steam Database</a>');
					break;
				case "app":
					$('#demo_block').find('.block_content_inner').find('.share').before('<div class="demo_area_button"><a class="game_area_wishlist_btn" target="_blank" href="http://steamdb.info/app/' + appid + '/" style="background-image:url(' + chrome.extension.getURL("img/steamdb_store.png") + ')">' + localized_strings[language].view_in + ' Steam Database</a></div>');
					break;
				case "sub":	
					$(".share").before('<a class="game_area_wishlist_btn" target="_blank" href="http://steamdb.info/sub/' + appid + '/" style="background-image:url(' + chrome.extension.getURL("img/steamdb_store.png") + ')">' + localized_strings[language].view_in + ' Steam Database</a>');
					break;
			}
		}
	});
}

function get_app_details(appids) {
	// Make sure we have inventory loaded beforehand so we have gift/guestpass/coupon info.
	if (!loading_inventory) loading_inventory = load_inventory();
	loading_inventory.done(function() {

		// Batch request for appids - all untracked or cache-expired apps.
		// Handle new data highlighting as it loads.

		if (!(appids instanceof Array)) appids = [appids];
		get_http('//store.steampowered.com/api/appuserdetails/?appids=' + appids.join(","), function (data) {
			var storefront_data = JSON.parse(data);
			$.each(storefront_data, function(appid, app_data){
				if (app_data.success) {
					setValue(appid + "wishlisted", (app_data.data.added_to_wishlist === true));
					setValue(appid + "owned", (app_data.data.is_owned === true));

					if (app_data.data.friendswant) setValue(appid + "friendswant", app_data.data.friendswant.length);
>>>>>>> origin/dev
				}
				// Time updated, for caching.
				setValue(appid, parseInt(Date.now() / 1000, 10));

				// Resolve promise, to run any functions waiting for this apps info.
				appid_promises[appid].resolve();
			});
		});
	});
}

function highlight_app(appid, node) {
	// Order here is important; bottom-most renders last.
	// TODO: Make option

	// Don't highlight "Omg you're on my wishlist!" on users wishlist.
	if (!(node.classList.contains("wishlistRow") || node.classList.contains("wishlistRowItem"))) {
		if (getValue(appid + "wishlisted")) highlight_wishlist(node);
	}

	if (getValue(appid + "owned")) highlight_owned(node);
	if (getValue(appid + "gift")) highlight_inv_gift(node);
	if (getValue(appid + "guestpass")) highlight_inv_guestpass(node);
	if (getValue(appid + "coupon")) highlight_coupon(node);
	if (getValue(appid + "friendswant")) highlight_friends_want(node, appid);
}

function fix_community_hub_links() {
	element = document.querySelector( '.apphub_OtherSiteInfo a' );
			
	if( element && element.href.charAt( 26 ) === '/' ) {
		element.href = element.href.replace( /\/\/app\//, '/app/' ) + '/';
	}
}

function add_carousel_descriptions() {
	storage.get(function(settings) {
		if (settings.show_carousel_descriptions === undefined) { settings.show_carousel_descriptions = true; storage.set({'show_carousel_descriptions': settings.show_carousel_descriptions}); }
		if (settings.show_carousel_descriptions) {
			// Map appids for batched API lookup
			var capsule_appids = $.map($(".cluster_capsule"), function(obj){return get_appid(obj.href);});

			get_http("//store.steampowered.com/api/appdetails/?appids=" + capsule_appids.join(","), function(txt) {
				// Add description_height_to_add px to the container for carousel items to display adequately.
				var description_height_to_add = 62;  // 60 is good for 4 lines; most strings are 2 or 3 lines than this.
				$(".main_cluster_content").css("height", parseInt($(".main_cluster_content").css("height").replace("px", ""), 10) + description_height_to_add + "px");

				var data = JSON.parse(txt);

				$.each($(".cluster_capsule"), function(i, _obj) {
					var appid = get_appid(_obj.href),
						$desc = $(_obj).find(".main_cap_content"),
						$desc_content = $("<p></p>");

						if (data[appid].success) {
							// Add description_height_to_add px to each description to display it adequately.
							$desc.css("height", parseInt($desc.css("height").replace("px", ""), 10) + description_height_to_add + "px");
							$desc.parent().css("height", parseInt($desc.parent().css("height").replace("px", ""), 10) + description_height_to_add + "px");

							var raw_string = $(data[appid].data.about_the_game).text();  // jQuery into DOM then get only text; no html pls.

							// Split the string into sentences (we only want the first two).
							// Replace delimiters with themselves and a unique string to split upon, because we want to include the delimiter once split.
							raw_string = raw_string.replace(/([\.\!\?])/g, "$1 Wow_so_unique");
							var string_sentences = raw_string.split("Wow_so_unique"),
								display_string;

							if (string_sentences.length >= 2) {
								display_string = string_sentences[0] + string_sentences[1];
							}
							else {
								// If theres not two sentences, just use the whole thing.
								display_string = raw_string;
							}

							// We're cropping about_the_game to 2 sentences for
							// now; I've asked for game_description_snippet to
							// be added to appdetails API so this may not be
							// necessary in the future.
							$desc_content.html(display_string);

							$desc.append($desc_content);
						}
				});
			});
		}
	});
}

function add_small_cap_height() {
	// Add height for another line for tags;
	var height_to_add = 20,
		$small_cap_pager = $(".small_cap_pager"),
		$small_cap = $(".small_cap");

	if ($small_cap.length > 0) {
		if (/^\/$/.test(window.location.pathname)) {
			// $small_cap_pager and $small_cap_page are exclusive to frontpage, so let's not run them anywhere else.
			$.each($small_cap_pager, function(i, obj) {
				// Go though and check if they are one or two row pagers.
				var $obj = $(obj),
					rows = obj.classList.contains("onerow") ? 1 : 2,
					$small_cap_page = $obj.find(".small_cap_page");

				// Don't do anything to the video small_cap
				if (!obj.classList.contains("onerowvideo")) {
					$obj.css("height", parseInt($obj.css("height").replace("px", ""), 10) + (height_to_add * rows) + "px");
					$small_cap_page.css("height", parseInt($small_cap_page.css("height").replace("px", ""), 10) + (height_to_add * rows) + "px");
				}
			});
		}

		$small_cap.css("height", parseInt($small_cap.css("height").replace("px", ""), 10) + height_to_add + "px");
	}
<<<<<<< HEAD
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
=======
}

function start_friend_activity_highlights() {
	$.each($(".blotter_author_block a"), function (i, node) {
		var appid = get_appid(node.href);
		if (appid && !node.classList.contains("blotter_userstats_game")) {
			$(node).addClass("inline_tags");

			on_app_info(appid, function(){
				highlight_app(appid, node);
			});
		}
	});
}

function add_app_page_highlights() {
	var appid = get_appid(window.location.host + window.location.pathname);

	if (window.location.host == "store.steampowered.com") node = $(".apphub_HeaderStandardTop")[0];
	if (window.location.host == "steamcommunity.com") node = $(".apphub_HeaderTop")[0];

	on_app_info(appid, function(){
		highlight_app(appid, node);
	});
}

function on_app_info(appid, cb) {
	ensure_appid_deferred(appid);

	var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
	var last_updated = localStorage.getItem(appid) || expire_time - 1;

	// If we have no data on appid, or the data has expired; add it to appids to fetch new data.
	if (last_updated < expire_time) {
		get_app_details(appid);
	}
	else {
		appid_promises[appid].resolve();
	}

	// Bind highlighting.
	appid_promises[appid].promise.done(cb);
}


$(document).ready(function(){
	localization_promise.done(function(){
		// Don't interfere with Storefront API requests
		if (window.location.pathname.startsWith("/api")) return;
		// On window load...
		add_enhanced_steam_options();
		remove_install_steam_button();
		add_spuf_link();

	/* To test:
		Coupon behavour with already discounted game.

	TODO:
		Highlgihts on http://store.steampowered.com/recommended/

	*/
		switch (window.location.host) {
			case "store.steampowered.com":
				// Load data from inv before anything else.
				switch (true) {
					case /^\/cart\/.*/.test(window.location.pathname):
						add_empty_cart_button();
						break;

					case /^\/app\/.*/.test(window.location.pathname):
						var appid = get_appid(window.location.host + window.location.pathname);
						load_inventory().done(function() {
							if (getValue(appid+"coupon")) display_coupon_message(appid);
						});
						show_pricing_history(appid, "app");
						dlc_data_from_site(appid);

						drm_warnings();
						add_metracritic_userscore();
						check_if_purchased();

						fix_community_hub_links();
						add_widescreen_certification();
						add_app_page_highlights();
						add_steamdb_links(appid, "app");
						break;

					case /^\/sub\/.*/.test(window.location.pathname):
						var subid = get_subid(window.location.host + window.location.pathname);
						drm_warnings();
						subscription_savings_check();
						show_pricing_history(subid, "sub");
						add_steamdb_links(subid, "sub");
						break;

					case /^\/account\/.*/.test(window.location.pathname):
						account_total_spent();
						break;

					// Storefront-front only
					case /^\/$/.test(window.location.pathname):
						add_carousel_descriptions();
						break;
				}

				/* Highlights & data fetching */
				start_highlights_and_tags();

				// Storefront homepage tabs.
				bind_ajax_content_highlighting();

				add_small_cap_height();

				break;

			case "steamcommunity.com":

				switch (true) {
					case /^\/groups\/.*/.test(window.location.pathname):
						add_group_events();
						break;

					case /^\/(?:id|profiles)\/.+\/wishlist/.test(window.location.pathname):
						add_cart_on_wishlist();
						fix_wishlist_image_not_found();
						add_empty_wishlist_button();

						// wishlist highlights
						start_highlights_and_tags();
						break;

					case /^\/(?:id|profiles)\/.+\/home/.test(window.location.pathname):
						start_friend_activity_highlights();
						bind_ajax_content_highlighting();
						break;

					case /^\/(?:id|profiles)\/.+\/edit/.test(window.location.pathname):
						add_return_to_profile_tab();
						break;

					case /^\/(?:id|profiles)\/[^\/]+\/?$/.test(window.location.pathname):
						add_community_profile_links();
						break;

					case /^\/sharedfiles\/.*/.test(window.location.pathname):
						hide_greenlight_banner();
						break;

					case /^\/app\/.*/.test(window.location.pathname):
						var appid = get_appid(window.location.host + window.location.pathname);
						add_app_page_highlights();
						add_steamdb_links(appid, "gamehub");
						break;
						
					case /^\/games\/.*/.test(window.location.pathname):
						var appid = document.querySelector( 'a[href*="http://steamcommunity.com/app/"]' );
						appid = appid.href.match( /(\d)+/g );
						add_steamdb_links(appid, "gamegroup");
						break;
				}
				break;
		}
	});
});
>>>>>>> origin/dev
