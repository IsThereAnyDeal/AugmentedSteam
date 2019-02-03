
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

        if (window.location.href.match(/\/games\/\?tab=all/)) {
            this.computeStats();
            this.addGamelistAchievements();
        }

        // FIXME add_gamelist_common();
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
        // bind_ajax_content_highlighting();
        inventory_market_prepare();
        /*hide_empty_inventory_tabs();
        keep_ssa_checked();
        add_inventory_gotopage();*/
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
        let turnWord = scrapActions.querySelector("span").textContent;

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

    function inventory_market_helper(response) {
        let item = response[0];
        let marketable = response[1];
        let globalId = response[2];
        let hashName = response[3];
        let assetId = response[5];
        let sessionId = response[6];
        let contextId = response[7];
        let walletCurrency = response[8];
        let ownerSteamId = response[9];
        let restriction = response[10];
        let isGift = response[4] && /Gift/i.test(response[4]);
        let isBooster = hashName && /Booster Pack/i.test(hashName);
        let ownsInventory = User.isSignedIn && (ownerSteamId === User.steamId);

        let hm;
        let appid = (hm = hashName.match(/^([0-9]+)-/)) ? hm[1] : null;

        console.log(ownerSteamId, User.steamId);

        let html = "";

        let thisItem = document.querySelector(`[id="${globalId}_${contextId}_${assetId}"]`);
        let itemActions = document.querySelector("#iteminfo" + item + "_item_actions");
        let sideMarketActs = document.querySelector("#iteminfo" + item + "_item_market_actions");

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
            /*
            if (isBooster) {
                var $sideMarketActsDiv = sideMarketActs.find("div").last().css("margin-bottom", "8px"),
                    dataCardsPrice = $(thisItem).data("cards-price");

                $(`#iteminfo${ item }_item_owner_actions`).prepend(`
                <a class="btn_small btn_grey_white_innerfade" href="` + protocol + `//steamcommunity.com/my/gamecards/${ appid }/"><span>${ localized_strings.view_badge_progress }</span></a>
            `);

                // Monitor for when the price and volume are added
                setMutationHandler(document, ".item_market_actions div:last-child br:last-child", function(){
                    if (dataCardsPrice) {
                        $sideMarketActsDiv.append(localized_strings.avg_price_3cards + ": " + dataCardsPrice + "<br>");
                    } else {
                        var api_url = Api.getApiUrl("market_data/average_card_price", {appid: appid, cur: user_currency.toLowerCase()});

                        get_http(api_url, function(price_data) {
                            var booster_price = formatCurrency(parseFloat(price_data,10) * 3);

                            $(thisItem).data("cards-price", booster_price);
                            $sideMarketActsDiv.append(localized_strings.avg_price_3cards + ": " + booster_price + "<br>");
                        });
                    }

                    this.disconnect();
                });
            }
            */

            addOneClickGemsOption(item, appid, assetId);

/*
            storage.get(function(settings) {

                // Quick sell options
                if (settings.quickinv === undefined) { settings.quickinv = true; storage.set({'quickinv': settings.quickinv}); }
                if (settings.quickinv_diff === undefined) { settings.quickinv_diff = -0.01; storage.set({'quickinv_diff': settings.quickinv_diff}); }
                if (settings.quickinv) {
                    if (marketable && contextId == 6 && globalId == 753) {
                        // Restyle the existing "Sell" button
                        sideMarketActs.find("a.item_market_action_button").removeClass().addClass("btn_small btn_green_white_innerfade es_market_btn").attr("id", "es_sell_" + item);
                        $("#es_sell_" + item).find("span.item_market_action_button_left, span.item_market_action_button_right, span.item_market_action_button_preload").hide();
                        $("#es_sell_" + item).find("span.item_market_action_button_contents").removeClass();

                        if (!$(thisItem).hasClass("es-loading")) {
                            var url = sideMarketActs.find("a")[0].href;

                            $(thisItem).addClass("es-loading");

                            // Add the links with no data, so we can bind actions to them, we add the data later
                            sideMarketActs.append("<a style='display:none' class='btn_small btn_green_white_innerfade es_market_btn' id='es_quicksell" + assetId + "'></a>");
                            sideMarketActs.append("<a style='display:none' class='btn_small btn_green_white_innerfade es_market_btn' id='es_instantsell" + assetId + "'></a>");

                            // Check if price is stored in data
                            if ($(thisItem).hasClass("es-price-loaded")) {
                                var price_high = $(thisItem).data("price-high"),
                                    price_low = $(thisItem).data("price-low");

                                // Add Quick Sell button
                                if (price_high) {
                                    $("#es_quicksell" + assetId).attr("price", price_high).html("<span>" + localized_strings.quick_sell.replace("__amount__", formatCurrency(price_high, currency_number_to_type(walletCurrency))) + "</span>").show().before("<br class='es-btn-spacer'>");
                                }
                                // Add Instant Sell button
                                if (price_low) {
                                    $("#es_instantsell" + assetId).attr("price", price_low).html("<span>" + localized_strings.instant_sell.replace("__amount__", formatCurrency(price_low, currency_number_to_type(walletCurrency))) + "</span>").show().before("<br class='es-btn-spacer'>");
                                }

                                $(thisItem).removeClass("es-loading");
                            } else {
                                get_http(url, function(txt) {
                                    var market_id = txt.match(/Market_LoadOrderSpread\( (\d+) \)/);

                                    if (market_id) {
                                        market_id = market_id[1];

                                        get_http(protocol + "//steamcommunity.com/market/itemordershistogram?language=english&currency=" + walletCurrency + "&item_nameid=" + market_id, function(market_txt) {
                                            var market = JSON.parse(market_txt),
                                                price_high = parseFloat(market.lowest_sell_order / 100) + parseFloat(settings.quickinv_diff),
                                                price_low = market.highest_buy_order / 100;

                                            if (price_high < 0.03) price_high = 0.03;
                                            price_high = parseFloat(price_high).toFixed(2);
                                            price_low = parseFloat(price_low).toFixed(2);

                                            // Store prices as data
                                            if (price_high > price_low) {
                                                $(thisItem).data("price-high", price_high);
                                            }
                                            if (market.highest_buy_order) {
                                                $(thisItem).data("price-low", price_low);
                                            }
                                            // Fixes multiple buttons
                                            if ($(".item.activeInfo").is($(thisItem))) {
                                                $(thisItem).addClass("es-price-loaded");
                                                // Add "Quick Sell" button
                                                if (price_high > price_low) {
                                                    $("#es_quicksell" + assetId).attr("price", price_high).html("<span>" + localized_strings.quick_sell.replace("__amount__", formatCurrency(price_high, currency_number_to_type(walletCurrency))) + "</span>").show().before("<br class='es-btn-spacer'>");
                                                }
                                                // Add "Instant Sell" button
                                                if (market.highest_buy_order) {
                                                    $("#es_instantsell" + assetId).attr("price", price_low).html("<span>" + localized_strings.instant_sell.replace("__amount__", formatCurrency(price_low, currency_number_to_type(walletCurrency))) + "</span>").show().before("<br class='es-btn-spacer'>");
                                                }
                                            }
                                        }).done(function(){
                                            $(thisItem).removeClass("es-loading");
                                        });
                                    }
                                });
                            }
                        }

                        // Bind actions to "Quick Sell" and "Instant Sell" buttons
                        $("#es_quicksell" + assetId + ", #es_instantsell" + assetId).on("click", function(e){
                            e.preventDefault();

                            var sell_price = $(this).attr("price") * 100;
                            $("#es_sell, #es_quicksell" + assetId + ", #es_instantsell" + assetId).addClass("btn_disabled").css("pointer-events", "none");
                            sideMarketActs.find("div").first().html("<div class='es_loading' style='min-height: 66px;'><img src='" + protocol + "//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif'><span>" + localized_strings.selling + "</div>");

                            runInPageContext("function() { var fee_info = CalculateFeeAmount(" + sell_price + ", 0.10); window.postMessage({ type: 'es_sendfee_" + assetId + "', information: fee_info, sessionID: '" + sessionId + "', global_id: '" + globalId + "', contextID: '" + contextId + "', assetID: '" + assetId + "' }, '*'); }");
                        });
                    }
                }
            });

            // Item in user's inventory is not marketable due to market restriction
            if (restriction > 0 && marketable == 0) {
                var dataLowest = $(thisItem).data("lowest-price"),
                    dataSold = $(thisItem).data("sold-volume");

                sideMarketActs.show().html("<img class='es_loading' src='" + protocol + "//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif' />");

                // "View in market" link
                html += '<div style="height: 24px;"><a href="' + protocol + '//steamcommunity.com/market/listings/' + globalId + '/' + encodeURIComponent(hashName) + '">' + localized_strings.view_in_market + '</a></div>';

                // Check if price is stored in data
                if (dataLowest) {
                    html += '<div style="min-height: 3em; margin-left: 1em;">';

                    if (dataLowest !== "nodata") {
                        html += localized_strings.starting_at + ': ' + dataLowest;
                        // Check if volume is stored in data
                        if (dataSold) {
                            html += '<br>' + localized_strings.volume_sold_last_24.replace("__sold__", dataSold);
                        }
                    } else {
                        html += localized_strings.no_price_data;
                    }

                    html += '</div>';

                    sideMarketActs.html(html);
                } else {
                    get_http(protocol + "//steamcommunity.com/market/priceoverview/?currency=" + currency_type_to_number(user_currency) + "&appid=" + globalId + "&market_hash_name=" + encodeURIComponent(hashName), function(txt) {
                        var data = JSON.parse(txt);

                        html += '<div style="min-height: 3em; margin-left: 1em;">';

                        if (data && data.success) {
                            $(thisItem).data("lowest-price", data.lowest_price || "nodata");
                            if (data.lowest_price) {
                                html += localized_strings.starting_at + ': ' + data.lowest_price;
                                if (data.volume) {
                                    $(thisItem).data("sold-volume", data.volume);
                                    html += '<br>' + localized_strings.volume_sold_last_24.replace("__sold__", data.volume);
                                }
                            } else {
                                html += localized_strings.no_price_data;
                            }
                        } else {
                            html += localized_strings.no_price_data;
                        }

                        html += '</div>';

                        sideMarketActs.html(html);
                    }).fail(function(){ // At least show the "View in Market" link
                        sideMarketActs.html(html);
                    });
                }
            }
        }
        // If is not own inventory but the item is marketable then we need to build the HTML for showing info
            /*
        else if (marketable) {
            var dataLowest = $(thisItem).data("lowest-price"),
                dataSold = $(thisItem).data("sold-volume");

            sideMarketActs.show().html("<img class='es_loading' src='" + protocol + "//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif' />");

            // "View in market" link
            html += '<div style="height: 24px;"><a href="' + protocol + '//steamcommunity.com/market/listings/' + globalId + '/' + encodeURIComponent(hashName) + '">' + localized_strings.view_in_market + '</a></div>';

            // Check if price is stored in data
            if (dataLowest) {
                html += '<div style="min-height: 3em; margin-left: 1em;">';

                if (dataLowest !== "nodata") {
                    html += localized_strings.starting_at + ': ' + dataLowest;
                    // Check if volume is stored in data
                    if (dataSold) {
                        html += '<br>' + localized_strings.volume_sold_last_24.replace("__sold__", dataSold);
                    }
                } else {
                    html += localized_strings.no_price_data;
                }

                html += '</div>';

                sideMarketActs.html(html);
            } else {
                get_http(protocol + "//steamcommunity.com/market/priceoverview/?currency=" + currency_type_to_number(user_currency) + "&appid=" + globalId + "&market_hash_name=" + encodeURIComponent(hashName), function(txt) {
                    var data = JSON.parse(txt);

                    html += '<div style="min-height: 3em; margin-left: 1em;">';

                    if (data && data.success) {
                        $(thisItem).data("lowest-price", data.lowest_price || "nodata");
                        if (data.lowest_price) {
                            html += localized_strings.starting_at + ': ' + data.lowest_price;
                            if (data.volume) {
                                $(thisItem).data("sold-volume", data.volume);
                                html += '<br>' + localized_strings.volume_sold_last_24.replace("__sold__", data.volume);
                            }
                        } else {
                            html += localized_strings.no_price_data;
                        }
                    } else {
                        html += localized_strings.no_price_data;
                    }

                    html += '</div>';

                    sideMarketActs.html(html);
                }).fail(function(){ // At least show the "View in Market" link
                    sideMarketActs.html(html);
                });
            }
        }*/
    }

    function inventory_market_prepare() {
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
            console.log(event.data.information);
            if (e.source !== window) { return; }
            if (!e.data.type) { return; }

            if (event.data.type === "es_sendmessage") {
                inventory_market_helper(event.data.information);
            } else if (e.data.type === "es_sendfee_" + assetID) {
                /* FIXME
                var sell_price = event.data.information.amount - event.data.information.fees;
                var formdata = new URLSearchParams();
                formdata.append('sessionid', event.data.sessionID);
                formdata.append('appid', event.data.global_id);
                formdata.append('contextid', event.data.contextID);
                formdata.append('assetid', event.data.assetID);
                formdata.append('amount', 1);
                formdata.append('price', sell_price);
                fetch('https://steamcommunity.com/market/sellitem/', {
                    method: 'POST',
                    mode: 'cors', // CORS to cover requests sent from http://steamcommunity.com
                    credentials: 'include',
                    body: formdata,
                    headers: { origin: window.location.origin },
                    referrer: window.location.origin + window.location.pathname
                }).then(function(response) {
                    $("#es_instantsell" + event.data.assetID).parent().slideUp();
                    $("#" + event.data.global_id + "_" + event.data.contextID + "_" + event.data.assetID).addClass("btn_disabled activeInfo").css("pointer-events", "none");
                    return response.json();
                });
                */
            }
        }, false);
    }

    return InventoryPageClass;
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

