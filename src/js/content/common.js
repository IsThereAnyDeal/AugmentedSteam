import {
    BackgroundBase, CookieStorage, ErrorParser, ExtensionResources, GameId, HTML, HTMLParser,
    Info, Language, LocalStorage, Localization, StringUtils, SyncedStorage, Version
} from "core";

/**
 * Common functions that may be used on any pages
 */
class ProgressBar {
    static create() {
        if (!SyncedStorage.get("show_progressbar")) { return; }

        HTML.afterEnd("#global_actions",
            `<div class="es_progress__wrap">
                <div class="es_progress es_progress--complete" title="${Localization.str.ready.ready}">
                    <div class="es_progress__bar">
                        <div class="es_progress__value"></div>
                    </div>
                </div>
            </div>`);
        ProgressBar._progress = document.querySelector(".es_progress");
    }

    static loading() {
        if (!ProgressBar._progress) { return; }

        ProgressBar._progress.setAttribute("title", Localization.str.ready.loading);

        ProgressBar.requests = {"initiated": 0, "completed": 0};
        ProgressBar._progress.classList.remove("es_progress--complete");
        ProgressBar._progress.querySelector(".es_progress__value").style.width = "18px";
    }

    static startRequest() {
        if (!ProgressBar.requests) { return; }
        ProgressBar.requests.initiated++;
        ProgressBar.progress();
    }

    static finishRequest() {
        if (!ProgressBar.requests) { return; }
        ProgressBar.requests.completed++;
        ProgressBar.progress();
    }

    static progress(value) {
        if (!ProgressBar._progress) { return; }

        let _value = value;

        if (!_value) {
            if (!ProgressBar.requests) { return; }
            if (ProgressBar.requests.initiated > 0) {
                _value = 100 * ProgressBar.requests.completed / ProgressBar.requests.initiated;
            }
        }
        if (_value > 100) {
            _value = 100;
        }

        ProgressBar._progress.querySelector(".es_progress__value").style.width = `${_value}px`;

        if (_value >= 100) {
            ProgressBar._progress.classList.add("es_progress--complete");
            ProgressBar._progress.setAttribute("title", Localization.str.ready.ready);
            ProgressBar.requests = null;
        }
    }

    static serverOutage() {
        if (!ProgressBar._progress) { return; }

        ProgressBar._progress.classList.add("es_progress--warning");
        ProgressBar.requests = null;

        if (!ProgressBar._progress.parentElement.querySelector(".es_progress__warning, .es_progress__error")) {
            HTML.afterEnd(
                ProgressBar._progress,
                `<div class="es_progress__warning">${Localization.str.ready.server_outage}</div>`
            );
        }
    }

    static failed() {
        if (!ProgressBar._progress) { return; }

        const warningNode = ProgressBar._progress.parentElement.querySelector(".es_progress__warning");
        if (warningNode) {
            ProgressBar._progress.classList.remove("es_progress--warning"); // Errors have higher precedence
            warningNode.remove();
        }
        ProgressBar._progress.classList.add("es_progress--error");
        ProgressBar.requests = null;

        const nodeError = ProgressBar._progress.parentElement.querySelector(".es_progress__error");
        if (nodeError) {
            nodeError.textContent = Localization.str.ready.failed.replace("__amount__", ++ProgressBar._failedRequests);
        } else {
            HTML.afterEnd(
                ProgressBar._progress,
                `<div class="es_progress__error">${
                    Localization.str.ready.failed.replace("__amount__", ++ProgressBar._failedRequests)
                }</div>`
            );
        }
    }
}
ProgressBar._progress = null;
ProgressBar._failedRequests = 0;

export class Background extends BackgroundBase {
    static async message(message) {
        ProgressBar.startRequest();

        let result;
        try {
            result = await super.message(message);
            ProgressBar.finishRequest();
            return result;
        } catch (err) {
            const errObj = ErrorParser.parse(err.message);

            switch (errObj.name) {
            case "ServerOutageError":
                ProgressBar.serverOutage();
                break;
            default: {
                if (!Background._errorHandlers.some(handler => handler(errObj))) {
                    ProgressBar.failed();
                }
            }
            }
            throw err;
        }
    }

    /**
     * @callback registerErrorHandlerCallback
     * @param {string} name - The error name
     * @param {string} msg - The error message
     * @returns {boolean} - Whether the error has been handled
     */

    /**
     * @param {registerErrorHandlerCallback} - The callback that will (eventually) handle the error
     */
    static registerErrorHandler(handler) {
        Background._errorHandlers.push(handler);
    }
}
Background._errorHandlers = [];

export class User {

    static get storeCountry() {

        const url = new URL(window.location.href);

        let country;
        if (url.searchParams && url.searchParams.has("cc")) {
            country = url.searchParams.get("cc");
        } else {
            country = User._storeCountry;
            if (!country) {
                country = CookieStorage.get("steamCountry");
            }
        }

        if (!country) {
            console.warn("Failed to detect store country, falling back to US");
            country = "US";
        }

        return country.substr(0, 2);
    }

    static promise() {
        if (User._promise) { return User._promise; }

        const avatarNode = document.querySelector("#global_actions > a.user_avatar");
        let loginPromise;

        if (avatarNode) {
            User.profileUrl = avatarNode.href;
            User.profilePath = avatarNode.pathname;

            loginPromise = Background.action("login", User.profilePath)
                .then(login => {
                    if (!login) { return; }
                    User.isSignedIn = true;
                    User.steamId = login.steamId;
                });
        } else {
            loginPromise = Background.action("logout");
        }

        User._promise = loginPromise
            .then(() => Background.action("storecountry"))
            .catch(({message}) => { console.error(message); })
            .then(country => {
                if (country) {
                    User._storeCountry = country;
                    return null;
                }

                let newCountry;

                if (window.location.hostname.endsWith("steampowered.com")) {

                    // Search through all scripts in case the order gets changed or a new one gets added
                    for (const script of document.getElementsByTagName("script")) {
                        const match = script.textContent.match(/GDynamicStore\.Init\(.+?, '([A-Z]{2})/);
                        if (match) {
                            newCountry = match[1];
                            break;
                        }
                    }

                } else if (window.location.hostname === "steamcommunity.com") {
                    const config = document.querySelector("#webui_config,#application_config");
                    if (config) {
                        newCountry = JSON.parse(config.dataset.config).COUNTRY;
                    }
                }

                if (newCountry) {
                    User._storeCountry = newCountry;
                    return Background.action("storecountry", newCountry)
                        .catch(({message}) => { console.error(message); });
                } else {
                    throw new Error("Script with user store country not found");
                }

            })
            .catch(err => {
                console.group("Store country detection");
                console.warn("Failed to detect store country from page");
                console.error(err);
                console.groupEnd();
            });

        return User._promise;
    }

    static then(onDone, onCatch) {
        return User.promise().then(onDone, onCatch);
    }

    static get sessionId() {
        if (!User._sessionId) {
            User._sessionId = HTMLParser.getVariableFromDom("g_sessionID", "string");
        }
        return User._sessionId;
    }

    static getPurchaseDate(lang, appName) {
        const _appName = HTMLParser.clearSpecialSymbols(appName);
        return Background.action("purchases", _appName, lang);
    }
}

export class ITAD {
    static async create() {
        if (!await Background.action("itad.isconnected")) { return; }

        HTML.afterBegin("#global_action_menu",
            `<div id="es_itad">
                <img id="es_itad_logo" src="${ExtensionResources.getURL("img/itad.png")}" height="20px">
                <span id="es_itad_status">✓</span>
            </div>`);

        document.querySelector("#es_itad").addEventListener("mouseenter", ITAD.onHover);

        if (User.isSignedIn && (SyncedStorage.get("itad_import_library") || SyncedStorage.get("itad_import_wishlist"))) {
            Background.action("itad.import");
        }
    }

    static async onHover() {

        async function updateLastImport() {
            const {from, to} = await Background.action("itad.lastimport");

            let htmlStr
                = `<div>${Localization.str.itad.from}</div>
                   <div>${from ? new Date(from * 1000).toLocaleString() : Localization.str.never}</div>`;

            if (SyncedStorage.get("itad_import_library") || SyncedStorage.get("itad_import_wishlist")) {
                htmlStr
                    += `<div>${Localization.str.itad.to}</div>
                        <div>${to ? new Date(to * 1000).toLocaleString() : Localization.str.never}</div>`;
            }

            HTML.inner(".es-itad-hover__last-import", htmlStr);
        }

        if (!document.querySelector(".es-itad-hover")) {
            HTML.afterEnd("#es_itad_status",
                `<div class="es-itad-hover">
                    <div class="es-itad-hover__content">
                        <h4>${Localization.str.itad.last_import}</h4>
                        <div class="es-itad-hover__last-import"></div>
                        <div class="es-itad-hover__sync-now">
                            <span class="es-itad-hover__sync-now-text">${Localization.str.itad.sync_now}</span>
                            <div class="loader"></div>
                            <span class="es-itad-hover__sync-failed">&#10060;</span>
                            <span class="es-itad-hover__sync-success">&#10003;</span>
                        </div>
                    </div>
                    <div class="es-itad-hover__arrow"></div>
                </div>`);

            const hover = document.querySelector(".es-itad-hover");

            const syncDiv = document.querySelector(".es-itad-hover__sync-now");
            document.querySelector(".es-itad-hover__sync-now-text").addEventListener("click", async() => {
                syncDiv.classList.remove("es-itad-hover__sync-now--failed", "es-itad-hover__sync-now--success");
                syncDiv.classList.add("es-itad-hover__sync-now--loading");
                hover.style.display = "block";

                let timeout;

                try {
                    await Background.action("itad.sync");
                    syncDiv.classList.add("es-itad-hover__sync-now--success");
                    await updateLastImport();

                    timeout = 1000;
                } catch (err) {
                    syncDiv.classList.add("es-itad-hover__sync-now--failed");

                    console.group("ITAD sync");
                    console.error("Failed to sync with ITAD");
                    console.error(err);
                    console.groupEnd();

                    timeout = 3000;
                } finally {
                    setTimeout(() => { hover.style.display = ""; }, timeout);
                    syncDiv.classList.remove("es-itad-hover__sync-now--loading");
                }
            });
        }

        await updateLastImport();
    }

    static async getAppStatus(storeIds, options) {
        const opts = {"waitlist": true,
            "collection": true,
            ...options};

        if (!opts.collection && !opts.waitlist) { return null; }

        const multiple = Array.isArray(storeIds);
        const promises = [];
        const resolved = Promise.resolve(multiple ? {} : false);

        if (await Background.action("itad.isconnected")) {
            if (opts.collection) {
                promises.push(Background.action("itad.incollection", storeIds));
            } else {
                promises.push(resolved);
            }
            if (opts.waitlist) {
                promises.push(Background.action("itad.inwaitlist", storeIds));
            } else {
                promises.push(resolved);
            }
        } else {
            promises.push(resolved, resolved);
        }

        const [inCollection, inWaitlist] = await Promise.all(promises);

        if (multiple) {
            const result = {};
            for (const id of storeIds) {
                result[id] = {
                    "collected": inCollection[id],
                    "waitlisted": inWaitlist[id],
                };
            }
            return result;
        } else {
            return {
                "collected": inCollection,
                "waitlisted": inWaitlist,
            };
        }
    }
}

export class HTTPError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}

/**
 * Event handler for uncaught Background errors
 */
function unhandledrejection(ev) {
    const err = ev.reason;
    if (!err || !err.error) { return; } // Not a background error
    ev.preventDefault();
    ev.stopPropagation();
    console.group("An error occurred in the background context.");
    console.error(err.localStack);
    console.error(err.stack);
    console.groupEnd();
}

window.addEventListener("unhandledrejection", unhandledrejection);

export class DOMHelper {

