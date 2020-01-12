
class Customizer {

    constructor(settingsName) {
        this.settingsName = settingsName;
        this.settings = SyncedStorage.get(settingsName);
    }

    _textValue(node) {
        if (!node) return '';
        let str = "";
        for (node = node.firstChild; node; node = node.nextSibling) {
            if (node.nodeType === 3 || (node.nodeType === 1 && node.tagName === "A")) { // Special case for Steam curators
                str += node.textContent.trim();
            }
        }
        return str;
    };

    _updateValue(name, value) {
        this.settings[name] = value;
        SyncedStorage.set(this.settingsName, this.settings);
    }

    _getValue(name) {
        let value = this.settings[name];
        return (typeof value === "undefined") || value;
    }

    add(name, targets, text, forceShow) {

        let elements;

        if (typeof targets === "string") {
            elements = Array.from(document.querySelectorAll(targets));
        } else if (targets instanceof NodeList) {
            elements = Array.from(targets);
        } else {
            elements = targets ? [targets] : [];
        }

        if (!elements.length) return this;

        let state = this._getValue(name);

        let isValid = false;

        elements.forEach((element, i) => {
            if (getComputedStyle(element).display === "none" && !forceShow) {
                elements.splice(i, 1);
                return;
            }
    
            if (!text) {
                text = (typeof text === "string" && text) || this._textValue(element.querySelector(".home_section_title, h2")).toLowerCase();
                if (!text) return;
            }

            isValid = true;
        });

        if (!isValid) return this;

        for (let element of elements) {
            element.classList.toggle("esi-shown", state);
            element.classList.toggle("esi-hidden", !state);
            element.classList.add("esi-customizer"); // for dynamic entries on home page
            element.dataset.es_name = name;
            element.dataset.es_text = text;
        }

        return this;
    };

    addDynamic(titleNode, targetNode) {
        let textValue = this._textValue(titleNode);

        console.warn("Node with textValue %s is not recognized!", textValue);
        let option = textValue.toLowerCase().replace(/[^a-z]*/g, "");
        if (option === "") { return; }

        this.add("dynamic_" + option, targetNode, textValue);
    }

    build() {

        let customizerEntries = new Map();

        for (let element of document.querySelectorAll(".esi-customizer")) {

            let name = element.dataset.es_name;

            if (customizerEntries.has(name)) {
                customizerEntries.get(name).push(element);
            } else {

                let state = element.classList.contains("esi-shown");
                let text = element.dataset.es_text;

                HTML.beforeEnd("#es_customize_btn .home_viewsettings_popup",
                `<div class="home_viewsettings_checkboxrow ellipsis" id="${name}">
                    <div class="home_viewsettings_checkbox ${state ? `checked` : ``}"></div>
                    <div class="home_viewsettings_label">${text}</div>
                </div>`);

                customizerEntries.set(name, [element]);
            }            
        }

        for (let [name, elements] of customizerEntries) {
            let checkboxrow = document.getElementById(name);
            checkboxrow.addEventListener("click", e => {
                let state = !checkboxrow.querySelector(".checked");

                elements.forEach(element => {
                    element.classList.toggle("esi-shown", state);
                    element.classList.toggle("esi-hidden", !state);
                });

                e.target.closest(".home_viewsettings_checkboxrow")
                    .querySelector(".home_viewsettings_checkbox").classList.toggle("checked", state);

                this._updateValue(name, state);
            });
        }
    }
}

class StorePageClass {
    constructor() {
        this.hasCards = document.querySelector(".icon img[src$='/ico_cards.png'") ? true : false;
    }

    // TODO(tfedor) maybe make properties instead of dynamic qheck of all of these "isXY"? Not sure
    isAppPage() {
        return /^\/app\/\d+/.test(window.location.pathname);
    }

    isSubPage() {
        return /^\/sub\/\d+/.test(window.location.pathname);
    }

    isDlc() {
        return document.querySelector("div.game_area_dlc_bubble") ? true : false;
    }

    isVideo() {
        return document.querySelector(".game_area_purchase_game .streamingvideo") ? true : false;
    }

    isOwned() {
        return document.querySelector(".game_area_already_owned") ? true :false;
    }

    hasAchievements() {
        return document.querySelector("#achievement_block") ? true : false;
    }

    getAllSubids() {
        let result = [];
        let nodes = document.querySelectorAll("input[name=subid]");
        for (let i=0, len=nodes.length; i<len; i++) {
            result.push(nodes[i].value);
        }
        return result;
    }


    addDrmWarnings() {
        if (!SyncedStorage.get("showdrm")) { return; }

        // Prevent false-positives
        if (this.isAppPage() && (
               this.appid === 21690    // Resident Evil 5, at Capcom's request
            || this.appid === 1157970  // Special K
        )) { return; }

        let text = "";
        for (let node of document.querySelectorAll(".game_area_sys_req, #game_area_legal, .game_details, .DRM_notice")) {
            text += node.textContent.toLowerCase();
        }

        // Games for Windows Live detection
        let gfwl =
               text.includes("games for windows live")
            || text.includes("games for windows - live")
            || text.includes("online play requires log-in to games for windows")
            || text.includes("installation of the games for windows live software")
            || text.includes("multiplayer play and other live features included at no charge")
            || text.includes("www.gamesforwindows.com/live");

        // Ubisoft Uplay detection
        let uplay =
               text.includes("uplay")
            || text.includes("ubisoft account");

        // Securom detection
        let securom = text.includes("securom");

        // Tages detection
        let tages =
                text.match(/\b(tages|solidshield)\b/)
            && !text.match(/angebote des tages/);

        // Stardock account detection
        let stardock = text.includes("stardock account");

        // Rockstar social club detection
        let rockstar =
               text.includes("rockstar social club")
            || text.includes("rockstar games social club");

        // Kalypso Launcher detection
        let kalypso = text.includes("requires a kalypso account");

        // Denuvo Antitamper detection
        let denuvo = text.includes("denuvo");

        // EA origin detection
        let origin = text.includes("origin client");

        // Microsoft Xbox Live account detection
        let xbox = text.includes("xbox live");

        let drmNames = [];
        if (gfwl) { drmNames.push("Games for Windows Live"); }
        if (uplay) { drmNames.push("Ubisoft Uplay"); }
        if (securom) { drmNames.push("SecuROM"); }
        if (tages) { drmNames.push("Tages"); }
        if (stardock) { drmNames.push("Stardock Account Required"); }
        if (rockstar) { drmNames.push("Rockstar Social Club"); }
        if (kalypso) { drmNames.push("Kalypso Launcher"); }
        if (denuvo) { drmNames.push("Denuvo Anti-tamper"); }
        if (origin) { drmNames.push("EA Origin"); }
        if (xbox) { drmNames.push("Microsoft Xbox Live"); }

        let drmString;
        let regex = /\b(drm|account|steam)\b/i;
        if (drmNames.length > 0) {
            drmString = `(${drmNames.join(", ")})`;
        } else { // Detect other DRM
            if (this.isAppPage()) {
                for (let node of document.querySelectorAll("#category_block > .DRM_notice")) {
                    let text = node.textContent;
                    if (text.match(regex)) {
                        drmString = text;
                        break;
                    }
                }
            }
            if (this.isSubPage()) {
                let node = document.querySelector(".game_details .details_block > p > b:last-of-type");
                let text = node.textContent + node.nextSibling.textContent;
                if (text.match(regex)) {
                    drmString = text;
                }
            }
        }

        if (drmString) {
            let warnString;
            if (drmNames.length > 0) {
                warnString = this.isAppPage() ? Localization.str.drm_third_party : Localization.str.drm_third_party_sub;
                warnString = warnString.replace("__drmlist__", drmString);
            } else {
                warnString = drmString;
            }
            let node = document.querySelector("#game_area_purchase .game_area_description_bodylabel");
            if (node) {
                HTML.afterEnd(node, `<div class="game_area_already_owned es_drm_warning"><span>${warnString}</span></div>`);
            } else {
                HTML.afterBegin("#game_area_purchase", `<div class="es_drm_warning"><span>${warnString}</span></div>`);
            }
        }
    }

    addPrices() {
        if (!SyncedStorage.get("showlowestprice")) { return; }

        let prices = new Prices();

        prices.subids = [];
        let nodes = document.querySelectorAll("input[name=subid]");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            prices.subids.push(node.value);
        }

        prices.bundleids = [];
        nodes = document.querySelectorAll("[data-ds-bundleid]");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            prices.bundleids.push(node.dataset['dsBundleid']);
        }

        prices.priceCallback = function(type, id, contentNode) {
            let node;
            let placement = "afterbegin";
            if (type === "sub") {
                node = document.querySelector("input[name=subid][value='"+id+"']").parentNode.parentNode.parentNode;
            } else if (type === "bundle") {
                node = document.querySelector(".game_area_purchase_game_wrapper[data-ds-bundleid='"+id+"']");
                if (!node) {
                    node = document.querySelector(".game_area_purchase_game[data-ds-bundleid='"+id+"']");
                    placement = "beforebegin";
                } else {
                    // Move any "Complete your Collection!" banner out of the way
                    let banner = node.querySelector('.ds_completetheset');
                    let newParent = node.querySelector('.game_area_purchase_game');
                    if (banner && newParent) {
                        newParent.appendChild(banner);
                    }
                }
            }

            node.insertAdjacentElement(placement, contentNode);
        };

        prices.bundleCallback = function(html) {

            HTML.afterEnd("#game_area_purchase",
                "<h2 class='gradientbg'>" + Localization.str.bundle.header + " <img src='/public/images/v5/ico_external_link.gif' border='0' align='bottom'></h2>"
                + html);
        };

        prices.load();
    }

    getRightColLinkHtml(cls, url, str) {
        return `<a class="btnv6_blue_hoverfade btn_medium es_app_btn ${cls}" target="_blank" href="${url}">
                    <span><i class="ico16"></i>&nbsp;&nbsp; ${str}</span>
                </a>`;
    }

    addLinks(type) {

        let gameid = null;
        let node = null;

        switch (type) {
            case "app":
                gameid = this.appid;
                node = document.querySelector("#ReportAppBtn").parentNode;
                break;
            case "sub":
                gameid = this.subid;
                node = document.querySelector(".share").parentNode;
                break;
            case "bundle":
                gameid = this.bundleid;
                node = document.querySelector(".share");
                if (!node) {
                    node = document.querySelector(".rightcol .game_details");
                }
                break;
            default:
                return;
        }

        if (!node) { return; }

        if (SyncedStorage.get("showbartervg")) {
            HTML.afterBegin(node,
                this.getRightColLinkHtml(
                    "bartervg_ico",
                    `https://barter.vg/steam/${type}/${gameid}/`,
                    Localization.str.view_on_website.replace("__website__", "Barter.vg")));
        }

        if (SyncedStorage.get("showsteamdb")) {
            HTML.afterBegin(node,
                this.getRightColLinkHtml(
                    "steamdb_ico",
                    `https://steamdb.info/${type}/${gameid}/`,
                    Localization.str.view_on_website.replace("__website__", "Steam Database")));
        }

        if (SyncedStorage.get("showitadlinks")) {
            HTML.afterBegin(node,
                this.getRightColLinkHtml(
                    "itad_ico",
                    `https://isthereanydeal.com/steam/${type}/${gameid}/`,
                    Localization.str.view_on_website.replace("__website__", "IsThereAnyDeal")));
        }
    }

    async showRegionalPricing(type) {
        let showRegionalPrice = SyncedStorage.get("showregionalprice");
        if (showRegionalPrice === "off") { return; }

        let countries = SyncedStorage.get("regional_countries");
        if (!countries || countries.length === 0) { return; }

        let localCountry = User.getCountry().toLowerCase();
        if (!countries.includes(localCountry)) countries.push(localCountry);

        for (let subid of this.getAllSubids()) {
            if (!subid) return;
            
            let promises = [];
            let prices = {};

            for (let country of countries) {
                promises.push(
                    RequestData.getJson(`https://store.steampowered.com/api/packagedetails/?packageids=${subid}&cc=${country}`).then(result => {
                        if (!result || !result[subid] || !result[subid].success || !result[subid].data.price) { return; }
                        prices[country] = result[subid].data.price;
                    })
                );
            }

            await Promise.all(promises);
            
            let node = document.querySelector(`input[name=subid][value="${subid}"]`)
                .closest(".game_area_purchase_game_wrapper,#game_area_purchase,.sale_page_purchase_item")
                .querySelector(".game_purchase_action");

            let apiPrice = prices[User.getCountry().toLowerCase()];
            let priceLocal;
            try {
                priceLocal = new Price(apiPrice.final / 100, apiPrice.currency).inCurrency(Currency.customCurrency);
            } catch(err) {
                console.group("Regional pricing");
                console.error(err);
                console.warn("Can't show relative price differences to any other currencies");
                console.groupEnd();
            }

            let pricingDiv = document.createElement("div");
            pricingDiv.classList.add("es_regional_container");
            pricingDiv.classList.add(`es_regional_${type || "app"}`);

            if (showRegionalPrice === "mouse") {
                HTML.inner(pricingDiv, pricingDiv.innerHTML + '<div class="miniprofile_arrow right" style="position: absolute; top: 12px; right: -8px;"></div>');
            }

            for (let country of countries) {
                let apiPrice = prices[country];
                let html = "";

                if (apiPrice) {
                    let priceRegion = new Price(apiPrice.final / 100, apiPrice.currency);
                    let priceUser;
                    try {
                        priceUser = priceRegion.inCurrency(Currency.customCurrency);
                    } catch(err) {
                        console.group("Regional pricing");
                        console.error(err);
                        console.warn(`Not able to show converted price and relative price differences for country code "%s"`, country.toUpperCase());
                        console.groupEnd();
                    }

                    html = `<div class="es-regprice es-flag es-flag--${country}">${priceRegion}`;

                    if (priceLocal && priceUser) {
                        let percentageIndicator = "equal";
                        let percentage = (((priceUser.value / priceLocal.value) * 100) - 100).toFixed(2);

                        if (percentage < 0) {
                            percentage = Math.abs(percentage);
                            percentageIndicator = "lower";
                        } else if (percentage > 0) {
                            percentageIndicator = "higher";
                        }

                        html +=
                            `<span class="es-regprice__converted">${priceUser}</span>
                            <span class="es-regprice__perc es-regprice__perc--${percentageIndicator}">${percentage}%</span>`
                    }
                    
                    html += "</div>";
                } else {
                    html =
                        `<div class="es-regprice es-flag es-flag--${country}">
                            <span class="es-regprice__none">${Localization.str.region_unavailable}</span>
                        </div>`;
                }

                HTML.inner(pricingDiv, pricingDiv.innerHTML + html);
            }

            let purchaseArea = node.closest(".game_area_purchase_game,.sale_page_purchase_item");
            purchaseArea.classList.add("es_regional_prices");

            if (showRegionalPrice === "always") {
                node.insertAdjacentElement("beforebegin", pricingDiv);
                purchaseArea.classList.add("es_regional_always");
            } else {
                let priceNode = node.querySelector(".price,.discount_prices");
                priceNode.insertAdjacentElement("beforeend", pricingDiv);
                priceNode.classList.add("es_regional_onmouse");

                if (!SyncedStorage.get("regional_hideworld")) {
                    priceNode.classList.add("es_regional_icon");
                }
            }
        }  
    }

    forceVideoMP4() {
        if (!SyncedStorage.get("mp4video")) { return; }
        let self = this;

        document.querySelectorAll("[data-webm-source]").forEach(function(node) {
            let mp4 = node.dataset.mp4Source;
            let mp4hd = node.dataset.mp4HdSource;
            if (!mp4 || !mp4hd) return;

            node.dataset.webmSource = mp4;
            node.dataset.webmHdSource = mp4hd;

            let video = node.querySelector("video");
            if (!video) { return; }

            video.dataset.sdSrc = mp4;
            video.dataset.hdSrc = mp4hd;
            self.toggleVideoDefinition(video, false);
        });
    }
}


class SubPageClass extends StorePageClass {
    constructor(url) {
        super();

        this.subid = GameId.getSubid(url);

        this.addDrmWarnings();
        this.addPrices();
        this.addLinks("sub");
        this.showRegionalPricing("sub");
        this.subscriptionSavingsCheck();
    }

    subscriptionSavingsCheck() {
        setTimeout(() => {
            let notOwnedTotalPrice = 0;

            for (let node of document.querySelectorAll(".tab_item:not(.ds_owned)")) {
                let priceNode = node.querySelector(".discount_final_price");
                // Only present when the product has a price associated with (so it's not free or N/A)
                if (priceNode) {
                    let priceContainer = priceNode.textContent.trim();
                    if (priceContainer) { 
                        let price = Price.parseFromString(priceContainer, Currency.storeCurrency);
                        if (price) {
                            notOwnedTotalPrice += price.value;
                            continue;
                        }
                    }
                } else {
                    let finalPrice = node.querySelector(".final_price");
                    if (finalPrice) {
                        if (finalPrice.textContent === "N/A") {
                            notOwnedTotalPrice = null;
                            break;
                        }
                    }
                    continue;
                }
                console.warn("Couldn't find any price information for appid", node.dataset.dsAppid);
            }

            if (notOwnedTotalPrice !== null) {
                let priceNodes = document.querySelectorAll(".package_totals_area .price");
                let packagePrice = Price.parseFromString(priceNodes[priceNodes.length-1].textContent, Currency.storeCurrency);
                if (!packagePrice) { return; }

                notOwnedTotalPrice -= packagePrice.value;

                if (!document.querySelector("#package_savings_bar")) {
                    HTML.beforeEnd(".package_totals_area",
                        "<div id='package_savings_bar'><div class='savings'></div><div class='message'>" + Localization.str.bundle_saving_text + "</div></div>");
                }

                notOwnedTotalPrice = new Price(notOwnedTotalPrice, Currency.storeCurrency);
                let style = (notOwnedTotalPrice.value < 0 ? " style='color:red'" : "");
                let html = `<div class="savings"${style}>${notOwnedTotalPrice}</div>`;

                let savingsNode = document.querySelector(".savings");
                HTML.beforeBegin(savingsNode, html);
                savingsNode.remove();
            }
            
        }, 500); // why is this here?
    }
}


class BundlePageClass extends StorePageClass {
    constructor(url) {
        super();

        this.bundleid = GameId.getBundleid(url);

        this.addDrmWarnings();
        this.addPrices();
        this.addLinks("bundle");
    }
}

class AppPageClass extends StorePageClass {
    constructor(url) {
        super();

        this.userNotes = new UserNotes();

        this.appid = GameId.getAppid(url);
        this.storeid = `app/${this.appid}`;

        this.onWishAndWaitlistRemove = null;

        // Some games (e.g. 201270, 201271) have different appid in store page and community
        let communityAppidSrc = document.querySelector(".apphub_AppIcon img").getAttribute("src");
        this.communityAppid = GameId.getAppidImgSrc(communityAppidSrc);
        if (!this.communityAppid) {
            this.communityAppid = this.appid;
        }

        let metalinkNode = document.querySelector("#game_area_metalink a");
        this.metalink = metalinkNode && metalinkNode.getAttribute("href");

        this.data = this.storePageDataPromise().catch(err => console.error(err));
        this.appName = document.querySelector(".apphub_AppName").textContent;
        
        this.forceVideoMP4();
        this.initHdPlayer();
        this.addWishlistRemove();
        this.addUserNote();
        this.addWaitlistDropdown();
        this.addNewQueueButton();
        this.addFullscreenScreenshotView();

        this.addCoupon();
        this.addPrices();
        this.addDlcInfo();

        this.addDrmWarnings();
        this.addMetacriticUserScore();
        this.addOpenCritic();
        this.addOwnedElsewhere();
        this.displayViewInLibrary();
        this.displayPurchaseDate();
        this.addYouTubeGameplay();
        this.addYouTubeReviews();

        new MediaPage().appPage();

        this.addWidescreenCertification();

        this.addHltb();

        this.replaceDevPubLinks();
        this.moveUsefulLinks();
        this.addLinks("app");
        this.addTitleHighlight();
        this.addFamilySharingWarning();
        this.removeAboutLink();

        this.addPackBreakdown();
        this.addPackageInfoButton();
        this.addStats().then(this.customizeAppPage);

        this.addDlcCheckboxes();
        this.addBadgeProgress();
        this.addAstatsLink();
        this.addAchievementCompletionBar();

        this.showRegionalPricing("app");

        this.addReviewToggleButton();
        this.addHelpButton();
        this.addSupport();
    }

