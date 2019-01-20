
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

    // FIXME this may be dangerous?
    // Run script in the context of the current tab
    self.runInPageContext = function(fun){
        console.log(fun);

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

    self.promise = function() {
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

    self.promise = function() {
        return new Promise(function(resolve, reject) {
            let currencySetting = Settings.get("override_price", "auto");

            if (currencySetting !== "auto") {
                self.userCurrency = currencySetting;
                resolve();
                return;
            }

            let currencyCache = SyncedStorage.get("userCurrency");
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

    return self;
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

    return self;
})();

let BrowserHelper = (function(){

    let self = {};

    self.getCookie = function(name) {
        let re = new RegExp(name + "=([^;]+)");
        let value = re.exec(document.cookie);
        return (value != null) ? unescape(value[1]) : null;
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
        SyncedStorage.remove("dynamicstore"); // TODO local storage
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

    self.removeAboutMenu = function(){
        // TODO is this still relevant?
        if (!SyncedStorage.get("hideaboutmenu", true)) { return; }
        document.querySelector(".menuitem[href='https://store.steampowered.com/about/']").remove();
    };

    self.addHeaderLinks = function(){
        if (!User.isSignedIn || document.querySelector(".supernav_container").length === 0) { return; }

        let submenuUsername = document.querySelector(".supernav_container .submenu_username");
        submenuUsername.querySelector("a").insertAdjacentHTML("afterend", `<a class="submenuitem" href="//steamcommunity.com/my/games/">${Localization.str.games}</a>`);
        submenuUsername.insertAdjacentHTML("beforeend", `<a class="submenuitem" href="//steamcommunity.com/my/recommended/">${Localization.str.reviews}</a>`);
    };


    return self;
})();