    static wrap(container, node) {
        const parent = node.parentNode;
        parent.insertBefore(container, node);
        parent.removeChild(node);
        container.append(node);
    }

    static remove(selector) {
        const node = document.querySelector(selector);
        if (!node) { return; }
        node.remove();
    }

    // TODO extend Node itself?
    static selectLastNode(parent, selector) {
        const nodes = parent.querySelectorAll(selector);
        return nodes.length === 0 ? null : nodes[nodes.length - 1];
    }

    static insertStylesheet(href) {
        const stylesheet = document.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.type = "text/css";
        stylesheet.href = href;
        document.head.appendChild(stylesheet);
    }

    static insertScript({src, content}, id, onload, isAsync = true) {
        const script = document.createElement("script");

        if (onload) { script.onload = onload; }
        if (id) { script.id = id; }
        if (src) { script.src = src; }
        if (content) { script.textContent = content; }
        script.async = isAsync;

        document.head.appendChild(script);
    }
}

/**
 * NOTE FOR ADDON REVIEWER:
 * This class is meant to simplify communication between extension context and page context.
 * Basically, we have wrapped postMessage API in this class.
 */
export class Messenger {
    static postMessage(msgID, info) {
        window.postMessage({
            "type": `es_${msgID}`,
            "information": info
        }, window.location.origin);
    }

    // Used for one-time events
    static onMessage(msgID) {
        return new Promise(resolve => {
            function callback(e) {
                if (e.source !== window) { return; }
                if (!e.data || !e.data.type) { return; }
                if (e.data.type === `es_${msgID}`) {
                    resolve(e.data.information);
                    window.removeEventListener("message", callback);
                }
            }
            window.addEventListener("message", callback);
        });
    }

    // Used for setting up a listener that should be able to receive more than one callback
    static addMessageListener(msgID, callback) {
        window.addEventListener("message", e => {
            if (e.source !== window) { return; }
            if (!e.data || !e.data.type) { return; }
            if (e.data.type === `es_${msgID}`) {
                callback(e.data.information);
            }
        });
    }
}

// Inject the Messenger class into the DOM, providing the same interface for the page context side
DOMHelper.insertScript({"content": `window.Messenger = ${Messenger.toString()}`});

export class ExtensionLayer {

    /*
     * NOTE: use cautiously!
     * Run script in the context of the current tab
     */
    static runInPageContext(fun, args, withPromise) {
        const script = document.createElement("script");
        let promise;
        const argsString = Array.isArray(args) ? JSON.stringify(args) : "[]";

        if (withPromise) {
            const msgId = `msg_${ExtensionLayer._msgCounter++}`;
            promise = Messenger.onMessage(msgId);
            script.textContent = `(async () => { Messenger.postMessage("${msgId}", await (${fun})(...${argsString})); })();`;
        } else {
            script.textContent = `(${fun})(...${argsString});`;
        }

        document.documentElement.appendChild(script);
        script.parentNode.removeChild(script);
        return promise;
    }
}
ExtensionLayer._msgCounter = 0;

export class RequestData {

    static getHttp(url, settings, responseType = "text") {

        let _url = url;
        const _settings = settings || {};

        _settings.method = _settings.method || "GET";
        _settings.credentials = _settings.credentials || "include";
        _settings.headers = _settings.headers || {"origin": window.location.origin};
        _settings.referrer = _settings.referrer || window.location.origin + window.location.pathname;

        ProgressBar.startRequest();

        if (_url.startsWith("//")) { // TODO remove when not needed
            _url = window.location.protocol + url;
            console.warn("Requesting URL without protocol, please update");
        }

        return RequestData._fetchFn(_url, _settings).then(response => {

            ProgressBar.finishRequest();

            if (!response.ok) {
                throw new HTTPError(response.status, `HTTP ${response.status} ${response.statusText} for ${response.url}`);
            }

            return response[responseType]();

        })
            .catch(err => {
                ProgressBar.failed();
                throw err;
            });
    }

    static post(url, formData, settings, returnJSON) {
        return RequestData.getHttp(url, Object.assign(settings || {}, {
            "method": "POST",
            "body": formData
        }), returnJSON ? "json" : "text");
    }

    static getJson(url, settings) {
        return RequestData.getHttp(url, settings, "json");
    }

    static getBlob(url, settings) {
        return RequestData.getHttp(url, settings, "blob");
    }
}

/**
 * In Firefox, the global fetch lies in the sandbox environment, thus we have to
 * access the fetch function of the content window.
 * See https://bugzilla.mozilla.org/show_bug.cgi?id=1579347#c5
 */
RequestData._fetchFn

    // content.fetch is already bound
    // eslint-disable-next-line no-undef -- content is only available in FF environments
    = (typeof content !== "undefined" && content && content.fetch)
    || fetch.bind(window);

export class CurrencyRegistry {

    static fromType(type) {
        return CurrencyRegistry._indices.abbr[type] || CurrencyRegistry._defaultCurrency;
    }

    static fromNumber(number) {
        return CurrencyRegistry._indices.id[number] || CurrencyRegistry._defaultCurrency;
    }

    static async init() {

        const currencies = await Background.action("steam.currencies");

        for (let currency of currencies) {

            currency = new CurrencyRegistry.SteamCurrency(currency);
            CurrencyRegistry._indices.abbr[currency.abbr] = currency;
            CurrencyRegistry._indices.id[currency.id] = currency;

            if (currency.symbol) { // CNY && JPY use the same symbol
                CurrencyRegistry._indices.symbols[currency.symbol] = currency;
            }
        }
        CurrencyRegistry._defaultCurrency = CurrencyRegistry._indices.id[1]; // USD
    }