    initHdPlayer() {
        let self = this;
        let movieNode = document.querySelector('div.highlight_movie');
        if (!movieNode) { return; }

        let playInHD = LocalStorage.get('playback_hd');

        // Add HD Control to each video as it's added to the DOM
        let firstVideoIsPlaying = movieNode.querySelector('video.highlight_movie');
        if (firstVideoIsPlaying) {
            addHDControl(firstVideoIsPlaying);
        }

        let observer = new MutationObserver(function(mutation_records){
            for (let mr of mutation_records) {
                // Array.from(mr.addedNodes).filter(n => n.matches && n.matches('video.highlight_movie')).forEach(n => addHDControl(n));
                for (let node of mr.addedNodes) {
                    if (!node.matches || !node.matches('video.highlight_movie')) continue;
                    addHDControl(node);
                }
            }
        });
        document.querySelectorAll('div.highlight_movie').forEach(function(node, idx){
            observer.observe(node, { 'childList': true, });
        });

        // When the "HD" button is clicked change the definition for all videos accordingly
        document.querySelector('#highlight_player_area').addEventListener('click', clickHDControl, true);
        function clickHDControl(ev) {
            if (!ev.target.matches || !ev.target.closest('.es_hd_toggle')) return;

            ev.preventDefault();
            ev.stopPropagation();

            let videoControl = ev.target.closest('div.highlight_movie').querySelector('video');
            let playInHD = self.toggleVideoDefinition(videoControl);

            for (let n of document.querySelectorAll('video.highlight_movie')) {
                if (n === videoControl) continue;
                self.toggleVideoDefinition(n, playInHD);
            }

            LocalStorage.set('playback_hd', playInHD);
        }

        // When the slider is expanded first time after the page was loaded set videos definition to HD
        for (let node of document.querySelectorAll('.es_slider_toggle')) {
            node.addEventListener('click', clickInitialHD, false);
        }
        function clickInitialHD(ev) {
            ev.currentTarget.removeEventListener('click', clickInitialHD, false);
            if (!ev.target.classList.contains('es_expanded')) return;
            for (let node of document.querySelectorAll('video.highlight_movie.es_video_sd')) {
                self.toggleVideoDefinition(node, true);
            }
            LocalStorage.set('playback_hd', true);
        }

        function addHDControl(videoControl) {
            playInHD = LocalStorage.get('playback_hd');

            function _addHDControl() {
                // Add "HD" button to the video
                if (videoControl.dataset.hdSrc) {
                    let node = videoControl.parentNode.querySelector('.time');
                    if (node) {
                        HTML.afterEnd(node, `<div class="es_hd_toggle"><span>HD</span></div>`);
                    }
                }

                // Override Valve's auto switch to HD when putting a video in fullscreen
                let node = videoControl.parentNode.querySelector('.fullscreen_button');
                if (node) {
                    let newNode = document.createElement('div');
                    newNode.classList.add("fullscreen_button");
                    newNode.addEventListener('click', (() => toggleFullscreen(videoControl)), false);
                    node.replaceWith(newNode);
                    node = null; // prevent memory leak
                    newNode = null;
                }

                // Toggle fullscreen on video double click
                videoControl.addEventListener('dblclick', (() => toggleFullscreen(videoControl)), false);

                self.toggleVideoDefinition(videoControl, playInHD);
            }
            setTimeout(_addHDControl, 150);
            // prevents a bug in Chrome which causes videos to stop playing after changing the src
        }

        function toggleFullscreen(videoControl) {
            let fullscreenAvailable = document.fullscreenEnabled || document.mozFullScreenEnabled;
            // Chrome unprefixed in v45
            // Mozilla unprefixed in v64
            if (!fullscreenAvailable) return;

            let container = videoControl.parentNode;
            let isFullscreen = document.webkitFullscreenElement || document.mozFullScreenElement || document.fullscreenElement;
            // Mozilla unprefixed in v64
            // Chrome still prefixed

            if (isFullscreen) {
                if (document.exitFullscreen)
                    document.exitFullscreen(); // Unprefixed in v64
                else if (document.mozCancelFullScreen)
                    document.mozCancelFullScreen(); // Unprefixed in v64
            } else {
                let response = null;
                if (container.requestFullscreen)
                    response = container.requestFullscreen();
                else if (container.mozRequestFullScreen)
                    response = container.mozRequestFullScreen(); // Unprefixed in v64
                else if (container.webkitRequestFullscreen)
                    container.webkitRequestFullscreen(); // no promise
                // if response is a promise, catch any errors it throws
                Promise.resolve(response).catch(err => console.error(err));
            }
        }
    }

    toggleVideoDefinition(videoControl, setHD) {
        let videoIsVisible = videoControl.parentNode.offsetHeight > 0 && videoControl.parentNode.offsetWidth > 0, // $J().is(':visible')
            videoIsHD = false,
            loadedSrc = videoControl.classList.contains("es_loaded_src"),
            playInHD = LocalStorage.get("playback_hd") || videoControl.classList.contains("es_video_hd");

        let videoPosition = videoControl.currentTime || 0,
            videoPaused = videoControl.paused;
        if (videoIsVisible) {
            videoControl.preload = "metadata";
            videoControl.addEventListener("loadedmetadata", onLoadedMetaData, false);
        }
        function onLoadedMetaData() {
            this.currentTime = videoPosition;
            if (!videoPaused && videoControl.play) {
                // if response is a promise, suppress any errors it throws
                Promise.resolve(videoControl.play()).catch(err => {});
            }
            videoControl.removeEventListener('loadedmetadata', onLoadedMetaData, false);
        }

        if ((!playInHD && typeof setHD === 'undefined') || setHD === true) {
            videoIsHD = true;
            videoControl.src = videoControl.dataset.hdSrc;
        } else if (loadedSrc) {
            videoControl.src = videoControl.dataset.sdSrc;
        }

        if (videoIsVisible && loadedSrc) {
            videoControl.load();
        }

        videoControl.classList.add("es_loaded_src");
        videoControl.classList.toggle("es_video_sd", !videoIsHD);
        videoControl.classList.toggle("es_video_hd", videoIsHD);
        videoControl.parentNode.classList.toggle("es_playback_sd", !videoIsHD);
        videoControl.parentNode.classList.toggle("es_playback_hd", videoIsHD);

        return videoIsHD;
    }

    storePageDataPromise() {
        return Background.action("storepagedata", this.appid, this.metalink, SyncedStorage.get("showoc"));
    }

    /**
     *  Allows the user to intuitively remove an item from their wishlist on the app page
     */
    addWishlistRemove() {
        if (!User.isSignedIn) { return; }

        // there is no add to wishlist button and game is not purchased yet, add required nodes
        if (!document.querySelector("#add_to_wishlist_area") && !document.querySelector(".game_area_already_owned")) {
            let firstButton = document.querySelector(".queue_actions_ctn a.queue_btn_active");
            HTML.beforeEnd(firstButton, "<div id='add_to_wishlist_area_success' style='display: inline-block;'></div>");

            let wlSuccessArea = document.querySelector("#add_to_wishlist_area_success");
            DOMHelper.wrap(wlSuccessArea, firstButton);
            HTML.beforeBegin(wlSuccessArea,  `<div id='add_to_wishlist_area' style='display: none;'><a class='btnv6_blue_hoverfade btn_medium' href='javascript:AddToWishlist(${this.appid}, \\"add_to_wishlist_area\\", \\"add_to_wishlist_area_success\\", \\"add_to_wishlist_area_fail\\", \\"1_5_9__407\\" );'><span>${Localization.str.add_to_wishlist}</span></a></div>`);
            HTML.beforeBegin(wlSuccessArea, `<div id='add_to_wishlist_area_fail' style='display: none;'></div>`);
        }

        let addBtn = document.querySelector("#add_to_wishlist_area > a");
        if (addBtn && !addBtn.href) addBtn.href = `javascript:AddToWishlist( ${this.appid}, 'add_to_wishlist_area', 'add_to_wishlist_area_success', 'add_to_wishlist_area_fail', null, 'add_to_wishlist_area2' );`

        let successNode = document.querySelector("#add_to_wishlist_area_success");
        if (!successNode) { return; }

        let innerNode = successNode.querySelector("[data-tooltip-text]");
        if (!innerNode) { return; }
        innerNode.dataset.tooltipText = Localization.str.remove_from_wishlist;

        let imgNode = innerNode.querySelector("img:last-child");
        if (!imgNode) { return; }

        imgNode.classList.add("es-in-wl");
        HTML.beforeBegin(imgNode,
            `<img class='es-remove-wl' src='${ExtensionResources.getURL("img/remove.png")}' style='display:none' />
             <img class='es-loading-wl' src='//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif' style='display:none; width:16px' />`);

        successNode.addEventListener("click", async e => {
            e.preventDefault();

            let parent = successNode.parentNode;
            if (!parent.classList.contains("loading")) {
                parent.classList.add("loading");

                let removeWaitlist = !!document.querySelector(".queue_btn_wishlist + .queue_btn_ignore_menu.owned_elsewhere");

                try {
                    await Promise.all([
                        this._removeFromWishlist(),
                        removeWaitlist ? this._removeFromWaitlist() : Promise.resolve(),
                    ]);

                    if (SyncedStorage.get("add_to_waitlist")) { this.onWishAndWaitlistRemove(); }

                    document.querySelector("#add_to_wishlist_area").style.display = "inline";
                    document.querySelector("#add_to_wishlist_area_success").style.display = "none";

                    // Clear dynamicstore cache
                    DynamicStore.clear();

                    // Invalidate dynamic store data cache
                    ExtensionLayer.runInPageContext(() => GDynamicStore.InvalidateCache());
                } finally {
                    parent.classList.remove("loading");
                }
            }
        });

        for (let node of document.querySelectorAll("#add_to_wishlist_area, #add_to_wishlist_area_success, .queue_btn_ignore")) {
            node.addEventListener("click", DynamicStore.clear);
        }
    }

    async _removeFromWishlist() {
        let formData = new FormData();
        formData.append("sessionid", User.getSessionId());
        formData.append("appid", this.appid);

        return RequestData.post("https://store.steampowered.com/api/removefromwishlist", formData, {withCredentials: true})
    }

    async _removeFromWaitlist() {
        return Background.action("itad.removefromwaitlist", this.appid);
    }

    async addUserNote() {
        if (!User.isSignedIn || !SyncedStorage.get("showusernotes")) { return; }

        let noteText = "";
        let cssClass = "esi-note--hidden";

        let inactiveStyle = "";
        let activeStyle = "display:none;";

        if (await this.userNotes.exists(this.appid)) {
            noteText = `"${await this.userNotes.get(this.appid)}"`;
            cssClass = "";

            inactiveStyle = "display:none;";
            activeStyle = "";
        }

        HTML.beforeBegin(".queue_actions_ctn > :last-child",
            `<div class="queue_control_button js-user-note-button">
                <div id="es_add_note" class="btnv6_blue_hoverfade btn_medium queue_btn_inactive" style="${inactiveStyle}">
                    <span>${Localization.str.user_note.add}</span>
                </div>
                <div id="es_update_note" class="btnv6_blue_hoverfade btn_medium queue_btn_inactive" style="${activeStyle}">
                    <span>${Localization.str.user_note.update}</span>
                </div>
            </div>`);

        HTML.beforeEnd(".queue_actions_ctn",
            `<div id='esi-store-user-note' class='esi-note esi-note--store ${cssClass}'>${noteText}</div>`);

        function toggleState(node, active) {
            let button = document.querySelector(".js-user-note-button");
            button.querySelector("#es_add_note").style.display = active ? "none" : null;
            button.querySelector("#es_update_note").style.display = active ? null : "none";

            node.classList.toggle("esi-note--hidden", !active);
        }

        let handler = () => {
            this.userNotes.showModalDialog(this.appName, this.appid, "#esi-store-user-note", toggleState);
        };

        document.querySelector(".js-user-note-button").addEventListener("click", handler);
        document.querySelector("#esi-store-user-note").addEventListener("click", handler);
    }

    async addWaitlistDropdown() {
        if (!document.querySelector("#add_to_wishlist_area") || !SyncedStorage.get("add_to_waitlist") || !await Background.action("itad.isconnected")) return;

        // This node will be hidden behind the dropdown menu. Also, it's not really desirable when using dropdown menus to have a permanent div floating nearby
        let notice = document.querySelector(".wishlist_added_temp_notice");
        if (notice) notice.remove();

        let wishlistDivs = document.querySelectorAll("#add_to_wishlist_area,#add_to_wishlist_area_success");
        let [wishlistArea, wishlistSuccessArea] = wishlistDivs;

        HTML.afterEnd(".queue_actions_ctn :first-child",
            `<div style="position: relative; display: inline-block;">
                <div class="queue_control_button queue_btn_wishlist"></div>
            </div>`);

        // Creating a common parent for #add_to_wishlist_area and #add_to_wishlist_area_success makes it easier to apply the dropdown menu
        let wrapper = document.querySelector(".queue_btn_wishlist");

        // Move the wrapper such that there can't be any other elements in between the dropdown and other buttons (see #690)
        document.querySelector(".queue_actions_ctn").insertBefore(wrapper.parentNode, wishlistArea);

        wishlistDivs.forEach(div => {
            wrapper.appendChild(div);
            let button = div.querySelector(".btnv6_blue_hoverfade");
            button.style.borderTopRightRadius = 0;
            button.style.borderBottomRightRadius = 0;
        });

        HTML.afterEnd(wrapper,
            `<div class="queue_control_button queue_btn_ignore_menu" style="display: inline;">
                <div class="queue_ignore_menu_arrow btn_medium">
                    <span><img src="https://steamstore-a.akamaihd.net/public/images/v6/btn_arrow_down_padded.png"></span>
                </div>
                <div class="queue_ignore_menu_flyout">
                    <div class="queue_ignore_menu_flyout_content">
                        <div class="queue_ignore_menu_option" id="queue_ignore_menu_option_not_interested">
                            <div>
                                <img class="queue_ignore_menu_option_image selected" src="https://steamstore-a.akamaihd.net/public/images/v6/ico/ico_selected_bright.png">
                                <img class="queue_ignore_menu_option_image unselected" src="https://steamstore-a.akamaihd.net/public/images/v6/ico/ico_unselected_bright.png">
                            </div>
                            <div class="queue_ignore_menu_option_label">
                                <div class="option_title">${Localization.str.wishlist} (${Localization.str.theworddefault})</div>
                                <div class="option_subtitle">${Localization.str.add_to_wishlist}</div>
                            </div>
                        </div>
                        <div class="queue_ignore_menu_option" id="queue_ignore_menu_option_owned_elsewhere">
                            <div>
                                <img class="queue_ignore_menu_option_image selected" src="https://steamstore-a.akamaihd.net/public/images/v6/ico/ico_selected_bright.png">
                                <img class="queue_ignore_menu_option_image unselected" src="https://steamstore-a.akamaihd.net/public/images/v6/ico/ico_unselected_bright.png">
                            </div>
                            <div class="queue_ignore_menu_option_label">
                                <div class="option_title">Waitlist</div>
                                <div class="option_subtitle">${Localization.str.add_to_waitlist}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`);

        let wishlisted = document.querySelector("#add_to_wishlist_area").style.display === "none";
        let waitlisted = await Background.action("itad.inwaitlist", this.storeid);

        let menuArrow = document.querySelector(".queue_ignore_menu_arrow");
        let menu = document.querySelector(".queue_btn_ignore_menu");
        let wishlistOption = document.querySelector("#queue_ignore_menu_option_not_interested");
        let waitlistOption = document.querySelector("#queue_ignore_menu_option_owned_elsewhere");

        updateDiv();

        function updateDiv() {
            let oneActive = wishlisted || waitlisted;

            menuArrow.classList.toggle("queue_btn_active", oneActive);
            menuArrow.classList.toggle("queue_btn_inactive", !oneActive);

            menu.classList.toggle("not_interested", wishlisted);
            menu.classList.toggle("owned_elsewhere", waitlisted);

            wishlistArea.style.display = oneActive ? "none" : '';
            wishlistSuccessArea.style.display = oneActive ? '' : "none";

            let text;
            if (wishlisted && !waitlisted) {
                text = Localization.str.on_wishlist;
            } else if (!wishlisted && waitlisted) {
                text = Localization.str.on_waitlist;
            } else if (wishlisted && waitlisted) {
                text = `${Localization.str.on_wishlist} & ${Localization.str.on_waitlist}`;
            } else {
                document.querySelector("#add_to_wishlist_area span").textContent = ` ${Localization.str.add_to_wishlist}`;
                return;
            }
            
            document.querySelector("#add_to_wishlist_area_success span").lastChild.textContent = ` ${text}`;
        }

        wishlistArea.querySelector("a").addEventListener("click", () => {
            Messenger.onMessage("wishlistAdded").then(() => {
                wishlisted = !wishlisted;
                updateDiv();
            });

            ExtensionLayer.runInPageContext(() =>
                $J(document).ajaxComplete(function handler(e, xhr, { url }) {
                    if (url === "https://store.steampowered.com/api/addtowishlist") {
                        Messenger.postMessage("wishlistAdded");
                        $J(document).unbind("ajaxComplete", handler);
                    }
                })
            );
        });

        this.onWishAndWaitlistRemove = () => {
            wishlisted = waitlisted = false;
            updateDiv();
        };

        wishlistOption.addEventListener("click", async () => {
            if (wishlisted) {
                await this._removeFromWishlist();
                wishlisted = !wishlisted;
                updateDiv();
            } else {
                wishlistArea.querySelector("a").click();
            }
        });

        waitlistOption.addEventListener("click", async () => {
            if (waitlisted) {
                await Background.action("itad.removefromwaitlist", this.appid);
            } else {
                await Background.action("itad.addtowaitlist", this.appid);
            }
            waitlisted = !waitlisted;
            updateDiv();
        });
    }

    addNewQueueButton() {
        if (!document.querySelector(".finish_queue_text")) { return; }

        HTML.afterEnd(".btn_next_in_queue",
            `<div id="es_new_queue" class="btn_next_in_queue btn_next_in_queue_trigger" data-tooltip-text="${Localization.str.queue.new_tooltip}">
                <div class="next_in_queue_content">
                    <span class="finish_queue_text">${Localization.str.queue.new}</span>
                </div>
            </div>`);

        ExtensionLayer.runInPageContext(() => {

            $J("#es_new_queue").v_tooltip({"tooltipClass": "store_tooltip", "dataName": 'tooltipText', "defaultType": "text", "replaceExisting": false });

            $J("#es_new_queue").on("click", () => {
                $J.ajax({
                    url: "https://store.steampowered.com/explore/next/" + g_eDiscoveryQueueType + '/',
                    type: "POST",
                    data: $J("#next_in_queue_form").serialize(),
                    success: () => window.location.href = "https://store.steampowered.com/explore/startnew/" + g_eDiscoveryQueueType + '/'
                    // TODO error handling, waiting on #231 and #275 to merge
                });
            });
        });
    }

