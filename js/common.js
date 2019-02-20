
let Info = {
    version: "0.9.3"
};

/**
 * Default settings
 */
let Defaults = (function() {
    let self = {};

    self.language = "english";
    self.highlight_owned_color = "#598400";
    self.highlight_wishlist_color = "#1483ad";
    self.highlight_coupon_color = "#a26426";
    self.highlight_inv_gift_color = "#800040";
    self.highlight_inv_guestpass_color = "#513c73";
    self.highlight_notinterested_color = "#4f4f4f";

    self.tag_owned_color = "#5c7836";
    self.tag_wishlist_color = "#0d80bd";
    self.tag_coupon_color = "#c27120";
    self.tag_inv_gift_color = "#b10059";
    self.tag_inv_guestpass_color = "#65449a";
    self.tag_notinterested_color = "#4f4f4f";

    self.highlight_owned = true;
    self.highlight_wishlist = true;
    self.highlight_coupon = false;
    self.highlight_inv_gift = false;
    self.highlight_inv_guestpass = false;
    self.highlight_notinterested = false;
    self.highlight_excludef2p = false;
    self.highlight_notdiscounted = false;

    self.tag_owned = false;
    self.tag_wishlist = false;
    self.tag_coupon = false;
    self.tag_inv_gift = false;
    self.tag_inv_guestpass = false;
    self.tag_notinterested = true;
    self.tag_short = false;

    self.hide_owned = false;
    self.hide_ignored = false;
    self.hide_dlcunownedgames = false;
    self.hide_wishlist = false;
    self.hide_cart = false;
    self.hide_notdiscounted = false;
    self.hide_mixed = false;
    self.hide_negative = false;
    self.hide_priceabove = false;
    self.priceabove_value = "";
    self.hidetmsymbols = false;

    self.showlowestprice = true;
    self.showlowestprice_onwishlist = true;
    self.showlowestpricecoupon = true;
    self.showallstores = true;
    self.stores = [];
    self.override_price = "auto";
    self.showregionalprice = "mouse";
    self.regional_countries = ["us", "gb", "eu1", "ru", "br", "au", "jp"];

    self.show_featuredrecommended = true;
    self.show_specialoffers = true;
    self.show_trendingamongfriends = true;
    self.show_browsesteam = true;
    self.show_curators = true;
    self.show_morecuratorrecommendations = true;
    self.show_recentlyupdated = true;
    self.show_fromdevelopersandpublishersthatyouknow = true;
    self.show_popularvrgames = true;
    self.show_gamesstreamingnow = true;
    self.show_under = true;
    self.show_updatesandoffers = true;
    self.show_es_discoveryqueue = true;
    self.show_es_homepagetabs = true;
    self.show_es_homepagesidebar = true;
    self.showmarkettotal = false;
    self.showsteamrepapi = true;
    self.showmcus = true;
    self.showoc = true;
    self.showhltb = true;
    self.showpcgw = true;
    self.showclient = true;
    self.showsteamcardexchange = false;
    self.showitadlinks = true;
    self.showsteamdb = true;
    self.showastatslink = true;
    self.showwsgf = true;
    self.exfgls = true;
    self.show_apppage_reviews = true;
    self.show_apppage_about = true;
    self.show_apppage_surveys = true;
    self.show_apppage_sysreq = true;
    self.show_apppage_legal = true;
    self.show_apppage_morelikethis = true;
    self.show_apppage_recommendedbycurators = true;
    self.show_apppage_customerreviews = true;
    self.show_keylol_links = false;
    self.show_package_info = false;
    self.show_sysreqcheck = false;
    self.show_steamchart_info = true;
    self.show_steamspy_info = true;
    self.show_early_access = true;
    self.show_alternative_linux_icon = false;
    self.show_itad_button = false;
    self.skip_got_steam = false;

    self.hideinstallsteambutton = false;
    self.hideaboutmenu = false;
    self.keepssachecked = false;
    self.showemptywishlist = true;
    self.wishlist_notes = {};
    self.version_show = true;
    self.replaceaccountname = true;
    self.showfakeccwarning = true;
    self.showlanguagewarning = true;
    self.showlanguagewarninglanguage = "English";
    self.homepage_tab_selection = "remember";
    self.send_age_info = true;
    self.html5video = true;
    self.contscroll = true;
    self.showdrm = true;
    self.regional_hideworld = false;
    self.showinvnav = true;
    self.showesbg = true;
    self.quickinv = true;
    self.quickinv_diff = -0.01;
    self.showallachievements = false;
    self.showachinstore = true;
    self.showcomparelinks = false;
    self.hideactivelistings = false;
    self.hidespamcomments = false;
    self.spamcommentregex = "[\\u2500-\\u25FF]";
    self.wlbuttoncommunityapp = true;
    self.removeguideslanguagefilter = false;
    self.disablelinkfilter = false;
    self.showallfriendsthatown = false;
    self.show1clickgoo = true;
    self.show_profile_link_images = "gray";
    self.profile_steamrepcn = true;
    self.profile_steamgifts = true;
    self.profile_steamtrades = true;
    self.profile_steamrep = true;
    self.profile_steamdbcalc = true;
    self.profile_astats = true;
    self.profile_backpacktf = true;
    self.profile_astatsnl = true;
    self.profile_permalink = true;
    self.profile_custom = false;
    self.profile_custom_name = "Google";
    self.profile_custom_url = "google.com/search?q=[ID]";
    self.profile_custom_icon = "www.google.com/images/branding/product/ico/googleg_lodp.ico";
    self.steamcardexchange = true;
    self.purchase_dates = true;
    self.show_badge_progress = true;
    self.show_wishlist_link = true;
    self.show_wishlist_count = true;
    self.show_progressbar = true;

    return self;
})();


/**
 * Common functions that may be used on any pages
 */

let Api = (function(){
    let self = {};

    self.getApiUrl = function(endpoint, query) {

        let queryString = "";
        if (query) {
            queryString = "?" + Object.entries(query)
                .map(pair => pair.map(encodeURIComponent).join("="))
                .join("&");
        }

        return Config.ApiServerHost + "/" + endpoint + "/" + queryString;
    };

    return self;
})();

let Background = (function(){
    let self = {};

    self.message = async function(message) {
        return new Promise(function (resolve, reject) {
            chrome.runtime.sendMessage(message, function(response) {
                if (!response) {
                    reject("No response from extension background context.");
                    return;
                }
                if (typeof response.error !== 'undefined') {
                    reject(response.error);
                    return;
                }
                resolve(response.response);
            });
        });
    };
    
    self.action = function(requested, params) {
        if (typeof params == 'undefined')
            return self.message({ 'action': requested, });
        return self.message({ 'action': requested, 'params': params, });
    };

    Object.freeze(self);
    return self;
})();

let TimeHelper = (function(){

    let self = {};

    self.isExpired = function(updateTime, expiration) {
        if (!updateTime) { return true; }

        let expireTime = Math.trunc(Date.now() / 1000) - expiration;
        return updateTime < expireTime;
    };

    self.timestamp = function() {
        return Math.trunc(Date.now() / 1000);
    };

    return self;
})();


let DateParser = (function(){

    let _locale;
    let _monthShortNames;
    let _dateRegex;
    let _timeRegex;

    function DateParser(locale) {
        _locale = locale;

        switch(locale) {
            case "en":
                _monthShortNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                _dateRegex = new RegExp("(\\d+)\\s+("+_monthShortNames.join("|")+")(?:,\\s+(\\d+))?");
                _timeRegex = /(\d+):(\d+)([ap]m)/;
                break;
            // FIXME(tomas.fedor) other languages
        }
    }

    DateParser.prototype.parseUnlockTime = function(datetime) {

        switch(_locale) {
            case "en":
                let date = datetime.match(_dateRegex);
                let time = datetime.match(_timeRegex);
                if (!date || !time) { return 0; }

                let year = date[3] ? parseInt(date[3]) : (new Date()).getFullYear();
                let month = _monthShortNames.indexOf(date[2]);
                let day = parseInt(date[1]);

                let hour = time[3] === "am" ? parseInt(time[1]) : parseInt(time[1])+12;
                let minutes = time[2];

                return (new Date(year, month, day, hour, minutes)).getTime();
        }
        return 0;
    };

    return DateParser;
})();



let LocalData = (function(){

    let self = {};

    self.set = function(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    };

    self.get = function(key, defaultValue) {
        let v = localStorage.getItem(key);
        if (!v) return defaultValue;
        try {
            return JSON.parse(v);
        } catch (err) {
            return defaultValue;
        }
    };

    self.del = function(key) {
        localStorage.removeItem(key);
    };

    self.clear = function() {
        localStorage.clear();
    };

    return self;
})();

let ExtensionLayer = (function() {

    let self = {};

    self.getLocalUrl = function(url) {
        return chrome.extension.getURL(url);
    };

    // NOTE: use cautiously!
    // Run script in the context of the current tab
    self.runInPageContext = function(fun){
        let script  = document.createElement('script');
        script.textContent = '(' + fun + ')();';
        document.documentElement.appendChild(script);
        script.parentNode.removeChild(script);
    };

    return self;
})();

let SyncedStorage = (function(){
    let storageAdapter = chrome.storage.sync || chrome.storage.local;

    let localCopy = {};
    let self = {};

    self.get = function(key) {
        return typeof localCopy[key] === "undefined" ? Defaults[key] : localCopy[key];
    };

    self.set = function(key, value) {
        localCopy[key] = value;

        let newVal = {};
        newVal[key] = value;
        storageAdapter.set(newVal);
    };

    self.remove = function(key) {
        if (localCopy[key]) {
            delete localCopy[key];
        }
        storageAdapter.remove(key);
    };

    self.clear = function() {
        localCopy = {};
        storageAdapter.clear();
    };

    // load whole storage and make local copy
    self.load = function() {
        localCopy = Object.assign({}, Defaults);

        return new Promise(function(resolve, reject) {
            storageAdapter.get(function(result) {
                localCopy = Object.assign(localCopy, result);
                resolve();
            })
        });
    };

    return self;
})();