    static then(onDone, onCatch) {
        return CurrencyRegistry.init().then(onDone, onCatch);
    }
}

CurrencyRegistry._indices = {
    "id": {},
    "abbr": {},
    "symbols": {},
};

/*
 * Example:
 * {
 *  "id": 1,
 *  "abbr": "USD",
 *  "symbol": "$",
 *  "hint": "United States Dollars",
 *  "multiplier": 100,
 *  "unit": 1,
 *  "format": {
 *      "places": 2,
 *      "hidePlacesWhenZero": false,
 *      "symbolFormat": "$",
 *      "thousand": ",",
 *      "decimal": ".",
 *      "right": false
 *  }
 * }
 */
CurrencyRegistry.SteamCurrency = class {

    constructor({
        id,
        abbr = "USD",
        symbol = "$",
        hint = "Default Currency",
        multiplier = 100,
        unit = 1,
        "format": {
            "places": formatPlaces = 2,
            "hidePlacesWhenZero": formatHidePlaces = false,
            "symbolFormat": formatSymbol = "$",
            "thousand": formatGroupSeparator = ",",
            "group": formatGroupSize = 3,
            "decimal": formatDecimalSeparator = ".",
            "right": formatPostfixSymbol = false,
        },
    }) {

        // console.assert(id && Number.isInteger(id))
        Object.assign(this, {
            "id": id, // Steam Currency ID, integer, 1-41 (at time of writing)
            "abbr": abbr, // TLA for the currency
            "symbol": symbol, // Symbol used to represent/recognize the currency, this is NULL for CNY to avoid collision with JPY
            "hint": hint, // English label for the currency to reduce mistakes editing the JSON
            "multiplier": multiplier, // multiplier used by Steam when writing values
            "unit": unit, // Minimum transactional unit required by Steam.
            "format": {
                "decimalPlaces": formatPlaces, // How many decimal places does this currency have?
                "hidePlacesWhenZero": formatHidePlaces, // Does this currency show decimal places for a .0 value?
                "symbol": formatSymbol, // Symbol used when generating a string value of this currency
                "groupSeparator": formatGroupSeparator, // Thousands separator
                "groupSize": formatGroupSize, // Digits to a "thousand" for the thousands separator
                "decimalSeparator": formatDecimalSeparator,
                "postfix": formatPostfixSymbol, // Should format.symbol be post-fixed?
            },
        });
        Object.freeze(this.format);
        Object.freeze(this);
    }

    valueOf(price) {

        // remove separators
        let _price = price.trim()
            .replace(this.format.groupSeparator, "");
        if (this.format.decimalSeparator !== ".") {
            _price = _price.replace(this.format.decimalSeparator, ".");
        } // as expected by parseFloat()
        _price = _price.replace(/[^\d.]/g, "");

        const value = parseFloat(_price);

        if (Number.isNaN(value)) { return null; }
        return value; // this.multiplier?
    }

    stringify(value, withSymbol = true) {
        const sign = value < 0 ? "-" : "";
        const _value = Math.abs(value);

        let s = _value.toFixed(this.format.decimalPlaces),
            decimals;

        [s, decimals] = s.split(".");

        const g = [];
        let j = s.length;

        for (; j > this.format.groupSize; j -= this.format.groupSize) {
            g.unshift(s.substring(j - this.format.groupSize, j));
        }
        g.unshift(s.substring(0, j));
        s = [sign, g.join(this.format.groupSeparator)];
        if (this.format.decimalPlaces > 0) {
            if (!this.format.hidePlacesWhenZero || parseInt(decimals) > 0) {
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
        let str = `1${this.format.groupSeparator}`;
        let cur = 2;
        for (let i = 0; i < this.format.groupSize; ++i, ++cur) {
            str += cur;
        }

        if (this.format.decimalPlaces === 0) {
            return str;
        }

        str += this.format.decimalSeparator;
        for (let i = 0; i < this.format.decimalPlaces; ++i, ++cur) {
            str += cur;
        }
        return str;
    }

    regExp() {
        let regex = `^(?:\\d{1,${
            this.format.groupSize
        }}(?:${
            StringUtils.escapeRegExp(this.format.groupSeparator)
        }\\d{${
            this.format.groupSize
        }})+|\\d*)`;

        if (this.format.decimalPlaces > 0) {
            regex += `(?:${StringUtils.escapeRegExp(this.format.decimalSeparator)}\\d{0,${this.format.decimalPlaces}})?`;
        }
        regex += "$";

        return new RegExp(regex);
    }
};


export class Currency {

    static _getCurrencyFromDom() {
        const currencyNode = document.querySelector('meta[itemprop="priceCurrency"]');
        if (currencyNode && currencyNode.hasAttribute("content")) {
            return currencyNode.getAttribute("content");
        }
        return null;
    }

    static async _getCurrencyFromWallet() {
        const walletCurrency = await ExtensionLayer.runInPageContext(
            // eslint-disable-next-line no-undef, camelcase
            () => (typeof g_rgWalletInfo !== "undefined" && g_rgWalletInfo ? g_rgWalletInfo.wallet_currency : null),
            null,
            "walletCurrency"
        );

        if (walletCurrency) {
            return Currency.currencyNumberToType(walletCurrency);
        }
        return null;
    }

    static async _getStoreCurrency() {
        let currency = Currency._getCurrencyFromDom();

        if (!currency) {
            currency = await Currency._getCurrencyFromWallet();
        }

        if (!currency) {
            try {
                currency = await Background.action("currency");
            } catch (error) {
                console.error(`Couldn't load currency${error}`);
            }
        }

        if (!currency) {
            currency = "USD"; // fallback
        }

        return currency;
    }

    static async _getCurrency() {
        Currency.storeCurrency = await Currency._getStoreCurrency();
        const currencySetting = SyncedStorage.get("override_price");
        if (currencySetting === "auto") {
            Currency.customCurrency = Currency.storeCurrency;
        } else {
            Currency.customCurrency = currencySetting;
        }
    }

    static async _getRates() {
        const toCurrencies = [Currency.storeCurrency];
        if (Currency.customCurrency !== Currency.storeCurrency) {
            toCurrencies.push(Currency.customCurrency);
        }
        Currency._rates = await Background.action("rates", toCurrencies);
    }

    // load user currency
    static init() {
        if (!Currency._promise) {
            Currency._promise = CurrencyRegistry
                .then(Currency._getCurrency)
                .then(Currency._getRates)
                .catch(e => {
                    console.error("Failed to initialize Currency");
                    console.error(e);
                });
        }

        return Currency._promise;
    }

    static then(onDone, onCatch) {
        return Currency.init().then(onDone, onCatch);
    }

    static getRate(from, to) {
        if (from === to) { return 1; }

        if (Currency._rates[from] && Currency._rates[from][to]) {
            return Currency._rates[from][to];
        }

        return null;
    }

    static getCurrencySymbolFromString(str) {
        const re = /(?:R\$|S\$|\$|RM|kr|Rp|€|¥|£|฿|pуб|P|₫|₩|TL|₴|Mex\$|CDN\$|A\$|HK\$|NT\$|₹|SR|R |DH|CHF|CLP\$|S\/\.|COL\$|NZ\$|ARS\$|₡|₪|₸|KD|zł|QR|\$U)/;
        const match = str.match(re);
        return match ? match[0] : "";
    }

    static currencyTypeToNumber(type) {
        return CurrencyRegistry.fromType(type).id;
    }

    static currencyNumberToType(number) {
        return CurrencyRegistry.fromNumber(number).abbr;
    }
}


export class Price {

    constructor(value = 0, currency = Currency.storeCurrency) {
        this.value = value;
        this.currency = currency;
        Object.freeze(this);
    }

    formattedValue() {
        return CurrencyRegistry.fromType(this.currency).stringify(this.value, false);
    }

    toString() {
        return CurrencyRegistry.fromType(this.currency).stringify(this.value);
    }

    /*
     * Not currently in use
     * totalValue = totalValue.add(somePrice)
     */
    add(otherPrice) {
        let _otherPrice = otherPrice;
        if (otherPrice.currency !== this.currency) {
            _otherPrice = otherPrice.inCurrency(this.currency);
        }
        return new Price(this.value + _otherPrice.value, this.currency);
    }

    inCurrency(desiredCurrency) {
        if (this.currency === desiredCurrency) {
            return new Price(this.value, this.currency);
        }
        const rate = Currency.getRate(this.currency, desiredCurrency);
        if (!rate) {
            throw new Error(`Could not establish conversion rate between ${this.currency} and ${desiredCurrency}`);
        }
        return new Price(this.value * rate, desiredCurrency);
    }

    static parseFromString(str, currencyType = Currency.storeCurrency) {
        const currency = CurrencyRegistry.fromType(currencyType);
        let value = currency.valueOf(str);
        if (value !== null) {
            value = new Price(value, currencyType);
        }
        return value;
    }
}


export class SteamId {

    static getSteamId() {
        if (SteamId._steamId) { return SteamId._steamId; }

        if (document.querySelector("#reportAbuseModal")) {
            SteamId._steamId = document.querySelector("input[name=abuseID]").value;
        } else {
            SteamId._steamId = HTMLParser.getVariableFromDom("g_steamID", "string");
        }

        if (!SteamId._steamId) {
            const profileData = HTMLParser.getVariableFromDom("g_rgProfileData", "object");
            SteamId._steamId = profileData.steamid;
        }

        return SteamId._steamId;
    }
}

SteamId.Detail = class {

    /*
     * @see https://developer.valvesoftware.com/wiki/SteamID
     */

    constructor(steam64str) {
        if (!steam64str) {
            throw new Error("Missing first parameter 'steam64str'.");
        }

        const [upper32, lower32] = this._getBinary(steam64str);
        this._y = lower32 & 1;
        this._accountNumber = (lower32 & (((1 << 31) - 1) << 1)) >> 1;
        this._instance = (upper32 & ((1 << 20) - 1));
        this._type = (upper32 & (((1 << 4) - 1) << 20)) >> 20;
        this._universe = (upper32 & (((1 << 8) - 1) << 24)) >> 24;

        this._steamId64 = steam64str;
    }

    _divide(str) {
        const length = str.length;
        const result = [];
        let num = 0;
        for (let i = 0; i < length; i++) {
            num += Number(str[i]);

            const r = Math.floor(num / 2);
            num = ((num - (2 * r)) * 10);

            if (r !== 0 || result.length !== 0) {
                result.push(r);
            }
        }

        return [result, num > 0 ? 1 : 0];
    }

    _getBinary(str) {
        let upper32 = 0;
        let lower32 = 0;
        let index = 0;
        let bit = 0;
        let _str = str;
        do {
            [_str, bit] = this._divide(_str);

            if (bit) {
                if (index < 32) {
                    lower32 |= (1 << index);
                } else {
                    upper32 |= (1 << (index - 32));
                }
            }

            index++;
        } while (_str.length > 0);

        return [upper32, lower32];
    }

    get id2() {
        return `STEAM_${this._universe}:${this._y}:${this._accountNumber}`;
    }


    get id3() {
        const map = new Map(
            [
                [0, "I"], // invalid
                [1, "U"], // individual
                [2, "M"], // multiset
                [3, "G"], // game server
                [4, "A"], // anon game server
                [5, "P"], // pending
                [6, "C"], // content server
                [7, "g"], // clan
                // [8, "T / L / C"], // chat // TODO no idea what does this mean
                [9, "a"] // anon user
            ]
        );

        let type = null;
        if (map.has(this._type)) {
            type = map.get(this._type);
        }

        if (!type) {
            return null;
        }

        return `[${type}:${this._universe}:${(this._accountNumber << 1) | this._y}]`;
    }

    get id64() {
        return this._steamId64;
    }
};


export class Viewport {

    // only concerned with vertical at this point
    static isElementInViewport(elem) {
        let elemTop = elem.offsetTop;
        let parent = elem.offsetParent;
        while (parent) {
            elemTop += parent.offsetTop;
            parent = parent.offsetParent;
        }

        const elemBottom = elemTop + elem.getBoundingClientRect().height;
        const viewportTop = window.scrollY;
        const viewportBottom = window.innerHeight + viewportTop;

        return (elemBottom <= viewportBottom && elemTop >= viewportTop);
    }
}

export class Stats {

    static async getAchievementBar(path, appid) {

        const html = await Background.action("stats", path, appid);
        const dummy = HTMLParser.htmlToDOM(html);
        const achNode = dummy.querySelector("#topSummaryAchievements");

        if (!achNode) { return null; }

        achNode.style.whiteSpace = "nowrap";

        if (!achNode.querySelector("img")) {

            // The size of the achievement bars for games without leaderboards/other stats is fine, return
            return achNode.innerHTML;
        }

        const stats = achNode.innerHTML.match(/(\d+) of (\d+) \((\d{1,3})%\)/);

        // 1 full match, 3 group matches
        if (!stats || stats.length !== 4) {
            return null;
        }

        const achievementStr = Localization.str.achievements.summary
            .replace("__unlocked__", stats[1])
            .replace("__total__", stats[2])
            .replace("__percentage__", stats[3]);

        return `<div>${achievementStr}</div>
                <div class="achieveBar">
                    <div style="width: ${stats[3]}%;" class="achieveBarProgress"></div>
                </div>`;
    }
}

export class DynamicStore {

    /*
     * FIXME
     *  1. Check usage of `await DynamicStore`, currently it does nothing
     *  2. getAppStatus() is not properly waiting for initialization of the DynamicStore
     *  3. There is no guarante that `User` is initialized before `_fetch()` is called
     *  4. getAppStatus() should probably be simplified if we force array even when only one storeId was requested
     */

    static clear() {
        return Background.action("dynamicstore.clear");
    }

    static async getAppStatus(storeId) {
        const multiple = Array.isArray(storeId);
        let promise;
        let trimmedIds;

        if (multiple) {
            trimmedIds = storeId.map(id => GameId.trimStoreId(id));
            promise = Background.action("dynamicstorestatus", trimmedIds);
        } else {
            promise = Background.action("dynamicstorestatus", GameId.trimStoreId(storeId));
        }

        let statusList;
        const dsStatusList = await promise;

        if (multiple) {
            statusList = {};
            for (let i = 0; i < storeId.length; ++i) {
                const trimmedId = trimmedIds[i];
                const id = storeId[i];
                statusList[id] = {
                    "ignored": dsStatusList[trimmedId].includes("ignored"),
                    "wishlisted": dsStatusList[trimmedId].includes("wishlisted"),
                };
                if (id.startsWith("app/")) {
                    statusList[id].owned = dsStatusList[trimmedId].includes("ownedApps");
                } else if (id.startsWith("sub/")) {
                    statusList[id].owned = dsStatusList[trimmedId].includes("ownedPackages");
                }
            }
        } else {
            statusList = {
                "ignored": dsStatusList.includes("ignored"),
                "wishlisted": dsStatusList.includes("wishlisted"),
            };
            if (storeId.startsWith("app/")) {
                statusList.owned = dsStatusList.includes("ownedApps");
            } else if (storeId.startsWith("sub/")) {
                statusList.owned = dsStatusList.includes("ownedPackages");
            }
        }

        return statusList;
    }

    static async getRandomApp() {
        await DynamicStore._fetch();
        return Background.action("dynamicStore.randomApp");
    }

    static _fetch() {
        if (!User.isSignedIn) {
            return DynamicStore.clear();
        }
        return Promise.resolve(null);
    }

    static then(onDone, onCatch) {
        if (!DynamicStore._promise) {
            DynamicStore._promise = DynamicStore._fetch();
        }
        return DynamicStore._promise.then(onDone, onCatch);
    }
}


class HorizontalScroller {

    static create(parentNode, controlLeftNode, controlRightNode) {

        let lastScroll = 0;

        parentNode.addEventListener("wheel", e => {
            e.preventDefault();
            e.stopPropagation();

            if (Date.now() - lastScroll < 200) { return; }
            lastScroll = Date.now();

            const isScrollDown = e.deltaY > 0;
            if (isScrollDown) {
                controlRightNode.click();
            } else {
                controlLeftNode.click();
            }
        });
    }
}


class AugmentedSteam {

    static addMenu() {

        HTML.afterBegin("#global_action_menu",
            `<div id="es_menu">
                <span id="es_pulldown" class="pulldown global_action_link">Augmented Steam</span>
                <div id="es_popup" class="popup_block_new">
                    <div class="popup_body popup_menu">
                        <a class="popup_menu_item" target="_blank" href="${ExtensionResources.getURL("html/options.html")}">${Localization.str.thewordoptions}</a>
                        <a class="popup_menu_item" id="es_clear_cache" href="#clear_cache">${Localization.str.clear_cache}</a>
                        <div class="hr"></div>
                        <a class="popup_menu_item" target="_blank" href="https://github.com/tfedor/AugmentedSteam">${Localization.str.contribute}</a>
                        <a class="popup_menu_item" target="_blank" href="https://github.com/tfedor/AugmentedSteam/issues">${Localization.str.bug_feature}</a>
                        <div class="hr"></div>
                        <a class="popup_menu_item" target="_blank" href="https://es.isthereanydeal.com/">${Localization.str.website}</a>
                        <a class="popup_menu_item" target="_blank" href="https://isthereanydeal.com/">IsThereAnyDeal</a>
                        <a class="popup_menu_item" target="_blank" href="https://discord.gg/yn57q7f">Discord</a>
                    </div>
                </div>
            </div>`);

        const popup = document.querySelector("#es_popup");

        document.querySelector("#es_pulldown").addEventListener("click", () => {
            // eslint-disable-next-line no-undef, new-cap
            ExtensionLayer.runInPageContext(() => { ShowMenu("es_pulldown", "es_popup", "right", "bottom", true); });
        });

        document.querySelector("#es_menu").addEventListener("click", (e) => {
            e.stopPropagation();
        });

        document.addEventListener("click", () => {
            popup.classList.remove("open");
        });

        document.querySelector("#es_clear_cache").addEventListener("click", e => {
            e.preventDefault();

            AugmentedSteam.clearCache();
            window.location.reload();
        });
    }

    static addBackToTop() {
        if (!SyncedStorage.get("show_backtotop")) { return; }

        // Remove Steam's back-to-top button
        DOMHelper.remove("#BackToTop");

        const btn = document.createElement("div");
        btn.classList.add("es_btt");
        btn.textContent = "▲";
        btn.style.visibility = "hidden";

        document.body.append(btn);

        btn.addEventListener("click", () => {
            window.scroll({
                "top": 0,
                "left": 0,
                "behavior": "smooth"
            });
        });

        btn.addEventListener("transitionstart", () => {
            if (btn.style.visibility === "hidden") {
                btn.style.visibility = "visible";
            } else {

                // transition: opacity 200ms ease-in-out;
                setTimeout(() => {
                    btn.style.visibility = "hidden";
                }, 200);
            }
        });

        window.addEventListener("scroll", () => {
            btn.classList.toggle("is-visible", window.scrollY >= 400);
        });
    }

    static clearCache() {
        localStorage.clear();
        SyncedStorage.remove("user_currency");
        SyncedStorage.remove("store_sessionid");
        Background.action("cache.clear");
    }

    static bindLogout() {

        // TODO there should be a better detection of logout, probably
        const logoutNode = document.querySelector("a[href$='javascript:Logout();']");
        logoutNode.addEventListener("click", () => {
            AugmentedSteam.clearCache();
        });
    }

    static _addWarning(innerHTML, stopShowingHandler) {
        const el = HTML.element(
            `<div class="es_warn js-warn">
                <div class="es_warn__cnt">
                    <div>${innerHTML}</div>
                    <div class="es_warn__control">
                        <a class="es_warn__btn js-warn-close">${Localization.str.update.dont_show}</a>
                        <a class="es_warn__btn js-warn-hide">${Localization.str.hide}</a>
                    </div>
                </div>
            </div>`
        );

        el.querySelector(".js-warn-close").addEventListener("click", () => {
            if (stopShowingHandler) {
                stopShowingHandler();
            }
            el.closest(".js-warn").remove();
        });

        el.querySelector(".js-warn-hide").addEventListener("click", () => {
            el.closest(".js-warn").remove();
        });

        document.getElementById("global_header").insertAdjacentElement("afterend", el);
    }

    /**
     * Display warning if browsing using a different language
     */
    static addLanguageWarning() {
        if (!SyncedStorage.get("showlanguagewarning")) { return; }

        const currentLanguage = Language.getCurrentSteamLanguage();
        if (!currentLanguage) { return; }

        if (!SyncedStorage.has("showlanguagewarninglanguage")) {
            SyncedStorage.set("showlanguagewarninglanguage", currentLanguage);
        }

        const warningLanguage = SyncedStorage.get("showlanguagewarninglanguage");

        if (currentLanguage === warningLanguage) { return; }

        Localization.loadLocalization(Language.getLanguageCode(warningLanguage)).then((strings) => {
            AugmentedSteam._addWarning(
                `${strings.using_language.replace("__current__", strings.options.lang[currentLanguage] || currentLanguage)}
                <a href="#" id="es_reset_language_code">
                ${strings.using_language_return.replace("__base__", strings.options.lang[warningLanguage] || warningLanguage)}
                </a>`,
                () => { SyncedStorage.set("showlanguagewarning", false); }
            );

            document.querySelector("#es_reset_language_code").addEventListener("click", (e) => {
                e.preventDefault();
                // eslint-disable-next-line no-undef, new-cap
                ExtensionLayer.runInPageContext(warningLanguage => { ChangeLanguage(warningLanguage); }, [warningLanguage]);
            });
        });
    }

    static addLoginWarning(type) {
        if (AugmentedSteam._loginWarningAdded || LocalStorage.get(`hide_login_warn_${type}`)) { return; }

        let host;

        if (type === "store") {
            host = "store.steampowered.com";
        } else if (type === "community") {
            host = "steamcommunity.com";
        } else {
            console.warn("Unknown login warning type %s", type);
            return;
        }

        AugmentedSteam._addWarning(
            `${Localization.str.login_warning.replace("__link__", `<a href="https://${host}/login/">${host}</a>`)}`,
            () => { LocalStorage.set(`hide_login_warn_${type}`, true); }
        );
        AugmentedSteam._loginWarningAdded = true;

        console.warn("Are you logged into %s?", host);
    }

    static handleInstallSteamButton() {
        const option = SyncedStorage.get("installsteam");
        if (option === "hide") {
            DOMHelper.remove("div.header_installsteam_btn");
        } else if (option === "replace") {
            const btn = document.querySelector("div.header_installsteam_btn > a");
            btn.textContent = Localization.str.viewinclient;
            btn.href = `steam://openurl/${window.location.href}`;
            btn.classList.add("es_steamclient_btn");
        }
    }

    static removeAboutLinks() {
        if (!SyncedStorage.get("hideaboutlinks")) { return; }

        DOMHelper.remove("#global_header a[href^='https://store.steampowered.com/about/']");
    }

    static addUsernameSubmenuLinks() {
        const node = document.querySelector(".supernav_container .submenu_username");

        HTML.afterEnd(
            node.querySelector("a"),
            `<a class="submenuitem" href="//steamcommunity.com/my/games/">${Localization.str.games}</a>`
        );
        HTML.afterEnd(
            node.querySelector("a:nth-child(2)"),
            `<a class="submenuitem" href="//store.steampowered.com/wishlist/">${Localization.str.wishlist}</a>`
        );
        HTML.beforeEnd(
            node,
            `<a class="submenuitem" href="//steamcommunity.com/my/recommended/">${Localization.str.reviews}</a>`
        );
    }

    static disableLinkFilter() {
        if (!SyncedStorage.get("disablelinkfilter")) { return; }

        // TODO Way too nested
        function removeLinksFilter(mutations) {
            const selector = "a.bb_link[href*='/linkfilter/'], div.weblink a[href*='/linkfilter/']";
            if (mutations) {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            node.querySelectorAll(selector).forEach(matchedNode => {
                                matchedNode.setAttribute(
                                    "href",
                                    matchedNode.getAttribute("href").replace(/^.+?\/linkfilter\/\?url=/, "")
                                );
                            });
                        }
                    });
                });
            } else {
                document.querySelectorAll(selector).forEach(node => {
                    node.setAttribute("href", node.getAttribute("href").replace(/^.+?\/linkfilter\/\?url=/, ""));
                });
            }
        }

        removeLinksFilter();

        const observer = new MutationObserver(removeLinksFilter);
        observer.observe(document, {"childList": true, "subtree": true});
    }

    static addRedeemLink() {
        HTML.beforeBegin(
            "#account_language_pulldown",
            `<a class="popup_menu_item" href="https://store.steampowered.com/account/registerkey">${Localization.str.activate}</a>`
        );
    }

    static replaceAccountName() {
        if (!SyncedStorage.get("replaceaccountname")) { return; }

        const accountNameNode = document.querySelector("#account_pulldown");
        const accountName = accountNameNode.textContent.trim();
        const communityName = document.querySelector("#global_header .username").textContent.trim();

        // Present on https://store.steampowered.com/account/history/
        const pageHeader = document.querySelector("h2.pageheader");
        if (pageHeader) {
            pageHeader.textContent = pageHeader.textContent.replace(accountName, communityName);
        }

        accountNameNode.textContent = communityName;

        // Don't replace title on user pages that aren't mine
        const isUserPage = /.*(id|profiles)\/.+/g.test(location.pathname);
        if (!isUserPage || location.pathname.includes(User.profilePath)) {
            document.title = document.title.replace(accountName, communityName);
        }
    }

    static launchRandomButton() {

        HTML.beforeEnd(
            "#es_popup .popup_menu",
            `<div class="hr"></div>
             <a id="es_random_game" class="popup_menu_item" style="cursor: pointer;">${Localization.str.launch_random}</a>`
        );

        document.querySelector("#es_random_game").addEventListener("click", async() => {
            const appid = await DynamicStore.getRandomApp();
            if (!appid) { return; }

            Background.action("appdetails", appid).then(response => {
                if (!response || !response.success) { return; }
                const data = response.data;

                let gameid = appid;
                let gamename;
                if (data.fullgame) {
                    gameid = data.fullgame.appid;
                    gamename = data.fullgame.name;
                } else {
                    gamename = data.name;
                }

                ExtensionLayer.runInPageContext((playGameStr, gameid, visitStore) => {
                    // eslint-disable-next-line no-undef, new-cap
                    const prompt = ShowConfirmDialog(
                        playGameStr,
                        `<img src="//steamcdn-a.akamaihd.net/steam/apps/${gameid}/header.jpg">`,
                        null,
                        null,
                        visitStore
                    );

                    prompt.done(result => {
                        if (result === "OK") { window.location.assign(`steam://run/${gameid}`); }
                        if (result === "SECONDARY") { window.location.assign(`//store.steampowered.com/app/${gameid}`); }
                    });
                },
                [
                    Localization.str.play_game.replace("__gamename__", gamename.replace("'", "").trim()),
                    gameid,
                    Localization.str.visit_store,
                ]);
            });
        });
    }

    static skipGotSteam() {
        if (!SyncedStorage.get("skip_got_steam")) { return; }

        for (const node of document.querySelectorAll("a[href^='javascript:ShowGotSteamModal']")) {
            node.href = node.href.split("'")[1];
        }
    }

    static keepSteamSubscriberAgreementState() {
        const nodes = document.querySelectorAll("#market_sell_dialog_accept_ssa,#market_buyorder_dialog_accept_ssa,#accept_ssa");
        for (const node of nodes) {
            node.checked = SyncedStorage.get("keepssachecked");

            node.addEventListener("click", () => {
                SyncedStorage.set("keepssachecked", !SyncedStorage.get("keepssachecked"));
            });
        }
    }

    static defaultCommunityTab() {
        const tab = SyncedStorage.get("community_default_tab");
        if (!tab) { return; }

        const links = document.querySelectorAll("a[href^='https://steamcommunity.com/app/']");
        for (const link of links) {
            if (link.classList.contains("apphub_sectionTab")) { continue; }
            if (!/^\/app\/[0-9]+\/?$/.test(link.pathname)) { continue; }
            if (!link.pathname.endsWith("/")) {
                link.pathname += "/";
            }
            link.pathname += `${tab}/`;
        }
    }

    static horizontalScrolling() {
        if (!SyncedStorage.get("horizontalscrolling")) { return; }

        for (const node of document.querySelectorAll(".slider_ctn:not(.spotlight)")) {
            HorizontalScroller.create(
                node.parentNode.querySelector("#highlight_strip, .store_horizontal_autoslider_ctn"),
                node.querySelector(".slider_left"),
                node.querySelector(".slider_right"),
            );
        }
    }
}