    addFullscreenScreenshotView() {
        function toggleFullScreen(event) {
            if (!document.fullscreenElement) {
                let element = event.target.closest(".screenshot_popup_modal_content");
                element.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }

        function initFSVButtons() {
            let modalFooter = document.querySelector(".screenshot_popup_modal_footer");
            let nextButton = modalFooter.querySelector(".next");
            let nextButtonOffsetWidth = nextButton.offsetWidth;
            if (nextButton.style.display === "none") {
                nextButton.style.display = "";
                nextButtonOffsetWidth = nextButton.offsetWidth;
                nextButton.style.display = "none";
            }
            HTML.beforeEnd(modalFooter,
                `<div class="btnv6_blue_hoverfade btn_medium es_screenshot_fullscreen_toggle" style="right: calc(${nextButtonOffsetWidth}px + 0.5em)"><i></i></div>`);
            let fsvButton = modalFooter.querySelector(".es_screenshot_fullscreen_toggle");
            fsvButton.addEventListener("click", toggleFullScreen);

            let modalTitleLink = modalFooter.parentElement.querySelector(".screenshot_popup_modal_title > a");
            HTML.beforeEnd(modalFooter,
                `<div class="btnv6_blue_hoverfade btn_medium es_screenshot_open_btn" style="right: calc(${nextButtonOffsetWidth + fsvButton.offsetWidth}px + 1em)"><i></i></div>`);
            let openButton = modalFooter.querySelector(".es_screenshot_open_btn");
            openButton.addEventListener("click", () => {
                window.open(modalTitleLink.href, "_blank");
            });
        }

        let observer = new MutationObserver(records => {
            for (let record of records) {
                for (let node of record.addedNodes) {
                    if (node.classList.contains("screenshot_popup_modal")) {
                        initFSVButtons();
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true });
    }

    getFirstSubid() {
        let node = document.querySelector("div.game_area_purchase_game input[name=subid]");
        return node && node.value;
    }

    async addCoupon() {
        if (!SyncedStorage.get("show_coupon")) { return; }
        
        let coupon = await Inventory.getCoupon(this.appid);
        if (!coupon) { return; }

        let couponDate = coupon.valid && coupon.valid.replace(/\[date](.+)\[\/date]/, function(m0, m1) { return new Date(m1 * 1000).toLocaleString(); });

        HTML.beforeBegin("#game_area_purchase",
            `<div class="early_access_header">
                <div class="heading">
                    <h1 class="inset">${Localization.str.coupon_available}</h1>
                    <h2 class="inset">${Localization.str.coupon_application_note}</h2>
                    <p>${Localization.str.coupon_learn_more}</p>
                </div>
                <div class="devnotes">
                    <div style="display:flex;padding-top:10px">
                        <img src="http://cdn.steamcommunity.com/economy/image/${coupon.image_url}" style="width:96px;height:64px;"/>
                        <div style="display:flex;flex-direction:column;margin-left:10px">
                            <h1>${coupon.title}</h1>
                            <div>${coupon.discount_note || ""}</div>
                            <div style="color:#a75124">${couponDate}</div>
                        </div>
                    </div>
                </div>
            </div>`);

        // TODO show price in purchase box
    }

    addDlcInfo() {
        if (!this.isDlc()) { return; }

        let html = `<div class='block responsive_apppage_details_right heading'>${Localization.str.dlc_details}</div><div class='block'><div class='block_content'><div class='block_content_inner'><div class='details_block'>`;
        Background.action('dlcinfo', { 'appid': this.appid, 'appname': this.appName, } ).then(response => {
            for(let item of response) {
                let iconUrl = Config.CdnHost + "/gamedata/icons/" + encodeURIComponent(item.icon);
                let title = HTML.escape(item.desc);
                let name = HTML.escape(item.name);
                html += `<div class='game_area_details_specs'><div class='icon'><img src='${iconUrl}' align='top'></div><a class='name' title='${title}'>${name}</a></div>`;
            }
        }).finally(() => {
            let suggestUrl = Config.PublicHost + "/gamedata/dlc_category_suggest.php?appid=" + this.appid + "&appname=" + encodeURIComponent(this.appName);
            html += `</div><a class='linkbar' style='margin-top: 10px;' href='${suggestUrl}' target='_blank'>${Localization.str.dlc_suggest}</a></div></div></div>`;

            HTML.beforeBegin(document.querySelector("#category_block").parentNode, html);
        });
    }

    addMetacriticUserScore() {
        if (!SyncedStorage.get("showmcus")) { return; }

        let node = document.querySelector("#game_area_metascore");
        if (!node) { return; }

        this.data.then(response => {
            if (!response || !response.data || !response.data.userscore) { return; }

            let metauserscore = response.data.userscore * 10;
            if (!isNaN(metauserscore)) {
                HTML.afterEnd(node, "<div id='game_area_userscore'></div>");

                let rating;
                if (metauserscore >= 75) {
                    rating = "high";
                } else if (metauserscore >= 50) {
                    rating = "medium";
                } else {
                    rating = "low";
                }

                HTML.beforeEnd("#game_area_userscore",
                    `<div class='score ${rating}'>${metauserscore}</div>
                    <div class='logo'></div><div class='wordmark'><div class='metacritic'>${Localization.str.user_score}</div></div>`)
            }
        });
    }

    addOpenCritic() {
        if (!SyncedStorage.get("showoc")) { return; }

        this.data.then(result => {
            if (!result || !result.oc) { return; }
            let data = result.oc;

            if (!data.url) { return; }

            let node = document.querySelector("#game_area_metascore");
            if (node) {
                node = node.parentNode;
            } else {
                node = document.querySelector(".game_details");
            }
            HTML.afterEnd(node, "<div><div class='block responsive_apppage_reviewblock'><div id='game_area_opencritic'></div><div style='clear: both'></div></div>");

            let opencriticImg = ExtensionResources.getURL("img/opencritic.png");
            let award = data.award || "NA";

            HTML.beforeEnd("#game_area_opencritic",
                `<div class='score ${award.toLowerCase()}'>${data.score ? data.score : "--"}</div>
                 <div class='logo'><img src='${opencriticImg}'></div>
                 <div class='wordmark'>
                     <div class='metacritic'>OpenCritic</div>
                     <div id='game_area_metalink'>${award} - <a href='${data.url}?utm_source=enhanced-steam-itad&utm_medium=average' target='_blank'>${Localization.str.read_reviews}</a>
                         <img src='https://steamstore-a.akamaihd.net/public/images/ico/iconExternalLink.gif' border='0' align='bottom'>
                     </div>
                 </div>`);

            // Add data to the review section in the left column, or create one if that block doesn't exist
            if (data.reviews.length > 0) {
                let reviewsNode = document.getElementById("game_area_reviews");
                let html = `<div id='es_opencritic_reviews'><div class='chart-footer'>${Localization.str.read_more_reviews} <a href='${data.url}?utm_source=enhanced-steam-itad&utm_medium=reviews' target='_blank'>OpenCritic.com</a></div></div>`;

                if (reviewsNode) {
                    let youTubeReviews = document.getElementById("es_youtube_reviews");

                    if (youTubeReviews) {
                        HTML.beforeBegin(youTubeReviews, html);
                    } else {
                        HTML.beforeEnd(reviewsNode, html);
                    }
                } else {
                    HTML.beforeBegin(document.getElementById("game_area_description").parentElement.parentElement,
                        `<div id='game_area_reviews' class='game_area_description'><h2>${Localization.str.reviews}</h2>${html}</div>`);

                }

                let review_text = "";
                for (let i=0, len=data.reviews.length; i<len; i++) {
                    let review = data.reviews[i];
                    let date = new Date(review.date);
                    review_text += `<p>"${review.snippet}"<br>${review.dScore} - <a href='${review.rUrl}' target='_blank' data-tooltip-text='${review.author}, ${date.toLocaleDateString()}'>${review.name}</a></p>`;
                }

                HTML.afterBegin("#es_opencritic_reviews", review_text);
                ExtensionLayer.runInPageContext(() => BindTooltips( '#game_area_reviews', { tooltipCSSClass: 'store_tooltip'} ));
            }
        });
    }

    _getYoutubeIframeNode(appName, searchQuery) {

        let listParam = encodeURIComponent(
            // Remove trademarks etc
            `intitle:"${appName.replace(/[\u00AE\u00A9\u2122]/g, "")} ${searchQuery}" "PC"`);

        let hlParam = encodeURIComponent(Language.getLanguageCode(Language.getCurrentSteamLanguage()));

        let player = document.createElement("iframe");
        player.classList.add("es_youtube_player");
        player.type = "text/html";
        player.src = `https://www.youtube.com/embed?listType=search&list=${listParam}&origin=https://store.steampowered.com&widget_referrer=https://steamaugmented.com&hl=${hlParam}`;
        player.allowFullscreen = true;

        return player;
    }

    addYouTubeGameplay() {

        if (!SyncedStorage.get("showyoutubegameplay")) { return; }

        HTML.afterBegin(".leftcol",
            `<div id="es_media_tabs">
                <div class="store_horizontal_minislider_ctn" style="height: 31px;">
                    <div class="home_tabs_row">
                        <div id="es_tab_steammedia" class="es_media_tab home_tab active">
                            <div class="tab_content">Steam</div>
                        </div>
                        <div id="es_tab_youtubemedia" class="es_media_tab home_tab">
                            <div class="tab_content">${Localization.str.youtube_gameplay}</div>
                        </div>
                    </div>
                </div>
            </div>`);

        /*  The separation of the tabs bar allows us to place the media slider right above the top right corner of the player.
            This empty div is inserted here in order to keep the same height difference between the left and the right column. */
        HTML.afterBegin(".rightcol", "<div style='height: 31px;'></div>");

        let youTubeTab = document.getElementById("es_tab_youtubemedia");
        let steamTab = document.getElementById("es_tab_steammedia");

        let youTubeMedia = document.getElementById("es_youtube_gameplay_player");
        let steamMedia = document.querySelector(".highlight_overflow");

        youTubeTab.addEventListener("click", () => {

            if (!youTubeMedia) {
                youTubeMedia = this._getYoutubeIframeNode(this.appName, Localization.str.gameplay);
                youTubeMedia.id = "es_youtube_gameplay_player";

                document.querySelector(".highlight_ctn")
                    .insertAdjacentElement("beforeend", youTubeMedia);
            }

            steamMedia.style.display = "none";
            steamTab.classList.remove("active");

            youTubeMedia.style.display = "block";
            youTubeTab.classList.add("active");

            ExtensionLayer.runInPageContext(() => SteamOnWebPanelHidden());
        });

        steamTab.addEventListener("click", () => {

            if (youTubeMedia) {

                youTubeMedia.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', "https://www.youtube.com");

                youTubeMedia.style.display = "none";
                youTubeTab.classList.remove("active");

                steamMedia.style.display = "block";
                steamTab.classList.add("active");

                ExtensionLayer.runInPageContext(() => SteamOnWebPanelShown());
            }
        });
    }

    addYouTubeReviews() {
        if (!SyncedStorage.get("showyoutubereviews")) { return; }

        let reviewsNode = document.querySelector("#game_area_reviews");
        if (!reviewsNode) {
            HTML.beforeBegin(document.getElementById("game_area_description").parentElement.parentElement,
                `<div id="game_area_reviews" class="game_area_description">
                    <h2>${Localization.str.reviews}</h2>
                    <div id="es_youtube_reviews"></div>
                </div>`);

        } else {
            HTML.beforeEnd(reviewsNode, '<div id="es_youtube_reviews"></div>');
        }

        document.getElementById("es_youtube_reviews").appendChild(this._getYoutubeIframeNode(this.appName, Localization.str.review));
    }

    displayViewInLibrary() {
        if (!User.isSignedIn || !SyncedStorage.get("showviewinlibrary")) { return; }

        let node = document.querySelector(".already_owned_actions");
        if (!node) { return; }

        HTML.afterBegin(node,
            `<div class="game_area_already_owned_btn">
                <a class="btnv6_lightblue_blue btnv6_border_2px btn_medium" href="steam://nav/games/details/${this.appid}">
                    <span>${Localization.str.view_in_library}</span>
                </a>
            </div>`);
    }

    displayPurchaseDate() {
        if (!SyncedStorage.get("purchase_dates")) { return; }

        let node = document.querySelector(".game_area_already_owned");
        if (!node) { return; }

        let appname = this.appName.replace(":", "").trim();

        User.getPurchaseDate(Language.getCurrentSteamLanguage(), appname).then(date => {
            if (!date) { return; }
            HTML.beforeEnd(".game_area_already_owned .already_in_library",
                ` ${Localization.str.purchase_date.replace("__date__", date)}`);
        });
    }

    addOwnedElsewhere() {
        if (document.querySelector(".game_area_already_owned")) return;

        Background.action("itad.getfromcollection", `app/${this.appid}`).then(result => {
            if (!result) return;
            
            HTML.afterEnd(".queue_overflow_ctn",
                `<div class="game_area_already_owned page_content" style="background-image: linear-gradient(to right, #856d0e 0%, #d1a906 100%);">
                    <div class="ds_owned_flag ds_flag" style="background-color: #856d0e;">${Localization.str.coll.in_collection.toUpperCase()}&nbsp;&nbsp;</div>
                    <div class="already_in_library" style="color: #ffe000;">${Localization.str.owned_elsewhere.replace("__gametitle__", this.appName).replace("__storelist__", result.map(store => `<strong>${store}</strong>`).join(", "))}</div>
                </div>`)
        })
    }

    addWidescreenCertification() {
        if (this.isDlc() || !SyncedStorage.get("showwsgf")) { return; }

        this.data.then(result => {
            if (!result || !result.wsgf) { return; }
            let data = result.wsgf;

            let path = data["Path"];
            let wsg = data["WideScreenGrade"];
            let mmg = data["MultiMonitorGrade"];
            let fkg = data["Grade4k"];
            let uws = data["UltraWideScreenGrade"];
            let wsg_icon = "", wsg_text = "", mmg_icon = "", mmg_text = "";
            let fkg_icon = "", fkg_text = "", uws_icon = "", uws_text = "";

            switch (wsg) {
                case "A":
                    wsg_icon = ExtensionResources.getURL("img/wsgf/ws-gold.png");
                    wsg_text = Localization.str.wsgf.gold.replace(/__type__/g, "Widescreen");
                    break;
                case "B":
                    wsg_icon = ExtensionResources.getURL("img/wsgf/ws-silver.png");
                    wsg_text = Localization.str.wsgf.silver.replace(/__type__/g, "Widescreen");
                    break;
                case "C":
                    wsg_icon = ExtensionResources.getURL("img/wsgf/ws-limited.png");
                    wsg_text = Localization.str.wsgf.limited.replace(/__type__/g, "Widescreen");
                    break;
                case "Incomplete":
                    wsg_icon = ExtensionResources.getURL("img/wsgf/ws-incomplete.png");
                    wsg_text = Localization.str.wsgf.incomplete;
                    break;
                case "Unsupported":
                    wsg_icon = ExtensionResources.getURL("img/wsgf/ws-unsupported.png");
                    wsg_text = Localization.str.wsgf.unsupported.replace(/__type__/g, "Widescreen");
                    break;
            }

            switch (mmg) {
                case "A":
                    mmg_icon = ExtensionResources.getURL("img/wsgf/mm-gold.png");
                    mmg_text = Localization.str.wsgf.gold.replace(/__type__/g, "Multi-Monitor");
                    break;
                case "B":
                    mmg_icon = ExtensionResources.getURL("img/wsgf/mm-silver.png");
                    mmg_text = Localization.str.wsgf.silver.replace(/__type__/g, "Multi-Monitor");
                    break;
                case "C":
                    mmg_icon = ExtensionResources.getURL("img/wsgf/mm-limited.png");
                    mmg_text = Localization.str.wsgf.limited.replace(/__type__/g, "Multi-Monitor");
                    break;
                case "Incomplete":
                    mmg_icon = ExtensionResources.getURL("img/wsgf/mm-incomplete.png");
                    mmg_text = Localization.str.wsgf.incomplete;
                    break;
                case "Unsupported":
                    mmg_icon = ExtensionResources.getURL("img/wsgf/mm-unsupported.png");
                    mmg_text = Localization.str.wsgf.unsupported.replace(/__type__/g, "Multi-Monitor");
                    break;
            }

            switch (uws) {
                case "A":
                    uws_icon = ExtensionResources.getURL("img/wsgf/uw-gold.png");
                    uws_text = Localization.str.wsgf.gold.replace(/__type__/g, "Ultra-Widescreen");
                    break;
                case "B":
                    uws_icon = ExtensionResources.getURL("img/wsgf/uw-silver.png");
                    uws_text = Localization.str.wsgf.silver.replace(/__type__/g, "Ultra-Widescreen");
                    break;
                case "C":
                    uws_icon = ExtensionResources.getURL("img/wsgf/uw-limited.png");
                    uws_text = Localization.str.wsgf.limited.replace(/__type__/g, "Ultra-Widescreen");
                    break;
                case "Incomplete":
                    uws_icon = ExtensionResources.getURL("img/wsgf/uw-incomplete.png");
                    uws_text = Localization.str.wsgf.incomplete;
                    break;
                case "Unsupported":
                    uws_icon = ExtensionResources.getURL("img/wsgf/uw-unsupported.png");
                    uws_text = Localization.str.wsgf.unsupported.replace(/__type__/g, "Ultra-Widescreen");
                    break;
            }

            switch (fkg) {
                case "A":
                    fkg_icon = ExtensionResources.getURL("img/wsgf/4k-gold.png");
                    fkg_text = Localization.str.wsgf.gold.replace(/__type__/g, "4k UHD");
                    break;
                case "B":
                    fkg_icon = ExtensionResources.getURL("img/wsgf/4k-silver.png");
                    fkg_text = Localization.str.wsgf.silver.replace(/__type__/g, "4k UHD");
                    break;
                case "C":
                    fkg_icon = ExtensionResources.getURL("img/wsgf/4k-limited.png");
                    fkg_text = Localization.str.wsgf.limited.replace(/__type__/g, "4k UHD");
                    break;
                case "Incomplete":
                    fkg_icon = ExtensionResources.getURL("img/wsgf/4k-incomplete.png");
                    fkg_text = Localization.str.wsgf.incomplete;
                    break;
                case "Unsupported":
                    fkg_icon = ExtensionResources.getURL("img/wsgf/4k-unsupported.png");
                    fkg_text = Localization.str.wsgf.unsupported.replace(/__type__/g, "4k UHD");
                    break;
            }

            let html = `<div class="block responsive_apppage_details_right heading">${Localization.str.wsgf.certifications}</div>
                       <div class="block underlined_links es_wsgf">
                       <div class="block_content"><div class="block_content_inner"><div class="details_block"><center>`;

            if (wsg !== "Incomplete") { html += `<img src="${HTML.escape(wsg_icon)}" title="${HTML.escape(wsg_text)}">&nbsp;&nbsp;&nbsp;`; }
            if (mmg !== "Incomplete") { html += `<img src="${HTML.escape(mmg_icon)}" title="${HTML.escape(mmg_text)}">&nbsp;&nbsp;&nbsp;`; }
            if (uws !== "Incomplete") { html += `<img src="${HTML.escape(uws_icon)}" title="${HTML.escape(uws_text)}">&nbsp;&nbsp;&nbsp;`; }
            if (fkg !== "Incomplete") { html += `<img src="${HTML.escape(fkg_icon)}" title="${HTML.escape(fkg_text)}">&nbsp;&nbsp;&nbsp;`; }

            html += `</center></div>
                    <br><a class="linkbar" target="_blank" href="${HTML.escape(path)}">${Localization.str.rating_details} <img src="//store.steampowered.com/public/images/v5/ico_external_link.gif"></a>
                    </div></div></div>`;

            HTML.afterEnd("div.game_details", html);
        });
    }

    addHltb() {
        if (this.isDlc() || !SyncedStorage.get("showhltb")) { return; }

        this.data.then(result => {
            if (!result || !result.hltb) { return; }
            let data = result.hltb;

            let suggestUrl = `${Config.PublicHost}/gamedata/hltb_link_suggest.php`;
            let icoImg = "//store.steampowered.com/public/images/v5/ico_external_link.gif";

            let html = `<div class="block responsive_apppage_details_right heading">${Localization.str.hltb.title}</div>
                       <div class="block game_details underlined_links es_hltb">
                       <div class="block_content"><div class="block_content_inner"><div class="details_block">`;

            if (data.success) {
                if (data["main_story"]) {
                    html += `<b>${Localization.str.hltb.main}:</b><span>${HTML.escape(data["main_story"])}</span><br>`;
                }
                if (data["main_extras"]) {
                    html += `<b>${Localization.str.hltb.main_e}:</b><span>${HTML.escape(data["main_extras"])}</span><br>`;
                }
                if (data["comp"]) {
                    html += `<b>${Localization.str.hltb.compl}:</b><span>${HTML.escape(data["comp"])}</span><br>`;
                }

                html += `</div>
                        <a class="linkbar" href="${HTML.escape(data["url"])}" target="_blank">${Localization.str.more_information} <img src="${icoImg}"></a>
                        <a class="linkbar" href="${HTML.escape(data["submit_url"])}" target="_blank">${Localization.str.hltb.submit} <img src="${icoImg}"></a>`;
                        // FIXME <a class="linkbar" href="${suggestUrl}" id="suggest">${Localization.str.hltb.wrong}-${Localization.str.hltb.help} <img src="${icoImg}"></a>
            } else {
                html += `${Localization.str.hltb.no_data}</div>`;
                        // FIXME <a class="linkbar" href="${suggestUrl}" id="suggest">${Localization.str.hltb.wrong}-${Localization.str.hltb.help} <img src="${icoImg}"></a>
            }
            html += '</div></div></div>';

            HTML.afterEnd("div.game_details", html);

            let suggest = document.querySelector("#suggest");
            if (suggest) { // FIXME consequence of the above FIXME
                suggest.addEventListener("click", () => {
                    LocalStorage.remove(`storePageData_${this.appid}`);
                    Background.action("storepagedata.expire", this.appid);
                });
            }
        });
    }

    replaceDevPubLinks() {
        if (!this.isAppPage()) { return; }

        document.querySelectorAll("#game_highlights .dev_row a,.details_block .dev_row:not(:nth-of-type(3)) a").forEach((linkNode, i) => {
            let homepageLink = new URL(linkNode.href);
            if (homepageLink.pathname === "/search/") return;

            let name = i % 2 ? "publisher" : "developer"; // These elements appear in pairs, where the first represents the developer and the second the publisher
            let value = linkNode.innerText;
            linkNode.href = `https://store.steampowered.com/search/?${name}=${encodeURIComponent(value)}`;
            HTML.afterEnd(linkNode, ` (<a href="${homepageLink.href}">${Localization.str.options.homepage}</a>)`);
        });

        for (let moreBtn of document.querySelectorAll(".dev_row > .more_btn")) {
            moreBtn.remove();
        }

        ExtensionLayer.runInPageContext(() => CollapseLongStrings(".dev_row .summary.column"));
    }

    async addSupport() {
        if (!this.isAppPage() || this.isDlc() || !SyncedStorage.get("showsupportinfo")) { return; }

        let cache = LocalStorage.get("support_info", null);
        if (!cache || !cache.expiry || cache.expiry < Date.now()) {
            cache = {
                "data": {},
                "expiry": Date.now() + (31*86400 * 1000) // 31 days
            }
        }

        let appid = this.appid;
        let supportInfo = cache[appid];
        if (!supportInfo) {
            let response = await Background.action("appdetails", appid, "support_info");
            if (!response || !response.success) { 
                console.warn("Failed to retrieve support info");
                return;
            }

            supportInfo = response.data.support_info;

            cache['data'][appid] = supportInfo;
            LocalStorage.set("support_info", cache);
        }

        let url = supportInfo.url;
        let email = supportInfo.email;
        if (!email && !url) { return; }

        let support = "";
        if (url) {
            support += `<a href="${url}">${Localization.str.website}</a>`;
        }

        if (email) {
            if (url) {
                support += ", ";
            }

            // From https://emailregex.com/
            let emailRegex =
                /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

            if (emailRegex.test(email)) {
                support += `<a href="mailto:${email}">${Localization.str.email}</a>`;
            } else {
                support += `<a href="${email}">${Localization.str.contact}</a>`;
            }
        }

        let block = document.querySelector(".glance_ctn .user_reviews");
        HTML.beforeEnd(block,
            `<div class="release_date">
                <div class="subtitle column">${Localization.str.support}:</div>
                <div class="summary column" id="es_support_list">${support}</div>
            </div>`);
    }

    moveUsefulLinks() {
        if (!this.isAppPage()) { return; }

        let usefulLinks = document.querySelector("#ReportAppBtn").parentNode.parentNode;
        usefulLinks.classList.add("es_useful_link");

        let sideDetails = document.querySelector(".es_side_details_wrap");
        if (sideDetails) {
            sideDetails.insertAdjacentElement("afterend", usefulLinks);
        } else {
            document.querySelector("div.rightcol.game_meta_data").insertAdjacentElement("afterbegin", usefulLinks);
        }
    }

    addLinks(type) {
        let node = document.querySelector("#ReportAppBtn").parentNode;

        if (SyncedStorage.get("showpcgw")) {
            HTML.afterBegin(node,
                this.getRightColLinkHtml(
                    "pcgw_btn",
                    `https://pcgamingwiki.com/api/appid.php?appid=${this.appid}`,
                    Localization.str.wiki_article.replace("__pcgw__", "PCGamingWiki")));
        }

        if (SyncedStorage.get("showcompletionistme")) {
            HTML.afterBegin(node,
                this.getRightColLinkHtml(
                    "completionistme_btn",
                    `https://completionist.me/steam/app/${this.appid}/`,
                    Localization.str.view_on_website.replace("__website__", "Completionist.me")));
        }

        if (SyncedStorage.get("showprotondb")) {
            HTML.afterBegin(node,
                this.getRightColLinkHtml(
                    "protondb_btn",
                    `https://www.protondb.com/app/${this.appid}/`,
                    Localization.str.view_on_website.replace("__website__", "ProtonDB")));
        }

        if (this.hasCards && SyncedStorage.get("showsteamcardexchange")) {
            // FIXME some dlc have card category yet no card
            HTML.afterBegin(node,
                this.getRightColLinkHtml(
                    "cardexchange_btn",
                    `https://www.steamcardexchange.net/index.php?gamepage-appid-${this.communityAppid}/`,
                    Localization.str.view_on_website.replace("__website__", "Steam Card Exchange")));
        }

        super.addLinks(type);
    }

    async addTitleHighlight() {
        await DynamicStore;
        
        let [{ collected, waitlisted }, { owned, wishlisted, ignored }, { guestPass, coupon, gift }] = await Promise.all([
            ITAD.getAppStatus(`app/${this.appid}`),
            DynamicStore.getAppStatus(`app/${this.appid}`),
            Inventory.getAppStatus(this.appid),
        ]);
        let title = document.querySelector(".apphub_AppName");

        if (collected) Highlights.highlightCollection(title);
        if (waitlisted) Highlights.highlightWaitlist(title);
        if (owned) Highlights.highlightOwned(title);
        if (guestPass) Highlights.highlightInvGuestpass(title);
        if (coupon) Highlights.highlightCoupon(title);
        if (gift) Highlights.highlightInvGift(title);
        if (wishlisted) Highlights.highlightWishlist(title);
        if (ignored) Highlights.highlightNotInterested(title);
    }

    addFamilySharingWarning() {
        if (!SyncedStorage.get("exfgls")) { return; }

        this.data.then(result => {
            if (!result.exfgls || !result.exfgls.excluded) { return; }

            let str = Localization.str.family_sharing_notice;
            HTML.beforeBegin("#game_area_purchase",
                `<div id="purchase_note"><div class="notice_box_top"></div><div class="notice_box_content">${str}</div><div class="notice_box_bottom"></div></div>`);
        });
    }

    removeAboutLink() {
        if (!SyncedStorage.get("hideaboutlinks")) { return; }

        if (document.querySelector(".game_area_already_owned .ds_owned_flag")) {
            document.querySelector(".game_area_already_owned_btn > [href^='https://store.steampowered.com/about/']").remove();
        }
    }

    addPackageInfoButton() {
        if (!SyncedStorage.get("show_package_info")) { return; }

        let nodes = document.querySelectorAll(".game_area_purchase_game_wrapper");
        for (let node of nodes) {
            if (node.querySelector(".btn_packageinfo")) return;

            let subid = node.querySelector("input[name=subid]").value;
            if (!subid) return;

            HTML.afterBegin(node.querySelector(".game_purchase_action"),
                `<div class="game_purchase_action_bg"><div class="btn_addtocart btn_packageinfo">
                 <a class="btnv6_blue_blue_innerfade btn_medium" href="//store.steampowered.com/sub/${subid}/"><span>
                 ${Localization.str.package_info}</span></a></div></div>`);
        }
    }

    addSteamChart(result) {
        if (this.isDlc()) { return; }
        if (!SyncedStorage.get("show_steamchart_info")) { return; }
	    if (!result.charts || !result.charts.chart || !result.charts.chart.peakall) { return; }

        let appid = this.appid;
        let chart = result.charts.chart;
        let html = '<div id="steam-charts" class="game_area_description"><h2>' + Localization.str.charts.current + '</h2>';
            html += '<div class="chart-content">';
                html += '<div class="chart-stat"><span class="num">' + HTML.escape(chart["current"]) + '</span><br>' + Localization.str.charts.playing_now + '</div>';
                html += '<div class="chart-stat"><span class="num">' + HTML.escape(chart["peaktoday"]) + '</span><br>' + Localization.str.charts.peaktoday + '</div>';
                html += '<div class="chart-stat"><span class="num">' + HTML.escape(chart["peakall"]) + '</span><br>' + Localization.str.charts.peakall + '</div>';
            html += '</div>';
            html += '<span class="chart-footer">';
                html += Localization.str.powered_by.replace('__link__', '<a href="http://steamcharts.com/app/' + appid + '" target="_blank">SteamCharts.com</a>');
            html += '</span>';
            html += '</div>';

        HTML.beforeBegin(document.querySelector(".sys_req").parentNode, html);
    }

    addSteamSpy(result) {
        if (this.isDlc()) { return; }
        if (!SyncedStorage.get("show_steamspy_info") || !result.steamspy || !result.steamspy.owners) { return; } // customization setting

        function getTimeString(value) {

            let days = Math.trunc(value / 1440);
            value -= days * 1440;

            let hours = Math.trunc(value / 60);
            value -= hours * 60;

            let minutes = value;

            let result = "";
            if (days > 0) { result += days+"d ";}
            result += hours+"h "+minutes+"m";

            return result;
        }

        let appid = this.appid;

        let owners = result.steamspy.owners.split("..")
        let owners_from = HTML.escape(owners[0].trim());
        let owners_to = HTML.escape(owners[1].trim());
        let averageTotal = getTimeString(result.steamspy.average_forever);
        let average2weeks = getTimeString(result.steamspy.average_2weeks);

        let html = '<div id="steam-spy" class="game_area_description"><h2>' + Localization.str.spy.player_data + '</h2>';
            html += '<div class="chart-content">';
                html += '<div class="chart-stat"><span class="num">' + owners_from + "<br>-<br>" + owners_to + '</span><br>' + Localization.str.spy.owners + '</div>';
                html += '<div class="chart-stat"><span class="num">' + averageTotal + '</span><br>' + Localization.str.spy.average_playtime + '</div>';
                html += '<div class="chart-stat"><span class="num">' + average2weeks + '</span><br>' + Localization.str.spy.average_playtime_2weeks + '</div>';
            html += "</div>";
            html += "<span class='chart-footer' style='padding-right: 13px;'>";
                html += Localization.str.powered_by.replace("__link__", "<a href='http://steamspy.com/app/" + appid + "' target='_blank'>steamspy.com</a>");
            html += "</span>";
            html += "</div>";

        HTML.beforeBegin(document.querySelector(".sys_req").parentElement, html);
    }

    addSurveyData(result) {
        if (this.isDlc()) { return; }
        if (this.isVideo()) { return; }
        if (!result.survey) { return; }

        let survey = result.survey;
        let appid = this.appid;

        let html = "<div id='performance_survey' class='game_area_description'><h2>" + Localization.str.survey.performance_survey + "</h2>";

        if (survey.success) {
            html += "<p>" + Localization.str.survey.users.replace("__users__", survey["responses"]) + "</p>";
            html += "<p><b>" + Localization.str.survey.framerate + "</b>: " + Math.round(survey["frp"]) + "% " + Localization.str.survey.framerate_response + " "
            switch (survey["fr"]) {
                case "30": html += "<span style='color: #8f0e10;'>" + Localization.str.survey.framerate_30 + "</span>"; break;
                case "fi": html += "<span style='color: #e1c48a;'>" + Localization.str.survey.framerate_fi + "</span>"; break;
                case "va": html += "<span style='color: #8BC53F;'>" + Localization.str.survey.framerate_va + "</span>"; break;
            }

            html += "<br><b>" + Localization.str.survey.resolution + "</b>: " + Localization.str.survey.resolution_support + " "
            switch (survey["mr"]) {
                case "less": html += "<span style='color: #8f0e10;'>" + Localization.str.survey.resolution_less.replace("__pixels__", "1920x1080") + "</span>"; break;
                case "hd": html += "<span style='color: #8BC53F;'>" + Localization.str.survey.resolution_up.replace("__pixels__", "1920x1080 (HD)") + "</span>"; break;
                case "wqhd": html += "<span style='color: #8BC53F;'>" + Localization.str.survey.resolution_up.replace("__pixels__", "2560x1440 (WQHD)") + "</span>"; break;
                case "4k": html += "<span style='color: #8BC53F;'>" + Localization.str.survey.resolution_up.replace("__pixels__", "3840x2160 (4K)") + "</span>"; break;
            }

            html += "<br><b>" + Localization.str.survey.graphics_settings + "</b>: ";
            if (survey["gs"]) {
                html += "<span style='color: #8BC53F;'>" + Localization.str.survey.gs_y + "</span></p>";
            } else {
                html += "<span style='color: #8f0e10;'>" + Localization.str.survey.gs_n + "</span></p>";
            }

            if (survey["nvidia"] !== undefined || survey["amd"] !== undefined || survey["intel"] !== undefined || survey["other"] !== undefined) {
                html += "<p><b>" + Localization.str.survey.satisfaction + "</b>:";
                html += "<div class='performance-graph'>";
                if (survey["nvidia"] !== undefined) {
                    if (survey["nvidia"] > 90 || survey["nvidia"] < 10) {
                        html += "<div class='row'><div class='left-bar nvidia' style='width: " + parseInt(survey["nvidia"]).toString() + "%;'><span>Nvidia&nbsp;" + survey["nvidia"] + "%</span></div><div class='right-bar' style='width: " + parseInt(100-survey["nvidia"]) + "%;'></div></div>";
                    } else {
                        html += "<div class='row'><div class='left-bar nvidia' style='width: " + parseInt(survey["nvidia"]).toString() + "%;'><span>Nvidia</span></div><div class='right-bar' style='width: " + parseInt(100-survey["nvidia"]) + "%;'><span>" + survey["nvidia"] + "%</span></div></div>";
                    }
                }
                if (survey["amd"] !== undefined) {
                    if (survey["amd"] > 90 || survey["amd"] < 10) {
                        html += "<div class='row'><div class='left-bar amd' style='width: " + parseInt(survey["amd"]).toString() + "%;'><span>AMD&nbsp;" + survey["amd"] + "%</span></div><div class='right-bar' style='width: " + parseInt(100-survey["amd"]) + "%'></div></div>";
                    } else {
                        html += "<div class='row'><div class='left-bar amd' style='width: " + parseInt(survey["amd"]).toString() + "%;'><span>AMD</span></div><div class='right-bar' style='width: " + parseInt(100-survey["amd"]) + "%'><span>" + survey["amd"] + "%</span></div></div>";
                    }
                }
                if (survey["intel"] !== undefined) {
                    if (survey["intel"] > 90 || survey["intel"] < 10) {
                        html += "<div class='row'><div class='left-bar intel' style='width: " + parseInt(survey["intel"]).toString() + "%;'><span>Intel&nbsp;" + survey["intel"] + "%</span></div><div class='right-bar' style='width: " + parseInt(100-survey["intel"]) + "%'></div></div>";
                    } else {
                        html += "<div class='row'><div class='left-bar intel' style='width: " + parseInt(survey["intel"]).toString() + "%;'><span>Intel</span></div><div class='right-bar' style='width: " + parseInt(100-survey["intel"]) + "%'><span>" + survey["intel"] + "%</span></div></div>";
                    }
                }
                if (survey["other"] !== undefined) {
                    if (survey["other"] > 90 || survey["other"] < 10) {
                        html += "<div class='row'><div class='left-bar other' style='width: " + parseInt(survey["other"]).toString() + "%;'><span>Other&nbsp;" + survey["other"] + "%</span></div><div class='right-bar' style='width: " + parseInt(100-survey["other"]) + "%'></div></div>";
                    } else {
                        html += "<div class='row'><div class='left-bar other' style='width: " + parseInt(survey["other"]).toString() + "%;'><span>Other</span></div><div class='right-bar' style='width: " + parseInt(100-survey["other"]) + "%'><span>" + survey["other"] + "%</span></div></div>";
                    }
                }
                html += "</div>";
            }
        } else {
            html += "<p>" + Localization.str.survey.nobody + "</p>";
        }

        if (document.querySelector(".game_area_already_owned") && document.querySelector(".hours_played")) {
            // FIXME html += "<a class='btnv6_blue_blue_innerfade btn_medium es_btn_systemreqs' href='//enhancedsteam.com/survey/?appid=" + appid + "'><span>" + Localization.str.survey.take + "</span></a>";
        }

        html += "</div>";

        HTML.beforeBegin(document.querySelector(".sys_req").parentNode, html);
    }

    addStats() {
        let that = this;
        if (this.isDlc()) { return Promise.resolve(); }
        return this.data.then(result => {

            that.addSteamChart(result);
            that.addSteamSpy(result);
            that.addSurveyData(result);

        });
    }

    addDlcCheckboxes() {
        let dlcs = document.querySelectorAll(".game_area_dlc_row");
        if (dlcs.length === 0) { return; }
        let expandedNode = document.querySelector("#game_area_dlc_expanded");

        if (expandedNode) {
            HTML.afterEnd(expandedNode, `<div class='game_purchase_action game_purchase_action_bg' style='float: left; margin-top: 4px; margin-bottom: 10px; display: none;' id='es_selected_btn'><div class='btn_addtocart'><a class='btnv6_green_white_innerfade btn_medium'><span>${Localization.str.add_selected_dlc_to_cart}</span></a></div></div>`);
            HTML.afterEnd(".game_area_dlc_section", "<div style='clear: both;'></div>");
        } else {
            HTML.afterEnd(".gameDlcBlocks", `<div class='game_purchase_action game_purchase_action_bg' style='float: left; margin-top: 4px; display: none;' id='es_selected_btn'><div class='btn_addtocart'><a class='btnv6_green_white_innerfade btn_medium'><span>${Localization.str.add_selected_dlc_to_cart}</span></a></div></div>`);
        }

        let form = document.createElement("form");
        form.setAttribute("name", "add_selected_dlc_to_cart");
        form.setAttribute("action", "/cart/");
        form.setAttribute("method", "POST");
        form.setAttribute("id", "es_selected_cart");

        let button = document.querySelector("#es_selected_btn");
        button.insertAdjacentElement("beforebegin", form);
        button.addEventListener("click", function() {
            document.querySelector("form[name=add_selected_dlc_to_cart]").submit();
        });

        for (let dlc of dlcs) {
            if (dlc.querySelector("input")) {
                let value = dlc.querySelector("input").value;

                HTML.afterBegin(
                    dlc.querySelector(".game_area_dlc_name"),
                    `<input type='checkbox' class='es_dlc_selection' style='cursor: default;' id='es_select_dlc_${value}' value='${value}'><label for='es_select_dlc_${value}' style='background-image: url(${ExtensionResources.getURL("img/check_sheet.png")})'></label>`);
            } else {
                dlc.querySelector(".game_area_dlc_name").style.marginLeft = "23px";
            }
        }

        HTML.afterEnd(".game_area_dlc_section .gradientbg", "<div style='height: 28px; padding-left: 15px; display: none;' id='es_dlc_option_panel'></div>");

        HTML.afterBegin("#es_dlc_option_panel",
            `<div class='es_dlc_option' id='unowned_dlc_check'>${Localization.str.dlc_select.unowned_dlc}</div>
             <div class='es_dlc_option' id='wl_dlc_check'>${Localization.str.dlc_select.wishlisted_dlc}</div>
             <div class='es_dlc_option' id='no_dlc_check'>${Localization.str.dlc_select.none}</div>`);

        let change = new Event("change", {"bubbles": true});

        document.querySelector("#unowned_dlc_check").addEventListener("click", function() {
            let nodes = document.querySelectorAll(".game_area_dlc_section .game_area_dlc_row:not(.ds_owned) input:not(:checked)");
            for (let node of nodes) {
                node.checked = true;
                node.dispatchEvent(change);
            }
        });

        document.querySelector("#wl_dlc_check").addEventListener("click", function() {
            let nodes = document.querySelectorAll(".game_area_dlc_section .ds_wishlist input:not(:checked)");
            for (let node of nodes) {
                node.checked = true;
                node.dispatchEvent(change);
            }
        });

        document.querySelector("#no_dlc_check").addEventListener("click", function() {
            let nodes = document.querySelectorAll(".game_area_dlc_section .game_area_dlc_row input:checked");
            for (let node of nodes) {
                node.checked = false;
                node.dispatchEvent(change);
            }
        });

        HTML.beforeEnd(".game_area_dlc_section .gradientbg",
            `<a id='es_dlc_option_button'>${Localization.str.dlc_select.select} ▼</a>`);

        document.querySelector("#es_dlc_option_button").addEventListener("click", function() {
            document.querySelector("#es_dlc_option_panel")
                .classList.toggle("esi-shown");

            let button = document.querySelector("#es_dlc_option_button");

            button.textContent = (button.textContent.match("▼")
                ? `${Localization.str.dlc_select.select} ▲`
                : `${Localization.str.dlc_select.select} ▼`);
        });

        document.querySelector(".game_area_dlc_section").addEventListener("change", function(e) {
            if (!e.target.classList.contains("es_dlc_selection")) { return; }

            let cartNode = document.querySelector("#es_selected_cart");
            cartNode.innerHTML = "";

            let inputAction = document.createElement("input");
            inputAction.type = "hidden";
            inputAction.name = "action";
            inputAction.value = "add_to_cart";

            let inputSessionId = document.createElement("input");
            inputSessionId.type = "hidden";
            inputSessionId.name = "sessionid";
            inputSessionId.value = User.getSessionId();

            cartNode.appendChild(inputAction);
            cartNode.appendChild(inputSessionId);

            let nodes = document.querySelectorAll(".es_dlc_selection:checked");
            for (let node of nodes) {

                let inputSubId = document.createElement("input");
                inputSubId.setAttribute("type", "hidden");
                inputSubId.setAttribute("name", "subid[]");
                inputSubId.setAttribute("value", node.value);

                cartNode.insertAdjacentElement("beforeend", inputSubId);
            }

            let button = document.querySelector("#es_selected_btn");
            button.style.display = (nodes.length > 0 ? "block" : "none");
        })
    }

    addBadgeProgress() {
        if (!this.hasCards || !User.isSignedIn || !SyncedStorage.get("show_badge_progress")) { return; }

        let stylesheet = document.createElement('link');
        stylesheet.rel = 'stylesheet';
        stylesheet.type = 'text/css';
        stylesheet.href = '//steamcommunity-a.akamaihd.net/public/css/skin_1/badges.css';
        document.head.appendChild(stylesheet);

        HTML.afterEnd("#category_block",
            `<div id="es_badge_progress" class="block responsive_apppage_details_right heading">
                ${Localization.str.badge_progress}
            </div>
            <div id="es_badge_progress_content" class="block responsive_apppage_details_right">
                <div class="block_content_inner es_badges_progress_block" style="display:none;">
                    <div class="es_normal_badge_progress es_progress_block" style="display:none;"></div>
                    <div class="es_foil_badge_progress es_progress_block" style="display:none;"></div>
                </div>
            </div>`);

        let appid = this.communityAppid;

        Background.action("cards", appid)
            .then(result => loadBadgeContent(".es_normal_badge_progress", result));
        Background.action("cards", appid, true)
            .then(result => loadBadgeContent(".es_foil_badge_progress", result));

        function loadBadgeContent(targetSelector, result) {
            let dummy = HTMLParser.htmlToDOM(result);

            // grap badge and game cards
            // when there is no badge (e.g. dlc), badge_gamecard_page class won't appear
            let badge = dummy.querySelector(".badge_gamecard_page");
            if (badge) {
                displayBadgeInfo(targetSelector, badge);
            } else {
                if (document.getElementById("es_badge_progress")) {
                    document.getElementById("es_badge_progress").remove();
                    document.getElementById("es_badge_progress_content").remove();
                }
            }
        }

        function displayBadgeInfo(targetSelector, badgeNode) {
            let blockSel = document.querySelector(targetSelector);

            // show Steam badge info card
            let badge = badgeNode.querySelector(".badge_current");
            blockSel.append(badge);

            // count card
            let card_num_owned = badgeNode.querySelectorAll(".badge_detail_tasks .owned").length;
            let card_num_total = badgeNode.querySelectorAll(".badge_detail_tasks .badge_card_set_card").length;
            // check if badge is completed
            let progress;
            let progress_text_length = (progress = badgeNode.querySelector(".gamecard_badge_progress")) ? progress.textContent.trim().length : 0;
            let next_level_empty_badge = badgeNode.querySelectorAll(".gamecard_badge_progress .badge_info").length;
            let badge_completed = (progress_text_length > 0 && next_level_empty_badge === 0);

            let show_card_num = (card_num_owned > 0 && !badge_completed);
            let is_normal_badge = targetSelector === ".es_normal_badge_progress";

            if (is_normal_badge || (card_num_owned > 0 || !blockSel.querySelector(".badge_empty_circle"))) {
                document.querySelector(".es_badges_progress_block").style.display = "block";
                blockSel.style.display = "block";

                let progressBold = badgeNode.querySelector(".progress_info_bold");

                HTML.beforeEnd(blockSel,
                    `<div class="es_cards_numbers">
                        <div class="es_cards_remaining">${progressBold ? progressBold.textContent : ""}</div>
                    </div>
                    <div class="game_area_details_specs">
                        <div class="icon"><img src="//store.steampowered.com/public/images/v6/ico/ico_cards.png" class="category_icon"></div>
                        <a href="//steamcommunity.com/my/gamecards/${appid}${is_normal_badge ? '/' : '?border=1'}" class="name">${badge_completed ? Localization.str.view_badge : Localization.str.view_badge_progress}</a>
                    </div>`);

                if (show_card_num) {
                    HTML.beforeEnd(blockSel.querySelector(".es_cards_numbers"),
                        `<div class="es_cards_owned">${Localization.str.cards_owned.replace("__owned__", card_num_owned).replace("__possible__", card_num_total)}</div>`);
                }

                let last = blockSel.querySelector(".badge_empty_right div:last-child");
                if (last) {
                    last.classList.add("badge_empty_name");
                    last.style = "";
                    last.textContent = Localization.str.badge_not_unlocked;
                }
            }
        }
    }

    addAstatsLink() {
        if (!this.hasAchievements() || !SyncedStorage.get("showastatslink")) { return; }

        let imgUrl = ExtensionResources.getURL("img/ico/astatsnl.png");
        let url = `https://astats.astats.nl/astats/Steam_Game_Info.php?AppID=${this.communityAppid}`;

        HTML.beforeEnd("#achievement_block",
            `<div class="game_area_details_specs">
                <div class="icon"><img class="astats_icon" src="${imgUrl}"></div>
                <a class="name" href="${url}" target="_blank">${Localization.str.view_astats}</a>
            </div>`);
    }

    addAchievementCompletionBar() {
        if (!this.isOwned() || !this.hasAchievements() || !SyncedStorage.get("showachinstore")) { return; }

        let details_block = document.querySelector(".myactivity_block .details_block");
        if (!details_block) { return; }

        HTML.afterEnd(details_block, '<div id="es_ach_stats"></div>');

        Stats.getAchievementBar("/my", this.communityAppid).then(achieveBar => {
            if (!achieveBar) {
                console.warn("Failed to find achievement stats for appid", this.communityAppid);
                return;
            }
            
            HTML.inner("#es_ach_stats", achieveBar);
        });
    }

    customizeAppPage() {
        let nodes = document.querySelectorAll(".purchase_area_spacer");
        HTML.beforeEnd(nodes[nodes.length-1],
            `<div id="es_customize_btn" class="home_actions_ctn">
                <div class="home_btn home_customize_btn" style="z-index: 13;">${Localization.str.customize}</div>
                <div class='home_viewsettings_popup'>
                    <div class="home_viewsettings_instructions" style="font-size: 12px;">${Localization.str.apppage_sections}</div>
                </div>
            </div>
            <div style="clear: both;"></div>`);

        document.querySelector("#es_customize_btn").addEventListener("click", function(e) {
            e.target.classList.toggle("active");
        });

        document.querySelector("body").addEventListener("click", function(e){
            if (e.target.closest("#es_customize_btn")) { return; }
            let node = document.querySelector("#es_customize_btn .home_customize_btn.active");
            if (!node) { return; }
            node.classList.remove("active");
        });

        for (let sel of ['#game_area_description', '#game_area_content_descriptors', '.sys_req', '#game_area_legal']) {
            let el = document.querySelector(sel);
            if (!el) { continue; }
            let parent = el.closest('.game_page_autocollapse_ctn');
            if (!parent) { continue; }
            parent.setAttribute('data-parent-of', sel);
        }

        let workshop = document.querySelector("[href^='https://steamcommunity.com/workshop/browse']");
        let greenlight = document.querySelector("[href^='https://steamcommunity.com/greenlight']");

        let customizer = new Customizer("customize_apppage");
        customizer
            .add("recommendedbycurators", ".steam_curators_block")
            .add("recentupdates", "#events_root", Localization.str.apppage_recentupdates)
            .add("reviews", "#game_area_reviews")
            .add("about", "[data-parent-of='#game_area_description']")
            .add("contentwarning", "[data-parent-of='#game_area_content_descriptors']")
            .add("steamchart", "#steam-charts")
            .add("surveys", "#performance_survey")
            .add("steamspy", "#steam-spy")
            .add("sysreq", "[data-parent-of='.sys_req']")
            .add("legal", "[data-parent-of='#game_area_legal']", Localization.str.apppage_legal)
            .add("moredlcfrombasegame", "#moredlcfrombasegame_block")
            .add("franchise", "#franchise_block", Localization.str.apppage_franchise)
            .add("morelikethis", "#recommended_block")
            .add("customerreviews", "#app_reviews_hash");

        if (workshop) customizer.add("workshop", workshop.closest(".game_page_autocollapse_ctn"), Localization.str.apppage_workshop);
        if (greenlight) customizer.add("greenlight", greenlight.closest(".game_page_autocollapse_ctn"), Localization.str.apppage_greenlight);

        customizer.build();
        document.querySelector(".purchase_area_spacer").style.height = "auto";
    }

    addReviewToggleButton() {
        let head = document.querySelector("#review_create h1");
        if (!head) { return; }
        HTML.beforeEnd(head, "<div style='float: right;'><a class='btnv6_lightblue_blue btn_mdium' id='es_review_toggle'><span>▲</span></a></div>");

        let reviewSectionNode = document.createElement("div");
        reviewSectionNode.setAttribute("id", "es_review_section");

        let nodes = document.querySelector("#review_container").querySelectorAll("p, .avatar_block, .content");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            reviewSectionNode.append(node);
        }

        head.insertAdjacentElement("afterend", reviewSectionNode);

        function toggleReviews(state) {
            if (typeof state == 'undefined') {
                state = !LocalStorage.get("show_review_section", true);
                LocalStorage.set("show_review_section", state);
            }
            if (state) {
                document.querySelector("#es_review_toggle span").textContent = "▲";
                document.querySelector("#es_review_section").style.maxHeight = null;
            } else {
                document.querySelector("#es_review_toggle span").textContent = "▼";
                document.querySelector("#es_review_section").style.maxHeight = 0;
            }
        }

        let showReviews = LocalStorage.get("show_review_section", true);
        toggleReviews(showReviews);

        let node = document.querySelector("#review_create");
        if (node) {
            node.addEventListener("click", function(e) {
                if (!e.target.closest("#es_review_toggle")) { return; }
                toggleReviews();
            });
        }
    }

    addHelpButton() {
        let node = document.querySelector(".game_area_play_stats .already_owned_actions");
        if (!node) { return; }
        HTML.afterEnd(node,
            "<div class='game_area_already_owned_btn'><a class='btnv6_lightblue_blue btnv6_border_2px btn_medium' href='https://help.steampowered.com/wizard/HelpWithGame/?appid=" + this.appid + "'><span>" + Localization.str.get_help + "</span></a></div>");
    }

    addPackBreakdown() {

        function splitPack(node, ways) {
            let price_text = node.querySelector(".game_purchase_price, .discount_final_price").textContent;
            if (price_text.match(/,\d\d(?!\d)/)) {
                price_text = price_text.replace(",", ".");
            }
            let price = (Number(price_text.replace(/[^0-9\.]+/g, ""))) / ways;
            price = new Price(Math.ceil(price * 100) / 100, Currency.storeCurrency);

            HTML.afterBegin(node.querySelector(".game_purchase_action_bg"),
                `<div class="es_each_box">
                    <div class="es_each_price">${price}</div>
                    <div class="es_each">${Localization.str.each}</div>
                </div>`);
        }

        for (let node of document.querySelectorAll(".game_area_purchase_game_wrapper")) {

            // prevent false positives on packages e.g. Doom 3
            if (node.querySelector(".btn_packageinfo")) { continue; }

            let title = node.querySelector("h1").textContent;
            title = title.toLowerCase().replace(/-/g, ' ');

            let text = "";
            if (node.querySelector("p")) {
                text = node.querySelector("p").textContent;
            }

            if (title.includes("2 pack") ||
                title.includes("two pack") ||
                title.includes("tower wars friend pack") ||
                text.includes("gift copy") ||
                text.includes("extra copy")) { splitPack(node, 2); }

            else if (title.includes("3 pack") ||
                title.includes("three pack") ||
                title.includes("tower wars team pack")) { splitPack(node, 3); }

            else if (title.includes("4 pack") ||
                title.includes("four pack") ||
                title.includes("clan pack")) { splitPack(node, 4); }

            else if (title.includes("5 pack") ||
                title.includes("five pack")) { splitPack(node, 5); }

            else if (title.includes("6 pack") ||
                title.includes("six pack")) { splitPack(node, 6); }
        }
    }
}


let RegisterKeyPageClass = (function(){

    function RegisterKeyPageClass() {
        this.activateMultipleKeys();
    }

    RegisterKeyPageClass.prototype.activateMultipleKeys = function() {
        let activateModalTemplate = `<div id="es_activate_modal">
                <div id="es_activate_modal_content">
                    <div class="newmodal_prompt_with_textarea gray_bevel fullwidth" id="es_activate_input_text">
                        <textarea name="es_key_input" id="es_key_input" rows="24" cols="12" maxlength="1080">__alreadyentered__</textarea>
                    </div>
                    <div class="es_activate_buttons" style="float: right">
                        <div class="btn_green_white_innerfade btn_medium es_activate_modal_submit">
                            <span>${Localization.str.activate_products}</span>
                        </div>
                        <div class="es_activate_modal_close btn_grey_white_innerfade btn_medium">
                            <span>${Localization.str.cancel}</span>
                        </div>
                    </div>
                </div>
            </div>`;

        document.querySelector("#register_btn").addEventListener("click", function(e) {
            if (document.querySelector("#product_key").value.indexOf(",") > 0) {
                e.preventDefault();
                ExtensionLayer.runInPageContext(`() => ShowDialog("${Localization.str.activate_multiple_header}", \`${activateModalTemplate.replace("__alreadyentered__", document.querySelector("#product_key").value.replace(/\,/g, "\n"))}\`)`);
            }
        });

        // Show note input modal
        document.addEventListener("click", function(e){
            if (!e.target.closest("#es_activate_multiple")) { return; }
            ExtensionLayer.runInPageContext(`() => ShowDialog("${Localization.str.activate_multiple_header}", \`${activateModalTemplate.replace("__alreadyentered__", document.querySelector("#product_key").value.replace(/\,/g, "\n"))}\`)`);
        });

        // Insert the "activate multiple products" button
        HTML.beforeBegin("#registerkey_examples_text",
            "<a class='btnv6_blue_hoverfade btn_medium' id='es_activate_multiple' style='margin-bottom: 15px;'><span>" + Localization.str.activate_multiple + "</span></a><div style='clear: both;'></div>");

        // Process activation

        document.addEventListener("click", function(e) {
            if (!e.target.closest(".es_activate_modal_submit")) { return; }

            document.querySelector(".es_activate_modal_submit").style.display = "none";
            document.querySelector(".es_activate_modal_close").style.display = "none";

            let keys = [];

            // turn textbox into table to display results
            let lines = document.querySelector("#es_key_input").value.split("\n");
            let node = document.querySelector("#es_activate_input_text");
            HTML.beforeBegin(node, "<div id='es_activate_results'></div>");
            node.style.display = "none";

            lines.forEach(line => {
                let attempt = String(line);
                if (attempt === "") { // skip blank rows in the input dialog (including trailing newline)
                    return;
                }
                keys.push(attempt);

                let url = ExtensionResources.getURL("img/questionmark.png");

                HTML.beforeEnd("#es_activate_results",
                    "<div style='margin-bottom: 8px;'><span id='attempt_" + attempt + "_icon'><img src='" + url + "' style='padding-right: 10px; height: 16px;'></span>" + attempt + "</div><div id='attempt_" + attempt + "_result' style='margin-left: 26px; margin-bottom: 10px; margin-top: -5px;'></div>");
            });

            // force recalculation of the modal's position so it doesn't extend off the bottom of the page
            setTimeout(function(){
                window.dispatchEvent(new Event("resize"));
            }, 250);

            // attempt to activate each key in sequence
            let promises = [];

            for (let i = 0; i < keys.length; i++) {
                let current_key = keys[i];

                let formData = new FormData();
                formData.append("sessionid", User.getSessionId());
                formData.append("product_key", current_key);

                let request = RequestData.post("https://store.steampowered.com/account/ajaxregisterkey", formData).then(data => {
                    data = JSON.parse(data);
                    let attempted = current_key;
                    let message = Localization.str.register.default;
                    if (data["success"] === 1) {
                        document.querySelector("#attempt_" + attempted + "_icon img").setAttribute("src", ExtensionResources.getURL("img/sr/okay.png"));
                        if (data["purchase_receipt_info"]["line_items"].length > 0) {
                            document.querySelector("#attempt_" + attempted + "_result").textContent = Localization.str.register.success.replace("__gamename__", data["purchase_receipt_info"]["line_items"][0]["line_item_description"]);
                            document.querySelector("#attempt_" + attempted + "_result").style.display = "block";
                        }
                    } else {
                        switch(data["purchase_result_details"]) {
                            case 9: message = Localization.str.register.owned; break;
                            case 13: message = Localization.str.register.notavail; break;
                            case 14: message = Localization.str.register.invalid; break;
                            case 15: message = Localization.str.register.already; break;
                            case 24: message = Localization.str.register.dlc; break;
                            case 50: message = Localization.str.register.wallet; break;
                            case 53: message = Localization.str.register.toomany; break;
                        }
                        document.querySelector("#attempt_" + attempted + "_icon img").setAttribute("src", ExtensionResources.getURL("img/sr/banned.png"));
                        document.querySelector("#attempt_" + attempted + "_result").textContent = message;
                        document.querySelector("#attempt_" + attempted + "_result").style.display="block";
                    }

                }, () => {
                    let attempted = current_key;
                    document.querySelector("#attempt_" + attempted + "_icon img").setAttribute("src", ExtensionResources.getURL("img/sr/banned.png"));
                    document.querySelector("#attempt_" + attempted + "_result").textContent = Localization.str.error;
                    document.querySelector("#attempt_" + attempted + "_result").style.display = "block";
                });

                promises.push(request);
            }

            Promise.all(promises).then(result => {
                document.querySelector(".es_activate_modal_close span").textContent = Localization.str.close;
                document.querySelector(".es_activate_modal_close").style.display = "block";
                window.dispatchEvent(new Event("resize"));
            });
        });

        // Bind the "Cancel" button to close the modal
        document.addEventListener("click", function(e) {
            if (!e.target.closest(".es_activate_modal_close")) { return; }
            ExtensionLayer.runInPageContext(() => CModal.DismissActiveModal());
        })
    };

    return RegisterKeyPageClass;
})();


let AccountPageClass = (function(){

    function AccountPageClass() {
        this.accountTotalSpent();
    }

    AccountPageClass.prototype.accountTotalSpent = function() {

        let links = document.querySelectorAll(".account_setting_block:nth-child(2) .account_setting_sub_block:nth-child(2) .account_manage_link");
        if (links.length < 1) return;

        let lastLink = links[links.length-1];
        HTML.afterEnd(lastLink.parentNode,
            `<div><a class='account_manage_link' href='https://help.steampowered.com/accountdata/AccountSpend'>${Localization.str.external_funds}</a></div>`);
    };

    return AccountPageClass;
})();


let FundsPageClass = (function(){

    function FundsPageClass() {
        this.addCustomMoneyAmount();
    }

    FundsPageClass.prototype.addCustomMoneyAmount = async function() {
        let giftcard = document.querySelector(".giftcard_amounts");

        let newel = document.querySelector(giftcard ? ".giftcard_selection" : ".addfunds_area_purchase_game").cloneNode(true);
        let priceel = newel.querySelector((giftcard ? ".giftcard_text" : ".price"));
        let price = priceel.textContent.trim();

        newel.classList.add("es_custom_money");
        if(!giftcard) {
            newel.querySelector(".btnv6_green_white_innerfade").classList.add("es_custom_button");
            newel.querySelector(".btnv6_green_white_innerfade").removeAttribute("onclick");
            newel.querySelector("h1").textContent = Localization.str.wallet.custom_amount;
            newel.querySelector("p").textContent = Localization.str.wallet.custom_amount_text.replace("__minamount__", price);
        } else {
            HTML.inner(
                newel.querySelector(".giftcard_style"),
                Localization.str.wallet.custom_giftcard_amount
                    .replace("__minamount__", price)
                    .replace("__input__", "<span id='es_custom_money_amount_wrapper'></span>")
            );
        }

        let currency = await Price.parseFromString(price, Currency.storeCurrency);

        let inputel = newel.querySelector((giftcard ? "#es_custom_money_amount_wrapper" : ".price"));
        HTML.inner(inputel, "<input type='number' id='es_custom_money_amount' class='es_text_input money' min='" + currency.value + "' step='.01' value='" + currency.value +"'>");
        // TODO currency symbol

        document.querySelector((giftcard ? ".giftcard_selection" : ".addfunds_area_purchase_game"))
            .insertAdjacentElement("afterend", newel);

        document.querySelector("#es_custom_money_amount").addEventListener("input", function() {
            let value = document.querySelector("#es_custom_money_amount").value;

            if(!isNaN(value) && value != "") {
                currency = new Price(value, Currency.storeCurrency);

                if(giftcard) {
                    priceel.classList.toggle("small", value > 10);
                    priceel.textContent = currency;
                }
            }
        });

        newel.querySelector((giftcard ? ".es_custom_money a.btn_medium" : ".es_custom_button")).addEventListener("click", function(e) {
            e.preventDefault();

            let jsvalue = (+document.querySelector("#es_custom_money_amount").value).toFixed(2).replace(/[,.]/g, '');

            if (giftcard) {

                if (e.target.closest(".giftcard_cont")) {
                    ExtensionLayer.runInPageContext(`() => submitSelectGiftCard(${jsvalue})`);
                }

            } else {
                let btn = document.querySelector(".es_custom_money .es_custom_button");
                btn.href = "#";
                btn.removeAttribute("onclick");
                btn.dataset.amount = jsvalue;

                ExtensionLayer.runInPageContext(() => submitAddFunds(document.querySelector(".es_custom_money .es_custom_button")));
            }

        }, true);

        let giftcardMoneyNode = document.querySelector(".giftcard_selection #es_custom_money_amount");
        if (giftcardMoneyNode) {
            giftcardMoneyNode.addEventListener("click", function(e) {
                e.preventDefault();
            });
        }
    };

    return FundsPageClass;
})();


let SearchPageClass = (function(){

    function SearchPageClass() {
        this.endlessScrolling();
        this.addExcludeTagsToSearch();
        this.addHideButtonsToSearch().then(() => this.observeChanges());
    }

    let processing = false;
    let searchPage = 2;

    function loadSearchResults () {
        if (processing) { return; }
        processing = true;

        let search = document.URL.match(/(.+)\/(.+)/)[2].replace(/\&page=./, "").replace(/\#/g, "&");
        if (!document.querySelector(".LoadingWrapper")) {
            let nodes = document.querySelectorAll(".search_pagination");

            HTML.beforeBegin(nodes[nodes.length-1], '<div class="LoadingWrapper"><div class="LoadingThrobber" style="margin-bottom: 15px;"><div class="Bar Bar1"></div><div class="Bar Bar2"></div><div class="Bar Bar3"></div></div><div id="LoadingText">' + Localization.str.loading + '</div></div>');
        }

        if (search.substring(0,1) === "&") { search = "?" + search.substring(1, search.length); }
        if (search.substring(0,1) !== "?") { search = "?" + search; }

        RequestData.getHttp(`https://store.steampowered.com/search/results${search}&page=${searchPage}&snr=es`).then(result => {
            let dummy = HTMLParser.htmlToDOM(result);

            let addedDate = Date.now();
            document.querySelector('#search_result_container').dataset.lastAddDate = addedDate;

            let lastNode = document.querySelector(".search_result_row:last-child");

            // When you're not logged in, the constructed hover doesn't include friends info
            let publicAttr = User.isSignedIn ? '' : `,"public":1`;

            let rows = dummy.querySelectorAll("a.search_result_row");
            for (let row of rows) {
                row.dataset.addedDate = addedDate;
                lastNode.insertAdjacentElement("afterend", row);
                lastNode = row;

                // Construct the hover that was just sanitized out of row
                let subtype = "app";
                let subid = parseInt(lastNode.dataset.dsAppid, 10);
                if (lastNode.dataset.dsPackageid) {
                    // this is a sub, not an app
                    subtype = "sub";
                    subid = parseInt(lastNode.dataset.dsPackageid, 10);
                }
                lastNode.setAttribute('onmouseover', `GameHover( this, event, 'global_hover', {"type":"${subtype}","id":${subid}${publicAttr},"v6":1} );`);
                lastNode.setAttribute('onmouseout', `HideGameHover( this, event, 'global_hover' )`);
            }

            document.querySelector(".LoadingWrapper").remove();

            searchPage = searchPage + 1;
            processing = false;

            ExtensionLayer.runInPageContext(() => {
                let addedDate = document.querySelector('#search_result_container').dataset.lastAddDate;
                GDynamicStore.DecorateDynamicItems(jQuery(`.search_result_row[data-added-date="${addedDate}"]`));
                SetupTooltips( { tooltipCSSClass: 'store_tooltip'} );
            });

            Highlights.highlightAndTag(rows);
        }, () => {
            document.querySelector(".LoadingWrapper").remove();
            HTML.beforeBegin(".search_pagination:last-child",
                "<div style='text-align: center; margin-top: 16px;' id='es_error_msg'>" + Localization.str.search_error + " <a id='es_retry' style='cursor: pointer;'>" + Localization.str.search_error_retry + "</a></div>");

            document.querySelector("es_retry").addEventListener("click", function(e) {
                processing = false;
                document.querySelector("#es_error_msg").remove();
                loadSearchResults();
            });
        });
    }

    SearchPageClass.prototype.endlessScrolling = function() {
        if (!SyncedStorage.get("contscroll")) { return; }

        // Required for the loading wrapper
        DOMHelper.insertHomeCSS();

        let result_count;
        document.querySelector(".search_pagination_right").style.display = "none";

        let match = document.querySelector(".search_pagination_left").textContent.trim().match(/(\d+)(?:\D+(\d+)\D+(\d+))?/);
        if (match) {
            result_count = match[2] ? Math.max.apply(Math, match.slice(1, 4)) : match[1];
            document.querySelector(".search_pagination_left").textContent = Localization.str.results.replace("__num__", result_count);
        }

        searchPage = 2;

        window.addEventListener("scroll", function () {
            // if the pagination element is in the viewport, continue loading
            if (Viewport.isElementInViewport(document.querySelector(".search_pagination_left"))) {
                if (result_count > document.querySelectorAll(".search_result_row").length) {
                    loadSearchResults();
                } else {
                    document.querySelector(".search_pagination_left").textContent = Localization.str.all_results.replace("__num__", result_count);
                }
            }
        });
    };

    SearchPageClass.prototype.addExcludeTagsToSearch = function() {
        let tarFilterDivs = document.querySelectorAll('#TagFilter_Container')[0].children;

        HTML.afterEnd(document.querySelector("#TagFilter_Container").parentNode.parentNode,
            `<div class='block' id='es_tagfilter_exclude'>
                <div class='block_header'>
                    <div>${Localization.str.exclude_tags}</div>
                 </div>
                 <div class='block_content block_content_inner'>
                    <div style='max-height: 150px; overflow: hidden;' id='es_tagfilter_exclude_container'></div>
                    <input type="text" id="es_tagfilter_exclude_suggest" class="es_input">
                </div>
            </div>`);

        let excludeContainer = document.querySelector("#es_tagfilter_exclude_container");

        //tag numbers from the URL are already in the element with id #tags
        function getTags() {
            let tagsValue = decodeURIComponent(document.querySelector("#tags").value);
            return tagsValue ? tagsValue.split(',') : [];
        }

        let tags = getTags();

        for (let val of tarFilterDivs) {
            let item_checked = tags.indexOf(`-${val.dataset.value}`) > -1 ? "checked" : '';

            let excludeItem = HTMLParser.htmlToElement(
                `<div class="tab_filter_control ${item_checked}" data-param="tags" data-value="-${val.dataset.value}" data-loc="${val.dataset.loc}">
                    <div class="tab_filter_control_checkbox"></div>
                    <span class="tab_filter_control_label">${val.dataset.loc}</span>
                </div>`);

            excludeItem.addEventListener("click", e => {
                let control = e.target.closest(".tab_filter_control");

                let rgValues = getTags();
                let value = String(control.dataset.value);
                if (!control.classList.contains("checked")) {

                    if(!rgValues) {
                        rgValues = [value];
                    } else if (rgValues.indexOf(value) === -1) {
                        rgValues.push(value);
                    }

                } else {

                    if (rgValues.indexOf(value) !== -1) {
                        rgValues.splice(rgValues.indexOf(value), 1);
                    }
                }

                control.classList.toggle('checked');
                filtersChanged();
            });

            excludeContainer.append(excludeItem);
        }

        ExtensionLayer.runInPageContext(() =>
            $J("#es_tagfilter_exclude_container").tableFilter({ maxvisible: 15, control: "#es_tagfilter_exclude_suggest", dataattribute: "loc", defaultText: $J("#TagSuggest").attr("value")})
        );

        let observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation){
                if (!mutation["addedNodes"]) { return; }

                let addedNodes = mutation["addedNodes"];
                for (let i=0; i<addedNodes.length; i++) {
                    let node = addedNodes[i].parentNode;
                    if (node.classList.contains("tag_dynamic") && parseFloat(node.dataset['tag_value']) < 0) {
                        node.querySelector(".label").textContent = Localization.str.not.replace("__tag__", node.textContent);
                    }
                }
            });
        });
        observer.observe(document.querySelector(".termcontainer"), {childList:true, subtree:true});
        ExtensionLayer.runInPageContext(() => UpdateTags());
    };

    function isPriceAbove(node, priceAbove) {
        let priceValue = CurrencyRegistry.fromType(Currency.storeCurrency).valueOf(node.querySelector(".search_price").lastChild.textContent);
        
        if (!priceValue) { return false; } // App without price

        return Number(priceValue) > priceAbove;
    }

    function isReviewsBelow(node, reviewsBelow) {
        if (!node.querySelector(".search_review_summary")) {
            // App without reviews
            return true;
        }

        let reviewsString = node.querySelector(".search_review_summary").dataset.tooltipHtml
            .replace(/\d+%/g, "")
            .match(/\d+/g).join("");

        return Number(reviewsString) < reviewsBelow;
    }

    function isTagExcluded(node, tags) {
        if (!node.dataset.dsTagids) return false;
        let nodeTags = JSON.parse(node.dataset.dsTagids);
        return nodeTags.some(tag => tags.includes(tag));
    }

    function filtersChanged(nodes = document.querySelectorAll(".search_result_row")) {
        let hideOwned = document.querySelector("#es_owned_games.checked");
        let hideWishlisted = document.querySelector("#es_wishlist_games.checked");
        let hideInCart = document.querySelector("#es_cart_games.checked");
        let hideNotDiscounted = document.querySelector("#es_notdiscounted.checked");
        let hideNotInterested = document.querySelector("#es_notinterested.checked");
        let hideMixed = document.querySelector("#es_notmixed.checked");
        let hideNegative = document.querySelector("#es_notnegative.checked");
        let hidePriceAbove = document.querySelector("#es_notpriceabove.checked");
        let hideReviewsBelow = document.querySelector("#es_noreviewsbelow.checked");

        let priceAbove = CurrencyRegistry.fromType(Currency.storeCurrency).valueOf(document.querySelector("#es_notpriceabove_val").value);
        let reviewsBelow = Number(document.querySelector("#es_noreviewsbelow_val").value);
        let hideTags = Array.from(document.querySelectorAll("#es_tagfilter_exclude_container > .checked")).map(tag => Math.abs(Number(tag.dataset.value)));

        for (let node of nodes) {
            if (hideOwned && node.classList.contains("ds_owned")) { node.style.display = "none"; continue; }
            if (hideWishlisted && node.classList.contains("ds_wishlist")) { node.style.display = "none"; continue; }
            if (hideInCart && node.classList.contains("ds_incart")) { node.style.display = "none"; continue; }
            if (hideNotDiscounted && !node.querySelector(".search_discount span")) { node.style.display = "none"; continue; }
            if (hideNotInterested && node.classList.contains("ds_ignored")) { node.style.display = "none"; continue; }
            if (hideMixed && node.querySelector(".search_reviewscore span.search_review_summary.mixed")) { node.style.display = "none"; continue; }
            if (hideNegative && node.querySelector(".search_reviewscore span.search_review_summary.negative")) { node.style.display = "none"; continue; }
            if (hidePriceAbove && isPriceAbove(node, priceAbove)) { node.style.display = "none"; continue; }
            if (hideReviewsBelow && isReviewsBelow(node, reviewsBelow)) { node.style.display = "none"; continue; }
            if (hideTags.length && isTagExcluded(node, hideTags)) { node.style.display = "none"; continue; }
            node.style.display = "block";
        }
    }

    SearchPageClass.prototype.addHideButtonsToSearch = async function() {

        let currency = CurrencyRegistry.storeCurrency;
        let inputPattern = currency.regExp();
        let pricePlaceholder = currency.placeholder();

        await User;

        HTML.afterBegin("#advsearchform .rightcol",
            `<div class="block" id="es_hide_menu">
                <div class="block_header"><div>${Localization.str.hide}</div></div>
                <div class="block_content block_content_inner" id="es_hide_options">
                    ${User.isSignedIn ? `<div class="tab_filter_control" id="es_owned_games" data-param="es_hide" data-value="owned">
                        <div class="tab_filter_control_checkbox"></div>
                        <span class="tab_filter_control_label">${Localization.str.options.owned}</span>
                    </div>
                    <div class="tab_filter_control" id="es_wishlist_games" data-param="es_hide" data-value="wishlisted">
                        <div class="tab_filter_control_checkbox"></div>
                        <span class="tab_filter_control_label">${Localization.str.options.wishlist}</span>
                    </div>
                    <div class="tab_filter_control" id="es_notinterested" data-param="es_hide" data-value="ignored">
                        <div class="tab_filter_control_checkbox"></div>
                        <span class="tab_filter_control_label">${Localization.str.notinterested}</span>
                    </div>` : ""}
                    <div class="tab_filter_control" id="es_cart_games" data-param="es_hide" data-value="cart">
                        <div class="tab_filter_control_checkbox"></div>
                        <span class="tab_filter_control_label">${Localization.str.options.cart}</span>
                    </div>
                    <div class="tab_filter_control" id="es_notdiscounted" data-param="es_hide" data-value="not-discounted">
                        <div class="tab_filter_control_checkbox"></div>
                        <span class="tab_filter_control_label">${Localization.str.notdiscounted}</span>
                    </div>
                    <div class="tab_filter_control" id="es_notmixed" data-param="es_hide" data-value="mixed">
                        <div class="tab_filter_control_checkbox"></div>
                        <span class="tab_filter_control_label">${Localization.str.mixed_item}</span>
                    </div>
                    <div class="tab_filter_control" id="es_notnegative" data-param="es_hide" data-value="negative">
                        <div class="tab_filter_control_checkbox"></div>
                        <span class="tab_filter_control_label">${Localization.str.negative_item}</span>
                    </div>
                    <div class="tab_filter_control" id="es_notpriceabove" data-param="es_hide" data-value="price-above" title="${Localization.str.price_above_tooltip}">
                        <div class="tab_filter_control_checkbox"></div>
                        <span class="tab_filter_control_label">${Localization.str.price_above}</span>
                        <div>
                            <input type="text" id="es_notpriceabove_val" class="es_input" pattern="${inputPattern.source}" placeholder="${pricePlaceholder}">
                        </div>
                    </div>
                    <div class="tab_filter_control" id="es_noreviewsbelow" data-param="es_hide" data-value="reviews-below" title="${Localization.str.reviews_below_tooltip}">
                        <div class="tab_filter_control_checkbox"></div>
                        <span class="tab_filter_control_label">${Localization.str.reviews_below}</span>
                        <div>
                            <input type="number" id="es_noreviewsbelow_val" class="es_input" min="0" step="1">
                        </div>
                    </div>
                    <div>
                        <input type="hidden" id="es_hide" name="es_hide" value>
                    </div>
                </div>
            </div>
        `);

        Messenger.addMessageListener("filtersChanged", filtersChanged);

        Messenger.onMessage("priceAbove").then(priceVal => {
            if (new RegExp(inputPattern.source.replace(',', '\\.')).test(priceVal)) {
                if (currency.format.decimalSeparator === ',') {
                    priceVal = priceVal.replace('.', ',');
                }
                document.getElementById("es_notpriceabove_val").value = priceVal;
                Messenger.postMessage("priceValueChanged");
            } else {
                console.warn("Failed to validate price %s from URL params!", priceVal);
            }
        });
        Messenger.onMessage("reviewsBelow").then(reviewsVal => {
            document.getElementById("es_noreviewsbelow_val").value = reviewsVal;
            Messenger.postMessage("reviewsValueChanged");
        });

        // TODO(tomas.fedor) Can we somehow simplify this monstrosity? E.g. update URL on our end?
        // Thrown together from sources of searchpage.js
        ExtensionLayer.runInPageContext(`() => {

            GDynamicStore.OnReady(() => {

                // For each AS filter
                $J(".tab_filter_control[id^='es_']").each(function() {
                    let $Control = $J(this);
                    $Control.click(() => updateURL($Control));
                });

                function updateURL($Control, forcedState) {

                    let strParam = $Control.data("param");
                    let value = $Control.data("value");
                    let strValues = decodeURIComponent($J('#' + strParam).val());
                    value = String(value); // Javascript: Dynamic types except sometimes not.
                    if (!$Control.hasClass("checked")) {
                        let rgValues;
                        if(!strValues) {
                            if (typeof forcedState !== "undefined" && !forcedState) {
                                rgValues = [];
                            } else {
                                if (value === "price-above") {
                                    rgValues = [value + $J("#es_notpriceabove_val").val().replace(',', '.')];
                                } else if (value === "reviews-below") {
                                    rgValues = [value + $J("#es_noreviewsbelow_val").val()];
                                } else {
                                    rgValues = [value];
                                }
                            }
                        } else {
                            rgValues = strValues.split(',');

                            if (!(typeof forcedState !== "undefined" && !forcedState)) {
                                if (value === "price-above") {
                                    let found = false;
                                    for (let rgValue in rgValues) {
                                        if (rgValue.startsWith(value)) {
                                            found = true;
                                            break;
                                        }
                                    }
                                    if (!found) {
                                        rgValues.push(value + $J("#es_notpriceabove_val").val().replace(',', '.'));
                                    }
                                } else if (value === "reviews-below") {
                                    let found = false;
                                    for (let rgValue in rgValues) {
                                        if (rgValue.startsWith(value)) {
                                            found = true;
                                            break;
                                        }
                                    }
                                    if (!found) {
                                        rgValues.push(value + $J("#es_noreviewsbelow_val").val());
                                    }
                                } else {
                                    if ($J.inArray(value, rgValues) === -1) {
                                        rgValues.push(value)
                                    }
                                }
                            }
                            
                        }
    
                        $J('#' + strParam).val(rgValues.join(','));

                        if (typeof forcedState !== "undefined") {
                            if (forcedState) {
                                $Control.addClass("checked");
                            }
                        } else {
                            $Control.addClass("checked");
                        }
                    } else {
                        let rgValues = strValues.split(',');

                        if (value === "price-above") {
                            for (let i = 0; i < rgValues.length; ++i) {
                                if (rgValues[i].startsWith("price-above")) {
                                    if (typeof forcedState !== "undefined" && forcedState) {
                                        rgValues[i] = "price-above" + $J("#es_notpriceabove_val").val().replace(',', '.');
                                    } else {
                                        rgValues.splice(i, 1);
                                    }
                                    break;
                                }
                            }
                        } else if (value === "reviews-below") {
                            for (let i = 0; i < rgValues.length; ++i) {
                                if (rgValues[i].startsWith("reviews-below")) {
                                    if (typeof forcedState !== "undefined" && forcedState) {
                                        rgValues[i] = "reviews-below" + $J("#es_noreviewsbelow_val").val();
                                    } else {
                                        rgValues.splice(i, 1);
                                    }
                                    break;
                                }
                            }
                        } else {
                            if (!(typeof forcedState !== "undefined" && forcedState)) {
                                if (rgValues.indexOf(value) !== -1) {
                                    rgValues.splice(rgValues.indexOf(value), 1);
                                }
                            }
                        }

                        $J('#' + strParam).val(rgValues.join(','));

                        if (typeof forcedState !== "undefined") {
                            if (!forcedState) {
                                $Control.removeClass("checked");
                            }
                        } else {
                            $Control.removeClass("checked");
                        }
                    }

                    let rgParameters = GatherSearchParameters();

                    // remove snr for history purposes
                    delete rgParameters["snr"];
                    if (rgParameters["sort_by"] === "_ASC") {
                        delete rgParameters["sort_by"];
                    }
                    if (rgParameters["page"] === 1 || rgParameters["page"] === '1')
                        delete rgParameters["page"];

                    // don't want this on the url either
                    delete rgParameters["hide_filtered_results_warning"];

                    if (g_bUseHistoryAPI) {
                        history.pushState({ params: rgParameters}, '', '?' + Object.toQueryString(rgParameters));
                    } else {
                        window.location = '#' + Object.toQueryString(rgParameters);
                    }

                    $J(".tag_dynamic").remove();
                    $J("#termsnone").show();
                    let rgActiveTags = $J(".tab_filter_control.checked");

                    // Search term
                    let strTerm = $J("#realterm").val();
                    if(strTerm) {
                        AddSearchTag("term", strTerm, '"'+strTerm+'"', function(tag) { $J("#realterm").val(''); $J("#term").val(''); AjaxSearchResults(); return false; });
                        $J("#termsnone").hide();
                    }

                    // Publisher
                    let strPublisher = $J("#publisher").val();
                    if(strPublisher) {
                        AddSearchTag("publisher", strPublisher, "Publisher" + ": "+strPublisher, function(tag) { $J("#publisher").val(''); AjaxSearchResults(); return false; });
                        $J("#termsnone").hide();
                    }

                    // Developer
                    let strDeveloper = $J("#developer").val();
                    if(strDeveloper) {
                        AddSearchTag("publisher", strDeveloper, "Developer" + ": " + strDeveloper, function(tag) { $J("#developer").val(''); AjaxSearchResults(); return false; });
                        $J("#termsnone").hide();
                    }

                    rgActiveTags.each(function() {
                        let Tag = this;
                        let $Tag = $J(this);
                        let label;

                        if ($Tag.is("[id*='es_']")) {
                            label = "${Localization.str.hide_filter}".replace("__filter__", $J(".tab_filter_control_label", Tag).text());
                        } else {
                            label = $J(".tab_filter_control_label", Tag).text();
                        }
                        AddSearchTag($Tag.data("param"), $Tag.data("value"), label, function(tag) { return function() { tag.click(); return false; } }(Tag) );
                        if (!$Tag.is(":visible"))
                        {
                            $Tag.parent().prepend($Tag.show());
                            $Tag.trigger( "tablefilter_update" );
                        }
                        $J("#termsnone").hide();
                    });
                    Messenger.postMessage("filtersChanged");
                }
    
                for (let [key, value] of new URLSearchParams(window.location.search)) {
                    if (key === "es_hide") {
                        for (let filterValue of value.split(',')) {
                            let filter = $J(".tab_filter_control[data-value='" + filterValue + "']");
                            if (!filter.length) {
                                if (filterValue.startsWith("price-above")) {
                                    let priceValue = /price-above(.+)/.exec(filterValue)[1];
                                    if (!priceValue) {
                                        console.warn("Didn't set a value for the price filter!");
                                        continue;
                                    }
                                    filter = $J(".tab_filter_control[data-value=price-above]");
                                    Messenger.onMessage("priceValueChanged").then(filter.click);
                                    Messenger.postMessage("priceAbove", priceValue);
                                    continue;
                                } else if (filterValue.startsWith("reviews-below")) {
                                    let reviewsValue = /reviews-below(.+)/.exec(filterValue)[1];
                                    if (!reviewsValue) {
                                        console.warn("Didn't set a value for the reviews filter!");
                                        continue;
                                    }
                                    filter = $J(".tab_filter_control[data-value=reviews-below]");
                                    Messenger.onMessage("reviewsValueChanged").then(filter.click);
                                    Messenger.postMessage("reviewsBelow", reviewsValue);
                                    continue;
                                } else {
                                    console.warn("Invalid filter value %s", filterValue);
                                    continue;
                                }
                            }
                            filter.click();
                        }
                    }
                }

                Messenger.addMessageListener("priceChanged", forcedState => updateURL($J(".tab_filter_control[id='es_notpriceabove']"), forcedState));
                Messenger.addMessageListener("reviewsChanged", forcedState => updateURL($J(".tab_filter_control[id='es_noreviewsbelow']"), forcedState));
            });
        }`);

        let html = "<span id='es_notpriceabove_val_currency'>" + currency.format.symbol + "</span>";
        let priceAboveVal = document.querySelector("#es_notpriceabove_val");

        if (currency.format.postfix) {
            HTML.afterEnd(priceAboveVal, html);
        } else {
            HTML.beforeBegin(priceAboveVal, html);
        }

        addFilterInputEvents(
            priceAboveVal,
            document.querySelector("#es_notpriceabove"),
            "priceChanged", inputPattern,
            Localization.str.price_above_wrong_format.replace("__pattern__", pricePlaceholder));

        addFilterInputEvents(
            document.querySelector("#es_noreviewsbelow_val"),
            document.querySelector("#es_noreviewsbelow"),
            "reviewsChanged", /^\d+$/, "");
    };

    function addFilterInputEvents(node, checkboxNode, messageId, inputPattern, errorMessage) {
        node.addEventListener("click", e => e.stopPropagation());
        node.addEventListener("keydown", e => {
            if(e.key === "Enter") {
                // This would normally trigger a call to AjaxSearchResults() which is not required here
                e.preventDefault();
            }
        });
        node.addEventListener("input", () => {
            let newValue = node.value;

            if (!inputPattern || inputPattern.test(newValue)) {
                // The "checked" class will be toggled by the page context code
                Messenger.postMessage(messageId, newValue !== "");
                node.setCustomValidity('');
            } else {
                Messenger.postMessage(messageId, false);
                node.setCustomValidity(errorMessage);
            }

            node.reportValidity();
        });
    }

    SearchPageClass.prototype.observeChanges = function() {

        let hiddenInput = document.getElementById("es_hide");

        function modifyLinks() {
            for (let linkElement of document.querySelectorAll(".search_pagination_right a")) {
                let params = new URLSearchParams(linkElement.href.substring(linkElement.href.indexOf('?')));
                if (hiddenInput.value) {
                    params.set("es_hide", hiddenInput.value);
                } else {
                    params.delete("es_hide");
                }

                // Encoding is done by Steam, see #568
                linkElement.href = linkElement.href.substring(0, linkElement.href.indexOf('?') + 1) + params.toString();
            }
        }

        function toggleFilter(name, selector) {
            let params = new URLSearchParams(window.location.search);
            if (params.has("es_hide")) {
                decodeURIComponent(params.get("es_hide")).split(',').forEach(filter => {
                    if (filter.startsWith(name)) {
                        document.querySelector(selector).classList.add("checked");
                    }
                });
            }
        }

        let inputObserver = new MutationObserver(modifyLinks);
        inputObserver.observe(hiddenInput, {attributes: true, attributeFilter: ["value"]});

        let removeObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                for (let node of mutation.addedNodes) {
                    // Under certain circumstances the search result container will get removed and then added again, thus disconnecting the MutationObserver
                    if (node.id === "search_result_container") {
                        observeAjax(node.querySelectorAll(".search_result_row"));
                        
                        if (!SyncedStorage.get("contscroll")) {
                            toggleFilter("price-above", "#es_notpriceabove");
                            toggleFilter("reviews-below", "#es_noreviewsbelow");
                            modifyLinks();
                            filtersChanged();
                        }
                        ajaxObserver.observe(node.querySelector("#search_resultsRows"), {childList: true});
                        break;
                    }
                }
            });
        });
        removeObserver.observe(document.querySelector("#search_results"), { childList: true });

        function observeAjax(addedNodes) {
            EarlyAccess.showEarlyAccess();
            
            Highlights.highlightAndTag(addedNodes);
            filtersChanged(addedNodes);
        }

        let ajaxObserver = new MutationObserver(mutations => {
            let rows = [];
            for (let mutation of mutations) {
                rows = rows.concat(
                    Array.from(mutation.addedNodes).filter(node => node.classList && node.classList.contains("search_result_row"))
                );
            }
            observeAjax(rows);
        });
        ajaxObserver.observe(document.querySelector("#search_resultsRows"), {childList: true});
    };

    return SearchPageClass;
})();