let RequestData = (function(){
    let self = {};

    self.getJson = function(url) {
        return new Promise(function(resolve, reject) {
            function requestHandler(state) {
                if (state.readyState !== 4) {
                    return;
                }

                if (state.status === 200) {
                    resolve(JSON.parse(state.responseText));
                } else {
                    reject(state.status);
                }
            }

            let request = new XMLHttpRequest();
            request.onreadystatechange = function() { requestHandler(request); };
            request.overrideMimeType("application/json");
            request.open("GET", url);
            request.send();
        });
    };

    self.getLocalJson = function(url) {
        return self.getJson(ExtensionLayer.getLocalUrl(url));
    };

    let totalRequests = 0;
    let processedRequests = 0;

    self.getHttp = function(url, settings, returnHtml) {
        settings = settings || {};
        settings.withCredentials = settings.withCredentials || false;
        settings.type = settings.type || "text/html";
        settings.method = settings.method || "GET";
        settings.body = settings.body || null;

        totalRequests += 1;

        ProgressBar.loading();

        return new Promise(function(resolve, reject) {

            function requestHandler(state) {
                if (state.readyState !== 4) {
                    return;
                }

                processedRequests += 1;
                ProgressBar.progress((processedRequests / totalRequests) * 100);

                if (state.status === 200) {
                    if (returnHtml) {
                        resolve(state.responseXML);
                    } else {
                        resolve(state.responseText);
                    }
                } else {
                    ProgressBar.failed(null, url, state.status, state.statusText);
                    reject(state.status);
                }
            }

            let request = new XMLHttpRequest();
            request.onreadystatechange = function() { requestHandler(request); };
            request.overrideMimeType(settings.type);
            request.withCredentials = settings.withCredentials;
            request.open(settings.method, url);

            if (settings.headers) {
                for (let i=0; i<settings.headers.length; i++) {
                    request.setRequestHeader(settings.headers[i][0], settings.headers[i][1]);
                }
            }

            request.send(settings.body);
        });
    };

    self.getApi = function(api, query) {
        let apiUrl = Api.getApiUrl(api, query);
        return self.getJson(apiUrl);
    };

    self.post = function(url, formData, settings) {
        return self.getHttp(url, Object.assign(settings || {}, {
            method: "POST",
            body: formData
        }));
    };

    return self;
})();

let ProgressBar = (function(){
    let self = {};

    let node = null;

    self.create = function() {
        if (!SyncedStorage.get("show_progressbar")) { return; }

        let container = document.getElementById("global_actions");
        if (!container) return;
        container.insertAdjacentHTML("afterend",
            `<div class="es_progress_wrap">
                <div id="es_progress" class="complete" title="${ Localization.str.ready.ready }">
                    <div class="progress-inner-element">
                        <div class="progress-bar">
                            <div class="progress-value" style="width: 18px"></div>
                        </div>
                    </div>
                </div>
            </div>`);

        node = document.querySelector("#es_progress");
    };

    self.loading = function() {
        if (!node) { return; }

        if (Localization.str.ready) {
            node.setAttribute("title", Localization.str.ready.loading);
        }

        node.classList.remove("complete");
        node.querySelector(".progress-value").style.width = "18px";
    };

    self.progress = function(value) {
        if (!node) { return; }

        node.querySelector(".progress-value").style.width = value; // TODO verify this works, shouldn't there be "%"?

        if (value >= 100) {
            node.classList.add("complete");
            node.setAttribute("title", Localization.str.ready.ready)
        }
    };

    self.failed = function(message, url, status, error) {
        if (!node) { return; }

        node.classList.add("error");
        node.setAttribute("title", "");

        let nodeError = node.closest('.es_progress_wrap').querySelector(".es_progress_error");
        if (!nodeError) {
            node.insertAdjacentHTML("afterend", "<div class='es_progress_error'>" + Localization.str.ready.failed + ": <ul></ul></div>");
            nodeError = node.nextElementSibling;
        }

        if (!message) {
            message = "<span>" + url + "</span>";
            if (status) {
                message += "(" + status +": "+ error +")";
            }
        }

        nodeError.querySelector("ul").insertAdjacentHTML("beforeend", "<li>" + message + "</li>");
    };

    return self;
})();

let Localization = (function(){
    let self = {};

    self.str = {}; // translated strings

    self.loadLocalization = function(code) {
        return RequestData.getLocalJson("/localization/" + code + "/strings.json");
    };

    let _promise = null;
    self.promise = function(){
        if (_promise) { return _promise; }

        let lang = SyncedStorage.get("language");
        let local = Language.getLanguageCode(lang);

        _promise = new Promise(function(resolve, reject) {

            let promises = [];
            promises[0] = self.loadLocalization("en");

            if (local != null) {
                promises[1] = self.loadLocalization(local);
            }

            Promise.all(promises)
                .then(function(values){
                    self.str = values[0];

                    // merge local language to default
                    if (values[1]) {
                        function merge(target, other) {
                            for (let key in other) {
                                if (!other.hasOwnProperty(key)) { continue; }
                                if (typeof other[key] === "object") {
                                    merge(target[key], other[key]);
                                } else {
                                    target[key] = other[key];
                                }
                            }
                        }
                        merge(self.str, values[1]);
                    }

                    resolve();
                }, reject);
        });
        return _promise;
    };

    self.then = function(onDone, onCatch) {
        return self.promise().then(onDone, onCatch);
    };

    self.getString = function(key) {
        // Source: http://stackoverflow.com/a/24221895
        let path = key.split('.').reverse();
        let current = self.str;

        while (path.length) {
            if (typeof current !== 'object') {
                return undefined;
            } else {
                current = current[path.pop()];
            }
        }

        return current;
    };

    return self;
})();


let User = (function(){

    let self = {};

    self.isSignedIn = false;
    self.profileUrl = false;
    self.profilePath = false;
    self.steamId = null;

    let accountId = false;
    let sessionId = false;

    let _promise = null;

    async function _fetch() {
        let response = await RequestData.getHttp(self.profileUrl);

        self.steamId = (response.match(/"steamid":"(\d+)"/) || [])[1];

        if (self.steamId) {
            self.isSignedIn = true;
            LocalData.set("userLogin", {"steamId": self.steamId, "profilePath": self.profilePath});

            // check user country
            response = await RequestData.getHttp("https://store.steampowered.com/account/change_country/");
            if (response) {
                let node = BrowserHelper.htmlToDOM(response).querySelector("#dselect_user_country");
                if (node && node.value) {
                    LocalData.set("userCountry", node.value);
                }
            }
        }
    }

    self.promise = function() {
        if (_promise) { return _promise; }

        let avatarNode = document.querySelector("#global_actions .playerAvatar");
        self.profileUrl = avatarNode ? avatarNode.getAttribute("href") : false;
        self.profilePath = self.profileUrl && (self.profileUrl.match(/\/(?:id|profiles)\/(.+?)\/$/) || [null])[0];

        if (!self.profilePath) {
            _promise = Promise.resolve();
            return _promise;
        }

        let userLogin = LocalData.get("userLogin");
        if (userLogin && userLogin.profilePath === self.profilePath) {
            self.isSignedIn = true;
            self.steamId = userLogin.steamId;
            _promise = Promise.resolve();
            return _promise;
        }

        _promise = _fetch();

        return _promise;
    };

    self.then = function(onDone, onCatch) {
        return self.promise().then(onDone, onCatch);
    };

    self.getAccountId = function(){
        if (accountId === false) {
            accountId = BrowserHelper.getVariableFromDom("g_AccountID", "int");
        }
        return accountId;
    };

    self.getSessionId = function() {
        if (sessionId === false) {
            sessionId = BrowserHelper.getVariableFromDom("g_sessionID", "string");
        }
        return sessionId;
    };

    self.getStoreSessionId = async function() {
        // TODO what's the minimal page we can load here to get sessionId?
        let storePage = await RequestData.getHttp("https://store.steampowered.com/news/");
        return BrowserHelper.getVariableFromText(storePage, "g_sessionID", "string");
    };

    self.getCountry = function() {
        let url = new URL(window.location.href);

        let country;
        if (url.searchParams && url.searchParams.has("cc")) {
            country = url.searchParams.get("cc");
        } else {
            country = LocalData.get("userCountry");
            if (!country) {
                country = BrowserHelper.getCookie("steamCountry");
            }
        }

        if (!country) { return null; }
        return country.substr(0, 2);
    };

    let _purchaseDataPromise = null;
    self.getPurchaseDate = function(lang, appName) {
        if (_purchaseDataPromise) { return _purchaseDataPromise; }

        _purchaseDataPromise = new Promise(function(resolve, reject) {
            let purchaseDates = LocalData.get("purchase_dates", {});

            appName = StringUtils.clearSpecialSymbols(appName);

            // Return date from cache
            if (purchaseDates && purchaseDates[lang] && purchaseDates[lang][appName]) {
                resolve(purchaseDates[lang][appName]);
                return;
            }

            let lastUpdate = LocalData.get("purchase_dates_time", 0);

            // Update cache if needed
            if (!TimeHelper.isExpired(lastUpdate, 300)) {
                resolve();
                return;
            }

            RequestData.getHttp("https://store.steampowered.com/account/licenses/?l=" + lang).then(result => {
                let replaceRegex = [
                    /- Complete Pack/ig,
                    /Standard Edition/ig,
                    /Steam Store and Retail Key/ig,
                    /- Hardware Survey/ig,
                    /ComputerGamesRO -/ig,
                    /Founder Edition/ig,
                    /Retail( Key)?/ig,
                    /Complete$/ig,
                    /Launch$/ig,
                    /Free$/ig,
                    /(RoW)/ig,
                    /ROW/ig,
                    /:/ig,
                ];

                purchaseDates[lang] = {};

                let dummy = document.createElement("html");
                dummy.innerHTML = result;

                let nodes = dummy.querySelectorAll("#main_content td.license_date_col");

                for (let i=0, len=nodes.length; i<len; i++) {
                    let node = nodes[i];

                    let nameNode = node.nextElementSibling;
                    let removeNode = nameNode.querySelector("div");
                    if (removeNode) { removeNode.remove(); }

                    // Clean game name
                    let gameName = StringUtils.clearSpecialSymbols(nameNode.textContent.trim());

                    replaceRegex.forEach(regex => {
                        gameName = gameName.replace(regex, "");
                    });

                    purchaseDates[lang][gameName.trim()] = node.textContent;
                }

                LocalData.set("purchase_dates", purchaseDates);
                LocalData.set("purchase_dates_time", TimeHelper.timestamp());

                resolve(purchaseDates[lang][appName]);
            }, reject);
        });
        return _purchaseDataPromise;
    };

    return self;
})();


let StringUtils = (function(){

    let self = {};

    self.clearSpecialSymbols = function(string) {
        return string.replace(/[\u00AE\u00A9\u2122]/g, "");
    };

    return self;
})();


