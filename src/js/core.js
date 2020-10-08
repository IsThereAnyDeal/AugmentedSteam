export const Info = {
    "version": browser.runtime.getManifest().version,
    "db_version": 3,
};

/*
 * Shim for Promise.finally() for browsers (Waterfox/FF 56) that don't have it
 * https://github.com/domenic/promises-unwrapping/issues/18#issuecomment-57801572
 */
if (typeof Promise.prototype.finally === "undefined") {
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(Promise.prototype, "finally", {
        "value": function(callback) {
            const constructor = this.constructor;
            return this.then((value) => {
                return constructor.resolve(callback()).then(() => {
                    return value;
                });
            }, (reason) => {
                return constructor.resolve(callback()).then(() => {
                    console.error(reason);
                    throw reason;
                });
            });
        },
    });
}

export class SyncedStorage {

    /*
     * browser.storage.sync limits
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
        if (typeof this.cache[key] == "undefined") {
            if (typeof this.defaults[key] == "undefined") {
                console.warn(`Unrecognized SyncedStorage key "${key}"`);
            }
            return this.defaults[key];
        }
        return this.cache[key];
    }

    static set(key, value) {
        this.cache[key] = value;
        return this.adapter.set({[key]: value});

        // this will throw if MAX_WRITE_*, MAX_ITEMS, QUOTA_BYTES* are exceeded
    }

    static import(entries) {
        for (const [key, value] of Object.entries(entries)) {
            this.cache[key] = value;
        }
        return this.adapter.set(entries);
    }

    static remove(key) {
        if (typeof this.cache[key] !== "undefined") {
            delete this.cache[key];
        }
        return this.adapter.remove(key);

        // can throw if MAX_WRITE* is exceeded
    }

    static keys(prefix = "") {
        return Object.keys(this.cache).filter(k => k.startsWith(prefix));
    }

    static entries() {
        return Object.entries(this.cache);
    }

    static clear() {
        this.cache = {};
        return this.adapter.clear();

        // can throw if MAX_WRITE* is exceeded
    }

    // load whole storage and make local copy
    static async init() {
        browser.storage.onChanged.addListener(changes => {
            for (const [key, {"newValue": val}] of Object.entries(changes)) {
                this.cache[key] = val;
            }
        });

        const storage = await this.adapter.get(null);
        Object.assign(this.cache, storage);

        return this.cache;
    }

    static then(onDone, onCatch) {
        return this.init().then(onDone, onCatch);
    }

    static async quota() {
        const maxBytes = this.adapter.QUOTA_BYTES;
        const bytes = await this.adapter.getBytesInUse();
        return bytes / maxBytes; // float 0.0 (0%) -> 1.0 (100%)
    }
}
SyncedStorage.adapter = browser.storage.sync || browser.storage.local;
SyncedStorage.cache = {};
SyncedStorage.defaults = {
    "language": "english",

    "version": Info.version,
    "version_show": true,

    "highlight_owned_color": "#00ce67",
    "highlight_wishlist_color": "#0491bf",
    "highlight_coupon_color": "#a26426",
    "highlight_inv_gift_color": "#800040",
    "highlight_inv_guestpass_color": "#513c73",
    "highlight_notinterested_color": "#4f4f4f",
    "highlight_collection_color": "#856d0e",
    "highlight_waitlist_color": "#4c7521",

    "tag_owned_color": "#00b75b",
    "tag_wishlist_color": "#0383b4",
    "tag_coupon_color": "#c27120",
    "tag_inv_gift_color": "#b10059",
    "tag_inv_guestpass_color": "#65449a",
    "tag_notinterested_color": "#4f4f4f",
    "tag_collection_color": "#856d0e",
    "tag_waitlist_color": "#4c7521",

    "highlight_owned": true,
    "highlight_wishlist": true,
    "highlight_coupon": false,
    "highlight_inv_gift": false,
    "highlight_inv_guestpass": false,
    "highlight_notinterested": false,
    "highlight_excludef2p": false,
    "highlight_notdiscounted": false,
    "highlight_collection": true,
    "highlight_waitlist": true,

    "tag_owned": false,
    "tag_wishlist": false,
    "tag_coupon": false,
    "tag_inv_gift": false,
    "tag_inv_guestpass": false,
    "tag_notinterested": true,
    "tag_collection": false,
    "tag_waitlist": false,
    "tag_short": false,

    "hide_owned": false,
    "hide_ignored": false,
    "hide_dlcunownedgames": false,
    "hide_wishlist": false,
    "hide_cart": false,
    "hide_notdiscounted": false,
    "hide_mixed": false,
    "hide_negative": false,
    "hide_priceabove": false,
    "priceabove_value": "",
    "hidetmsymbols": false,

    "showlowestprice": true,
    "showlowestprice_onwishlist": true,
    "showlowestpricecoupon": true,
    "showallstores": true,
    "stores": [],
    "override_price": "auto",
    "showregionalprice": "mouse",
    "regional_countries": ["us", "gb", "ru", "br", "au", "jp"],

    "show_es_homepagetabs": true,
    "showmarkettotal": false,
    "showsteamrepapi": true,
    "showmcus": true,
    "showoc": true,
    "showhltb": true,
    "showyoutube": true,
    "showtwitch": true,
    "showpcgw": true,
    "showcompletionistme": false,
    "showprotondb": false,
    "showviewinlibrary": false,
    "showsteamcardexchange": false,
    "showitadlinks": true,
    "showsteamdb": true,
    "showbartervg": false,
    "showastatslink": true,
    "showyoutubegameplay": true,
    "showyoutubereviews": true,
    "showwsgf": true,
    "exfgls": true,

    "customize_apppage": {
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

    "customize_frontpage": {
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

    // 'show_keylol_links': false, // not in use, option is commented out
    "show_package_info": false,
    "show_steamchart_info": true,
    "show_steamspy_info": true,
    "show_early_access": true,
    "show_alternative_linux_icon": false,
    "show_itad_button": false,
    "skip_got_steam": false,

    "hideaboutlinks": false,
    "installsteam": "show",
    "openinnewtab": false,
    "keepssachecked": false,
    "showemptywishlist": true,
    "showusernotes": true,
    "showwishliststats": true,
    "user_notes": {},
    "replaceaccountname": true,
    "showfakeccwarning": true,
    "showlanguagewarning": true,
    "showlanguagewarninglanguage": "english",
    "homepage_tab_selection": "remember",
    "homepage_tab_last": null,
    "send_age_info": true,
    "mp4video": false,
    "horizontalscrolling": true,
    "showsupportinfo": true,
    "showdrm": true,
    "regional_hideworld": false,
    "showinvnav": true,
    "quickinv": true,
    "quickinv_diff": -0.01,
    "community_default_tab": "",
    "showallachievements": false,
    "showallstats": true,
    "showachinstore": true,
    "showcomparelinks": false,
    "hideactivelistings": false,
    "showlowestmarketprice": true,
    "hidespamcomments": false,
    "spamcommentregex": "[\\u2500-\\u25FF]",
    "wlbuttoncommunityapp": true,
    "removeguideslanguagefilter": false,
    "disablelinkfilter": false,
    "showallfriendsthatown": false,
    "sortfriendsby": "default",
    "sortreviewsby": "default",
    "sortgroupsby": "default",
    "show1clickgoo": true,
    "show_profile_link_images": "gray",
    "profile_steamrepcn": true,
    "profile_steamgifts": true,
    "profile_steamtrades": true,
    "profile_bartervg": true,
    "profile_steamrep": true,
    "profile_steamdbcalc": true,
    "profile_astats": true,
    "profile_backpacktf": true,
    "profile_astatsnl": true,
    "profile_steamid": true,
    "profile_custom_link": [
        {
            "enabled": true,
            "name": "Google",
            "url": "google.com/search?q=[ID]",
            "icon": "www.google.com/images/branding/product/ico/googleg_lodp.ico"
        },
    ],
    "fav_emoticons": [],
    "group_steamgifts": true,
    "steamcardexchange": true,
    "purchase_dates": true,
    "show_badge_progress": true,
    "show_coupon": true,
    "show_wishlist_link": true,
    "show_wishlist_count": true,
    "show_progressbar": true,
    "show_backtotop": false,

    "profile_showcase_twitch": true,
    "profile_showcase_own_twitch": false,
    "profile_showcase_twitch_profileonly": false,

    "itad_import_library": false,
    "itad_import_wishlist": false,
    "add_to_waitlist": false,

    "context_steam_store": false,
    "context_steam_market": false,
    "context_itad": false,
    "context_bartervg": false,
    "context_steamdb": false,
    "context_steamdb_instant": false,
    "context_steam_keys": false,
};

export class BackgroundBase {
    static message(message) {
        return browser.runtime.sendMessage(message);
    }

    static action(requested, ...params) {
        if (!params.length) { return this.message({"action": requested}); }
        return this.message({"action": requested, "params": params});
    }
}

export class Version {
    constructor(major, minor = 0, patch = 0) {
        console.assert([major, minor, patch].filter(Number.isInteger).length === 3, `${major}.${minor}.${patch} must be integers`);
        this.major = major;
        this.minor = minor;
        this.patch = patch;
    }

    static from(version) {
        if (version instanceof Version) {
            return new Version(version.major, version.minor, version.patch);
        }
        if (typeof version == "string") {
            return Version.fromString(version);
        }
        if (Array.isArray(version)) {
            return Version.fromArray(version);
        }
        throw new Error(`Could not construct a Version from ${version}`);
    }

    static fromArray(version) {
        return new Version(...version.map(v => parseInt(v)));
    }

    static fromString(version) {
        return Version.fromArray(version.split("."));
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
        const _version = Version.coerce(version);
        return this.major === _version.major
            && this.minor === _version.minor
            && this.patch === _version.patch;
    }

    isBefore(version) {
        const _version = Version.coerce(version);
        if (this.major < _version.major) { return true; }
        if (this.major > _version.major) { return false; }

        // this.major == _version.major
        if (this.minor < _version.minor) { return true; }
        if (this.minor > _version.minor) { return false; }

        // this.minor == _version.minor
        if (this.patch < _version.patch) { return true; }
        return false;
    }

    isSameOrBefore(version) {
        const _version = Version.coerce(version);
        if (this.major < _version.major) { return true; }
        if (this.major > _version.major) { return false; }

        // this.major == _version.major
        if (this.minor < _version.minor) { return true; }
        if (this.minor > _version.minor) { return false; }

        // this.minor == _version.minor
        if (this.patch > _version.patch) { return false; }
        return true;
    }

    isAfter(version) {
        const _version = Version.coerce(version);
        return _version.isBefore(this);
    }

    isSameOrAfter(version) {
        const _version = Version.coerce(version);
        return _version.isSameOrBefore(this);
    }
}

export class Downloader {

    static download(content, filename) {
        const a = document.createElement("a");
        a.href = typeof content === "string" ? content : URL.createObjectURL(content);
        a.download = filename;

        // Explicitly dispatching the click event (instead of just a.click()) will make it work in FF
        a.dispatchEvent(new MouseEvent("click"));
    }
}


export class GameId {
    static parseId(id) {
        if (!id) { return null; }

        const intId = parseInt(id);
        if (!intId) { return null; }

        return intId;
    }

    static getAppid(text) {
        let _text = text;

        if (!_text) { return null; }

        if (_text instanceof HTMLElement) {
            const appid = _text.dataset.dsAppid;
            if (appid) { return GameId.parseId(appid); }
            _text = _text.href;
            if (!_text) { return null; }
        }

        // app, market/listing
        const m = _text.match(/(?:store\.steampowered|steamcommunity)\.com\/(?:app|market\/listings)\/(\d+)\/?/);
        return m && GameId.parseId(m[1]);
    }

    static getSubid(text) {
        let _text = text;

        if (!_text) { return null; }

        if (_text instanceof HTMLElement) {
            const subid = _text.dataset.dsPackageid;
            if (subid) { return GameId.parseId(subid); }
            _text = _text.href;
            if (!_text) { return null; }
        }

        const m = _text.match(/(?:store\.steampowered|steamcommunity)\.com\/sub\/(\d+)\/?/);
        return m && GameId.parseId(m[1]);
    }

    static getBundleid(text) {
        let _text = text;

        if (!_text) { return null; }

        if (_text instanceof HTMLElement) {
            const bundleid = _text.dataset.dsBundleid;
            if (bundleid) { return GameId.parseId(bundleid); }
            _text = _text.href;
            if (!_text) { return null; }
        }

        const m = _text.match(/(?:store\.steampowered|steamcommunity)\.com\/bundle\/(\d+)\/?/);
        return m && GameId.parseId(m[1]);
    }

    static trimStoreId(storeId) {
        return Number(storeId.slice(storeId.indexOf("/") + 1));
    }

    static getAppidImgSrc(text) {
        if (!text) { return null; }
        const m = text.match(/(steamcdn-a\.akamaihd\.net\/steam|steamcommunity\/public\/images)\/apps\/(\d+)\//);
        return m && GameId.parseId(m[2]);
    }

    static getAppidUriQuery(text) {
        if (!text) { return null; }
        const m = text.match(/appid=(\d+)/);
        return m && GameId.parseId(m[1]);
    }

    static getAppids(text) {
        const regex = /(?:store\.steampowered|steamcommunity)\.com\/app\/(\d+)\/?/g;
        const res = [];
        let m;
        while ((m = regex.exec(text)) !== null) {
            const id = GameId.parseId(m[1]);
            if (id) {
                res.push(id);
            }
        }
        return res;
    }

    static getAppidFromId(text) {
        if (!text) { return null; }
        const m = text.match(/game_(\d+)/);
        return m && GameId.parseId(m[1]);
    }

    static getAppidFromGameCard(text) {
        if (!text) { return null; }
        const m = text.match(/\/gamecards\/(\d+)/);
        return m && GameId.parseId(m[1]);
    }
}

// todo use https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage
export class LocalStorage {
    static get(key, defaultValue) {
        const item = localStorage.getItem(key);
        if (!item) { return defaultValue; }
        try {
            return JSON.parse(item);
        } catch (err) {
            return defaultValue;
        }
    }

    static set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    static has(key) {
        return localStorage.getItem(key) !== null;
    }

    static remove(key) {
        localStorage.removeItem(key);
    }

    static keys() {
        const result = [];
        for (let i = localStorage.length - 1; i >= 0; --i) {
            result.push(localStorage.key(i));
        }
        return result;
    }

    static clear() {
        localStorage.clear();
    }
}


export class ExtensionResources {
    static getURL(pathname) {
        return browser.runtime.getURL(pathname);
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

/**
 * DOMPurify setup
 * @see https://github.com/cure53/DOMPurify
 */
(async function() {
    let allowOpenInNewTab = SyncedStorage.defaults.openinnewtab;
    try {
        await SyncedStorage;
        allowOpenInNewTab = SyncedStorage.get("openinnewtab");
    } catch (e) {
        console.error(e);
    }

    /*
     * NOTE FOR ADDON REVIEWER:
     * We are modifying default DOMPurify settings to allow other protocols in URLs
     * and to allow links to safely open in new tabs.
     *
     * We took the original Regex and aded chrome-extension://, moz-extension:// and steam://
     * First two are needed for linking local resources from extension,
     * steam:// protocol is used by Steam store to open their own client (e.g. when you want to launch a game).
     *
     * The addition of the `target` attribute to the allowed attributes is done in order to be able to open links in a new tab.
     * We only allow target="_blank" while adding rel="noreferrer noopener" to prevent child window to access window.opener
     * as described in https://www.jitbit.com/alexblog/256-targetblank---the-most-underestimated-vulnerability-ever/
     */

    const purifyConfig = {
        "ALLOWED_URI_REGEXP": /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|chrome-extension|moz-extension|steam):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i
    };

    if (allowOpenInNewTab) {
        purifyConfig.ADD_ATTR = ["target"];

        DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
            if (data.attrName === "target") {
                if (data.attrValue === "_blank") {
                    node.setAttribute("rel", "noreferrer noopener");
                } else {
                    data.keepAttr = false;
                }
            }
        });
    }

    DOMPurify.setConfig(purifyConfig);
})();