let CuratorPageClass = (function(){

    function CuratorPageClass() {
        // no page-specific handling
    }

    return CuratorPageClass;
})();


let WishlistPageClass = (function(){

    let cachedPrices = {};
    let userNotes;

    function WishlistPageClass() {

        let instance = this;
        userNotes = new UserNotes();

        let myWishlist = isMyWishlist();
        let container = document.querySelector("#wishlist_ctn");
        let timeout = null, lastRequest = null;
        let delayedWork = new Set();
        let observer = new MutationObserver(mutations => {
            mutations.forEach(record => {
                if (record.addedNodes.length === 1) {
                    delayedWork.add(record.addedNodes[0]);
                }
            });
            lastRequest = window.performance.now();
            if (timeout == null) {
                timeout = window.setTimeout(async function markWishlist() {
                    if (window.performance.now() - lastRequest < 40) {
                        timeout = window.setTimeout(markWishlist, 50);
                        return;
                    }
                    timeout = null;
                    let promises = [];
                    for (let node of delayedWork) {
                        delayedWork.delete(node);
                        if (node.parentNode !== container) { // Valve detaches wishlist entries that aren't visible
                            continue;
                        }
                        if (myWishlist && SyncedStorage.get("showusernotes")) {
                            promises.push(instance.addUserNote(node));
                        } else {
                            instance.highlightApps(node); // not sure of the value of highlighting wishlisted apps on your wishlist
                        }
                        instance.addPriceHandler(node);
                    }
                    await Promise.all(promises);
                    window.dispatchEvent(new Event("resize"));
                }, 50);
            }
        });

        if (SyncedStorage.get("showlowestprice_onwishlist")) {
            
            ExtensionLayer.runInPageContext(() => {
                function getNodesBelow(node) {
                    let nodes = Array.from(document.querySelectorAll(".wishlist_row"));
            
                    // Limit the selection to the rows that are positioned below the row (not including the row itself) where the price is being shown
                    return nodes.filter(row => parseInt(row.style.top, 10) > parseInt(node.style.top, 10));
                }

                let oldOnScroll = CWishlistController.prototype.OnScroll;

                CWishlistController.prototype.OnScroll = function() {
                    oldOnScroll.call(g_Wishlist);

                    // If the mouse is still inside an entry while scrolling or resizing, wishlist.js's event handler will put back the elements to their original position
                    let hover = document.querySelectorAll(":hover");
                    if (hover.length) {
                        let activeEntry = hover[hover.length - 1].closest(".wishlist_row");
                        if (activeEntry) {
                            let priceNode = activeEntry.querySelector(".itad-pricing");
                            
                            if (priceNode) {
                                for (let row of getNodesBelow(activeEntry)) {
                                    row.style.top = `${parseInt(row.style.top) + priceNode.getBoundingClientRect().height}px`;
                                }
                            }
                        }
                    }
                }

            });
        }

        observer.observe(container, { 'childList': true, });

        let wishlistLoaded = () => {
            this.addStatsArea();
            this.addExportWishlistButton();
            this.addEmptyWishlistButton();
            this.addUserNotesHandlers();
        };
        
        if (document.querySelector("#throbber").style.display === "none") {
            wishlistLoaded();
        } else {
            Messenger.onMessage("wishlistLoaded").then(wishlistLoaded);

            ExtensionLayer.runInPageContext(() => {
                $J(document).ajaxSuccess((e, xhr, settings) => {
                    let url = new URL(settings.url);
                    if (url.origin + url.pathname === `${g_strWishlistBaseURL}wishlistdata/` && g_Wishlist.nPagesToLoad === g_Wishlist.nPagesLoaded) {
                        Messenger.postMessage("wishlistLoaded");
                    }
                });
            });
        }
    }

    function isMyWishlist() {
        if (!User.isSignedIn) { return false; }

        let myWishlistUrl = User.profileUrl.replace("steamcommunity.com/", "store.steampowered.com/wishlist/").replace(/\/$/, "");
        let myWishlistUrlRegex = new RegExp("^" + myWishlistUrl + "([/#]|$)");
        return myWishlistUrlRegex.test(window.location.href)
            || window.location.href.includes("/profiles/" + User.steamId);
    }

    WishlistPageClass.prototype.highlightApps = async function(node) {
        if (!User.isSignedIn) { return; }

        let loginImage = document.querySelector("#global_actions .user_avatar img").getAttribute("src");
        let userImage = document.querySelector(".wishlist_header img").getAttribute("src").replace("_full", "");
        if (loginImage === userImage) { return; }

        await DynamicStore;

        let [{ collected, waitlisted }, { owned, wishlisted, ignored }, { coupon, guestPass, gift }] = await Promise.all([
            ITAD.getAppStatus(`app/${node.dataset.appId}`),
            DynamicStore.getAppStatus(`app/${node.dataset.appId}`),
            Inventory.getAppStatus(Number(node.dataset.appId)),
        ]);

        if (collected) Highlights.highlightCollection(node);
        if (waitlisted) Highlights.highlightWaitlist(node);

        if (owned) {
            node.classList.add("ds_collapse_flag", "ds_flagged", "ds_owned");
            if (SyncedStorage.get("highlight_owned")) {
                Highlights.highlightOwned(node);
            } else {
                HTML.beforeEnd(node, `<div class="ds_flag ds_owned_flag">${Localization.str.library.in_library.toUpperCase()}&nbsp;&nbsp;</div>`);
            }
        }

        if (wishlisted) {
            node.classList.add("ds_collapse_flag", "ds_flagged", "ds_wishlist");

            if (SyncedStorage.get("highlight_wishlist")) {
                Highlights.highlightWishlist(node);
            } else {
                HTML.beforeEnd(node, `<div class="ds_flag ds_wishlist_flag">${Localization.str.on_wishlist.toUpperCase()}&nbsp;&nbsp;</div>`);
            }
        }

        if (ignored) {
            node.classList.add("ds_collapse_flag", "ds_flagged", "ds_ignored");

            if (SyncedStorage.get("highlight_notinterested")) {
                Highlights.highlightNotInterested(node);
            } else {
                HTML.beforeEnd(node, `<div class="ds_flag ds_ignored_flag">${Localization.str.ignored.toUpperCase()}&nbsp;&nbsp;</div>`);
            }
        }

        if (coupon) Highlights.highlightCoupon(node);
        if (guestPass) Highlights.highlightInvGuestpass(node);
        if (gift) Highlights.highlightInvGift(node);
    };

    WishlistPageClass.prototype.addStatsArea = function() {
        if (!SyncedStorage.get("showwishliststats")) { return; }
        if (document.getElementById("nothing_to_see_here").style.display !== "none") { return; }

        HTML.beforeBegin("#wishlist_ctn",
            `<div id="esi-wishlist-chart-content">
                <a>${Localization.str.wl.compute}</a>
            </div>`);

        document.querySelector("#esi-wishlist-chart-content a").addEventListener("click", e => {
            HTML.inner(e.target.parentNode, `<span>${Localization.str.loading}</span>`);
            loadStats();
        });
    };

    // Calculate total cost of all items on wishlist
    async function loadStats() {
        let wishlistData = HTMLParser.getVariableFromDom("g_rgAppInfo", "object");
        if (!wishlistData || Object.keys(wishlistData).length == 0) {
            let pages = HTMLParser.getVariableFromDom("g_nAdditionalPages", "int");
            let baseUrl = HTMLParser.getVariableFromDom("g_strWishlistBaseURL", "string");

            if (!pages || !baseUrl || !baseUrl.startsWith("https://store.steampowered.com/wishlist/profiles/")) {
                throw "loadStats() expected profile url";
            }

            wishlistData = {};
            let promises = [];

            for (let i=0; i<pages; i++) {
                promises.push(RequestData.getJson(baseUrl+"wishlistdata/?p="+i).then(data => {
                    Object.assign(wishlistData, data);
                }));
            }

            await Promise.all(promises);
        }
        let totalPrice = 0;
        let totalCount = 0;
        let totalOnSale = 0;
        let totalNoPrice = 0;

        for (let [key, game] of Object.entries(wishlistData)) {
            if (game.subs.length > 0) {
                totalPrice += game.subs[0].price / 100;

                if (game.subs[0].discount_pct > 0) {
                    totalOnSale++;
                }
            } else {
                totalNoPrice++;
            }
            totalCount++;
        }
        totalPrice = new Price(totalPrice, Currency.storeCurrency)

        HTML.inner("#esi-wishlist-chart-content",
            `<div class="esi-wishlist-stat"><span class="num">${totalPrice}</span>${Localization.str.wl.total_price}</div>
            <div class="esi-wishlist-stat"><span class="num">${totalCount}</span>${Localization.str.wl.in_wishlist}</div>
            <div class="esi-wishlist-stat"><span class="num">${totalOnSale}</span>${Localization.str.wl.on_sale}</div>
            <div class="esi-wishlist-stat"><span class="num">${totalNoPrice}</span>${Localization.str.wl.no_price}</div>`);
    }

    WishlistPageClass.prototype.addEmptyWishlistButton = function() {
        if (!isMyWishlist()) { return; }
        if (!SyncedStorage.get("showemptywishlist")) { return; }

        HTML.afterBegin("#cart_status_data", "<div class='es-wbtn' id='es_empty_wishlist'>" + Localization.str.empty_wishlist.title + "</div>");

        document.querySelector("#es_empty_wishlist").addEventListener("click", function(e) {
            emptyWishlist();
        });
    };

    function emptyWishlist() {
        ExtensionLayer.runInPageContext(`function(){
            var prompt = ShowConfirmDialog(\`${Localization.str.empty_wishlist.title}\`, \`${Localization.str.empty_wishlist.confirm}\`);
            prompt.done(function(result) {
                if (result == "OK") {
                    ShowBlockingWaitDialog(\`${Localization.str.empty_wishlist.title}\`, \`${Localization.str.empty_wishlist.removing}\`.replace("__cur__", 1).replace("__total__", g_rgWishlistData.length));
                    Messenger.postMessage("emptyWishlist");
                }
            });
        }`);

        function removeApp(appid) {

            let formData = new FormData();
            formData.append("sessionid", User.getSessionId());
            formData.append("appid", appid);

            let url = `https://store.steampowered.com/wishlist/profiles/${User.steamId}/remove/`;
            return RequestData.post(url, formData);
        }

        Messenger.onMessage("emptyWishlist").then(async () => {
            let wishlistData = HTMLParser.getVariableFromDom("g_rgWishlistData", "array");
            if (!wishlistData) { return; }

            let cur = 1;
            let textNode = document.querySelector(".waiting_dialog_throbber").nextSibling;
            for (let { appid } of wishlistData) {
                textNode.textContent = Localization.str.empty_wishlist.removing.replace("__cur__", cur++).replace("__total__", wishlistData.length);
                await removeApp(appid);
            }
            DynamicStore.clear();
            location.reload();
        });
    }

    class WishlistExporter {

        constructor(appInfo) {
            this.appInfo = appInfo;
            this.notesPromise = Background.action("notes.getall");
        }

        async toJson() {
            let notes = await this.notesPromise;

            let json = {
                version: "02",
                data: []
            };

            for (let [appid, data] of Object.entries(this.appInfo)) {
                json.data.push({
                    gameid: ["steam", "app/"+appid],
                    title: data.name,
                    url: `https://store.steampowered.com/app/${appid}/`,
                    release_date: data.release_string,
                    note: notes[appid] || null
                });
            }

            return JSON.stringify(json, null, 4);
        }

        async toText(format) {
            let notes = await this.notesPromise;
            let result = [];
            for (let [appid, data] of Object.entries(this.appInfo)) {
                result.push(
                    format
                        .replace("%appid%", appid)
                        .replace("%id%", "app/"+appid)
                        .replace("%url%", `https://store.steampowered.com/app/${appid}/`)
                        .replace("%title%", data.name)
                        .replace("%release_date%", data.release_string)
                        .replace("%type%", data.type)
                        .replace("%note%", notes[appid] || "")
                );
            }

            return result.join("\n");
        }
    }
    WishlistExporter.method = Object.freeze({"download": Symbol("Download"), "copyToClipboard": Symbol("Copy to clipboard")});

    /**
     * Using Valve's CModal API here is very hard, since, when trying to copy data to the clipboard, it has to originate from
     * a short-lived event handler for a user action.
     * Since we'd use our Messenger class to pass information in between these two contexts, we would "outrange" this specific event
     * handler, resulting in a denial of access to the clipboard function.
     * This could be circumvented by adding the appropriate permissions, but doing so would prompt users to explicitly accept the changed
     * permissions on an update.
     * 
     * If we don't use the Messenger, we'd have to move the whole handler part (including WishlistExporter) to
     * the page context side.
     * 
     * Final solution is to query the action buttons of the dialog and adding some extra click handlers on the content script side.
     * These handlers are using a capture, so that the dialog elements will still be existent at the time of the invocation.
     */
    WishlistPageClass.prototype.showExportModalDialog = function(appInfo) {

        let exportStr = Localization.str.export;

        ExtensionLayer.runInPageContext(`function() {
            ShowConfirmDialog(
                "${exportStr.wishlist}",
                \`<div id='es_export_form'>
                    <div class="es-wexport">
                    <h2>${exportStr.type}</h2>
                    <div>
                        <label class="es-wexport__label"><input type="radio" name="es_wexport_type" value="text" checked> ${exportStr.text}</label>
                        <label class="es-wexport__label"><input type="radio" name="es_wexport_type" value="json"> JSON</label>
                    </div>
                    </div>
                
                    <div class="es-wexport es-wexport__format">
                        <h2>${exportStr.format}</h2>
                        <div>
                            <input type="text" id="es-wexport-format" class="es-wexport__input" value="%title%"><br>
                            <div class="es-wexport__symbols">%title%, %id%, %appid%, %url%, %release_date%, %type%, %note%</div>
                        </div>
                    </div>
                </div>\`,
                "${exportStr.download}",
                null, // use default "Cancel"
                "${exportStr.copy_clipboard}"
            );
        }`);

        let [ dlBtn, copyBtn ] = document.querySelectorAll(".newmodal_buttons > .btn_medium");

        dlBtn.classList.remove("btn_green_white_innerfade");
        dlBtn.classList.add("btn_darkblue_white_innerfade");

        dlBtn.addEventListener("click", () => exportWishlist(WishlistExporter.method.download), true);
        copyBtn.addEventListener("click", () => exportWishlist(WishlistExporter.method.copyToClipboard), true);

        let format = document.querySelector(".es-wexport__format");
        for (let el of document.getElementsByName("es_wexport_type")) {
            el.addEventListener("click", e => format.style.display = e.target.value === "json" ? "none" : '');
        }

        async function exportWishlist(method) {
            let type = document.querySelector("input[name='es_wexport_type']:checked").value;
            let format = document.querySelector("#es-wexport-format").value;

            let wishlist = new WishlistExporter(appInfo);

            let result = "";
            let filename = "";
            let filetype = "";
            if (type === "json") {
                result = await wishlist.toJson();
                filename = "wishlist.json";
                filetype = "application/json";
            } else if (type === "text" && format) {
                result = await wishlist.toText(format);
                filename = "wishlist.txt";
                filetype = "text/plain";
            }

            if (method === WishlistExporter.method.copyToClipboard) {
                Clipboard.set(result);
            } else if (method === WishlistExporter.method.download) {
                Downloader.download(new Blob([result], { type: `${filetype};charset=UTF-8` }), filename);
            }
        }
    };

    WishlistPageClass.prototype.addExportWishlistButton = function() {
        HTML.afterBegin("#cart_status_data", `<div class="es-wbtn" id="es_export_wishlist"><div>${Localization.str.export.wishlist}</div></div>`);

        document.querySelector("#es_export_wishlist").addEventListener("click", () => {
            Messenger.onMessage("appInfo").then(appInfo => this.showExportModalDialog(appInfo));
            ExtensionLayer.runInPageContext(() => Messenger.postMessage("appInfo", g_rgAppInfo));
        });
    };

    function getNodesBelow(node) {
        let nodes = Array.from(document.querySelectorAll(".wishlist_row"));

        // Limit the selection to the rows that are positioned below the row (not including the row itself) where the price is being shown
        return nodes.filter(row => parseInt(row.style.top, 10) > parseInt(node.style.top, 10));
    }

    WishlistPageClass.prototype.addPriceHandler = function(node) {
        if (!SyncedStorage.get("showlowestprice_onwishlist")) return;

        let appId = node.dataset.appId;
        if (!appId || typeof cachedPrices[appId] !== "undefined") return;

        cachedPrices[appId] = null;

        node.addEventListener("mouseenter", () => {
            if (cachedPrices[appId] === null) {
                cachedPrices[appId] = new Promise(resolve => {
                    let prices = new Prices();
                    prices.appids = [appId];
                    prices.priceCallback = (type, id, contentNode) => {
                        node.insertAdjacentElement("beforeend", contentNode);
                        let priceNode = node.querySelector(".itad-pricing");
                        priceNode.style.bottom = -priceNode.getBoundingClientRect().height + "px";
                        resolve();
                    };
                    prices.load();
                });
            }
            cachedPrices[appId].then(() => {
                    let priceNodeHeight = node.querySelector(".itad-pricing").getBoundingClientRect().height;
                    getNodesBelow(node).forEach(row => row.style.top = parseInt(row.style.top, 10) + priceNodeHeight + "px");
            });
        });
        
        node.addEventListener("mouseleave", () => {
            // When scrolling really fast, sometimes only this event is called without the invocation of the mouseenter event
            if (cachedPrices[appId]) {
                cachedPrices[appId].then(() => {
                    let priceNodeHeight = node.querySelector(".itad-pricing").getBoundingClientRect().height;
                    getNodesBelow(node).forEach(row => row.style.top = parseInt(row.style.top, 10) - priceNodeHeight + "px");
                });
            }
        });
    };

    WishlistPageClass.prototype.addUserNote = async function(node) {
        if (node.classList.contains("esi-has-note")) { return; }

        let appid = Number(node.dataset.appId);
        let noteText;
        let cssClass;
        if (await userNotes.exists(appid)) {
            noteText = `"${await userNotes.get(appid)}"`;
            cssClass = "esi-user-note";
        } else {
            noteText = Localization.str.user_note.add;
            cssClass = "esi-empty-note";
        }

        HTML.afterEnd(node.querySelector(".mid_container"),
            `<div class="esi-note ${cssClass}">${noteText}</div>`);
        node.classList.add("esi-has-note");
    };

    WishlistPageClass.prototype.addUserNotesHandlers = function() {
        if (!isMyWishlist()) { return; }

        let stateHandler = function(node, active) {
            if (active) {
                node.classList.remove("esi-empty-note");
                node.classList.add("esi-user-note");
            } else {
                node.classList.remove("esi-user-note");
                node.classList.add("esi-empty-note");
            }
        };

        document.addEventListener("click", function(e) {
            if (!e.target.classList.contains("esi-note")) { return; }

            let row = e.target.closest(".wishlist_row");
            let appid = Number(row.dataset.appId);
            userNotes.showModalDialog(row.querySelector("a.title").textContent.trim(), appid, ".wishlist_row[data-app-id='" + appid + "'] div.esi-note", stateHandler);
        });
    };

    return WishlistPageClass;
})();