Background.registerErrorHandler(({name, msg}) => {
    if (name !== "LoginError") { return false; }

    AugmentedSteam.addLoginWarning(msg);
    ProgressBar.finishRequest();

    return true;
});

export class EarlyAccess {

    static async getEaNodes(nodes, selectorModifier) {

        const appidsMap = new Map();

        for (const node of nodes) {
            node.classList.add("es_ea_checked");

            const linkNode = node.querySelector("a");
            const href = linkNode && linkNode.hasAttribute("href") ? linkNode.getAttribute("href") : node.getAttribute("href");
            const imgHeader = node.querySelector(`img${selectorModifier}`);
            const appid = GameId.getAppid(href) || GameId.getAppidImgSrc(imgHeader ? imgHeader.getAttribute("src") : null);

            if (appid) {
                appidsMap.set(String(appid), node);
            }
        }

        const eaStatus = await Background.action("isea", Array.from(appidsMap.keys()));

        for (const appid of appidsMap.keys()) {
            if (!eaStatus[appid]) {
                appidsMap.delete(appid);
            }
        }

        return Array.from(appidsMap.values());
    }

    static async _checkNodes(selectors, selectorModifier) {
        const _selectorModifier = typeof selectorModifier === "string" ? selectorModifier : "";
        const selector = selectors.map(selector => `${selector}:not(.es_ea_checked)`).join(",");

        for (const node of await EarlyAccess.getEaNodes(document.querySelectorAll(selector), _selectorModifier)) {
            node.classList.add("es_early_access");

            const imgHeader = node.querySelector(`img${_selectorModifier}`);
            const container = document.createElement("span");
            container.classList.add("es_overlay_container");
            DOMHelper.wrap(container, imgHeader);

            HTML.afterBegin(
                container,
                `<span class="es_overlay"><img title="${Localization.str.early_access}" src="${EarlyAccess._imageUrl}"></span>`
            );
        }
    }