export class HTML {

    static escape(str) {

        // @see https://stackoverflow.com/a/4835406
        const map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return str.replace(/[&<>"']/g, (m) => { return map[m]; });
    }

    static fragment(html) {
        const template = document.createElement("template");
        template.innerHTML = DOMPurify.sanitize(html);
        return template.content;
    }

    static element(html) {
        return HTML.fragment(html).firstElementChild;
    }

    static inner(node, html) {
        let _node = node;

        if (typeof _node == "undefined" || _node === null) {
            console.warn(`${_node} is not an Element.`);
            return null;
        }
        if (typeof _node == "string") {
            _node = document.querySelector(_node);
        }
        if (!(_node instanceof Element)) {
            console.warn(`${_node} is not an Element.`);
            return null;
        }

        _node.innerHTML = DOMPurify.sanitize(html);
        return _node;
    }

    static replace(node, html) {
        let _node = node;

        if (typeof _node == "undefined" || _node === null) {
            console.warn(`${_node} is not an Element.`);
            return null;
        }
        if (typeof _node == "string") {
            _node = document.querySelector(_node);
        }
        if (!(_node instanceof Element)) {
            console.warn(`${_node} is not an Element.`);
            return null;
        }

        _node.outerHTML = DOMPurify.sanitize(html);
        return _node;
    }

    static wrap(node, html) {
        let _node = node;

        if (typeof _node == "undefined" || _node === null) {
            console.warn(`${_node} is not an Element.`);
            return null;
        }
        if (typeof _node == "string") {
            _node = document.querySelector(_node);
        }
        if (!(_node instanceof Element)) {
            console.warn(`${_node} is not an Element.`);
            return null;
        }

        const wrapper = HTML.element(html);
        _node.replaceWith(wrapper);
        wrapper.append(_node);
        return wrapper;
    }

    static adjacent(node, position, html) {
        let _node = node;

        if (typeof _node == "undefined" || _node === null) {
            console.warn(`${_node} is not an Element.`);
            return null;
        }
        if (typeof _node == "string") {
            _node = document.querySelector(_node);
        }
        if (!(_node instanceof Element)) {
            console.warn(`${_node} is not an Element.`);
            return null;
        }

        _node.insertAdjacentHTML(position, DOMPurify.sanitize(html));
        return _node;
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

export class HTMLParser {
    static clearSpecialSymbols(string) {
        return string.replace(/[\u00AE\u00A9\u2122]/g, "");
    }

    static htmlToDOM(html) {
        return HTML.fragment(html);
    }

    static htmlToElement(html) {
        return HTML.element(html);
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

        const m = text.match(regex);
        if (m) {
            if (type === "int") {
                return parseInt(m[1]);
            }
            return JSON.parse(m[1]);
        }

        return null;
    }

    static getVariableFromDom(variableName, type, dom) {
        const _dom = dom || document;
        const nodes = _dom.querySelectorAll("script");
        for (const node of nodes) {
            const m = HTMLParser.getVariableFromText(node.textContent, variableName, type);
            if (m) {
                return m;
            }
        }
        return null;
    }
}

export class StringUtils {

    // https://stackoverflow.com/a/6969486/7162651
    static escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
    }
}

/* eslint-disable max-len */
/**
 * Convenience class for passing errors between contexts.
 * Errors thrown in the context of a message callback on the background page are
 * {@link https://github.com/mozilla/webextension-polyfill/blob/87bdfa844da054d189ac28423cf01b64ebfe1e5b/src/browser-polyfill.js#L418
 *  cut down to only send the message of the error},
 * losing information about the type.
 */
/* eslint-enable max-len */
export class ErrorParser {

    /**
     * Takes an Error string and parses it by splitting it into name and message
     * @param {String} errStr a string created by Error.prototype.toString
     * @returns {{name: String, msg: String}} an object containing information about the error name and its message
     */
    static parse(errStr) {
        const info = errStr.match(/(.*):\s(.+)/);

        return {"name": info[1] || "", "msg": info[2] || ""};
    }
}

export class LoginError extends Error {
    constructor(type) {
        super(type);
        this.name = "LoginError";
    }
}

export class ServerOutageError extends Error {
    constructor(msg) {
        super(msg);
        this.name = "ServerOutageError";
    }
}

export function sleep(duration) {
    return new Promise((resolve => {
        setTimeout(() => { resolve(); }, duration);
    }));
}

export class Timestamp {

    static now() {
        return Math.trunc(Date.now() / 1000);
    }
}


export class Debug {

    static async executionTime(fn, label) {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        console.debug("Took", end - start, "ms to execute", label);
        return result;
    }
}

export class CookieStorage {
    static get(name, defaultValue) {
        if (CookieStorage.cache.size === 0) {
            CookieStorage.init();
        }
        const _name = name.trim();
        if (!CookieStorage.cache.has(_name)) {
            return defaultValue;
        }
        return CookieStorage.cache.get(_name);
    }

    static set(name, val, ttl = 60 * 60 * 24 * 365) {
        if (CookieStorage.cache.size === 0) {
            CookieStorage.init();
        }
        let _name = name.trim();
        let _val = val.trim();
        CookieStorage.cache.set(_name, _val);
        _name = encodeURIComponent(_name);
        _val = encodeURIComponent(_val);
        document.cookie = `${_name}=${_val}; max-age=${ttl}`;
    }

    static remove(name) {
        let _name = name.trim();
        CookieStorage.cache.delete(_name);
        _name = encodeURIComponent(_name);
        document.cookie = `${_name}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }

    static init() {
        CookieStorage.cache.clear();
        for (let [key, val] of document.cookie.split(";").map(kv => kv.split("="))) {
            key = key.trim();
            CookieStorage.cache.set(key, decodeURIComponent(val));
        }
    }
}
CookieStorage.cache = new Map();

export class MetaInfo {

    static get contextType() {
        if (browser.extension.getBackgroundPage) {
            const bgPage = browser.extension.getBackgroundPage();

            return bgPage === window ? MetaInfo.CONTEXT_TYPES.BACKGROUND : MetaInfo.CONTEXT_TYPES.OPTIONS;
        }

        return MetaInfo.CONTEXT_TYPES.CONTENT_SCRIPT;
    }
}

MetaInfo.CONTEXT_TYPES = Object.freeze({
    "BACKGROUND": 1,
    "CONTENT_SCRIPT": 2,
    "OPTIONS": 3,
});

export class Language {
    static getCurrentSteamLanguage() {
        if (this._currentSteamLanguage !== null) {
            return this._currentSteamLanguage;
        }

        const nodes = document.querySelectorAll("script[src]");
        const re = /(?:\?|&(?:amp;)?)l=([^&]+)/;
        for (const n of nodes) {
            const src = n.getAttribute("src");
            const match = src.match(re);
            if (match) {
                this._currentSteamLanguage = match[1];
                return this._currentSteamLanguage;
            }
        }

        // In a Content Context, we can check for a cookie
        if (MetaInfo.contextType === MetaInfo.CONTEXT_TYPES.CONTENT_SCRIPT) {
            this._currentSteamLanguage = CookieStorage.get("Steam_Language") || null;
        }

        return this._currentSteamLanguage;
    }

    static getLanguageCode(language) {
        const code = Language.languages[language];
        return code || "en";
    }

    static isCurrentLanguageOneOf(array) {
        return array.includes(Language.getCurrentSteamLanguage());
    }
}
Language._currentSteamLanguage = null;
Language.languages = {
    "english": "en",
    "bulgarian": "bg",
    "czech": "cs",
    "danish": "da",
    "dutch": "nl",
    "finnish": "fi",
    "french": "fr",
    "greek": "el",
    "german": "de",
    "hungarian": "hu",
    "italian": "it",
    "japanese": "ja",
    "koreana": "ko",
    "norwegian": "no",
    "polish": "pl",
    "portuguese": "pt-PT",
    "brazilian": "pt-BR",
    "russian": "ru",
    "romanian": "ro",
    "schinese": "zh-CN",
    "spanish": "es-ES",
    "latam": "es-419",
    "swedish": "sv-SE",
    "tchinese": "zh-TW",
    "thai": "th",
    "turkish": "tr",
    "ukrainian": "ua",
    "vietnamese": "vi",
};

export class Localization {
    static loadLocalization(code) {
        return ExtensionResources.getJSON(`/localization/${code}/strings.json`);
    }

    static init() {
        if (Localization._promise) { return Localization._promise; }

        let currentSteamLanguage = Language.getCurrentSteamLanguage();
        let storedSteamLanguage = SyncedStorage.get("language");
        if (currentSteamLanguage === null) {
            currentSteamLanguage = storedSteamLanguage;
        } else if (currentSteamLanguage !== storedSteamLanguage) {
            storedSteamLanguage = currentSteamLanguage;
            SyncedStorage.set("language", currentSteamLanguage);
            BackgroundBase.action("clearpurchases");
        }

        function deepAssign(target, source) {

            // Object.assign() but deep-assigning objects recursively
            for (const [key, val] of Object.entries(source)) {
                if (typeof target[key] === "undefined") {
                    console.warn("The key %s doesn't exist in the English localization file", key);
                    continue;
                }
                if (typeof val === "object") {
                    deepAssign(target[key], val);
                } else if (val !== "") {
                    target[key] = val;
                }
            }
            return target;
        }

        const local = Language.getLanguageCode(currentSteamLanguage);
        const codes = ["en"];
        if (local !== null && local !== "en") {
            codes.push(local);
        }
        Localization._promise = Promise.all(
            codes.map(lc => Localization.loadLocalization(lc))
        ).then(([english, local]) => {
            Localization.str = english;
            if (local) {
                deepAssign(Localization.str, local);
            }
            return Localization.str;
        });
        return Localization._promise;
    }

    static then(onDone, onCatch) {
        return Localization.init().then(onDone, onCatch);
    }

    static getString(key) {

        // Source: http://stackoverflow.com/a/24221895
        const path = key.split(".").reverse();
        let current = Localization.str;

        while (path.length) {
            if (typeof current !== "object") {
                return null;
            }
            current = current[path.pop()];
        }
        return current;
    }
}
Localization._promise = null;
