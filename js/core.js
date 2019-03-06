class GameId {
    static parseId(id) {
        if (!id) { return null; }
        
        let intId = parseInt(id);
        if (!intId) { return null; }
        
        return intId;
    }
    
    static getAppid(text) {
        if (!text) { return null; }
        
        // app, market/listing
        let m = text.match(/(?:store\.steampowered|steamcommunity)\.com\/(app|market\/listings)\/(\d+)\/?/);
        return m && GameId.parseId(m[2]);
    }
    
    static getSubid(text) {
        if (!text) { return null; }
        
        let m = text.match(/(?:store\.steampowered|steamcommunity)\.com\/(sub|bundle)\/(\d+)\/?/);
        return m && GameId.parseId(m[2]);
    }
    
    static getAppidImgSrc(text) {
        if (!text) { return null; }
        let m = text.match(/(steamcdn-a\.akamaihd\.net\/steam|steamcommunity\/public\/images)\/apps\/(\d+)\//);
        return m && GameId.parseId(m[2]);
    }
    
    static getAppids(text) {
        let regex = /(?:store\.steampowered|steamcommunity)\.com\/app\/(\d+)\/?/g;
        let res = [];
        let m;
        while ((m = regex.exec(text)) != null) {
            let id = GameId.parseId(m[1]);
            if (id) {
                res.push(id);
            }
        }
        return res;
    }
    
    static getAppidWishlist(text) {
        if (!text) { return null; }
        let m = text.match(/game_(\d+)/);
        return m && GameId.parseId(m[1]);
    }
    
    static getAppidFromGameCard(text) {
        if (!text) { return null; }
        let m = text.match(/\/gamecards\/(\d+)/);
        return m && GameId.parseId(m[1]);
    }
}


class LocalStorage {
    static get(key, defaultValue) {
        let item = localStorage.getItem(key);
        if (!item) return defaultValue;
        try {
            return JSON.parse(item);
        } catch (err) {
            return defaultValue;
        }
    }
    
    static set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
    
    static remove(key) {
        localStorage.removeItem(key);
    }
    
    static keys() {
        let result = [];
        for (let i = localStorage.length - 1; i >= 0; --i) {
            result.push(localStorage.key(i));
        }
        return result;
    }
    
    static clear() {
        localStorage.clear();
    }
}


class SyncedStorage {
    // static adapter = chrome.storage.sync || chrome.storage.local;
    // static cache = {};

    /**
     * chrome.storage.sync limits
     * QUOTA_BYTES = 102400 // 100KB
     * QUOTA_BYTES_PER_ITEM = 8192 // 8KB
     * MAX_ITEMS = 512
     * MAX_WRITE_OPERATIONS_PER_HOUR = 1800
     * MAX_WRITE_OPERATIONS_PER_MINUTE = 120
     */
    static get(key) {
        if (typeof this.cache[key] == 'undefined') {
            return this.defaults[key];
        }
        return this.cache[key];
    }

    static set(key, value) {
        this.cache[key] = value;
        this.adapter.set({ [key]: value, });
    }

    static remove(key) {
        if (typeof this.cache[key]) {
            delete this.cache[key];
        }
        this.adapter.remove(key);
    }

    static clear() {
        this.cache = {};
        this.adapter.clear();
    }

    // load whole storage and make local copy
    static async load() {
        let that = this;
        function onChange(changes, namespace) {
            let that = SyncedStorage;
            for (let [key, val] of Object.entries(changes)) {
                that.cache[key] = val;
            }
        }
        chrome.storage.onChanged.addListener(onChange);
        let storage = await new Promise((resolve, reject) => that.adapter.get(null, result => resolve(result)));
        Object.assign(that.cache, storage);
        return that.cache;
    }
}
SyncedStorage.adapter = chrome.storage.sync || chrome.storage.local;
SyncedStorage.cache = {};
SyncedStorage.defaults = {
    'language': "english",
    'highlight_owned_color': "#598400",
    'highlight_wishlist_color': "#1483ad",
    'highlight_coupon_color': "#a26426",
    'highlight_inv_gift_color': "#800040",
    'highlight_inv_guestpass_color': "#513c73",
    'highlight_notinterested_color': "#4f4f4f",

    'tag_owned_color': "#5c7836",
    'tag_wishlist_color': "#0d80bd",
    'tag_coupon_color': "#c27120",
    'tag_inv_gift_color': "#b10059",
    'tag_inv_guestpass_color': "#65449a",
    'tag_notinterested_color': "#4f4f4f",

    'highlight_owned': true,
    'highlight_wishlist': true,
    'highlight_coupon': false,
    'highlight_inv_gift': false,
    'highlight_inv_guestpass': false,
    'highlight_notinterested': false,
    'highlight_excludef2p': false,
    'highlight_notdiscounted': false,

    'tag_owned': false,
    'tag_wishlist': false,
    'tag_coupon': false,
    'tag_inv_gift': false,
    'tag_inv_guestpass': false,
    'tag_notinterested': true,
    'tag_short': false,

    'hide_owned': false,
    'hide_ignored': false,
    'hide_dlcunownedgames': false,
    'hide_wishlist': false,
    'hide_cart': false,
    'hide_notdiscounted': false,
    'hide_mixed': false,
    'hide_negative': false,
    'hide_priceabove': false,
    'priceabove_value': "",
    'hidetmsymbols': false,

    'showlowestprice': true,
    'showlowestprice_onwishlist': true,
    'showlowestpricecoupon': true,
    'showallstores': true,
    'stores': [],
    'override_price': "auto",
    'showregionalprice': "mouse",
    'regional_countries': ["us", "gb", "eu1", "ru", "br", "au", "jp"],

    'show_featuredrecommended': true,
    'show_specialoffers': true,
    'show_trendingamongfriends': true,
    'show_browsesteam': true,
    'show_curators': true,
    'show_morecuratorrecommendations': true,
    'show_recentlyupdated': true,
    'show_fromdevelopersandpublishersthatyouknow': true,
    'show_popularvrgames': true,
    'show_gamesstreamingnow': true,
    'show_under': true,
    'show_updatesandoffers': true,
    'show_es_discoveryqueue': true,
    'show_es_homepagetabs': true,
    'show_es_homepagesidebar': true,
    'showmarkettotal': false,
    'showsteamrepapi': true,
    'showmcus': true,
    'showoc': true,
    'showhltb': true,
    'showpcgw': true,
    'showclient': true,
    'showsteamcardexchange': false,
    'showitadlinks': true,
    'showsteamdb': true,
    'showastatslink': true,
    'showwsgf': true,
    'exfgls': true,
    'show_apppage_reviews': true,
    'show_apppage_about': true,
    'show_apppage_surveys': true,
    'show_apppage_sysreq': true,
    'show_apppage_legal': true,
    'show_apppage_morelikethis': true,
    'show_apppage_recommendedbycurators': true,
    'show_apppage_customerreviews': true,
    'show_keylol_links': false,
    'show_package_info': false,
    'show_sysreqcheck': false,
    'show_steamchart_info': true,
    'show_steamspy_info': true,
    'show_early_access': true,
    'show_alternative_linux_icon': false,
    'show_itad_button': false,
    'skip_got_steam': false,

    'hideinstallsteambutton': false,
    'hideaboutmenu': false,
    'keepssachecked': false,
    'showemptywishlist': true,
    'wishlist_notes': {},
    'version_show': true,
    'replaceaccountname': true,
    'showfakeccwarning': true,
    'showlanguagewarning': true,
    'showlanguagewarninglanguage': "English",
    'homepage_tab_selection': "remember",
    'send_age_info': true,
    'html5video': true,
    'contscroll': true,
    'showdrm': true,
    'regional_hideworld': false,
    'showinvnav': true,
    'showesbg': true,
    'quickinv': true,
    'quickinv_diff': -0.01,
    'showallachievements': false,
    'showachinstore': true,
    'showcomparelinks': false,
    'hideactivelistings': false,
    'hidespamcomments': false,
    'spamcommentregex': "[\\u2500-\\u25FF]",
    'wlbuttoncommunityapp': true,
    'removeguideslanguagefilter': false,
    'disablelinkfilter': false,
    'showallfriendsthatown': false,
    'show1clickgoo': true,
    'show_profile_link_images': "gray",
    'profile_steamrepcn': true,
    'profile_steamgifts': true,
    'profile_steamtrades': true,
    'profile_steamrep': true,
    'profile_steamdbcalc': true,
    'profile_astats': true,
    'profile_backpacktf': true,
    'profile_astatsnl': true,
    'profile_permalink': true,
    'profile_custom': false,
    'profile_custom_name': "Google",
    'profile_custom_url': "google.com/search?q=[ID]",
    'profile_custom_icon': "www.google.com/images/branding/product/ico/googleg_lodp.ico",
    'steamcardexchange': true,
    'purchase_dates': true,
    'show_badge_progress': true,
    'show_wishlist_link': true,
    'show_wishlist_count': true,
    'show_progressbar': true,
};


class HTMLParser {
    static clearSpecialSymbols(string) {
        return string.replace(/[\u00AE\u00A9\u2122]/g, "");
    }
    
    static htmlToDOM(html) {
        let template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content;
    }
    
    static getVariableFromText(text, name, type) {
        let regex;
        if (type === "object") {
            regex = new RegExp(`${name}\\s*=\\s*(\\{.+?\\});`);
        } else if (type === "array") { // otherwise array
            regex = new RegExp(`${name}\\s*=\\s*(\\[.+?\\]);`);
        } else if (type === "int") {
            regex = new RegExp(`${name}\\s*=\\s*(.+?);`);
        } else if (type === "string") {
            regex = new RegExp(`${name}\\s*=\\s*(\\".+?\\");`);
        } else {
            return null;
        }
        
        let m = text.match(regex);
        if (m) {
            if (type === "int") {
                return parseInt(m[1]);
            }
            return JSON.parse(m[1]);
        }
        
        return null;
    }
}
