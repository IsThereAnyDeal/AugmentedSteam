
let AgeCheck = (function(){

    let self = {};

    self.sendVerification = function(){
        if (!SyncedStorage.get("send_age_info", true)) { return; }

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


let AppPageClass = (function(){

    function AppPageClass(url) {
        this.appid = GameId.getAppid(url);
        let metalinkNode = document.querySelector("#game_area_metalink a");
        this.metalink = metalinkNode && metalinkNode.getAttribute("href");

        this.data = this.storePageDataPromise();
        this.appName = document.querySelector(".apphub_AppName").textContent;
    }

    AppPageClass.prototype.isApp = function() {
        return true;
    };

    AppPageClass.prototype.isDlc = function() {
        return document.querySelector("div.game_area_dlc_bubble") ? true : false;
    };

    AppPageClass.prototype.isVideo = function() {
        return document.querySelector(".game_area_purchase_game .streamingvideo") ? true : false;
    };

    AppPageClass.prototype.mediaSliderExpander = function() {
        let detailsBuild = false;
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

        // FIXME media slider not finished
    };

    AppPageClass.prototype.initHdPlayer = function() {
        // FIXME
    };

    AppPageClass.prototype.storePageDataPromise = function() {
        let appid = this.appid;
        return new Promise(function(resolve, reject) {
            let cache = LocalData.get("storePageData_" + appid);

            if (cache && cache.data && !TimeHelper.isExpired(cache.updated, 3600)) {
                resolve(cache.data);
                return;
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

            Request.getApi("v01/storepagedata", apiparams)
                .then(function(response) {
                    if (response && response.result && response.result === "success") {
                        LocalData.set("storePageData_" + appid, {
                            data: response.data,
                            updated: Date.now(),
                        });
                        resolve(response.data);
                    } else {
                        reject();
                    }
                }, reject);
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


                Request.post("//store.steampowered.com/api/removefromwishlist", {
                    sessionid: User.getSessionId(),
                    appid: appid
                }, {withCredentials: true}).then(response => {
                    document.querySelector("#add_to_wishlist_area").style.display = "inline";
                    document.querySelector("#add_to_wishlist_area_success").style.display = "none";

                    // Clear dynamicstore cache
                    /* // FIXME DynamicStore
                    chrome.storage.local.remove("dynamicstore");
                    */

                    // Invalidate dynamic store data cache
                    ExtensionLayer.runInPageContext("function(){ GDynamicStore.InvalidateCache(); }");
                }).finally(() => {
                    parent.classList.remove("loading");
                });
            }
        });

        /* // FIXME clear dynamic store
        $("#add_to_wishlist_area, #add_to_wishlist_area_success, .queue_btn_ignore").on("click", function(){
            // Clear dynamicstore cache
            chrome.storage.local.remove("dynamicstore");
        });
        */
    };

    AppPageClass.prototype.getFirstSubid = function() {
        let node = document.querySelector("div.game_area_purchase_game input[name=subid]");
        return node && node.value;
    };

    AppPageClass.prototype.addCoupon = function() {
        let inst = this;
        Inventory.promise().then(() => {

            console.log(inst.getFirstSubid());

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

    AppPageClass.prototype.addPrices = function() {
        if (!SyncedStorage.get("showlowestprice", true)) { return; }

        let apiParams = {};

        if (!SyncedStorage.get("showallstores", true) && SyncedStorage.get("stores", []).length > 0) {
            apiParams.stores = SyncedStorage.get("stores", []).join(",");
        }

        let cc = User.getCountry();
        if (cc) {
            apiParams.cc = cc;
        }

        let subids = [];
        let nodes = document.querySelectorAll("input[name=subid]");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            subids.push(node.value);
        }
        apiParams.subs = subids.join(",");

        let bundleids = [];
        nodes = document.querySelectorAll(".game_area_purchase_game_wrapper[data-ds-bundleid]");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            bundleids.push(node.dataset['dsBundleid']);
        }
        apiParams.bundleids = bundleids.join(",");

        if (SyncedStorage.get("showlowestpricecoupon", true)) {
            apiParams.coupon = true;
        }

        Request.getApi("v01/prices", apiParams).then(response => {
            if (!response || response.result !== "success") { return; }

            let bundles = [];

            for (let gameid in response.data.data) {
                if (!response.data.data.hasOwnProperty(gameid)) { continue; }

                let a = gameid.split("/");
                let type = a[0];
                let id = a[1];
                let meta = response.data['.meta'];
                let info = response.data.data[gameid];

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
                    let node;
                    if (type === "sub") {
                        node = document.querySelector("input[name=subid][value='"+id+"']").parentNode.parentNode.parentNode;
                    } else if (type === "bundle") {
                        node = document.querySelector(".game_area_purchase_game_wrapper[data-ds-bundleid='"+id+"']");
                    }

                    node.insertAdjacentHTML("afterbegin", html + "<div>" + line1 + "</div><div>" + line2 + "</div>" + line3);
                    document.querySelector("#es_line_chart_"+id).style.top = ((document.querySelector("#es_price_"+id).offsetHeight - 20) / 2) + "px";
                }

                // add bundles
                if (info["bundles"]["live"].length > 0) {
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

                        if (bundles.indexOf(bundle_normalized) >= 0) { continue; }
                        bundles.push(bundle_normalized);

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
                        }
                        purchase += '</div>';

                        purchase += '<div class="btn_addtocart">';
                        purchase += '<a class="btnv6_green_white_innerfade btn_medium" href="' + bundle["url"] + '" target="_blank">';
                        purchase += '<span>' + Localization.str.buy + '</span>';
                        purchase += '</a></div></div></div></div>';

                        document.querySelector("#game_area_purchase")
                            .insertAdjacentHTML("afterend", "<h2 class='gradientbg'>" + Localization.str.bundle.header + " <img src='http://store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></h2>" + purchase);
                    }
                }
            }
        });
    };

    AppPageClass.prototype.addDlcInfo = function() {
        if (!this.isDlc()) { return; }

        Request.getApi("v01/dlcinfo", {appid: this.appid, appname: encodeURIComponent(this.appName)}).then(response => {
            console.log(response);
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

    AppPageClass.prototype.addDrmWarnings = function() {
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
        if (this.appid === 21690) { drm = false; } // Resident Evil 5, at Capcom's request

        if (drm) {
            let stringType = this.isApp() ? Localization.str.drm_third_party : Localization.str.drm_third_party_sub;

            let node = document.querySelector("#game_area_purchase .game_area_description_bodylabel");
            if (node) {
                node.insertAdjacentHTML("afterend", '<div class="game_area_already_owned es_drm_warning"><span>' + stringType + ' ' + drmString + '</span></div>')
            } else {
                document.querySelector("#game_area_purchase").insertAdjacentHTML("afterbegin", '<div class="game_area_already_owned es_drm_warning"><span>' + stringType + ' ' + drmString + '</span></div>');
            }
        }
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
                    + "<a class='linkbar' href='//www.enhancedsteam.com/gamedata/hltb_link_suggest.php' id='suggest'>" + Localization.str.hltb.help + " <img src='//store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"
                    + "</div></div></div>";
            }

            document.querySelector("div.game_details").insertAdjacentHTML("afterend", html);

            document.querySelector("#suggest").addEventListener("click", function(){
                LocalData.del("storePageData_" + this.appid);
            });
        });
    };

    AppPageClass.prototype.moveUsefulLinks = function() {
        if (!this.isApp()) { return; }

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

    AppPageClass.prototype.addSteamDb = function(type) {
        if (!SyncedStorage.get("showsteamdb", true)) { return; }

        let bgUrl = ExtensionLayer.getLocalUrl("img/steamdb_store.png");

        // TODO this should be refactored elsewhere probably
        switch (type) {
            case "app": {
                let cls = "steamdb_ico";
                let url = "//steamdb.info/app/" + this.appid;
                let str = Localization.str.view_in + ' Steam Database';

                document.querySelector("#ReportAppBtn").parentNode.insertAdjacentHTML("afterbegin",
                    `<a class="btnv6_blue_hoverfade btn_medium ${cls}" target="_blank" href="${url}" style="display: block; margin-bottom: 6px;">
                        <span><i class="ico16"></i>&nbsp;&nbsp; ${str}</span></a>`);
            }
                break;
            case "sub": {
                let cls = "steamdb_ico";
                let url = "//steamdb.info/sub/" + this.appid;
                let str = Localization.str.view_in + ' Steam Database';

                document.querySelector(".share").parentNode.insertAdjacentHTML("afterbegin",
                    `<a class="btnv6_blue_hoverfade btn_medium ${cls}" target="_blank" href="${url}" style="display: block; margin-bottom: 6px;">
                        <span><i class="ico16"></i>&nbsp;&nbsp; ${str}</span></a>`);
                }
                break;
            case "bundle": {
                let cls = "steamdb_ico";
                let url = "//steamdb.info/bundle/" + this.appid;
                let str = Localization.str.view_in + ' Steam Database';

                document.querySelector(".share").parentNode.insertAdjacentHTML("afterbegin",
                    `<a class="btnv6_blue_hoverfade btn_medium ${cls}" target="_blank" href="${url}" style="display: block; margin-bottom: 6px;">
                            <span><i class="ico16"></i>&nbsp;&nbsp; ${str}</span></a>`);
            }
                break;
            case "gamehub":
                document.querySelector(".apphub_OtherSiteInfo").insertAdjacentHTML("beforeend",
                    `<a class="btnv6_blue_hoverfade btn_medium steamdb_ico" target="_blank" href="//steamdb.info/app/${this.appid}/"><span><i class="ico16" style="background-image:url('${bgUrl}')"></i>&nbsp; Steam Database</span></a>`);
                break;
            case "gamegroup":
                document.querySelector("#rightActionBlock").insertAdjacentHTML("beforeend",
                    `<div class="actionItemIcon"><img src="${bgUrl}" width="16" height="16" alt=""></div><a class="linkActionMinor" target="_blank" href="//steamdb.info/app/' + appid + '/">${Localization.str.view_in} Steam Database</a>`);
                break;
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
        if (false && !SyncedStorage.get("show_package_info", false)) { return; } // FIXME

        let nodes = document.querySelectorAll(".game_area_purchase_game_wrapper");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            if (node.querySelector(".btn_packageinfo")) { continue; }

            let subid = node.querySelector("input[name=subid].value");

            node.querySelector(".game_purchase_action").insertAdjacentHTML("afterbegin",
                `<div class="game_purchase_action_bg"><div class="btn_addtocart btn_packageinfo">
                 <a class="btnv6_blue_blue_innerfade btn_medium" href="//store.steampowered.com/sub/${subid}/"><span>
                 ${Localization.str.package_info}</span></a></div></div>`);
        }
    };

    function addSteamChart(result) {
        if (!SyncedStorage.get("show_steamchart_info", true) || !result.charts || !result.charts.chart) { return; }

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
        if (!SyncedStorage.get("show_appage_surveys", true) || !result.survey) { return; }
        if (this.isVideo()) { return; }

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
            html += "<a class='btnv6_blue_blue_innerfade btn_medium es_btn_systemreqs' href='//enhancedsteam.com/survey/?appid=" + appid + "'><span>" + Localization.str.survey.take + "</span></a>";
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
        let expandedNode = document.querySelector("#game_area_dlc_expanded");

        if (expandedNode) {
            expandedNode
                .insertAdjacentHTML("afterend", "<div class='game_purchase_action game_purchase_action_bg' style='float: left; margin-top: 4px; margin-bottom: 10px; display: none;' id='es_selected_btn'><div class='btn_addtocart'><a class='btnv6_green_white_innerfade btn_medium'><span>" + Localization.str.add_selected_dlc_to_cart + "</span></a></div></div>");

            document.querySelector(".game_area_dlc_section")
                .insertAdjacentElement("<div style='clear: both;'></div>");
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
        })

        let nodes = document.querySelectorAll(".game_area_dlc_row");
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

    return AppPageClass;
})();


(function(){
    let path = window.location.pathname.replace(/\/+/g, "/");

    console.log("Running store");

    SyncedStorage
        .load()
        .finally(() => Promise
            .all([Localization.promise(), User.promise(), Currency.promise()])
            .then(function(values) {
                console.log("ES loaded");

                ProgressBar.create();
                EnhancedSteam.checkVersion();
                EnhancedSteam.addMenu();
                EnhancedSteam.addLanguageWarning();
                EnhancedSteam.removeInstallSteamButton();
                EnhancedSteam.removeAboutMenu();
                EnhancedSteam.addHeaderLinks();
                EarlyAccess.showEarlyAccess();
                EnhancedSteam.disableLinkFilter();

                if (User.isSignedIn) {
                    EnhancedSteam.addRedeemLink();
                    EnhancedSteam.replaceAccountName();
                    EnhancedSteam.launchRandomButton();
                    // TODO add itad sync
                }

                // FIXME this should have better check for log out, not just logout link click
                // $('a[href$="javascript:Logout();"]').bind('click', clear_cache);

                // end of common part


                switch (true) {
                    case /\bagecheck\b/.test(path):
                        AgeCheck.sendVerification();
                        break;

                    case /^\/app\/.*/.test(path):
                        let appPage = new AppPageClass(window.location.host + path);
                        appPage.mediaSliderExpander();
                        appPage.initHdPlayer();
                        appPage.addWishlistRemove();
                        appPage.addCoupon();
                        appPage.addPrices();
                        appPage.addDlcInfo();

                        appPage.addDrmWarnings();
                        appPage.addMetacriticUserScore();
                        appPage.addOpenCritic();
                        appPage.displayPurchaseDate();

                        appPage.addWidescreenCertification();

                        appPage.addHltb();

                        appPage.moveUsefulLinks();
                        appPage.addLinks();
                        appPage.addSteamDb("app");
                        appPage.addHighlights();
                        appPage.addFamilySharingWarning();

                        appPage.addPackageInfoButton();
                        appPage.addStats();

                        appPage.addDlcCheckboxes();
/*
                        add_pack_breakdown();
                        add_app_badge_progress(appid);
                        add_dlc_checkboxes();
                        add_astats_link(appid);
                        add_achievement_completion_bar(appid);

                        show_regional_pricing("app");
                        add_review_toggle_button();

                        customize_app_page(appid);
                        add_help_button(appid);
                        skip_got_steam();

                        if (language == "schinese" || language == "tchinese") {
                            storePageDataCN.load(appid);
                            add_keylol_link();
                            add_steamcn_mods();
                            if (language == "schinese") add_chinese_name();
                        }

                        */
                        break;
                }


            })
    )

})();

