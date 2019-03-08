/**
 * Common functions that may be used on any pages
 */
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


let ExtensionLayer = (function() {

    let self = {};

    self.getLocalUrl = function(url) {
        return chrome.runtime.getURL(url);
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


class CookieStorage {
    static get(name, defaultValue) {
        if (CookieStorage.cache.size === 0) {
            CookieStorage.init();
        }
        name = name.trim();
        if (!CookieStorage.cache.has(name)) {
            return defaultValue;
        }
        return CookieStorage.cache.get(name);
    }

    static set(name, val, ttl=60*60*24*365) {
        if (CookieStorage.cache.size === 0) {
            CookieStorage.init();
        }
        name = name.trim();
        val = val.trim();
        CookieStorage.cache.set(name, val);
        name = encodeURIComponent(name);
        val = encodeURIComponent(val);
        document.cookie = `${name}=${val}; max-age=${ttl}`;
    }

    static remove(name) {
        name = name.trim();
        CookieStorage.cache.delete(name);
        name = encodeURIComponent(name);
        document.cookie = `${name}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }

    static init() {
        CookieStorage.cache.clear();
        for (let [key, val] of document.cookie.split(';').map(kv => kv.split('='))) {
            key = key.trim();
            CookieStorage.cache.set(key, decodeURIComponent(val));
        }
    }
}
CookieStorage.cache = new Map();


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
        HTML.afterEnd(container,
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

        HTML.beforeEnd(nodeError.querySelector("ul"), "<li>" + message + "</li>");
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

    self.promise = function() {
        if (_promise) { return _promise; }

        let avatarNode = document.querySelector("#global_actions .playerAvatar");
        self.profileUrl = avatarNode ? avatarNode.getAttribute("href") : false;
        self.profilePath = self.profileUrl && (self.profileUrl.match(/\/(?:id|profiles)\/(.+?)\/$/) || [])[0];

        // If profilePath is not available, we're not logged in
        if (!self.profilePath) {
            Background.action('logout');
            _promise = Promise.resolve();
            return _promise;
        }

        _promise = Background.action('login', { 'path': self.profilePath, })
            .then(function (login) {
                if (!login) return;
                self.isSignedIn = true;
                self.steamId = login.steamId;
                // If we're *newly* logged in, then login.userCountry will be set
                if (login.userCountry) {
                    LocalStorage.set("userCountry", login.userCountry);
                }
            })
            .catch(err => console.error(err))
            ;

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
        return Background.action('sessionid');
    };

    self.getCountry = function() {
        let url = new URL(window.location.href);

        let country;
        if (url.searchParams && url.searchParams.has("cc")) {
            country = url.searchParams.get("cc");
        } else {
            country = LocalStorage.get("userCountry");
            if (!country) {
                country = CookieStorage.get("steamCountry");
            }
        }

        if (!country) { return null; }
        return country.substr(0, 2);
    };

    self.getPurchaseDate = async function(lang, appName) {
        return Background.action('purchase', { 'lang': lang, 'appName': appName, });
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


let CurrencyRegistry = (function() {
    //   { "id": 1, "abbr": "USD", "symbol": "$", "hint": "United States Dollars", "multiplier": 100, "unit": 1, "format": { "places": 2, "hidePlacesWhenZero": false, "symbolFormat": "$", "thousand": ",", "decimal": ".", "right": false } },
    class SteamCurrency {
        constructor({
            'id': id,
            'abbr': abbr="USD",
            'symbol': symbol="$",
            'hint': hint="Default Currency",
            'multiplier': multiplier=100,
            'unit': unit=1,
            'format': {
                'places': formatPlaces=2,
                'hidePlacesWhenZero': formatHidePlaces=false,
                'symbolFormat': formatSymbol="$",
                'thousand': formatGroupSeparator=",",
                'group': formatGroupSize=3,
                'decimal': formatDecimalSeparator=".",
                'right': formatPostfixSymbol=false,
            },
        }) {
            // console.assert(id && Number.isInteger(id))
            Object.assign(this, {
                'id': id, // Steam Currency ID, integer, 1-41 (at time of writing)
                'abbr': abbr, // TLA for the currency
                'symbol': symbol, // Symbol used to represent/recognize the currency, this is NULL for CNY to avoid collision with JPY
                'hint': hint, // English label for the currency to reduce mistakes editing the JSON
                'multiplier': multiplier, // multiplier used by Steam when writing values
                'unit': unit, // Minimum transactional unit required by Steam.
                'format': {
                    'decimalPlaces': formatPlaces, // How many decimal places does this currency have?
                    'hidePlacesWhenZero': formatHidePlaces, // Does this currency show decimal places for a .0 value?
                    'symbol': formatSymbol, // Symbol used when generating a string value of this currency
                    'groupSeparator': formatGroupSeparator, // Thousands separator
                    'groupSize': formatGroupSize, // Digits to a "thousand" for the thousands separator
                    'decimalSeparator': formatDecimalSeparator,
                    'postfix': formatPostfixSymbol, // Should format.symbol be post-fixed?
                },
            });
            Object.freeze(this.format);
            Object.freeze(this);
        }
        valueOf(price) {
            // remove separators
            price = price.trim()
                .replace(this.format.groupSeparator, "");
            if (this.format.decimalSeparator != ".")
                price = price.replace(this.format.decimalSeparator, ".") // as expected by parseFloat()
            price = price.replace(/[^\d\.]/g, "");

            let value = parseFloat(price);

            if (Number.isNaN(value))
                return null;
            return value; // this.multiplier?
        }
        stringify(value, withSymbol=true) {
            let sign = value < 0 ? "-" : "";
            value = Math.abs(value);
            let s = value.toFixed(this.format.decimalPlaces), decimals;
            [s, decimals] = s.split('.');
            let g = [], j = s.length;
            for (; j > this.format.groupSize; j -= this.format.groupSize) {
                g.unshift(s.substring(j - this.format.groupSize, j));
            }
            g.unshift(s.substring(0, j));
            s = [sign, g.join(this.format.groupSeparator)];
            if (this.format.decimalPlaces > 0) {
                if (!this.format.hidePlacesWhenZero || parseInt(decimals, 10) > 0) {
                    s.push(this.format.decimalSeparator);
                    s.push(decimals);
                }
            }
            if (withSymbol) {
                if (this.format.postfix) {
                    s.push(this.format.symbol);
                } else {
                    s.unshift(this.format.symbol);
                }
            }
            return s.join("");
        }
        placeholder() {
            if (this.format.decimalPlaces == 0 || this.format.hidePlacesWhenZero) {
                return "0";
            }
            return (0).toFixed(this.format.decimalPlaces);
        }
        regExp() {
            let regex = ["^("];
            if (this.format.hidePlacesWhenZero) {
                regex.push("0|[1-9]\\d*(");
            } else {
                regex.push("\\d*(");
            }
            regex.push(this.format.decimalSeparator.replace(".", "\\."));
            if (this.format.decimalPlaces > 0) {
                regex.push("\\d{0,", this.format.decimalPlaces, "}");
            }
            regex.push(")?)$")
            return new RegExp(regex.join(""));
        }
    }


    let self = {};

    let indices = {
        'id': {},
        'abbr': {},
        'symbols': {},
    };
    let defaultCurrency = null;
    let re = null;

    self.fromSymbol = function(symbol) {
        return indices.symbols[symbol] || defaultCurrency;
    };

    self.fromType = function(type) {
        return indices.abbr[type] || defaultCurrency;
    };

    self.fromNumber = function(number) {
        return indices.id[number] || defaultCurrency;
    };

    self.fromString = function(price) { 
        let match = price.match(re);
        if (!match)
            return defaultCurrency;
        return self.fromSymbol(match[0]);
    };

    Object.defineProperty(self, 'storeCurrency', { get() { return CurrencyRegistry.fromType(Currency.storeCurrency); }});
    Object.defineProperty(self, 'customCurrency', { get() { return CurrencyRegistry.fromType(Currency.customCurrency); }});
    
    self.init = async function() {
        let currencies = await Background.action('steam.currencies');
        for (let currency of currencies) {
            currency = new SteamCurrency(currency);
            indices.abbr[currency.abbr] = currency;
            indices.id[currency.id] = currency;
            if (currency.symbol) // CNY && JPY use the same symbol
                indices.symbols[currency.symbol] = currency;
        }
        defaultCurrency = indices.id[1]; // USD
        re = new RegExp(Object.keys(indices.symbols).join("|").replace(/\$/g, "\\$"));
    };
    self.then = function(onDone, onCatch) {
        return self.init().then(onDone, onCatch);
    };

    return self;
})();


let Currency = (function() {

    let self = {};

    self.customCurrency = null;
    self.storeCurrency = null;

    let _rates = {};
    let _promise = null;

    function _getRates() {
        let target = [self.storeCurrency,];
        if (self.customCurrency !== self.storeCurrency) {
            target.push(self.customCurrency);
        }
        // assert (Array.isArray(target) && target.length == target.filter(el => typeof el == 'string').length)
        target.sort();
        return Background.action('rates', { 'to': target.join(","), })
            .then(rates => _rates = rates);
    }

    function getCurrencyFromDom() {
        let currencyNode = document.querySelector('meta[itemprop="priceCurrency"]');
        if (currencyNode && currencyNode.hasAttribute("content")) {
            return currencyNode.getAttribute("content");
        }
        return null;
    }

    function getCurrencyFromWallet() {
        return new Promise((resolve, reject) => {
            ExtensionLayer.runInPageContext(
                `function(){
                    window.postMessage({
                        type: "es_walletcurrency",
                        wallet_currency: typeof g_rgWalletInfo !== 'undefined' ? g_rgWalletInfo.wallet_currency : null
                    }, "*");
                }`);

            function listener(e) {
                if (e.source !== window) { return; }
                if (!e.data.type || e.data.type !== "es_walletcurrency") { return; }

                if (e.data.wallet_currency !== null) {
                    resolve(Currency.currencyNumberToType(e.data.wallet_currency));
                } else {
                    reject();
                }

                window.removeEventListener("message", listener, false);
            }

            window.addEventListener("message", listener, false);
        });
    }

    async function getStoreCurrency() {
        let currency = getCurrencyFromDom();

        if (!currency) {
            try {
                currency = await getCurrencyFromWallet();
            } catch (error) {
                // no action
            }
        }

        if (!currency) {
            try {
                currency = await Background.action('currency');
            } catch(error) {
                console.error("Couldn't load currency" + error);
            }
        }

        if (!currency) {
            currency = "USD"; // fallback
        }

        return currency;
    }

    async function _getCurrency() {
        self.storeCurrency = await getStoreCurrency();
        let currencySetting = SyncedStorage.get("override_price");
        if (currencySetting !== "auto") {
            self.customCurrency = currencySetting;
        } else {
            self.customCurrency = self.storeCurrency;
        }
    }

    // load user currency
    self.init = function() {
        if (_promise) { return _promise; }
        return _promise = CurrencyRegistry
            .then(_getCurrency)
            .then(_getRates)
            ;
    };

    self.then = function(onDone, onCatch) {
        return self.init().then(onDone, onCatch);
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

    self.currencySymbolToType = function(symbol) {
        return CurrencyRegistry.fromSymbol(symbol).abbr;
    };

    self.currencyTypeToNumber = function(type) {
        return CurrencyRegistry.fromType(type).id;
    };

    self.currencyNumberToType = function(number) {
        return CurrencyRegistry.fromNumber(number).abbr;
    };

    return self;
})();

let Price = (function() {
    function Price(value, currency) {
        this.value = value || 0;
        this.currency = currency || Currency.customCurrency;
        Object.freeze(this);
    }

    Price.prototype.formattedValue = function() {
        return CurrencyRegistry.fromType(this.currency).stringify(this.value, false);
    };

    Price.prototype.toString = function() {
        return CurrencyRegistry.fromType(this.currency).stringify(this.value);
    };

    // Not currently in use
    // totalValue = totalValue.add(somePrice)
    Price.prototype.add = function(otherPrice) {
        if (otherPrice.currency !== this.currency) {
            otherPrice = otherPrice.inCurrency(this.currency);
        }
        return new Price(this.value + otherPrice.value, this.currency);
    };

    Price.prototype.inCurrency = function(desiredCurrency) {
        if (this.currency === desiredCurrency) {
            return new Price(this.value, this.currency);
        }
        let rate = Currency.getRate(this.currency, desiredCurrency);
        if (!rate) {
            throw `Could not establish conversion rate between ${this.currency} and ${desiredCurrency}`;
        }
        return new Price(this.value * rate, desiredCurrency);
    };

    Price.parseFromString = function(str, desiredCurrency) {
        let currency = CurrencyRegistry.fromString(str);
        let value = currency.valueOf(str);
        if (value !== null) {
            value = new Price(value, currency.abbr);
            if (currency.abbr !== desiredCurrency) {
                value = value.inCurrency(desiredCurrency);
            }
        }
        return value;
    };

    return Price;
})();


let BrowserHelper = (function(){

    let self = {};

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

    // FIXME move to DOMHelper

    self.htmlToDOM = function(html) {
        let template = document.createElement('template');
        html = html.trim(); // Never return a text node of whitespace as the result
        HTML.inner(template, html);
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

    self.checkVersion = async function() {
        let showMessage = SyncedStorage.get("version_updated");
        SyncedStorage.set("version_updated", false);

        if (!showMessage || !SyncedStorage.get("version_show")) {
            return;
        }

        RequestData.getHttp(ExtensionLayer.getLocalUrl("changelog_new.html")).then(
            changelog => {
                changelog = changelog.replace(/\r|\n/g, "").replace(/'/g, "\\'");
                let logo = ExtensionLayer.getLocalUrl("img/es_128.png");
                let dialog = `<div class="es_changelog"><img src="${logo}"><div>${changelog}</div></div>`;
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
            HTML.afterEnd(document.querySelector("#global_header"),
                `<div class="es_language_warning">` + strings.using_language.replace("__current__", strings.options.lang[currentLanguage] || currentLanguage) + `
                    <a href="#" id="es_reset_language_code">` + strings.using_language_return.replace("__base__", strings.options.lang[warningLanguage] || warningLanguage) + `</a>
                </div>`);

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
        HTML.afterEnd(submenuUsername.querySelector("a"), `<a class="submenuitem" href="//steamcommunity.com/my/games/">${Localization.str.games}</a>`);
        HTML.beforeEnd(submenuUsername, `<a class="submenuitem" href="//steamcommunity.com/my/recommended/">${Localization.str.reviews}</a>`);
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

        HTML.beforeEnd(document.querySelector("#es_popup .popup_menu"),
            `<div class='hr'></div><a id='es_random_game' class='popup_menu_item' style='cursor: pointer;'>${Localization.str.launch_random}</a>`);

        document.querySelector("#es_random_game").addEventListener("click", async function(){
            let result = await DynamicStore;
            if (!result.rgOwnedApps) { return; }
            let appid = result.rgOwnedApps[Math.floor(Math.random() * result.rgOwnedApps.length)];

            Background.action('appdetails', { 'appids': appid, }).then(response => {
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
            HTML.inner(node, node.innerHTML.replace(/[\u00AE\u00A9\u2122]/g, ""));
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

class HTML {

    static inner(node, html) {
        node.innerHTML = DOMPurify.sanitize(html);
    }

    static beforeBegin(node, html) {
        if (typeof(node) === "string") {
            node = document.querySelector(node);
        }

        node.insertAdjacentHTML("beforebegin", DOMPurify.sanitize(html));
    }

    static afterBegin(node, html) {
        if (typeof(node) === "string") {
            node = document.querySelector(node);
        }

        node.insertAdjacentHTML("afterbegin", DOMPurify.sanitize(html));
    }

    static beforeEnd(node, html) {
        if (typeof(node) === "string") {
            node = document.querySelector(node);
        }

        node.insertAdjacentHTML("beforeend", DOMPurify.sanitize(html));
    }

    static afterEnd(node, html) {
        if (typeof(node) === "string") {
            node = document.querySelector(node);
        }

        node.insertAdjacentHTML("afterend", DOMPurify.sanitize(html));
    }

}

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

                    HTML.afterBegin(container, `<span class="es_overlay"><img title="${Localization.str.early_access}" src="${imageUrl}" /></span>`);
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
            case /^\/(?:curator|developer|dlc|publisher)\/.*/.test(window.location.pathname):
                checkNodes( [
                    "#curator_avatar_image",
                    ".capsule",
                ]);
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

    let gifts = new Set();
    let guestpasses = new Set();
    let coupons = {};
    let inv6set = new Set();
    let coupon_appids = new Map();
    
    let _promise = null;
    self.promise = async function() {
        if (_promise) { return _promise; }

        if (!User.isSignedIn) {
            _promise = Promise.resolve();
            return _promise;
        }

        function handleCoupons(data) {
            coupons = data;
            for (let [subid, details] of Object.entries(coupons)) {
                for (let { 'id': appid, } of details.appids) {
                    coupon_appids.set(appid, parseInt(subid, 10));
                }
            }
        }
        _promise = Promise.all([
            Background.action('inventory.gifts').then(({ 'gifts': x, 'passes': y, }) => { gifts = new Set(x); guestpasses = new Set(y); }),
            Background.action('inventory.coupons').then(handleCoupons),
            Background.action('inventory.community').then(inv6 => inv6set = new Set(inv6)),
            ]);
        return _promise;
    };

    self.then = function(onDone, onCatch) {
        return self.promise().then(onDone, onCatch);
    };

    self.getCoupon = function(subid) {
        return coupons && coupons[subid];
    };

    self.getCouponByAppId = function(appid) {
        if (!coupon_appids.has(appid))
            return false;
        let subid = coupon_appids.get(appid);
        return self.getCoupon(subid);
    };

    self.hasGift = function(subid) {
        return gifts.has(subid);
    };

    self.hasGuestPass = function(subid) {
        return guestpasses.has(subid);
    };

    self.hasInInventory6 = function(marketHash) {
        return inv6set.has(marketHash);
    };

    return self;
})();

let Highlights = (function(){

    let self = {};

    let highlightCssLoaded = false;
    let tagCssLoaded = false;

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
                HTML.beforeBegin(root.querySelector(".game_purchase_action"), '<div style="clear: right;"></div>');
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
                HTML.beforeEnd(tags[i], '<span class="es_tag_' + tag + '">' + Localization.str.tag[tag] + '</span>');
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
            r.classList.remove("ds_flagged");
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

        highlightItem(node, "owned");
    };

    self.highlightWishlist = function(node) {
        node.classList.add("es_highlight_checked");

        highlightItem(node, "wishlist");
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

    self.startHighlightsAndTags = async function(parent) {
        await Inventory;
        
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
            "div.recommendation",           // Curator pages and the new DLC pages
            "div.carousel_items.curator_featured > div", // Carousel items on Curator pages
            "div.item_ctn",                 // Curator list item
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

                    if (node.classList.contains("search_result_row") && !node.querySelector(".search_discount span")) {
                        self.highlightNonDiscounts(nodeToHighlight);
                    }

                    let aNode = node.querySelector("a");
                    let appid = GameId.getAppid(node.href || (aNode && aNode.href) || GameId.getAppidWishlist(node.id));
                    if (appid) {
                        if (Inventory.hasGuestPass(appid)) {
                            self.highlightInvGuestpass(node);
                        }
                        if (Inventory.getCouponByAppId(appid)) {
                            self.highlightCoupon(node);
                        }
                        if (Inventory.hasGift(appid)) {
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
        LocalStorage.remove("dynamicstore");
        LocalStorage.remove("dynamicstore_update");
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
                lowest = new Price(info['price']['price_voucher'], meta['currency']).inCurrency(Currency.customCurrency);
                let voucher = BrowserHelper.escapeHTML(info['price']['voucher']);
                voucherStr = `${Localization.str.after_coupon} <b>${voucher}</b>`;
            } else {
                lowest = new Price(info['price']['price'], meta['currency']).inCurrency(Currency.customCurrency);
            }

            let prices = lowest.toString();
            if (Currency.customCurrency != Currency.storeCurrency) {
                let lowest_alt = lowest.inCurrency(Currency.storeCurrency);
                prices += ` (${lowest_alt.toString()})`;
            }
            
            let lowestStr = Localization.str.lowest_price_format
                .replace("__price__", prices)
                .replace("__store__", `<a href="${priceUrl}" target="_blank">${store}</a>`)

            line1 = `${Localization.str.lowest_price}: 
                             ${lowestStr} ${voucherStr} ${activates}
                             (<a href="${infoUrl}" target="_blank">${Localization.str.info}</a>)`;
        }

        // "Historical Low"
        if (info["lowest"]) {
            let historical = new Price(info['lowest']['price'], meta['currency']).inCurrency(Currency.customCurrency);
            let recorded = new Date(info["lowest"]["recorded"]*1000);

            let prices = historical.toString();
            if (Currency.customCurrency != Currency.storeCurrency) {
                let historical_alt = historical.inCurrency(Currency.storeCurrency);
                prices += ` (${historical_alt.toString()})`;
            }

            let historicalStr = Localization.str.historical_low_format
                .replace("__price__", prices)
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
                    let tierPrice = new Price(tier.price, meta['currency']).inCurrency(Currency.customCurrency).toString();

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
                    purchase += new Price(bundlePrice, meta['currency']).inCurrency(Currency.customCurrency).toString();
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