    static _handleStore() {

        // TODO refactor these checks to appropriate page calls
        switch (true) {
        case /^\/app\/.*/.test(window.location.pathname):
            EarlyAccess._checkNodes([".game_header_image_ctn", ".small_cap"]);
            break;
        case /^\/(?:genre|browse|tag)\/.*/.test(window.location.pathname):
            EarlyAccess._checkNodes([".tab_item",
                ".special_tiny_cap",
                ".cluster_capsule",
                ".game_capsule",
                ".browse_tag_game",
                ".dq_item:not(:first-child)",
                ".discovery_queue:not(:first-child)"]);
            break;
        case /^\/search\/.*/.test(window.location.pathname):
            EarlyAccess._checkNodes([".search_result_row"]);
            break;
        case /^\/recommended/.test(window.location.pathname):
            EarlyAccess._checkNodes([".friendplaytime_appheader",
                ".header_image",
                ".appheader",
                ".recommendation_carousel_item .carousel_cap",
                ".game_capsule",
                ".game_capsule_area",
                ".similar_grid_capsule"]);
            break;
        case /^\/tag\/.*/.test(window.location.pathname):
            EarlyAccess._checkNodes([".cluster_capsule",
                ".tab_row",
                ".browse_tag_game_cap"]);
            break;
        case /^\/(?:curator|developer|dlc|publisher)\/.*/.test(window.location.pathname):
            EarlyAccess._checkNodes(["#curator_avatar_image",
                ".capsule"]);
            break;
        case /^\/$/.test(window.location.pathname):
            EarlyAccess._checkNodes([".cap",
                ".special",
                ".game_capsule",
                ".cluster_capsule",
                ".recommended_spotlight_ctn",
                ".curated_app_link",
                ".dailydeal_ctn a",
                ".tab_item:last-of-type",

                // Sales fields
                ".large_sale_caps a",
                ".small_sale_caps a",
                ".spotlight_img"]);
            break;

            // EarlyAccess._checkNodes($(".sale_capsule_image").parent()); // TODO check/remove
        }
    }