class UserNotes {
    constructor() {
        this.noteModalTemplate = `
            <div id="es_note_modal" data-appid="__appid__" data-selector="__selector__">
                <div id="es_note_modal_content">
                    <div class="es_note_prompt newmodal_prompt_with_textarea gray_bevel fullwidth">
                        <textarea name="es_note_input" id="es_note_input" rows="6" cols="12" maxlength="512">__note__</textarea>
                    </div>
                    <div class="es_note_buttons" style="float: right">
                        <div class="es_note_modal_submit btn_green_white_innerfade btn_medium">
                            <span>${Localization.str.save}</span>
                        </div>
                        <div class="es_note_modal_close btn_grey_white_innerfade btn_medium">
                            <span>${Localization.str.cancel}</span>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    async showModalDialog(appname, appid, nodeSelector, onNoteUpdate) {
        // Partly copied from shared_global.js
        ExtensionLayer.runInPageContext(`function() {
            let deferred = new jQuery.Deferred();
            let fnOK = () => deferred.resolve();
    
            let Modal = _BuildDialog(
                "${Localization.str.user_note.add_for_game.replace("__gamename__", appname)}",
                \`${this.noteModalTemplate.replace("__appid__", appid).replace("__note__", await this.get(appid) || '').replace("__selector__", encodeURIComponent(nodeSelector))}\`,
                [], fnOK);
            deferred.always(() => Modal.Dismiss());
    
            Modal.m_fnBackgroundClick = () => {
                Messenger.onMessenge("noteSaved").then(Modal.Dismiss);
                Messenger.postMessage("backgroundClick");
            }
    
            Modal.Show();
    
            // attach the deferred's events to the modal
            deferred.promise(Modal);
    
            let note_input = document.getElementById("es_note_input");
            note_input.focus();
            note_input.setSelectionRange(0, note_input.textLength);
            note_input.addEventListener("keydown", e => {
                if (e.key === "Enter") {
                    $J(".es_note_modal_submit").click();
                } else if (e.key === "Escape") {
                    Modal.Dismiss();
                }
            });
        }`);

        document.addEventListener("click", clickListener);

        Messenger.onMessage("backgroundClick").then(() => {
            onNoteUpdate.apply(null, saveNote());
            Messenger.postMessage("noteSaved");
        });

        function clickListener(e) {
            if (e.target.closest(".es_note_modal_submit")) {
                e.preventDefault();
                onNoteUpdate.apply(null, saveNote());
                ExtensionLayer.runInPageContext(() => CModal.DismissActiveModal());
            }
            else if (e.target.closest(".es_note_modal_close")) {
                ExtensionLayer.runInPageContext(() => CModal.DismissActiveModal());
            }
            else {
                return;
            }
            document.removeEventListener("click", clickListener);
        }

        let saveNote = () => {
            let modal = document.querySelector("#es_note_modal");
            let appid = parseInt(modal.dataset.appid, 10);
            let note = HTML.escape(modal.querySelector("#es_note_input").value.trim().replace(/\s\s+/g, " ").substring(0, 512));
            let node = document.querySelector(decodeURIComponent(modal.dataset.selector));
            if (note.length !== 0) {
                this.set(appid, note);
                HTML.inner(node, `"${note}"`);
                return [node, true];
            }
            else {
                this.delete(appid);
                node.textContent = Localization.str.user_note.add;
                return [node, false];
            }
        }
    }
    get(appid)          { return Background.action("notes.get", appid) }
    set(appid, note)    { return Background.action("notes.set", appid, note) }
    delete(appid)       { return Background.action("notes.delete", appid) }
    exists(appid)       { return Background.action("notes.exists", appid) }
}

let TagPageClass = (function(){

    function TagPageClass() {

    }

    return TagPageClass;
})();


let StoreFrontPageClass = (function(){

    function StoreFrontPageClass() {
        
        if (User.isSignedIn) {
            this.highlightDynamic();
        }
        
        this.setHomePageTab();
        this.customizeHomePage();
    }

    StoreFrontPageClass.prototype.setHomePageTab = function(){
        document.querySelector(".home_tabs_row").addEventListener("click", function(e) {
            let tab = e.target.closest(".tab_content");
            if (!tab) { return; }
            SyncedStorage.set("homepage_tab_last", tab.parentNode.id);
        });

        let setting = SyncedStorage.get("homepage_tab_selection");
        let last = setting;
        if (setting === "remember") {
            last = SyncedStorage.get("homepage_tab_last");
        }
        if (!last) { return; }

        let tab = document.querySelector(".home_tabs_row #"+last);
        if (!tab) { return; }

        tab.click();
    };

    StoreFrontPageClass.prototype.highlightDynamic = function() {

        let recentlyUpdated = document.querySelector(".recently_updated");
        if (recentlyUpdated) {
            let observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => Highlights.highlightAndTag(mutation.addedNodes[0].children));
                observer.disconnect();
            });
            observer.observe(recentlyUpdated, { childList: true });
        }