let Currency = (function() {

    let self = {};

    self.userCurrency = "USD";
    self.pageCurrency = null;

    let currencySymbols = {
        "pуб": "RUB",
        "€": "EUR",
        "£": "GBP",
        "R$": "BRL",
        "¥": "JPY",
        "kr": "NOK",
        "Rp": "IDR",
        "RM": "MYR",
        "P": "PHP",
        "S$": "SGD",
        "฿": "THB",
        "₫": "VND",
        "₩": "KRW",
        "TL": "TRY",
        "₴": "UAH",
        "Mex$": "MXN",
        "CDN$": "CAD",
        "A$": "AUD",
        "HK$": "HKD",
        "NT$": "TWD",
        "₹": "INR",
        "SR": "SAR",
        "R ": "ZAR",
        "DH": "AED",
        "CHF": "CHF",
        "CLP$": "CLP",
        "S/.": "PEN",
        "COL$": "COP",
        "NZ$": "NZD",
        "ARS$": "ARS",
        "₡": "CRC",
        "₪": "ILS",
        "₸": "KZT",
        "KD": "KWD",
        "zł": "PLN",
        "QR": "QAR",
        "$U": "UYU"
    };

    const typeToNumberMap = {
        "RUB": 5,
        "EUR": 3,
        "GBP": 2,
        "PLN": 6,
        "BRL": 7,
        "JPY": 8,
        "NOK": 9,
        "IDR": 10,
        "MYR": 11,
        "PHP": 12,
        "SGD": 13,
        "THB": 14,
        "VND": 15,
        "KRW": 16,
        "TRY": 17,
        "UAH": 18,
        "MXN": 19,
        "CAD": 20,
        "AUD": 21,
        "NZD": 22,
        "CNY": 23,
        "INR": 24,
        "CLP": 25,
        "PEN": 26,
        "COP": 27,
        "ZAR": 28,
        "HKD": 29,
        "TWD": 30,
        "SAR": 31,
        "AED": 32,
        "ARS": 34,
        "ILS": 35,
        "KZT": 37,
        "KWD": 38,
        "QAR": 39,
        "CRC": 40,
        "UYU": 41
    };
    Object.freeze(typeToNumberMap);
    
    const numberToTypeMap = {};
    for (let [abbr, num] of Object.entries(typeToNumberMap)) {
        numberToTypeMap[num] = abbr;
    }
    Object.freeze(numberToTypeMap);

    let _rates = {};
    let _promise = null;

    // load user currency
    self.promise = function() {
        if (_promise) { return _promise; }

        _promise = new Promise(function(resolve, reject) {
            (new Promise(function(resolve, reject) {
                let currencySetting = SyncedStorage.get("override_price");

                if (currencySetting !== "auto") {
                    self.userCurrency = currencySetting;
                    resolve();
                    return;
                }

                let currencyCache = LocalData.get("user_currency", {});
                if (currencyCache.userCurrency && currencyCache.userCurrency.currencyType && TimeHelper.isExpired(currencyCache.userCurrency.updated, 3600)) {
                    self.userCurrency = currencyCache.userCurrency.currencyType;
                    resolve();
                } else {
                    RequestData.getHttp("//store.steampowered.com/steamaccount/addfunds", { withCredentials: true })
                        .then(
                            response => {
                                let dummyHtml = document.createElement("html");
                                dummyHtml.innerHTML = response;

                                self.userCurrency = dummyHtml.querySelector("input[name=currency]").value;
                                LocalData.set("user_currency", {currencyType: self.userCurrency, updated: TimeHelper.timestamp()})
                            },
                            () => {
                                Background.action('currency.from.app')
                                    .then(currency => {
                                        self.userCurrency = currency;
                                        LocalData.set("user_currency", {currencyType: self.userCurrency, updated: TimeHelper.timestamp()})
                                    });
                            }
                        )
                        .finally(resolve);
                }
            })).finally(() => {
                RequestData.getApi("v01/rates", { to: self.userCurrency })
                    .then(result => {
                        _rates = result.data;
                        resolve();
                    }, reject);
            });
        });

        return _promise;
    };

    self.then = function(onDone, onCatch) {
        return self.promise().then(onDone, onCatch);
    };

    self.getRate = function(from, to) {
        if (from === to) { return 1; }

        if (_rates[from] && _rates[from][to]) {
            return _rates[from][to];
        }

        return null;
    };

    self.getCurrencySymbolFromString = function(str) {
        let re = /(?:R\$|S\$|\$|RM|kr|Rp|€|¥|£|฿|pуб|P|₫|₩|TL|₴|Mex\$|CDN\$|A\$|HK\$|NT\$|₹|SR|R |DH|CHF|CLP\$|S\/\.|COL\$|NZ\$|ARS\$|₡|₪|₸|KD|zł|QR|\$U)/;
        let match = str.match(re);
        return match ? match[0] : '';
    };

    self.getCurrencyFromDom = function () {
        let currencyNode = document.querySelector('meta[itemprop="priceCurrency"]');
        if (currencyNode && currencyNode.hasAttribute("content")) return currencyNode.getAttribute("content");
        return null;
    };

    self.getMemoizedCurrencyFromDom = function() {
        if(!self.pageCurrency) {
            self.pageCurrency = self.getCurrencyFromDom();
        }
        return self.pageCurrency;
    };

    self.currencySymbolToType = function(symbol) {
        return currencySymbols[symbol] || "USD";
    };

    self.currencyTypeToNumber = function(type) {
        return typeToNumberMap[type] || 1;
    };

    self.currencyNumberToType = function(number) {
        return numberToTypeMap[number] || "USD";
    };

    return self;
})();

let Price = (function() {

    let format = {
        "BRL": { places: 2, hidePlacesWhenZero: false, symbolFormat: "R$ ", thousand: ".", decimal: ",", right: false },
        "EUR": { places: 2, hidePlacesWhenZero: false, symbolFormat: "€", thousand: " ", decimal: ",", right: true },
        "GBP": { places: 2, hidePlacesWhenZero: false, symbolFormat: "£", thousand: ",", decimal: ".", right: false },
        "RUB": { places: 2, hidePlacesWhenZero: true,  symbolFormat: " pуб.", thousand: "", decimal: ",", right: true },
        "JPY": { places: 0, hidePlacesWhenZero: false, symbolFormat: "¥ ", thousand: ",", decimal: ".", right: false },
        "CNY": { places: 0, hidePlacesWhenZero: false, symbolFormat: "¥ ", thousand: ",", decimal: ".", right: false },
        "MYR": { places: 2, hidePlacesWhenZero: false, symbolFormat: "RM", thousand: ",", decimal: ".", right: false },
        "NOK": { places: 2, hidePlacesWhenZero: false, symbolFormat: " kr", thousand: ".", decimal: ",", right: true },
        "IDR": { places: 0, hidePlacesWhenZero: false, symbolFormat: "Rp ", thousand: " ", decimal: ".", right: false },
        "PHP": { places: 2, hidePlacesWhenZero: false, symbolFormat: "P", thousand: ",", decimal: ".", right: false },
        "SGD": { places: 2, hidePlacesWhenZero: false, symbolFormat: "S$", thousand: ",", decimal: ".", right: false },
        "THB": { places: 2, hidePlacesWhenZero: false, symbolFormat: "฿", thousand: ",", decimal: ".", right: false },
        "VND": { places: 2, hidePlacesWhenZero: false, symbolFormat: "₫", thousand: ",", decimal: ".", right: false },
        "KRW": { places: 2, hidePlacesWhenZero: false, symbolFormat: "₩", thousand: ",", decimal: ".", right: false },
        "TRY": { places: 2, hidePlacesWhenZero: false, symbolFormat: " TL", thousand: "", decimal: ",", right: true },
        "UAH": { places: 2, hidePlacesWhenZero: false, symbolFormat: "₴", thousand: "", decimal: ",", right: true },
        "MXN": { places: 2, hidePlacesWhenZero: false, symbolFormat: "Mex$ ", thousand: ",", decimal: ".", right: false },
        "CAD": { places: 2, hidePlacesWhenZero: false, symbolFormat: "CDN$ ", thousand: ",", decimal: ".", right: false },
        "AUD": { places: 2, hidePlacesWhenZero: false, symbolFormat: "A$ ", thousand: ",", decimal: ".", right: false },
        "NZD": { places: 2, hidePlacesWhenZero: false, symbolFormat: "NZ$ ", thousand: ",", decimal: ".", right: false },
        "HKD": { places: 2, hidePlacesWhenZero: false, symbolFormat: "HK$ ", thousand: ",", decimal: ".", right: false },
        "TWD": { places: 0, hidePlacesWhenZero: false, symbolFormat: "NT$ ", thousand: ",", decimal: ".", right: false },
        "INR": { places: 0, hidePlacesWhenZero: false, symbolFormat: "₹ ", thousand: ",", decimal: ".", right: false },
        "SAR": { places: 2, hidePlacesWhenZero: false, symbolFormat: " SR", thousand: ",", decimal: ".", right: true },
        "ZAR": { places: 2, hidePlacesWhenZero: false, symbolFormat: "R ", thousand: " ", decimal: ".", right: false },
        "AED": { places: 2, hidePlacesWhenZero: false, symbolFormat: " DH", thousand: ",", decimal: ".", right: true },
        "CHF": { places: 2, hidePlacesWhenZero: false, symbolFormat: "CHF ", thousand: "'", decimal: ".", right: false },
        "CLP": { places: 0, hidePlacesWhenZero: true, symbolFormat: "CLP$ ", thousand: ".", decimal: ",", right: false },
        "PEN": { places: 2, hidePlacesWhenZero: false, symbolFormat: "S/.", thousand: ",", decimal: ".", right: false },
        "COP": { places: 0, hidePlacesWhenZero: true, symbolFormat: "COL$ ", thousand: ".", decimal: ",", right: false },
        "ARS": { places: 2, hidePlacesWhenZero: false, symbolFormat: "ARS$ ", thousand: ".", decimal: ",", right: false },
        "CRC": { places: 2, hidePlacesWhenZero: false, symbolFormat: "₡", thousand: ".", decimal: ",", right: false },
        "ILS": { places: 2, hidePlacesWhenZero: false, symbolFormat: "₪", thousand: ",", decimal: ".", right: false },
        "KZT": { places: 2, hidePlacesWhenZero: true, symbolFormat: "₸ ", thousand: " ", decimal: ".", right: false },
        "KWD": { places: 3, hidePlacesWhenZero: false, symbolFormat: " KD", thousand: ",", decimal: ".", right: true },
        "PLN": { places: 2, hidePlacesWhenZero: false, symbolFormat: " zł", thousand: " ", decimal: ",", right: true },
        "QAR": { places: 2, hidePlacesWhenZero: false, symbolFormat: " QR", thousand: ",", decimal: ".", right: true },
        "UYU": { places: 0, hidePlacesWhenZero: true, symbolFormat: "$U", thousand: ",", decimal: ".", right: false },
        "USD": { places: 2, hidePlacesWhenZero: false, symbolFormat: "$", thousand: ",", decimal: ".", right: false }
    };

    function Price(value, currency, convert) {
        this.value = value || 0;
        this.currency = currency || Currency.userCurrency;

        if (convert !== false) {
            let chosenCurrency = SyncedStorage.get("override_price");
            if (chosenCurrency === "auto") { chosenCurrency = Currency.userCurrency; }
            let rate = Currency.getRate(this.currency, chosenCurrency);

            if (rate) {
                this.value *= rate;
                this.currency = chosenCurrency;
            }
        }
    }

    Price.prototype.toString = function() {
        let info = format[this.currency];
        if (info.hidePlacesWhenZero && (this.value % 1 === 0)) {
            info.places = 0;
        }

        let negative = this.value < 0 ? "-" : "";
        let i = Math.trunc(Math.abs(this.value)).toFixed(0);
        let j = i.length > 3 ? i.length % 3 : 0;

        let formatted = negative;
        if (j > 0) { formatted += i.substr(0, j) + info.thousand; }
        formatted += i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + info.thousand);
        formatted += (info.places ? info.decimal + Math.abs(this.value - parseInt(i)).toFixed(info.places).slice(2) : "");

        return info.right
            ? formatted + info.symbolFormat
            : info.symbolFormat + formatted
    };

    Price.parseFromString = function(str, convert) {
        let currencySymbol = Currency.getCurrencySymbolFromString(str);
        let currencyType = Currency.getMemoizedCurrencyFromDom() || Currency.currencySymbolToType(currencySymbol);

        if (Currency.userCurrency && format[Currency.userCurrency].symbolFormat === format[currencyType].symbolFormat) {
            currencyType = Currency.userCurrency;
        }

        // let currencyNumber = currencyTypeToNumber(currencyType);
        let info = format[currencyType];

        // remove thousand sep, replace decimal with dot, remove non-numeric
        str = str
            .replace(info.thousand, '')
            .replace(info.decimal, '.')
            .replace(/[^\d\.]/g, '')
            .trim();

        let value = parseFloat(str);

        if (isNaN(value)) {
            return null;
        }

        return new Price(value, currencyType, convert);
    };


    return Price;
})();

