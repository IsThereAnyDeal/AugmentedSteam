const Info = {
    'version': "0.9.4",
};

/**
 * Shim for Promise.finally() for browsers (Waterfox/FF 56) that don't have it
 * https://github.com/domenic/promises-unwrapping/issues/18#issuecomment-57801572
 */
if (typeof Promise.prototype.finally === 'undefined') {
    Object.defineProperty(Promise.prototype, 'finally', {
        'value': function(callback) {
            var constructor = this.constructor;
            return this.then(function(value) {
                return constructor.resolve(callback()).then(function(){
                    return value;
                });
            }, function(reason) {
                return constructor.resolve(callback()).then(function(){
                    console.error(reason);
                    throw reason;
                });
            });
        },
    });
}

class Version {
    constructor(major, minor=0, patch=0) {
        console.assert([major, minor, patch].filter(Number.isInteger).length === 3, `${major}.${minor}.${patch} must be integers`);
        this.major = major;
        this.minor = minor;
        this.patch = patch;
    }

    static from(version) {
        if (version instanceof Version) {
            return new Version(version.major, version.minor, version.patch);
        }
        if (typeof version == 'string') {
            return Version.fromString(version);
        }
        if (Array.isArray(version)) {
            return Version.fromArray(version);
        }
        throw `Could not construct a Version from ${version}`;
    }
    static fromArray(version) {
        return new Version(...version.map(v => parseInt(v, 10)));
    }
    static fromString(version) {
        return Version.fromArray(version.split('.'));
    }
    static coerce(version) {
        if (version instanceof Version) {
            return version;
        }
        return Version.from(version);
    }

    toString() {
        return `${this.major}.${this.minor}.${this.patch}`;
    }
    toArray() {
        return [this.major, this.minor, this.patch];
    }
    toJSON() {
        return this.toString();
    }

    isCurrent() {
        return this.isSameOrAfter(Info.version);
    }
    isSame(version) {
        version = Version.coerce(version);
        return this.major === version.major
            && this.minor === version.minor
            && this.patch === version.patch;
    }
    isBefore(version) {
        version = Version.coerce(version);
        if (this.major < version.major) { return true; }
        if (this.major > version.major) { return false; }
        // this.major == version.major
        if (this.minor < version.minor) { return true; }
        if (this.minor > version.minor) { return false; }
        // this.minor == version.minor
        if (this.patch < version.patch) { return true; }
        return false;
    }
    isSameOrBefore(version) {
        version = Version.coerce(version);
        if (this.major < version.major) { return true; }
        if (this.major > version.major) { return false; }
        // this.major == version.major
        if (this.minor < version.minor) { return true; }
        if (this.minor > version.minor) { return false; }
        // this.minor == version.minor
        if (this.patch > version.patch) { return false; }
        return true;
    }
    isAfter(version) {
        version = Version.coerce(version);
        return version.isBefore(this);
    }
    isSameOrAfter(version) {
        version = Version.coerce(version);
        return version.isSameOrBefore(this);
    }
}


class VersionHandler {