        // Monitor and highlight wishlishted recommendations at the bottom of Store's front page
        let contentNode = document.querySelector("#content_more");
        if (contentNode) {
            let observer = new MutationObserver(mutations => {
                mutations.forEach(mutation =>
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType !== Node.ELEMENT_NODE) { return; }
                        Highlights.highlightAndTag(node.querySelectorAll(".home_content_item, .home_content.single"));
                    })
                );
            });

            observer.observe(contentNode, {childList:true, subtree: true});
        }
    };

    StoreFrontPageClass.prototype.customizeHomePage = function(){

        HTML.beforeEnd(".home_page_content",
            `<div class="home_pagecontent_ctn clearfix" style="margin-bottom: 5px; margin-top: 3px;">
                <div id="es_customize_btn" class="home_actions_ctn">
                    <div class="home_btn home_customize_btn" style="z-index: 13;">${Localization.str.customize}</div>
                    <div class='home_viewsettings_popup'>
                        <div class='home_viewsettings_instructions' style='font-size: 12px;'>${Localization.str.apppage_sections}</div>
                    </div>
                </div>
            </div>`);

        document.querySelector("#es_customize_btn").addEventListener("click", function(e){
            e.target.classList.toggle("active");
        });

        document.body.addEventListener("click", function(e){
            if (e.target.closest("#es_customize_btn")) { return; }
            let node = document.querySelector("#es_customize_btn .home_customize_btn.active");
            if (!node) { return; }
            node.classList.remove("active");
        });

        setTimeout(() => {
            let specialoffers = document.querySelector(".special_offers");
            let browsesteam = document.querySelector(".big_buttons.home_page_content");
            let recentlyupdated = document.querySelector(".recently_updated_block");
            let under = document.querySelector("[class*='specials_under']");

            let customizer = new Customizer("customize_frontpage");
            customizer
                .add("featuredrecommended", ".home_cluster_ctn")
                .add("trendingamongfriends", ".friends_recently_purchased")
                .add("discoveryqueue", ".discovery_queue_ctn")
                .add("curators", ".steam_curators_ctn")
                .add("morecuratorrecommendations", ".apps_recommended_by_curators_ctn")
                .add("fromdevelopersandpublishersthatyouknow", ".recommended_creators_ctn")
                .add("popularvrgames", ".best_selling_vr_ctn")
                .add("homepagetabs", ".tab_container", Localization.str.homepage_tabs)
                .add("gamesstreamingnow", ".live_streams_ctn")
                .add("updatesandoffers", ".marketingmessage_area")
                .add("homepagesidebar", ".home_page_gutter", Localization.str.homepage_sidebar);

            if (specialoffers) customizer.add("specialoffers", specialoffers.parentElement);
            if (browsesteam) customizer.add("browsesteam", browsesteam.parentElement);
            if (recentlyupdated) customizer.add("recentlyupdated", recentlyupdated.parentElement);
            if (under) customizer.add("under", under.parentElement.parentElement);

            let dynamicNodes = Array.from(document.querySelectorAll(".home_page_body_ctn .home_ctn:not(.esi-customizer)"));
            for (let i = 0; i < dynamicNodes.length; ++i) {
                let node = dynamicNodes[i];
                if (node.querySelector(".esi-customizer") || node.style.display === "none") { continue; }

                let headerNode = node.querySelector(".home_page_content > h2,.carousel_container > h2");
                if (!headerNode) { continue; }

                customizer.addDynamic(headerNode, node);
            }

            customizer.build();
        }, 1000);
    };

    return StoreFrontPageClass;
})();

