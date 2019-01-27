
let SteamId = (function(){

    let self = {};
    let _steamId = null;

    self.getSteamId = function() {
        if (_steamId) { return _steamId; }

        if (document.querySelector("#reportAbuseModal")) {
            _steamId = document.querySelector("input[name=abuseID]").value;
        } else {
            _steamId = BrowserHelper.getVariableFromDom("g_steamId", "string");
        }

        return _steamId;
    };

    return self;
})();

let ProfileData = (function(){

    let self = {};

    function getLocalDataKey(steamId) {
        return "profile_" + steamId;
    }

    let _promise = null;
    self.promise = function() {
        if (_promise) { return _promise; }

        _promise = new Promise(function(resolve, reject){
            let steamId = SteamId.getSteamId();
            if (!steamId) { reject(); }

            let localDataKey = getLocalDataKey(steamId);
            let data = LocalData.get(localDataKey);

            /* FIXME
            if (data && data.timestamp && !TimeHelper.isExpired(data.timestamp, 24*60*60)) {
                resolve(data.data);
                return;
            }*/

            RequestData.getApi("v01/profile/profile", {profile: steamId}).then(response => {
                if (response && response.result && response.result === "success") {

                    LocalData.set(localDataKey, {
                        timestamp: TimeHelper.timestamp(),
                        data: response.data
                    });

                    resolve(response.data);
                } else {
                    reject();
                }
            }, reject);
        });

        return _promise;
    };

    self.clearOwn = function() {
        if (!User.isSignedIn) { return; }
        LocalData.remove(getLocalDataKey(User.getSteamId()));
    };

    return self;
})();