    static migrateSettings() {
        let oldVersion = SyncedStorage.get("version"); // default is Info.version
        oldVersion = Version.fromString(oldVersion);

        if (oldVersion.isCurrent()) {
            return;
        }

        // last settings version was out of date
        // show changelog on next page load
        SyncedStorage.set("version_updated", true);

        if (oldVersion.isSameOrBefore("0.9.4")) {

            // Remove eu1 region
            let priceRegions = SyncedStorage.get('regional_countries');
            let i = priceRegions.includes('eu1');
            if (i !== -1) {
                priceRegions.splice(i, 1);
                SyncedStorage.set('regional_countries', priceRegions);
            }

            // Populate customize_frontpage
            let mapping = {
                'show_featuredrecommended': 'featuredrecommended',
                'show_specialoffers': 'specialoffers',
                'show_trendingamongfriends': 'trendingamongfriends',
                'show_es_discoveryqueue': 'discoveryqueue',
                'show_browsesteam': 'browsesteam',
                'show_curators': 'curators',
                'show_morecuratorrecommendations': 'morecuratorrecommendations',
                'show_recentlyupdated': 'recentlyupdated',
                'show_fromdevelopersandpublishersthatyouknow': 'fromdevelopersandpublishersthatyouknow',
                'show_popularvrgames': 'popularvrgames',
                'show_es_homepagetab': 'homepagetab',
                'show_gamesstreamingnow': 'gamesstreamingnow',
                'show_under': 'under',
                'show_updatesandoffers': 'updatesandoffers',
                'show_es_homepagesidebar': 'homepagesidebar',
            };
            let settings = SyncedStorage.get('customize_frontpage');
            for (let [oldkey, newkey] of Object.entries(mapping)) {
                if (!SyncedStorage.has(oldkey)) { continue; }
                settings[newkey] = SyncedStorage.get(oldkey);
                SyncedStorage.remove(oldkey);
            }
            SyncedStorage.set('customize_frontpage', settings);
            
            // Populate customize_apppage
            mapping = {
                'show_apppage_reviews': 'reviews',
                'show_apppage_about': 'about',
                'show_apppage_surveys': 'surveys',
                'show_apppage_sysreq': 'sysreq',
                'show_apppage_legal': 'legal',
                'show_apppage_morelikethis': 'morelikethis',
                'show_apppage_recommendedbycurators': 'recommendedbycurators',
                'show_apppage_customerreviews': 'customerreviews',
            };
            settings = SyncedStorage.get('customize_apppage');
            for (let [oldkey, newkey] of Object.entries(mapping)) {
                if (!SyncedStorage.has(oldkey)) { continue; }
                settings[newkey] = SyncedStorage.get(oldkey);
                SyncedStorage.remove(oldkey);
            }
            SyncedStorage.set('customize_apppage', settings);
        }

        SyncedStorage.set("version", Info.version);
    }
}


