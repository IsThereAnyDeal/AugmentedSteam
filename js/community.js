
let SteamId = (function(){

    let self = {};
    let _steamId = null;

    self.getSteamId = function() {
        if (_steamId) { return _steamId; }

        if (document.querySelector("#reportAbuseModal")) {
            _steamId = document.querySelector("input[name=abuseID]").value;
        } else {
            _steamId = BrowserHelper.getVariableFromDom("g_steamID", "string");
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
        LocalData.del(getLocalDataKey(User.steamId));
    };

    return self;
})();

let SpamCommentHandler = (function(){

    let spamRegex = null;

    function toggleHiddenCommentsButton(threadNode, count) {
        threadNode.classList.add("esi_commentthread");

        let button = threadNode.querySelector(".esi_commentthread_button");

        if (count === 0) {
            if (button) {
                button.classList.add("esi-hidden");
            }
            return;
        }

        if (!button) {
            button = document.createElement("a");
            button.classList.add("esi_commentthread_button");
            threadNode.insertAdjacentElement("afterbegin", button);

            button.addEventListener("click", function() {
                threadNode.classList.add("esi_commentthread--showspam")
            });
        }

        button.classList.remove("esi-hidden");
        button.textContent = Localization.str.spam_comment_show.replace("__num__", count);
        threadNode.classList.remove("esi_commentthread--showspam");
    }

    function addCommentThreadObserver(threadNode) {
        if (threadNode.dataset.esiCommentObserver) { return; }
        threadNode.dataset.esiCommentObserver = "1";

        let observer = new MutationObserver(() => {
            updateCommentThread(threadNode);
        });
        observer.observe(threadNode.querySelector(".commentthread_comments"), { childList: true });
    }

    function hideSpamComments(threadNode) {
        let nodes = threadNode.querySelectorAll(".commentthread_comment .commentthread_comment_text");
        let hiddenCount = 0;
        for (let node of nodes) {
            let commentText = node.textContent;
            if (!spamRegex.test(commentText)) { continue; }

            node.closest(".commentthread_comment").classList.add("esi_comment_hidden");
            hiddenCount++;
        }

        return hiddenCount;
    }

    function updateCommentThread(node) {
        let countHidden = hideSpamComments(node);
        toggleHiddenCommentsButton(node, countHidden);
    }

    function handleAllCommentThreads(parent) {
        let nodes = parent.querySelectorAll(".commentthread_comment_container:not(.esi_commentthread)");
        for (let node of nodes) {
            updateCommentThread(node);
            addCommentThreadObserver(node);
        }
    }

    let self = {};

    self.hideSpamComments = function() {
        if (!SyncedStorage.get("hidespamcomments", Defaults.hidespamcomments)) { return; }

        spamRegex = new RegExp(SyncedStorage.get("spamcommentregex", Defaults.spamcommentregex), "i");

        handleAllCommentThreads(document);

        // modal content
        // TODO(tomas.fedor) this should be handled in apphub page
        let modalWait = document.querySelector("#modalContentWait");
        if (!modalWait) { return; }

        let observer = new MutationObserver(mutation => {
            let modalContainer = document.querySelector("#modalContentFrameContainer");
            if (!modalContainer) { return; }

            let latestFrame = window.frames[window.frames.length-1]; // tomas.fedor Only check latest added frame
            handleAllCommentThreads(latestFrame.document);
        });
        observer.observe(modalWait, {attributes: true});
    };

    return self;
})();

let CommunityCommon = (function() {
    let self = {};

    self.addCardExchangeLinks = function(game) {
        if (!SyncedStorage.get("steamcardexchange", Defaults.steamcardexchange)) { return; }

        let nodes = document.querySelectorAll(".badge_row");
        for (let node of nodes) {
            let appid = game || GameId.getAppidFromGameCard(node.querySelector(".badge_row_overlay").href);
            if(!appid) { continue; }

            node.insertAdjacentHTML("afterbegin",
                `<div class="es_steamcardexchange_link">
                    <a href="http://www.steamcardexchange.net/index.php?gamepage-appid-${appid}" target="_blank" title="Steam Card Exchange">
                        <img src="${ExtensionLayer.getLocalUrl('img/ico/steamcardexchange.png')}" width="24" height="24" border="0" alt="Steam Card Exchange" />
                    </a>
                </div>`);

            node.querySelector(".badge_title_row").style.paddingRight = "44px";
        }
    };

    return self;
})();

let ProfileActivityPageClass = (function(){

    function ProfileActivityPageClass() {
        this.highlightFriendsActivity();

        // TODO this is called from Common, refactor Early Access so it
        // doesn't trying to resolve where we are at, instead page should tell it what nodes to check
        // EarlyAccess.showEarlyAccess();

        this.observeChanges();
    }

    ProfileActivityPageClass.prototype.highlightFriendsActivity = async function() {
        await DynamicStore;

        // Get all appids and nodes from selectors
        let nodes = document.querySelectorAll(".blotter_block:not(.es_highlight_checked)");
        for (let node of nodes) {
            node.classList.add("es_highlight_checked");

            let links = node.querySelectorAll("a:not(.blotter_gamepurchase_logo)");
            for (let link of links) {
                let appid = GameId.getAppid(link.href);
                if (!appid) { continue; }

                // TODO (tomas.fedor) refactor following checks to a class, this way we'll easily forget how exactly do we store them or where
                if (LocalData.get(appid + "guestpass")) {
                    Highlights.highlightInvGuestpass(link);
                }
                if (LocalData.get("couponData_" + appid)) {
                    Highlights.highlightCoupon(link);
                }
                if (LocalData.get(appid + "gif")) {
                    Highlights.highlightInvGift(link);
                }

                if (DynamicStore.isWishlisted(appid)) {
                    Highlights.highlightWishlist(link);
                }

                if (DynamicStore.isOwned(appid)) {
                    Highlights.highlightOwned(link);

                    addAchievementComparisonLink(link, appid);
                }

                // TODO (tomas.fedor) this behaves differently than other highlights - check is being done in highlight method
                Highlights.highlightNotInterested(link);
            }
        }
    };

    function addAchievementComparisonLink(node, appid) {
        if (!SyncedStorage.get("showcomparelinks", Defaults.showcomparelinks)) { return; }
        node.classList.add("es_achievements");

        let blotter = node.closest(".blotter_daily_rollup_line");
        if (!blotter) { return; }

        let friendProfileUrl = blotter.querySelector("a[data-miniprofile]").href;
        let compareLink = friendProfileUrl + "/stats/" + appid + "/compare/#es-compare";
        node.parentNode.insertAdjacentHTML("beforeend",
            `<br><a class='es_achievement_compare' href='${compareLink}' target='_blank'>${Localization.str.compare}</a>`);
    }

    ProfileActivityPageClass.prototype.observeChanges = function() {
        let that = this;
        let observer = new MutationObserver(() => {
            that.highlightFriendsActivity();
            EarlyAccess.showEarlyAccess();
            SpamCommentHandler.hideSpamComments();
        });

        observer.observe(document.querySelector("#blotter_content"), { subtree: true, childList: true });
    };

    return ProfileActivityPageClass;
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
        this.addProfileStyle();

        /*
        add_twitch_info();
        hide_spam_comments();
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

        // custom profile link
        if (SyncedStorage.get("profile_custom")
            && SyncedStorage.get("profile_custom_url")
            && SyncedStorage.get("profile_custom_icon")
            && SyncedStorage.get("profile_custom_name")) {

            let customUrl = SyncedStorage.get("profile_custom_url");
            if (!customUrl.includes("[ID]")) {
                customUrl += "[ID]";
            }

            let customName = SyncedStorage.get("profile_custom_name");
            let customIcon = SyncedStorage.get("profile_custom_icon");

            let name = customName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
            let link = "//" + customUrl.replace("[ID]", steamId).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
            let icon = "//" + customIcon.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

            htmlstr +=
                `<div class="es_profile_link profile_count_link">
                    <a class="es_sites_icons es_none es_${icon_type}" href="${link}" target="_blank">
                    <span class="count_link_label">${name}</span>`;
                    if (iconType !== "none") {
                        htmlstr += `<i class="es_sites_custom_icon" style="background-image: url(${icon});"></i>`;
                    }
                    htmlstr += `</a>
                </div>`;
        }

        // profile permalink
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
                for (let [img, regex] of Object.entries(repimgs)) {
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
        let node = document.querySelector("#profile_action_dropdown .popup_body .profile_actions_follow");
        if (!node) { return; }
        node.insertAdjacentHTML("afterend",
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

    ProfileHomePageClass.prototype.addProfileStyle = function() {
        if (document.querySelector("body.profile_page.private_profile")) { return; }

        ProfileData.promise().then(data => {
            if (!data || !data.style) { return; }

            let style = data.style;
            let availableStyles = ["clear", "green", "holiday2014", "orange", "pink", "purple", "red", "teal", "yellow", "blue"];
            if (availableStyles.indexOf(style) === -1) { return; }

            document.body.classList.add("es_profile_style");
            switch (style) {
                case "holiday2014":
                    document.querySelector("head")
                        .insertAdjacentHTML("beforeend", "<link rel='stylesheet' type='text/css' href='//steamcommunity-a.akamaihd.net/public/css/skin_1/holidayprofile.css'>");

                    document.querySelector(".profile_header_bg_texture").insertAdjacentHTML("beforeend", "<div class='holidayprofile_header_overlay'></div>");
                    document.querySelector(".profile_page").classList.add("holidayprofile");

                    let script = document.createElement("script");
                    script.type = "text/javascript";
                    script.src = "https://steamcommunity-a.akamaihd.net/public/javascript/holidayprofile.js";
                    document.body.append(script);

                    script.addEventListener("load", function(){
                        ExtensionLayer.runInPageContext("function() { StartAnimation(); }");
                    });

                    break;
                case "clear":
                    document.body.classList.add("es_style_clear");
                    break;
                default:
                    let styleUrl = ExtensionLayer.getLocalUrl("img/profile_styles/" + style + "/style.css");
                    let headerImg = ExtensionLayer.getLocalUrl("img/profile_styles/" + style + "/header.jpg");
                    let showcase = ExtensionLayer.getLocalUrl("img/profile_styles/" + style + "/showcase.png");

                    document.querySelector("head").insertAdjacentHTML("beforeend", "<link rel='stylesheet' type='text/css' href='" + styleUrl + "'>");
                    document.querySelector(".profile_header_bg_texture").style.backgroundImage = "url('" + headerImg + "')";
                    document.querySelector(".profile_customization").style.backgroundImage = "url('" + showcase + "')";
                    break;
            }
        });
    };


    return ProfileHomePageClass;
})();

let GamesPageClass = (function(){

    function GamesPageClass() {

        if (!window.location.href.match(/\/games\/\?tab=all/)) {
            return;
        }

        this.computeStats();
        this.addGamelistAchievements();
        this.handleCommonGames();
    }

    // Display total time played for all games
    GamesPageClass.prototype.computeStats = function() {
        let games = BrowserHelper.getVariableFromDom("rgGames", "array");

        let statsHtml = "";

        let countTotal = games.length;
        let countPlayed = 0;
        let countNeverPlayed = 0;

        let time = 0;
        games.forEach(game => {
            if (!game['hours_forever']) {
                countNeverPlayed++;
                return;
            }

            countPlayed++;
            time += parseFloat(game['hours_forever'].replace(",",""));
        });

        let totalTime = Localization.str.hours_short.replace("__hours__", time.toFixed(1));

        statsHtml += `<div class="esi-collection-stat"><span class="num">${totalTime}</span>${Localization.str.total_time}</div>`;
        statsHtml += `<div class="esi-collection-stat"><span class="num">${countTotal}</span>${Localization.str.coll.in_collection}</div>`;
        statsHtml += `<div class="esi-collection-stat"><span class="num">${countPlayed}</span>${Localization.str.coll.played}</div>`;
        statsHtml += `<div class="esi-collection-stat"><span class="num">${countNeverPlayed}</span>${Localization.str.coll.never_played}</div>`;

        let html = `<div id="esi-collection-chart-content">${statsHtml}</div>`;

        document.querySelector("#mainContents").insertAdjacentHTML("beforebegin", html);
    };

    let scrollTimeout = null;

    GamesPageClass.prototype.addGamelistAchievements = function() {
        if (!SyncedStorage.get("showallachievements", Defaults.showallachievements)) { return; }

        let node = document.querySelector(".profile_small_header_texture a");
        if (!node) { return; }
        let statsLink = '//steamcommunity.com/my/stats/';

        document.addEventListener("scroll", function(){
            if (scrollTimeout) { window.clearTimeout(scrollTimeout); }
            scrollTimeout = window.setTimeout(addAchievements, 500);
        });

        addAchievements();

        function addAchievements() {
            // Only show stats on the "All Games" tab
            let nodes = document.querySelectorAll(".gameListRow:not(.es_achievements_checked)");
            let hadNodesInView = false;
            for (let i=0, len=nodes.length; i<len; i++) {
                let node = nodes[i];

                if (!BrowserHelper.isElementInViewport(node)) {
                    if (hadNodesInView) { break; }
                    continue;
                }

                hadNodesInView = true;

                let appid = GameId.getAppidWishlist(node.id);
                node.classList.add("es_achievements_checked");
                if (!node.innerHTML.match(/ico_stats\.png/)) { continue; }
                if (!node.querySelector("h5.hours_played")) { continue; }

                // Copy achievement stats to row
                node.querySelector(".gameListRowItemName")
                    .insertAdjacentHTML("afterend", "<div class='es_recentAchievements' id='es_app_" + appid + "'>" + Localization.str.loading + "</div>");

                RequestData.getHttp(statsLink + appid).then(result => {
                    let dummy = document.createElement("html");
                    dummy.innerHTML = result;

                    let node = document.querySelector("#es_app_" + appid);
                    node.innerHTML = "";

                    let achNode = dummy.querySelector("#topSummaryAchievements");

                    if (!achNode) { return; }
                    node.append(achNode);

                    document.querySelector("#topSummaryAchievements").style.whiteSpace="nowrap";

                    if (!node.innerHTML.match(/achieveBarFull\.gif/)) { return; }

                    let barFull = node.innerHTML.match(/achieveBarFull\.gif" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])"/)[1];
                    let barEmpty = node.innerHTML.match(/achieveBarEmpty\.gif" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])"/)[1];
                    barFull = barFull * .58;
                    barEmpty = barEmpty * .58;

                    node.innerHTML = node.innerHTML.replace(/achieveBarFull\.gif" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])"/, "achieveBarFull.gif\" width=\"" + BrowserHelper.escapeHTML(barFull.toString()) + "\"");
                    node.innerHTML = node.innerHTML.replace(/achieveBarEmpty\.gif" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])"/, "achieveBarEmpty.gif\" width=\"" + BrowserHelper.escapeHTML(barEmpty.toString()) + "\"");
                    node.innerHTML = node.innerHTML.replace("::", ":");
                }, () => {
                    let node = document.querySelector("#es_app_" + appid);
                    node.innerHTML = "error";
                });
            }
        }
    };

    let _commonGames = null;

    async function loadCommonGames() {
        if (_commonGames != null) { return; }

        let url = window.location.href;
        let commonUrl = url + (url.indexOf( '?' ) != -1 ? '&' : '?' ) + 'games_in_common=1';
        let data = await RequestData.getHttp(commonUrl);

        let games = BrowserHelper.getVariableFromText(data, "rgGames", "array");;
        _commonGames = new Set();
        for (let game of games) {
            _commonGames.add(parseInt(game.appid));
        }
        
        let nodes = document.querySelectorAll(".gameListRow");
        for (let node of nodes) {
            let appid = parseInt(node.id.split("_")[1]);

            if (_commonGames.has(appid)) {
                node.classList.add("esi-common");
            } else {
                node.classList.add("esi-notcommon");
            }
        }
    }

    GamesPageClass.prototype.handleCommonGames = function() {
        if (!User.isSignedIn) { return;}

        let label = document.querySelector("label[for='show_common_games']");
        if (!label) { return; }

        function createCheckox(id, string) {
            let checkboxEl = document.createElement("input");
            checkboxEl.type = "checkbox";
            checkboxEl.id = id;

            let uncommonLabel = document.createElement("label");
            uncommonLabel.append(checkboxEl);
            uncommonLabel.append(document.createTextNode(string));

            return checkboxEl;
        }

        let commonCheckbox = createCheckox("es_gl_show_common_games", Localization.str.common_label);
        let notCommonCheckbox = createCheckox("es_gl_show_notcommon_games", Localization.str.notcommon_label);

        label.insertAdjacentElement("afterend", notCommonCheckbox.parentNode);
        label.insertAdjacentElement("afterend", commonCheckbox.parentNode);
        label.style.display = "none";
        document.querySelector("#show_common_games").style.display = "none";

        commonCheckbox.addEventListener("change", async function(e) {
            await loadCommonGames();
            document.querySelector("#games_list_rows").classList.toggle("esi-hide-notcommon", e.target.checked);
        });

        notCommonCheckbox.addEventListener("change", async function(e) {
            await loadCommonGames();
            document.querySelector("#games_list_rows").classList.toggle("esi-hide-common", e.target.checked);
        });
    };

    return GamesPageClass;
})();

let ProfileEditPageClass = (function(){

    function ProfileEditPageClass() {
        return; // TODO
        ProfileData.clearOwn();
        ProfileData.promise();
        // this.addBackgroundSelection();
        // add_es_style_selection();
    }

    /* TODO
    ProfileEditPageClass.prototype.addBackgroundSelection = function() {
        if (!SyncedStorage.get("showesbg", Defaults.showesbg)) { return false; }
        if (window.location.pathname.indexOf("/settings") >= 0) { return; }

        let steamId = SteamId.getSteamId();

        let saveUrl = Config.PublicHost + "/gamedata/profile_bg_save.php";
        let removeUrl = Config.PublicHost + "/gamedata/profile_bg_remove.php";
        let html = "<form id='es_profile_bg' method='POST' action='"+ saveUrl +"'><div class='group_content group_summary'>";
            html += "<input type='hidden' name='steam64' value='" + steamId+ "'>";
            html += "<input type='hidden' name='appid' id='appid'>";
            html += "<div class='formRow'><div class='formRowTitle' style='overflow: visible;'>" + Localization.str.custom_background + ":<span class='formRowHint' data-tooltip-text='" + Localization.str.custom_background_help + "'>(?)</span></div><div class='formRowFields'><div class='profile_background_current'><div class='profile_background_current_img_ctn'><div class='es_loading'><img src='//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif'><span>"+ Localization.str.loading +"</div>";
            html += "<img id='es_profile_background_current_image' src=''>";
            html += "</div><div class='profile_background_current_description'><div id='es_profile_background_current_name'>";
            html += "</div></div><div style='clear: left;'></div><div class='background_selector_launch_area'></div></div><div class='background_selector_launch_area'>&nbsp;<div style='float: right;'><span id='es_background_remove_btn' class='btn_grey_white_innerfade btn_small'><span>" + Localization.str.remove + "</span></span>&nbsp;<span id='es_background_save_btn' class='btn_grey_white_innerfade btn_small btn_disabled'><span>" + Localization.str.save + "</span></span></div></div></div></div>";
            html += "</form><form id='es_profile_remove' method='POST' action='" + removeUrl + "'>";
            html += "<input type='hidden' name='steam64' value='" + steamId + "'>";
            html += "</form>";

        document.querySelector(".group_content_bodytext").insertAdjacentHTML("beforebegin", html);
        ExtensionLayer.runInPageContext(function() { SetupTooltips( { tooltipCSSClass: 'community_tooltip'} ); });

        RequestData.getApi("v01/profile/background/games", {profile: steamId}).then(response => {
            if (!response || !response.data) { return; }

            console.log(response);

            let selected = false;
            let games = response.data;

            let selectHtml = "<select name='es_background_gamename' id='es_background_gamename' class='gray_bevel dynInput'><option value='0' id='0'>" + Localization.str.noneselected + "</option>";
            games.forEach(game => {
                let id = BrowserHelper.escapeHTML(game.id.toString());
                if (game.sel) {
                    selectHtml += "<option value='" + id + "' selected>" + BrowserHelper.escapeHTML(game.t) + "</option>";
                    selected = true;
                } else {
                    selectHtml += "<option value='" + id + "'>" + BrowserHelper.escapeHTML(game.t) + "</option>";
                }
            });
            selectHtml += "</select>";

            document.querySelector(".es_loading").remove();
            document.querySelector("#es_profile_background_current_name").innerHTML = selectHtml;

            ProfileData.promise().then(data => {
                let bg = data.bg.small ? BrowserHelper.escapeHTML(data.bg.small) : "";
                document.querySelector("#es_profile_background_current_image").src = bg;
            });

            document.querySelector("#es_background_gamename").addEventListener("change", function () {
                let appid = document.querySelector("#es_background_gamename").value;
                document.querySelector("#appid").value = appid;

                let selectionNode = document.querySelector("#es_background_selection");
                if (selectionNode) {
                    selectionNode.remove();
                }

                if (appid == 0) {
                    document.querySelector("#es_profile_background_current_image").src = "";
                } else {
                    document.querySelector("#es_profile_background_current_name").insertAdjacentHTML("afterend", "<div class='es_loading'><img src='//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif'><span>" + Localization.str.loading + "</div>");

                    RequestData.getApi("v01/profile/background/background", {
                        appid: appid,
                        profile: steamId
                    }).then(result => {
                        document.querySelector("#es_profile_background_current_name").insertAdjacentHTML("afterend", "<div id='es_background_selection'></div>");
                        selectHtml = "<select name='es_background' id='es_background' class='gray_bevel dynInput'>";
                        let i = 0;
                        if (selected) {
                            i = 1;
                            selected = false;
                        }

                        result.data.forEach(value => {
                            let index = BrowserHelper.escapeHTML(value["index"].toString());
                            let name = BrowserHelper.escapeHTML(value["name"].toString());

                            if (value["selected"]) {
                                selectHtml += "<option value='" + index + "' selected>" + name + "</option>";
                            } else {
                                if (i === 0) {
                                    document.querySelector("#es_profile_background_current_image").src = value["id"];
                                    i = 1;
                                }
                                selectHtml += "<option value='" + index + "'>" + name + "</option>";
                            }
                        });
                        selectHtml += "</select>";

                        document.querySelector(".es_loading").remove();
                        document.querySelector("#es_background_selection").innerHTML = selectHtml;

                        document.querySelector("#es_background").addEventListener("change", function() {
                            let img = document.querySelector("#es_background").value + "/252fx160f";
                            document.querySelector("#es_profile_background_current_image").src = img;
                        });
                    });

                    // Enable the "save" button
                    document.querySelector("#es_background_save_btn").classList.remove("btn_disabled");
                    document.querySelector("#es_background_save_btn").addEventListener("click", function() {
                        ProfileData.clearOwn();
                        document.querySelector("#es_profile_bg").submit();
                    });
                }
            });

            document.querySelector("#es_background_remove_btn").addEventListener("click", function() {
                ProfileData.clearOwn();
                document.querySelector("#es_profile_remove").submit();
            });
        });
    };
*/
    return ProfileEditPageClass;
})();

let StatsPageClass = (function(){

    function StatsPageClass() {

        // handle compare redirect
        if (window.location.hash === "#es-compare") {
            window.location.hash = "";
            if (/\/stats\/[^\/]+(?!\/compare)\/?$/.test(window.location.pathname)) { // redirect to compare page but only if we're not there yet
                window.location = window.location.pathname.replace(/\/$/, "")+"/compare";
            }
        }

        this.addAchievementSort();
    }

    let _nodes = {
        "default": [],
        "time": []
    };

    function addSortMetaData(achievements) {
        if (_nodes['default'].length !== 0) { return; }

        let nodes = achievements.querySelectorAll(".achieveRow");

        let language = Language.getLanguageCode(Language.getCurrentSteamLanguage());
        let dateParser = new DateParser(language);

        let sort = 0;
        for (let node of nodes) {
            _nodes['default'].push([sort++, node]);

            let unlockTime = 0;
            let unlockTimeNode = node.querySelector(".achieveUnlockTime");
            if (unlockTimeNode) {
                unlockTime = dateParser.parseUnlockTime(unlockTimeNode.textContent);
            }
            _nodes['time'].push([unlockTime, node]);

            node.classList.add(unlockTime === 0 ? "esi_ach_locked" : "esi_ach_unlocked");
        }

        _nodes['time'] = _nodes['time'].sort(function(a, b) {
            return b[0] - a[0]; // descending sort
        });

        let brs = achievements.querySelectorAll(":scope > br");
        for (let br of brs) {
            br.remove();
        }
    }

    function sortBy(key, achievements) {
        addSortMetaData(achievements);

        for (let item of _nodes[key]) {
            let node = item[1];
            achievements.insertAdjacentElement("beforeend", node);
        }
    }

    StatsPageClass.prototype.addAchievementSort = function() {
        let personal = document.querySelector("#personalAchieve");
        if (!personal) { return; }

        document.querySelector("#tabs").insertAdjacentHTML("beforebegin",
            `<div id='achievement_sort_options' class='sort_options'>
                ${Localization.str.sort_by}
                <span id='achievement_sort_default'>${Localization.str.theworddefault}</span>
                <span id='achievement_sort_date' class='es_achievement_sort_link'>${Localization.str.date_unlocked}</span>
            </div>`);

        document.querySelector("#achievement_sort_default").addEventListener("click", function(e) {
            document.querySelector("#achievement_sort_date").classList.add("es_achievement_sort_link");
            e.target.classList.remove("es_achievement_sort_link");
            sortBy("default", personal);
        });

        document.querySelector("#achievement_sort_date").addEventListener("click", function(e) {
            document.querySelector("#achievement_sort_default").classList.add("es_achievement_sort_link");
            e.target.classList.remove("es_achievement_sort_link");
            sortBy("time", personal);
        });
    };

    return StatsPageClass;
})();

let InventoryPageClass = (function(){

    function InventoryPageClass() {
        prepareMarketForInventory();
        addInventoryGoToPage();
        /* hide_empty_inventory_tabs(); */
        
        let observer = new MutationObserver(() => {
            addInventoryGoToPage();
        });

        observer.observe(document.querySelector("div.games_list_tabs"), {subtree: true, attributes: true})

    }

    function setBackgroundOption(thisItem, assetId, itemActions) {
        if (!document.querySelector(".inventory_links")) { return; }
        if (itemActions.querySelector(".es_set_background")) { return; }

        let viewFullBtn = itemActions.querySelector("a");
        if (!viewFullBtn) { return; }

        if (!/public\/images\/items/.test(viewFullBtn.href)) { return; }

        let linkClass =  thisItem.classList.contains('es_isset_background') ? "btn_disabled" : "";
        viewFullBtn.insertAdjacentHTML("afterend",
            `<a class="es_set_background btn_small btn_darkblue_white_innerfade ${linkClass}"><span>${Localization.str.set_as_background}</span></a>
                  <img class="es_background_loading" src="https://steamcommunity-a.akamaihd.net/public/images/login/throbber.gif">`);

        viewFullBtn.parentNode.querySelector(".es_set_background").addEventListener("click", async function(e) {
            e.preventDefault();
            let el = e.target.closest(".es_set_background");

            if (el.classList.contains("btn_disabled")) { return; }

            let loading = viewFullBtn.parentNode.querySelector(".es_background_loading");
            if (loading.classList.contains("esi-shown")) { return;}

            loading.classList.add("esi-shown");

            // Do nothing if loading or already done
            let setBackground = document.querySelector(".es_isset_background");
            if (setBackground) {
                setBackground.classList.remove("es_isset_background");
            }
            thisItem.classList.add("es_isset_background");

            let result = await RequestData.getHttp(User.profileUrl + "/edit");

            // Make sure the background we are trying to set is not set already
            let m = result.match(/SetCurrentBackground\( {\"communityitemid\":\"(\d+)\"/i);
            let currentBg = m ? m[1] : false;

            if (currentBg !== assetId) {
                let dom = BrowserHelper.htmlToDOM(result);

                dom.querySelector("#profile_background").value = assetId;
                let form = dom.querySelector("#editForm");
                let formData = new FormData(form);

                RequestData.post(User.profileUrl + "/edit", formData, {withCredentials: true}).then(result => {
                    // Check if it was truly a succesful change
                    if (/"saved_changes_msg"/i.test(result)) {
                        el.classList.add("btn_disabled");
                    }
                }).catch(() => {
                    console.error("Edit background failed");
                }).finally(() => {
                    loading.classList.remove("esi-shown");
                });
            } else {
                el.classList.add("btn_disabled");
                loading.classList.remove("esi-shown");
            }
        });
    }

    async function addPriceToGifts(itemActions) {
        let action = itemActions.querySelector("a");
        if (!action) { return; }

        let giftAppid = GameId.getAppid(action.href);
        if (!giftAppid) { return; }
        // TODO: Add support for package(sub)

        let result = await RequestData.getJson("https://store.steampowered.com/api/appdetails/?appids=" + giftAppid + "&filters=price_overview");
        if (!result[giftAppid] || !result[giftAppid].success) { return; }
        if (!result[giftAppid]['data']['price_overview']) { return; }

        let overview = result[giftAppid]['data']['price_overview'];
        let discount = overview["discount_percent"];
        let price = new Price(overview['final'] / 100, overview['currency']);

        itemActions.style.display = "flex";
        itemActions.style.alignItems = "center";
        itemActions.style.justifyContent = "space-between";

        if (discount > 0) {
            let originalPrice = new Price(overview['initial'] / 100, overview['currency']);
            itemActions.insertAdjacentHTML("beforeend",
                `<div class='es_game_purchase_action' style='margin-bottom:16px'>
                    <div class='es_game_purchase_action_bg'>
                        <div class='es_discount_block es_game_purchase_discount'>
                            <div class='es_discount_pct'>-${discount}%</div>
                            <div class='es_discount_prices'>
                                <div class='es_discount_original_price'>${originalPrice}</div>
                                <div class='es_discount_final_price'>${price}</div>
                            </div>
                        </div>
                    </div>
                </div>`);
        } else {
            itemActions.insertAdjacentHTML("beforeend",
                `<div class='es_game_purchase_action' style='margin-bottom:16px'>
                    <div class='es_game_purchase_action_bg'>
                        <div class='es_game_purchase_price es_price'>${price}</div>
                    </div>
                </div>`);
        }
    }

    function addOneClickGemsOption(item, appid, assetId) {
        if (!SyncedStorage.get("show1clickgoo", Defaults.show1clickgoo)) { return; }

        let quickGrind = document.querySelector("#es_quickgrind");
        if (quickGrind) { quickGrind.parentNode.remove(); }

        let scrapActions = document.querySelector("#iteminfo" + item + "_item_scrap_actions");
        let turnWord = scrapActions.querySelector("a span").textContent;

        let divs = scrapActions.querySelectorAll("div");
        divs[divs.length-1].insertAdjacentHTML("beforebegin",
            "<div><a class='btn_small btn_green_white_innerfade' id='es_quickgrind'><span>1-Click " + turnWord + "</span></div>");

        // TODO: Add prompt?
        document.querySelector("#es_quickgrind").addEventListener("click", function(e) {
            ExtensionLayer.runInPageContext(`function() {
                        var rgAJAXParams = {
                            sessionid: g_sessionID,
                            appid: ${appid},
                            assetid: ${assetId},
                            contextid: 6
                        };
                        
                        var strActionURL = g_strProfileURL + '/ajaxgetgoovalue/';
                        $J.get( strActionURL, rgAJAXParams ).done( function( data ) {
                            strActionURL = g_strProfileURL + '/ajaxgrindintogoo/';
                            rgAJAXParams.goo_value_expected = data.goo_value;
                            $J.post( strActionURL, rgAJAXParams).done( function( data ) {
                                ReloadCommunityInventory();
                            });
                        });                        
                    }`);
        });
    }

    function makeMarketButton(id) {
        return `<a class="item_market_action_button item_market_action_button_green" id="${id}" style="display:none">
                    <span class="item_market_action_button_edge item_market_action_button_left"></span>
                    <span class="item_market_action_button_contents"></span>
                    <span class="item_market_action_button_edge item_market_action_button_right"></span>
                </a>`;
    }

    function updateMarketButtons(assetId, priceHighValue, priceLowValue, walletCurrency) {

        // Add Quick Sell button
        if (priceHighValue) {
            let quickSell = document.querySelector("#es_quicksell" + assetId);
            quickSell.dataset.price = priceHighValue;
            quickSell.querySelector(".item_market_action_button_contents").textContent = Localization.str.quick_sell.replace("__amount__", new Price(priceHighValue, Currency.currencyNumberToType(walletCurrency)));
            quickSell.style.display = "block";
        }

        // Add Instant Sell button
        if (priceLowValue) {
            let instantSell = document.querySelector("#es_instantsell" + assetId);
            instantSell.dataset.price = priceLowValue;
            instantSell.querySelector(".item_market_action_button_contents").textContent = Localization.str.instant_sell.replace("__amount__", new Price(priceLowValue, Currency.currencyNumberToType(walletCurrency)));
            instantSell.style.display = "block";
        }
    }

    async function addQuickSellOptions(marketActions, thisItem, marketable, contextId, globalId, assetId, sessionId, walletCurrency) {
        if (!SyncedStorage.get("quickinv", Defaults.quickinv)) { return; }
        if (!marketable) { return; }
        if (contextId !== 6 || globalId !== 753) { return; } // what do these numbers mean?

        if (!thisItem.classList.contains("es-loading")) {
            let url = marketActions.querySelector("a").href;

            thisItem.classList.add("es-loading");

            // Add the links with no data, so we can bind actions to them, we add the data later
            marketActions.insertAdjacentHTML("beforeend", makeMarketButton("es_quicksell" + assetId));
            marketActions.insertAdjacentHTML("beforeend", makeMarketButton("es_instantsell" + assetId));

            // Check if price is stored in data
            if (thisItem.classList.contains("es-price-loaded")) {
                let priceHighValue = thisItem.dataset.priceHigh;
                let priceLowValue = thisItem.dataset.priceLow;

                updateMarketButtons(assetId, priceHighValue, priceLowValue, walletCurrency);

                thisItem.classList.remove("es-loading");
            } else {
                let result = await RequestData.getHttp(url);

                let m = result.match(/Market_LoadOrderSpread\( (\d+) \)/);

                if (m) {
                    let marketId = m[1];

                    let marketUrl = "https://steamcommunity.com/market/itemordershistogram?language=english&currency=" + walletCurrency + "&item_nameid=" + marketId;
                    let market = await RequestData.getJson(marketUrl);

                    let priceHigh = new Price(parseFloat(market.lowest_sell_order / 100) + parseFloat(SyncedStorage.get("quickinv_diff", Defaults.quickinv_diff)));
                    let priceLow = new Price(market.highest_buy_order / 100);

                    if (priceHigh.value < 0.03) priceHigh.value = 0.03;

                    // Store prices as data
                    if (priceHigh.value > priceLow.value) {
                        thisItem.dataset.priceHigh = priceHigh.value;
                    }
                    if (market.highest_buy_order) {
                        thisItem.dataset.priceLow = priceLow.value;
                    }

                    // Fixes multiple buttons
                    if (document.querySelector(".item.activeInfo") === thisItem) {
                        thisItem.classList.add("es-price-loaded");
                        updateMarketButtons(assetId, priceHigh.value, priceLow.value, walletCurrency);
                    }

                    thisItem.classList.remove("es-loading");
                }
            }
        }

        // Bind actions to "Quick Sell" and "Instant Sell" buttons

        let nodes = document.querySelectorAll("#es_quicksell" + assetId + ", #es_instantsell" + assetId);
        for (let node of nodes) {
            node.addEventListener("click", function(e) {
                e.preventDefault();

                let buttonParent = e.target.closest(".item_market_action_button[data-price]");
                if (!buttonParent) { return; }

                let sellPrice = buttonParent.dataset.price * 100;

                let buttons = document.querySelectorAll("#es_quicksell" + assetId + ", #es_instantsell" + assetId);
                for (let button of buttons) {
                    button.classList.add("btn_disabled");
                    button.style.pointerEvents = "none";
                }

                marketActions.querySelector("div").innerHTML = "<div class='es_loading' style='min-height: 66px;'><img src='https://steamcommunity-a.akamaihd.net/public/images/login/throbber.gif'><span>" + Localization.str.selling + "</div>";
                ExtensionLayer.runInPageContext("function() { var fee_info = CalculateFeeAmount(" + sellPrice + ", 0.10); window.postMessage({ type: 'es_sendfee_" + assetId + "', information: fee_info, sessionID: '" + sessionId + "', global_id: '" + globalId + "', contextID: '" + contextId + "', assetID: '" + assetId + "' }, '*'); }");
            });
        }
    }

    function getMarketOverviewHtml(node) {
        let html = '<div style="min-height:3em;margin-left:1em;">';

        if (node.dataset.lowestPrice && node.dataset.lowestPrice !== "nodata") {
            html += Localization.str.starting_at + ': ' + node.dataset.lowestPrice;

            if (node.dataset.dataSold) {
                html += '<br>' + Localization.str.volume_sold_last_24.replace("__sold__", node.dataset.dataSold);
            }

            if (node.dataset.cardsPrice) {
                html += '<br>' + Localization.str.avg_price_3cards + ": " + node.dataset.cardsPrice;
            }
        } else {
            html += Localization.str.no_price_data;
        }

        html += '</div>';
        return html;
    }

    async function showMarketOverview(thisItem, marketActions, globalId, hashName, appid, isBooster) {
        marketActions.style.display = "block";
        let firstDiv = marketActions.querySelector("div");
        if (!firstDiv) {
            firstDiv = document.createElement("div");
            marketActions.insertAdjacentElement("afterbegin", firstDiv);
        }

        // "View in market" link
        let html = '<div style="height:24px;"><a href="https://steamcommunity.com/market/listings/' + globalId + '/' + encodeURIComponent(hashName) + '">' + Localization.str.view_in_market + '</a></div>';

        // Check if price is stored in data
        if (!thisItem.dataset.lowestPrice) {
            firstDiv.innerHTML = "<img class='es_loading' src='https://steamcommunity-a.akamaihd.net/public/images/login/throbber.gif' />";

            let overviewPromise = RequestData.getJson("https://steamcommunity.com/market/priceoverview/?currency=" + Currency.currencyTypeToNumber(Currency.userCurrency) + "&appid=" + globalId + "&market_hash_name=" + encodeURIComponent(hashName));

            if (isBooster) {
                thisItem.dataset.cardsPrice = "nodata";

                let result = await RequestData.getApi("v01/market/averagecardprice", {appid: appid, currency: Currency.userCurrency});
                console.log(result);
                if (result.result === "success") {
                    thisItem.dataset.cardsPrice = new Price(result.data.average);
                }
            }

            try {
                let data = await overviewPromise;

                thisItem.dataset.lowestPrice = "nodata";
                if (data && data.success) {
                    thisItem.dataset.lowestPrice = data.lowest_price || "nodata";
                    thisItem.dataset.soldVolume = data.volume;
                }
            } catch {
                console.error("Couldn't load price overview from market");
                firstDiv.innerHTML = html; // add market link anyway
                return;
            }
        }

        html += getMarketOverviewHtml(thisItem);

        firstDiv.innerHTML = html;
    }

    async function addBoosterPackProgress(marketActions, item, appid) {
        document.querySelector(`#iteminfo${item}_item_owner_actions`).insertAdjacentHTML("afterbegin",
            `<a class="btn_small btn_grey_white_innerfade" href="https://steamcommunity.com/my/gamecards/${appid}/"><span>${Localization.str.view_badge_progress}</span></a>`);
    }

    function inventoryMarketHelper(response) {
        let item = response[0];
        let marketable = parseInt(response[1]);
        let globalId = parseInt(response[2]);
        let hashName = response[3];
        let assetId = response[5];
        let sessionId = response[6];
        let contextId = parseInt(response[7]);
        let walletCurrency = response[8];
        let ownerSteamId = response[9];
        let restriction = parseInt(response[10]);
        let isGift = response[4] && /Gift/i.test(response[4]);
        let isBooster = hashName && /Booster Pack/i.test(hashName);
        let ownsInventory = User.isSignedIn && (ownerSteamId === User.steamId);

        let hm;
        let appid = (hm = hashName.match(/^([0-9]+)-/)) ? hm[1] : null;

        let thisItem = document.querySelector(`[id="${globalId}_${contextId}_${assetId}"]`);
        let itemActions = document.querySelector("#iteminfo" + item + "_item_actions");
        let marketActions = document.querySelector("#iteminfo" + item + "_item_market_actions");
        marketActions.style.overflow = "hidden";

        // Set as background option
        if (ownsInventory) {
            setBackgroundOption(thisItem, assetId, itemActions);
        }

        // Show prices for gifts

        if (isGift) {
            addPriceToGifts(itemActions);
            return;
        }

        if (ownsInventory) {
            // If is a booster pack add the average price of three cards
            if (isBooster) {
                addBoosterPackProgress(marketActions, item, appid);
            }

            addOneClickGemsOption(item, appid, assetId);
            addQuickSellOptions(marketActions, thisItem, marketable, contextId, globalId, assetId, sessionId, walletCurrency);
        }

        if ((ownsInventory && restriction > 0 && !marketable) || marketable) {
            showMarketOverview(thisItem, marketActions, globalId, hashName, appid, isBooster);
        }
    }

    function prepareMarketForInventory() {
        ExtensionLayer.runInPageContext(`function(){
            $J(document).on("click", ".inventory_item_link, .newitem", function(){
                if (!g_ActiveInventory.selectedItem.description.market_hash_name) {
                    g_ActiveInventory.selectedItem.description.market_hash_name = g_ActiveInventory.selectedItem.description.name
                }
                window.postMessage({
                    type: "es_sendmessage",
                    information: [
                        iActiveSelectView, 
                        g_ActiveInventory.selectedItem.description.marketable,
                        g_ActiveInventory.appid,
                        g_ActiveInventory.selectedItem.description.market_hash_name,
                        g_ActiveInventory.selectedItem.description.type,
                        g_ActiveInventory.selectedItem.assetid,
                        g_sessionID,
                        g_ActiveInventory.selectedItem.contextid,
                        g_rgWalletInfo.wallet_currency,
                        g_ActiveInventory.m_owner.strSteamId,
                        g_ActiveInventory.selectedItem.description.market_marketable_restriction
                    ]
                }, "*");
            });
	    }`);

        window.addEventListener("message", function(e) {
            if (e.source !== window) { return; }
            if (!e.data.type) { return; }

            if (e.data.type === "es_sendmessage") {
                inventoryMarketHelper(e.data.information);
            } else if (e.data.type === "es_sendfee_" + e.data.assetID) {
                let sellPrice = e.data.information.amount - e.data.information.fees;
                let formData = new FormData();
                formData.append('sessionid', e.data.sessionID);
                formData.append('appid', e.data.global_id);
                formData.append('contextid', e.data.contextID);
                formData.append('assetid', e.data.assetID);
                formData.append('amount', 1);
                formData.append('price', sellPrice);

                /*
                 * TODO test what we need to send in request, this is original:
                 * mode: 'cors', // CORS to cover requests sent from http://steamcommunity.com
                 * credentials: 'include',
                 * headers: { origin: window.location.origin },
                 * referrer: window.location.origin + window.location.pathname
                 */

                RequestData.post("https://steamcommunity.com/market/sellitem/", formData, {
                    withCredentials: true
                }).then(() => {
                    document.querySelector("#es_instantsell" + e.data.assetID).parentNode.style.display = "none";

                    let id = e.data.global_id + "_" + e.data.contextID + "_" + e.data.assetID;
                    let node = document.querySelector("[id='"+id+"']");
                    node.classList.add("btn_disabled", "activeInfo");
                    node.style.pointerEvents = "none";
                });
            }
        }, false);
    }

    function addInventoryGoToPage(){
        if (!SyncedStorage.get("showinvnav", Defaults.showinvnav)) { return; }

        DOMHelper.remove("#es_gotopage");
        DOMHelper.remove("#pagebtn_first");
        DOMHelper.remove("#pagebtn_last");
        DOMHelper.remove("#es_pagego");

        let es_gotopage = document.createElement("script");
        es_gotopage.type = "text/javascript";
        es_gotopage.id = "es_gotopage";
        es_gotopage.textContent = `g_ActiveInventory.GoToPage = function(page){
                  var nPageWidth = this.m_$Inventory.children('.inventory_page:first').width();
                	var iCurPage = this.m_iCurrentPage;
                	var iNextPage = Math.min(Math.max(0, --page), this.m_cPages-1);
                  var iPages = this.m_cPages
                  var _this = this;
                  if (iCurPage < iNextPage) {
                    if (iCurPage < iPages - 1) {
                      this.PrepPageTransition( nPageWidth, iCurPage, iNextPage );
                      this.m_$Inventory.css( 'left', '0' );
                      this.m_$Inventory.animate( {left: -nPageWidth}, 250, null, function() { _this.FinishPageTransition( iCurPage, iNextPage ); } );
                    }
                  } else if (iCurPage > iNextPage) {
                    if (iCurPage > 0) {
                      this.PrepPageTransition( nPageWidth, iCurPage, iNextPage );
                      this.m_$Inventory.css( 'left', '-' + nPageWidth + 'px' );
                      this.m_$Inventory.animate( {left: 0}, 250, null, function() { _this.FinishPageTransition( iCurPage, iNextPage ); } );
                    }
                  }
                }
                function InventoryLastPage(){
                	g_ActiveInventory.GoToPage(g_ActiveInventory.m_cPages);
                }
                function InventoryFirstPage(){
                	g_ActiveInventory.GoToPage(1);
                }
                function InventoryGoToPage(){
                	var page = $('es_pagenumber').value;
                	if (isNaN(page)) return;
                	g_ActiveInventory.GoToPage(parseInt(page));
                }`;

        document.documentElement.appendChild(es_gotopage);

        // Go to first page
        document.querySelector("#pagebtn_previous").insertAdjacentHTML("afterend",
            "<a href='javascript:InventoryFirstPage();' id='pagebtn_first' class='pagebtn pagecontrol_element disabled' style='margin:0 3px'>&lt;&lt;</a>");

        // Go to last page
        document.querySelector("#pagebtn_next").insertAdjacentHTML("beforebegin",
            "<a href='javascript:InventoryLastPage();' id='pagebtn_last' class='pagebtn pagecontrol_element' style='margin:0 3px'>&gt;&gt;</a>");

        let pageGo = document.createElement("div");
        pageGo.id = "es_pagego";
        pageGo.style.float = "left";

        // Page number box
        let pageNumber = document.createElement("input");
        pageNumber.type = "number";
        pageNumber.value="1";
        pageNumber.classList.add("filter_search_box");
        pageNumber.autocomplete = "off";
        pageNumber.placeholder = "page #";
        pageNumber.id = "es_pagenumber";
        pageNumber.style.width = "50px";
        pageNumber.min = 1;
        pageNumber.max = document.querySelector("#pagecontrol_max").textContent;

        pageGo.append(pageNumber);

        let gotoButton = document.createElement("a");
        gotoButton.textContent = Localization.str.go;
        gotoButton.id = "gotopage_btn";
        gotoButton.classList.add("pagebtn");
        gotoButton.href = "javascript:InventoryGoToPage();";
        gotoButton.style.width = "32px";
        gotoButton.style.padding = "0";
        gotoButton.style.margin = "0 6px";
        gotoButton.style.textAlign = "center";

        pageGo.append(gotoButton);

        document.querySelector("#inventory_pagecontrols").insertAdjacentElement("beforebegin", pageGo);

        let observer = new MutationObserver(mutations => {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName !== "class") { return; }
                if (!mutation.target.id) { return; }

                let id = mutation.target.id;
                if (id === "pagebtn_next") {
                    document.querySelector("#pagebtn_last").classList.toggle("disabled", mutation.target.classList.contains("disabled"));
                } else if (id === "pagebtn_previous") {
                    document.querySelector("#pagebtn_first").classList.toggle("disabled", mutation.target.classList.contains("disabled"));
                }

            });
        });
        observer.observe(document.querySelector("#pagebtn_next"), { attributes: true });
        observer.observe(document.querySelector("#pagebtn_previous"), { attributes: true });
    }

    return InventoryPageClass;
})();


let BadgesPageClass = (function(){

    function BadgesPageClass() {
        this.hasMultiplePages = (document.querySelector(".pagebtn") !== null);
        this.hasAllPagesLoaded = false;

        if (currentUserIsOwner()) {
            this.addBadgeCompletionCost();
            this.addTotalDropsCount();
        }

        CommunityCommon.addCardExchangeLinks();

        this.addBadgeSort();
        this.addBadgeFilter();
        /*
        add_badge_view_options();
        */
    }

    function currentUserIsOwner() {
        if (!User.isSignedIn) { return false; }

        let badgeOwnerLink = document.querySelector(".profile_small_header_texture a").href;
        let userProfileLink = document.querySelector(".playerAvatar a").href.replace(/\/*$/, "");

        return badgeOwnerLink === userProfileLink;
    }

    // Display the cost estimate of crafting a game badge by purchasing unowned trading cards
    BadgesPageClass.prototype.addBadgeCompletionCost = async function() {
        // move faq to the middle
        let xpBlockRight = document.querySelector(".profile_xp_block_right");

        document.querySelector(".profile_xp_block_mid").insertAdjacentHTML("beforeend", "<div class='es_faq_cards'>" + xpBlockRight.innerHTML + "</div>");
        xpBlockRight.innerHTML = "<div id='es_cards_worth'></div>";

        let totalWorth = new Price(0);

        // Gather appid info
        let appids = [];
        let nodes = [];
        let foilAppids = [];

        let rows = document.querySelectorAll(".badge_row.is_link");
        for (let node of rows) {
            let game = node.querySelector(".badge_row_overlay").href.match(/gamecards\/(\d+)\//);
            if (!game) { continue; }
            let appid = parseInt(game[1]);

            let foil = /\?border=1/.test(node.querySelector("a:last-of-type").href);
            nodes.push([appid, node, foil]);

            if (foil) {
                foilAppids.push(appid);
            } else {
                appids.push(appid);
            }
        }

        let response;
        try {
            response = await RequestData.getApi("v01/market/averagecardprices", {
                currency: Currency.userCurrency,
                appids: appids.join(","),
                foilappids: foilAppids.join(",")
            });
        } catch (exception) {
            console.error("Couldn't retrieve average card prices", exception);
            return;
        }

        if (!response.result || response.result !== "success") {
            return;
        }

        let data = response.data;

        // regular cards
        for (let item of nodes) {
            let appid = item[0];
            let node = item[1];
            let isFoil = item[2];

            let key = isFoil ? "foil" : "regular";
            if (!data[appid] || !data[appid][key]) { continue; }

            let averagePrice = new Price(data[appid][key]['average']);

            let cost;
            let progressInfoNode = node.querySelector("div.badge_progress_info");
            if (progressInfoNode) {
                let card = progressInfoNode.textContent.trim().match(/(\d+)\D*(\d+)/);
                if (card) {
                    let need = card[2] - card[1];
                    cost = new Price(averagePrice.value * need)
                }
            }

            if (!isFoil) {
                let progressBoldNode = node.querySelector(".progress_info_bold");
                if (progressBoldNode) {
                    let drops = progressBoldNode.textContent.match(/\d+/);
                    if (drops) {
                        let worth = new Price(drops[0] * averagePrice.value);

                        if (worth.value > 0) {
                            totalWorth.value += worth.value;

                            let howToNode = node.querySelector(".how_to_get_card_drops");
                            howToNode.insertAdjacentHTML("afterend",
                                `<span class='es_card_drop_worth' data-es-card-worth='${worth.value}'>${Localization.str.drops_worth_avg} ${worth}</span>`);
                            howToNode.remove();
                        }
                    }
                }
            }

            if (cost) {
                DOMHelper.selectLastNode(node, ".badge_empty_name")
                    .insertAdjacentHTML("afterend", "<div class='badge_info_unlocked' style='color: #5c5c5c;'>" + Localization.str.badge_completion_avg + ": " + cost + "</div>");
            }

            // note CSS styles moved to .css instead of doing it in javascript
            node.classList.add("esi-badge");
        }

        document.querySelector("#es_cards_worth").innerText = Localization.str.drops_worth_avg + " " + totalWorth;
    };

    async function eachBadgePage(callback) {
        let baseUrl = "https://steamcommunity.com/" + window.location.pathname + "?p=";

        let skip = 1;
        let m = window.location.search.match("p=(\d+)");
        if (m) {
            skip = parseInt(m[1]);
        }

        let lastPage = parseInt(DOMHelper.selectLastNode(document, ".pagelink").textContent);
        for (let p = 1; p <= lastPage; p++) { // doing one page at a time to prevent too many requests at once
            if (p === skip) { continue; }
            try {
                let response = await RequestData.getHttp(baseUrl + p);

                let dom = BrowserHelper.htmlToDOM(response);
                callback(dom);

            } catch (exception) {
                console.log("Failed to load " + baseUrl + p + ": " + exception);
                return;
            }
        }
    }

    BadgesPageClass.prototype.loadAllPages = async function() {
        if (this.hasAllPagesLoaded) { return; }
        this.hasAllPagesLoaded = true;

        let sheetNode = document.querySelector(".badges_sheet");

        await eachBadgePage(function(dom){
            let nodes = dom.querySelectorAll(".badge_row");
            for (let node of nodes) {
                sheetNode.append(node);
            }
        });

        let nodes = document.querySelectorAll(".profile_paging");
        for (let node of nodes) {
            node.style.display = "none";
        }
    };

    BadgesPageClass.prototype.addTotalDropsCount = function() {
        let dropsCount = 0;
        let dropsGames = 0;
        let completed = false;

        function countDropsFromDOM(dom) {
            let nodes = dom.querySelectorAll(".badge_title_stats_drops .progress_info_bold");
            for (let node of nodes) {
                let count = node.innerText.match(/(\d+)/);
                if (!count) { continue; }

                dropsGames++;
                dropsCount += parseInt(count[1]);
            }
        }

        async function addDropsCount() {
            document.querySelector("#es_calculations")
                .innerHTML = Localization.str.card_drops_remaining.replace("__drops__", dropsCount)
                    + "<br>" + Localization.str.games_with_drops.replace("__dropsgames__", dropsGames);

            let response;
            try {
                response = await RequestData.getHttp("https://steamcommunity.com/my/ajaxgetboostereligibility/");
            } catch(exception) {
                console.log("Failed to load booster eligibility", exception);
                return;
            }

            let boosterGames = response.match(/class="booster_eligibility_game"/g);
            let boosterCount = boosterGames && boosterGames.length || 0;

            document.querySelector("#es_calculations")
                .insertAdjacentHTML("beforeend", "<br>" + Localization.str.games_with_booster.replace("__boostergames__", boosterCount));
        }

        countDropsFromDOM(document);

        if (this.hasMultiplePages) {
            document.querySelector(".profile_xp_block_right").insertAdjacentHTML("afterbegin",
                "<div id='es_calculations'><div class='btn_grey_black btn_small_thin'><span>" + Localization.str.drop_calc + "</span></div></div>");

            document.querySelector("#es_calculations").addEventListener("click", async function(e) {
                if (completed) { return; }

                document.querySelector("#es_calculations").innerText = Localization.str.loading;

                await eachBadgePage(countDropsFromDOM);

                addDropsCount();
                completed = true;
            });

        } else {
            document.querySelector(".profile_xp_block_right").insertAdjacentHTML("beforebegin",
                "<div id='es_calculations'>" + Localization.str.drop_calc + "</div>");

            addDropsCount();
        }
    };

    function resetLazyLoader() {
        ExtensionLayer.runInPageContext(function() {
            // Clear registered image lazy loader watchers (CScrollOffsetWatcher is found in shared_global.js)
            CScrollOffsetWatcher.sm_rgWatchers = [];

            // Recreate registered image lazy loader watchers
            $J('div[id^=image_group_scroll_badge_images_gamebadge_]').each(function(i,e){
                // LoadImageGroupOnScroll is found in shared_global.js
                LoadImageGroupOnScroll(e.id, e.id.substr(19));
            });
        });
    }

    function sortBadgeRows(activeText, nodeValueCallback) {
        let badgeRows = [];
        let nodes = document.querySelectorAll(".badge_row");
        for (let node of nodes) {
            badgeRows.push([node.outerHTML, nodeValueCallback(node)]);
            node.remove();
        }

        badgeRows.sort(function(a,b) {
            return b[1] - a[1];
        });

        let sheetNode = document.querySelector(".badges_sheet");
        for (let row of badgeRows) {
            sheetNode.insertAdjacentHTML("beforeend", row[0]);
        }

        resetLazyLoader();
        document.querySelector("#es_sort_active").textContent = activeText;
        document.querySelector("#es_sort_flyout").style.display = "none"; // TODO fadeout
    }

    BadgesPageClass.prototype.addBadgeSort = function() {
        let isOwnProfile = currentUserIsOwner();
        let sorts = ["c", "a", "r"];

        let sorted = document.querySelector("a.badge_sort_option.active").search.replace("?sort=", "")
            || (isOwnProfile ? "p": "c");

        let linksHtml = "";

        if (isOwnProfile) {
            sorts.unshift("p");
        }

        // Build dropdown links HTML
        let nodes = document.querySelectorAll(".profile_badges_sortoptions a");
        let i=0;
        for (let node of nodes) {
            node.style.display = "none";
            linksHtml += `<a class="badge_sort_option popup_menu_item by_${sorts[i]}" data-sort-by="${sorts[i]}" href="?sort=${sorts[i]}">${node.textContent.trim()}</a>`;
            i++;
        }
        if (isOwnProfile) {
            linksHtml += '<a class="badge_sort_option popup_menu_item by_d" data-sort-by="d" id="es_badge_sort_drops">' + Localization.str.most_drops + '</a>';
            linksHtml += '<a class="badge_sort_option popup_menu_item by_v" data-sort-by="v" id="es_badge_sort_value">' + Localization.str.drops_value + '</a>';
        }

        let container = document.createElement("span");
        container.id = "wishlist_sort_options";
        DOMHelper.wrap(container, document.querySelector(".profile_badges_sortoptions"));

        // Insert dropdown options links
        document.querySelector(".profile_badges_sortoptions").insertAdjacentHTML("beforeend",
            `<div id="es_sort_flyout" class="popup_block_new flyout_tab_flyout responsive_slidedown" style="visibility: visible; top: 42px; left: 305px; display: none; opacity: 1;">
			    <div class="popup_body popup_menu">${linksHtml}</div>
		    </div>`);
        
        // Insert dropdown button
        document.querySelector(".profile_badges_sortoptions span").insertAdjacentHTML("afterend",
            `<span id="wishlist_sort_options">
                <div class="store_nav">
                    <div class="tab flyout_tab" id="es_sort_tab" data-flyout="es_sort_flyout" data-flyout-align="right" data-flyout-valign="bottom">
                        <span class="pulldown">
                            <div id="es_sort_active" style="display: inline;">` + document.querySelector("#es_sort_flyout a.by_" + sorted).textContent + `</div>
                            <span></span>
                        </span>
                    </div>
                </div>
            </span>`);

        ExtensionLayer.runInPageContext(function() { BindAutoFlyoutEvents(); });

        // TODO sort drops right now loads all pages but value does not. Also images are not lazy loaded for other pages

        let that = this;
        document.querySelector("#es_badge_sort_drops").addEventListener("click", async function(e) {

            if (that.hasMultiplePages) {
                await that.loadAllPages();
            }

            sortBadgeRows(e.target.textContent, (node) => {
                let content = 0;
                let progressInfo = node.innerHTML.match(/progress_info_bold".+(\d+)/);
                if (progressInfo) {
                    content = parseInt(progressInfo[1])
                }
                return content;
            })
        });

        document.querySelector("#es_badge_sort_value").addEventListener("click", function(e) {
            sortBadgeRows(e.target.textContent, (node) => {
                let content = 0;
                let dropWorth = node.querySelector(".es_card_drop_worth");
                if (dropWorth) {
                    content = parseFloat(dropWorth.dataset.esCardWorth);
                }
                return content;
            });
        });
    };

    BadgesPageClass.prototype.addBadgeFilter = function() {
        if (!currentUserIsOwner()) { return; }

        let html  = `<span>${Localization.str.show}</span>
            <div class="store_nav">
                <div class="tab flyout_tab" id="es_filter_tab" data-flyout="es_filter_flyout" data-flyout-align="right" data-flyout-valign="bottom">
                    <span class="pulldown">
                        <div id="es_filter_active" style="display: inline;">${Localization.str.badges_all}</div>
                        <span></span>
                    </span>
                </div>
            </div>
            <div class="popup_block_new flyout_tab_flyout responsive_slidedown" id="es_filter_flyout" style="visibility: visible; top: 42px; left: 305px; display: none; opacity: 1;">
                <div class="popup_body popup_menu">
                    <a class="popup_menu_item es_bg_filter" id="es_badge_all">${Localization.str.badges_all}</a>
                    <a class="popup_menu_item es_bg_filter" id="es_badge_drops">${Localization.str.badges_drops}</a>
                </div>
            </div>`;

        document.querySelector("#wishlist_sort_options")
            .insertAdjacentHTML("afterbegin", "<div class='es_badge_filter' style='float: right; margin-left: 18px;'>" + html + "</div>");

        document.querySelector("#es_badge_all").addEventListener("click", function(e) {
            document.querySelector(".is_link").style.display = "block";
            document.querySelector("#es_filter_active").textContent = Localization.str.badges_all;
            document.querySelector("#es_filter_flyout").style.display = "none"; // TODO fadeout
            resetLazyLoader();
        });

        let that = this;
        document.querySelector("#es_badge_drops").addEventListener("click", async function(e) {
            e.preventDefault();

            // Load additinal badge sections if multiple pages are present
            if (that.hasMultiplePages) {
                await that.loadAllPages();
            }

            let nodes = document.querySelectorAll(".is_link");
            for (let node of nodes) {
                let progress = node.innerHTML.match(/progress_info_bold".+(\d+)/);
                if (!progress || parseInt(progress[1]) === 0) {
                    node.style.display = "none";
                } else if (node.innerHTML.match(/badge_info_unlocked/) && !node.innerHTML.match(/badge_current/)) {
                    node.style.display = "none";
                // Hide foil badges too
                } else if (!node.innerHTML.match(/progress_info_bold/)) {
                    node.style.display = "none";
                }
            }

            document.querySelector("#es_filter_active").textContent = Localization.str.badges_drops;
            document.querySelector("#es_filter_flyout").style.display = "none"; // TODO fadeOut();
            resetLazyLoader();
        });
    };


    return BadgesPageClass;
})();



(function(){
    let path = window.location.pathname.replace(/\/+/g, "/");

    SyncedStorage
        .load()
        .finally(() => Promise
            .all([Localization.promise(), User.promise(), Currency.promise()])
            .then(() => {

                Common.init();
                SpamCommentHandler.hideSpamComments();

                switch (true) {

                    case /^\/(?:id|profiles)\/.+\/(home|myactivity)\/?$/.test(path):
                        (new ProfileActivityPageClass());
                        break;

                    case /^\/(?:id|profiles)\/(.+)\/games/.test(path):
                        (new GamesPageClass());
                        break;

                    case /^\/(?:id|profiles)\/.+\/edit/.test(path):
                        (new ProfileEditPageClass());
                        break;

                    case /^\/(?:id|profiles)\/.+\/badges(?!\/[0-9]+$)/.test(path):
                        (new BadgesPageClass());
                        break;

                    case /^\/(?:id|profiles)\/.+\/inventory/.test(path):
                        (new InventoryPageClass());
                        break;

                    case /^\/(?:id|profiles)\/[^\/]+?\/?[^\/]*$/.test(path):
                        (new ProfileHomePageClass());
                        break;

                    case /^\/(?:id|profiles)\/.+\/stats/.test(path):
                        (new StatsPageClass());
                        break;

                    // TODO
                }
            })
    )

})();

