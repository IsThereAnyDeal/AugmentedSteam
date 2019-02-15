
let StorePageClass = (function(){

    function StorePageClass() {

    }

    StorePageClass.prototype.isAppPage = function() {
        return /^\/app\/\d+/.test(window.location.pathname);
    };

    StorePageClass.prototype.isSubPage = function() {
        return /^\/sub\/\d+/.test(window.location.pathname);
    };

    StorePageClass.prototype.isDlc = function() {
        return document.querySelector("div.game_area_dlc_bubble") ? true : false;
    };

    StorePageClass.prototype.isVideo = function() {
        return document.querySelector(".game_area_purchase_game .streamingvideo") ? true : false;
    };

    StorePageClass.prototype.isOwned = function() {
        return document.querySelector(".game_area_already_owned") ? true :false;
    };

    StorePageClass.prototype.hasCards = function() {
        return document.querySelector(".icon img[src$='/ico_cards.png'") ? true : false;
    };

    StorePageClass.prototype.hasAchievements = function(){
        return document.querySelector("#achievement_block") ? true : false;
    };

    StorePageClass.prototype.getAllSubids = function() {
        let result = [];
        let nodes = document.querySelectorAll("input[name=subid]");
        for (let i=0, len=nodes.length; i<len; i++) {
            result.push(nodes[i].value);
        }
        return result;
    };


    StorePageClass.prototype.addDrmWarnings = function() {
        if (!SyncedStorage.get("showdrm", true)) { return; }

        let gfwl, uplay, securom, tages, stardock, rockstar, kalypso, denuvo, drm;

        let text = "";
        let nodes = document.querySelectorAll("#game_area_description, .game_area_sys_req, #game_area_legal, .game_details, .DRM_notice");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            text += node.innerHTML;
        }

        // Games for Windows Live detection
        if (text.toUpperCase().indexOf("GAMES FOR WINDOWS LIVE") > 0) { gfwl = true; }
        else if (text.toUpperCase().indexOf("GAMES FOR WINDOWS - LIVE") > 0) { gfwl = true; }
        else if (text.indexOf("Online play requires log-in to Games For Windows") > 0) { gfwl = true; }
        else if (text.indexOf("INSTALLATION OF THE GAMES FOR WINDOWS LIVE SOFTWARE") > 0) { gfwl = true; }
        else if (text.indexOf("Multiplayer play and other LIVE features included at no charge") > 0) { gfwl = true; }
        else if (text.indexOf("www.gamesforwindows.com/live") > 0) { gfwl = true; }

        // Ubisoft Uplay detection
        if (text.toUpperCase().indexOf("CREATION OF A UBISOFT ACCOUNT") > 0) { uplay = true; }
        else if (text.match(/\buplay/i) && !text.match(/\btuplaydinprosessori/i)) { uplay = true; }

        // Securom detection
        if (text.toUpperCase().indexOf("SECUROM") > 0) { securom = true; }

        // Tages detection
        if (text.match(/\btages\b/i)) { tages = true; }
        else if (text.match(/angebote des tages/i)) { tages = false; }
        else if (text.match(/\bsolidshield\b/i)) { tages = true; }

        // Stardock account detection
        if (text.indexOf("Stardock account") > 0) { stardock = true; }

        // Rockstar social club detection
        if (text.indexOf("Rockstar Social Club") > 0) { rockstar = true; }
        else if (text.indexOf("Rockstar Games Social Club") > 0) { rockstar = true; }

        // Kalypso Launcher detection
        if (text.indexOf("Requires a Kalypso account") > 0) { kalypso = true; }

        // Denuvo Antitamper detection
        if (text.match(/\bdenuvo\b/i)) { denuvo = true; }

        // Detect other DRM
        if (text.indexOf("3rd-party DRM") > 0) { drm = true; }
        else if (text.match(/No (3rd|third)(-| )party DRM/i)) { drm = false; }

        let drmString = "(";
        if (gfwl) { drmString += 'Games for Windows Live, '; drm = true; }
        if (uplay) { drmString += 'Ubisoft Uplay, '; drm = true; }
        if (securom) { drmString += 'SecuROM, '; drm = true; }
        if (tages) { drmString += 'Tages, '; drm = true; }
        if (stardock) { drmString += 'Stardock Account Required, '; drm = true; }
        if (rockstar) { drmString += 'Rockstar Social Club, '; drm = true; }
        if (kalypso) { drmString += "Kalypso Launcher, "; drm = true; }
        if (denuvo) { drmString += "Denuvo Anti-tamper, "; drm = true; }

        if (drmString === "(") {
            drmString = "";
        } else {
            drmString = drmString.substring(0, drmString.length - 2);
            drmString += ")";
        }

        // Prevent false-positives
        if (this.isAppPage() && this.appid === 21690) { drm = false; } // Resident Evil 5, at Capcom's request

        if (drm) {
            let stringType = this.isAppPage() ? Localization.str.drm_third_party : Localization.str.drm_third_party_sub;

            let node = document.querySelector("#game_area_purchase .game_area_description_bodylabel");
            if (node) {
                node.insertAdjacentHTML("afterend", '<div class="game_area_already_owned es_drm_warning"><span>' + stringType + ' ' + drmString + '</span></div>')
            } else {
                document.querySelector("#game_area_purchase").insertAdjacentHTML("afterbegin", '<div class="es_drm_warning"><span>' + stringType + ' ' + drmString + '</span></div>');
            }
        }
    };

    StorePageClass.prototype.addPrices = function() {
        if (!SyncedStorage.get("showlowestprice", true)) { return; }

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

        prices.priceCallback = function(type, id, html) {
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

            node.insertAdjacentHTML(placement, html);
            document.querySelector("#es_line_chart_"+id).style.top = ((document.querySelector("#es_price_"+id).offsetHeight - 20) / 2) + "px";

        };

        prices.bundleCallback = function(html) {

            document.querySelector("#game_area_purchase")
                .insertAdjacentHTML("afterend", "<h2 class='gradientbg'>" + Localization.str.bundle.header + " <img src='/public/images/v5/ico_external_link.gif' border='0' align='bottom'></h2>"
                    + html);
        };

        prices.load();
    };

    StorePageClass.prototype.getRightColLinkHtml = function(cls, url, str) {
        return `<a class="btnv6_blue_hoverfade btn_medium ${cls}" target="_blank" href="${url}" style="display: block; margin-bottom: 6px;">
                    <span><i class="ico16"></i>&nbsp;&nbsp; ${str}</span>
                </a>`;
    };

    // FIXME rename this to something sensible, maybe merge with addLinks?
    StorePageClass.prototype.addSteamDbItad = function(type) {
        if (!SyncedStorage.get("showsteamdb", Defaults.showsteamdb)
         && !SyncedStorage.get("showitadlinks", Defaults.showitadlinks)) { return; }

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

        if (SyncedStorage.get("showsteamdb", Defaults.showsteamdb)) {
            node.insertAdjacentHTML("afterbegin",
                this.getRightColLinkHtml(
                    "steamdb_ico",
                    `https://steamdb.info/${type}/${gameid}`,
                    Localization.str.view_in + ' Steam Database')
                );
        }

        if (SyncedStorage.get("showitadlinks", Defaults.showitadlinks)) {
            node.insertAdjacentHTML("afterbegin",
                this.getRightColLinkHtml(
                    "itad_ico",
                    `https://isthereanydeal.com/steam/${type}/${gameid}`,
                    Localization.str.view_on + ' IsThereAnyDeal')
            );
        }
    };

    StorePageClass.prototype.showRegionalPricing = function(type) {
        let showRegionalPrice = SyncedStorage.get("showregionalprice", "mouse");
        if (showRegionalPrice === "off") { return; }

        let countries = SyncedStorage.get("regional_countries", ["us", "gb", "fr", "ru", "br", "au", "jp"]);
        if (!countries || countries.length === 0) { return; }

        let localCountry = User.getCountry().toLowerCase();
        if (countries.indexOf(localCountry) === -1) {
            countries.push(localCountry);
        }

        let subids = this.getAllSubids();
        subids.forEach(subid => {
            if (!subid) { return; }
            let promises = [];

            let prices = {};

            countries.forEach(country => {

                let promise = RequestData.getJson("//store.steampowered.com/api/packagedetails/?packageids="+subid+"&cc="+country).then(result => {
                    if (!result || !result[subid] || !result[subid].success) { return; }
                    prices[country] = result[subid].data.price;
                });
                promises.push(promise);
            });

            Promise.all(promises).then(result => {

                let node = document.querySelector("input[name=subid][value='"+subid+"']")
                    .closest(".game_area_purchase_game_wrapper,#game_area_purchase,.sale_page_purchase_item")
                    .querySelector(".game_purchase_action");

                let apiPrice = prices[User.getCountry().toLowerCase()];
                let priceLocal = new Price(apiPrice.final / 100, apiPrice.currency);

                let pricingDiv = document.createElement("div");
                pricingDiv.classList.add("es_regional_container");
                pricingDiv.classList.add("es_regional_" + (type || "app"));

                if (showRegionalPrice === "mouse") {
                    pricingDiv.innerHTML += '<div class="miniprofile_arrow right" style="position: absolute; top: 12px; right: -8px;"></div>';
                }

                countries.forEach(country => {
                    let apiPrice = prices[country];
                    let html = "";

                    if (apiPrice) {
                        let priceUser = new Price(apiPrice.final / 100, apiPrice.currency);
                        let priceRegion = new Price(apiPrice.final / 100, apiPrice.currency, false);

                        let percentageIndicator = "equal";
                        let percentage = (((priceUser.value / priceLocal.value) * 100) - 100).toFixed(2);

                        if (percentage < 0) {
                            percentage = Math.abs(percentage);
                            percentageIndicator = "lower";
                        } else if (percentage > 0) {
                            percentageIndicator = "higher";
                        }

                        html =
                            `<div class="es_regional_price es_flag es_flag_${country}">
                                ${priceRegion}
                                <span class="es_regional_converted">(${priceUser})</span>
                                <span class="es_percentage es_percentage_${percentageIndicator}">${percentage}%</span>
                            </div>`;
                    } else {
                        html =
                            `<div class="es_regional_price es_flag es_flag_${country}">
                                <span class="es_regional_unavailable">${Localization.str.region_unavailable}</span>
                            </div>`;
                    }

                    pricingDiv.innerHTML += html;
                });

                let purchaseArea = node.closest(".game_area_purchase_game,.sale_page_purchase_item");
                purchaseArea.classList.add("es_regional_prices");

                if (showRegionalPrice === "always") {
                    node.insertAdjacentElement("beforebegin", pricingDiv);
                    purchaseArea.classList.add("es_regional_always");
                } else {
                    let priceNode = node.querySelector(".price,.discount_prices");
                    priceNode.insertAdjacentElement("afterend", pricingDiv);
                    priceNode.parentNode.classList.add("es_regional_onmouse");

                    if (!SyncedStorage.get("regional_hideworld", false)) {
                        node.querySelector(".price,.discount_prices").classList.add("es_regional_icon")
                    }
                }
            })
        });
    };

    return StorePageClass;
})();


let SubPageClass = (function() {

    let Super = StorePageClass;

    function SubPageClass(url) {
        Super.call(this);

        this.subid = GameId.getSubid(url);

        this.addDrmWarnings();
        this.addPrices();
        this.addSteamDbItad("sub");
        this.showRegionalPricing("sub");
        this.subscriptionSavingsCheck();
    }
    SubPageClass.prototype = Object.create(Super.prototype);
    SubPageClass.prototype.constructor = SubPageClass;

    SubPageClass.prototype.subscriptionSavingsCheck = function() {
        setTimeout(function() {
            let notOwnedTotalPrice = new Price(0);

            let nodes = document.querySelectorAll(".tab_idem");
            for (let i=0, len=nodes.length; i<len; i++) {
                let node = nodes[i];

                let priceContainer = node.querySelector(".discount_final_price").textContent.trim();
                if (!priceContainer) { continue; }

                let price = Price.parseFromString(priceContainer, false);
                if (price) {
                    notOwnedTotalPrice.value += price.value;
                }
            }


            let priceNodes = document.querySelectorAll(".package_totals_area .price");
            let packagePrice = Price.parseFromString(priceNodes[priceNodes.length-1].textContent);
            if (!packagePrice) { return; }

            notOwnedTotalPrice.value -= packagePrice.value;

            if (!document.querySelector("#package_savings_bar")) {
                document.querySelector(".package_totals_area")
                    .insertAdjacentHTML("beforeend", "<div id='package_savings_bar'><div class='savings'></div><div class='message'>" + Localization.str.bundle_saving_text + "</div></div>");
            }

            let style = (notOwnedTotalPrice.value < 0 ? " style='color:red'" : "");
            let html = `<div class="savings"${style}>${notOwnedTotalPrice}</div>`;

            let savingsNode = document.querySelector(".savings");
            savingsNode.insertAdjacentHTML("beforebegin", html);
            savingsNode.remove();
        }, 500); // why is this here?
    };

    return SubPageClass;
})();


