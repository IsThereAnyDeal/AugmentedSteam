var localized_strings,
localization_promise = (function (){
    var deferred = new $.Deferred();
    localized_strings_default = {
        empty_wishlist: "Empty Wishlist",
        purchase_date: "(Purchased __date__)",
        options: "Options",
        website: "Website",
        contribute: "Contribute (GitHub)",
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
        tag_cupon: "Coupon",
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
        "es":       {},
        "fi":       {},
        "fr":       {},
        "hu":       {},
        "it":       {},
        "ja":       {},
        "ko":       {},
        "nl":       {},
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