    static _handleCommunity() {

        // TODO refactor these checks to appropriate page calls
        switch (true) {
        case /^\/(?:id|profiles)\/.+\/(wishlist|games|followedgames)/.test(window.location.pathname):
            EarlyAccess._checkNodes([".gameListRowLogo"]);
            break;
        case /^\/(?:id|profiles)\/.+\/\b(home|myactivity)\b/.test(window.location.pathname):
            EarlyAccess._checkNodes([".blotter_gamepurchase_content a"]);
            break;
        case /^\/(?:id|profiles)\/.+\/\b(reviews|recommended)\b/.test(window.location.pathname):
            EarlyAccess._checkNodes([".leftcol"]);
            break;
        case /^\/(?:id|profiles)\/.+/.test(window.location.pathname):
            EarlyAccess._checkNodes([".game_info_cap",
                ".showcase_gamecollector_game",
                ".favoritegame_showcase_game"]);
        }
    }

    static showEarlyAccess() {
        if (!SyncedStorage.get("show_early_access")) { return; }

        let imageName = "img/overlay/early_access_banner_english.png";
        if (Language.isCurrentLanguageOneOf([
            "brazilian",
            "french",
            "italian",
            "japanese",
            "koreana",
            "polish",
            "portuguese",
            "russian",
            "schinese",
            "spanish",
            "latam",
            "tchinese",
            "thai"
        ])) {
            imageName = `img/overlay/early_access_banner_${Language.getCurrentSteamLanguage()}.png`;
        }
        EarlyAccess._imageUrl = ExtensionResources.getURL(imageName);

        switch (window.location.host) {
        case "store.steampowered.com":
            EarlyAccess._handleStore();
            break;
        case "steamcommunity.com":
            EarlyAccess._handleCommunity();
            break;
        }
    }
}


export class Inventory {

    static getCoupon(appid) {
        return Background.action("coupon", appid);
    }

    static async getAppStatus(appids, options) {

        function getStatusObject(giftsAndPasses, hasCoupon) {
            return {
                "gift": giftsAndPasses.includes("gifts"),
                "guestPass": giftsAndPasses.includes("passes"),
                "coupon": Boolean(hasCoupon),
            };
        }

        const opts = {"giftsAndPasses": true,
            "coupons": true,
            ...options};

        if (!opts.giftsAndPasses && !opts.coupons) { return null; }

        const multiple = Array.isArray(appids);

        try {
            const [giftsAndPasses, coupons] = await Promise.all([
                opts.giftsAndPasses ? Background.action("hasgiftsandpasses", appids) : Promise.resolve(),
                opts.coupons ? Background.action("hascoupon", appids) : Promise.resolve(),
            ]);

            if (multiple) {
                const results = {};

                for (const id of appids) {
                    results[id] = getStatusObject(giftsAndPasses ? giftsAndPasses[id] : [], coupons ? coupons[id] : false);
                }

                return results;
            }
            return getStatusObject(giftsAndPasses || [], typeof coupons === "undefined" ? false : coupons);
        } catch (err) {
            if (multiple) {
                const results = {};
                for (const id of appids) {
                    results[id] = getStatusObject([], false);
                }
                return results;
            }

            return getStatusObject([], false);
        }
    }

    static hasInInventory6(marketHashes) {
        return Background.action("hasitem", marketHashes);
    }
}

export class Prices {

    constructor() {
        this.appids = [];
        this.subids = [];
        this.bundleids = [];

        this.priceCallback = null;
        this.bundleCallback = null;

        this._bundles = [];
    }

    _getApiParams() {
        const apiParams = {};

        if (!SyncedStorage.get("showallstores") && SyncedStorage.get("stores").length > 0) {
            apiParams.stores = SyncedStorage.get("stores").join(",");
        }

        const cc = User.storeCountry;
        if (cc) {
            apiParams.cc = cc;
        }

        apiParams.appids = this.appids.join(",");
        apiParams.subids = this.subids.join(",");
        apiParams.bundleids = this.bundleids.join(",");

        if (SyncedStorage.get("showlowestpricecoupon")) {
            apiParams.coupon = true;
        }

        if (!apiParams.appids && !apiParams.subids && !apiParams.bundleids) { return null; }

        return apiParams;
    }