let TabAreaObserver = (function(){
    let self = {};

    self.observeChanges = function() {

        let tabAreaNodes = document.querySelectorAll(".tag_browse_ctn, .tabarea, .browse_ctn_background");
        if (!tabAreaNodes) { return; }

        let observer = new MutationObserver(() => {
            Highlights.startHighlightsAndTags();
            EarlyAccess.showEarlyAccess();
        });

        tabAreaNodes.forEach(tabAreaNode => observer.observe(tabAreaNode, {childList: true, subtree: true}));
    };

    return self;
})();

(async function(){
    let path = window.location.pathname.replace(/\/+/g, "/");

    await SyncedStorage.init().catch(err => console.error(err));
    await Promise.all([Localization, User, Currency]);

    Common.init();

    switch (true) {
        case /\bagecheck\b/.test(path):
            AgeCheck.sendVerification();
            break;

        case /^\/app\/.*/.test(path):
            (new AppPageClass(window.location.host + path));
            break;

        case /^\/sub\/.*/.test(path):
            (new SubPageClass(window.location.host + path));
            break;

        case /^\/bundle\/.*/.test(path):
            (new BundlePageClass(window.location.host + path));
            break;

        case /^\/account\/registerkey(\/.*)?/.test(path):
            (new RegisterKeyPageClass());
            return;

        case /^\/account(\/)?/.test(path):
            (new AccountPageClass());
            return;

        case /^\/(steamaccount\/addfunds|digitalgiftcards\/selectgiftcard)/.test(path):
            (new FundsPageClass());
            break;

        case /^\/search\/.*/.test(path):
            (new SearchPageClass());
            break;

        case /^\/(tags|genre)\//.test(path):
            (new TagPageClass());
            break;

        case /^\/(?:curator|developer|dlc|publisher|franchise)\/.*/.test(path):
            (new CuratorPageClass());
            break;

        case /^\/sale\/.*/.test(path):
            (new StorePageClass()).showRegionalPricing("sale");
            break;

        case /^\/wishlist\/(?:id|profiles)\/.+(\/.*)?/.test(path):
            (new WishlistPageClass());
            break;

        // Storefront-front only
        case /^\/$/.test(path):
            (new StoreFrontPageClass());
            break;
    }

    // common for store pages
    Highlights.startHighlightsAndTags();
    EnhancedSteam.alternateLinuxIcon();
    EnhancedSteam.hideTrademarkSymbol(false);
    TabAreaObserver.observeChanges();

})();
