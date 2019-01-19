
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

    self.get = function(key) {
        let v = localStorage.getItem(key);
        if (!v) return v;
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

    let storageAdapter = chrome.storage.sync || chrome.storage.local;

    self.localStorage = {};
    self.localStorage.get = function(key) {
        return new Promise(function(resolve, reject) {
            storageAdapter.get(key, function(result) {
                resolve(result);

                // if (chrome.runtime.lastError) { // TODO?
                //     reject(chrome.runtime.lastError);
                // }
            })
        });
    };

    self.localStorage.set = function(value) {
        storageAdapter.set(value);
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

    self.getHttp = function(url, settings) {
        settings = settings || {};
        settings.withCredentials = settings.withCredentials || false;
        settings.type = settings.type || "text/html";
        settings.method = settings.method || "GET";

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
                    resolve(state.responseText);
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
            request.send();
        });
    };

    return self;
})();

let ProgressBar = (function(){
    let self = {};

    let node = null;

    self.loading = function() {
        if (!Settings.get("show_progressbar")) { return; }
        node = document.querySelector("#es_progress");

        if (Localization.str.ready) {
            node.setAttribute("title", Localization.str.ready.loading);
        }

        node.classList.remove("complete");
        node.querySelector(".progress-value").style.width = "18px";
    };

    self.progress = function(value) {
        if (!Settings.get("show_progressbar")) { return; }
        node = document.querySelector("#es_progress");

        node.querySelector(".progress-value").style.width = value; // TODO "%"?

        if (value >= 100) {
            node.classList.add("complete");
            node.setAttribute("title", Localization.str.ready.ready)
        }
    };

    self.failed = function(message, url, status, error) {
        if (!Settings.get("show_progressbar")) { return; }
        node = document.querySelector("#es_progress");

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

    self.str = {}; // translated strings

    self.load = function(){

        let lang = Settings.get("language");
        let local = null;
        if (self.languages.hasOwnProperty(lang) && self.languages[lang] !== "en") {
            local = self.languages[lang];
        }

        return new Promise(function(resolve, reject) {

            let promises = [];
            promises[0] = Request.getLocalJson("/localization/en/strings.json");

            if (local != null) {
                promises[1] = Request.getLocalJson("/localization/"+local+"/strings.json");
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

    self.init = function() {
        self.profileUrl = document.querySelector("#global_actions .playerAvatar").getAttribute("href");
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
                reject();
            }
        });
    };

    return self;
})();


let Currency = (function() {

    let self = {};

    self.userCurrency = "USD";

    self.load = function() {
        return new Promise(function(resolve, reject) {
            let currencySetting = Settings.get("override_price", "auto");

            if (currencySetting !== "auto") {
                self.userCurrency = currencySetting;
                resolve();
                return;
            }

            ExtensionLayer.localStorage.get("userCurrency").then(function(currencyCache){
                let expireTime = parseInt(Date.now() / 1000, 10) - 60 * 60; // One hour ago

                if (currencyCache.userCurrency && currencyCache.userCurrency.currencyType && currencyCache.userCurrency.updated >= expireTime) {
                    self.userCurrency = currencyCache.userCurrency.currencyType;
                    resolve();
                } else {
                    Request.getHttp("//store.steampowered.com/steamaccount/addfunds", { withCredentials: true })
                        .then(
                            response => {
                                let dummyHtml = document.createElement("html");
                                dummyHtml.innerHTML = response;

                                self.userCurrency = dummyHtml.querySelector("input[name=currency]").value;
                                ExtensionLayer.localStorage.set({userCurrency: {currencyType: self.userCurrency, updated: parseInt(Date.now() / 1000, 10)}})
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
                                        ExtensionLayer.localStorage.set({userCurrency: {currencyType: self.userCurrency, updated: parseInt(Date.now() / 1000, 10)}})
                                    });
                            }
                        )
                        .finally(resolve);
                }
            });
        });
    };

    return self;
})();


Localization.load();
User.init().then(function() {
    console.log(User.isSignedIn, User.profilePath, User.profileUrl, User.steamId);
});
Currency.load();
