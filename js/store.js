
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
    }

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
                        let appPage = new AppPageClass(window.location.host + path)
                        appPage.mediaSliderExpander();
                        appPage.initHdPlayer();
                        appPage.addWishlistRemove();
                        appPage.addCoupon();
                        appPage.addPrices();

/*
                        display_coupon_message(appid);
                        show_pricing_history(appid, "app");
                        dlc_data_from_site(appid);

                        drm_warnings("app");
                        add_metacritic_userscore();
                        add_opencritic_data(appid);
                        display_purchase_date();

                        add_widescreen_certification(appid);
                        add_hltb_info(appid);
                        add_steam_client_link(appid);
                        add_pcgamingwiki_link(appid);
                        add_steamcardexchange_link(appid);
                        add_app_page_highlights();
                        add_steamdb_links(appid, "app");
                        add_familysharing_warning(appid);
                        add_dlc_page_link(appid);
                        add_pack_breakdown();
                        add_package_info_button();
                        add_steamchart_info(appid);
                        add_steamspy_info(appid);
                        survey_data_from_site(appid);
                        add_system_requirements_check(appid);
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