    _processPrices(gameid, meta, info) {
        if (!this.priceCallback) { return; }

        const [type, id] = gameid.split("/");

        const node = document.createElement("div");
        node.classList.add("itad-pricing");
        node.id = `es_price_${id}`;

        const pricingStr = Localization.str.pricing;

        let hasData = false;
        const priceData = info.price;
        const lowestData = info.lowest;
        const bundledCount = info.bundles.count;
        const urlData = info.urls;

        // Current best
        if (priceData) {
            hasData = true;

            let lowest;
            let voucherStr = "";
            if (SyncedStorage.get("showlowestpricecoupon") && priceData.price_voucher) {
                lowest = new Price(priceData.price_voucher, meta.currency);

                const voucher = HTML.escape(priceData.voucher);
                voucherStr = `${pricingStr.with_voucher.replace(
                    "__voucher__",
                    `<span class="itad-pricing__voucher">${voucher}</span>`
                )} `;
            } else {
                lowest = new Price(priceData.price, meta.currency);
            }

            lowest = lowest.inCurrency(Currency.customCurrency);
            let prices = lowest.toString();
            if (Currency.customCurrency !== Currency.storeCurrency) {
                const lowestAlt = lowest.inCurrency(Currency.storeCurrency);
                prices += ` (${lowestAlt.toString()})`;
            }
            const pricesStr = `<span class="itad-pricing__price">${prices}</span>`;

            let cutStr = "";
            if (priceData.cut > 0) {
                cutStr = `<span class="itad-pricing__cut">-${priceData.cut}%</span> `;
            }

            const storeStr = pricingStr.store.replace("__store__", priceData.store);

            let drmStr = "";
            if (priceData.drm.length > 0 && priceData.store !== "Steam") {
                drmStr = `<span class="itad-pricing__drm">(${priceData.drm[0]})</span>`;
            }

            const infoUrl = HTML.escape(urlData.info);
            const storeUrl = HTML.escape(priceData.url.toString());

            HTML.beforeEnd(node, `<a href="${infoUrl}" target="_blank">${pricingStr.lowest_price}</a>`);
            HTML.beforeEnd(node, pricesStr);
            HTML.beforeEnd(
                node,
                `<a href="${storeUrl}" class="itad-pricing__main" target="_blank">${cutStr}${voucherStr}${storeStr} ${drmStr}</a>`
            );
        }

        // Historical low
        if (lowestData) {
            hasData = true;

            const historical = new Price(lowestData.price, meta.currency).inCurrency(Currency.customCurrency);
            let prices = historical.toString();
            if (Currency.customCurrency !== Currency.storeCurrency) {
                const historicalAlt = historical.inCurrency(Currency.storeCurrency);
                prices += ` (${historicalAlt.toString()})`;
            }
            const pricesStr = `<span class="itad-pricing__price">${prices}</span>`;

            let cutStr = "";
            if (lowestData.cut > 0) {
                cutStr = `<span class="itad-pricing__cut">-${lowestData.cut}%</span> `;
            }

            const storeStr = pricingStr.store.replace("__store__", lowestData.store);
            const dateStr = new Date(lowestData.recorded * 1000).toLocaleDateString();

            const infoUrl = HTML.escape(urlData.history);

            HTML.beforeEnd(node, `<a href="${infoUrl}" target="_blank">${pricingStr.historical_low}</a>`);
            HTML.beforeEnd(node, pricesStr);
            HTML.beforeEnd(node, `<div class="itad-pricing__main">${cutStr}${storeStr} ${dateStr}</div>`);
        }

        // times bundled
        if (bundledCount > 0) {
            hasData = true;

            const bundledUrl = HTML.escape(urlData.bundles || urlData.bundle_history);
            const bundledStr = pricingStr.bundle_count.replace("__count__", bundledCount);

            HTML.beforeEnd(node, `<a href="${bundledUrl}" target="_blank">${pricingStr.bundled}</a>`);
            HTML.beforeEnd(node, `<div class="itad-pricing__bundled">${bundledStr}</div>`);
        }

        if (hasData) {
            this.priceCallback(type, id, node);
        }
    }

