
let Info = {
    version: "1.0"
};


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

        console.log("//" + Config.ApiServerHost + "/" + endpoint + "/" + queryString);
        return "//" + Config.ApiServerHost + "/" + endpoint + "/" + queryString;
    };

    return self;
})();


let Settings = (function(){

    let self = {};

    // FIXME

    self.get = function(name, defaultValue) {
        return defaultValue;
    };

    return self;
})();


let LocalData = (function(){

    let self = {};

    self.set = function(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    };

    self.get = function(key, defaultValue) {
        let v = localStorage.getItem(key);
        if (!v) return defaultValue;
        return JSON.parse(v);
    };

    self.del = function(key) {
        localStorage.removeItem(key);
    };

    return self;
})();

let ExtensionLayer = (function() {

    let self = {};

    self.getLocalUrl = function(url) {
        return chrome.extension.getURL(url);
    };

    // FIXME this may be dangerous?
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

    self.get = function(key, defaultValue) {
        return typeof localCopy[key] === "undefined" ? defaultValue : localCopy[key];
    };

    self.set = function(key, value) {
        localCopy[key] = value;

        let newVal = {};
        newVal[key] = value;
        storageAdapter.set(newVal);
    };

    self.remove = function(key) {
        // FIXME
    };

    // load whole storage and make local copy
    self.load = function() {
        return new Promise(function(resolve, reject) {
            storageAdapter.get(function(result) {
                localCopy = result;
                resolve();
            })
        });
    };

    return self;
})();


let Request = (function(){
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
                    console.log("header", settings.headers[i][0], settings.headers[i][1]);
                    request.setRequestHeader(settings.headers[i][0], settings.headers[i][1]);
                }
            }

            request.send(settings.body);
        });
    };

    self.getApi = function(api, query) {
        return self.getJson(Api.getApiUrl(api, query));
    };

    self.post = function(url, data, settings) {
        return self.getHttp(url, Object.assign(settings || {}, {
            headers: [
                ["Content-Type", "application/x-www-form-urlencoded"]
            ],
            method: "POST",
            body: Object.keys(data).map(key => key + '=' + encodeURIComponent(data[key])).join('&')
        }));
    };

    return self;
})();