let Language = (function(){

    let self = {};

    self.languages = {
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
        "ukrainian": "ua"
    };

    let currentSteamLanguage = null;

    self.getCurrentSteamLanguage = function() {
        if (currentSteamLanguage != null) {
            return currentSteamLanguage;
        }

        let nodes = document.querySelectorAll("script[src]");

        for (let i=0; i<nodes.length; i++) {
            let src = nodes[i].getAttribute("src");
            let match = src.match(/(?:\?|&(?:amp;)?)l=([^&]+)/);
            if (match) {
                currentSteamLanguage = match[1];
                return currentSteamLanguage;
            }
        }

        currentSteamLanguage = BrowserHelper.getCookie("Steam_Language") || "english";
        return currentSteamLanguage;
    };

    self.getLanguageCode = function(language) {
        return self.languages[language] ? self.languages[language].toLowerCase() : "en";
    };

    self.isCurrentLanguageOneOf = function(array) {
        return array.indexOf(self.getCurrentSteamLanguage()) !== -1;
    };

    return self;
})();

let BrowserHelper = (function(){

    let self = {};

    self.getCookie = function(name) {
        let re = new RegExp(name + "=([^;]+)");
        let value = re.exec(document.cookie);
        return (value != null) ? unescape(value[1]) : null;
    };

    self.escapeHTML = function(str) {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') ;
    };

    // only concerned with vertical at this point
    self.isElementInViewport = function(elem) {
        let elemTop = elem.offsetTop;
        let parent = elem.offsetParent;
        while (parent) {
            elemTop += parent.offsetTop;
            parent = parent.offsetParent;
        }

        let elemBottom = elemTop + elem.getBoundingClientRect().height;
        let viewportTop = window.scrollY;
        let viewportBottom = window.innerHeight + viewportTop;

        return (elemBottom <= viewportBottom && elemTop >= viewportTop);
    };


    self.htmlToDOM = function(html) {
        let template = document.createElement('template');
        html = html.trim(); // Never return a text node of whitespace as the result
        template.innerHTML = html;
        return template.content;
    };

    self.htmlToElement = function(html) {
        return self.htmlToDOM(html).firstElementChild;
    };

    self.getVariableFromText = function(text, variableName, type) {
        let regex;
        if (type === "object") {
            regex = new RegExp(variableName+"\\s*=\\s*(\\{.+?\\});");
        } else if (type === "array") { // otherwise array
            regex = new RegExp(variableName+"\\s*=\\s*(\\[.+?\\]);");
        } else if (type === "int") {
            regex = new RegExp(variableName+"\\s*=\\s*(.+?);");
        } else if (type === "string") {
            regex = new RegExp(variableName+"\\s*=\\s*(\\\".+?\\\");");
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
    };

    self.getVariableFromDom = function(variableName, type, dom) {
        dom = dom || document;
        let nodes = dom.querySelectorAll("script");
        for (let node of nodes) {
            let m = self.getVariableFromText(node.textContent, variableName, type)
            if (m) {
                return m;
            }
        }
    };

    return self;
})();

let EnhancedSteam = (function() {

    let self = {};

    self.checkVersion = function() {
        let version = LocalData.get("version");

        if (!version) {
            // new instalation detected
            LocalData.set("version", Info.version);
            return;
        }

        if (version === Info.version || !SyncedStorage.get("version_show")) {
            return;
        }

        RequestData.getHttp(ExtensionLayer.getLocalUrl("changelog_new.html")).then(
            changelog => {
                changelog = changelog.replace(/\r|\n/g, "").replace(/'/g, "\\'");
                let logo = ExtensionLayer.getLocalUrl("img/es_128.png");
                let dialog = "<div style=\"height:100%; display:flex; flex-direction:row;\"><div style=\"float: left; margin-right: 21px;\">"
                    + "<img src=\""+ logo +"\"></div>"
                    + "<div style=\"float: right;\">" + Localization.str.update.changes.replace(/'/g, "\\'")
                    + ":<ul class=\"es_changelog\">" + changelog + "</ul></div>" +
                    "</div>";
                ExtensionLayer.runInPageContext(
                    "function() {\
                        var prompt = ShowConfirmDialog(\"" + Localization.str.update.updated.replace("__version__", Info.version) + "\", '" + dialog + "' , 'OK', '" + Localization.str.close.replace(/'/g, "\\'") + "', '" + Localization.str.update.dont_show.replace(/'/g, "\\'") + "'); \
						prompt.done(function(result) {\
							if (result == 'SECONDARY') { window.postMessage({ type: 'es_sendmessage_change', information: [ true ]}, '*'); }\
						});\
					}"
                );
            }
        );
        LocalData.set("version", Info.version);

        window.addEventListener("message", function(event) {
            if (event.source !== window) return;
            if (event.data.type && (event.data.type === "es_sendmessage_change")) {
                SyncedStorage.set("version_show", false);
            }
        }, false);
    };

    self.addMenu = function() {
        document.querySelector("#global_action_menu").insertAdjacentHTML("afterBegin", `
            <div id="es_menu">
                <span id="es_pulldown" class="pulldown global_action_link">Augmented Steam</span>
                <div id="es_popup" class="popup_block_new">
                    <div class="popup_body popup_menu">
                        <a class="popup_menu_item" target="_blank" href="${ExtensionLayer.getLocalUrl("options.html")}">${Localization.str.thewordoptions}</a>
                        <a class="popup_menu_item" id="es_clear_cache" href="#clear_cache">${Localization.str.clear_cache}</a>
                        <div class="hr"></div>
                        <a class="popup_menu_item" target="_blank" href="https://github.com/tfedor/Enhanced_Steam">${Localization.str.contribute}</a>
                        <a class="popup_menu_item" target="_blank" href="https://github.com/tfedor/Enhanced_Steam/issues">${Localization.str.bug_feature}</a>
                        <div class="hr"></div>
                        <a class="popup_menu_item" target="_blank" href="https://es.isthereanydeal.com/">${Localization.str.website}</a>
                        <a class="popup_menu_item" target="_blank" href="https://isthereanydeal.com/">IsThereAnyDeal</a>
                        <a class="popup_menu_item" target="_blank" href="https://discord.gg/yn57q7f">Discord</a>
                    </div>
                </div>
            </div>
        `);

        let popup = document.querySelector("#es_popup");
        document.querySelector("#es_pulldown").addEventListener("click", function(){
            let width = document.querySelector("#es_pulldown").getBoundingClientRect().width - 19; // padding
            popup.style.left = "-" + width + "px";
            popup.classList.toggle("open");
        });

        document.querySelector("#es_menu").addEventListener("click", function(e){
            e.stopPropagation();
        });

        document.addEventListener("click", function(){
            popup.classList.remove("open");
        });

        document.querySelector("#es_clear_cache").addEventListener("click", function(e){
            e.preventDefault();

            self.clearCache();
            window.location.reload();
        });

    };

    self.clearCache = function() {
        localStorage.clear();
        SyncedStorage.remove("user_currency");
        SyncedStorage.remove("store_sessionid");
        DynamicStore.clear();
        Background.action('dynamicstore.clear');
        Background.action('api.cache.clear');
    };

    self.bindLogout = function(){
        // TODO there should be a better detection of logout, probably
        let logoutNode = document.querySelector("a[href$='javascript:Logout();']");
        logoutNode.addEventListener("click", function(e) {
            self.clearCache();
        });
    };

    /**
     * Display warning if browsing using a different language
     */
    self.addLanguageWarning = function() {
        if (!SyncedStorage.get("showlanguagewarning")) { return; }

        let currentLanguage = Language.getCurrentSteamLanguage().toLowerCase();
        let warningLanguage = SyncedStorage.get("showlanguagewarninglanguage").toLowerCase();

        if (currentLanguage === warningLanguage) { return; }

        Localization.loadLocalization(Language.getLanguageCode(warningLanguage)).then(function(strings){
            document.querySelector("#global_header").insertAdjacentHTML("afterend", `
                <div class="es_language_warning">` + strings.using_language.replace("__current__", strings.options.lang[currentLanguage] || currentLanguage) + `
                    <a href="#" id="es_reset_language_code">` + strings.using_language_return.replace("__base__", strings.options.lang[warningLanguage] || warningLanguage) + `</a>
                </div>
            `);

            document.querySelector("#es_reset_language_code").addEventListener("click", function(e){
                e.preventDefault();
                ExtensionLayer.runInPageContext("function(){ ChangeLanguage( '" + warningLanguage + "' ); }");
            });
        });
    };

    self.removeInstallSteamButton = function() {
        if (!SyncedStorage.get("hideinstallsteambutton")) { return; }
        document.querySelector("div.header_installsteam_btn").remove();
    };

    self.removeAboutMenu = function(){
        if (!SyncedStorage.get("hideaboutmenu")) { return; }
		
        let aboutMenu = document.querySelector(".menuitem[href='https://store.steampowered.com/about/']");
        if (aboutMenu == null) { return; }
		
        aboutMenu.remove();
    };

    self.addHeaderLinks = function(){
        if (!User.isSignedIn || document.querySelector(".supernav_container").length === 0) { return; }

        let submenuUsername = document.querySelector(".supernav_container .submenu_username");
        submenuUsername.querySelector("a").insertAdjacentHTML("afterend", `<a class="submenuitem" href="//steamcommunity.com/my/games/">${Localization.str.games}</a>`);
        submenuUsername.insertAdjacentHTML("beforeend", `<a class="submenuitem" href="//steamcommunity.com/my/recommended/">${Localization.str.reviews}</a>`);
    };

    self.disableLinkFilter = function(){
        if (!SyncedStorage.get("disablelinkfilter")) { return; }

        removeLinksFilter();

        let observer = new MutationObserver(removeLinksFilter);
        observer.observe(document, {attributes: true, childList: true});

        function removeLinksFilter() {
            let nodes = document.querySelectorAll("a.bb_link[href*='/linkfilter/'], div.weblink a[href*='/linkfilter/']");
            for (let i=0, len=nodes.length; i<len; i++) {
                let node = nodes[i];
                if (!node.hasAttribute("href")) { continue; }
                node.setAttribute("href", node.getAttribute("href").replace(/^.+?\/linkfilter\/\?url=/, ""));
            }
        }
    };

    self.addRedeemLink = function() {
        document.querySelector("#account_dropdown .popup_menu_item:last-child:not(.tight)")
            .insertAdjacentHTML("beforebegin", `<a class='popup_menu_item' href='https://store.steampowered.com/account/registerkey'>${Localization.str.activate}</a>`);
    };

    self.replaceAccountName = function() {
        if (!SyncedStorage.get("replaceaccountname")) { return; }

        let accountNameNode = document.querySelector("#account_pulldown");
        let accountName = accountNameNode.textContent.trim();
        let communityName = document.querySelector("#global_header .username").textContent.trim();

        accountNameNode.textContent = communityName;
        document.title = document.title.replace(accountName, communityName);
    };

    self.launchRandomButton = function() {

        document.querySelector("#es_popup .popup_menu")
            .insertAdjacentHTML("beforeend", `<div class='hr'></div><a id='es_random_game' class='popup_menu_item' style='cursor: pointer;'>${Localization.str.launch_random}</a>`);

        document.querySelector("#es_random_game").addEventListener("click", async function(){
            let result = await DynamicStore;
            if (!result.rgOwnedApps) { return; }
            let appid = result.rgOwnedApps[Math.floor(Math.random() * result.rgOwnedApps.length)];

            RequestData.getJson("//store.steampowered.com/api/appdetails/?appids="+appid).then(response => {
                if (!response || !response[appid] || !response[appid].success) { return; }
                let data = response[appid].data;

                let gameid = appid;
                let gamename;
                if (data.fullgame) {
                    gameid = data.fullgame.appid;
                    gamename = data.fullgame.name;
                } else {
                    gamename = data.name;
                }

                let playGameStr = Localization.str.play_game.replace("__gamename__", gamename.replace("'", "").trim());
                ExtensionLayer.runInPageContext(
                    `function() {
                        var prompt = ShowConfirmDialog('${playGameStr}', "<img src='//steamcdn-a.akamaihd.net/steam/apps/${gameid}/header.jpg'>", null, null, '${Localization.str.visit_store}');
                        prompt.done(function(result) {
                            if (result == 'OK') { window.location.assign('steam://run/${gameid}'); }
                            if (result == 'SECONDARY') { window.location.assign('//store.steampowered.com/app/${gameid}'); }
                        });
                    }`);
            });

        });
    };

    self.skipGotSteam = function() {
        if (!SyncedStorage.get("skip_got_steam")) { return; }

        let node = document.querySelector("a[href^='javascript:ShowGotSteamModal']");
        if (!node) { return; }
        node.setAttribute("href", node.getAttribute("href").split("'")[1]);
    };

    self.keepSteamSubscriberAgreementState = function() {
        let nodes = document.querySelectorAll("#market_sell_dialog_accept_ssa,#market_buynow_dialog_accept_ssa,#accept_ssa");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            node.checked = SyncedStorage.get("keepssachecked");

            node.addEventListener("click", function(){
                SyncedStorage.set("keepssachecked", !SyncedStorage.get("keepssachecked"));
            });
        }
    };

    self.alternateLinuxIcon = function(){
        if (!SyncedStorage.get("show_alternative_linux_icon")) { return; }
        let url = ExtensionLayer.getLocalUrl("img/alternative_linux_icon.png");
        document.querySelector("head")
            .insertAdjacentHTML("beforeend", "<style>span.platform_img.linux {background-image: url("+url+");}</style>")
    };

    // Hide Trademark and Copyright symbols in game titles for Community pages
    self.hideTrademarkSymbol = function(community) {
        if (!SyncedStorage.get("hidetmsymbols")) { return; }

        // TODO I would try to reduce number of selectors here
        let selectors= "title, .apphub_AppName, .breadcrumbs, h1, h4";
        if(community){
            selectors += ".game_suggestion, .appHubShortcut_Title, .apphub_CardContentNewsTitle, .apphub_CardTextContent, .apphub_CardContentAppName, .apphub_AppName";
        } else {
            selectors += ".game_area_already_owned, .details_block, .game_description_snippet, .game_area_description, .glance_details, .game_area_dlc_bubble game_area_bubble, .package_contents, .game_area_dlc_name, .tab_desc, .tab_item_name";
        }

        // Replaces "R", "C" and "TM" signs
        function replaceSymbols(node){
            // tfedor I don't trust this won't break any inline JS
            if (!node ||!node.innerHTML) { return; }
            node.innerHTML = node.innerHTML.replace(/[\u00AE\u00A9\u2122]/g, "")
        }

        let nodes = document.querySelectorAll(selectors);
        for (let i=0, len=nodes.length; i<len; i++) {
            replaceSymbols(nodes[i]);
        }

        let observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    replaceSymbols(node);
                });
            });
        });
        
        nodes = document.querySelectorAll("#game_select_suggestions,#search_suggestion_contents,.tab_content_ctn");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            observer.observe(node, {childList:true, subtree:true});

        }
    };

    return self;
})();


