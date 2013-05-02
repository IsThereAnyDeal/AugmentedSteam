var localized_strings,
localization_promise = (function (){
    var deferred = new $.Deferred();
    localized_strings_default = {
        empty_wishlist: "Empty Wishlist",
        purchase_date: "(Purchased __date__)",
        options: "Options",
        website: "Website",
        contribute: "Contribute (GitHub)",
		store: "Store",
		community: "Community",
		news: "News",
		about: "About",
		donate: "Donate",
        clear_cache: "Clear cached data",
        forums: "Forums",
        coupon_available: "You have a coupon available!",
        coupon_application_note: "A coupon in your inventory will be applied automatically at checkout.",
        coupon_learn_more: "<a href=\"https://support.steampowered.com/kb_article.php?ref=4210-YIPC-0275\">Learn more</a> about Steam Coupons",
        add_to_cart: "Add to Cart",
        check_pricing_history: "Click here to check pricing history.",
        drm_third_party: "Warning: This title uses 3rd party DRM",
        empty_cart: "Empty Cart",
        events_view_all: "VIEW ALL",
        events: "Events",
        dlc_data_header: "Downloadable Content Details",
        tag_owned: "Owned",
        tag_wishlist: "Wishlist",
        tag_coupon: "Coupon",
        tag_inv_gift: "Gift",
        tag_inv_guestpass: "Guestpass",
        tag_friends_want: "<a href=\"http://steamcommunity.com/my/friendsthatplay/__appid__\">__friendcount__ wish for</a>"
    };

    localized_strings = {
        "en": localized_strings_default,
        "ar":       {options: "Bob"},
        "cs":       {},
        "da":       {},
        "de":       {},
        "el":       {},
        "es":       {
			store: "Tienda",
			community: "Comunidad",
			news: "Noticias",
			about: "Sobre",
			donate: "Donar"
		},
        "fi":       {},
        "fr":       {},
        "hu":       {},
        "it":       {},
        "ja":       {},
        "ko":       {},
        "nl":       {
            empty_wishlist: "Verlanglijst leegmaken",
            purchase_date: "(Gekocht op __date__)",
            options: "Opties",
            website: "Website",
            contribute: "Bijdragen (GitHub)",
            clear_cache: "Gecachete data verwijderen",
            forums: "Forums",
            coupon_available: "Je hebt een waardebon beschikbaar!",
            coupon_application_note: "Een coupon in je inventaris wordt automatisch toegepast bij het afrekenen.",
            coupon_learn_more: "<a href=\"https://support.steampowered.com/kb_article.php?ref=4210-YIPC-0275\">Kom meer te weten</a> over Steam-coupons",
            add_to_cart: "Aan winkelwagen toevoegen",
            check_pricing_history: "Klik hier om de prijsgeschiedenis te bekijken.",
            drm_third_party: "Waarschuwing: Dit programma maakt gebruik van DRM van derden",
            empty_cart: "Winkelwagen leegmaken",
            events_view_all: "ALLES BEKIJKEN",
            events: "Evenementen",
            dlc_data_header: "Details over downloadbare inhoud",
            tag_owned: "In je bezit",
            tag_wishlist: "Verlanglijst",
            tag_coupon: "Waardebon",
            tag_inv_gift: "Geschenk",
            tag_inv_guestpass: "Gastenpas",
            tag_friends_want: "<a href=\"http://steamcommunity.com/my/friendsthatplay/__appid__\">__friendcount__ willen dit</a>"
        },
        "no":       {},
        "pl":       {},
        "pt":       {},
        "pt-br":    {},
        "ro":       {},
        "ru":       {},
        "sv":       {},
        "th":       {},
        "tr":       {},
        "zh-hans":  {},
        "zh-hant":  {}
    };

    // Set english defaults.
    $.each(localized_strings, function(lang, strings){
        $.each(localized_strings_default, function(key, val){
            if (!strings[key]) strings[key] = val;
        });
    });
    setTimeout(deferred.resolve, 250); // Delay ever so slightly to make sure all loc is loaded.
    return deferred.promise();
})();