    _processBundles(meta, info) {
        if (!this.bundleCallback) { return; }

        let purchase = "";

        for (const bundle of info.bundles.live) {
            const tiers = bundle.tiers;

            let endDate;
            if (bundle.expiry) {
                endDate = new Date(bundle.expiry * 1000);
            }

            const currentDate = new Date().getTime();
            if (endDate && currentDate > endDate) { continue; }

            const bundleNormalized = JSON.stringify({
                "page":  bundle.page || "",
                "title": bundle.title || "",
                "url":   bundle.url || "",
                "tiers": (() => {
                    const sorted = [];
                    for (const t of Object.keys(tiers)) {
                        sorted.push((tiers[t].games || []).sort());
                    }
                    return sorted;
                })(),
            });

            if (this._bundles.indexOf(bundleNormalized) >= 0) { continue; }
            this._bundles.push(bundleNormalized);

            if (bundle.page) {
                const bundlePage = Localization.str.buy_package.replace("__package__", `${bundle.page} ${bundle.title}`);
                purchase
                    += `<div class="game_area_purchase_game">
                            <div class="game_area_purchase_platform"></div>
                            <h1>${bundlePage}</h1>`;
            } else {
                const bundleTitle = Localization.str.buy_package.replace("__package__", bundle.title);
                purchase
                    += `<div class="game_area_purchase_game_wrapper">
                            <div class="game_area_purchase_game"></div>
                            <div class="game_area_purchase_platform"></div>
                            <h1>${bundleTitle}</h1>`;
            }

            if (endDate) {
                purchase += `<p class="game_purchase_discount_countdown">${Localization.str.bundle.offer_ends} ${endDate}</p>`;
            }

            purchase += '<p class="package_contents">';

            let bundlePrice;
            const appName = document.querySelector(".apphub_AppName").textContent;

            for (let i = 0; i < tiers.length; ++i) {
                const tierNum = i + 1;
                const tier = tiers[i];

                purchase += "<b>";
                if (tiers.length > 1) {
                    const tierName = tier.note || Localization.str.bundle.tier.replace("__num__", tierNum);
                    const tierPrice = (new Price(tier.price, meta.currency).inCurrency(Currency.customCurrency))
                        .toString();

                    purchase += Localization.str.bundle.tier_includes.replace("__tier__", tierName).replace("__price__", tierPrice)
                        .replace("__num__", tier.games.length);
                } else {
                    purchase += Localization.str.bundle.includes.replace("__num__", tier.games.length);
                }
                purchase += ":</b> ";

                const gameList = tier.games.join(", ");
                if (gameList.includes(appName)) {
                    purchase += gameList.replace(appName, `<u>${appName}</u>`);
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
                            </div>
                            <div class="game_purchase_action_bg">`;

            if (bundlePrice && bundlePrice > 0) {
                bundlePrice = (new Price(bundlePrice, meta.currency).inCurrency(Currency.customCurrency))
                    .toString();
                purchase += `<div class="game_purchase_price price" itemprop="price">${bundlePrice}</div>`;
            }

            purchase += `<div class="btn_addtocart">
                            <a class="btnv6_green_white_innerfade btn_medium" href="${bundle.url}" target="_blank">
                                <span>${Localization.str.buy}</span>
                            </a>
                        </div></div></div></div>`;
        }

        if (purchase) {
            this.bundleCallback(purchase);
        }
    }

    load() {
        const apiParams = this._getApiParams();
        if (!apiParams) { return; }

        Background.action("prices", apiParams).then(response => {
            const meta = response[".meta"];

            for (const [gameid, info] of Object.entries(response.data)) {
                this._processPrices(gameid, meta, info);
                this._processBundles(meta, info);
            }
        });
    }
}

export class UpdateHandler {

    static checkVersion(onUpdate) {
        const lastVersion = Version.fromString(SyncedStorage.get("version"));
        const currentVersion = Version.fromString(Info.version);

        if (currentVersion.isAfter(lastVersion)) {
            if (SyncedStorage.get("version_show")) {
                this._showChangelog();
            }
            this._migrateSettings(lastVersion);
            onUpdate();
        }

        SyncedStorage.set("version", Info.version);
    }

    static async _showChangelog() {

        // FIXME
        const changelog = (await RequestData.getHttp(ExtensionResources.getURL("html/changelog_new.html"))).replace(/\r|\n/g, "").replace(/'/g, "\\'");
        const logo = ExtensionResources.getURL("img/es_128.png");
        const dialog = `<div class="es_changelog"><img src="${logo}"><div>${changelog}</div></div>`;

        const connectBtn = document.querySelector("#itad_connect");
        function itadConnected() { connectBtn.replaceWith("✓"); }

        ExtensionLayer.runInPageContext(
            (updatedStr, dialog) => { ShowAlertDialog(updatedStr, dialog); }, // eslint-disable-line new-cap, no-undef
            [Localization.str.update.updated.replace("__version__", Info.version), dialog]
        );

        if (Version.fromString(Info.version).isSame(new Version(1, 4))) {

            if (await BackgroundBase.action("itad.isconnected")) {
                itadConnected();
            } else {
                connectBtn.addEventListener("click", async() => {
                    await BackgroundBase.action("itad.authorize");
                    ITAD.create();
                    itadConnected();
                });
            }
        }
    }

    static _migrateSettings(oldVersion) {

        if (oldVersion.isSameOrBefore("1.3.1")) {
            BackgroundBase.action("cache.clear");

            SyncedStorage.set("horizontalscrolling", SyncedStorage.get("horizontalmediascrolling"));
            SyncedStorage.remove("horizontalmediascrolling");
        }

        if (oldVersion.isSameOrBefore("1.4")) {
            SyncedStorage.remove("show_sysreqcheck");
        }

        if (oldVersion.isSame("1.4")) {
            Background.action("migrate.notesToSyncedStorage");
        }

        if (oldVersion.isSameOrBefore("1.4.1")) {
            SyncedStorage.set("profile_steamid", SyncedStorage.get("profile_permalink"));
            SyncedStorage.remove("profile_permalink");
        }

        if (oldVersion.isSameOrBefore("1.4.3")) {
            SyncedStorage.remove("contscroll");
            Background.action("logout");
        }

        if (oldVersion.isSameOrBefore("1.4.7")) {
            const emoticons = LocalStorage.get("fav_emoticons");
            if (Array.isArray(emoticons)) {
                SyncedStorage.set("fav_emoticons", emoticons);
            }
        }
    }
}


export class Common {

    static init() {

        console.log(
            `%c Augmented %cSteam v${Info.version} %c https://es.isthereanydeal.com/`,
            "background: #000000; color: #046eb2",
            "background: #000000; color: #ffffff",
            "",
        );

        ProgressBar.create();
        ProgressBar.loading();
        UpdateHandler.checkVersion(AugmentedSteam.clearCache);
        AugmentedSteam.addBackToTop();
        AugmentedSteam.addMenu();
        AugmentedSteam.addLanguageWarning();
        AugmentedSteam.handleInstallSteamButton();
        AugmentedSteam.removeAboutLinks();
        EarlyAccess.showEarlyAccess();
        AugmentedSteam.disableLinkFilter();
        AugmentedSteam.skipGotSteam();
        AugmentedSteam.keepSteamSubscriberAgreementState();
        AugmentedSteam.defaultCommunityTab();
        AugmentedSteam.horizontalScrolling();
        ITAD.create();

        if (User.isSignedIn) {
            AugmentedSteam.addUsernameSubmenuLinks();
            AugmentedSteam.addRedeemLink();
            AugmentedSteam.replaceAccountName();
            AugmentedSteam.launchRandomButton();
            AugmentedSteam.bindLogout();
        }
    }
}

export class Clipboard {

    static set(content) {

        // Based on https://stackoverflow.com/a/12693636
        document.oncopy = (e) => {
            e.clipboardData.setData("Text", content);
            e.preventDefault();
        };

        document.execCommand("Copy");
        document.oncopy = null;
    }
}

export class MediaPage {
    workshopPage() {
        this._mediaSliderExpander(HTML.beforeEnd, "#highlight_player_area");
    }
}


// Most of the code here comes from dselect.js
export class Sortbox {

    static init() {
        this._activeDropLists = {};
        this._lastSelectHideTime = 0;

        document.addEventListener("mousedown", e => this._handleMouseClick(e));
    }

    static _handleMouseClick(e) {
        for (const key of Object.keys(this._activeDropLists)) {
            if (!this._activeDropLists[key]) { continue; }

            const ulAboveEvent = e.target.closest("ul");

            if (ulAboveEvent && ulAboveEvent.id === `${key}_droplist`) { continue; }

            this._hide(key);
        }
    }

    static _highlightItem(id, index, bSetSelected) {
        const droplist = document.querySelector(`#${id}_droplist`);
        const trigger = document.querySelector(`#${id}_trigger`);
        const rgItems = droplist.getElementsByTagName("a");

        if (index >= 0 && index < rgItems.length) {
            const item = rgItems[index];

            if (typeof trigger.highlightedItem !== "undefined" && trigger.highlightedItem !== index) {
                rgItems[trigger.highlightedItem].className = "inactive_selection";
            }

            trigger.highlightedItem = index;
            rgItems[index].className = "highlighted_selection";

            let yOffset = rgItems[index].offsetTop + rgItems[index].clientHeight;
            let curVisibleOffset = droplist.scrollTop + droplist.clientHeight;
            let bScrolledDown = false;
            const nMaxLoopIterations = rgItems.length;
            let nLoopCounter = 0;

            while (curVisibleOffset < yOffset && nLoopCounter++ < nMaxLoopIterations) {
                droplist.scrollTop += rgItems[index].clientHeight;
                curVisibleOffset = droplist.scrollTop + droplist.clientHeight;
                bScrolledDown = true;
            }

            if (!bScrolledDown) {
                nLoopCounter = 0;
                yOffset = rgItems[index].offsetTop;
                curVisibleOffset = droplist.scrollTop;
                while (curVisibleOffset > yOffset && nLoopCounter++ < nMaxLoopIterations) {
                    droplist.scrollTop -= rgItems[index].clientHeight;
                    curVisibleOffset = droplist.scrollTop;
                }
            }

            if (bSetSelected) {
                HTML.inner(trigger, item.innerHTML);
                const input = document.querySelector(`#${id}`);
                input.value = item.id;
                input.dispatchEvent(new Event("change"));

                this._hide(id);
            }
        }
    }

    static _onFocus(id) {
        this._activeDropLists[id] = true;
    }

    static _onBlur(id) {
        if (!this._classCheck(document.querySelector(`#${id}_trigger`), "activetrigger")) { this._activeDropLists[id] = false; }
    }

    static _hide(id) {
        const droplist = document.querySelector(`#${id}_droplist`);
        const trigger = document.querySelector(`#${id}_trigger`);

        const d = new Date();
        this._lastSelectHideTime = d.valueOf();

        trigger.className = "trigger";
        droplist.className = "dropdownhidden";
        this._activeDropLists[id] = false;
        trigger.focus();
    }

    static _show(id) {
        const d = new Date();
        if (d - this._lastSelectHideTime < 50) { return; }

        const droplist = document.querySelector(`#${id}_droplist`);
        const trigger = document.querySelector(`#${id}_trigger`);

        trigger.className = "activetrigger";
        droplist.className = "dropdownvisible";
        this._activeDropLists[id] = true;
        trigger.focus();
    }

    static _onTriggerClick(id) {
        if (!this._classCheck(document.querySelector(`#${id}_trigger`), "activetrigger")) {
            this._show(id);
        }
    }

    static _classCheck(element, className) {
        return new RegExp(`\\b${className}\\b`).test(element.className);
    }

    /**
     * NOTE FOR ADDON REVIEWER:
     * Elements returned by this function are already sanitized (calls to HTML class),
     * so they can be safely inserted without being sanitized again.
     * If we would sanitize them again, all event listeners would be lost due to
     * DOMPurify only returning HTML strings.
     */
    static get(name, options, initialOption, changeFn, storageOption) {

        const id = `sort_by_${name}`;
        let reversed = initialOption.endsWith("_DESC");

        const arrowDown = "↓";
        const arrowUp = "↑";

        const box = HTML.element(
            `<div class="es-sortbox es-sortbox--${name}">
                <div class="es-sortbox__label">${Localization.str.sort_by}</div>
                <div class="es-sortbox__container">
                    <input id="${id}" type="hidden" name="${name}" value="${initialOption}">
                    <a class="trigger" id="${id}_trigger"></a>
                    <div class="es-dropdown">
                        <ul id="${id}_droplist" class="es-dropdown__list dropdownhidden"></ul>
                    </div>
                </div>
                <span class="es-sortbox__reverse">${arrowDown}</span>
            </div>`
        );

        const input = box.querySelector(`#${id}`);

        function getTrimmedValue(val) { return val.replace(/(_ASC|_DESC)$/, ""); }

        function onChange(val, reversed) {
            const _val = getTrimmedValue(val);
            changeFn(_val, reversed);
            if (storageOption) { SyncedStorage.set(storageOption, `${_val}_${reversed ? "DESC" : "ASC"}`); }
        }

        input.addEventListener("change", () => { onChange(this.value.replace(`${id}_`, ""), reversed); });

        // Trigger changeFn for initial option
        if (initialOption !== "default_ASC") {
            input.dispatchEvent(new Event("change"));
        }

        const reverseEl = box.querySelector(".es-sortbox__reverse");
        reverseEl.addEventListener("click", () => {
            reversed = !reversed;
            reverseEl.textContent = reversed ? arrowUp : arrowDown;
            onChange(input.value.replace(`${id}_`, ""), reversed);
        });
        if (reversed) { reverseEl.textContent = arrowUp; }

        const trigger = box.querySelector(`#${id}_trigger`);
        trigger.addEventListener("focus", () => this._onFocus(id));
        trigger.addEventListener("blur", () => this._onBlur(id));
        trigger.addEventListener("click", () => this._onTriggerClick(id));

        const ul = box.querySelector("ul");
        const trimmedOption = getTrimmedValue(initialOption);
        for (let i = 0; i < options.length; ++i) {
            const [key, text] = options[i];

            let toggle = "inactive";
            if (key === trimmedOption) {
                box.querySelector(`#${id}`).value = key;
                box.querySelector(".trigger").textContent = text;
                toggle = "highlighted";
            }

            HTML.beforeEnd(ul,
                `<li>
                    <a class="${toggle}_selection" tabindex="99999" id="${id}_${key}">${text}</a>
                </li>`);

            const a = ul.querySelector("li:last-child > a");

            // a.href = "javascript:DSelectNoop()";
            a.addEventListener("mouseover", () => this._highlightItem(id, i, false));
            a.addEventListener("click", () => this._highlightItem(id, i, true));
        }

        return box;
    }
}

export class ConfirmDialog {

    static open(strTitle, strDescription, strOKButton, strCancelButton, strSecondaryActionButton) {
        return ExtensionLayer.runInPageContext((a, b, c, d, e) => {
            // eslint-disable-next-line no-undef, new-cap
            const prompt = ShowConfirmDialog(a, b, c, d, e);

            return new Promise((resolve) => {
                prompt.done(result => {
                    resolve(result);
                }).fail(() => {
                    resolve("CANCEL");
                });
            });
        },
        [
            strTitle,
            strDescription,
            strOKButton,
            strCancelButton,
            strSecondaryActionButton
        ],
        true);
    }
}

Sortbox.init();