let GameId = (function(){
    let self = {};

    function parseId(id) {
        if (!id) { return null; }

        let intId = parseInt(id);
        if (!intId) { return null; }

        return intId;
    }

    self.getAppid = function(text) {
        if (!text) { return null; }

        // app, market/listing
        let m = text.match(/(?:store\.steampowered|steamcommunity)\.com\/(app|market\/listings)\/(\d+)\/?/);
        return m && parseId(m[2]);
    };

    self.getSubid = function(text) {
        if (!text) { return null; }

        let m = text.match(/(?:store\.steampowered|steamcommunity)\.com\/(sub|bundle)\/(\d+)\/?/);
        return m && parseId(m[2]);
    };


    self.getAppidImgSrc = function(text) {
        if (!text) { return null; }
        let m = text.match(/(steamcdn-a\.akamaihd\.net\/steam|steamcommunity\/public\/images)\/apps\/(\d+)\//);
        return m && parseId(m[2]);
    };

    self.getAppids = function(text) {
        let regex = /(?:store\.steampowered|steamcommunity)\.com\/app\/(\d+)\/?/g;
        let res = [];
        let m;
        while ((m = regex.exec(text)) != null) {
            let id = parseId(m[1]);
            if (id) {
                res.push(id);
            }
        }
        return res;
    };

    self.getAppidWishlist = function(text) {
        if (!text) { return null; }
        let m = text.match(/game_(\d+)/);
        return m && parseId(m[1]);
    };

    self.getAppidFromGameCard = function(text) {
        if (!text) { return null; }
        let m = text.match(/\/gamecards\/(\d+)/);
        return m && parseId(m[1]);
    };

    return self;
})();


let DOMHelper = (function(){

    let self = {};

    self.wrap = function(container, node) {
        let parent = node.parentNode;
        parent.insertBefore(container, node);
        parent.removeChild(node);
        container.append(node);
    };

    self.remove = function(selector) {
        let node = document.querySelector(selector);
        if (!node) { return; }
        node.remove();
    };

    // TODO extend Node itself?
    self.selectLastNode = function(parent, selector) {
        let nodes = parent.querySelectorAll(selector);
        return nodes.length !== 0 ? nodes[nodes.length-1] : null;
    };

    return self;
})();


let EarlyAccess = (function(){

    let self = {};

    let cache = new Set();
    let imageUrl;

    function checkNodes(selectors, selectorModifier) {
        selectorModifier = typeof selectorModifier === "string" ? selectorModifier : "";

        selectors.forEach(selector => {
            let nodes = document.querySelectorAll(selector+":not(.es_ea_checked)");
            for (let i=0; i<nodes.length; i++) {
                let node = nodes[i];
                node.classList.add("es_ea_checked");

                let linkNode = node.querySelector("a");
                let href = linkNode && linkNode.hasAttribute("href") ? linkNode.getAttribute("href") : node.getAttribute("href");
                let imgHeader = node.querySelector("img" + selectorModifier);
                let appid = GameId.getAppid(href) || GameId.getAppidImgSrc(imgHeader ? imgHeader.getAttribute("src") : null);

                if (appid && cache.has(appid)) {
                    node.classList.add("es_early_access");

                    let container = document.createElement("span");
                    container.classList.add("es_overlay_container");
                    DOMHelper.wrap(container, imgHeader);

                    container.insertAdjacentHTML("afterbegin", `<span class="es_overlay"><img title="${Localization.str.early_access}" src="${imageUrl}" /></span>`);
                }
            }
        });
    }

    function handleStore() {
        // TODO refactor these checks to appropriate page calls
        switch (true) {
            case /^\/app\/.*/.test(window.location.pathname):
                checkNodes([".game_header_image_ctn", ".small_cap"]);
                break;
            case /^\/(?:genre|browse|tag)\/.*/.test(window.location.pathname):
                checkNodes([".tab_item",
                           ".special_tiny_cap",
                           ".cluster_capsule",
                           ".game_capsule",
                           ".browse_tag_game",
                           ".dq_item:not(:first-child)",
                           ".discovery_queue:not(:first-child)"]);
                break;
            case /^\/search\/.*/.test(window.location.pathname):
                checkNodes([".search_result_row"]);
                break;
            case /^\/recommended/.test(window.location.pathname):
                checkNodes([".friendplaytime_appheader",
                           ".header_image",
                           ".appheader",
                           ".recommendation_carousel_item .carousel_cap",
                           ".game_capsule",
                           ".game_capsule_area",
                           ".similar_grid_capsule"]);
                break;
            case /^\/tag\/.*/.test(window.location.pathname):
                checkNodes([".cluster_capsule",
                           ".tab_row",
                           ".browse_tag_game_cap"]);
                break;
            case /^\/$/.test(window.location.pathname):
                checkNodes( [".cap",
                           ".special",
                           ".game_capsule",
                           ".cluster_capsule",
                           ".recommended_spotlight_ctn",
                           ".curated_app_link",
                           ".dailydeal_ctn a",
                           ".tab_item:last-of-type"]);

                // Sales fields
                checkNodes([".large_sale_caps a", ".small_sale_caps a", ".spotlight_img"]);
                // checkNodes($(".sale_capsule_image").parent()); // TODO check/remove
                break;
        }
    }

    function handleCommunity() {
        // TODO refactor these checks to appropriate page calls
        switch(true) {
            // wishlist, games, and followedgames can be combined in one regex expresion
            case /^\/(?:id|profiles)\/.+\/(wishlist|games|followedgames)/.test(window.location.pathname):
                checkNodes([".gameListRowLogo"]);
                break;
            case /^\/(?:id|profiles)\/.+\/\b(home|myactivity)\b/.test(window.location.pathname):
                checkNodes([".blotter_gamepurchase_content a"]);
                break;
            case /^\/(?:id|profiles)\/.+\/\b(reviews|recommended)\b/.test(window.location.pathname):
                checkNodes([".leftcol"]);
                break;
            case /^\/(?:id|profiles)\/.+/.test(window.location.pathname):
                checkNodes([".game_info_cap",
                           ".showcase_gamecollector_game",
                           ".favoritegame_showcase_game"]);
                break;
            case /^\/app\/.*/.test(window.location.pathname):
                if (document.querySelector(".apphub_EarlyAccess_Title")) {
                    let container = document.createElement("span");
                    container.id = "es_ea_apphub";
                    DOMHelper.wrap(container, document.querySelector(".apphub_StoreAppLogo:first-of-type"));

                    checkNodes(["#es_ea_apphub"]);
                }
        }
    }

    self.showEarlyAccess = async function() {
        if (!SyncedStorage.get("show_early_access")) { return; }

        cache = new Set(await Background.action('early_access_appids'));

        let imageName = "img/overlay/early_access_banner_english.png";
        if (Language.isCurrentLanguageOneOf(["brazilian", "french", "italian", "japanese", "koreana", "polish", "portuguese", "russian", "schinese", "spanish", "latam", "tchinese", "thai"])) {
            imageName = "img/overlay/early_access_banner_" + Language.getCurrentSteamLanguage().toLowerCase() + ".png";
        }
        imageUrl = ExtensionLayer.getLocalUrl(imageName);
    
        switch (window.location.host) {
            case "store.steampowered.com":
                handleStore();
                break;
            case "steamcommunity.com":
                handleCommunity();
                break;
        }
    };

    return self;
})();


let Inventory = (function(){

    let self = {};

    let gifts = [];
    let guestpasses = [];
    let coupons = {};

    // Context ID 1 is gifts and guest passes
    function handleInventoryContext1(data) {
        if (!data || !data.success) return;

        LocalData.set("inventory_1", data);

        for(let [key, obj] of Object.entries(data.rgDescriptions)) {
            let isPackage = false;
            if (obj.descriptions) {
                for (let desc of obj.descriptions) {
                    if (desc.type === "html") {
                        let appids = GameId.getAppids(desc.value);
                        // Gift package with multiple apps
                        isPackage = true;
                        for (let appid of appids) {
                            if (!appid) { continue; }
                            if (obj.type === "Gift") {
                                gifts.push(appid);
                            } else {
                                guestpasses.push(appid);
                            }
                        }
                        break;
                    }
                }
            }

            // Single app
            if (!isPackage && obj.actions) {
                let appid = GameId.getAppid(obj.actions[0].link);
                if (appid) {
                    if (obj.type === "Gift") {
                        gifts.push(appid);
                    } else {
                        guestpasses.push(appid);
                    }
                }
            }

        }
    }

    // Community items?
    function handleInventoryContext6(data) {
        if (!data || !data.success) { return; }
        LocalData.set("inventory_6", data);
    }

    // Coupons
    function handleInventoryContext3(data) {
        if (!data || !data.success) { return; }
        LocalData.set("inventory_3", data);

        for(let [id, obj] of Object.entries(data.rgDescriptions)) {
            if (!obj.type || obj.type !== "Coupon") {
                continue;
            }
            if (!obj.actions) {
                continue;
            }

            let couponData = {
                image_url: obj.icon_url,
                title: obj.name,
                discount: obj.name.match(/([1-9][0-9])%/)[1],
                id: id
            };

            for (let i = 0; i < obj.descriptions.length; i++) {
                if (obj.descriptions[i].value.startsWith("Can't be applied with other discounts.")) {
                    Object.assign(couponData, {
                        discount_note: obj.descriptions[i].value,
                        discount_note_id: i,
                        discount_doesnt_stack: true
                    });
                } else if (obj.descriptions[i].value.startsWith("(Valid")) {
                    Object.assign(couponData, {
                        valid_id: i,
                        valid: obj.descriptions[i].value
                    });
                }
            }

            for (let j = 0; j < obj.actions.length; j++) {
                let link = obj.actions[j].link;
                let packageid = /http:\/\/store.steampowered.com\/search\/\?list_of_subs=([0-9]+)/.exec(link)[1];

                if (!coupons[packageid] || coupons[packageid].discount < couponData.discount) {
                    coupons[packageid] = couponData;
                }
            }
        }
    }

    let _promise = null;
    self.promise = function() {
        if (_promise) { return _promise; }
        _promise = new Promise(function(resolve, reject) {
            if (!User.isSignedIn) {
                resolve();
                return;
            }

            let lastUpdate = LocalData.get("inventory_update");
            let inv1 = LocalData.get("inventory_1");
            let inv3 = LocalData.get("inventory_3");
            let inv6 = LocalData.get("inventory_6");

            if (TimeHelper.isExpired(lastUpdate, 3600) || !inv1 || !inv3) {
                LocalData.set("inventory_update", Date.now());

                Promise.all([
                    RequestData.getJson(User.profileUrl + "inventory/json/753/1/?l=en", { withCredentials: true }).then(handleInventoryContext1),
                    RequestData.getJson(User.profileUrl + "inventory/json/753/3/?l=en", { withCredentials: true }).then(handleInventoryContext3),
                    RequestData.getJson(User.profileUrl + "inventory/json/753/6/?l=en", { withCredentials: true }).then(handleInventoryContext6),
                ]).then(resolve, reject);
            }
            else {
                // No need to load anything, its all in localStorage.
                handleInventoryContext1(inv1);
                handleInventoryContext3(inv3);
                handleInventoryContext6(inv6);

                resolve();
            }
        });
        return _promise;
    };

    self.getCoupon = function(subid) {
        return coupons && coupons[subid];
    };

    let inv6set = null;

    self.hasInInventory6 = function(marketHash) {
        if (!inv6set) {
            inv6set = new Set();
            let inv6 = LocalData.get("inventory_6");
            if (!inv6 || !inv6['rgDescriptions']) { return false; }

            for (let [key,item] of Object.entries(inv6.rgDescriptions)) {
                inv6set.add(item['market_hash_name']);
            }
        }

        return inv6set.has(marketHash);
    };

    return self;
})();

let Highlights = (function(){

    let self = {};

    let highlightCssLoaded = false;
    let tagCssLoaded = false;

    function classChecker(node, classList) {
        for (let i=0, len=classList.length; i < len; i++) {
            if (node.classList.contains(classList[i])) {
                return true;
            }
        }
        return false;
    }

    function hideNode(node) {
        let cls = node.classList;

        if (cls.contains("info") || cls.contains("dailydeal") || cls.contains("spotlight_content") || cls.contains("browse_tag_game_cap")) {
            node = node.parentNode;
        }

        if (SyncedStorage.get("hide_owned")
            && classChecker(node, ["search_result_row", "item", "cluster_capsule", "browse_tag_game"])) {
            node.style.display = "none";
        }

        // Hide DLC for unowned items
        if (SyncedStorage.get("hide_dlcunownedgames")
            && classChecker(node, ["search_result_row", "item", "game_area_dlc_row", "cluster_capsule"])) {
                node.style.display = "none";
        }
    }

    function addTag(node, tag) {
        let tagShort = SyncedStorage.get("tag_short");

        // Load the colors CSS for tags
        if (!tagCssLoaded) {
            tagCssLoaded = true;

            let tagCss = "";
            ["notinterested", "owned", "wishlist", "inv_guestpass", "coupon", "inv_gift"].forEach(name => {
                tagCss += '.es_tag_' + name + ' { background-color: ' + SyncedStorage.get("tag_"+name+"_color") + ' }\n';
            });
            document.querySelector("head").insertAdjacentHTML("beforeend", '<style id="es_tag_styles" type="text/css">' + tagCss + '</style>');
        }

        // Add the tags container if needed
        let tags = node.querySelectorAll(".es_tags");
        if (tags.length == 0) {
            tags = BrowserHelper.htmlToElement('<div class="es_tags' + (tagShort ? ' es_tags_short' : '') + '" />');

            let root;
            if (node.classList.contains("tab_row")) { // can't find it
                root = node.querySelector(".tab_desc").classList.remove("with_discount");

                node.querySelector(".tab_discount").style.top="15px";
                root.querySelector("h4").insertAdjacentElement("afterend", tags);
            }
            else if (node.classList.contains("home_smallcap")) {
                node.querySelector(".home_smallcap_title").insertAdjacentElement("afterbegin", tags);
            }
            else if (node.classList.contains("curated_app_item")) {
                node.querySelector(".home_headerv5_title").insertAdjacentElement("afterbegin", tags);
            }
            else if (node.classList.contains("tab_item")) {
                node.querySelector(".tab_item_name").insertAdjacentElement("afterend", tags);
            }
            else if (node.classList.contains("search_result_row")) {
                node.querySelector("p").insertAdjacentElement("afterbegin", tags);
            }
            else if (node.classList.contains("dailydeal")) { // can't find it
                root = node.parentNode;
                root.querySelector(".game_purchase_action").insertAdjacentElement("beforebegin", tags);
                root.querySelector(".game_purchase_action").insertAdjacentHTML("beforebegin",  + '<div style="clear: right;"></div>');
            }
            else if (node.classList.contains("small_cap")) {
                node.querySelector("h4").insertAdjacentElement("afterbegin", tags);
            }
            else if (node.classList.contains("browse_tag_game")) { // can't find it
                root = node;

                tags.style.display = "table";
                tags.style.marginLeft = "8px";
                root.querySelector(".browse_tag_game_price").insertAdjacentElement("afterend", tags);
            }
            else if (node.classList.contains("game_area_dlc_row")) {
                node.querySelector(".game_area_dlc_price").insertAdjacentElement("afterbegin", tags);
            }
            else if (node.classList.contains("wishlist_row")) {
                node.querySelector(".addedon").insertAdjacentElement("afterbegin", tags);
            }
            else if (node.classList.contains("match")) {
                node.querySelector(".match_price").insertAdjacentElement("afterbegin", tags);
            }
            else if (node.classList.contains("cluster_capsule")) {
                node.querySelector(".main_cap_platform_area").append($tags);
            }
            else if (node.classList.contains("recommendation_highlight")) { // can't find it
                root = node;

                if (document.querySelector(".game_purchase_action")) {
                    tags.style.float = "left";
                    root.querySelector(".game_purchase_action").insertAdjacentElement("beforebegin", tags);
                    root.querySelector(".game_purchase_action").insertAdjacentHTML("beforebegin",  + '<div style="clear: right;"></div>');
                } else {
                    tags.style.fload = "right";
                    root.querySelector(".price").parentNode.insertAdjacentElement("beforebegin", tags);
                }
            }
            else if (node.classList.contains("similar_grid_item")) { // can't find it
                root = node;
                tags.style.float = "right";
                root.querySelector(".similar_grid_price").querySelector(".price").append($tags);
            }
            else if (node.classList.contains("recommendation_carousel_item")) { // can't find it
                root = node;
                tags.style.float = "left";
                root.querySelector(".buttons").insertAdjacentElement("beforebegin", tags);
            }
            else if (node.classList.contains("friendplaytime_game")) { // can't find it
                root = node;
                tags.style.float = "left";
                root.querySelector(".friendplaytime_buttons").insertAdjacentElement("beforebegin", tags);
            }

            tags = [tags];
        }

        // Add the tag
        for (let i=0,len=tags.length; i<len; i++) {
            if (!tags[i].querySelector(".es_tag_" + tag)) {
                tags[i].insertAdjacentHTML("beforeend", '<span class="es_tag_' + tag + '">' + Localization.str.tag[tag] + '</span>');
            }
        }
    }

    function highlightNode(node) {
        if (SyncedStorage.get("highlight_excludef2p")) {

            if (node.innerHTML.match(/<div class="(tab_price|large_cap_price|col search_price|main_cap_price|price)">\n?(.+)?(Free to Play|Play for Free!)(.+)?<\/div>/i)) {
                return;
            }
            if (node.innerHTML.match(/<h5>(Free to Play|Play for Free!)<\/h5>/i)) {
                return;
            }
            if (node.innerHTML.match(/genre_release/) && node.querySelector(".genre_release").innerHTML.match(/Free to Play/i)) {
                return;
            }
            if (node.classList.contains("search_result_row") && node.innerHTML.match(/Free to Play/i)) {
                return;
            }
        }

        if (!highlightCssLoaded) {
            highlightCssLoaded = true;

            let hlCss = "";

            ["notinterested", "owned", "wishlist", "inv_guestpass", "coupon", "inv_gift"].forEach(name => {
                hlCss += '.es_highlighted_' + name + ' { background: ' + SyncedStorage.get("highlight_" + name + "_color") + ' linear-gradient(135deg, rgba(0, 0, 0, 0.70) 10%, rgba(0, 0, 0, 0) 100%) !important; }\n';
            });

            document.querySelector("head").insertAdjacentHTML("beforeend", '<style id="es_highlight_styles" type="text/css">' + hlCss + '</style>');
        }

        // Carousel item
        if (node.classList.contains("cluster_capsule")) {
            node = node.querySelector(".main_cap_content").parentNode;
        }

        // Genre Carousel items
        if (node.classList.contains("large_cap")) {
            node = node.querySelector(".large_cap_content");
        }

        node.classList.remove("ds_flagged");
        let r = node.querySelector(".ds_flag");
        if (r) { r.remove(); }

        r = node.querySelector(".ds_flagged");
        if (r) {
            r.classList.remove("ds_flagge");
        }
    }


    function highlightItem(node, name) {
        node.classList.add("es_highlight_checked");

        if (SyncedStorage.get("highlight_"+name)) {
            node.classList.add("es_highlighted", "es_highlighted_"+name);
            highlightNode(node);
        }

        if (SyncedStorage.get("tag_" + name)) {
            addTag(node, name);
        }
    }

    self.highlightOwned = function(node) {
        node.classList.add("es_highlight_checked");

        if (SyncedStorage.get("hide_owned")) {
            hideNode(node);
            return;
        }

        highlightItem(node, "owned");
    };

    self.highlightWishlist = function(node) {
        node.classList.add("es_highlight_checked");

        if (SyncedStorage.get("hide_wishlist")) {
            hideNode(node);
            return;
        }

        highlightItem(node, "wishlist");
    };

    self.highlightCart = function(node) {
        if (!SyncedStorage.get("hide_cart")) { return; }

        node.classList.add("es_highlight_checked", "es_highlighted", "es_highlighted_hidden");
        hideNode(node);
    };

    self.highlightCoupon = function(node) {
        highlightItem(node, "coupon");
    };

    // Color the tile for items in inventory
    self.highlightInvGift = function(node) {
        highlightItem(node, "inv_gift");
    };

    // Color the tile for items in inventory
    self.highlightInvGuestpass = function(node) {
        highlightItem(node, "inv_guestpass");
    };

    self.highlightNonDiscounts = function(node) {
        if (!SyncedStorage.get("highlight_notdiscounted")) { return; }
        node.style.display = "none";
    };

    self.highlightNotInterested = async function(node) {
        await DynamicStore;

        let aNode = node.querySelector("a");
        let appid = GameId.getAppid(node.href, aNode && aNode.href) || GameId.getAppidWishlist(node.id);
        if (!appid || !DynamicStore.isIgnored(appid)) { return; }

        if (node.classList.contains("home_area_spotlight")) {
            node = node.querySelector(".spotlight_content");
        }

        node.classList.add("es_highlight_checked");

        if (SyncedStorage.get("hide_ignored") && node.closest(".search_result_row")) {
            node.style.display = "none";
            return;
        }

        highlightItem(node, "notinterested");
    };

    self.startHighlightsAndTags = function(parent) {
        // Batch all the document.ready appid lookups into one storefront call.
        let selectors = [
            "div.tab_row",					// Storefront rows
            "div.dailydeal_ctn",
            "div.wishlistRow",				// Wishlist rows
            "a.game_area_dlc_row",			// DLC on app pages
            "a.small_cap",					// Featured storefront items and "recommended" section on app pages
            "a.home_smallcap",
            "a.search_result_row",			// Search result rows
            "a.match",						// Search suggestions rows
            "a.cluster_capsule",			// Carousel items
            "div.recommendation_highlight",	// Recommendation pages
            "div.recommendation_carousel_item",	// Recommendation pages
            "div.friendplaytime_game",		// Recommendation pages
            "div.dlc_page_purchase_dlc",	// DLC page rows
            "div.sale_page_purchase_item",	// Sale pages
            "div.item",						// Sale pages / featured pages
            "div.home_area_spotlight",		// Midweek and weekend deals
            "div.browse_tag_game",			// Tagged games
            "div.similar_grid_item",		// Items on the "Similarly tagged" pages
            ".tab_item",					// Items on new homepage
            "a.special",					// new homepage specials
            "div.curated_app_item",			// curated app items!
            "a.summersale_dailydeal"		// Summer sale daily deal
        ];

        parent = parent || document;

        setTimeout(function() {
            selectors.forEach(selector => {
                
                let nodes = parent.querySelectorAll(selector+":not(.es_highlighted)");
                for (let i=0, len=nodes.length; i<len; i++) {
                    let node = nodes[i];
                    let nodeToHighlight = node;

                    if (node.classList.contains("item")) {
                        nodeToHighlight = node.querySelector(".info");
                    }
                    if (node.classList.contains("home_area_spotlight")) {
                        nodeToHighlight = node.querySelector(".spotlight_content");
                    }

                    if (node.querySelector(".ds_owned_flag")) {
                        self.highlightOwned(nodeToHighlight);
                    }

                    if (node.querySelector(".ds_wishlist_flag")) {
                        self.highlightWishlist(nodeToHighlight);
                    }

                    if (node.querySelector(".ds_incart_flag")) {
                        self.highlightCart(nodeToHighlight);
                    }

                    if (node.classList.contains("search_result_row") && !node.querySelector(".search_discount span")) {
                        self.highlightNonDiscounts(nodeToHighlight);
                    }

                    let aNode = node.querySelector("a");
                    let appid = GameId.getAppid(node.href || (aNode && aNode.href) || GameId.getAppidWishlist(node.id));
                    if (appid) {
                        if (LocalData.get(appid + "guestpass")) {
                            self.highlightInvGuestpass(node);
                        }
                        if (LocalData.get("couponData_" + appid)) {
                            self.highlightCoupon(node);
                        }
                        if (LocalData.get(appid + "gift")) {
                            self.highlightInvGift(node);
                        }
                    }

                    self.highlightNotInterested(node);
                }
            });
        }, 500);
    };

    return self;

})();

let DynamicStore = (function(){

    let self = {};

    let _data = {};
    let _promise = null;
    let _owned = new Set();
    let _wishlisted = new Set();

    self.clear = function() {
        _data = {};
        _promise = null;
        _owned = new Set();
        _wishlisted = new Set();
        LocalData.del("dynamicstore");
        LocalData.del("dynamicstore_update");
    };

    self.isIgnored = function(appid) {
        let list = _data.rgIgnoredApps || {};
        return list.hasOwnProperty(appid);
    };

    self.isOwned = function(appid) {
        return _owned.has(appid);
    };

    self.isWishlisted = function(appid) {
        return _wishlisted.has(appid);
    };

    Object.defineProperty(self, 'wishlist', {
        get() { return new Set(_wishlisted); },
    });

    async function _fetch() {
        if (!User.isSignedIn) { 
            self.clear();
            return _data;
        }
        _data = await Background.action('dynamicstore');
        _owned = new Set(_data.rgOwnedApps);
        _wishlisted = new Set(_data.rgWishlist);
        return _data;
    }

    self.then = function(onDone, onCatch) {
        if (!_promise) {
            _promise = _fetch();
        }
        return _promise.then(onDone, onCatch);
    };

    return self;
})();
    
let Prices = (function(){

    function Prices() {
        this.appids = [];
        this.subids = [];
        this.bundleids = [];

        this.priceCallback = function(type, id, html) {};
        this.bundleCallback = function(html) {};

        this._bundles = [];
    }

    Prices.prototype._getApiParams = function() {
        let apiParams = {};

        if (!SyncedStorage.get("showallstores") && SyncedStorage.get("stores").length > 0) {
            apiParams.stores = SyncedStorage.get("stores").join(",");
        }

        let cc = User.getCountry();
        if (cc) {
            apiParams.cc = cc;
        }

        apiParams.appids = this.appids.join(",");
        apiParams.subids = this.subids.join(",");
        apiParams.bundleids = this.bundleids.join(",");

        if (SyncedStorage.get("showlowestpricecoupon")) {
            apiParams.coupon = true;
        }

        if (!apiParams.appids && !apiParams.subids && !apiParams.bundleids) { return; }

        return apiParams;
    };

    Prices.prototype._processPrices = function(gameid, meta, info) {
        if (!this.priceCallback) { return; }

        let a = gameid.split("/");
        let type = a[0];
        let id = a[1];

        let activates = "";
        let line1 = "";
        let line2 = "";
        let line3 = "";
        let html;

        // "Lowest Price"
        if (info['price']) {
            if (info['price']['drm'] === "steam" && info['price']['store'] !== "Steam") {
                activates = "(<b>" + Localization.str.activates + "</b>)";
            }

            let infoUrl = BrowserHelper.escapeHTML(info["urls"]["info"].toString());
            let priceUrl = BrowserHelper.escapeHTML(info["price"]["url"].toString());
            let store = BrowserHelper.escapeHTML(info["price"]["store"].toString());

            let lowest;
            let voucherStr = "";
            if (SyncedStorage.get("showlowestpricecoupon") && info['price']['price_voucher']) {
                lowest = new Price(info['price']['price_voucher'], meta['currency']);
                let voucher = BrowserHelper.escapeHTML(info['price']['voucher']);
                voucherStr = `${Localization.str.after_coupon} <b>${voucher}</b>`;
            } else {
                lowest = new Price(info['price']['price'], meta['currency']);
            }

            let lowestStr = Localization.str.lowest_price_format
                .replace("__price__", lowest.toString())
                .replace("__store__", `<a href="${priceUrl}" target="_blank">${store}</a>`)

            line1 = `${Localization.str.lowest_price}: 
                             ${lowestStr} ${voucherStr} ${activates}
                             (<a href="${infoUrl}" target="_blank">${Localization.str.info}</a>)`;
        }

        // "Historical Low"
        if (info["lowest"]) {
            let historical = new Price(info['lowest']['price'], meta['currency']);
            let recorded = new Date(info["lowest"]["recorded"]*1000);

            let historicalStr = Localization.str.historical_low_format
                .replace("__price__", historical.toString())
                .replace("__store__", BrowserHelper.escapeHTML(info['lowest']['store']))
                .replace("__date__", recorded.toLocaleDateString());

            let url = BrowserHelper.escapeHTML(info['urls']['history']);

            line2 = `${Localization.str.historical_low}: ${historicalStr} (<a href="${url}" target="_blank">${Localization.str.info}</a>)`;
        }

        let chartImg = ExtensionLayer.getLocalUrl("img/line_chart.png");
        html = `<div class='es_lowest_price' id='es_price_${id}'><div class='gift_icon' id='es_line_chart_${id}'><img src='${chartImg}'></div>`;

        // "Number of times this game has been in a bundle"
        if (info["bundles"]["count"] > 0) {
            line3 = `${Localization.str.bundle.bundle_count}: ${info['bundles']['count']}`;
            let bundlesUrl = BrowserHelper.escapeHTML(info["urls"]["bundles"] || info["urls"]["bundle_history"]);
            if (typeof bundlesUrl === "string" && bundlesUrl.length > 0) {
                line3 += ` (<a href="${bundlesUrl}" target="_blank">${Localization.str.info}</a>)`;
            }
        }

        if (line1 || line2) {
            let result = html + "<div>" + line1 + "</div><div>" + line2 + "</div>" + line3;
            this.priceCallback(type, id, result);
        }
    };

    Prices.prototype._processBundles = function(gameid, meta, info) {
        if (!this.bundleCallback) { return; }
        if (info["bundles"]["live"].length == 0) { return; }

        let length = info["bundles"]["live"].length;
        for (let i = 0; i < length; i++) {
            let bundle = info["bundles"]["live"][i];
            let endDate;
            if (bundle["expiry"]) {
                endDate = new Date(bundle["expiry"]*1000);
            }

            let currentDate = new Date().getTime();
            if (endDate && currentDate > endDate) { continue; }

            let bundle_normalized = JSON.stringify({
                page:  bundle.page || "",
                title: bundle.title || "",
                url:   bundle.url || "",
                tiers: (function() {
                    let tiers = [];
                    for (let tier in bundle.tiers) {
                        tiers.push((bundle.tiers[tier].games || []).sort());
                    }
                    return tiers;
                })()
            });

            if (this._bundles.indexOf(bundle_normalized) >= 0) { continue; }
            this._bundles.push(bundle_normalized);

            let purchase = "";
            if (bundle.page) {
                let bundlePage = Localization.str.buy_package.replace("__package__", bundle.page + ' ' + bundle.title);
                purchase = `<div class="game_area_purchase_game"><div class="game_area_purchase_platform"></div><h1>${bundlePage}</h1>`;
            } else {
                let bundleTitle = Localization.str.buy_package.replace("__package__", bundle.title);
                purchase = `<div class="game_area_purchase_game_wrapper"><div class="game_area_purchase_game"></div><div class="game_area_purchase_platform"></div><h1>${bundleTitle}</h1>`;
            }

            if (endDate) {
                purchase += `<p class="game_purchase_discount_countdown">${Localization.str.bundle.offer_ends} ${endDate}</p>`;
            }

            purchase += '<p class="package_contents">';

            let bundlePrice;
            let appName = this.appName;

            for (let t=0; t<bundle.tiers.length; t++) {
                let tier = bundle.tiers[t];
                let tierNum = t + 1;

                purchase += '<b>';
                if (bundle.tiers.length > 1) {
                    let tierName = tier.note || Localization.str.bundle.tier.replace("__num__", tierNum);
                    let tierPrice = new Price(tier.price, meta['currency']).toString();

                    purchase += Localization.str.bundle.tier_includes.replace("__tier__", tierName).replace("__price__", tierPrice).replace("__num__", tier.games.length);
                } else {
                    purchase += Localization.str.bundle.includes.replace("__num__", tier.games.length);
                }
                purchase += ':</b> ';

                let gameList = tier.games.join(", ");
                if (gameList.includes(appName)) {
                    purchase += gameList.replace(appName, "<u>"+appName+"</u>");
                    bundlePrice = tier.price;
                } else {
                    purchase += gameList;
                }

                purchase += "<br>";
            }

            purchase += "</p>";
            purchase += `<div class="game_purchase_action">
                            <div class="game_purchase_action_bg">
                                 <div class="btn_addtocart btn_packageinfo">
                                    <a class="btnv6_blue_blue_innerfade btn_medium" href="${bundle.details}" target="_blank">
                                         <span>${Localization.str.bundle.info}</span>
                                    </a>
                                </div>
                            </div>`;

            purchase += '<div class="game_purchase_action_bg">';
            if (bundlePrice && bundlePrice > 0) {
                purchase += '<div class="game_purchase_price price" itemprop="price">';
                    purchase += (new Price(bundlePrice, meta['currency'])).toString();
                purchase += '</div>';
            }

            purchase += '<div class="btn_addtocart">';
            purchase += '<a class="btnv6_green_white_innerfade btn_medium" href="' + bundle["url"] + '" target="_blank">';
            purchase += '<span>' + Localization.str.buy + '</span>';
            purchase += '</a></div></div></div></div>';

            this.bundleCallback(purchase);
        }
    };

    Prices.prototype.load = function() {
        let that = this;
        let apiParams = this._getApiParams();

        if (!apiParams) { return; }

        Background.action('prices', apiParams).then(response => {
            let meta = response['.meta'];
            
            for (let [gameid, info] of Object.entries(response.data)) {
                that._processPrices(gameid, meta, info);
                that._processBundles(gameid, meta, info);
            }
        });
    };

    return Prices;
})();

let Customizer = (function(){
    let self = {};

    self.textValue = function(node) {
        let str = "";
        for (node=node.firstChild;node;node=node.nextSibling){
            if (node.nodeType === 3) { str += node.textContent.trim(); }
        }
        return str;
    };

    self.addToggleHandler = function(name, target, text, forceShow, callback) {
        let element = typeof target === "string" ? document.querySelector(target) : target;
        if (!element && !forceShow) { return; }

        let state = SyncedStorage.get(name);
        text = (typeof text === "string" && text) || self.textValue(element.querySelector("h2")).toLowerCase();
        if (text === "") { return; }

        document.querySelector("body").classList.toggle(name.replace("show_", "es_") + "_hidden", !SyncedStorage.get(name, true));

        if (element) {
            element.classList.toggle("es_hide", !SyncedStorage.get(name));

            if (element.classList.contains("es_hide")) {
                element.style.display = "none";
            }
        }

        document.querySelector("#es_customize_btn .home_viewsettings_popup").insertAdjacentHTML("beforeend",
            `<div class="home_viewsettings_checkboxrow ellipsis" id="${name}">
                    <div class="home_viewsettings_checkbox ${SyncedStorage.get(name) ? `checked` : ``}"></div>
                    <div class="home_viewsettings_label">${text}</div>
                </div>
            `);

        document.querySelector("#" + name).addEventListener("click", function(e) {
            state = !state;

            if (element) {
                element.classList.remove("es_show");
                element.classList.remove("es_hide");
                element.style.display = state ? "block" : "none";
            }

            e.target.closest(".home_viewsettings_checkboxrow").querySelector(".home_viewsettings_checkbox").classList.toggle("checked", state);
            document.querySelector("body").classList.toggle(name.replace("show_", "es_") + "_hidden", !state);

            SyncedStorage.set(name, state);

            if (callback) { callback(); }
        });
    };

    return self;
})();

let AgeCheck = (function(){

    let self = {};

    self.sendVerification = function(){
        if (!SyncedStorage.get("send_age_info")) { return; }

        let ageYearNode = document.querySelector("#ageYear");
        if (ageYearNode) {
            let myYear = Math.floor(Math.random()*75)+10;
            ageYearNode.value = "19" + myYear;
            document.querySelector(".btnv6_blue_hoverfade").click();
        } else {
            let btn = document.querySelector(".agegate_text_container.btns a");
            if (btn && btn.getAttribute("href") === "#") {
                btn.click();
            }
        }

        let continueNode = document.querySelector("#age_gate_btn_continue");
        if (continueNode) {
            continueNode.click();
        }
    };

    return self;
})();

let Common = (function(){

    let self = {};

    self.init = function() {

        console.log.apply(console, [
            "%c Augmented %cSteam v" + Info.version + " %c https://es.isthereanydeal.com/",
            "background: #000000;color:#046eb2",
            "background: #000000;color: #ffffff",
            "",
        ]);

        ProgressBar.create();
        EnhancedSteam.checkVersion();
        EnhancedSteam.addMenu();
        EnhancedSteam.addLanguageWarning();
        EnhancedSteam.removeInstallSteamButton();
        EnhancedSteam.addHeaderLinks();
        EarlyAccess.showEarlyAccess();
        EnhancedSteam.disableLinkFilter();
        EnhancedSteam.skipGotSteam();
        EnhancedSteam.keepSteamSubscriberAgreementState();

        if (User.isSignedIn) {
            EnhancedSteam.addRedeemLink();
            EnhancedSteam.replaceAccountName();
            EnhancedSteam.launchRandomButton();
            // TODO add itad sync
            EnhancedSteam.bindLogout();
        } else {
            EnhancedSteam.removeAboutMenu();
        }


    };

    return self;
})();