let ProgressBar = (function(){
    let self = {};

    let node = null;

    self.create = function() {
        if (!SyncedStorage.get("show_progressbar", true)) { return; }

        document.querySelector("#global_actions").insertAdjacentHTML("afterend", `
            <div class="es_progress_wrap">
                <div id="es_progress" class="complete" title="${ Localization.str.ready.ready }">
                    <div class="progress-inner-element">
                        <div class="progress-bar">
                            <div class="progress-value" style="width: 18px"></div>
                        </div>
                    </div>
                </div>
            </div>
        `);

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

        node.querySelector(".progress-value").style.width = value; // TODO "%"?

        if (value >= 100) {
            node.classList.add("complete");
            node.setAttribute("title", Localization.str.ready.ready)
        }
    };

    self.failed = function(message, url, status, error) {
        if (!node) { return; }

        node.classList.add("error");
        node.setAttribute("title", "");

        let nodeError = node.querySelector(".es_progress_error");
        if (!nodeError) {
            node.insertAdjacentHTML("afterend", "<div class='es_progress_error'>" + Localization.str.ready.failed + ": <ul></ul></div>");
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
        return Request.getLocalJson("/localization/" + code + "/strings.json");
    };

    self.promise = function(){
        let lang = Settings.get("language");
        let local = Language.getLanguageCode(lang);

        return new Promise(function(resolve, reject) {

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

    self.promise = function() {
        let avatarNode = document.querySelector("#global_actions .playerAvatar");
        self.profileUrl = avatarNode ? avatarNode.getAttribute("href") : false;
        self.profilePath = self.profileUrl && (self.profileUrl.match(/\/(?:id|profiles)\/(.+?)\/$/) || [])[0];

        return new Promise(function(resolve, reject) {
            if (self.profilePath) {
                let userLogin = LocalData.get("userLogin");
                if (userLogin && userLogin.profilePath === self.profilePath) {
                    self.isSignedIn = true;
                    self.steamId = userLogin.steamId;
                    resolve();
                } else {
                    Request.getHttp("//steamcommunity.com/profiles/0/", {withCredentials: true})
                        .then(function(response) {
                            self.steamId = (response.match(/g_steamID = "(\d+)";/) || [])[1];

                            if (self.steamId) {
                                self.isSignedIn = true;
                                LocalData.set("userLogin", {"steamId": self.steamId, "profilePath": self.profilePath});
                            }

                            resolve();
                        }, reject);
                }

            } else {
                resolve();
            }
        });
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

    self.getCountry = function() {
        let country = BrowserHelper.getCookie("steamCountry");
        if (!country) { return null; }
        return country.substr(0, 2);
    };

    self.getPurchaseDate = function(lang, appName) {
        return new Promise(function(resolve, reject) {
            let purchaseDates = LocalData.get("purchase_dates", {});

            appName = StringUtils.clearSpecialSymbols(appName);

            // Return date from cache
            if (purchaseDates && purchaseDates[lang] && purchaseDates[lang][appName]) {
                resolve(purchaseDates[lang][appName]);
            }

            let lastUpdate = LocalData.get("purchase_dates_time", 0);

            // Update cache if needed
            if (!TimeHelper.isExpired(lastUpdate, 300)) {
                resolve();
                return;
            }

            Request.getHttp("https://store.steampowered.com/account/licenses/?l=" + lang).then(result => {
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

    let typeToNumberMap = {
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

    let numberToTypeMap = {
        5: "RUB",
        3: "EUR",
        2: "GBP",
        6: "PLN",
        7: "BRL",
        8: "JPY",
        9: "NOK",
        10: "IDR",
        11: "MYR",
        12: "PHP",
        13: "SGD",
        14: "THB",
        15: "VND",
        16: "KRW",
        17: "TRY",
        18: "UAH",
        19: "MXN",
        20: "CAD",
        21: "AUD",
        22: "NZD",
        23: "CNY",
        24: "INR",
        25: "CLP",
        26: "PEN",
        27: "COP",
        28: "ZAR",
        29: "HKD",
        30: "TWD",
        31: "SAR",
        32: "AED",
        34: "ARS",
        35: "ILS",
        37: "KZT",
        38: "KWD",
        39: "QAR",
        40: "CRC",
        41: "UYU"
    };

    self.promise = function() {
        return new Promise(function(resolve, reject) {
            let currencySetting = Settings.get("override_price", "auto");

            if (currencySetting !== "auto") {
                self.userCurrency = currencySetting;
                resolve();
                return;
            }

            let currencyCache = SyncedStorage.get("userCurrency", {});
            if (currencyCache.userCurrency && currencyCache.userCurrency.currencyType && TimeHelper.isExpired(currencyCache.userCurrency.updated, 3600)) {
                self.userCurrency = currencyCache.userCurrency.currencyType;
                resolve();
            } else {
                Request.getHttp("//store.steampowered.com/steamaccount/addfunds", { withCredentials: true })
                    .then(
                        response => {
                            let dummyHtml = document.createElement("html");
                            dummyHtml.innerHTML = response;

                            self.userCurrency = dummyHtml.querySelector("input[name=currency]").value;
                            SyncedStorage.set("userCurrency", {currencyType: self.userCurrency, updated: parseInt(Date.now() / 1000, 10)})
                        },
                        () => {
                            Request
                                .getHttp("//store.steampowered.com/app/220", { withCredentials: true })
                                .then(response => {
                                    let dummyHtml = document.createElement("html");
                                    dummyHtml.innerHTML = response;

                                    let currency = dummyHtml.querySelector("meta[itemprop=priceCurrency]").getAttribute("content");
                                    if (!currency) {
                                        throw new Error();
                                    }

                                    self.userCurrency = currency;
                                    SyncedStorage.set("userCurrency", {currencyType: self.userCurrency, updated: parseInt(Date.now() / 1000, 10)})
                                });
                        }
                    )
                    .finally(resolve);
            }
        });
    };

    self.convertFrom = function(price, currency) {
        // FIXME
        return price;
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

        if (convert !== false && SyncedStorage.get("override_price", "auto") !== "auto") {
            this.value = Currency.convertFrom(this.value, this.currency);
            this.currency = Currency.userCurrency;
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
        return array.indexOf(self.getCurrentSteamLanguage()) != -1;
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
        let elemBottom = elemTop + elem.getBoundingClientRect().height;
        let viewportTop = window.scrollY;
        let viewportBottom = window.innerHeight + viewportTop;

        return (elemBottom <= viewportBottom && elemTop >= viewportTop);
    };

    self.htmlToElement = function(html) {
        let template = document.createElement('template');
        html = html.trim(); // Never return a text node of whitespace as the result
        template.innerHTML = html;
        return template.content.firstChild;
    };

    self.getVariableFromDom = function(variableName, type) {
        let nodes = document.querySelectorAll("script");

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

        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            let m = node.textContent.match(regex);
            if (m) {
                if (type === "int") {
                    return parseInt(m[1]);
                }
                return JSON.parse(m[1]);
            }
        }
        return null;
    };

    return self;
})();

let EnhancedSteam = (function() {

    let self = {};

    self.checkVersion = function() {
        let version = SyncedStorage.get("version");

        if (!version) {
            // new instalation detected
            SyncedStorage.set("version", version);
            return;
        }

        if (version === Info.version || !SyncedStorage.get("version_show", true)) {
            return;
        }

        // TODO
        Request.getHttp(ExtensionLayer.getLocalUrl("changelog_new.html")).then(
            changelog => {
                changelog = changelog.replace(/\r|\n/g, "").replace(/'/g, "\\'");
                let logo = ExtensionLayer.getLocalUrl("img/enhancedsteam.png");
                var dialog = "<div style=\"height:100%; display:flex; flex-direction:row;\"><div style=\"float: left; margin-right: 21px;\">"
                    + "<img src=\""+ logo +"\"></div>"
                    + "<div style=\"float: right;\">" + Localization.str.update.changes.replace(/'/g, "\\'")
                    + ":<ul class=\"es_changelog\">" + changelog + "</ul></div>" +
                    "</div>";
                ExtensionLayer.runInPageContext(
                    "function() {\
                        var prompt = ShowConfirmDialog(\"" + Localization.str.update.updated.replace("__version__", version) + "\", '" + dialog + "' , '" + Localization.str.donate.replace(/'/g, "\\'") + "', '" + Localization.str.close.replace(/'/g, "\\'") + "', '" + Localization.str.update.dont_show.replace(/'/g, "\\'") + "'); \
						prompt.done(function(result) {\
							if (result == 'OK') { window.location.assign('//www.enhancedsteam.com/donate/'); }\
							if (result == 'SECONDARY') { window.postMessage({ type: 'es_sendmessage_change', information: [ true ]}, '*'); }\
						});\
					}"
                );
            }
        );
        SyncedStorage.set("version", Info.version);

        window.addEventListener("message", function(event) {
            if (event.source !== window) return;
            if (event.data.type && (event.data.type === "es_sendmessage_change")) {
                SyncedStorage.set("version_show", false);
            }
        }, false);
    };

    self.addMenu = function() {
        // FIXME options
        document.querySelector("#global_action_menu").insertAdjacentHTML("afterBegin", `
            <div id="es_menu">
                <span id="es_pulldown" class="pulldown global_action_link">Enhanced Steam</span>
                <div id="es_popup" class="popup_block_new">
                    <div class="popup_body popup_menu">
                        <a class="popup_menu_item" target="_blank" href="${ExtensionLayer.getLocalUrl("options.html")}">${Localization.str.thewordoptions}</a>
                        <a class="popup_menu_item" id="es_clear_cache" href="#clear_cache">${Localization.str.clear_cache}</a>
                        <div class="hr"></div>
                        <a class="popup_menu_item" target="_blank" href="//github.com/jshackles/Enhanced_Steam">${Localization.str.contribute}</a>
                        <a class="popup_menu_item" target="_blank" href="//translation.enhancedsteam.com">${Localization.str.translate}</a>
                        <a class="popup_menu_item" target="_blank" href="//github.com/jshackles/Enhanced_Steam/issues">${Localization.str.bug_feature}</a>
                        <div class="hr"></div>
                        <a class="popup_menu_item" target="_blank" href="//www.enhancedsteam.com">${Localization.str.website}</a>
                        <a class="popup_menu_item" target="_blank" href="//${Localization.str.official_group_url}">${Localization.str.official_group}</a>
                        <a class="popup_menu_item" target="_blank" href="//enhancedsteam.com/donate/">${Localization.str.donate}</a>
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
        localStorage.clear(); // TODO
        SyncedStorage.remove("user_currency"); // TODO local storage
        SyncedStorage.remove("store_sessionid"); // TODO local storage
        DynamicStore.clear();
    };

    /**
     * Display warning if browsing using a different language
     */
    self.addLanguageWarning = function() {
        if (!SyncedStorage.get("showlanguagewarning", true)) { return; }

        let currentLanguage = Language.getCurrentSteamLanguage().toLowerCase();
        let warningLanguage = SyncedStorage.get("showlanguagewarninglanguage", currentLanguage).toLowerCase();

        if (currentLanguage === warningLanguage) { return; }

        Localization.loadLocalization(Language.getLanguageCode(warningLanguage)).then(function(strings){
            document.querySelector("#global_header").insertAdjacentHTML("afterend", `
                <div class="es_language_warning">` + strings.using_language.replace("__current__", strings.options.lang[currentLanguage]) + `
                    <a href="#" id="es_reset_language_code">` + strings.using_language_return.replace("__base__", strings.options.lang[warningLanguage]) + `</a>
                </div>
            `);

            document.querySelector("#es_reset_language_code").addEventListener("click", function(e){
                e.preventDefault();
                ExtensionLayer.runInPageContext("function(){ ChangeLanguage( '" + warningLanguage + "' ); }");
            });
        });
    };

    self.removeInstallSteamButton = function() {
        if (!SyncedStorage.get("hideinstallsteambutton", false)) { return; }
        document.querySelector("div.header_installsteam_btn").remove();
    };

    self.addHeaderLinks = function(){
        if (!User.isSignedIn || document.querySelector(".supernav_container").length === 0) { return; }

        let submenuUsername = document.querySelector(".supernav_container .submenu_username");
        submenuUsername.querySelector("a").insertAdjacentHTML("afterend", `<a class="submenuitem" href="//steamcommunity.com/my/games/">${Localization.str.games}</a>`);
        submenuUsername.insertAdjacentHTML("beforeend", `<a class="submenuitem" href="//steamcommunity.com/my/recommended/">${Localization.str.reviews}</a>`);
    };

    self.disableLinkFilter = function(){
        if (!SyncedStorage.get("disablelinkfilter", false)) { return; }

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
        if (!SyncedStorage.get("replaceaccountname", false)) { return; }

        let accountNameNode = document.querySelector("#account_pulldown");
        let accountName = accountNameNode.textContent.trim();
        let communityName = document.querySelector("#global_header .username").textContent.trim();

        accountNameNode.textContent = communityName;
        document.title = document.title.replace(accountName, communityName);
    };

    self.launchRandomButton = function() {

        document.querySelector("#es_popup .popup_menu")
            .insertAdjacentHTML("beforeend", `<div class='hr'></div><a id='es_random_game' class='popup_menu_item' style='cursor: pointer;'>${Localization.str.launch_random}</a>`);

        document.querySelector("#es_random_game").addEventListener("click", function(){
            // FIXME owned playable
            /*
            $.when(owned_playable_promise()).done(function(data) {
                var games = data.response.games,
                    rand = games[Math.floor(Math.random() * games.length)];

                let playGameStr = Localization.str.play_game.replace("__gamename__", rand.name.replace("'", "").trim());
                runInPageContext(
                    "function() {\
                        var prompt = ShowConfirmDialog('" + playGameStr + "', '<img src=//steamcdn-a.akamaihd.net/steam/apps/" + rand.appid + "/header.jpg>', null, null, '" + Localization.str.visit_store + "'); \
					    prompt.done(function(result) {\
						    if (result == 'OK') { window.location.assign('steam://run/" + rand.appid + "'); }\
						    if (result == 'SECONDARY') { window.location.assign('//store.steampowered.com/app/" + rand.appid + "'); }\
					});\
				}"
                );
            });
            */
        });
    };

    self.skipGotSteam = function() {
        if (!SyncedStorage.get("skip_got_steam", false)) { return; }

        let node = document.querySelector("a[href^='javascript:ShowGotSteamModal']");
        if (!node) { return; }
        node.setAttribute("href", node.getAttribute("href").split("'")[1]);
    };

    self.keepSteamSubscriberAgreementState = function() {
        let nodes = document.querySelectorAll("#market_sell_dialog_accept_ssa,#market_buynow_dialog_accept_ssa,#accept_ssa");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            node.checked = SyncedStorage.get("keepssachecked", false);

            node.addEventListener("click", function(){
                SyncedStorage.set("keepssachecked", !SyncedStorage.get("keepssachecked"));
            });
        }
    };

    return self;
})();


let TimeHelper = (function(){

    let self = {};

    self.isExpired = function(updateTime, expiration) {
        if (!updateTime) { return true; }

        let expireTime = parseInt(Date.now() / 1000, 10) - expiration;
        return updateTime < expireTime;
    };

    self.timestamp = function() {
        return parseInt(Date.now() / 1000, 10);
    };

    return self;
})();


let GameId = (function(){
    let self = {};

    self.getAppid = function(text) {
        if (!text) { return null; }

        // app, market/listing
        let m = text.match(/(?:store\.steampowered|steamcommunity)\.com\/(app|market\/listings)\/(\d+)\/?/);
        return m ? m[2] : null;
    };

    self.getSubid = function(text) {
        if (!text) { return null; }

        let m = text.match(/(?:store\.steampowered|steamcommunity)\.com\/(sub|bundle)\/(\d+)\/?/);
        return m ? m[2] : null;
    };


    self.getAppidImgSrc = function(text) {
        if (!text) { return null; }
        let m = text.match(/(steamcdn-a\.akamaihd\.net\/steam|steamcommunity\/public\/images)\/apps\/(\d+)\//);
        return m ? m[1] : null;
    };

    self.getAppids = function(text) {
        let res = matchAll(/(?:store\.steampowered|steamcommunity)\.com\/app\/(\d+)\/?/g, text);
        return (res.length > 0) ? res : null;
    };

    self.getAppidWishlist = function(text) {
        if (!text) { return null; }
        let m = text.match(/game_(\d+)/);
        return m ? m[1] : null;
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

    return self;
})();


let EarlyAccess = (function(){

    let self = {};

    let cache = {};
    let imageUrl;

    function promise() {

        let imageName = "img/overlay/early_access_banner_english.png";
        if (Language.isCurrentLanguageOneOf(["brazilian", "french", "italian", "japanese", "koreana", "polish", "portuguese", "russian", "schinese", "spanish", "tchinese", "thai"])) {
            imageName = "img/overlay/early_access_banner_" + language + ".png";
        }
        imageUrl = ExtensionLayer.getLocalUrl(imageName);

        return new Promise(function(resolve, reject) {
            cache = LocalData.get("ea_appids");

            if (cache) {
                resolve();
            }

            let updateTime = LocalData.get("ea_appids_time");
            if (!TimeHelper.isExpired(updateTime, 3600)) {
                return;
            }

            Request.getApi("v01/earlyaccess").then(data => {
                if (!data.result || data.result !== "success") {
                    reject();
                }

                cache = data.data;
                LocalData.set("ea_appids", cache);
                LocalData.set("ea_appids_time", TimeHelper.timestamp());
                resolve()
            }, reject);
        });
    }

    function checkNodes(selector, selectorModifier) {
        selectorModifier = typeof selectorModifier === "string" ? selectorModifier : "";

        let nodes = document.querySelectorAll(selector+":not(.es_ea_checked)");
        for (let i=0; i<nodes.length; i++) {
            let node = nodes[i];
            node.classList.add("es_ea_checked");

            let linkNode = node.querySelector("a");
            let href = linkNode && linkNode.hasAttribute("href") ? linkNode.getAttribute("href") : node.getAttribute("href");
            let imgHeader = node.querySelector("img" + selectorModifier);
            let appid = GameId.getAppid(href) || GameId.getAppidImgSrc(imgHeader ? imgHeader.getAttribute("src") : null);

            if (appid && cache.hasOwnProperty(appid) >= 0) {
                node.classList.add("es_early_access");

                let container = document.createElement("span");
                container.classList.add("es_overlay_container");
                DOMHelper.wrap(container, imgHeader);

                container.insertAdjacentHTML("afterbegin", `<span class="es_overlay"><img title="${Localization.str.early_access}" src="${imageUrl}" /></span>`);
            }
        }
    }

    function handleStore() {
        switch (true) {
            case /^\/app\/.*/.test(window.location.pathname):
                checkNodes(".game_header_image_ctn, .small_cap");
                break;
            case /^\/(?:genre|browse|tag)\/.*/.test(window.location.pathname):
                checkNodes(`.tab_item,
                           .special_tiny_cap,
                           .cluster_capsule,
                           .game_capsule,
                           .browse_tag_game,
                           .dq_item:not(:first-child),
                           .discovery_queue:not(:first-child)`);
                break;
            case /^\/search\/.*/.test(window.location.pathname):
                checkNodes(".search_result_row");
                break;
            case /^\/recommended/.test(window.location.pathname):
                checkNodes(`.friendplaytime_appheader,
                           .header_image,
                           .appheader,
                           .recommendation_carousel_item .carousel_cap,
                           .game_capsule,
                           .game_capsule_area,
                           .similar_grid_capsule`);
                break;
            case /^\/tag\/.*/.test(window.location.pathname):
                checkNodes(`.cluster_capsule,
                           .tab_row,
                           .browse_tag_game_cap`);
                break;
            case /^\/$/.test(window.location.pathname):
                checkNodes(`.cap,
                           .special,
                           .game_capsule,
                           .cluster_capsule,
                           .recommended_spotlight_ctn,
                           .curated_app_link,
                           .dailydeal_ctn a,
                           .tab_item:last-of-type`);

                // Sales fields
                checkNodes(".large_sale_caps a, .small_sale_caps a, .spotlight_img");
                // checkNodes($(".sale_capsule_image").parent()); // TODO check/remove
                break;
        }
    }

    function handleCommunity() {
        switch(true) {
            // wishlist, games, and followedgames can be combined in one regex expresion
            case /^\/(?:id|profiles)\/.+\/(wishlist|games|followedgames)/.test(window.location.pathname):
                checkNodes(".gameListRowLogo");
                break;
            case /^\/(?:id|profiles)\/.+\/\b(home|myactivity|status)\b/.test(window.location.pathname):
                checkNodes(".blotter_gamepurchase_content a");
                break;
            case /^\/(?:id|profiles)\/.+\/\b(reviews|recommended)\b/.test(window.location.pathname):
                checkNodes(".leftcol");
                break;
            case /^\/(?:id|profiles)\/.+/.test(window.location.pathname):
                checkNodes(`.game_info_cap,
                           .showcase_gamecollector_game,
                           .favoritegame_showcase_game`);
                break;
            case /^\/app\/.*/.test(window.location.pathname):
                if (document.querySelector(".apphub_EarlyAccess_Title")) {
                    let container = document.createElement("span");
                    container.id = "es_ea_apphub";
                    DOMHelper.wrap(container, document.querySelector(".apphub_StoreAppLogo:first-of-type"));

                    checkNodes("#es_ea_apphub");
                }
        }
    }

    self.showEarlyAccess = function() {
        if (!SyncedStorage.get("show_early_access", true)) { return; }

        promise().then(() => {
            switch (window.location.host) {
                case "store.steampowered.com":
                    handleStore();
                    break;
                case "steamcommunity.com":
                    handleCommunity();
                    break;
            }
        });
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

        for(let key in data.rgDescriptions) {
            if (!data.rgDescriptions.hasOwnProperty(key)) { continue; }

            let isPackage = false;
            let obj = data.rgDescriptions[key];

            if (obj.descriptions) {
                for (let d = 0; d < obj.descriptions.length; d++) {
                    if (obj.descriptions[d].type === "html") {
                        let appids = GameId.getAppids(obj.descriptions[d].value);
                        if (appids) {
                            // Gift package with multiple apps
                            isPackage = true;
                            for (let j = 0; j < appids.length; j++) {
                                if (appids[j]) {
                                    if (obj.type === "Gift") {
                                        gifts.push(appids[j]);
                                    } else {
                                        guestpasses.push(appids[j]);
                                    }
                                }
                            }
                            break;
                        }
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

    // Trading cards
    function handleInventoryContext6(data) {
        if (!data || !data.success) { return; }
        LocalData.set("inventory_6", data);
    }

    // Coupons
    function handleInventoryContext3(data) {
        if (!data || !data.success) { return; }
        LocalData.set("inventory_3", data);

        for(let id in data.rgDescriptions) {
            if (!data.rgDescriptions.hasOwnProperty(id)) {
                continue;
            }

            let obj = data.rgDescriptions[id];
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

        console.log(coupons);
    }

    self.promise = function() {
        return new Promise(function(resolve, reject) {
            if (!User.isSignedIn) {
                resolve();
            }

            let lastUpdate = LocalData.get("inventory_update");
            let inv1 = LocalData.get("inventory_1");
            let inv3 = LocalData.get("inventory_3");
            let inv6 = LocalData.get("inventory_6");

            if (TimeHelper.isExpired(lastUpdate, 3600) || !inv1 || !inv3) {
                LocalData.set("inventory_update", Date.now());

                Promise.all([
                    Request.getJson(User.profileUrl + "/inventory/json/753/1/?l=en", { withCredentials: true }).then(handleInventoryContext1),
                    Request.getJson(User.profileUrl + "/inventory/json/753/3/?l=en", { withCredentials: true }).then(handleInventoryContext3),
                    Request.getJson(User.profileUrl + "/inventory/json/753/6/?l=en", { withCredentials: true }).then(handleInventoryContext6),
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
    };

    self.getCoupon = function(subid) {
        return coupons && coupons[subid];
    };

    return self;
})();

let Highlights = (function(){

    let self = {};

    let defaults = {
        "owned": "#5c7836",
        "wishlist": "#1c3788",
        "coupon": "#a26426",
        "inv_gift": "#800040",
        "inv_guestpass": "#008080",
        "notinterested": "#4f4f4f"
    };

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

        if (SyncedStorage.get("hide_owned", false)
            && classChecker(node, ["search_result_row", "item", "cluster_capsule", "browse_tag_game"])) {
            node.style.display = "none";
        }

        // Hide DLC for unowned items
        if (SyncedStorage.get("hide_dlcunownedgames", false)
            && classChecker(node, ["search_result_row", "item", "game_area_dlc_row", "cluster_capsule"])) {
                node.style.display = "none";
        }
    }

    function addTag(node, tag) {
        let tagShort = SyncedStorage.get("tag_short", true);

        // Load the colors CSS for tags
        if (!tagCssLoaded) {
            tagCssLoaded = true;

            let tagCss = "";
            ["notinterested", "owned", "wishlist", "inv_guestpass", "coupon", "inv_gift"].forEach(name => {
                tagCss += '.es_tag_' + name + ' { background-color: ' + SyncedStorage.get("tag_"+name+"_color", defaults[name]) + ' }\n';
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
        if (SyncedStorage.get("highlight_excludef2p", false)) {

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
                hlCss += '.es_highlighted_' + name + ' { background: ' + SyncedStorage.get("highlight_" + name + "_color", defaults[name]) + ' linear-gradient(135deg, rgba(0, 0, 0, 0.70) 10%, rgba(0, 0, 0, 0) 100%) !important; }\n';
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

        if (SyncedStorage.get("highlight_"+name, true)) {
            node.classList.add("es_highlighted", "es_highlighted_"+name);
            highlightNode(node);
        }

        if (SyncedStorage.get("tag_" + name, false)) {
            addTag(node, name);
        }
    }

    self.highlightOwned = function(node) {
        node.classList.add("es_highlight_checked");

        if (SyncedStorage.get("hide_owned", false)) {
            hideNode(node);
            return;
        }

        highlightItem(node, "owned");
    };

    self.highlightWishlist = function(node) {
        node.classList.add("es_highlight_checked");

        if (SyncedStorage.get("hide_wishlist", false)) {
            hideNode(node);
            return;
        }

        highlightItem(node, "wishlist");
    };

    self.highlightCart = function(node) {
        if (!SyncedStorage.get("hide_cart", false)) { return; }

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
        if (!SyncedStorage.get("notdiscounted", false)) { return; }
        node.style.display = "none";
    };

    self.highlightNotInterested = function(node) {
        DynamicStore.promise().then(() => {

            let aNode = node.querySelector("a");
            let appid = GameId.getAppid(node.href, aNode && aNode.href) || GameId.getAppidWishlist(node.id);
            if (!appid || !DynamicStore.isIgnored(appid)) { return; }

            if (node.classList.contains("home_area_spotlight")) {
                node = node.querySelector(".spotlight_content");
            }

            node.classList.add("es_highlight_checked");

            if (!SyncedStorage.get("hide_notinterested", false) && node.classList.contains("search_result_row")) {
                node.style.display = "none";
                return;
            }

            highlightItem(node, "notinterested");
        });
    };

    self.startHighlightsAndTags = function() {
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

        setTimeout(function() {
            selectors.forEach(selector => {
                
                let nodes = document.querySelectorAll(selector+":not(.es_highlighted)");
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
    let _promise;

    self.clear = function() {
        _data = {};
        _promise = null;
        LocalData.del("dynamicstore");
        LocalData.del("dynamicstore_update");
    };

    self.isIgnored = function(appid) {
        let list = _data.rgIgnoredApps || [];
        return list.indexOf(appid) !== -1;
    };

    self.isOwned = function(appid) {
        let list = _data.rgOwnedApps || [];
        return list.indexOf(appid) !== -1;
    };

    self.isWishlisted = function(appid) {
        let list = _data.rgWishlistApps || [];
        return list.indexOf(appid) !== -1;
    };

    self.promise = function(){
        if (_promise) { return _promise; }
        _promise = new Promise(function(resolve, reject){
            if (!User.isSignedIn) { reject(); return; }

            let userdata = LocalData.get("dynamicstore");
            let userdataUpdate = LocalData.get("dynamicstore_update", TimeHelper.timestamp());

            if (userdata && !TimeHelper.isExpired(userdataUpdate, 15*60)) {
                _data = userdata;
                resolve(userdata);
                return;
            }

            Request.getJson("//store.steampowered.com/dynamicstore/userdata/", { withCredentials: true }).then(result => {
                if (!result || !result.rgOwnedApps) {
                    resolve();
                    return;
                }

                LocalData.set("dynamicstore", result)
                _data = result;
                resolve(result);

            }, reject);

        });
        return _promise;
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

        if (!SyncedStorage.get("showallstores", true) && SyncedStorage.get("stores", []).length > 0) {
            apiParams.stores = SyncedStorage.get("stores", []).join(",");
        }

        let cc = User.getCountry();
        if (cc) {
            apiParams.cc = cc;
        }

        apiParams.appids = this.appids.join(",");
        apiParams.subids = this.subids.join(",");
        apiParams.bundleids = this.bundleids.join(",");

        if (SyncedStorage.get("showlowestpricecoupon", true)) {
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
            if (SyncedStorage.get("showlowetpricecoupon", true) && info['price']['price_voucher']) {
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
            if (typeof bundles_url === "string" && bundles_url.length > 0) {
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
        Request.getApi("v01/prices", apiParams).then(response => {
            if (!response || response.result !== "success") { return; }

            for (let gameid in response.data.data) {
                if (!response.data.data.hasOwnProperty(gameid)) { continue; }

                let meta = response.data['.meta'];
                let info = response.data.data[gameid];

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
    }

    self.addToggleHandler = function(name, target, text, forceShow, callback) {
        let element = typeof target === "string" ? document.querySelector(target) : target;
        if (!element && !forceShow) { return; }

        let state = SyncedStorage.get(name, true);
        text = (typeof text === "string" && text) || self.textValue(element.querySelector("h2")).toLowerCase();
        if (text === "") { return; }

        document.querySelector("body").classList.toggle(name.replace("show_", "es_") + "_hidden", !SyncedStorage.get(name, true));

        if (element) {
            element.classList.toggle("es_hide", !SyncedStorage.get(name, true));

            if (element.classList.contains("es_hide")) {
                element.style.display = "none"; // TODO slideUp
            }
        }

        document.querySelector("#es_customize_btn .home_viewsettings_popup").insertAdjacentHTML("beforeend",
            `<div class="home_viewsettings_checkboxrow ellipsis" id="${name}">
                    <div class="home_viewsettings_checkbox ${SyncedStorage.get(name, true) ? `checked` : ``}"></div>
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