let ProfileHomePageClass = (function(){

    function ProfileHomePageClass() {
        ProfileData.promise();
        this.addCommunityProfileLinks();
        this.addWishlistProfileLink();
        this.addSupporterBadges();
        this.changeUserBackground();
        this.addProfileStoreLinks();
        this.addSteamRepApi();
        this.addPostHistoryLink();
        this.inGameNameLink();

        /*
        add_custom_profile_links();
        add_twitch_info();
        fix_app_image_not_found();
        hide_spam_comments();
        add_profile_style();
        chat_dropdown_options();
        */
    }

    ProfileHomePageClass.prototype.addCommunityProfileLinks = function() {
        let steamId = SteamId.getSteamId();

        let iconType = "none";
        let images = SyncedStorage.get("show_profile_link_images");
        if (images !== false) {
            iconType = images === "color" ? "color" : "gray";
        }

        let links = [
            {
                "id": "steamrep",
                "link": `//steamrep.com/profiles/${steamId}`,
                "name": "SteamRep",
            },
            {
                "id": "steamdbcalc",
                "link": `//steamdb.info/calculator/?player=${steamId}`,
                "name": "SteamDB",
            },
            {
                "id": "steamgifts",
                "link": `//www.steamgifts.com/go/user/${steamId}`,
                "name": "SteamGifts",
            },
            {
                "id": "steamtrades",
                "link": `//www.steamtrades.com/user/${steamId}`,
                "name": "SteamTrades",
            },
            {
                "id": "astats",
                "link": `//www.achievementstats.com/index.php?action=profile&playerId=${steamId}`,
                "name": "Achievement Stats",
            },
            {
                "id": "backpacktf",
                "link": `//backpack.tf/profiles/${steamId}`,
                "name": "Backpack.tf",
            },
            {
                "id": "astatsnl",
                "link": `//astats.astats.nl/astats/User_Info.php?steamID64=${steamId}`,
                "name": "AStats.nl",
            }
        ];

        // Add "SteamRepCN"
        let language = Language.getCurrentSteamLanguage();
        if (language === "schinese" || language === "tchinese") {
            links.push({
                "id": "steamrepcn",
                "link": `//steamrepcn.com/profiles/${steamId}`,
                "name": (language === "schinese" ? "查看信誉记录" : "確認信譽記錄")
            });
        }

        // Build the links HTML
        let htmlstr = "";

        links.forEach(link => {
            if (!SyncedStorage.get("profile_" + link.id)) { return; }

            htmlstr +=
                `<div class="es_profile_link profile_count_link">
                    <a class="es_sites_icons es_${link.id}_icon es_${iconType}" href="${link.link}" target="_blank">
                        <span class="count_link_label">${link.name}</span>
                    </a>
                </div>`;

        });

        if (SyncedStorage.get("profile_permalink")) {
            let imgUrl = ExtensionLayer.getLocalUrl("img/clippy.svg");
            htmlstr +=
                `<div id="es_permalink_div" class="profile_count_link">
					<span class="count_link_label">${Localization.str.permalink}</span>
					<div class="es_copy_wrap">
						<input id="es_permalink" type="text" value="https://steamcommunity.com/profiles/${steamId}" readonly />
						<button id="es_permalink_copy"><img src="${imgUrl}" /></button>
					</div>
				</div>`;
        }

        // Insert the links HMTL into the page
        if (htmlstr) {
            let linksNode = document.querySelector(".profile_item_links");
            if (linksNode) {
                linksNode.insertAdjacentHTML("beforeend", htmlstr + '<div style="clear: both;"></div>');
            } else {
                let rightColNode = document.querySelector(".profile_rightcol");
                rightColNode.insertAdjacentHTML("beforeend", '<div class="profile_item_links">' + htmlstr + '</div>');
                rightColNode.insertAdjacentHTML("afterend", '<div style="clear: both;"></div>');
            }
        }

        if (SyncedStorage.get("profile_permalink")) {
            document.querySelector("#es_permalink").addEventListener("click", function(e) {
                e.target.select();
            });
            document.querySelector("#es_permalink_copy").addEventListener("click", function(e) {
                document.querySelector("#es_permalink").select();
                document.execCommand('copy');
            });
        }
    };

    ProfileHomePageClass.prototype.addWishlistProfileLink = function() {
        if (document.querySelector("body.profile_page.private_profile")) { return; }
        if (!SyncedStorage.get("show_wishlist_link", Defaults.show_wishlist_link)) { return; }
        if (!document.querySelector(".profile_item_links")) { return; }

        let m = window.location.pathname.match(/(profiles|id)\/[^\/]+/);
        if (!m) { return; }

        document.querySelector(".profile_item_links .profile_count_link").insertAdjacentHTML("afterend",
            `<div id="es_wishlist_link" class="profile_count_link">
                <a href="//store.steampowered.com/wishlist/${m[0]}">
                    <span class="count_link_label">${Localization.str.wishlist}</span>&nbsp;
                    <span id="es_wishlist_count" class="profile_count_link_total"></span>
                </a>
            </div>`);

        if (SyncedStorage.get("show_wishlist_count", Defaults.show_wishlist_count)) {
            if (document.querySelector(".gamecollector_showcase")) {
                let nodes = document.querySelectorAll(".gamecollector_showcase .showcase_stat");
                document.querySelector("#es_wishlist_count").textContent = nodes[nodes.length-1].textContent;
            }
        }
    };

    ProfileHomePageClass.prototype.addSupporterBadges = function() {
        ProfileData.promise().then(data => {
            if (!data) { return; }

            let badgeCount = data["badges"].length;
            if (badgeCount === 0) { return;}

            let html =
                `<div class="profile_badges" id="es_supporter_badges">
                    <div class="profile_count_link">
                        <a href="${Config.PublicHost}">
                            <span class="count_link_label">${Localization.str.es_supporter}</span>&nbsp;
                            <span class="profile_count_link_total">${badgeCount}</span>
                        </a>
                    </div>
                    <div class="profile_count_link_preview">`;


            for (let i=0; i < badgeCount; i++) {
                if (data["badges"][i].link) {
                    html += '<div class="profile_badges_badge" data-tooltip-html="Enhanced Steam<br>' + data["badges"][i].title + '"><a href="' + data["badges"][i].link + '"><img class="badge_icon small" src="' + data["badges"][i].img + '"></a></div>';
                } else {
                    html += '<div class="profile_badges_badge" data-tooltip-html="Enhanced Steam<br>' + data["badges"][i].title + '"><img class="badge_icon small" src="' + data["badges"][i].img + '"></div>';
                }
            }

            html += '</div></div>';

            document.querySelector(".profile_badges").insertAdjacentHTML("afterend", html);

            ExtensionLayer.runInPageContext(function() { SetupTooltips( { tooltipCSSClass: 'community_tooltip'} ); });
        });
    };

    ProfileHomePageClass.prototype.changeUserBackground = function() {
        let prevHash = window.location.hash.match(/#previewBackground\/(\d+)\/([a-z0-9\.]+)/i);

        if (prevHash) {
            let imgUrl = "//steamcdn-a.akamaihd.net/steamcommunity/public/images/items/" + prevHash[1] + "/" + prevHash[2];
            // Make sure the url is for a valid background image
            document.body.insertAdjacentHTML("beforeend", '<img class="es_bg_test" style="display: none" src="' + imgUrl + '" />');
            document.querySelector("img.es_bg_test").addEventListener("load", function() {
                let nodes = document.querySelectorAll(".no_header.profile_page, .profile_background_image_content");
                for (let i=0, len=nodes.length; i<len; i++) {
                    let node = nodes[i];
                    node.style.backgroundImage = "url('"+imgUrl+"')";
                }
                document.querySelector(".es_bg_test").remove();
            });
            return;
        }

        if (document.querySelector(".profile_page.private_profile")) {
            return;
        }

        ProfileData.promise().then("profile", function(data) {
            if (!data.bg) { return; }

            document.querySelector(".no_header").style.backgroundImage = "url(" + BrowserHelper.escapeHTML(data.bg.img) + ")";

            let node = document.querySelector(".profile_background_image_content");
            if (node) {
                node.style.backgroundImage = "url(" + BrowserHelper.escapeHTML(data.bg.img) + ")";
                return;
            }

            document.querySelector(".no_header").classList.add("has_profile_background");
            node = document.querySelector(".profile_content");
            node.classList.add("has_profile_background");
            node.insertAdjacentHTML("afterbegin", '<div class="profile_background_holder_content"><div class="profile_background_overlay_content"></div><div class="profile_background_image_content " style="background-image: url(' + BrowserHelper.escapeHTML(data.img.bg) + ');"></div></div></div>');
        });
    };

    ProfileHomePageClass.prototype.addProfileStoreLinks = function() {
        let nodes = document.querySelectorAll(".game_name .whiteLink");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            let href = node.href.replace("//steamcommunity.com", "//store.steampowered.com");
            node.insertAdjacentHTML("afterend", "<br><a class='whiteLink' style='font-size: 10px;' href=" + href + ">" + Localization.str.visit_store + "</a>");
        }
    };

    ProfileHomePageClass.prototype.addSteamRepApi = function(){
        if (!SyncedStorage.get("showsteamrepapi", Defaults.showsteamcardexchange)) { return; }

        ProfileData.promise().then(data => {
            if (!data.steamrep) { return; }

            let steamrep = data.steamrep;
            if (steamrep.length === 0) { return; }

            let steamId = SteamId.getSteamId();
            if (!steamId) { return; }

            // Build reputation images regexp
            let repimgs = {
                "banned": /scammer|banned/gi,
                "valve": /valve admin/gi,
                "caution": /caution/gi,
                "okay": /admin|middleman/gi,
                "donate": /donator/gi
            };

            // Build SteamRep section
            document.querySelector("div.responsive_status_info").insertAdjacentHTML("beforeend", '<div id="es_steamrep"></div>');

            steamrep.forEach(function(value) {
                if (value.trim() == "") { return; }
                for (let img in repimgs) {
                    if (!repimgs.hasOwnProperty(img)) { continue; }

                    let regex = repimgs[value];
                    if (!value.match(regex)) { continue; }

                    let imgUrl = ExtensionLayer.getLocalUrl(`img/sr/${img}.png`);
                    document.querySelector("#es_steamrep").insertAdjacentHTML("afterend",
                        `<div class="${img}">
                            <img src="${imgUrl}" /> 
                            <a href="https://steamrep.com/profiles/${steamId}" target="_blank"> ${ BrowserHelper.escapeHTML(value) }</a>
                        </div>`);
                    return;
                }
            });
        });
    };

    ProfileHomePageClass.prototype.addPostHistoryLink = function() {
        document.querySelector("#profile_action_dropdown .popup_body .profile_actions_follow")
            .insertAdjacentHTML("afterend",
                "<a class='popup_menu_item' id='es_posthistory' href='" + window.location.pathname + "/posthistory'>" +
                "<img src='//steamcommunity-a.akamaihd.net/public/images/skin_1/icon_btn_comment.png'>&nbsp; " + Localization.str.post_history +
                "</a>");
    };

    ProfileHomePageClass.prototype.inGameNameLink = function() {
        let ingameNode = document.querySelector("input[name='ingameAppID']");
        if (!ingameNode || !ingameNode.value) { return; }

        let tooltip = Localization.str.view_in + ' ' + Localization.str.store;

        let node = document.querySelector(".profile_in_game_name");
        node.innerHTML = '<a data-tooltip-html="' + tooltip + '" href="//store.steampowered.com/app/' + ingameNode.value + '" target="_blank">' + node.textContent + '</a>';
        ExtensionLayer.runInPageContext(function() { SetupTooltips( { tooltipCSSClass: 'community_tooltip'} ); });
    };


    return ProfileHomePageClass;
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

                    // TODO must be last of the profiel pages
                    case /^\/(?:id|profiles)\/.+/.test(path):
                        (new ProfileHomePageClass());
                        break;
/*
                    case /^\/chat\//.test(path):
                        // chat_dropdown_options(true);
                        break;

                    case /^\/(?:id|profiles)\/.+\/\b(home|myactivity|status)\b\/?$/.test(path):
                        start_friend_activity_highlights();
                        bind_ajax_content_highlighting();
                        hide_activity_spam_comments();
                        break;

                    case /^\/(?:id|profiles)\/.+\/edit/.test(path):
                        profileData.clearOwn();
                        profileData.load();
                        add_es_background_selection();
                        add_es_style_selection();
                        break;

                    case /^\/(?:id|profiles)\/.+\/inventory/.test(path):
                        bind_ajax_content_highlighting();
                        inventory_market_prepare();
                        hide_empty_inventory_tabs();
                        keep_ssa_checked();
                        add_inventory_gotopage();
                        break;

                    case /^\/(?:id|profiles)\/(.+)\/games/.test(path):
                        total_time();
                        total_size();
                        add_gamelist_achievements();
                        add_gamelist_sort();
                        add_gamelist_filter();
                        add_gamelist_common();
                        break;

                    case /^\/(?:id|profiles)\/.+\/badges(?!\/[0-9]+$)/.test(path):
                        add_badge_completion_cost();
                        add_total_drops_count();
                        add_cardexchange_links();
                        add_badge_sort();
                        add_badge_filter();
                        add_badge_view_options();
                        break;

                    case /^\/(?:id|profiles)\/.+\/stats/.test(path):
                        add_achievement_sort();
                        break;

                    case /^\/(?:id|profiles)\/.+\/gamecards/.test(path):
                        var gamecard = get_gamecard(path);
                        add_cardexchange_links(gamecard);
                        add_gamecard_market_links(gamecard);
                        add_gamecard_foil_link();
                        add_store_trade_forum_link(gamecard);
                        break;

                    case /^\/(?:id|profiles)\/.+\/friendsthatplay/.test(path):
                        add_friends_that_play();
                        add_friends_playtime_sort();
                        break;

                    case /^\/(?:id|profiles)\/.+\/friends(?:[/#?]|$)/.test(path):
                        add_friends_sort();
                        break;

                    case /^\/(?:id|profiles)\/.+\/tradeoffers/.test(path):
                        add_decline_button();
                        break;
*/
/*
                    case /^\/sharedfiles\/.test(path):
                        hide_spam_comments();
                        media_slider_expander();
                        break;

                    case /^\/workshop\/.test(path):
                        hide_spam_comments();
                        break;

                    case /^\/market\/listings\/.test(path):
                        var appid = get_appid(window.location.host + path);
                        add_sold_amount(appid);
                        add_badge_page_link();
                        add_background_preview_link(appid);

                    case /^\/market\//.test(path):
                        load_inventory().done(function() {
                            highlight_market_items();
                            bind_ajax_content_highlighting();
                        });
                        add_market_total();
                        minimize_active_listings();
                        add_lowest_market_price();
                        keep_ssa_checked();
                        add_market_sort();
                        market_popular_refresh_toggle();
                        break;

                    // case /^\/app\/[^\/]* \/guides/.test(path):
                        remove_guides_language_filter();

                    // case /^\/app\/.* /.test(path):
                        var appid = get_appid(window.location.host + path);
                        add_app_page_wishlist(appid);
                        hide_spam_comments();
                        add_steamdb_links(appid, "gamehub");
                        send_age_verification();
                        break;

                    // case /^\/games\/.* /.test(path):
                        var appid = document.querySelector( 'a[href*="' + protocol + '//steamcommunity.com/app/"]' );
                        appid = appid.href.match( /(\d)+/g );
                        add_steamdb_links(appid, "gamegroup");
                        break;

                    // case /^\/tradingcards\/boostercreator/.test(path):
                        add_booster_prices();
                        break;

                    // case /^\/$/.test(path):
                        hide_spam_comments();
                        hide_trademark_symbols(true);
                        break;
*/
                }
            })
    )

})();