function checkError() {
    if (!chrome.runtime.lastError) {
        return;
    }
    throw chrome.runtime.lastError.message;
}


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
    static has(key) {
        return Object.prototype.hasOwnProperty.call(this.cache, key);
    }
    static get(key) {
        if (typeof this.cache[key] == 'undefined') {
            if (typeof this.defaults[key] == 'undefined') {
                console.warn(`Unrecognized SyncedStorage key '${key}'`);
            }
            return this.defaults[key];
        }
        return this.cache[key];
    }

    static set(key, value) {
        let that = this;
        that.cache[key] = value;
        return new Promise((resolve, reject) => {
            that.adapter.set({ [key]: value, }, () => { checkError(); resolve(true); });
            // this will throw if MAX_WRITE_*, MAX_ITEMS, QUOTA_BYTES* are exceeded
        });
        
    }

    static remove(key) {
        let that = this;
        if (typeof that.cache[key]) {
            delete that.cache[key];
        }
        return new Promise((resolve, reject) => {
            that.adapter.remove(key, () => { checkError(); resolve(true); });
            // can throw if MAX_WRITE* is exceeded
        });
    }

    static keys(prefix='') {
        return Object.keys(this.cache).filter(k => k.startsWith(prefix));
    }

    static clear() {
        this.cache = {};
        return new Promise((resolve, reject) => {
            this.adapter.clear(() => { checkError(); resolve(true); });
            // can throw if MAX_WRITE* is exceeded
        });
    }

    // load whole storage and make local copy
    static async init() {
        let that = this;
        function onChange(changes, namespace) {
            let that = SyncedStorage;
            for (let [key, { 'newValue': val, }] of Object.entries(changes)) {
                that.cache[key] = val;
            }
        }
        chrome.storage.onChanged.addListener(onChange);
        let storage = await new Promise((resolve, reject) => that.adapter.get(null, result => resolve(result)));
        Object.assign(that.cache, storage);

        return that.cache;
    }
    static then(onDone, onCatch) {
        return this.init().then(onDone, onCatch);
    }

    static async quota() {
        let that = this;
        let maxBytes = this.adapter.QUOTA_BYTES;
        let bytes = await new Promise((resolve, reject) => that.adapter.getBytesInUse(bytes => resolve(bytes)));
        return bytes / maxBytes; // float 0.0 (0%) -> 1.0 (100%)
    }
}
SyncedStorage.adapter = chrome.storage.sync || chrome.storage.local;
SyncedStorage.cache = {};
SyncedStorage.defaults = {
    'version': Info.version,
    'language': "english",

    'version_show': true,
    'version_updated': false,

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
    'regional_countries': ["us", "gb", "ru", "br", "au", "jp"],

    'show_es_homepagetabs': true,
    'showmarkettotal': false,
    'showsteamrepapi': true,
    'showmcus': true,
    'showoc': true,
    'showhltb': true,
    'showpcgw': true,
    'showprotondb': false,
    'showclient': true,
    'showsteamcardexchange': false,
    'showitadlinks': true,
    'showsteamdb': true,
    'showastatslink': true,
    'showwsgf': true,
    'exfgls': true,

    'customize_apppage': {
        "recentupdates": true,
        "reviews": true,
        "about": true,
        "contentwarning": true,
        "steamchart": true,
        "steamspy": true,
        "surveys": true,
        "sysreq": true,
        "legal": true,
        "morelikethis": true,
        "recommendedbycurators": true,
        "customerreviews": true
    },

    'customize_frontpage': {
        "featuredrecommended": true,
        "specialoffers": true,
        "trendingamongfriends": true,
        "discoveryqueue": true,
        "browsesteam": true,
        "curators": true,
        "morecuratorrecommendations": true,
        "recentlyupdated": true,
        "fromdevelopersandpublishersthatyouknow": true,
        "popularvrgames": true,
        "homepagetabs": true,
        "gamesstreamingnow": true,
        "under": true,
        "updatesandoffers": true,
        "homepagesidebar": true
    },

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
    'showwlnotes': true,
    'wishlist_notes': {},
    'replaceaccountname': true,
    'showfakeccwarning': true,
    'showlanguagewarning': true,
    'showlanguagewarninglanguage': "English",
    'homepage_tab_selection': "remember",
    'homepage_tab_last': null,
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


class ExtensionResources {
    static getURL(pathname) {
        return chrome.runtime.getURL(pathname);
    }

    static get(pathname) {
        return fetch(ExtensionResources.getURL(pathname));
    }

    static getJSON(pathname) {
        return ExtensionResources.get(pathname).then(r => r.json());
    }
    static getText(pathname) {
        return ExtensionResources.get(pathname).then(r => r.text());
    }
}

class HTML {

    static escape = function(str) {
        // TODO there must be a better way
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;') ;
    };

    static inner(node, html) {
        if (typeof(node) === "string") {
            node = document.querySelector(node);
        }

        node.innerHTML = DOMPurify.sanitize(html);
    }

    static adjacent(node, position, html) {
        if (typeof(node) === "string") {
            node = document.querySelector(node);
        }

        node.insertAdjacentHTML(position, DOMPurify.sanitize(html));
    }

    static beforeBegin(node, html) {
        HTML.adjacent(node, "beforebegin", html);
    }

    static afterBegin(node, html) {
        HTML.adjacent(node, "afterbegin", html);
    }

    static beforeEnd(node, html) {
        HTML.adjacent(node, "beforeend", html);
    }

    static afterEnd(node, html) {
        HTML.adjacent(node, "afterend", html);
    }

}

class HTMLParser {
    static clearSpecialSymbols(string) {
        return string.replace(/[\u00AE\u00A9\u2122]/g, "");
    }
    
    static htmlToDOM(html) {
        let template = document.createElement('template');
        HTML.inner(template, html);
        return template.content;
    }

    static htmlToElement(html) {
        return HTMLParser.htmlToDOM(html).firstElementChild;
    };

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

    static getVariableFromDom(variableName, type, dom) {
        dom = dom || document;
        let nodes = dom.querySelectorAll("script");
        for (let node of nodes) {
            let m = HTMLParser.getVariableFromText(node.textContent, variableName, type)
            if (m) {
                return m;
            }
        }
    };
}