let BundlePageClass = (function(){

    let Super = StorePageClass;

    function BundlePageClass(url) {
        Super.call(this);

        this.bundleid = GameId.getSubid(url);

        this.addDrmWarnings();
        this.addPrices();
        this.addSteamDbItad("bundle");
    }

    BundlePageClass.prototype = Object.create(Super.prototype);
    BundlePageClass.prototype.constructor = SubPageClass;

    return BundlePageClass;
})();


let AppPageClass = (function(){

    let Super = StorePageClass;

    function AppPageClass(url) {
        Super.call(this);

        this.appid = GameId.getAppid(url);
        let metalinkNode = document.querySelector("#game_area_metalink a");
        this.metalink = metalinkNode && metalinkNode.getAttribute("href");

        this.data = this.storePageDataPromise().catch(err => console.error(err));
        this.appName = document.querySelector(".apphub_AppName").textContent;

        this.mediaSliderExpander();
        this.initHdPlayer();
        this.addWishlistRemove();
        this.addCoupon();
        this.addPrices();
        this.addDlcInfo();

        this.addDrmWarnings();
        this.addMetacriticUserScore();
        this.addOpenCritic();
        this.displayPurchaseDate();

        this.addWidescreenCertification();

        this.addHltb();

        this.moveUsefulLinks();
        this.addLinks();
        this.addSteamDbItad("app");
        this.addHighlights();
        this.addFamilySharingWarning();

        this.addPackageInfoButton();
        this.addStats();

        this.addDlcCheckboxes();
        this.addBadgeProgress();
        this.addAstatsLink();
        this.addAchievementCompletionBar();

        this.showRegionalPricing("app");

        this.customizeAppPage();
        this.addReviewToggleButton();
        this.addHelpButton();

    }
    AppPageClass.prototype = Object.create(Super.prototype);
    AppPageClass.prototype.constructor = AppPageClass;

    AppPageClass.prototype.mediaSliderExpander = function() {
        let detailsBuilt = false;
        let details  = document.querySelector("#game_highlights .rightcol, .workshop_item_header .col_right");

        if (details) {
            document.querySelector("#highlight_player_area").insertAdjacentHTML("beforeend", `
                <div class="es_slider_toggle btnv6_blue_hoverfade btn_medium">
                    <div data-slider-tooltip="` + Localization.str.expand_slider + `" class="es_slider_expand"><i class="es_slider_toggle_icon"></i></div>
                    <div data-slider-tooltip="` + Localization.str.contract_slider + `" class="es_slider_contract"><i class="es_slider_toggle_icon"></i></div>
                </div>
            `);
        }

        // Initiate tooltip
        ExtensionLayer.runInPageContext(function() { $J('[data-slider-tooltip]').v_tooltip({'tooltipClass': 'store_tooltip community_tooltip', 'dataName': 'sliderTooltip' }); });

        function buildSideDetails() {
            if (detailsBuilt) return;
            detailsBuilt = true;

            let detailsClone = details.querySelector(".glance_ctn");
            if (!detailsClone) return;
            detailsClone = detailsClone.cloneNode(true);
            detailsClone.classList.add("es_side_details", "block", "responsive_apppage_details_left");

            for (let node of detailsClone.querySelectorAll(".app_tag.add_button, .glance_tags_ctn.your_tags_ctn")) {
                // There are some issues with having duplicates of these on page when trying to add tags
                node.remove();
            }

            let detailsWrap = document.createElement("div");
            detailsWrap.classList.add("es_side_details_wrap");
            detailsWrap.appendChild(detailsClone);
            detailsWrap.style.display = 'none';
            document.querySelector("div.rightcol.game_meta_data")
                .insertAdjacentElement('afterbegin', detailsWrap);
        }


        var expandSlider = LocalData.get("expand_slider") || false;
        if (expandSlider === true) {
            buildSideDetails();

            for (let node of document.querySelectorAll(".es_slider_toggle, #game_highlights, .workshop_item_header, .es_side_details, .es_side_details_wrap")) {
                node.classList.add("es_expanded");
            }
            for (let node of document.querySelectorAll(".es_side_details_wrap, .es_side_details")) {
                // shrunk => expanded
                node.style.display = null;
                node.style.opacity = 1;
            }

            // Triggers the adjustment of the slider scroll bar
            setTimeout(function(){
                window.dispatchEvent(new Event("resize"));
            }, 250);
        }

        document.querySelector(".es_slider_toggle").addEventListener("click", clickSliderToggle, false);
        function clickSliderToggle(ev) {
            ev.preventDefault();
            ev.stopPropagation();

            let el = ev.target.closest('.es_slider_toggle');
            details.style.display = 'none';
            buildSideDetails();

            // Fade In/Out sideDetails
            let sideDetails = document.querySelector(".es_side_details_wrap");
            if (sideDetails) {
                if (!el.classList.contains("es_expanded")) {
                    // shrunk => expanded
                    sideDetails.style.display = null;
                    sideDetails.style.opacity = 1;
                } else {
                    // expanded => shrunk
                    sideDetails.style.opacity = 0;
                    setTimeout(function(){
                        // Hide after transition completes
                        if (!el.classList.contains("es_expanded"))
                            sideDetails.style.display = 'none';
                        }, 250);
                }
            }

            // On every animation/transition end check the slider state
            let container = document.querySelector('.highlight_ctn');
            container.addEventListener('transitionend', saveSlider, false);
            function saveSlider(ev) {
                container.removeEventListener('transitionend', saveSlider, false);
                // Save slider state
                LocalData.set('expand_slider', el.classList.contains('es_expanded'));

                // If slider was contracted show the extended details
                if (!el.classList.contains('es_expanded')) {
                    details.style.transition = "";
                    details.style.opacity = "0";
                    details.style.transition = "opacity 250ms";
                    details.style.display = null;
                    details.style.opacity = "1";
                }

                // Triggers the adjustment of the slider scroll bar
                setTimeout(function(){
                    window.dispatchEvent(new Event("resize"));
                }, 250);
            }

            for (let node of document.querySelectorAll(".es_slider_toggle, #game_highlights, .workshop_item_header, .es_side_details, .es_side_details_wrap")) {
                node.classList.toggle("es_expanded");
            }
		}
    };

    AppPageClass.prototype.initHdPlayer = function() {
        let movieNode = document.querySelector('div.highlight_movie');
        if (!movieNode) { return; }

        let playInHD = LocalData.get('playback_hd');

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
            let playInHD = toggleVideoDefinition(videoControl);

            for (let n of document.querySelectorAll('video.highlight_movie')) {
                if (n === videoControl) continue;
                toggleVideoDefinition(n, playInHD);
            }

            LocalData.set('playback_hd', playInHD);
        }

        // When the slider is expanded first time after the page was loaded set videos definition to HD
        for (let node of document.querySelectorAll('.es_slider_toggle')) {
            node.addEventListener('click', clickInitialHD, false);
        }
        function clickInitialHD(ev) {
            ev.currentTarget.removeEventListener('click', clickInitialHD, false);
            if (!ev.target.classList.contains('es_expanded')) return;
            for (let node of document.querySelectorAll('video.highlight_movie.es_video_sd')) {
                toggleVideoDefinition(node, true);
            }
            LocalData.set('playback_hd', true);
        }

        function addHDControl(videoControl) {
            playInHD = LocalData.get('playback_hd');
            
            function _addHDControl() {
                // Add "HD" button and "sd-src" to the video and set definition
                if (videoControl.dataset.hdSrc) {
                    videoControl.dataset.sdSrc = videoControl.src;
                    let node = videoControl.parentNode.querySelector('.time');
                    if (node) {
                        node.insertAdjacentHTML('afterend', `<div class="es_hd_toggle"><span>HD</span></div>`);
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

                toggleVideoDefinition(videoControl, playInHD);
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
 
        function toggleVideoDefinition(videoControl, setHD) {
            let videoIsVisible = videoControl.parentNode.offsetHeight > 0 && videoControl.parentNode.offsetWidth > 0, // $J().is(':visible')
                videoIsHD = false,
                loadedSrc = videoControl.classList.contains("es_loaded_src"),
                playInHD = LocalData.get("playback_hd") || videoControl.classList.contains("es_video_hd");

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

            if (!playInHD && (typeof setHD === 'undefined' || setHD === true)) {
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
    };

    AppPageClass.prototype.storePageDataPromise = async function() {
        let appid = this.appid;
        let cache = LocalData.get("storePageData_" + appid);

        if (cache && cache.data && !TimeHelper.isExpired(cache.updated, 3600)) {
            return cache.data;
        }

        let apiparams = {
            appid: appid
        };
        if (this.metalink) {
            apiparams.mcurl = this.metalink;
        }
        if (SyncedStorage.get("showoc", true)) {
            apiparams.oc = 1;
        }

        return RequestData.getApi("v01/storepagedata", apiparams)
            .then(function(response) {
                if (response && response.result && response.result === "success") {
                    LocalData.set("storePageData_" + appid, {
                        data: response.data,
                        updated: Date.now(),
                    });
                    return response.data;
                }
                throw "Network error: did not receive valid storepagedata.";
            });
    };

    /**
     *  Allows the user to intuitively remove an item from their wishlist on the app page
     */
    AppPageClass.prototype.addWishlistRemove = function() {
        if (!User.isSignedIn) { return; }
        let appid = this.appid;

        // there is no add to wishlist button and game is not purchased yet, add required nodes
        if (!document.querySelector("#add_to_wishlist_area") && !document.querySelector(".game_area_already_owned")) {
            let firstButton = document.querySelector(".queue_actions_ctn a.queue_btn_active");
            firstButton.insertAdjacentHTML("beforebegin", "<div id='add_to_wishlist_area_success' style='display: inline-block;'></div>");

            let wishlistArea = document.querySelector("#add_to_wishlist_area_success");
            DOMHelper.wrap(wishlistArea, firstButton);
            wishlistArea.insertAdjacentHTML("beforebegin", `<div id='add_to_wishlist_area' style='display: none;'><a class='btnv6_blue_hoverfade btn_medium' href='javascript:AddToWishlist(${appid}, \\"add_to_wishlist_area\\", \\"add_to_wishlist_area_success\\", \\"add_to_wishlist_area_fail\\", \\"1_5_9__407\\" );'><span>${Localization.str.add_to_wishlist}</span></a></div>`);
            wishlistArea.insertAdjacentHTML("beforebegin", `<div id='add_to_wishlist_area_fail' style='display: none;'></div>`);
        }

        let successNode = document.querySelector("#add_to_wishlist_area_success");
        if (!successNode) { return; }

        let imgNode = successNode.querySelector("img:last-child");
        if (!imgNode) { return; }

        imgNode.classList.add("es-in-wl");
        imgNode.insertAdjacentHTML("beforebegin", `<img class='es-remove-wl' src='${ExtensionLayer.getLocalUrl("img/remove.png")}' style='display:none' />`);
        imgNode.insertAdjacentHTML("beforebegin", `<img class='es-loading-wl' src='//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif' style='display:none; width:16px' />`);

        successNode.addEventListener("click", function(e){
            e.preventDefault();

            let parent = successNode.parentNode;
            if (!parent.classList.contains("loading")) {
                parent.classList.add("loading");

                let formData = new FormData();
                formData.append("sessionid", User.getSessionId());
                formData.append("appid", appid)

                RequestData.post("//store.steampowered.com/api/removefromwishlist", formData, {withCredentials: true}).then(response => {
                    document.querySelector("#add_to_wishlist_area").style.display = "inline";
                    document.querySelector("#add_to_wishlist_area_success").style.display = "none";

                    // Clear dynamicstore cache
                    DynamicStore.clear();

                    // Invalidate dynamic store data cache
                    ExtensionLayer.runInPageContext("function(){ GDynamicStore.InvalidateCache(); }");
                }).finally(() => {
                    parent.classList.remove("loading");
                });
            }
        });

        let nodes = document.querySelectorAll("#add_to_wishlist_area, #add_to_wishlist_area_success, .queue_btn_ignore");
        for (let i=0, len=nodes.length; i<len; i++) {
            nodes[i].addEventListener("click", DynamicStore.clear);
        }
    };

    AppPageClass.prototype.getFirstSubid = function() {
        let node = document.querySelector("div.game_area_purchase_game input[name=subid]");
        return node && node.value;
    };

    AppPageClass.prototype.addCoupon = function() {
        let inst = this;
        Inventory.promise().then(() => {

            let coupon = Inventory.getCoupon(inst.getFirstSubid());
            if (!coupon) { return; }

            let couponDate = coupon.valid && coupon.valid.replace(/\[date](.+)\[\/date]/, function(m0, m1) { return new Date(m1 * 1000).toLocaleString(); });

            let purchaseArea = document.querySelector("#game_area_purchase");
            purchaseArea.insertAdjacentHTML("beforebegin", `
<div class="early_access_header">
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
        });
    };

    AppPageClass.prototype.addDlcInfo = function() {
        if (!this.isDlc()) { return; }

        RequestData.getApi("v01/dlcinfo", {appid: this.appid, appname: encodeURIComponent(this.appName)}).then(response => {
            let html = `<div class='block responsive_apppage_details_right heading'>${Localization.str.dlc_details}</div><div class='block'><div class='block_content'><div class='block_content_inner'><div class='details_block'>`;

            if (response && response.result === "success") {
                for(let i=0, len=response.data.length; i<len; i++) {

                    let item = response.data[i];
                    let iconUrl = Config.CdnHost + "/gamedata/icons/" + encodeURIComponent(item.icon);
                    let title = BrowserHelper.escapeHTML(item.desc);
                    let name = BrowserHelper.escapeHTML(item.name);
                    html += `<div class='game_area_details_specs'><div class='icon'><img src='${iconUrl}' align='top'></div><a class='name' title='${title}'>${name}</a></div>`;
                }
            }

            let suggestUrl = Config.PublicHost + "/gamedata/dlc_category_suggest.php?appid=" + this.appid + "&appname=" + encodeURIComponent(this.appName);
            html += `</div><a class='linkbar' style='margin-top: 10px;' href='${suggestUrl}' target='_blank'>${Localization.str.dlc_suggest}</a></div></div></div>`;

            document.querySelector("#category_block").parentNode.insertAdjacentHTML("beforebegin", html);
        });
    };

    AppPageClass.prototype.addMetacriticUserScore = function() {
        if (!SyncedStorage.get("showmcus", true)) { return; }

        let node = document.querySelector("#game_area_metascore");
        if (!node) { return; }

        this.data.then(response => {
            if (!response || !response.data || !response.data.userscore) { return; }

            let metauserscore = response.data.userscore * 10;
            if (!isNaN(metauserscore)) {
                node.insertAdjacentHTML("afterend", "<div id='game_area_userscore'></div>");

                let rating;
                if (metauserscore >= 75) {
                    rating = "high";
                } else if (metauserscore >= 50) {
                    rating = "medium";
                } else {
                    rating = "low";
                }
                document.querySelector("#game_area_userscore")
                    .insertAdjacentHTML("beforeend", `<div class='score ${rating}'>${metauserscore}</div>
                           <div class='logo'></div><div class='wordmark'><div class='metacritic'>${Localization.str.user_score}</div></div>`)
            }
        });
    };

    AppPageClass.prototype.addOpenCritic = function() {
        if (!SyncedStorage.get("showoc", true)) { return; }

        this.data.then(result => {
            if (!result || !result || !result.oc) { return; }
            let data = result.oc;

            if (!data.url) { return; }

            let node = document.querySelector(".rightcol .responsive_apppage_reviewblock");
            if (!node) {
                node = document.querySelector("#ReportAppBtn").parentNode;
            }
            node.parentNode.insertAdjacentHTML("afterend", "<div><div class='block responsive_apppage_reviewblock'><div id='game_area_opencritic' class='solo'></div><div style='clear: both'></div></div>");

            let opencriticImg = ExtensionLayer.getLocalUrl("img/opencritic.png");
            let award = data.award || "NA";

            document.querySelector("#game_area_opencritic")
                .insertAdjacentHTML("beforeend",
                    `<div class='score ${award.toLowerCase()}'>${data.score}</div>
                           <div><img src='${opencriticImg}'></div>
                           <div class='oc_text'>${award} - 
                               <a href='${data.url}?utm_source=enhanced-steam-itad&utm_medium=average' target='_blank'>${Localization.str.read_reviews}</a>
                           </div>`);

            // Add data to the review section in the left column, or create one if that block doesn't exist
            if (data.reviews.length > 0) {
                let reviewsNode = document.querySelector("#game_area_reviews");
                if (reviewsNode) {
                    reviewsNode.querySelector("p").insertAdjacentHTML("afterbegin", "<div id='es_opencritic_reviews'></div>");
                    reviewsNode.querySelector("p").insertAdjacentHTML("beforeend", `<div class='chart-footer'>${Localization.str.read_more_reviews} <a href='${data.url}?utm_source=enhanced-steam-itad&utm_medium=reviews' target='_blank'>OpenCritic.com</a></div>`);
                } else {
                    document.querySelector("#game_area_description")
                        .insertAdjacentHTML("beforebegin",
                            `<div id='game_area_reviews' class='game_area_description'>
                                    <h2>${Localization.str.reviews}</h2>
                                    <div id='es_opencritic_reviews'></div>
                                    <div class='chart-footer'>${Localization.str.read_more_reviews} <a href='${data.url}?utm_source=enhanced-steam-itad&utm_medium=reviews' target='_blank'>OpenCritic.com</a></div>
                                </div>`);

                    if (!SyncedStorage.get("show_apppage_reviews", true)) {
                        document.querySelector("#game_area_reviews").style.display = "none";
                    }
                }

                let review_text = "";
                for (let i=0, len=data.reviews.length; i<len; i++) {
                    let review = data.reviews[i];
                    let date = new Date(review.date);
                    review_text += `<p>"${review.snippet}"<br>${review.dScore} - <a href='${review.rURL}' target='_blank' data-tooltip-text='${review.author}, ${date.toLocaleDateString()}'>${review.name}</a></p>`;
                }

                document.querySelector("#es_opencritic_reviews").insertAdjacentHTML("beforeend", review_text);
                ExtensionLayer.runInPageContext("function() { BindTooltips( '#game_area_reviews', { tooltipCSSClass: 'store_tooltip'} ); }");
            }
        });
    };

    AppPageClass.prototype.displayPurchaseDate = function() {
        if (!SyncedStorage.get("purchase_dates", true)) { return; }

        let node = document.querySelector(".game_area_already_owned");
        if (!node) { return; }

        let appname = this.appName.replace(":", "").trim();

        User.getPurchaseDate(Language.getCurrentSteamLanguage(), appname).then(date => {
            if (!date) { return; }
            document.querySelector(".game_area_already_owned .already_in_library")
                .insertAdjacentHTML("beforeend", ` ${Localization.str.purchase_date.replace("__date__", date)}`);
        });
    };

    AppPageClass.prototype.addWidescreenCertification = function() {
        if (!SyncedStorage.get("showwsgf", true)) { return; }
        if (this.isDlc()) { return; }

        this.data.then(result => {
            if (!result || result.wsgf) { return; }
            let node = document.querySelector("game_details");

            let data = result.wsgf;
            if (!data) { return; }

            let path = data["Path"];
            let wsg = data["WideScreenGrade"];
            let mmg = data["MultiMonitorGrade"];
            let fkg = data["Grade4k"];
            let uws = data["UltraWideScreenGrade"];
            let wsg_icon = "", wsg_text = "", mmg_icon = "", mmg_text = "";
            let fkg_icon = "", fkg_text = "", uws_icon = "", uws_text = "";

            switch (wsg) {
                case "A":
                    wsg_icon = ExtensionLayer.getLocalUrl("img/wsgf/ws-gold.png");
                    wsg_text = Localization.str.wsgf.gold.replace(/__type__/g, "Widescreen");
                    break;
                case "B":
                    wsg_icon = ExtensionLayer.getLocalUrl("img/wsgf/ws-silver.png");
                    wsg_text = Localization.str.wsgf.silver.replace(/__type__/g, "Widescreen");
                    break;
                case "C":
                    wsg_icon = ExtensionLayer.getLocalUrl("img/wsgf/ws-limited.png");
                    wsg_text = Localization.str.wsgf.limited.replace(/__type__/g, "Widescreen");
                    break;
                case "Incomplete":
                    wsg_icon = ExtensionLayer.getLocalUrl("img/wsgf/ws-incomplete.png");
                    wsg_text = Localization.str.wsgf.incomplete;
                    break;
                case "Unsupported":
                    wsg_icon = ExtensionLayer.getLocalUrl("img/wsgf/ws-unsupported.png");
                    wsg_text = Localization.str.wsgf.unsupported.replace(/__type__/g, "Widescreen");
                    break;
            }

            switch (mmg) {
                case "A":
                    mmg_icon = ExtensionLayer.getLocalUrl("img/wsgf/mm-gold.png");
                    mmg_text = Localization.str.wsgf.gold.replace(/__type__/g, "Multi-Monitor");
                    break;
                case "B":
                    mmg_icon = ExtensionLayer.getLocalUrl("img/wsgf/mm-silver.png");
                    mmg_text = Localization.str.wsgf.silver.replace(/__type__/g, "Multi-Monitor");
                    break;
                case "C":
                    mmg_icon = ExtensionLayer.getLocalUrl("img/wsgf/mm-limited.png");
                    mmg_text = Localization.str.wsgf.limited.replace(/__type__/g, "Multi-Monitor");
                    break;
                case "Incomplete":
                    mmg_icon = ExtensionLayer.getLocalUrl("img/wsgf/mm-incomplete.png");
                    mmg_text = Localization.str.wsgf.incomplete;
                    break;
                case "Unsupported":
                    mmg_icon = ExtensionLayer.getLocalUrl("img/wsgf/mm-unsupported.png");
                    mmg_text = Localization.str.wsgf.unsupported.replace(/__type__/g, "Multi-Monitor");
                    break;
            }

            switch (uws) {
                case "A":
                    uws_icon = ExtensionLayer.getLocalUrl("img/wsgf/uw-gold.png");
                    uws_text = Localization.str.wsgf.gold.replace(/__type__/g, "Ultra-Widescreen");
                    break;
                case "B":
                    uws_icon = ExtensionLayer.getLocalUrl("img/wsgf/uw-silver.png");
                    uws_text = Localization.str.wsgf.silver.replace(/__type__/g, "Ultra-Widescreen");
                    break;
                case "C":
                    uws_icon = ExtensionLayer.getLocalUrl("img/wsgf/uw-limited.png");
                    uws_text = Localization.str.wsgf.limited.replace(/__type__/g, "Ultra-Widescreen");
                    break;
                case "Incomplete":
                    uws_icon = ExtensionLayer.getLocalUrl("img/wsgf/uw-incomplete.png");
                    uws_text = Localization.str.wsgf.incomplete;
                    break;
                case "Unsupported":
                    uws_icon = ExtensionLayer.getLocalUrl("img/wsgf/uw-unsupported.png");
                    uws_text = Localization.str.wsgf.unsupported.replace(/__type__/g, "Ultra-Widescreen");
                    break;
            }

            switch (fkg) {
                case "A":
                    fkg_icon = ExtensionLayer.getLocalUrl("img/wsgf/4k-gold.png");
                    fkg_text = Localization.str.wsgf.gold.replace(/__type__/g, "4k UHD");
                    break;
                case "B":
                    fkg_icon = ExtensionLayer.getLocalUrl("img/wsgf/4k-silver.png");
                    fkg_text = Localization.str.wsgf.silver.replace(/__type__/g, "4k UHD");
                    break;
                case "C":
                    fkg_icon = ExtensionLayer.getLocalUrl("img/wsgf/4k-limited.png");
                    fkg_text = Localization.str.wsgf.limited.replace(/__type__/g, "4k UHD");
                    break;
                case "Incomplete":
                    fkg_icon = ExtensionLayer.getLocalUrl("img/wsgf/4k-incomplete.png");
                    fkg_text = Localization.str.wsgf.incomplete;
                    break;
                case "Unsupported":
                    fkg_icon = ExtensionLayer.getLocalUrl("img/wsgf/4k-unsupported.png");
                    fkg_text = Localization.str.wsgf.unsupported.replace(/__type__/g, "4k UHD");
                    break;
            }


            let wsgfUrl = BrowserHelper.escapeHTML(path);

            let html = "<div class='block responsive_apppage_details_right heading'>"+Localization.str.wsgf.certifications+"</div><div class='block underlined_links'><div class='block_content'><div class='block_content_inner'><div class='details_block'><center>";
            if (wsg !== "Incomplete") { html += "<a target='_blank' href='" + wsgfUrl + "'><img src='" + BrowserHelper.escapeHTML(wsg_icon) + "' height='120' title='" + BrowserHelper.escapeHTML(wsg_text) + "' border=0></a>&nbsp;&nbsp;&nbsp;"; }
            if (mmg !== "Incomplete") { html += "<a target='_blank' href='" + wsgfUrl + "'><img src='" + BrowserHelper.escapeHTML(mmg_icon) + "' height='120' title='" + BrowserHelper.escapeHTML(mmg_text) + "' border=0></a>&nbsp;&nbsp;&nbsp;"; }
            if (uws !== "Incomplete") { html += "<a target='_blank' href='" + wsgfUrl + "'><img src='" + BrowserHelper.escapeHTML(uws_icon) + "' height='120' title='" + BrowserHelper.escapeHTML(uws_text) + "' border=0></a>&nbsp;&nbsp;&nbsp;"; }
            if (fkg !== "Incomplete") { html += "<a target='_blank' href='" + wsgfUrl + "'><img src='" + BrowserHelper.escapeHTML(fkg_icon) + "' height='120' title='" + BrowserHelper.escapeHTML(fkg_text) + "' border=0></a>&nbsp;&nbsp;&nbsp;"; }
            if (path) { html += "</center><br><a class='linkbar' target='_blank' href='" + wsgfUrl + "'>" + Localization.str.rating_details + " <img src='//store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"; }
            html += "</div></div></div></div>";

            node.insertAdjacentHTML("afterend", html);
        });
    };

    AppPageClass.prototype.addHltb = function() {
        if (!SyncedStorage.get("showhltb", true)) { return; }
        if (this.isDlc()) { return; }

        this.data.then(result => {
            if (!result || !result.hltb) { return; }
            let data = result.hltb;

            let html = "";
            if (data.success) {
                html = `<div class='block responsive_apppage_details_right heading'>${Localization.str.hltb.title}</div>
                            <div class='block game_details underlined_links'>
                            <div class='block_content'><div class='block_content_inner'><div class='details_block'>`;

                if (data["main_story"]){
                    let value = BrowserHelper.escapeHTML(data['main_story']);
                    html += `<b>${Localization.str.hltb.main}:</b><span style='float: right;'>${value}</span><br>`;
                }
                if (data["main_extras"]){
                    let value = BrowserHelper.escapeHTML(data['main_extras']);
                    html += `<b>${Localization.str.hltb.main_e}:</b><span style='float: right;'>${value}</span><br>`;
                }
                if (data["comp"]) {
                    let value = BrowserHelper.escapeHTML(data['comp']);
                    html += `<b>${Localization.str.hltb.compl}:</b><span style='float: right;'>${value}</span><br>`;
                }

                let suggestUrl = Config.PublicHost + "/gamedata/hltb_link_suggest.php";

                html += "</div>"
                    + "<a class='linkbar' href='" + BrowserHelper.escapeHTML(data['url']) + "' target='_blank'>" + Localization.str.more_information + " <img src='//store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"
                    + "<a class='linkbar' href='" + BrowserHelper.escapeHTML(data['submit_url']) + "' target='_blank'>" + Localization.str.hltb.submit + " <img src='//store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"
                    + "<a class='linkbar' href='" + suggestUrl + "' id='suggest'>" + Localization.str.hltb.wrong + " - " + Localization.str.hltb.help + " <img src='//store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"
                    + "</div></div></div>";


            } else {
                html = "<div class='block game_details underlined_links'>"
                    + "<div class='block_header'><h4>How Long to Beat</h4></div>"
                    + "<div class='block_content'><div class='block_content_inner'><div class='details_block'>" + Localization.str.hltb.no_data + "</div>"
                    // FIXME + "<a class='linkbar' href='//www.enhancedsteam.com/gamedata/hltb_link_suggest.php' id='suggest'>" + Localization.str.hltb.help + " <img src='//store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"
                    + "</div></div></div>";
            }

            document.querySelector("div.game_details").insertAdjacentHTML("afterend", html);

            let suggest = document.querySelector("#suggest");
            if (suggest) { // FIXME consequence of the above FIXME
                suggest.addEventListener("click", function(){
                    LocalData.del("storePageData_" + this.appid);
                });
            }
        });
    };

    AppPageClass.prototype.moveUsefulLinks = function() {
        if (!this.isAppPage()) { return; }

        let usefulLinks = document.querySelector("#ReportAppBtn").parentNode.parentNode;
        usefulLinks.classList.add("es_useful_link");

        let sideDetails = document.querySelector(".es_side_details_wrap");
        if (sideDetails) {
            sideDetails.insertAdjacentElement("afterend", usefulLinks);
        } else {
            document.querySelector("div.rightcol.game_meta_data").insertAdjacentElement("afterbegin", usefulLinks);
        }
    };

    AppPageClass.prototype.addLinks = function() {
        let linkNode = document.querySelector("#ReportAppBtn").parentNode;

        if (SyncedStorage.get("showclient", true)) {
            let cls = "steam_client_btn";
            let url = "steam://url/StoreAppPage/" + this.appid;
            let str = Localization.str.viewinclient;

            linkNode.insertAdjacentHTML("afterbegin",
                `<a class="btnv6_blue_hoverfade btn_medium ${cls}" target="_blank" href="${url}" style="display: block; margin-bottom: 6px;">
                    <span><i class="ico16"></i>&nbsp;&nbsp; ${str}</span></a>`);
        }

        if (SyncedStorage.get("showpcgw", true)) {
            let cls = "pcgw_btn";
            let url = "http://pcgamingwiki.com/api/appid.php?appid=" + this.appid;
            let str = Localization.str.wiki_article.replace("__pcgw__","PCGamingWiki");

            linkNode.insertAdjacentHTML("afterbegin",
                `<a class="btnv6_blue_hoverfade btn_medium ${cls}" target="_blank" href="${url}" style="display: block; margin-bottom: 6px;">
                    <span><i class="ico16"></i>&nbsp;&nbsp; ${str}</span></a>`);
        }

        if (SyncedStorage.get("showsteamcardexchange", true)) {
            if (document.querySelector(".icon img[src$='/ico_cards.png'")) { // has trading cards
                let cls = "cardexchange_btn";
                let url = "http://www.steamcardexchange.net/index.php?gamepage-appid-" + this.appid;
                let str = Localization.str.view_in + ' Steam Card Exchange';

                linkNode.insertAdjacentHTML("afterbegin",
                    `<a class="btnv6_blue_hoverfade btn_medium ${cls}" target="_blank" href="${url}" style="display: block; margin-bottom: 6px;">
                    <span><i class="ico16"></i>&nbsp;&nbsp; ${str}</span></a>`);
            }
        }
    };

    AppPageClass.prototype.addHighlights = function() {
        if (!SyncedStorage.get("highlight_owned", true)) { return; }

        if (document.querySelector(".game_area_already_owned .ds_owned_flag")) {
            document.querySelector(".apphub_AppName").style.color = SyncedStorage.get("highlight_owned_color", "inherit");
        }
    };

    AppPageClass.prototype.addFamilySharingWarning = function() {
        if (!SyncedStorage.get("exfgls", true)) { return; }

        this.data.then(result => {
            if (!result.exfgls || !result.exfgls.excluded) { return; }

            let str = Localization.str.family_sharing_notice;
            document.querySelector("#game_area_purchase").insertAdjacentHTML("beforebegin",
                `<div id="purchase_note"><div class="notice_box_top"></div><div class="notice_box_content">${str}</div><div class="notice_box_bottom"></div></div>`);
        });
    };

    AppPageClass.prototype.addPackageInfoButton = function() {
        if (!SyncedStorage.get("show_package_info", false)) { return; }

        let nodes = document.querySelectorAll(".game_area_purchase_game_wrapper");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            if (node.querySelector(".btn_packageinfo")) { continue; }

            let subid = node.querySelector("input[name=subid]").value;
            if (!subid) { continue; }

            node.querySelector(".game_purchase_action").insertAdjacentHTML("afterbegin",
                `<div class="game_purchase_action_bg"><div class="btn_addtocart btn_packageinfo">
                 <a class="btnv6_blue_blue_innerfade btn_medium" href="//store.steampowered.com/sub/${subid}/"><span>
                 ${Localization.str.package_info}</span></a></div></div>`);
        }
    };

    function addSteamChart(result) {
        if (this.isDlc()) { return; }
        if (!SyncedStorage.get("show_steamchart_info", true)) { return; }
	if (!result.charts || !result.charts.chart || !result.charts.chart.peakall) { return; }

        let appid = this.appid;
        let chart = result.charts.chart;
        let html = '<div id="steam-charts" class="game_area_description"><h2>' + Localization.str.charts.current + '</h2>';
            html += '<div class="chart-content">';
                html += '<div class="chart-stat"><span class="num">' + BrowserHelper.escapeHTML(chart["current"]) + '</span><br>' + Localization.str.charts.playing_now + '</div>';
                html += '<div class="chart-stat"><span class="num">' + BrowserHelper.escapeHTML(chart["peaktoday"]) + '</span><br>' + Localization.str.charts.peaktoday + '</div>';
                html += '<div class="chart-stat"><span class="num">' + BrowserHelper.escapeHTML(chart["peakall"]) + '</span><br>' + Localization.str.charts.peakall + '</div>';
            html += '</div>';
            html += '<span class="chart-footer">Powered by <a href="http://steamcharts.com/app/' + appid + '" target="_blank">SteamCharts.com</a></span>';
            html += '</div>';

        document.querySelector(".sys_req").parentNode.insertAdjacentHTML("beforebegin", html);
    }

    function addSteamSpy(result) {
        if (this.isDlc()) { return; }
        if (!SyncedStorage.get("show_steamspy_info", true)) { return; } // customization setting
        if (!SyncedStorage.get("steamspy", true) || !result.steamspy || !result.steamspy.owners) { return; }

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
        let owners_from = BrowserHelper.escapeHTML(owners[0].trim());
        let owners_to = BrowserHelper.escapeHTML(owners[1].trim());
        let averageTotal = getTimeString(result.steamspy.average_forever);
        let average2weeks = getTimeString(result.steamspy.average_2weeks);

        let html = '<div id="steam-spy" class="game_area_description"><h2>' + Localization.str.spy.player_data + '</h2>';
            html += '<div class="chart-content">';
                html += '<div class="chart-stat"><span class="num">' + owners_from + "<br>" + owners_to + '</span><br>' + Localization.str.spy.owners + '</div>';
                html += '<div class="chart-stat"><span class="num">' + averageTotal + '</span><br>' + Localization.str.spy.average_playtime + '</div>';
                html += '<div class="chart-stat"><span class="num">' + average2weeks + '</span><br>' + Localization.str.spy.average_playtime_2weeks + '</div>';
            html += "</div>";
            html += "<span class='chart-footer' style='padding-right: 13px;'>Powered by <a href='http://steamspy.com/app/" + appid + "' target='_blank'>steamspy.com</a></span>";
            html += "</div>";

        document.querySelector(".sys_req").parentNode.insertAdjacentHTML("beforebegin", html);
    }

    function addSurveyData(result) {
        if (this.isDlc()) { return; }
        if (this.isVideo()) { return; }
        if (!SyncedStorage.get("show_apppage_surveys", true) || !result.survey) { return; }

        let survey = result.survey;
        let appid = this.appid;

        let html = "<div id='performance_survey' class='game_area_description'><h2>" + Localization.str.survey.performance_survey + "</h2>";

        if (survey.success) {
            html += "<p>" + Localization.str.survey.users.replace("__users__", survey["responses"]) + ".</p>";
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
            html += "<p>" + Localization.str.survey.nobody + ".</p>";
        }

        if (document.querySelector(".game_area_already_owned") && document.querySelector(".hours_played")) {
            // FIXME html += "<a class='btnv6_blue_blue_innerfade btn_medium es_btn_systemreqs' href='//enhancedsteam.com/survey/?appid=" + appid + "'><span>" + Localization.str.survey.take + "</span></a>";
        }

        html += "</div>";

        document.querySelector(".sys_req").parentNode.insertAdjacentHTML("beforebegin", html);
    }

    AppPageClass.prototype.addStats = function(){
        if (this.isDlc()) { return; }
        this.data.then(result => {

            addSteamChart.call(this, result);
            addSteamSpy.call(this, result);
            addSurveyData.call(this, result);

        });
    };

    AppPageClass.prototype.addDlcCheckboxes = function() {
        let nodes = document.querySelectorAll(".game_area_dlc_row");
        if (nodes.length == 0) { return; }
        let expandedNode = document.querySelector("#game_area_dlc_expanded");

        if (expandedNode) {
            expandedNode
                .insertAdjacentHTML("afterend", "<div class='game_purchase_action game_purchase_action_bg' style='float: left; margin-top: 4px; margin-bottom: 10px; display: none;' id='es_selected_btn'><div class='btn_addtocart'><a class='btnv6_green_white_innerfade btn_medium'><span>" + Localization.str.add_selected_dlc_to_cart + "</span></a></div></div>");

            document.querySelector(".game_area_dlc_section")
                .insertAdjacentHTML("afterend", "<div style='clear: both;'></div>");
        } else {
            document.querySelector(".gameDlcBlocks")
                .insertAdjacentHTML("afterend", "<div class='game_purchase_action game_purchase_action_bg' style='float: left; margin-top: 4px; display: none;' id='es_selected_btn'><div class='btn_addtocart'><a class='btnv6_green_white_innerfade btn_medium'><span>" + Localization.str.add_selected_dlc_to_cart + "</span></a></div></div>");
        }

        let form = document.createElement("form");
        form.setAttribute("name", "add_selected_dlc_to_cart");
        form.setAttribute("action", "/cart/");
        form.setAttribute("method", "POST");
        form.setAttribute("id", "es_selected_cart");

        let button = document.querySelector("#es_selected_btn");
        button.insertAdjacentElement("beforebegin", form);
        button.addEventListener("click", function(){
            document.querySelector("form[name=add_selected_dlc_to_cart]").submit();
        });

        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];

            if (node.querySelector("input")) {
                let value = node.querySelector("input").value;

                node.querySelector(".game_area_dlc_name")
                    .insertAdjacentHTML("afterbegin", "<input type='checkbox' class='es_dlc_selection' style='cursor: default;' id='es_select_dlc_" + value + "' value='" + value + "'><label for='es_select_dlc_" + value + "' style='background-image: url( " + ExtensionLayer.getLocalUrl("img/check_sheet.png") + ");'></label>");
            } else {
                node.querySelector(".game_area_dlc_name").style.marginLeft = "23px";
            }
        }

        document.querySelector(".game_area_dlc_section .gradientbg")
            .insertAdjacentHTML("afterend", "<div style='height: 28px; padding-left: 15px; display: none;' id='es_dlc_option_panel'></div>");

        document.querySelector("#es_dlc_option_panel")
            .insertAdjacentHTML("afterbegin", `
                <div class='es_dlc_option' id='unowned_dlc_check'>${Localization.str.select.unowned_dlc}</div>
                <div class='es_dlc_option' id='wl_dlc_check'>${Localization.str.select.wishlisted_dlc}</div>
                <div class='es_dlc_option' id='no_dlc_check'>${Localization.str.select.none}</div>
            `);

        document.querySelector("#unowned_dlc_check").addEventListener("click", function () {
            let nodes = document.querySelectorAll(".game_area_dlc_section .game_area_dlc_row:not(.ds_owned) input:not(:checked)");
            for (let i=0, len=nodes.length; i<len; i++) {
                nodes[i].checked = true;
            }
        });

        document.querySelector("#wl_dlc_check").addEventListener("click", function(){
            let nodes = document.querySelectorAll(".game_area_dlc_section .ds_wishlist input:not(:checked)");
            for (let i=0, len=nodes.length; i<len; i++) {
                nodes[i].checked = true;
            }
        });

        document.querySelector("#no_dlc_check").addEventListener("click", function(){
            let nodes = document.querySelectorAll(".game_area_dlc_section .game_area_dlc_row input:checked");
            for (let i=0, len=nodes.length; i<len; i++) {
                nodes[i].checked = false;
            }
        });

        document.querySelector(".game_area_dlc_section .gradientbg")
            .insertAdjacentHTML("beforeend", "<a id='es_dlc_option_button'>" + Localization.str.thewordoptions + " ▾</a>");

        document.querySelector("#es_dlc_option_button").addEventListener("click", function() {
            document.querySelector("#es_dlc_option_panel")
                .classList.toggle("esi-shown");

            let button = document.querySelector("#es_dlc_option_button");

            button.textContent = (button.textContent.match("▾")
                ? Localization.str.thewordoptions + " ▴"
                : Localization.str.thewordoptions + " ▾");
        });

        document.querySelector(".game_area_dlc_section").addEventListener("change", function(e){
            if (!e.target.classList.contains("es_dlc_selection")) { return; }

            let cartNode = document.querySelector("#es_selected_cart");
            cartNode.innerHTML = "<input type=\"hidden\" name=\"action\" value=\"add_to_cart\"><input type=\"hidden\" name=\"sessionid\" value=\"" + User.getSessionId() + "\">"

            let nodes = document.querySelectorAll(".es_dlc_selection:checked");
            for (let i=0, len=nodes.length; i<len; i++) {
                let node = nodes[i];

                let input = document.createElement("input");
                input.setAttribute("type", "hidden");
                input.setAttribute("name", "subid[]");
                input.setAttribute("value", node.value);

                cartNode.insertAdjacentElement("beforeend", input);
            }

            let button = document.querySelector("#es_selected_btn");
            button.style.display = (nodes.length > 0 ? "block" : "none");
        })
    };

    AppPageClass.prototype.addBadgeProgress = function(){
        if (!User.isSignedIn) { return; }
        if (!SyncedStorage.get("show_badge_progress", true)) { return; }
        if (!this.hasCards()) { return; }

        let appid = this.appid;

        document.querySelector("head")
            .insertAdjacentHTML("beforeend", '<link rel="stylesheet" type="text/css" href="//steamcommunity-a.akamaihd.net/public/css/skin_1/badges.css">');

        document.querySelector("#category_block").insertAdjacentHTML("afterend", `
					<div class="block responsive_apppage_details_right heading">
						${Localization.str.badge_progress}
					</div>
					<div class="block">
						<div class="block_content_inner es_badges_progress_block" style="display:none;">
							<div class="es_normal_badge_progress es_progress_block" style="display:none;"></div>
							<div class="es_foil_badge_progress es_progress_block" style="display:none;"></div>
						</div>
					</div>
				`);

        RequestData.getHttp("//steamcommunity.com/my/gamecards/" + this.appid).then(result => {
            loadBadgeContent(".es_normal_badge_progress", result, ".badge_current");
        });

        RequestData.getHttp("//steamcommunity.com/my/gamecards/" + this.appid + "?border=1").then(result => {
            loadBadgeContent(".es_foil_badge_progress", result, ".badge_current");
        });

        function loadBadgeContent(targetSelector, result, selector) {
            let dummy = document.createElement("html");
            dummy.innerHTML = result;
            let badge = dummy.querySelector(selector);
            if (badge) {
                displayBadgeInfo(targetSelector, badge);
            }
        }

        function displayBadgeInfo(targetSelector, badgeNode) {
            let blockSel = document.querySelector(targetSelector);
            blockSel.append(badgeNode);

            if (!badgeNode.querySelector(".friendPlayerLevelNum")) {
                let progress;
                let card_num_owned = badgeNode.querySelectorAll(".badge_detail_tasks .owned").length;
                let card_num_total = badgeNode.querySelectorAll(".badge_detail_tasks .badge_card_set_card").length;
                let progress_text_length = (progress = badgeNode.querySelector(".gamecard_badge_progress")) ? progress.textContent.trim().length : 0;
                let next_level_empty_badge = badgeNode.querySelectorAll(".gamecard_badge_progress .badge_info").length;
                let badge_completed = (progress_text_length > 0 && next_level_empty_badge == 0);
                let show_card_num = (card_num_owned > 0 && progress_text_length === 0) || (card_num_owned > 0 && !badge_completed);
                let is_normal_badge = targetSelector === ".es_normal_badge_progress";

                if (is_normal_badge || (card_num_owned > 0 || !blockSel.querySelector(".badge_empty_circle"))) {
                    document.querySelector(".es_badges_progress_block").style.display='block';
                    blockSel.style.display = "block";

                    let progressBold = badgeNode.querySelector(".progress_info_bold");

                    blockSel.insertAdjacentHTML("beforeend", `
								<div class="es_cards_numbers">
									<div class="es_cards_remaining">${progressBold ? progressBold.textContent : ""}</div>
								</div>
								<div class="game_area_details_specs">
									<div class="icon"><img src="//store.steampowered.com/public/images/v6/ico/ico_cards.png" width="24" height="16" border="0" align="top"></div>
									<a href="//steamcommunity.com/my/gamecards/${ appid + (is_normal_badge ? `/` : `?border=1`) }" class="name">${badge_completed ? Localization.str.view_badge : Localization.str.view_badge_progress}</a>
								</div>
							`);

                    if (show_card_num) {
                        blockSel.querySelector(".es_cards_numbers")
                            .insertAdjacentHTML("beforeend", `
									<div class="es_cards_owned">${Localization.str.cards_owned.replace("__owned__", card_num_owned).replace("__possible__", card_num_total)}</div>
								`);
                    }

                    let last = blockSel.querySelector(".badge_empty_right div:last-child");
                    if (last) {
                        last.classList.add("badge_empty_name");
                        last.style = "";
                        last.textContent = Localization.str.badge_not_unlocked;
                    }
                }
            } else {
                blockSel.remove();
            }
        }
    };


    AppPageClass.prototype.addAstatsLink = function(){
        if (!SyncedStorage.get("showastatslink", true)) { return; }
        if (!this.hasAchievements()) { return; }

        let imgUrl = ExtensionLayer.getLocalUrl("img/ico/astatsnl.png");
        let url = "http://astats.astats.nl/astats/Steam_Game_Info.php?AppID=" + this.appid;

        document.querySelector("#achievement_block").insertAdjacentHTML("beforeend",
            `<div class='game_area_details_specs'>
                      <div class='icon'><img src='${imgUrl}' style='margin-left: 4px; width: 16px;'></div>
                      <a class='name' href='${url}' target='_blank'><span>${Localization.str.view_astats}</span></a>`
            );
    };

    AppPageClass.prototype.addAchievementCompletionBar = function(){
        if (!SyncedStorage.get("showachinstore", true)) { return; }
        if (!this.hasAchievements()) { return; }
        if (!this.isOwned()) { return; }

        let details_block = document.querySelector(".myactivity_block .details_block");
        if (!details_block) return;
        details_block.insertAdjacentHTML("afterend",
            "<link href='//steamcommunity-a.akamaihd.net/public/css/skin_1/playerstats_generic.css' rel='stylesheet' type='text/css'><div id='es_ach_stats' style='margin-bottom: 9px; margin-top: -16px; float: right;'></div>");

        RequestData.getHttp("//steamcommunity.com/my/stats/" + this.appid + "/").then(response => {
            let dummy = document.createElement("html");
            dummy.innerHTML = response;

            let node = document.querySelector("#es_ach_stats");
            node.append(dummy.querySelector("#topSummaryAchievements"));

            document.querySelector("#topSummaryAchievements").style.whiteSpace="nowrap";

            if (!node.innerHTML.match(/achieveBarFull\.gif/)) { return; }

            let barFull = node.innerHTML.match(/achieveBarFull\.gif" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])"/)[1];
            let barEmpty = node.innerHTML.match(/achieveBarEmpty\.gif" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])"/)[1];
            barFull = barFull * .75;
            barEmpty = barEmpty * .75;

            node.innerHTML = node.innerHTML.replace(/achieveBarFull\.gif" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])"/, "achieveBarFull.gif\" width=\"" + BrowserHelper.escapeHTML(barFull.toString()) + "\"");
            node.innerHTML = node.innerHTML.replace(/achieveBarEmpty\.gif" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])"/, "achieveBarEmpty.gif\" width=\"" + BrowserHelper.escapeHTML(barEmpty.toString()) + "\"");
            node.innerHTML = node.innerHTML.replace("::", ":");
        });
    };

    AppPageClass.prototype.customizeAppPage = function(){
        let instance = this;

        let nodes = document.querySelectorAll(".purchase_area_spacer");
        nodes[nodes.length-1].insertAdjacentHTML("beforeend",
            `<link rel='stylesheet' type='text/css' href='//steamstore-a.akamaihd.net/public/css/v6/home.css'>
            <style type='text/css'>body.v6 h2 { letter-spacing: normal; text-transform: none; }</style>
            <div id="es_customize_btn" class="home_actions_ctn" style="margin: 0px;">
                <div class="home_btn home_customize_btn" style="z-index: 13;">${ Localization.str.customize }</div>
                <div class='home_viewsettings_popup'>
                    <div class='home_viewsettings_instructions' style='font-size: 12px;'>${ Localization.str.apppage_sections }</div>
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

        Customizer.addToggleHandler("show_apppage_recentupdates", ".early_access_announcements");
        Customizer.addToggleHandler("show_apppage_reviews", "#game_area_reviews");
        Customizer.addToggleHandler("show_apppage_about", "#game_area_description");
        Customizer.addToggleHandler("show_steamchart_info", "#steam-charts", Localization.str.charts.current, true, function(){
            if (document.querySelector("#steam-charts")) { return; }
            instance.data.then(result => addSteamChart.call(instance, result));
        });
        Customizer.addToggleHandler("show_steamspy_info", "#steam-spy", Localization.str.spy.player_data, true, function(){
            if (document.querySelector("#steam-spy")) { return; }
            instance.data.then(result => addSteamSpy.call(instance, result));
        });
        Customizer.addToggleHandler("show_apppage_surveys", "#performance_survey", Localization.str.survey.performance_survey, true, function(){
            if (document.querySelector("#performance_survey")) { return; }
            instance.data.then(result => addSurveyData.call(instance, result));
        });
        Customizer.addToggleHandler("show_apppage_sysreq", ".sys_req");
        Customizer.addToggleHandler("show_apppage_legal", "#game_area_legal", Localization.str.apppage_legal);

        if (document.querySelector("#recommended_block")) {
            Customizer.addToggleHandler("show_apppage_morelikethis", "#recommended_block", document.querySelector("#recommended_block h2").textContent);
        }
        Customizer.addToggleHandler("show_apppage_recommendedbycurators", ".steam_curators_block");
        if (document.querySelector(".user_reviews_header")) {
            Customizer.addToggleHandler("show_apppage_customerreviews", "#app_reviews_hash", document.querySelector(".user_reviews_header").textContent);
        }
    };

    AppPageClass.prototype.addReviewToggleButton = function() {
        let head = document.querySelector("#review_create h1");
        if (!head) { return; }
        head.insertAdjacentHTML("beforeend", "<div style='float: right;'><a class='btnv6_lightblue_blue btn_mdium' id='es_review_toggle'><span>▲</span></a></div>");

        let reviewSectionNode = document.createElement("div");
        reviewSectionNode.setAttribute("id", "es_review_section");

        let nodes = document.querySelector("#review_container").querySelectorAll("p, .avatar_block, .content");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            reviewSectionNode.append(node);
        }

        head.insertAdjacentElement("afterend", reviewSectionNode);

        function toggleReviews() {
            if (LocalData.get("show_review_section")) {
                document.querySelector("#es_review_toggle span").textContent = "▲";
                document.querySelector("#es_review_section").style.maxHeight = null;
            } else {
                document.querySelector("#es_review_toggle span").textContent = "▼";
                document.querySelector("#es_review_section").style.maxHeight = 0;
            }
        }

        toggleReviews();

        let node = document.querySelector("#review_create");
        if (node) {
            node.addEventListener("click", function(e) {
                if (!e.target.closest("#es_review_toggle")) { return; }
                LocalData.set("show_review_section", LocalData.get("show_review_section", true) ? false : true);
                toggleReviews();
            });
        }
    };

    AppPageClass.prototype.addHelpButton = function() {
        let node = document.querySelector(".game_area_play_stats .already_owned_actions");
        if (!node) { return; }
        node.insertAdjacentHTML("afterend", "<div class='game_area_already_owned_btn'><a class='btnv6_lightblue_blue btnv6_border_2px btn_medium' href='https://help.steampowered.com/wizard/HelpWithGame/?appid=" + this.appid + "'><span>" + Localization.str.get_help + "</span></a></div>");
    };

    AppPageClass.prototype.addPackBreakdown = function() {

        function splitPack(node, ways) {
            let price_text = node.querySelector(".discount_final_price").innerHTML;
            if (price_text == null) { price_text = node.querySelector(".game_purchase_price").innerHTML; }
            if (price_text.match(/,\d\d(?!\d)/)) {
                price_text = price_text.replace(",", ".");
            }
            let price = (Number(price_text.replace(/[^0-9\.]+/g,""))) / ways;
            price = new Price(Math.ceil(price * 100) / 100);

            let buttons = node.querySelectorAll(".btn_addtocart");
            buttons[buttons.length-1].parentNode.insertAdjacentHTML("afterbegin", `
                <div class="es_each_box">
                    <div class="es_each_price">${price}</div>
                    <div class="es_each">${Localization.str.each}</div>
                </div>`);
        }

        let nodes = document.querySelectorAll(".game_area_purchase_game_wrapper");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];

            let title = node.querySelector("h1").textContent.trim();
            title = title.toLowerCase().replace(/-/g, ' ');
            if (!title || !title.includes('pack')) return;
            if (title.includes('pack') && title.includes('season')) return;

            if (title.includes(' 2 pack') && !title.includes('bioshock')) { splitPack.call(node, 2); }
            else if (title.includes(' two pack')) { splitPack.call(node, 2); }
            else if (title.includes('tower wars friend pack')) { splitPack.call(node, 2); }

            else if (title.includes(' 3 pack') && !title.includes('doom 3')) { splitPack.call(node, 3); }
            else if (title.includes(' three pack')) { splitPack.call(node, 3); }
            else if (title.includes('tower wars team pack')) { splitPack.call(node, 3); }

            else if (title.includes(' 4 pack')) { splitPack.call(node, 4); }
            else if (title.includes(' four pack')) { splitPack.call(node, 4); }
            else if (title.includes(' clan pack')) { splitPack.call(node, 4); }

            else if (title.includes(' 5 pack')) { splitPack.call(node, 5); }
            else if (title.includes(' five pack')) { splitPack.call(node, 5); }

            else if (title.includes(' 6 pack')) { splitPack.call(node, 6); }
            else if (title.includes(' six pack')) { splitPack.call(node, 6); }
        }
    };

    return AppPageClass;
})();


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
                ExtensionLayer.runInPageContext('function() { ShowDialog("' + Localization.str.activate_multiple_header + '", \`' + activateModalTemplate.replace("__alreadyentered__", document.querySelector("#product_key").value.replace(/\,/g, "\n")) + '\`); }');
            }
        });

        // Show note input modal
        document.addEventListener("click", function(e){
            if (!e.target.closest("#es_activate_multiple")) { return; }
            ExtensionLayer.runInPageContext('function() { ShowDialog("' + Localization.str.activate_multiple_header + '", \`' + activateModalTemplate.replace("__alreadyentered__", document.querySelector("#product_key").value.replace(/\,/g, "\n")) + '\`); }');
        });

        // Insert the "activate multiple products" button
        document.querySelector("#registerkey_examples_text").insertAdjacentHTML("beforebegin",
            "<a class='btnv6_blue_hoverfade btn_medium' id='es_activate_multiple' style='margin-bottom: 15px;'><span>" + Localization.str.activate_multiple + "</span></a><div style='clear: both;'></div>");

        // Process activation

        document.addEventListener("click", function(e) {
            if (!e.target.closest(".es_activate_modal_submit")) { return; }

            document.querySelector(".es_activate_modal_submit").style.display = "none";
            document.querySelector(".es_activate_modal_close").style.display = "none";

            let keys = [];

            // turn textbox into table to display results
            let lines = document.querySelector("#es_key_input").value.split("\n");
            document.querySelector("#es_activate_input_text").insertAdjacentHTML("beforebegin", "<div id='es_activate_results'></div>");
            document.querySelector("#es_activate_input_text").style.display = "none";

            lines.forEach(line => {
                let attempt = String(line);
                if (attempt === "") { // skip blank rows in the input dialog (including trailing newline)
                    return;
                }
                keys.push(attempt);

                let url = ExtensionLayer.getLocalUrl("img/questionmark.png");

                document.querySelector("#es_activate_results")
                    .insertAdjacentHTML("beforeend", "<div style='margin-bottom: 8px;'><span id='attempt_" + attempt + "_icon'><img src='" + url + "' style='padding-right: 10px; height: 16px;'></span>" + attempt + "</div><div id='attempt_" + attempt + "_result' style='margin-left: 26px; margin-bottom: 10px; margin-top: -5px;'></div>");
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

                let request = RequestData.post("//store.steampowered.com/account/ajaxregisterkey", formData).then(data => {
                    data = JSON.parse(data);
                    let attempted = current_key;
                    let message = Localization.str.register.default;
                    if (data["success"]) {
                        document.querySelector("#attempt_" + attempted + "_icon img").setAttribute("src", ExtensionLayer.getLocalUrl("img/sr/okay.png"));
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
                        document.querySelector("#attempt_" + attempted + "_icon img").setAttribute("src", ExtensionLayer.getLocalUrl("img/sr/banned.png"));
                        document.querySelector("#attempt_" + attempted + "_result").textContent = message;
                        document.querySelector("#attempt_" + attempted + "_result").style.display="block";
                    }

                }, () => {
                    let attempted = current_key;
                    document.querySelector("#attempt_" + attempted + "_icon img").setAttribute("src", ExtensionLayer.getLocalUrl("img/sr/banned.png"));
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
            ExtensionLayer.runInPageContext(function(){ CModal.DismissActiveModal(); });
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
        lastLink.parentNode.insertAdjacentHTML("afterend",
            `<div><a class='account_manage_link' href='https://help.steampowered.com/en/accountdata/AccountSpend'>${Localization.str.external_funds}</a></div>`);
    };

    return AccountPageClass;
})();


let FundsPageClass = (function(){

    function FundsPageClass() {
        this.addCustomMoneyAmount();
    }

    FundsPageClass.prototype.addCustomMoneyAmount = function() {
        let giftcard = document.querySelector(".giftcard_amounts");

        let newel = document.querySelector(giftcard ? ".giftcard_selection" : ".addfunds_area_purchase_game").cloneNode(true);
        let priceel = newel.querySelector((giftcard ? ".giftcard_text" : ".price"));
        let price = priceel.textContent.trim();

        newel.classList.add("es_custom_money");
        if(!giftcard) {
            newel.querySelector(".btnv6_green_white_innerfade").classList.add("es_custom_button");
            newel.querySelector("h1").textContent = Localization.str.wallet.custom_amount;
            newel.querySelector("p").textContent = Localization.str.wallet.custom_amount_text.replace("__minamount__", price);
        } else {
            newel.querySelector(".giftcard_style")
                .innerHTML = Localization.str.wallet.custom_giftcard_amount
                    .replace("__minamount__", price)
                    .replace("__input__", "<span id='es_custom_money_amount_wrapper'></span>");
        }

        let currency = Price.parseFromString(price);

        let inputel = newel.querySelector((giftcard ? "#es_custom_money_amount_wrapper" : ".price"));
        inputel.innerHTML = "<input type='number' id='es_custom_money_amount' class='es_text_input money' min='" + currency.value + "' step='.01' value='" + currency.value +"'>";
        // TODO currency symbol

        document.querySelector((giftcard ? ".giftcard_selection" : ".addfunds_area_purchase_game"))
            .insertAdjacentElement("afterend", newel);

        document.querySelector("#es_custom_money_amount").addEventListener("input", function() {
            let value = document.querySelector("#es_custom_money_amount").value;

            if(!isNaN(value) && value != "") {
                currency.value = value;

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
                    ExtensionLayer.runInPageContext('function(){ submitSelectGiftCard(' + jsvalue + '); }');
                }

            } else {
                let btn = document.querySelector(".es_custom_money .es_custom_button");
                btn.href = "#";
                btn.removeAttribute("onclick");
                btn.dataset.amount = jsvalue;

                ExtensionLayer.runInPageContext('function(){ submitAddFunds(document.querySelector(".es_custom_money .es_custom_button")); }');
            }

        });

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
        this.addHideButtonsToSearch();
        this.observeChanges();
    }

    let processing = false;
    let searchPage = 2;

    function loadSearchResults () {
        if (processing) { return; }
        processing = true;

        let search = document.URL.match(/(.+)\/(.+)/)[2].replace(/\&page=./, "").replace(/\#/g, "&");
        if (!document.querySelector(".LoadingWrapper")) {
            let nodes = document.querySelectorAll(".search_pagination");
            nodes[nodes.length-1].insertAdjacentHTML("beforebegin", '<div class="LoadingWrapper"><div class="LoadingThrobber" style="margin-bottom: 15px;"><div class="Bar Bar1"></div><div class="Bar Bar2"></div><div class="Bar Bar3"></div></div><div id="LoadingText">' + Localization.str.loading + '</div></div>');
        }

        if (search.substring(0,1) === "&") { search = "?" + search.substring(1, search.length); }
        if (search.substring(0,1) !== "?") { search = "?" + search; }

        RequestData.getHttp("//store.steampowered.com/search/results" + search + '&page=' + searchPage + '&snr=es').then(result => {
            let dummy = document.createElement("html");
            dummy.innerHTML = result;

            let addedDate = Date.now();
            document.querySelector('#search_result_container').dataset.lastAddDate = addedDate;

            let lastNode = document.querySelector(".search_result_row:last-child");

            let rows = dummy.querySelectorAll("a.search_result_row");
            for (let i=0, len=rows.length; i<len; i++) {
                let row = rows[i];
                row.dataset.addedDate = addedDate;
                lastNode.insertAdjacentElement("afterend", row);
                lastNode = row;
            }

            document.querySelector(".LoadingWrapper").remove();

            searchPage = searchPage + 1;
            processing = false;

            let inContext = function () {
                let addedDate = document.querySelector('#search_result_container').dataset.lastAddDate;
                GDynamicStore.DecorateDynamicItems(jQuery('.search_result_row[data-added-date="' + addedDate + '"]'));
                SetupTooltips( { tooltipCSSClass: 'store_tooltip'} );
            };

            ExtensionLayer.runInPageContext(inContext);
        }, () => {
            document.querySelector(".LoadingWrapper").remove();
            document.querySelector(".search_pagination:last-child").insertAdjacentHTML("beforebegin", "<div style='text-align: center; margin-top: 16px;' id='es_error_msg'>" + Localization.str.search_error + ". <a id='es_retry' style='cursor: pointer;'>" + Localization.str.search_error_retry + ".</a></div>");

            document.querySelector("es_retry").addEventListener("click", function(e) {
                processing = false;
                document.querySelector("#es_error_msg").remove();
                loadSearchResults();
            });
        });
    }

    SearchPageClass.prototype.endlessScrolling = function() {
        if (!SyncedStorage.get("contscroll", true)) { return; }

        let result_count;
        document.body.insertAdjacentHTML("beforeend", '<link rel="stylesheet" type="text/css" href="//steamstore-a.akamaihd.net/public/css/v6/home.css">');
        document.querySelector(".search_pagination_right").style.display = "none";

        let match = document.querySelector(".search_pagination_left").textContent.trim().match(/(\d+)(?:\D+(\d+)\D+(\d+))?/);
        if (match) {
            result_count = match[2] ? Math.max.apply(Math, match.slice(1, 4)) : match[1];
            document.querySelector(".search_pagination_left").textContent = Localization.str.results.replace("__num__", result_count);
        }

        searchPage = 2;

        window.addEventListener("scroll", function () {
            // if the pagination element is in the viewport, continue loading
            if (BrowserHelper.isElementInViewport(document.querySelector(".search_pagination_left"))) {
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

        document.querySelector("#TagFilter_Container").parentNode.parentNode.insertAdjacentHTML("afterend",
            `<div class='block' id='es_tagfilter_exclude'>
                <div class='block_header'>
                    <div>${Localization.str.exclude_tags}</div>
                 </div>
                 <div class='block_content block_content_inner'>
                    <div style='max-height: 150px; overflow: hidden;' id='es_tagfilter_exclude_container'></div>
                    <input type="text" id="es_tagfilter_exclude_suggest" class="blur es_input_text">
                </div>
            </div>
        `);

        let excludeContainer = document.querySelector("#es_tagfilter_exclude_container");

        //tag numbers from the URL are already in the element with id #tags
        function getTags() {
            let tagsValue = decodeURIComponent(document.querySelector("#tags").value);
            return tagsValue ? tagsValue.split(',') : [];
        }

        for (let i=0, len=tarFilterDivs.length; i<len; i++) {
            let val = tarFilterDivs[i];

            let item_checked = getTags().indexOf("-"+val.dataset.value) > -1 ? "checked" : "";

            let excludeItem = BrowserHelper.htmlToElement(
                `<div class="tab_filter_control ${item_checked}" data-param="tags" data-value="-${val.dataset.value}" data-loc="${val.dataset.loc}">
                    <div class="tab_filter_control_checkbox"></div>
                    <span class="tab_filter_control_label">${val.dataset.loc}</span>
                </div>`);

            excludeItem.addEventListener("click", function(e) {
                let control = e.target.closest(".tab_filter_control")

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
                document.querySelector("#tags").value = rgValues.join(',');
                ExtensionLayer.runInPageContext(function() {AjaxSearchResults();});
            });

            excludeContainer.append(excludeItem);
        }

        ExtensionLayer.runInPageContext(function() {
            $J('#es_tagfilter_exclude_container').tableFilter({ maxvisible: 15, control: '#es_tagfilter_exclude_suggest', dataattribute: 'loc', 'defaultText': jQuery("#TagSuggest")[0].value });
        });

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
        ExtensionLayer.runInPageContext(function() {UpdateTags()});
    };

    function applyPriceFilter(node) {
        let hidePriceAbove = SyncedStorage.get("priceabove_value", false);
        let priceAboveValue = SyncedStorage.get("priceabove_value", "");

        if (hidePriceAbove
            && priceAboveValue !== ""
            && !(Number.isNaN(priceAboveValue))) {

            let html = node.querySelector("div.col.search_price.responsive_secondrow").innerHTML;
            let intern = html.replace(/<([^ >]+)[^>]*>.*?<\/\1>/, "").replace(/<\/?.+>/, "");
            let parsed = new Price(intern.trim());
            if (parsed && parsed.value > priceAboveValue) {
                node.style.display = "none";
            }
        }

        if (BrowserHelper.isElementInViewport(document.querySelector(".search_pagination_left"))) {
            loadSearchResults();
        }
    }

    function addHideButtonsToSearchClick() {
        let nodes = document.querySelectorAll(".search_result_row");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];

            node.style.display = "block";
            if (document.querySelector("#es_owned_games.checked") && node.classList.contains("ds_owned")) { node.style.display = "none"; }
            if (document.querySelector("#es_wishlist_games.checked") && node.classList.contains("ds_wishlist")) { node.style.display = "none"; }
            if (document.querySelector("#es_cart_games.checked") && node.classList.contains("ds_incart")) { node.style.display = "none"; }
            if (document.querySelector("#es_notdiscounted.checked") && !node.querySelector(".search_discount span")) { node.style.display = "none"; }
            if (document.querySelector("#es_notinterested.checked")) { Highlights.highlightNotInterested(node); }
            if (document.querySelector("#es_notmixed.checked") && node.querySelector(".search_reviewscore span.search_review_summary.mixed")) { node.style.display = "none"; }
            if (document.querySelector("#es_notnegative.checked") && node.querySelector(".search_reviewscore span.search_review_summary.negative")) { node.style.display = "none"; }
            if (document.querySelector("#es_notpriceabove.checked")) { applyPriceFilter(node); }
        }
    }

    function validatePrice (priceText, e) {
        if (e.key === "Enter") { return true; }
        priceText += e.key;
        let price = Number(priceText);
        return !(Number.isNaN(price));
    }

    SearchPageClass.prototype.addHideButtonsToSearch = function() {

        document.querySelector("#advsearchform .rightcol").insertAdjacentHTML("afterbegin", `
            <div class='block' id='es_hide_menu'>
                <div class='block_header'><div>` + Localization.str.hide + `</div></div>
                <div class='block_content block_content_inner' style='height: 150px;' id='es_hide_options'>
                    <div class='tab_filter_control' id='es_owned_games'>
                        <div class='tab_filter_control_checkbox'></div>
                        <span class='tab_filter_control_label'>` + Localization.str.options.owned + `</span>
                    </div>
                    <div class='tab_filter_control' id='es_wishlist_games'>
                        <div class='tab_filter_control_checkbox'></div>
                        <span class='tab_filter_control_label'>` + Localization.str.options.wishlist + `</span>
                    </div>
                    <div class='tab_filter_control' id='es_cart_games'>
                        <div class='tab_filter_control_checkbox'></div>
                        <span class='tab_filter_control_label'>` + Localization.str.options.cart + `</span>
                    </div>
                    <div class='tab_filter_control' id='es_notdiscounted'>
                        <div class='tab_filter_control_checkbox'></div>
                        <span class='tab_filter_control_label'>` + Localization.str.notdiscounted + `</span>
                    </div>
                    <div class='tab_filter_control' id='es_notinterested'>
                        <div class='tab_filter_control_checkbox'></div>
                        <span class='tab_filter_control_label'>` + Localization.str.notinterested + `</span>
                    </div>
                    <div class='tab_filter_control' id='es_notmixed'>
                        <div class='tab_filter_control_checkbox'></div>
                        <span class='tab_filter_control_label'>` + Localization.str.mixed_item + `</span>
                    </div>
                    <div class='tab_filter_control' id='es_notnegative'>
                        <div class='tab_filter_control_checkbox'></div>
                        <span class='tab_filter_control_label'>` + Localization.str.negative_item + `</span>
                    </div>
                    <div class='tab_filter_control' id='es_notpriceabove'>
                        <div class='tab_filter_control_checkbox'></div>
                        <span class='tab_filter_control_label'>` + Localization.str.price_above + `</span>
                        <div>
                            <input type="number" id='es_notpriceabove_val' class='es_input_number' step=0.01>
                        </div>
                    </div>
                </div>
                <a class="see_all_expander" href="#" id="es_hide_expander"></a>
            </div>
        `);

        let expander = document.querySelector("#es_hide_expander");
        expander.addEventListener("click", function(e) {
            e.preventDefault();
            ExtensionLayer.runInPageContext(function(){
                ExpandOptions(document.querySelector("#es_hide_expander"), 'es_hide_options')
            });
        });

        let all = document.querySelectorAll(".see_all_expander");
        expander.textContent = all[all.length-1].textContent;

        if (SyncedStorage.get("hide_owned", false)) {
            document.querySelector("#es_owned_games").classList.add("checked");
        }

        if (SyncedStorage.get("hide_wishlist", false)) {
            document.querySelector("#es_wishlist_games").classList.add("checked");
        }

        if (SyncedStorage.get("hide_cart", false)) {
            document.querySelector("#es_cart_games").classList.add("checked");
        }

        if (SyncedStorage.get("hide_notdiscounted", false)) {
            document.querySelector("#es_notdiscounted").classList.add("checked");
        }

        if (SyncedStorage.get("hide_notinterested", false)) {
            document.querySelector("#es_notinterested").classList.add("checked");
        }

        if (SyncedStorage.get("hide_mixed", false)) {
            document.querySelector("#es_notmixed").classList.add("checked");
            document.querySelector("#es_hide_options").style.height="auto";
            document.querySelector("#es_hide_expander").style.display="none";

            let nodes = document.querySelectorAll(".search_result_row span.search_review_summary.mixed");
            for (let i=0, len=nodes.length; i<len; i++) {
                nodes[i].closest(".search_result_row").style.display="none";
            }
        }

        if (SyncedStorage.get("hide_negative", false)) {
            document.querySelector("#es_notnegative").classList.add("checked");
            document.querySelector("#es_hide_options").style.height = "auto";
            document.querySelector("#es_hide_expander").style.display = "none";

            let nodes = document.querySelectorAll(".search_result_row span.search_review_summary.negative");
            for (let i=0, len=nodes.length; i<len; i++) {
                nodes[i].closest(".search_result_row").style.display="none";
            }
        }

        if (SyncedStorage.get("hide_priceabove", false)) {
            document.querySelector("#es_notpriceabove").classList.add("checked");
            document.querySelector("#es_hide_options").style.height = "auto";
            document.querySelector("#es_hide_expander").style.display = "none";

            let nodes = document.querySelectorAll(".search_result_row");
            for (let i=0, len=nodes.length; i<len; i++) {
                applyPriceFilter(nodes[i])
            }
        }

        if (SyncedStorage.get("priceabove_value", "") ) {
            document.querySelector("#es_notpriceabove_val").value = SyncedStorage.get("priceabove_value", "");
        }

        [
            ["#es_owned_games", "hide_owned"],
            ["#es_wishlist_games", "hide_wishlist"],
            ["#es_cart_games", "hide_cart"],
            ["#es_notdiscounted", "hide_notdiscounted"],
            ["#es_notinterested", "hide_notinterested"],
            ["#es_notmixed", "hide_mixed"],
            ["#es_notnegative", "hide_negative"],
            ["#es_notpriceabove", "hide_priceabove"],
        ].forEach(a => {
            document.querySelector(a[0]).addEventListener("click", function(e) {
                let node = document.querySelector(a[0]);
                let value = !node.classList.contains("checked");
                node.classList.toggle("checked", value);
                SyncedStorage.set(a[1], value);
                addHideButtonsToSearchClick();
            });
        });

        document.getElementById("es_notpriceabove").title = Localization.str.price_above_tooltip;

        let elem = document.getElementById("es_notpriceabove_val");
        if (elem !== undefined && elem !== null) {
            elem.title = Localization.str.price_above_tooltip;
            elem.addEventListener("click", function(e) {
                e.stopPropagation()

            });
            elem.addEventListener("keypress", function(e){
                return validatePrice(elem.value, e);
            });
            elem.addEventListener("change", function(e){
                let price = '';
                if(elem.value != ''){
                    price = Number(elem.value);
                    if(Number.isNaN(price)) {
                        price = '';
                    }
                }
                SyncedStorage.set({"priceabove_value": price });
                addHideButtonsToSearchClick()
            });
        }
    };

    SearchPageClass.prototype.observeChanges = function() {

        let observer = new MutationObserver(mutations => {
            Highlights.startHighlightsAndTags();
            EarlyAccess.showEarlyAccess();

            mutations.forEach(mutation => {

                mutation.addedNodes.forEach(node => {

                    if (node.classList && node.classList.contains("search_result_row")) {
                        applyPriceFilter(node);
                    }
                });
            });
        });

        observer.observe(
            document.querySelector("#search_result_container"),
            {childList: true, subtree: true}
        );
    };

    return SearchPageClass;
})();


let WishlistPageClass = (function(){

    let noteModalTemplate;
    let cachedPrices = {};

    function WishlistPageClass() {

        this.notes = SyncedStorage.get("wishlist_notes", {});

        let instance = this;
        let observer = new MutationObserver(function(mutationList){
            mutationList.forEach(record => {
                instance.highlightApps(record.addedNodes);
                instance.addWishlistNotes(record.addedNodes);
                instance.addPriceHandler(record.addedNodes);
            });
        });
        observer.observe(document.querySelector("#wishlist_ctn"), { childList:true });

        this.addStatsArea();
        this.addEmptyWishlistButton();
        this.addWishlistNotesHandlers();

        noteModalTemplate = `<div id="es_note_modal" data-appid="__appid__">
            <div id="es_note_modal_content">
                <div class="newmodal_prompt_with_textarea gray_bevel fullwidth">
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

    function isMyWishlist() {
        if (!User.isSignedIn) { return false; }

        let myWishlistUrl = User.profileUrl.replace("steamcommunity.com/", "store.steampowered.com/wishlist/");
        return window.location.href.startsWith(myWishlistUrl)
            || window.location.href.includes("/profiles/" + User.steamId);
    }

    WishlistPageClass.prototype.highlightApps = async function(nodes) {
        if (!User.isSignedIn) { return; }

        let loginImage = document.querySelector("#global_actions .user_avatar img").getAttribute("src");
        let userImage = document.querySelector(".wishlist_header img").getAttribute("src").replace("_full", "");
        if (loginImage === userImage) { return; }

        await DynamicStore;

        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];

            let appid = Number(node.dataset.appId);

            if (DynamicStore.isOwned(appid)) {
                node.classList.add("ds_collapse_flag", "ds_flagged", "ds_owned");
                if (SyncedStorage.get("highlight_owned", true)) {
                    Highlights.highlightOwned(node);
                } else {
                    node.insertAdjacentHTML("beforeend", '<div class="ds_flag ds_owned_flag">' + Localization.str.library.in_library.toUpperCase() + '&nbsp;&nbsp;</div>');
                }
            }

            if (DynamicStore.isWishlisted(appid)) {
                node.classList.add("ds_collapse_flag", "ds_flagged", "ds_wishlist");

                if (SyncedStorage.get("highlight_wishlist", true)) {
                    Highlights.highlightWishlist(node);
                } else {
                    node.insertAdjacentHTML("beforeend", '<div class="ds_flag ds_owned_flag">' + Localization.str.library.on_wishlist.toUpperCase() + '&nbsp;&nbsp;</div>');
                }
            }
        }
    };

    WishlistPageClass.prototype.addStatsArea = function() {
        let html =
            `<div id="esi-wishlist-chart-content">
                <a>${Localization.str.wl.compute}</a>
             </div>`;

        document.querySelector("#wishlist_ctn").insertAdjacentHTML("beforebegin", html);
        document.querySelector("#esi-wishlist-chart-content a").addEventListener("click", function(e) {
            e.target.parentNode.innerHTML = "<span style='text-align:center;flex-grow:2'>" + Localization.str.loading + "</span>";
            loadStats();
        });
    };

    // Calculate total cost of all items on wishlist
    async function loadStats() {
        let wishlistData = BrowserHelper.getVariableFromDom("g_rgAppInfo", "object");
        if (!wishlistData || Object.keys(wishlistData).length == 0) {
            let pages = BrowserHelper.getVariableFromDom("g_nAdditionalPages", "int");
            let baseUrl = BrowserHelper.getVariableFromDom("g_strWishlistBaseURL", "string");

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
        let totalPrice = new Price(0);
        let totalCount = 0;
        let totalOnSale = 0;
        let totalNoPrice = 0;

        for (let [key, game] of Object.entries(wishlistData)) {
            if (game.subs.length > 0) {
                totalPrice.value += game.subs[0].price / 100;

                if (game.subs[0].discount_pct > 0) {
                    totalOnSale++;
                }
            } else {
                totalNoPrice++;
            }
            totalCount++;
        }

        document.querySelector("#esi-wishlist-chart-content").innerHTML
            = `<div class="esi-wishlist-stat"><span class="num">${totalPrice}</span>${Localization.str.wl.total_price}</div>
                <div class="esi-wishlist-stat"><span class="num">${totalCount}</span>${Localization.str.wl.in_wishlist}</div>
                <div class="esi-wishlist-stat"><span class="num">${totalOnSale}</span>${Localization.str.wl.on_sale}</div>
                <div class="esi-wishlist-stat"><span class="num">${totalNoPrice}</span>${Localization.str.wl.no_price}</div>`;
    }

    WishlistPageClass.prototype.addEmptyWishlistButton = function() {
        if (!isMyWishlist()) { return; }
        if (!SyncedStorage.get("showemptywishlist")) { return; }

        document.querySelector("div.wishlist_header")
            .insertAdjacentHTML("beforeend", "<div id='es_empty_wishlist'><div>" + Localization.str.empty_wishlist + "</div></div>");
        document.querySelector("#es_empty_wishlist div").addEventListener("click", function(e) {
            emptyWishlist();
        });
    };

    function emptyWishlist() {
        ExtensionLayer.runInPageContext(`function(){
            var prompt = ShowConfirmDialog("${Localization.str.empty_wishlist}", \`${Localization.str.empty_wishlist_confirm}\`);
            prompt.done(function(result) {
                if (result == 'OK') {
                    window.postMessage({ type: 'es_empty_wishlist', information: [ true ] }, '*');
                    ShowBlockingWaitDialog("${Localization.str.empty_wishlist}", \`${Localization.str.empty_wishlist_loading}\`);
                }
            });
        }`);

        function removeApp(appid) {

            let formData = new FormData();
            formData.append("sessionid", User.getSessionId());
            formData.append("appid", appid);

            let url = "//store.steampowered.com/wishlist/profiles/" + User.steamId + "/remove/";
            return RequestData.post(url, formData).then(() => {
                let node = document.querySelector(".wishlist-row[data-app-id'"+appid+"']");
                if (node) {
                    node.remove();
                }
            });
        }

        window.addEventListener("message", function(event) {
            if (event.source === window && event.data.type && event.data.type === "es_empty_wishlist") {
                let wishlistData = BrowserHelper.getVariableFromDom("g_rgWishlistData", "array");
                if (!wishlistData) { return; }

                let promises = [];
                for (let i=0; i<wishlistData.length; i++) {
                    let appid = wishlistData[i].appid;
                    promises.push(removeApp(appid));
                }

                Promise.all(promises).finally(() => {
                    DynamicStore.clear();
                    location.reload();
                });
            }
        }, false);
    }

    function addWishlistPrice(node) {
        let appid = node.dataset.appId;

        if (cachedPrices[appid]) {
            addPriceNode(node,"app", appid, cachedPrices[appid]);
            return;
        }

        let prices = new Prices();
        prices.appids = [appid];
        prices.priceCallback = function(type, id, html) { addPriceNode(node, type, id, html); }
        prices.load();
    }

    function addPriceNode(node, type, id, html) {
        if (node.querySelector(".es_lowest_price")) { return; }

        cachedPrices[id] = html;

        node.insertAdjacentHTML("beforeend", html);
        let priceNode = node.querySelector(".es_lowest_price");
        priceNode.style.top = -priceNode.getBoundingClientRect().height + "px";
    }

    function wishlistRowEnterHandler(e) {
        addWishlistPrice(e.target);
    }

    WishlistPageClass.prototype.addPriceHandler = function(nodes){
        if (!SyncedStorage.get("showlowestprice_onwishlist", true)) { return; }

        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            if (!node.dataset.appId) { continue; }

            node.removeEventListener("mouseenter", wishlistRowEnterHandler);
            if (!node.querySelector(".es_lowest_price")) {
                node.addEventListener("mouseenter", wishlistRowEnterHandler);
            }
        }
    };


    WishlistPageClass.prototype.addWishlistNotes =  function(nodes) {
        if (!isMyWishlist()) { return; }

        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            if (node.classList.contains("esi-has-note")) { continue; }

            let noteText = "note";
            let appid = node.dataset.appId;
            if (this.notes[appid]) {
                noteText = this.notes[appid];
            }

            node.querySelector(".lower_columns .addedon").insertAdjacentHTML("beforebegin",
                "<div class='esi-note'>" + noteText + "</div>");
            node.classList.add("esi-has-note");
        }
    };

    WishlistPageClass.prototype.addWishlistNotesHandlers =  function() {
        if (!isMyWishlist()) { return; }

        let instance = this;
        document.addEventListener("click", function(e) {
            if (!e.target.classList.contains("esi-note")) { return; }

            let row = e.target.closest(".wishlist_row");
            let title = row.querySelector("a.title").textContent;
            let appid = row.dataset.appId;
            let note = instance.notes[appid] || "";

            ExtensionLayer.runInPageContext('function() { ShowDialog(`' + Localization.str.note_for + ' ' + title + '`, \`' + noteModalTemplate.replace("__appid__", appid).replace("__note__", note) + '\`); }');
        });

        document.addEventListener("click", function(e) {
            if (e.target.closest(".es_note_modal_submit")) {
                e.preventDefault();

                let modal = e.target.closest("#es_note_modal");
                let appid = modal.dataset.appid;
                let note = BrowserHelper.escapeHTML(document.querySelector("#es_note_input").value.trim().replace(/\s\s+/g, " ").substring(0, 512));

                instance.notes[appid] = note;
                SyncedStorage.set("wishlist_notes", instance.notes);

                document.querySelector(".wishlist_row[data-app-id='"+appid+"'] div.esi-note").textContent = note;
                ExtensionLayer.runInPageContext( function(){ CModal.DismissActiveModal(); } );
            } else if (e.target.closest(".es_note_modal_close")) {
                ExtensionLayer.runInPageContext( function(){ CModal.DismissActiveModal(); } );
            }
        });
    };

    return WishlistPageClass;
})();


let StoreFrontPageClass = (function(){

    function StoreFrontPageClass() {
        this.setHomePageTab();
        this.highlightRecommendations();
        this.customizeHomePage();
    }

    StoreFrontPageClass.prototype.setHomePageTab = function(){
        document.querySelector(".home_tabs_row").addEventListener("click", function(e) {
            let tab = e.target.closest(".tab_content");
            if (!tab) { return; }
            SyncedStorage.set("homepage_tab_last", tab.parentNode.id);
        });

        let setting = SyncedStorage.get("homepage_tab_selection", Defaults.homepage_tab_selection);
        let last = setting;
        if (setting === "remember") {
            last = SyncedStorage.get("homepage_tab_last");
        }
        if (!last) { return; }

        let tab = document.querySelector(".home_tabs_row #"+last);
        if (!tab) { return; }

        tab.click();
    };

    // Monitor and highlight wishlishted recommendations at the bottom of Store's front page
    StoreFrontPageClass.prototype.highlightRecommendations = function() {
        let contentNode = document.querySelector("#content_more");
        if (!contentNode) { return; }

        let observer = new MutationObserver(function(mutations){
            mutations.forEach(mutation => {
                if (!mutation["addedNodes"]) { return; }

                let addedNodes = mutation["addedNodes"];
                for (let i=0; i<addedNodes.length; i++) {
                    let node = addedNodes[i];
                    if (!node.querySelector) { continue; }

                    let wishlistedNode = node.querySelector(".home_content_item.ds_wishlist");
                    if (wishlistedNode) {
                        Highlights.highlightWishlist(wishlistedNode);
                        continue;
                    }

                    wishlistedNode = node.querySelector(".gamelink.ds_wishlist");
                    if (wishlistedNode) {
                        Highlights.highlightWishlist(wishlistedNode.parentNode);
                        continue;
                    }
                }
            });
        });

        observer.observe(contentNode, {childList:true, subtree: true});
    };

    StoreFrontPageClass.prototype.customizeHomePage = function(){

        document.querySelector(".home_page_content").insertAdjacentHTML("beforeend",
            `<div id="es_customize_btn" class="home_actions_ctn" style="margin: -10px 0px;">
                <div class="home_btn home_customize_btn" style="z-index: 13;">${Localization.str.customize}</div>
                <div class='home_viewsettings_popup'>
                    <div class='home_viewsettings_instructions' style='font-size: 12px;'>${Localization.str.apppage_sections}</div>
                </div>
            </div>
            <div style="clear: both;"></div>
        `);

        document.querySelector(".home_page_body_ctn").style.overflow = "visible";
        document.querySelector("#es_customize_btn").addEventListener("click", function(e){
            e.target.classList.toggle("active");
        });

        document.querySelector("body").addEventListener("click", function(e){
            if (e.target.closest("#es_customize_btn")) { return; }
            let node = document.querySelector("#es_customize_btn .home_customize_btn.active");
            if (!node) { return; }
            node.classList.remove("active");
        });

        function homeCtnNode(selector) {
            let node = document.querySelector(selector);
            if (!node) { return null; }
            return node.closest(".home_ctn");
        }

        let nodes = document.querySelectorAll(".home_page_body_ctn .home_ctn");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            let headerNode = node.querySelector(".home_page_content > h2,.carousel_container > h2");
            if (headerNode) {
                let option = Customizer.textValue(headerNode).toLowerCase().replace(/[^a-z]*/g, "");
                if (option !== "") {
                    Customizer.addToggleHandler("show_"+option, node);
                }
            }
        }

        // added by hand, those we couldn't get automatically
        Customizer.addToggleHandler("show_es_discoveryqueue", document.querySelector(".discovery_queue_ctn"));
        Customizer.addToggleHandler("show_es_homepagetabs", homeCtnNode(".home_tab_col"), Localization.str.homepage_tabs);
        Customizer.addToggleHandler("show_es_homepagesidebar", document.querySelector(".home_page_gutter"), Localization.str.homepage_sidebar);
    };

    return StoreFrontPageClass;
})();

let TabAreaObserver = (function(){
    let self = {};

    self.observeChanges = function() {

        let tabAreaNode = document.querySelector(".tabarea");
        if (!tabAreaNode) { return; }

        let observer = new MutationObserver(() => {
            Highlights.startHighlightsAndTags();
            EarlyAccess.showEarlyAccess();
        });

        observer.observe(tabAreaNode, {childList: true, subtree: true});
    };

    return self;
})();

(function(){
    let path = window.location.pathname.replace(/\/+/g, "/");

    SyncedStorage
        .load()
        .finally(() => Promise
            .all([Localization.promise(), User.promise(), Currency.promise()])
            .then(function(values) {

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

            })
    )

})();

