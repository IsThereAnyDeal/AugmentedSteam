
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

    self.getSessionId = function() {
        let nodes = document.querySelectorAll("script");
        for (let i=0, len=nodes.length; i<len; i++) {
            let m = nodes[i].textContent.match(/g_sessionID = "(.+)"/);
            if (m) {
                return m[1];
            }
        }
        return null;
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

    return self;
})();


let TimeHelper = (function(){

    let self = {};

    self.isExpired = function(updateTime, expiration) {
        if (!updateTime) { return; }

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

    self.getAppidImgSrc = function(text) {
        if (!text) { return null; }
        let m = text.match(/(steamcdn-a\.akamaihd\.net\/steam|steamcommunity\/public\/images)\/apps\/(\d+)\//);
        return m ? m[1] : null;
    };

    self.getAppids = function(text) {
        let res = matchAll(/(?:store\.steampowered|steamcommunity)\.com\/app\/(\d+)\/?/g, text);
        return (res.length > 0) ? res : null;
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
