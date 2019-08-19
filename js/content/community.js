
let SteamId = (function(){

    let self = {};
    let _steamId = null;

    self.getSteamId = function() {
        if (_steamId) { return _steamId; }

        if (document.querySelector("#reportAbuseModal")) {
            _steamId = document.querySelector("input[name=abuseID]").value;
        } else {
            _steamId = HTMLParser.getVariableFromDom("g_steamID", "string");
        }

        if (!_steamId) {
            let profileData = HTMLParser.getVariableFromDom("g_rgProfileData", "object");
            _steamId = profileData.steamid;
        }

        return _steamId;
    };

    return self;
})();

let ProfileData = (function(){

    let self = {};

    let _data = {};
    let _promise = null;
    self.promise = async function() {
        if (!_promise) {
            let steamId = SteamId.getSteamId();

            _promise = Background.action('profile', { 'profile': steamId, } )
                .then(response => { _data = response; return _data; });
        }
        return _promise;
    };

    self.then = function(onDone, onCatch) {
        return self.promise().then(onDone, onCatch);
    };

    self.getBadges = function() {
        if (_promise == null) { console.warn("ProfileData were not initialized"); }
        return _data.badges;
    };

    self.getSteamRep = function() {
        if (_promise == null) { console.warn("ProfileData were not initialized"); }
        return _data.steamrep;
    };

    self.getStyle = function() {
        if (_promise == null) { console.warn("ProfileData were not initialized"); }
        return _data.style;
    };

    self.getBgImg = function(width, height) {
        if (_promise == null) { console.warn("ProfileData were not initialized"); }
        if (!_data.bg || !_data.bg.img) { return ""; }

        if (width && height) {
            return _data.bg.img.replace("/\/+$/", "")+`/${width}x${height}`; // also possible ${width}fx${height}f
        }

        return _data.bg.img;
    };

    self.getBgImgUrl = function(width, height) {
        let img = self.getBgImg(width, height);
        if (!img) { return ""; }
        return "https://steamcommunity.com/economy/image/"+img;
    };

    self.getBgAppid = function() {
        if (_promise == null) { console.warn("ProfileData were not initialized"); }
        return _data.bg && _data.bg.appid ? parseInt(_data.bg.appid) : null;
    };

    self.clearOwn = async function() {
        if (!User.isSignedIn) { return; }
        await Background.action('profile.clear', { 'profile': User.steamId, });
        _promise = null;
        return self.promise();
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
        if (!SyncedStorage.get("hidespamcomments")) { return; }

        spamRegex = new RegExp(SyncedStorage.get("spamcommentregex"), "i");

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

    self.currentUserIsOwner = function() {
        if (!User.isSignedIn) { return false; }

        let badgeOwnerLink = document.querySelector(".profile_small_header_texture a").href;
        let userProfileLink = document.querySelector(".playerAvatar a").href.replace(/\/*$/, "");

        return badgeOwnerLink === userProfileLink;
    };

    self.addCardExchangeLinks = function(game) {
        if (!SyncedStorage.get("steamcardexchange")) { return; }

        let nodes = document.querySelectorAll(".badge_row:not(.es-has-ce-link");
        for (let node of nodes) {
            let appid = game || GameId.getAppidFromGameCard(node.querySelector(".badge_row_overlay").href);
            if(!appid) { continue; }

            HTML.afterBegin(node,
                `<div class="es_steamcardexchange_link">
                    <a href="http://www.steamcardexchange.net/index.php?gamepage-appid-${appid}" target="_blank" title="Steam Card Exchange">
                        <img src="${ExtensionLayer.getLocalUrl('img/ico/steamcardexchange.png')}" width="24" height="24" border="0" alt="Steam Card Exchange" />
                    </a>
                </div>`);

            node.querySelector(".badge_title_row").style.paddingRight = "44px";
            node.classList.add("es-has-ce-link");
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
        await Promise.all([DynamicStore, Inventory, User]);

        // Get all appids and nodes from selectors
        let nodes = document.querySelectorAll(".blotter_block:not(.es_highlight_checked)");
        for (let node of nodes) {
            node.classList.add("es_highlight_checked");

            let links = node.querySelectorAll("a:not(.blotter_gamepurchase_logo)");
            for (let link of links) {
                let appid = GameId.getAppid(link.href);
                if (!appid || link.childElementCount !== 0) { continue; }

                if (DynamicStore.isOwned(appid)) {
                    Highlights.highlightOwned(link);

                    addAchievementComparisonLink(link, appid);
                } else if (Inventory.hasGuestPass(appid)) {
                    Highlights.highlightInvGuestpass(link);
                } else if (Inventory.getCouponByAppId(appid)) {
                    Highlights.highlightCoupon(link);
                } else if (Inventory.hasGift(appid)) {
                    Highlights.highlightInvGift(link);
                } else if (DynamicStore.isWishlisted(appid)) {
                    Highlights.highlightWishlist(link);
                } else if (DynamicStore.isIgnored(appid)) {
                    Highlights.highlightNotInterested(link);
                } else {
                    continue;
                }
            }
        }
    };

    function addAchievementComparisonLink(node, appid) {
        if (!SyncedStorage.get("showcomparelinks")) { return; }

        let blotter = node.closest(".blotter_daily_rollup_line");
        if (!blotter) { return; }

        if (node.parentNode.nextElementSibling.tagName !== "IMG") { return; }

        let friendProfileUrl = blotter.querySelector("a[data-miniprofile]").href + '/';
        if (friendProfileUrl === User.profileUrl) { return; }

        node.classList.add("es_achievements");

        let compareLink = friendProfileUrl + "/stats/" + appid + "/compare/#es-compare";
        HTML.afterEnd(blotter.querySelector("span"), `<a class='es_achievement_compare' href='${compareLink}' target='_blank' style='line-height: 32px'>(${Localization.str.compare})</a>`);
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
        if (window.location.hash === "#as-success") {
            /* TODO This is a hack. It turns out, that clearOwn clears data, but immediately reloads them.
             *      That's why when we clear profile before going to API to store changes we don't get updated images
             *      when we get back.
             *      clearOwn shouldn't immediately reload.
             *
             *      Also, we are hoping for the best here, we should probably await?
             */
            ProfileData.clearOwn();
        }
        ProfileData.promise();
        this.addCommunityProfileLinks();
        this.addWishlistProfileLink();
        this.addSupporterBadges();
        this.changeUserBackground();
        this.addProfileStoreLinks();
        this.addSteamRepApi();
        this.userDropdownOptions();
        this.inGameNameLink();
        this.addProfileStyle();
        this.addTwitchInfo();
        this.chatDropdownOptions();
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
        if ((language === "schinese" || language === "tchinese") && SyncedStorage.get('profile_steamrepcn')) {
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
        for (let customLink of SyncedStorage.get('profile_custom_link')) {
            if (!customLink || !customLink.enabled) {
                continue;
            }

            let customUrl = customLink.url;
            if (!customUrl.includes("[ID]")) {
                customUrl += "[ID]";
            }

            let name =  HTML.escape(customLink.name);
            let link = "//" + HTML.escape(customUrl.replace("[ID]", steamId));
            let icon = "//" + HTML.escape(customLink.icon);

            htmlstr +=
                `<div class="es_profile_link profile_count_link">
                    <a class="es_sites_icons es_none es_custom_icon" href="${link}" target="_blank">
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
                HTML.beforeEnd(linksNode,  htmlstr + '<div style="clear: both;"></div>');
            } else {
                let rightColNode = document.querySelector(".profile_rightcol");
                HTML.beforeEnd(rightColNode, '<div class="profile_item_links">' + htmlstr + '</div>');
                HTML.afterEnd(rightColNode, '<div style="clear: both;"></div>');
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
        if (!SyncedStorage.get("show_wishlist_link")) { return; }
        if (!document.querySelector(".profile_item_links")) { return; }

        let m = window.location.pathname.match(/(profiles|id)\/[^\/]+/);
        if (!m) { return; }

        HTML.afterEnd(".profile_item_links .profile_count_link",
            `<div id="es_wishlist_link" class="profile_count_link">
                <a href="//store.steampowered.com/wishlist/${m[0]}">
                    <span class="count_link_label">${Localization.str.wishlist}</span>&nbsp;
                    <span id="es_wishlist_count" class="profile_count_link_total"></span>
                </a>
            </div>`);

        if (SyncedStorage.get("show_wishlist_count")) {
            if (document.querySelector(".gamecollector_showcase")) {
                let nodes = document.querySelectorAll(".gamecollector_showcase .showcase_stat");
                document.querySelector("#es_wishlist_count").textContent = nodes[nodes.length-1].textContent.match(/\d+(?:,\d+)?/)[0];
            }
        }
    };

    ProfileHomePageClass.prototype.addSupporterBadges = function() {
        ProfileData.promise().then(data => {
            if (!data) { return; }

            let badgeCount = data["badges"].length;
            if (badgeCount === 0) { return;}

            let profileBadges = document.querySelector(".profile_badges");
            if (!profileBadges) { return; }

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
                    html += '<div class="profile_badges_badge" data-tooltip-html="Augmented Steam<br>' + data["badges"][i].title + '"><a href="' + data["badges"][i].link + '"><img class="badge_icon small" src="' + data["badges"][i].img + '"></a></div>';
                } else {
                    html += '<div class="profile_badges_badge" data-tooltip-html="Augmented Steam<br>' + data["badges"][i].title + '"><img class="badge_icon small" src="' + data["badges"][i].img + '"></div>';
                }
            }

            html += '</div></div>';

            HTML.afterEnd(profileBadges, html);

            ExtensionLayer.runInPageContext(() => SetupTooltips( { tooltipCSSClass: 'community_tooltip'} ));
        });
    };

    ProfileHomePageClass.prototype.changeUserBackground = async function() {
        let prevHash = window.location.hash.match(/#previewBackground\/(\d+)\/([a-z0-9.]+)/i);

        if (prevHash) {
            let imgUrl = "//steamcdn-a.akamaihd.net/steamcommunity/public/images/items/" + prevHash[1] + "/" + prevHash[2];
            // Make sure the url is for a valid background image
            HTML.beforeEnd(document.body, '<img class="es_bg_test" style="display: none" src="' + imgUrl + '" />');
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

        await ProfileData;
        let bg = ProfileData.getBgImgUrl();
        if (!bg) { return; }

        document.querySelector(".no_header").style.backgroundImage = "url(" + bg + ")";

        let node = document.querySelector(".profile_background_image_content");
        if (node) {
            node.style.backgroundImage = "url(" + bg + ")";
            return;
        }

        document.querySelector(".no_header").classList.add("has_profile_background");
        node = document.querySelector(".profile_content");
        node.classList.add("has_profile_background");
        HTML.afterBegin(node, '<div class="profile_background_holder_content"><div class="profile_background_overlay_content"></div><div class="profile_background_image_content " style="background-image: url(' + bg + ');"></div></div></div>');
    };

    ProfileHomePageClass.prototype.addProfileStoreLinks = function() {
        let nodes = document.querySelectorAll(".game_name .whiteLink");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            let href = node.href.replace("//steamcommunity.com", "//store.steampowered.com");
            HTML.afterEnd(node, "<br><a class='whiteLink' style='font-size: 10px;' href=" + href + ">" + Localization.str.visit_store + "</a>");
        }
    };

    ProfileHomePageClass.prototype.addSteamRepApi = function(){
        if (!SyncedStorage.get("showsteamrepapi")) { return; }

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
            HTML.beforeEnd(".profile_header_summary", '<div id="es_steamrep"></div>');

            let steamrepElement = document.getElementById("es_steamrep");
            let priorities = ["bad", "caution", "good", "neutral"];
            let backgroundStyle = document.querySelector(".profile_header_bg_texture").style;

            backgroundStyle.paddingBottom = "20px";
            backgroundStyle.backgroundSize = "cover";

            steamrep.forEach(function(value) {
                if (value.trim() == "") { return; }
                for (let [img, regex] of Object.entries(repimgs)) {
                    if (!value.match(regex)) { continue; }

                    let imgUrl = ExtensionLayer.getLocalUrl(`img/sr/${img}.png`);
                    let priority;

                    switch (img) {
                        case "banned":
                            priority = 0;
                            break;
                        case "caution":
                            priority = 1;
                            break;
                        case "valve":
                        case "okay":
                            priority = 2;
                            break;
                        case "donate":
                            priority = 3;
                            break;
                    }

                    HTML.beforeEnd(steamrepElement,
                        `<div class="${priorities[priority]}">
                            <img src="${imgUrl}" />
                            <a href="https://steamrep.com/profiles/${steamId}" target="_blank"> ${HTML.escape(value)}</a>
                        </div>`);
                        
                    return;
                }
            });
        });
    };

    ProfileHomePageClass.prototype.userDropdownOptions = function() {

        let node = document.querySelector("#profile_action_dropdown .popup_body .profile_actions_follow");
        if (!node) { return; }

        // add nickname option for non-friends
        if (User.isSignedIn) {

            // check whether we can chat => if we can we are friends => we have nickname option
            let canAddFriend = document.querySelector("#btn_add_friend");
            if (canAddFriend) {

                HTML.afterEnd(node, `<a class="popup_menu_item" id="es_nickname"><img src="https://steamcommunity-a.akamaihd.net/public/images/skin_1/notification_icon_edit_bright.png">&nbsp; ${Localization.str.add_nickname}</a>`);

                node.parentNode.querySelector("#es_nickname").addEventListener("click", function() {
                    ExtensionLayer.runInPageContext("function() { ShowNicknameModal(); HideMenu( 'profile_action_dropdown_link', 'profile_action_dropdown' ); return false; }");
                });
            }
        }

        // post history link
        HTML.afterEnd(node,
                `<a class='popup_menu_item' id='es_posthistory' href='${window.location.pathname}/posthistory'>
                <img src='//steamcommunity-a.akamaihd.net/public/images/skin_1/icon_btn_comment.png'>&nbsp; ${Localization.str.post_history}
                </a>`);
    };

    ProfileHomePageClass.prototype.inGameNameLink = function() {
        let ingameNode = document.querySelector("input[name='ingameAppID']");
        if (!ingameNode || !ingameNode.value) { return; }

        let tooltip = Localization.str.view_in_store;

        let node = document.querySelector(".profile_in_game_name");
        HTML.inner(node, `<a data-tooltip-html="${tooltip}" href="//store.steampowered.com/app/${ingameNode.value}" target="_blank">${node.textContent}</a>`);
        ExtensionLayer.runInPageContext(() => SetupTooltips( { tooltipCSSClass: 'community_tooltip'} ));
    };

    ProfileHomePageClass.prototype.addProfileStyle = function() {
        if (document.querySelector("body.profile_page.private_profile")) { return; }

        ProfileData.promise().then(data => {
            if (!data || !data.style) { return; }

            let style = ProfileData.getStyle();
            let stylesheet = document.createElement('link');
            stylesheet.rel = 'stylesheet';
            stylesheet.type = 'text/css';
            let availableStyles = ["clear", "goldenprofile", "green", "holiday2014", "orange", "pink", "purple", "red", "teal", "yellow", "blue", "grey"];
            if (availableStyles.indexOf(style) === -1) { return; }

            document.body.classList.add("es_profile_style");
            switch (style) {
                case "goldenprofile":
                    stylesheet.href = 'https://steamcommunity-a.akamaihd.net/public/css/promo/lny2019/goldenprofile.css';
                    document.head.appendChild(stylesheet);

                    let container = document.createElement("div");
                    container.classList.add("profile_lny_wrapper");

                    let profilePageNode = document.querySelector(".responsive_page_template_content .profile_page");
                    DOMHelper.wrap(container, profilePageNode);

                    profilePageNode.classList.add("lnyprofile");

                    HTML.afterBegin(profilePageNode,
                        `<div class="lny_sides_position">
                            <div class="lny_side left">
                                <div class="lny_side_background"></div>
                                <div class="lny_top"></div>
                                <div class="lny_pig"></div>
                                <div class="lny_pendulum">
                                    <div class="lny_strings"></div>
                                    <img src="https://steamcdn-a.akamaihd.net/steamcommunity/public/assets/lny2019/goldenprofile/test_lantern1.png">
                                </div>
                            </div>
                            <div class="lny_side right">
                                <div class="lny_side_background"></div>
                                <div class="lny_top"></div>
                                <div class="lny_pig"></div>
                                <div class="lny_pendulum">
                                    <div class="lny_strings"></div>
                                    <img src="https://steamcdn-a.akamaihd.net/steamcommunity/public/assets/lny2019/goldenprofile/test_lantern2.png">
                                </div>
                            </div>
                        </div>`);

                    HTML.beforeBegin(
                        ".profile_header",
                        `<div class="lny_header">
                            <div class="lny_pig_center"></div>
                        </div>`);

                    break;
                case "holiday2014":
                    stylesheet.href = '//steamcommunity-a.akamaihd.net/public/css/skin_1/holidayprofile.css';
                    document.head.appendChild(stylesheet);

                    HTML.beforeEnd(".profile_header_bg_texture", "<div class='holidayprofile_header_overlay'></div>");
                    document.querySelector(".profile_page").classList.add("holidayprofile");

                    let script = document.createElement("script");
                    script.type = "text/javascript";
                    script.src = ExtensionLayer.getLocalUrl("js/steam/holidayprofile.js");
                    document.body.append(script);

                    break;
                case "clear":
                    document.body.classList.add("es_style_clear");
                    break;
                default:
                    let styleUrl = ExtensionLayer.getLocalUrl("img/profile_styles/" + style + "/style.css");
                    let headerImg = ExtensionLayer.getLocalUrl("img/profile_styles/" + style + "/header.jpg");
                    let showcase = ExtensionLayer.getLocalUrl("img/profile_styles/" + style + "/showcase.png");

                    stylesheet.href = styleUrl;
                    document.head.appendChild(stylesheet);

                    document.querySelector(".profile_header_bg_texture").style.backgroundImage = "url('" + headerImg + "')";
                    document.querySelectorAll(".profile_customization").forEach(node => node.style.backgroundImage = "url('" + showcase + "')");
                    break;
            }
            stylesheet = null;
        });
    };

    ProfileHomePageClass.prototype.addTwitchInfo = async function() {

        if (!SyncedStorage.get('profile_showcase_twitch')) { return; }

        if (User.isSignedIn && !SyncedStorage.get('profile_showcase_own_twitch')) {
            if (window.location.pathname == User.profilePath) {
                // Don't show our Twitch.tv showcase on our own profile
                return;
            }
        }

        let selector = ".profile_summary a[href*='twitch.tv/']";
        if (!SyncedStorage.get('profile_showcase_twitch_profileonly')) {
            selector += ", .customtext_showcase a[href*='twitch.tv/']";
        }
        let search = document.querySelector(selector);
        if (!search) { return; }

        let m = search.href.match(/twitch\.tv\/(.+)/);
        if (!m) { return; }

        let twitchId = m[1].replace(/\//g, "");

        let data = await Background.action("twitch.stream", { 'channel': twitchId, } );

        // If the channel is not streaming, the response is: {"result":"success","data":[]}
        if (Array.isArray(data)) { return; }
        
        let channelUsername = data.user_name;
        let channelUrl = search.href;
        let channelGame = data.game;
        let channelViewers = data.viewer_count;
        let previewUrl = data.thumbnail_url.replace("{width}", 636).replace("{height}", 358) + "?" + Math.random();

        HTML.afterBegin(".profile_leftcol",
            `<div class='profile_customization' id='es_twitch'>
                    <div class='profile_customization_header'>
                        ${Localization.str.twitch.now_streaming.replace("__username__", channelUsername)}
                    </div>
                    <a class="esi-stream" href="${channelUrl}">
                        <div class="esi-stream__preview">
                            <img src="${previewUrl}">
                            <img src="https://steamstore-a.akamaihd.net/public/shared/images/apphubs/play_icon80.png" class="esi-stream__play">
                            <div class="esi-stream__live">Live on <span class="esi-stream__twitch">Twitch</span></div>
                        </div>
                        <div class="esi-stream__title">
                            <span class="live_stream_app">${channelGame}</span>
                            <span class="live_steam_viewers">${channelViewers} ${Localization.str.twitch.viewers}</span>
                        </div>
                    </a>
                </div>`);
    };

    ProfileHomePageClass.prototype.chatDropdownOptions = function() {
        if (!User.isSignedIn) { return; }

        let sendButton = document.querySelector("div.profile_header_actions > a[href*=OpenFriendChat]");
        if (!sendButton) { return; }

        let m = sendButton.href.match(/javascript:OpenFriendChat\( '(\d+)'.*\)/);
        if (!m) { return; }
        let chatId = m[1];

        let rgProfileData = HTMLParser.getVariableFromDom("g_rgProfileData", "object");
        let friendSteamId = rgProfileData.steamid;

        HTML.beforeBegin(sendButton,
            `<span class="btn_profile_action btn_medium" id="profile_chat_dropdown_link">
                <span>${sendButton.textContent}<img src="https://steamcommunity-a.akamaihd.net/public/images/profile/profile_action_dropdown.png"></span>
            </span>
            <div class="popup_block" id="profile_chat_dropdown" style="visibility: visible; top: 168px; left: 679px; display: none; opacity: 1;">
                <div class="popup_body popup_menu shadow_content" style="box-shadow: 0 0 12px #000">
                    <a id="btnWebChat" class="popup_menu_item webchat">
                        <img src="https://steamcommunity-a.akamaihd.net/public/images/skin_1/icon_btn_comment.png">
                        &nbsp; ${Localization.str.web_browser_chat}
                    </a>
                    <a class="popup_menu_item" href="steam://friends/message/${friendSteamId}">
                        <img src="https://steamcommunity-a.akamaihd.net/public/images/skin_1/icon_btn_comment.png">
                        &nbsp; ${Localization.str.steam_client_chat}
                    </a>
                </div>
            </div>`);
        sendButton.remove();

        document.querySelector("#btnWebChat").addEventListener("click", function(){
            ExtensionLayer.runInPageContext(`OpenFriendChatInWebChat('${chatId}')`);
        });

        document.querySelector("#profile_chat_dropdown_link").addEventListener("click", function(e) {
            ExtensionLayer.runInPageContext(() => ShowMenu( document.querySelector('#profile_chat_dropdown_link'), 'profile_chat_dropdown', 'right' ));
        });
    };

    return ProfileHomePageClass;
})();

let GamesPageClass = (function(){

    function GamesPageClass() {

        let page = window.location.href.match(/(\/(?:id|profiles)\/.+\/)games\/?(\?tab=all)?/);

        if (page[2]) {
            this.computeStats();
            this.handleCommonGames();
            this.addGamelistAchievements(page[1]);
        }
    }

    // Display total time played for all games
    GamesPageClass.prototype.computeStats = function() {
        let games = HTMLParser.getVariableFromDom("rgGames", "array");

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

        HTML.beforeBegin("#mainContents", html);
    };

    let scrollTimeout = null;

    GamesPageClass.prototype.addGamelistAchievements = function(userProfileLink) {
        if (!SyncedStorage.get("showallachievements")) { return; }

        let node = document.querySelector(".profile_small_header_texture a");
        if (!node) { return; }
        let statsLink = "https://steamcommunity.com/" + userProfileLink + "stats/";

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

                if (!Viewport.isElementInViewport(node)) {
                    if (hadNodesInView) { break; }
                    continue;
                }

                hadNodesInView = true;

                let appid = GameId.getAppidWishlist(node.id);
                node.classList.add("es_achievements_checked");
                if (!node.innerHTML.match(/ico_stats\.png/)) { continue; }
                if (!node.querySelector("h5.hours_played")) { continue; }

                // Copy achievement stats to row
                HTML.afterEnd(node.querySelector("h5"), "<div class='es_recentAchievements' id='es_app_" + appid + "'></div>");

                Stats.getAchievementBar(appid).then(achieveBar => {
                    let node = document.querySelector("#es_app_" + appid);

                    if (!achieveBar) return;

                    HTML.inner(node, achieveBar);

                }, err => {
                    console.error(err);
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

        let games = HTMLParser.getVariableFromText(data, "rgGames", "array");;
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
        let that = this;
        ProfileData.clearOwn().then(() => {
            if (window.location.pathname.indexOf("/settings") < 0) {
                that.addBackgroundSelection();
                that.addStyleSelection();
            }
        })
    }

    function showBgFormLoading() {
        document.querySelector("#es_bg .es_loading").style.display="block";
    }

    function hideBgFormLoading() {
        document.querySelector("#es_bg .es_loading").style.display="none";
    }

    function getGameSelectOptions(games) {
        let selectedAppid = ProfileData.getBgAppid();
        let selected = false;

        let html = "<option value='0' id='0'>" + Localization.str.noneselected + "</option>";
        for (let game of games) {
            let id = parseInt(game[0]);
            let title = HTML.escape(game[1]);

            let selectedAttr = "";
            if (selectedAppid === id) {
                selectedAttr = " selected='selected'";
                selected = true;
            }
            html += `<option value='${id}'${selectedAttr}>${title}</option>`;
        }

        return [selected, html];
    }

    async function onGameSelected() {
        let appid = parseInt(document.querySelector("#es_bg_game").value);

        let imgSelectNode = document.querySelector("#es_bg_img");
        imgSelectNode.style.display = "none";

        if (appid === 0) {
            document.querySelector("#es_bg_preview").src = "";
            return
        }

        showBgFormLoading();

        let result = await Background.action("profile.background", {
            appid: appid,
            profile: SteamId.getSteamId()
        });

        let selectedImg = ProfileData.getBgImg();

        let html = "";
        for (let value of result) {
            let img = HTML.escape(value[0].toString());
            let name = HTML.escape(value[1].toString());

            let selectedAttr = "";
            if (img === selectedImg) {
                selectedAttr = " selected='selected'";
            }

            html += `<option value='${img}'${selectedAttr}>${name}</option>`;
        }

        HTML.inner(imgSelectNode, html);
        imgSelectNode.style.display="block";
        hideBgFormLoading();

        onImgSelected();

        // Enable the "save" button
        document.querySelector("#es_background_save_btn").classList.remove("btn_disabled");
    }

    function onImgSelected() {
        document.querySelector("#es_bg_preview").src
            = "https://steamcommunity.com/economy/image/" + document.querySelector("#es_bg_img").value + "/622x349";
    }

    ProfileEditPageClass.prototype.addBackgroundSelection = async function() {

        let html =
            `<div class='group_content group_summary'>
                <div class='formRow'>
                    ${Localization.str.custom_background}:
                    <span class='formRowHint' data-tooltip-text='${Localization.str.custom_background_help}'>(?)</span>
                </div>
                <div id="es_bg" class="es_profile_group">
                    <div id='es_bg_game_select'><select name='es_bg_game' id='es_bg_game' class='gray_bevel dynInput' style="display:none"></select></div>
                    <div id='es_bg_img_select'><select name='es_bg_img' id='es_bg_img' class='gray_bevel dynInput' style="display:none"></select></div>
                    <div class='es_loading'>
                        <img src='https://steamcommunity-a.akamaihd.net/public/images/login/throbber.gif'>
                        <span>${Localization.str.loading}</span>
                    </div>
                    <img id='es_bg_preview' class="es_profile_preview" src=''>
                    <div id="es_bg_buttons" class="es_profile_buttons">
                        <span id='es_background_remove_btn' class='btn_grey_white_innerfade btn_small'>
                            <span>${Localization.str.remove}</span>
                        </span>&nbsp;
                        <span id='es_background_save_btn' class='btn_grey_white_innerfade btn_small btn_disabled'>
                            <span>${Localization.str.save}</span>
                        </span>
                    </div>
                </div>
            </div>`;

        HTML.beforeBegin(".group_content_bodytext", html);
        ExtensionLayer.runInPageContext(() => SetupTooltips( { tooltipCSSClass: 'community_tooltip'} ));

        let response = await Background.action('profile.background.games');

        let gameSelectNode = document.querySelector("#es_bg_game");
        let imgSelectNode = document.querySelector("#es_bg_img");

        let gameList = getGameSelectOptions(response);
        HTML.inner(gameSelectNode, gameList[1]);
        gameSelectNode.style.display = "block";

        let currentImg = ProfileData.getBgImgUrl(622,349);
        if (currentImg) {
            document.querySelector("#es_bg_preview").src = currentImg;
            onGameSelected();
        }

        hideBgFormLoading();

        // on game selected
        gameSelectNode.addEventListener("change", onGameSelected);
        imgSelectNode.addEventListener("change", onImgSelected);

        document.querySelector("#es_background_remove_btn").addEventListener("click", async function() {
            await ProfileData.clearOwn();
            window.location.href = Config.ApiServerHost + `/v01/profile/background/edit/delete/`;
        });

        document.querySelector("#es_background_save_btn").addEventListener("click", async function(e) {
            if (e.target.closest("#es_background_save_btn").classList.contains("btn_disabled")) { return; }
            await ProfileData.clearOwn();

            let selectedAppid = encodeURIComponent(gameSelectNode.value);
            let selectedImg = encodeURIComponent(imgSelectNode.value);
            window.location.href = Config.ApiServerHost+`/v01/profile/background/edit/save/?appid=${selectedAppid}&img=${selectedImg}`;
        });
    };

    ProfileEditPageClass.prototype.addStyleSelection = function() {
        let html =
            `<div class='group_content group_summary'>
                <div class='formRow'>
                    ${Localization.str.custom_style}:
                    <span class='formRowHint' data-tooltip-text='${Localization.str.custom_style_help}'>(?)</span>
                </div>
                <div class="es_profile_group">
                    <div id='es_style_select'>
                        <select name='es_style' id='es_style' class='gray_bevel dynInput'>
                            <option id='remove' value='remove'>${Localization.str.noneselected}</option>
                            <option id='goldenprofile' value='goldenprofile'>Lunar Sale 2019</option>
                            <option id='holiday2014' value='holiday2014'>Holiday Profile 2014</option>
                            <option id='blue' value='blue'>Blue Theme</option>
                            <option id='clear' value='clear'>Clear Theme</option>
                            <option id='green' value='green'>Green Theme</option>
                            <option id='orange' value='orange'>Orange Theme</option
                            <option id='pink' value='pink'>Pink Theme</option
                            <option id='purple' value='purple'>Purple Theme</option>
                            <option id='red' value='red'>Red Theme</option>
                            <option id='teal' value='teal'>Teal Theme</option>
                            <option id='yellow' value='yellow'>Yellow Theme</option>
                            <option id='grey' value='grey'>Grey Theme</option>
                        </select>
                    </div>
                    <img id='es_style_preview' class="es_profile_preview" src=''>
                    <div id="es_style_buttons" class="es_profile_buttons">
                        <span id='es_style_remove_btn' class='btn_grey_white_innerfade btn_small'>
                            <span>${Localization.str.remove}</span>
                        </span>&nbsp;
                        <span id='es_style_save_btn' class='btn_grey_white_innerfade btn_small btn_disabled'>
                            <span>${Localization.str.save}</span>
                        </span>
                    </div>
                </div>
            </div>`;

        HTML.beforeBegin(".group_content_bodytext", html);

        ExtensionLayer.runInPageContext(() => SetupTooltips( { tooltipCSSClass: 'community_tooltip'} ));

        let styleSelectNode = document.querySelector("#es_style");

        let currentStyle = ProfileData.getStyle();
        if (currentStyle) {
            styleSelectNode.value = currentStyle;

            let imgNode = document.querySelector("#es_style_preview");
            imgNode.src = ExtensionLayer.getLocalUrl("img/profile_styles/" + currentStyle + "/preview.png");

            if (currentStyle === "remove") {
                imgNode.style.display = "none";
            }
        }

        styleSelectNode.addEventListener("change", function(){
            let imgNode = document.querySelector("#es_style_preview");
            if (styleSelectNode.value === "remove") {
                imgNode.style.display = "none";
            } else {
                imgNode.style.display = "block";
                imgNode.src = ExtensionLayer.getLocalUrl("img/profile_styles/" + styleSelectNode.value + "/preview.png");
            }

            // Enable the "save" button
            document.querySelector("#es_style_save_btn").classList.remove("btn_disabled");
        });

        document.querySelector("#es_style_save_btn").addEventListener("click", async function(e) {
            if (e.target.closest("#es_style_save_btn").classList.contains("btn_disabled")) { return; }
            await ProfileData.clearOwn();

            let selectedStyle = encodeURIComponent(styleSelectNode.value);
            window.location.href = Config.ApiServerHost+`/v01/profile/style/edit/save/?style=${selectedStyle}`;
        });

        document.querySelector("#es_style_remove_btn").addEventListener("click", async function(e) {
            await ProfileData.clearOwn();
            window.location.href = Config.ApiServerHost + "/v01/profile/style/edit/delete/";
        });
    };

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

    function addSortMetaData(key, achievements) {
        if (key === "default") {
            achievements.forEach((row, i) => _nodes.default.push([i, row]));
            return Promise.resolve();
        } else if (key === "time") {
            let url = new URL(window.location.href);
            url.searchParams.append("xml", 1);
            return RequestData.getHttp(url.toString()).then(result => {
                let xmlDoc = new DOMParser().parseFromString(result, "text/xml");
                let xmlTags = xmlDoc.getElementsByTagName("achievement");
                for (let i = 0; i < _nodes.default.length; ++i) {
                    let node = _nodes.default[i][1];
                    let unlockTime = 0;
                    let unlockTimestamp = xmlTags[i].querySelector("unlockTimestamp");
                    if (unlockTimestamp) {
                        unlockTime = unlockTimestamp.textContent;
                    }
                    _nodes.time.push([unlockTime, node]);

                    node.classList.add(unlockTime === 0 ? "esi_ach_locked" : "esi_ach_unlocked");
                }
            }).then(() => _nodes.time = _nodes.time.sort((a, b) => {
                return b[0] - a[0]; // descending sort
            })).catch(err => console.error("Failed to retrieve timestamps for the achievements", err));
        }
    }

    async function sortBy(key, personal) {
        if (key === "time") {
            if (!_nodes.time.length) {
                await addSortMetaData(key, personal.querySelectorAll(".achieveRow"));
            }
        }
        
        for (let br of personal.querySelectorAll(":scope > br")) br.remove();
        for (let item of _nodes[key]) {
            let node = item[1];
            personal.insertAdjacentElement("beforeend", node);
        }
    }

    StatsPageClass.prototype.addAchievementSort = function() {
        let personal = document.querySelector("#personalAchieve");
        if (!personal) { return; }

        HTML.beforeBegin("#tabs",
            `<div id='achievement_sort_options' class='sort_options'>
                ${Localization.str.sort_by}
                <span id='achievement_sort_default'>${Localization.str.theworddefault}</span>
                <span id='achievement_sort_date' class='es_achievement_sort_link'>${Localization.str.date_unlocked}</span>
            </div>`);

        addSortMetaData("default", personal.querySelectorAll(".achieveRow"));

        document.querySelector("#achievement_sort_default").addEventListener("click", e => {
            document.querySelector("#achievement_sort_date").classList.add("es_achievement_sort_link");
            e.target.classList.remove("es_achievement_sort_link");
            sortBy("default", personal);
        });

        document.querySelector("#achievement_sort_date").addEventListener("click", e => {
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
        HTML.afterEnd(viewFullBtn,
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
                let dom = HTMLParser.htmlToDOM(result);

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

        let result = await Background.action('appdetails', { 'appids': giftAppid, 'filters': 'price_overview', } );
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
            HTML.beforeEnd(itemActions,
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
            HTML.beforeEnd(itemActions,
                `<div class='es_game_purchase_action' style='margin-bottom:16px'>
                    <div class='es_game_purchase_action_bg'>
                        <div class='es_game_purchase_price es_price'>${price}</div>
                    </div>
                </div>`);
        }
    }

    function addOneClickGemsOption(item, appid, assetId) {
        if (!SyncedStorage.get("show1clickgoo")) { return; }

        let quickGrind = document.querySelector("#es_quickgrind");
        if (quickGrind) { quickGrind.parentNode.remove(); }

        let scrapActions = document.querySelector("#iteminfo" + item + "_item_scrap_actions");
        let turnWord = scrapActions.querySelector("a span").textContent;

        let divs = scrapActions.querySelectorAll("div");
        HTML.beforeBegin(divs[divs.length-1],
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
        let quickSell = document.getElementById("es_quicksell" + assetId);
        let instantSell = document.getElementById("es_instantsell" + assetId);
        
        // Add Quick Sell button
        if (quickSell && priceHighValue && priceHighValue > priceLowValue) {
            quickSell.dataset.price = priceHighValue;
            quickSell.querySelector(".item_market_action_button_contents").textContent = Localization.str.quick_sell.replace("__amount__", new Price(priceHighValue, Currency.currencyNumberToType(walletCurrency)));
            quickSell.style.display = "block";
        }

        // Add Instant Sell button
        if (instantSell && priceLowValue) {
            instantSell.dataset.price = priceLowValue;
            instantSell.querySelector(".item_market_action_button_contents").textContent = Localization.str.instant_sell.replace("__amount__", new Price(priceLowValue, Currency.currencyNumberToType(walletCurrency)));
            instantSell.style.display = "block";
        }
    }

    async function addQuickSellOptions(marketActions, thisItem, marketable, contextId, globalId, assetId, sessionId, walletCurrency) {
        if (!SyncedStorage.get("quickinv")) { return; }
        if (!marketable) { return; }
        if (contextId !== 6 || globalId !== 753) { return; }
        // 753 is the appid for "Steam" in the Steam Inventory
        // 6 is the context used for "Community Items"; backgrounds, emoticons and trading cards

        if (!thisItem.classList.contains("es-loading")) {
            let url = marketActions.querySelector("a").href;

            thisItem.classList.add("es-loading");

            // Add the links with no data, so we can bind actions to them, we add the data later
            HTML.beforeEnd(marketActions, makeMarketButton("es_quicksell" + assetId));
            HTML.beforeEnd(marketActions, makeMarketButton("es_instantsell" + assetId));

            // Check if price is stored in data
            if (thisItem.classList.contains("es-price-loaded")) {
                let priceHighValue = thisItem.dataset.priceHigh;
                let priceLowValue = thisItem.dataset.priceLow;

                updateMarketButtons(assetId, priceHighValue, priceLowValue, walletCurrency);
            } else {
                let result = await RequestData.getHttp(url);

                let m = result.match(/Market_LoadOrderSpread\( (\d+) \)/);

                if (m) {
                    let marketId = m[1];

                    let marketUrl = "https://steamcommunity.com/market/itemordershistogram?language=english&currency=" + walletCurrency + "&item_nameid=" + marketId;
                    let market = await RequestData.getJson(marketUrl);

                    let priceHigh = parseFloat(market.lowest_sell_order / 100) + parseFloat(SyncedStorage.get("quickinv_diff"));
                    let priceLow = market.highest_buy_order / 100;
                    // priceHigh.currency == priceLow.currency == Currency.customCurrency, the arithmetic here is in walletCurrency

                    if (priceHigh < 0.03) priceHigh = 0.03;

                    // Store prices as data
                    if (priceHigh > priceLow) {
                        thisItem.dataset.priceHigh = priceHigh;
                    }
                    if (market.highest_buy_order) {
                        thisItem.dataset.priceLow = priceLow;
                    }

                    // Fixes multiple buttons
                    if (document.querySelector(".item.activeInfo") === thisItem) {
                        updateMarketButtons(assetId, priceHigh, priceLow, walletCurrency);
                    }

                    thisItem.classList.add("es-price-loaded");
                }
            }
            // Loading request either succeeded or failed, no need to flag as still in progress
            thisItem.classList.remove("es-loading");
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

                HTML.inner(
                    marketActions.querySelector("div"),
                    "<div class='es_loading' style='min-height: 66px;'><img src='https://steamcommunity-a.akamaihd.net/public/images/login/throbber.gif'><span>" + Localization.str.selling + "</div>"
                );
                ExtensionLayer.runInPageContext(`() => Messenger.postMessage("sendFee", {feeInfo: CalculateFeeAmount(${sellPrice}, 0.10), sessionID: "${sessionId}", global_id: "${globalId}", contextID: "${contextId}", assetID: "${assetId}"})`);
            });
        }
    }

    function getMarketOverviewHtml(node) {
        let html = '<div style="min-height:3em;margin-left:1em;">';

        if (node.dataset.lowestPrice && node.dataset.lowestPrice !== "nodata") {
            html += Localization.str.starting_at.replace("__price__", node.dataset.lowestPrice);

            if (node.dataset.dataSold) {
                html += '<br>' + Localization.str.volume_sold_last_24.replace("__sold__", node.dataset.dataSold);
            }

            if (node.dataset.cardsPrice) {
                html += '<br>' + Localization.str.avg_price_3cards.replace("__price__", node.dataset.cardsPrice);
            }
        } else {
            html += Localization.str.no_price_data;
        }

        html += '</div>';
        return html;
    }

    async function showMarketOverview(thisItem, marketActions, globalId, hashName, appid, isBooster, walletCurrencyNumber) {
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

            let overviewPromise = RequestData.getJson(`https://steamcommunity.com/market/priceoverview/?currency=${walletCurrencyNumber}&appid=${globalId}&market_hash_name=${encodeURIComponent(hashName)}`);

            if (isBooster) {
                thisItem.dataset.cardsPrice = "nodata";

                try {
                    let walletCurrency = Currency.currencyNumberToType(walletCurrencyNumber);
                    let result = await Background.action("market.averagecardprice", { 'appid': appid, 'currency': walletCurrency, } );
                    thisItem.dataset.cardsPrice = new Price(result.average, walletCurrency);
                } catch (error) {
                    console.error(error);
                }
            }

            try {
                let data = await overviewPromise;

                thisItem.dataset.lowestPrice = "nodata";
                if (data && data.success) {
                    thisItem.dataset.lowestPrice = data.lowest_price || "nodata";
                    thisItem.dataset.soldVolume = data.volume;
                }
            } catch (error) {
                console.error("Couldn't load price overview from market", error);
                HTML.inner(firstDiv, html); // add market link anyway
                return;
            }
        }

        html += getMarketOverviewHtml(thisItem);

        HTML.inner(firstDiv, html);
    }

    async function addBoosterPackProgress(marketActions, item, appid) {
        HTML.afterBegin(`#iteminfo${item}_item_owner_actions`,
            `<a class="btn_small btn_grey_white_innerfade" href="https://steamcommunity.com/my/gamecards/${appid}/"><span>${Localization.str.view_badge_progress}</span></a>`);
    }

    function inventoryMarketHelper([item, marketable, globalId, hashName, assetType, assetId, sessionId, contextId, walletCurrency, ownerSteamId, restriction, expired]) {
        marketable = parseInt(marketable);
        globalId = parseInt(globalId);
        contextId = parseInt(contextId);
        restriction = parseInt(restriction);
        let isGift = assetType && /Gift/i.test(assetType);
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

        if ((ownsInventory && restriction > 0 && !marketable && !expired && hashName !== "753-Gems") || marketable) {
            showMarketOverview(thisItem, marketActions, globalId, hashName, appid, isBooster, walletCurrency);
        }
    }

    function prepareMarketForInventory() {
        ExtensionLayer.runInPageContext(function(){
            $J(document).on("click", ".inventory_item_link, .newitem", function(){
                if (!g_ActiveInventory.selectedItem.description.market_hash_name) {
                    g_ActiveInventory.selectedItem.description.market_hash_name = g_ActiveInventory.selectedItem.description.name;
                }
                let market_expired = false;
                if (g_ActiveInventory.selectedItem.description) {
                    market_expired = g_ActiveInventory.selectedItem.description.descriptions.reduce((acc, el) => (acc || el.value === "This item can no longer be bought or sold on the Community Market."), false);
                }

                Messenger.postMessage("sendMessage", [
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
                    g_ActiveInventory.selectedItem.description.market_marketable_restriction,
                    market_expired
                ]);
            });
        });
        
        Messenger.addMessageListener("sendMessage", info => inventoryMarketHelper(info), false);

        Messenger.addMessageListener("sendFee", info => {
            let sellPrice = info.feeInfo.amount - info.feeInfo.fees;
            let formData = new FormData();
            formData.append("sessionid", info.sessionID);
            formData.append("appid", info.global_id);
            formData.append("contextid", info.contextID);
            formData.append("assetid", info.assetID);
            formData.append("amount", 1);
            formData.append("price", sellPrice);

            /*
            * TODO test what we need to send in request, this is original:
            * mode: "cors", // CORS to cover requests sent from http://steamcommunity.com
            * credentials: "include",
            * headers: { origin: window.location.origin },
            * referrer: window.location.origin + window.location.pathname
            */

            RequestData.post("https://steamcommunity.com/market/sellitem/", formData, {
                withCredentials: true
            }).then(() => {
                document.querySelector("#es_instantsell" + info.assetID).parentNode.style.display = "none";

                let id = info.global_id + "_" + info.contextID + "_" + info.assetID;
                let node = document.querySelector("[id='" + id + "']");
                node.classList.add("btn_disabled", "activeInfo");
                node.style.pointerEvents = "none";
            });
        }, false);
    }

    function addInventoryGoToPage(){
        if (!SyncedStorage.get("showinvnav")) { return; }

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
        HTML.afterEnd("#pagebtn_previous", "<a id='pagebtn_first' class='pagebtn pagecontrol_element disabled'>&lt;&lt;</a>");
        document.querySelector("#pagebtn_first").addEventListener("click", () => {
            ExtensionLayer.runInPageContext("() => { InventoryFirstPage(); }");
        });

        // Go to last page
        HTML.beforeBegin("#pagebtn_next", "<a id='pagebtn_last' class='pagebtn pagecontrol_element'>&gt;&gt;</a>");
        document.querySelector("#pagebtn_last").addEventListener("click", () => {
            ExtensionLayer.runInPageContext("() => { InventoryLastPage(); }");
        });

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
        this.totalWorth = 0;

        if (CommunityCommon.currentUserIsOwner()) {
            this.updateHead();
            this.addBadgeCompletionCost();
            this.addTotalDropsCount();
        }

        CommunityCommon.addCardExchangeLinks();

        this.addBadgeSort();
        this.addBadgeFilter();
        this.addBadgeViewOptions();
    }

    BadgesPageClass.prototype.updateHead = async function() {
        // move faq to the middle
        let xpBlockRight = document.querySelector(".profile_xp_block_right");

        HTML.beforeEnd(
            document.querySelector(".profile_xp_block_mid"),
            "<div class='es_faq_cards'>" + xpBlockRight.innerHTML + "</div>"
        );
        xpBlockRight.innerHTML = "<div id='es_cards_worth'></div>";
    };

    // Display the cost estimate of crafting a game badge by purchasing unowned trading cards
    BadgesPageClass.prototype.addBadgeCompletionCost = async function() {
        if (!CommunityCommon.currentUserIsOwner()) { return; }

        let appids = [];
        let nodes = [];
        let foilAppids = [];

        let rows = document.querySelectorAll(".badge_row.is_link:not(.esi-badge)");
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

        if (appids.length === 0 && foilAppids.length === 0) {
            return;
        }

        let data;
        try {
            data = await Background.action("market.averagecardprices", {
                currency: Currency.storeCurrency,
                appids: appids.join(","),
                foilappids: foilAppids.join(",")
            });
        } catch (exception) {
            console.error("Couldn't retrieve average card prices", exception);
            return;
        }

        // regular cards
        for (let item of nodes) {
            let appid = item[0];
            let node = item[1];
            let isFoil = item[2];

            let key = isFoil ? "foil" : "regular";
            if (!data[appid] || !data[appid][key]) { continue; }

            let averagePrice = data[appid][key]['average'];

            let cost;
            let progressInfoNode = node.querySelector("div.badge_progress_info");
            if (progressInfoNode) {
                let card = progressInfoNode.textContent.trim().match(/(\d+)\D*(\d+)/);
                if (card) {
                    let need = card[2] - card[1];
                    cost = new Price(averagePrice * need, Currency.storeCurrency);
                }
            }

            if (!isFoil) {
                let progressBoldNode = node.querySelector(".progress_info_bold");
                if (progressBoldNode) {
                    let drops = progressBoldNode.textContent.match(/\d+/);
                    if (drops) {
                        let worth = new Price(drops[0] * averagePrice, Currency.storeCurrency);

                        if (worth.value > 0) {
                            this.totalWorth += worth.value;

                            let howToNode = node.querySelector(".how_to_get_card_drops");
                            HTML.afterEnd(howToNode,
                                `<span class='es_card_drop_worth' data-es-card-worth='${worth.value}'>${Localization.str.drops_worth_avg} ${worth}</span>`);
                            howToNode.remove();
                        }
                    }
                }
            }

            if (cost) {
                let badgeNameBox = DOMHelper.selectLastNode(node, ".badge_empty_name");
                if (badgeNameBox) {
                    HTML.afterEnd(badgeNameBox, "<div class='badge_info_unlocked' style='color: #5c5c5c;'>" + Localization.str.badge_completion_avg.replace("__cost__", cost) + "</div>");
                }
            }

            // note CSS styles moved to .css instead of doing it in javascript
            node.classList.add("esi-badge");
        }

        document.querySelector("#es_cards_worth").innerText = Localization.str.drops_worth_avg + " " + new Price(this.totalWorth, Currency.storeCurrency);
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

                let dom = HTMLParser.htmlToDOM(response);
                await callback(dom);

            } catch (exception) {
                console.error("Failed to load " + baseUrl + p + ": " + exception);
                return;
            }
        }
    }

    BadgesPageClass.prototype.loadAllPages = async function() {
        if (this.hasAllPagesLoaded) { return; }
        this.hasAllPagesLoaded = true;

        let sheetNode = document.querySelector(".badges_sheet");

        // let images = Viewport.getVariableFromDom("g_rgDelayedLoadImages", "object");

        let that = this;
        await eachBadgePage(async function(dom){
            let nodes = dom.querySelectorAll(".badge_row");
            for (let node of nodes) {
                sheetNode.append(node);
            }

            CommunityCommon.addCardExchangeLinks();
            await that.addBadgeCompletionCost();

            // images = Object.assign(images, Viewport.getVariableFromDom("g_rgDelayedLoadImages", "object", dom));
        });

        let nodes = document.querySelectorAll(".profile_paging");
        for (let node of nodes) {
            node.style.display = "none";
        }

        // TODO this doesn't seem to work, can't figure out why right now. Lazy loader doesn't see updated object?
        // ExtensionLayer.runInPageContext("function(){g_rgDelayedLoadImages = " + JSON.stringify(images) + ";}");
        // resetLazyLoader();
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
            HTML.inner(
                "#es_calculations",
                Localization.str.card_drops_remaining.replace("__drops__", dropsCount)
                    + "<br>" + Localization.str.games_with_drops.replace("__dropsgames__", dropsGames)
            );

            let response;
            try {
                response = await RequestData.getHttp("https://steamcommunity.com/my/ajaxgetboostereligibility/");
            } catch(exception) {
                console.error("Failed to load booster eligibility", exception);
                return;
            }

            let boosterGames = response.match(/class="booster_eligibility_game"/g);
            let boosterCount = boosterGames && boosterGames.length || 0;

            HTML.beforeEnd("#es_calculations",
                "<br>" + Localization.str.games_with_booster.replace("__boostergames__", boosterCount));
        }

        countDropsFromDOM(document);

        if (this.hasMultiplePages) {
            HTML.afterBegin(".profile_xp_block_right", "<div id='es_calculations'><div class='btn_grey_black btn_small_thin'><span>" + Localization.str.drop_calc + "</span></div></div>");

            document.querySelector("#es_calculations").addEventListener("click", async function(e) {
                if (completed) { return; }

                document.querySelector("#es_calculations").textContent = Localization.str.loading;

                await eachBadgePage(countDropsFromDOM);

                addDropsCount();
                completed = true;
            });

        } else {
            HTML.beforeBegin(".profile_xp_block_right",
                "<div id='es_calculations'>" + Localization.str.drop_calc + "</div>");

            addDropsCount();
        }
    };

    function resetLazyLoader() {
        return; // FIXME this doesn't seem to work

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
            HTML.beforeEnd(sheetNode, row[0]);
        }

        resetLazyLoader();
        document.querySelector("#es_sort_active").textContent = activeText;
        document.querySelector("#es_sort_flyout").style.display = "none"; // TODO fadeout
    }

    BadgesPageClass.prototype.addBadgeSort = function() {
        let isOwnProfile = CommunityCommon.currentUserIsOwner();
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
        HTML.beforeEnd(".profile_badges_sortoptions",
            `<div id="es_sort_flyout" class="popup_block_new flyout_tab_flyout responsive_slidedown" style="visibility: visible; top: 42px; left: 305px; display: none; opacity: 1;">
			    <div class="popup_body popup_menu">${linksHtml}</div>
		    </div>`);

        // Insert dropdown button
        HTML.afterEnd(".profile_badges_sortoptions span",
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

        ExtensionLayer.runInPageContext(() => BindAutoFlyoutEvents());

        if (isOwnProfile) {
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

            document.querySelector("#es_badge_sort_value").addEventListener("click", async function(e) {

                if (that.hasMultiplePages) {
                    await that.loadAllPages();
                }

                sortBadgeRows(e.target.textContent, (node) => {
                    let content = 0;
                    let dropWorth = node.querySelector(".es_card_drop_worth");
                    if (dropWorth) {
                        content = parseFloat(dropWorth.dataset.esCardWorth);
                    }
                    return content;
                });
            });
        }
    };

    BadgesPageClass.prototype.addBadgeFilter = function() {
        if (!CommunityCommon.currentUserIsOwner()) { return; }

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

        HTML.afterBegin("#wishlist_sort_options",
            "<div class='es_badge_filter' style='float: right; margin-left: 18px;'>" + html + "</div>");

        document.querySelector("#es_badge_all").addEventListener("click", () => {
            for (let badge of document.querySelectorAll(".is_link")) {
                badge.style.display = "block";
            }
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

    BadgesPageClass.prototype.addBadgeViewOptions = function() {
        let html = `<span>${Localization.str.view}</span>
            <div class="store_nav">
                <div class="tab flyout_tab" id="es_badgeview_tab" data-flyout="es_badgeview_flyout" data-flyout-align="right" data-flyout-valign="bottom">
                    <span class="pulldown">
                        <div id="es_badgeview_active" style="display: inline;">${Localization.str.theworddefault}</div>
                        <span></span>
                    </span>
                </div>
            </div>
            <div class="popup_block_new flyout_tab_flyout responsive_slidedown" id="es_badgeview_flyout" style="visibility: visible; top: 42px; left: 305px; display: none; opacity: 1;">
                <div class="popup_body popup_menu">
                    <a class="popup_menu_item es_bg_view" data-view="defaultview">${Localization.str.theworddefault}</a>
                    <a class="popup_menu_item es_bg_view" data-view="binderview">${Localization.str.binder_view}</a>
                </div>
            </div>`;

        HTML.afterBegin("#wishlist_sort_options",  "<div class='es_badge_view' style='float: right; margin-left: 18px;'>" + html + "</div>");

        // Change hash when selecting view
        document.querySelector("#es_badgeview_flyout").addEventListener("click", function(e) {
            let node = e.target.closest(".es_bg_view");
            if (!node) { return; }
            window.location.hash = node.dataset.view;
        });

        // Monitor for hash changes
        window.addEventListener("hashchange", function(){
            toggleBinderView();
        });

        toggleBinderView();

        function toggleBinderView(state) {
            if (window.location.hash === "#binderview" || state === true) {
                document.querySelector("div.maincontent").classList.add("es_binder_view");

                let mainNode = document.querySelector("div.maincontent");

                // Don't attempt changes again if already loaded
                if (!mainNode.classList.contains("es_binder_loaded")) {
                    mainNode.classList.add("es_binder_loaded");

                    let nodes = document.querySelectorAll("div.badge_row.is_link");
                    for (let node of nodes) {
                        let stats = node.querySelector("span.progress_info_bold");
                        if (stats && stats.innerHTML.match(/\d+/)) {
                            HTML.beforeEnd(node.querySelector("div.badge_content"),
                                "<span class='es_game_stats'>" + stats.outerHTML + "</span>");
                        }

                        let infoNode = node.querySelector("div.badge_progress_info");
                        if (infoNode) {
                            let card = infoNode.textContent.trim().match(/(\d+)\D*(\d+)/);
                            let text = (card) ? card[1] + " / " + card[2] : '';
                            HTML.beforeBegin(infoNode,  '<div class="es_badge_progress_info">' + text + '</div>');
                        }
                    }
                }

                // Add hash to pagination links
                let nodes = document.querySelectorAll("div.pageLinks a.pagelink, div.pageLinks a.pagebtn");
                for (let node of nodes) {
                    node.href = node.href + "#binderview";
                }

                // Triggers the loading of out-of-view badge images
                window.dispatchEvent(new Event("resize"));
                document.querySelector("#es_badgeview_active").textContent = Localization.str.binder_view;
            } else {
                document.querySelector("div.maincontent").classList.remove("es_binder_view");

                let nodes = document.querySelectorAll("div.pageLinks a.pagelink, div.pageLinks a.pagebtn");
                for (let node of nodes) {
                    node.href = node.href.replace("#binderview", "");
                }

                document.querySelector("#es_badgeview_active").textContent = Localization.str.theworddefault;
            }
        }
    };

    return BadgesPageClass;
})();

let GameCardPageClass = (function(){

    function GameCardPageClass() {
        this.appid = GameId.getAppidFromGameCard(window.location.pathname);

        CommunityCommon.addCardExchangeLinks(this.appid);
        this.addMarketLinks();
        this.addFoilLink();
        this.addStoreTradeForumLink();
        applyLinkButtonsLayout();
    }

    GameCardPageClass.prototype.addMarketLinks = async function() {
        let cost = 0;
        let isFoil = /border=1/i.test(document.URL);

        let data;
        try {
            data = await Background.action("market.cardprices", {
                appid: this.appid,
                currency: Currency.storeCurrency,
            });
        } catch(exception) {
            console.error("Failed to load card prices", exception);
            return;
        }

        let nodes = document.querySelectorAll(".badge_card_set_card");
        for (let node of nodes) {
            let cardName = node
                .querySelector(".badge_card_set_text").textContent
                .replace(/&amp;/g, '&')
                .replace(/\(\d+\)/g, '').trim();
            let cardData = data[cardName] || data[cardName + " (Trading Card)"];
            if (isFoil) {
                cardData = data[cardName + " (Foil)"] || data[cardName + " (Foil Trading Card)"];
            }

            if (cardData) {
                let marketLink = "https://steamcommunity.com/market/listings/" + cardData.url;
                let cardPrice = new Price(cardData.price, Currency.storeCurrency);

                if (node.classList.contains("unowned")) {
                    cost += cardPrice.value;
                }

                if (marketLink && cardPrice) {
                    HTML.beforeEnd(node, `<a class="es_card_search" href="${marketLink}">${Localization.str.lowest_price} ${cardPrice}</a>`);
                }
            }
        }

        if (cost > 0 && CommunityCommon.currentUserIsOwner()) {
            cost = new Price(cost, Currency.storeCurrency);
            HTML.afterEnd(
                DOMHelper.selectLastNode(document, ".badge_empty_name"),
                `<div class="badge_empty_name badge_info_unlocked">${Localization.str.badge_completion_cost.replace("__cost__", cost)}</div>`);

            document.querySelector(".badge_empty_right").classList.add("esi-badge");
        }
    };

    GameCardPageClass.prototype.addFoilLink = function() {
        let urlSearch = window.location.search;
        let urlParameters = urlSearch.replace("?","").split("&");
        let foilIndex = urlParameters.indexOf("border=1");

        let text;
        let url = window.location.origin + window.location.pathname;

        if (foilIndex !== -1) {

            if (urlParameters.length > 1) {
                url += "?" + urlParameters.splice(foilIndex, 1).join("&");
            }

            text = Localization.str.view_normal_badge;

        } else {

            if (urlParameters[0] === ""){
                url += "?" + "border=1";
            }

            text = Localization.str.view_foil_badge;
        }

        HTML.beforeEnd(".gamecards_inventorylink",
            `<a class='btn_grey_grey btn_small_thin' href='${url}'><span>${text}</span></a>`);
    };

    GameCardPageClass.prototype.addStoreTradeForumLink = function() {
        HTML.beforeEnd(".gamecards_inventorylink",
            `<div style="float: right">
                <a class="es_visit_tforum btn_grey_grey btn_medium" href="https://store.steampowered.com/app/${this.appid}">
    				<span>${Localization.str.visit_store}</span>
    			</a>
    			<a class="es_visit_tforum btn_grey_grey btn_medium" href="https://steamcommunity.com/app/${this.appid}/tradingforum/">
    				<span>${Localization.str.visit_trade_forum}</span>
    			</a>
    		</div>`);
    };

    // Layout for the case when zoomed in (and the buttons are wrapped)
    function applyLinkButtonsLayout() {
        let linksDiv = document.querySelector(".gamecards_inventorylink");
        linksDiv.style.overflow = "auto";
        // Default is 14px => 14-5 = 9
        linksDiv.style.marginBottom = "9px";

        linksDiv.querySelectorAll("a").forEach(button => {
            button.style.marginBottom = "5px";
        });
    }

    return GameCardPageClass
})();

let FriendsThatPlayPageClass = (function(){

    function FriendsThatPlayPageClass() {
        this.appid = parseInt(window.location.pathname.match(/\/friendsthatplay\/(\d+)/)[1]);

        this.addCountsOfFriends();
        this.addFriendsPlayTimeSort();
        this.addFriendsThatPlay();
    }

    FriendsThatPlayPageClass.prototype.addCountsOfFriends = async function() {
        for (let header of document.querySelectorAll('.friendListSectionHeader')) {
            let profileList = header.nextElementSibling;
            let count = profileList.querySelectorAll('.persona').length;
            let html = ` <span class='friendcount'>(${count})</span> `;
            let underscore = header.querySelector('.underscoreColor');
            if (underscore) {
                HTML.beforeBegin(underscore, html);
                continue;
            }
            HTML.beforeEnd(header, html);
        }
    };

    FriendsThatPlayPageClass.prototype.addFriendsThatPlay = async function() {
        if (!SyncedStorage.get("showallfriendsthatown")) return;

        let friendsPromise = RequestData.getHttp("https://steamcommunity.com/my/friends/");
        let data = await Background.action('appuserdetails', { 'appids': this.appid, });
        if (!data[this.appid].success || !data[this.appid].data.friendsown || data[this.appid].data.friendsown.length === 0) {
            return;
        }

        let friendsData = await friendsPromise;
        let friendsHtml = HTMLParser.htmlToDOM(friendsData);

        let friendsOwn = data[this.appid].data.friendsown;

        let html = `<div class="mainSectionHeader friendListSectionHeader">
                        ${Localization.str.all_friends_own.replace('__friendcount__', friendsOwn.length)}
                        <span class="underScoreColor">_</span>
                    </div>`;

        html += '<div class="profile_friends" style="height: ' + (48 * friendsOwn.length / 3) + 'px;">';

        for (let item of friendsOwn) {
            let miniProfile = item.steamid.slice(4) - 1197960265728; // whaat?

            let friendNode = friendsHtml.querySelector(".friend_block_v2[data-miniprofile='"+miniProfile+"']");
            if (!friendNode) { continue; }

            let profileName = friendNode.querySelector(".friend_block_content").firstChild.textContent;

            let status = "";
            if (friendNode.classList.contains("in-game")) { status = "in-game"; }
            else if (friendNode.classList.contains("online")) { status = "online"; }

            let profileLink = friendNode.querySelector("a.selectable_overlay").href;
            let profileAvatar = friendNode.querySelector(".player_avatar img").src;
            let playtimeTwoWeeks = Localization.str.hours_short.replace('__hours__', Math.round(item.playtime_twoweeks / 60 * 10) / 10);
            let playtimeTotal = Localization.str.hours_short.replace('__hours__', Math.round(item.playtime_total / 60 * 10) / 10);
            let statsLink = profileLink + '/stats/' + this.appid + '/compare';

            html +=
                `<div class="friendBlock persona ${status}" data-miniprofile="${miniProfile}">
                    <a class="friendBlockLinkOverlay" href="${profileLink}"></a>
                    <div class="playerAvatar ${status}">
                        <img src="${profileAvatar}">
                    </div>
                    <div class="friendBlockContent">
                        ${profileName}<br>
                        <span class="friendSmallText">${playtimeTwoWeeks} / ${playtimeTotal}<br>
                            <a class="whiteLink friendBlockInnerLink" href="${statsLink}">View stats</a>
                        </span>
                    </div>
                </div>`;
        }

        html += '</div>';

        HTML.beforeEnd(".friends_that_play_content", html);

        // Reinitialize miniprofiles by injecting the function call.
        ExtensionLayer.runInPageContext(() => InitMiniprofileHovers());
    };

    FriendsThatPlayPageClass.prototype.addFriendsPlayTimeSort = function() {
        let memberList = document.querySelector("#memberList");

        let section = memberList.querySelectorAll(".mainSectionHeader").length;
        if (section < 3) return; // DLC and unreleased games with no playtime
        section = section >= 4 ? 1 : 2;

        HTML.beforeEnd(
            memberList.querySelector(".mainSectionHeader:nth-child(" + ((section*2)+1) + ")"),
            ` (<span id='es_default_sort' style='cursor: pointer;'>
                    ${Localization.str.sort_by_keyword.replace("__keyword__", Localization.str.theworddefault)}
                 </span> | <span id='es_playtime_sort' style='text-decoration: underline;cursor: pointer;'>
                    ${Localization.str.sort_by_keyword.replace("__keyword__", Localization.str.playtime)}
                </span>)`);

        memberList.querySelector(".profile_friends:nth-child(" + ((section*2)+2) + ")")
            .id = "es_friends_default";

        let sorted = document.querySelector("#es_friends_default").cloneNode(true);
        sorted.id = "es_friends_playtime";
        sorted.style.display = "none";

        let defaultNode = document.querySelector("#es_friends_default");
        defaultNode.insertAdjacentElement("afterend", sorted);
        HTML.afterEnd(defaultNode, "<div style='clear: both'></div>");

        document.querySelector("#es_playtime_sort").addEventListener("click", function(e) {
            document.querySelector("#es_playtime_sort").style.textDecoration = "none";
            document.querySelector("#es_default_sort").style.textDecoration = "underline";
            document.querySelector("#es_friends_default").style.display = "none";
            document.querySelector("#es_friends_playtime").style.display = "block";

            let friendArray = [];
            let nodes = document.querySelectorAll("#es_friends_playtime .friendBlock");
            for (let node of nodes) {
                friendArray.push([
                    node,
                    parseFloat(node.querySelector(".friendSmallText").textContent.match(/(\d+(\.\d+)?)/)[0])
                ]);
            }

            friendArray.sort(function(a,b) { return b[1] - a[1]; });

            let playtimeNode = document.querySelector("#es_friends_playtime");
            for (let item of friendArray) {
                playtimeNode.append(item[0])
            }
        });

        document.querySelector("#es_default_sort").addEventListener("click", function(e) {
            document.querySelector("#es_default_sort").style.textDecoration = "none";
            document.querySelector("#es_playtime_sort").style.textDecoration = "underline";
            document.querySelector("#es_friends_playtime").style.display = "none";
            document.querySelector("#es_friends_default").style.display = "block";
        });
    };

    return FriendsThatPlayPageClass;
})();

let FriendsPageClass = (function(){

    function FriendsPageClass() {
        this.addSort();
    }

    FriendsPageClass.prototype.addSort = async function() {
        let friends = document.querySelectorAll(".friend_block_v2.persona.offline");
        if (friends.length === 0) { return; }

        let data = await RequestData.getHttp("https://steamcommunity.com/my/friends/?ajax=1&l=english");
        let dom = HTMLParser.htmlToElement(data);

        let sorted = { default: [], lastonline: [] };

        let nodes = dom.querySelectorAll(".friend_block_v2.persona.offline");
        for (let node of nodes) {
            let lastOnline = node.querySelector(".friend_last_online_text").textContent.match(/Last Online (?:(\d+) days)?(?:, )?(?:(\d+) hrs)?(?:, )?(?:(\d+) mins)? ago/);
            if (lastOnline) {
                let days = parseInt(lastOnline[1]) || 0;
                let hours = parseInt(lastOnline[2]) || 0;
                let minutes = parseInt(lastOnline[3]) || 0;
                let downtime = (days * 24 + hours) * 60 + minutes;
                sorted.lastonline.push([node, downtime]);
            } else {
                sorted.lastonline.push([node, Infinity]);
            }

            sorted.default.push([node]);
        }

        sorted.lastonline.sort(function(a, b) {
            return b[1] - a[1];
        });

        function sortFriends(sortBy) {
            sortBy = (sortBy === "lastonline" ? "lastonline" : "default");

            let options = document.querySelector("#friends_sort_options");
            let linkNode = options.querySelector("span[data-esi-sort='"+sortBy+"']");
            if (!linkNode.classList.contains("es_friends_sort_link")) { return; }

            let nodes = options.querySelectorAll("span");
            for (let node of nodes) {
                node.classList.toggle("es_friends_sort_link", node.dataset.esiSort !== sortBy);
            }

            // Remove the current offline nodes
            for (let node of document.querySelectorAll('div.persona.offline[data-steamid]')) {
                node.remove();
            }

            // So we can replace them in sorted order
            let offlineNode = document.querySelector("#state_offline");
            for (let item of sorted[sortBy]) {
                offlineNode.insertAdjacentElement("afterend", item[0]);
            }

            SyncedStorage.set("sortfriendsby", sortBy);
        }

        let sortOptions = `<div id="friends_sort_options">
                            ${Localization.str.sort_by}
                            <span data-esi-sort='default'>${Localization.str.theworddefault}</span>
                            <span data-esi-sort='lastonline' class="es_friends_sort_link">${Localization.str.lastonline}</span>
                          </div>`;

        HTML.beforeBegin("#manage_friends_control", sortOptions);

        document.querySelector("#friends_sort_options").addEventListener("click", function(e) {
            if (!e.target.closest("[data-esi-sort]")) { return; }
            sortFriends(e.target.dataset.esiSort);
        });

        sortFriends(SyncedStorage.get("sortfriendsby"));
    };

    return FriendsPageClass;
})();


let MarketListingPageClass = (function(){

    function MarketListingPageClass() {
        this.appid = GameId.getAppid(window.location.href);

        if (this.appid) {
            this.addSoldAmountLastDay();
            this.addBackgroundPreviewLink();
        }

        this.addBadgePageLink();
        this.addPriceHistoryZoomControl();
    }

    MarketListingPageClass.prototype.addSoldAmountLastDay = async function() {
        let country = User.getCountry();
        let currencyNumber = Currency.currencyTypeToNumber(Currency.storeCurrency);

        let link = DOMHelper.selectLastNode(document, ".market_listing_nav a").href;
        let marketHashName = (link.match(/\/\d+\/(.+)$/) || [])[1];

        let data = await RequestData.getJson(`https://steamcommunity.com/market/priceoverview/?appid=${this.appid}&country=${country}&currency=${currencyNumber}&market_hash_name=${marketHashName}`);
        if (!data.success) { return; }

        let soldHtml =
            `<div class="es_sold_amount">
                ${Localization.str.sold_last_24.replace(`__sold__`, `<span class="market_commodity_orders_header_promote">${data.volume || 0}</span>`)}
            </div>`;

        HTML.beforeBegin(".market_commodity_buy_button", soldHtml);

        /* TODO where is this observer applied?
        let observer = new MutationObserver(function(){
            if (!document.querySelector("#pricehistory .es_sold_amount")) {
                document.querySelector(".jqplot-title").insertAdjacentHTML("beforeend", soldHtml);
            }
            return true;
        });
        observer.observe(document, {}); // .jqplot-event-canvas
        */
    };

    MarketListingPageClass.prototype.addBadgePageLink = function() {
        let gameAppId = parseInt((document.URL.match("\/753\/([0-9]+)-") || [0, 0])[1]);
        let cardType = document.URL.match("Foil(%20Trading%20Card)?%29") ? "?border=1" : "";
        if (!gameAppId || gameAppId === 753) { return; }

        HTML.beforeEnd("div.market_listing_nav",
        `<a class="btn_grey_grey btn_medium" href="https://steamcommunity.com/my/gamecards/${gameAppId + cardType}" style="float: right; margin-top: -10px;" target="_blank">
                <span>
                    <img src="https://store.steampowered.com/public/images/v6/ico/ico_cards.png" style="margin: 7px 0;" width="24" height="16" border="0" align="top">
                    ${Localization.str.view_badge}
                </span>
            </a>`);
    };

    MarketListingPageClass.prototype.addBackgroundPreviewLink = function() {
        if (this.appid !== 753) { return; }

        let viewFullLink = document.querySelector("#largeiteminfo_item_actions a");
        if (!viewFullLink) { return; }

        let bgLink = viewFullLink.href.match(/images\/items\/(\d+)\/([a-z0-9.]+)/i);
        if (bgLink) {
            HTML.afterEnd(viewFullLink,
                `<a class="es_preview_background btn_small btn_darkblue_white_innerfade" target="_blank" href="${User.profileUrl}#previewBackground/${bgLink[1]}/${bgLink[2]}">
                    <span>${Localization.str.preview_background}</span>
                </a>`);
        }
    };

    MarketListingPageClass.prototype.addPriceHistoryZoomControl = function() {
        HTML.afterEnd(document.querySelectorAll(".zoomopt")[1], `<a class="zoomopt as-zoomcontrol">${Localization.str.year}</a>`);
        document.querySelector(".as-zoomcontrol").addEventListener("click", function() {
            ExtensionLayer.runInPageContext(() => {
                pricehistory_zoomDays(g_plotPriceHistory, g_timePriceHistoryEarliest, g_timePriceHistoryLatest, 365);
            })
        });
    };

    return MarketListingPageClass;
})();

let MarketPageClass = (function(){

    function MarketPageClass() {

        Inventory.then(() => {
            this.highlightMarketItems();

            let that = this;
            let observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    for (let node of mutation.addedNodes) {
                        if (node.classList && node.classList.contains("market_listing_row_link")) {
                            that.highlightMarketItems();
                            return;
                        }
                    }
                });
            });

            observer.observe(
                document.querySelector("#mainContents"),
                {childList: true, subtree: true}
            );

        }).catch(result => {
            console.error("Failed to load inventory", result);
        });

        // TODO shouldn't this be global? Do we want to run on other pages?
        if (window.location.pathname.match(/^\/market\/$/)) {
            this.addMarketStats();
            this.minimizeActiveListings();
            this.addSort();
            this.marketPopularRefreshToggle();
            this.addLowestMarketPrice();
        }

    }

    // TODO cache data
    async function loadMarketStats() {

        let purchaseTotal = 0;
        let saleTotal = 0;
        let transactions = new Set();

        function updatePrices(dom) {

            let nodes = dom.querySelectorAll(".market_listing_row");
            for (let node of nodes) {
                if (node.id) {
                    if (transactions.has(node.id)) {
                        // Duplicate transaction, don't count in totals twice.
                        continue;
                    } else {
                        transactions.add(node.id);
                    }
                } else {
                    console.error('Could not find id of transaction', node);
                }
                let type = node.querySelector(".market_listing_gainorloss").textContent;
                let isPurchase;
                if (type.includes("+")) {
                    isPurchase = true;
                } else if (type.includes("-")) {
                    isPurchase = false;
                } else {
                    continue;
                }

                let priceNode = node.querySelector(".market_listing_price");
                if (!priceNode) { continue; }

                let price = Price.parseFromString(priceNode.textContent, Currency.storeCurrency);

                if (isPurchase) {
                    purchaseTotal += price.value;
                } else {
                    saleTotal += price.value;
                }
            }

            let net = new Price(saleTotal - purchaseTotal, Currency.storeCurrency, false);
            let color = "green";
            let netText = Localization.str.net_gain;
            if (net.value < 0) {
                color = "red";
                netText = Localization.str.net_spent;
            }

            let purchaseTotalPrice = new Price(purchaseTotal, Currency.storeCurrency);
            let saleTotalPrice = new Price(saleTotal, Currency.storeCurrency);
            HTML.inner(
                "#es_market_summary",
                `<div>${Localization.str.purchase_total}: <span class='es_market_summary_item'>${purchaseTotalPrice}</span></div>
                <div>${Localization.str.sales_total}: <span class='es_market_summary_item'>${saleTotalPrice}</span></div>
                <div>${netText}<span class='es_market_summary_item' style="color:${color}">${net}</span></div>`
            );
        }

        const pageSize = 500;
        let pages = -1;
        let currentPage = 0;
        let currentCount = 0;
        let totalCount = null;
        let pageRequests = [];
        let failedRequests = 0;

        let progressNode = document.querySelector("#esi_market_stats_progress");
        let url = new URL("/market/myhistory/render/", "https://steamcommunity.com/");
        url.searchParams.set('count', pageSize);

        async function nextRequest() {
            let request = pageRequests.shift();
            url.searchParams.set('start', request.start);
            request.attempt += 1;
            request.lastAttempt = Date.now();
            if (request.attempt > 1) {
                await sleep(2000);
            } else if (request.attempt > 4) {
                // Give up after four tries
                throw new Error("Could not retrieve market transactions.");
            }
            console.log(url.toString());
            let data = await RequestData.getJson(url.toString());

            let dom = HTMLParser.htmlToDOM(data.results_html);

            // Request may fail with results_html == "\t\t\t\t\t\t<div class=\"market_listing_table_message\">There was an error loading your market history. Please try again later.</div>\r\n\t"
            let message = dom.querySelector('.market_listing_table_message');
            if (message && message.textContent.includes("try again later")) {
                pageRequests.push(request);
                failedRequests += 1;
                return;
            }
            
            updatePrices(dom, request.start);

            return data.total_count;
        }

        try {
            pageRequests.push({ 'start': 0, 'attempt': 0, 'lastAttempt': 0, });
            while (pageRequests.length > 0) {
                let t = await nextRequest();
                if (pages < 0 && t > 0) {
                    totalCount = t;
                    pages = Math.ceil(totalCount / pageSize);
                    for (let start = pageSize; start < totalCount; start += pageSize) {
                        pageRequests.push({ 'start': start, 'attempt': 0, 'lastAttempt': 0, });
                    }
                }

                progressNode.textContent = `${++currentPage}${failedRequests > 0 ? -failedRequests : ''}/${pages < 0 ? "?" : pages} (${transactions.size}/${totalCount})`;
            }
        } catch (err) {
            console.error(err);
        }

        if (failedRequests == 0) {
            progressNode.textContent = '';
            return true;
        }

        progressNode.textContent = `${failedRequests} request(s) failed. Retrieved ${transactions.size} of ${totalCount} transactions.`; // FIXME Localize
        return false;
    }

    MarketPageClass.prototype.addMarketStats = async function() {
        if (!User.isSignedIn) { return; }

        HTML.beforeBegin("#findItems",
                `<div id="es_summary">
                    <div class="market_search_sidebar_contents">
                        <h2 class="market_section_title">${Localization.str.market_transactions}</h2>
                        <div id="es_market_summary_status"></div>
                        <div class="market_search_game_button_group" id="es_market_summary" style="display:none;"></div>
                    </div>
                </div>`);

        let node = document.querySelector("#es_market_summary_status");
        HTML.inner(node, `<a class="btnv6_grey_black ico_hover btn_small_thin" id="es_market_summary_button"><span>Load Market Stats</span></a>`); // FIXME Localize

        async function startLoadingStats() {
            HTML.inner(node, `<img id="es_market_summary_throbber" src="https://steamcommunity-a.akamaihd.net/public/images/login/throbber.gif">
                                <span><span id="esi_market_stats_progress_description">${Localization.str.loading} </span><span id="esi_market_stats_progress"></span>
                              </span>`);
            document.querySelector("#es_market_summary").style.display = null;
            let success = await loadMarketStats();
            if (node && success) {
                node.remove();
                // node.style.display = "none";
            } else {
                let el = document.getElementById('es_market_summary_throbber');
                if (el) el.remove();
                el = document.getElementById('esi_market_stats_progress_description');
                if (el) el.remove();
            }
        }

        document.querySelector("#es_market_summary_button").addEventListener("click", startLoadingStats);

        if (SyncedStorage.get("showmarkettotal")) {
            startLoadingStats();
        }
    };

    // Hide active listings on Market homepage
    MarketPageClass.prototype.minimizeActiveListings = function() {
        if (!SyncedStorage.get("hideactivelistings")) { return; }

        document.querySelector("#tabContentsMyListings").style.display = "none";
        let node = document.querySelector("#tabMyListings");
        node.classList.remove("market_tab_well_tab_active");
        node.classList.add("market_tab_well_tab_inactive");
    };

    // Show the lowest market price for items you're selling
    MarketPageClass.prototype.addLowestMarketPrice = function() {
        if (!User.isSignedIn) { return; }

        let country = User.getCountry();
        let currencyNumber = Currency.currencyTypeToNumber(Currency.storeCurrency);

        let loadedMarketPrices = {};

        let observer = new MutationObserver(function(){
            insertPrices();
        });

        observer.observe(document.getElementById("tabContentsMyActiveMarketListingsRows"), {childList: true});

        function insertPrice(node, data) {
            node.classList.add("es_priced");

            let lowestNode = node.querySelector(".market_listing_es_lowest");
            lowestNode.textContent = data['lowest_price'];

            let myPrice = Price.parseFromString(node.querySelector(".market_listing_price span span").textContent, Currency.storeCurrency);
            let lowPrice = Price.parseFromString(data['lowest_price'], Currency.storeCurrency);

            if (myPrice.value <= lowPrice.value) {
                lowestNode.classList.add("es_percentage_lower"); // Ours matches the lowest price
            } else {
                lowestNode.classList.add("es_percentage_higher"); // Our price is higher than the lowest price
            }
        }

        let parentNode = document.querySelector("#tabContentsMyListings");

        // update tables' headers
        let nodes = parentNode.querySelectorAll("#my_market_listingsonhold_number,#my_market_selllistings_number");
        for (let node of nodes) {
            let listingNode = node.closest(".my_listing_section");
            if (listingNode.classList.contains("es_selling")) { continue; }
            listingNode.classList.add("es_selling");

            let headerNode = listingNode.querySelector(".market_listing_table_header span");
            if (!headerNode) { continue; }

            headerNode.style.width = "200px"; // TODO do we still need to change width?
            HTML.afterEnd(headerNode,
                    "<span class='market_listing_right_cell market_listing_my_price'><span class='es_market_lowest_button'>" + Localization.str.lowest + "</span></span>");
        }

        insertPrices();

        async function insertPrices() {

            // update table rows
            let rows = [];
            nodes = parentNode.querySelectorAll(".es_selling .market_listing_row");
            for (let node of nodes) {
                if (node.querySelector(".market_listing_es_lowest")) { continue; }
                let button = node.querySelector(".market_listing_edit_buttons");
                button.style.width = "200px"; // TODO do we still need to change width?

                HTML.afterEnd(node.querySelector(".market_listing_edit_buttons"),
                    "<div class='market_listing_right_cell market_listing_my_price market_listing_es_lowest'>&nbsp;</div>");

                // we do this because of changed width, right?
                let actualButton = node.querySelector(".market_listing_edit_buttons.actual_content");
                actualButton.style.width = "inherit";
                button.append(actualButton);

                rows.push(node);
            }

            for (let node of rows) {
                let linkNode = node.querySelector(".market_listing_item_name_link");
                if (!linkNode) { continue; }

                let m = linkNode.href.match(/\/(\d+)\/(.+)$/);
                if (!m) { continue; }
                let appid = parseInt(m[1]);
                let marketHashName = m[2];

                let allowInsert = true;

                let priceData;
                let done;
                if (loadedMarketPrices[marketHashName]) {
                    priceData = loadedMarketPrices[marketHashName];
                } else {
                    do {
                        try {
                            let data = await RequestData.getJson(`https://steamcommunity.com/market/priceoverview/?country=${country}&currency=${currencyNumber}&appid=${appid}&market_hash_name=${marketHashName}`);

                            await sleep(1000);

                            done = true;
                            loadedMarketPrices[marketHashName] = data;
                            priceData = data;
                        } catch(errorCode) {
                            // Too Many Requests
                            if (errorCode === 429) {
                                await sleep(30000);
                                if (node) {
                                    done = false;
                                } else {
                                    return;
                                }
                            } else {
                                console.error("Failed to retrieve price overview for item %s!", marketHashName);
                                allowInsert = false;
                                break;
                            }
                            
                        }
                    } while (!done);
                }

                if (allowInsert) {
                    insertPrice(node, priceData);
                }
            }
        }

    };

    MarketPageClass.prototype.addSort = function() {

        let container = document.querySelector("#tabContentsMyActiveMarketListingsTable");
        if (!container || !container.querySelector(".market_listing_table_header")) { return; }

        // Indicate default sort and add buttons to header
        function buildButtons() {
            if (document.querySelector(".es_marketsort")) { return; }

            // name
            DOMHelper.wrap(
                HTMLParser.htmlToElement("<span id='es_marketsort_name' class='es_marketsort market_sortable_column'></span>"),
                DOMHelper.selectLastNode(container, ".market_listing_table_header span").parentNode
            );

            // date
            let node = container.querySelector(".market_listing_table_header .market_listing_listed_date");
            node.classList.add("market_sortable_column");

            DOMHelper.wrap(
                HTMLParser.htmlToElement("<span id='es_marketsort_date' class='es_marketsort active asc'></span>"),
                node
            );

            // price
            node = DOMHelper.selectLastNode(container, ".market_listing_table_header .market_listing_my_price");
            node.classList.add("market_sortable_column");

            DOMHelper.wrap(
                HTMLParser.htmlToElement("<span id='es_marketsort_price' class='es_marketsort'></span>"),
                node
            );

            HTML.beforeBegin("#es_marketsort_name",
                "<span id='es_marketsort_game' class='es_marketsort market_sortable_column'><span>" + Localization.str.game_name.toUpperCase() + "</span></span>");
        }

        buildButtons();

        // add header click handlers
        let tableHeader = container.querySelector(".market_listing_table_header");
        if (!tableHeader) { return; }

        tableHeader.addEventListener("click", function(e) {
            let sortNode = e.target.closest(".es_marketsort");
            if (!sortNode) { return; }

            let isAsc = sortNode.classList.contains("asc");

            document.querySelector(".es_marketsort.active").classList.remove("active");

            sortNode.classList.add("active");
            sortNode.classList.toggle("asc", !isAsc);
            sortNode.classList.toggle("desc", isAsc);

            // set default position
            if (!container.querySelector(".market_listing_row[data-esi-default-position]")) {
                let nodes = container.querySelectorAll(".market_listing_row");
                let i = 0;
                for (let node of nodes) {
                    node.dataset.esiDefaultPosition = i++;
                }
            }

            sortRows(sortNode.id, isAsc);
        });

        container.addEventListener("click", function(e) {
            if (!e.target.closest(".market_paging_controls span")) { return; }
            document.querySelector(".es_marketsort.active").classList.remove("active");

            let dateNode = document.querySelector("#es_marketsort_date");
            dateNode.classList.remove("desc");
            dateNode.classList.add("active asc")
        });

        function sortRows(sortBy, asc) {
            let selector;
            let dataname;
            let isNumber = false;
            switch (sortBy) {
                case "es_marketsort_name":
                    selector = ".market_listing_item_name";
                    break;
                case "es_marketsort_date":
                    dataname = "esiDefaultPosition";
                    isNumber = true;
                    break;
                case "es_marketsort_price":
                    selector = ".market_listing_price";
                    break;
                case "es_marketsort_game":
                    selector = ".market_listing_game_name";
                    break;
            }

            let rows = [];
            let nodes = container.querySelectorAll(".market_listing_row");
            for (let node of nodes) {
                let value;
                if (selector) {
                    value = node.querySelector(selector).textContent.trim();
                } else {
                    value = node.dataset[dataname];
                }

                if (isNumber) {
                    value = parseInt(value);
                }

                rows.push([value, node]);
            }

            let s = (asc === true) ? 1 : -1;
            rows.sort(function(a,b) {
                if (a[0] === b[0]) { return 0;}
                if (isNumber) {
                    return asc ? b[0] - a[0] : a[0] - b[0];
                }

                return a[0] < b[0] ? s : -s;
            });

            for (let row of rows) {
                container.append(row[1]);
            }
        }

        /* TODO when do we need this?
        let observer = new MutationObserver(buildButtons);
        observer.observe(document.querySelector("#tabContentsMyActiveMarketListingsTable"), {childList: true, subtree: true});
        */
    };

    MarketPageClass.prototype.marketPopularRefreshToggle = function() {
        HTML.beforeEnd("#sellListings .market_tab_well_tabs",
            `<div id="es_popular_refresh_toggle" class="btn_grey_black btn_small" data-tooltip-text="${Localization.str.market_popular_items_toggle}"></div>`);

        document.querySelector("#es_popular_refresh_toggle").addEventListener("click", function(e) {
            toggleRefresh(!LocalStorage.get("popular_refresh"));
        });

        toggleRefresh(LocalStorage.get("popular_refresh", false));

        ExtensionLayer.runInPageContext(() => SetupTooltips( { tooltipCSSClass: 'community_tooltip'} ));

        function toggleRefresh(state) {
            document.querySelector("#es_popular_refresh_toggle").classList.toggle("es_refresh_off", !state);
            LocalStorage.set("popular_refresh", state);
            ExtensionLayer.runInPageContext(`() => g_bMarketWindowHidden = ${state}`);
        }
    };

    MarketPageClass.prototype.highlightMarketItems = function() {
        if (!SyncedStorage.get("highlight_owned")) { return; }

        let nodes = document.querySelectorAll(".market_listing_row_link");
        for (let node of nodes) {
            let m = node.href.match(/market\/listings\/753\/(.+?)(\?|$)/);
            if (!m) { continue; }

            if (Inventory.hasInInventory6(decodeURIComponent(m[1]))) {
                Highlights.highlightOwned(node.querySelector("div"));
            }
        }
    };

    return MarketPageClass;
})();

let CommunityAppPageClass = (function(){

    function CommunityAppPageClass() {
        this.appid = GameId.getAppid(window.location.href);

        this.addAppPageWishlist();
        this.addSteamDbLink();
        this.addItadLink();
        AgeCheck.sendVerification();

        let node = document.querySelector(".apphub_background");
        if (node) {
            let observer = new MutationObserver(() => {
                AgeCheck.sendVerification();
            });
            observer.observe(node, {attributes: true}); // display changes to none if age gate is shown
        }
    }

    CommunityAppPageClass.prototype.addAppPageWishlist = async function() {
        if (!SyncedStorage.get("wlbuttoncommunityapp")) { return; }
        await DynamicStore;

        let nameNode = document.querySelector(".apphub_AppName");

        if (DynamicStore.isOwned(this.appid)) {
            nameNode.style.color = SyncedStorage.get("highlight_owned_color");
            return;
        }

        if (DynamicStore.isWishlisted(this.appid)) {
            nameNode.style.color = SyncedStorage.get("highlight_wishlist_color");
            return;
        }

        // TODO remove from wishlist button

        HTML.beforeEnd(".apphub_OtherSiteInfo",
            '<a id="es_wishlist" class="btnv6_blue_hoverfade btn_medium" style="margin-left: 3px"><span>' + Localization.str.add_to_wishlist + '</span></a>');

        let that = this;
        document.querySelector("#es_wishlist").addEventListener("click", async function(e) {
            e.preventDefault();
            if (e.target.classList.contains("btn_disabled")) { return; }

            await Background.action('wishlist.add', { 'sessionid': await User.getStoreSessionId(), 'appid': that.appid, } );

            e.target.classList.add("btn_disabled");
            HTML.inner(e.target, "<span>" + Localization.str.on_wishlist + "</span>");

            nameNode.style.color = SyncedStorage.get("highlight_wishlist_color");

            // Clear dynamicstore cache
            DynamicStore.clear();
        });
    };

    CommunityAppPageClass.prototype.addSteamDbLink = function() {
        if (!SyncedStorage.get("showsteamdb")) { return; }
        let bgUrl = ExtensionLayer.getLocalUrl("img/steamdb_store.png");

        HTML.beforeEnd(".apphub_OtherSiteInfo",
            ` <a class="btnv6_blue_hoverfade btn_medium" target="_blank" href="https://steamdb.info/app/${this.appid}/"><span><i class="ico16" style="background-image:url('${bgUrl}')"></i>&nbsp; SteamDB</span></a>`);
    };

    CommunityAppPageClass.prototype.addItadLink = function() {
        if (!SyncedStorage.get("showitadlinks")) { return; }
        let bgUrl = ExtensionLayer.getLocalUrl("img/line_chart.png");

        HTML.beforeEnd(".apphub_OtherSiteInfo",
            ` <a class="btnv6_blue_hoverfade btn_medium" target="_blank" href="https://isthereanydeal.com/steam/app/${this.appid}/"><span><i class="ico16" style="background-image:url('${bgUrl}')"></i>&nbsp; ITAD</span></a>`);
    };

    return CommunityAppPageClass;
})();

let GuidesPageClass = (function(){

    let Super = CommunityAppPageClass;

    function GuidesPageClass() {
        Super.call(this);

        this.removeGuidesLanguageFilter();
    }

    GuidesPageClass.prototype = Object.create(Super.prototype);
    GuidesPageClass.prototype.constructor = GuidesPageClass;

    GuidesPageClass.prototype.removeGuidesLanguageFilter = function() {
        if (!SyncedStorage.get("removeguideslanguagefilter")) { return; }

        let language = Language.getCurrentSteamLanguage();
        let regex = new RegExp(language, "i");
        let nodes = document.querySelectorAll("#rightContents .browseOption");
        for (let node of nodes) {
            let onclick = node.getAttribute("onclick");

            if (regex.test(onclick)) {
                node.removeAttribute("onclick"); // remove onclick, we have link anyway, why do they do this?
                // node.setAttribute("onclick", onclick.replace(/requiredtags[^&]+&?/, ""))
            }

            let linkNode = node.querySelector("a");
            if (regex.test(linkNode.href)) {
                linkNode.href = linkNode.href.replace(/requiredtags[^&]+&?/, "");
            }
        }
    };

    return GuidesPageClass;
})();


class WorkshopPageClass {
    constructor() {
        new MediaPage().workshopPage();
        //media.initHdPlayer();
    }
}

let WorkshopBrowseClass = (function(){

    function WorkshopBrowseClass() {
        this.addSubscriberButtons();
    }

    WorkshopBrowseClass.prototype.addSubscriberButtons = function() {
        let appid = GameId.getAppidUriQuery(window.location.search);
        if (!appid) { return; }

        let subscriberButtons = `
            <div class="rightSectionTopTitle">${Localization.str.subscriptions}:</div>
            <div id="es_subscriber" class="rightDetailsBlock">
                <div style="position:relative;">
                    <img class="browseOptionImage" src="//steamcommunity-a.akamaihd.net/public/images/sharedfiles/filterselect_blue.png?v=1">
                    <div class="browseOption mostrecent">
                        <a class="es_subscriber" data-method="subscribe">${Localization.str.subscribe_all}</a>
                    </div>
                </div>
                <div style="position:relative;">
                    <img class="browseOptionImage" src="//steamcommunity-a.akamaihd.net/public/images/sharedfiles/filterselect_blue.png?v=1">
                    <div class="browseOption mostrecent">
                        <a class="es_subscriber" data-method="unsubscribe">${Localization.str.unsubscribe_all}</a>
                    </div>
                </div>
                <hr>
            </div>`;

        HTML.beforeBegin(".panel > .rightSectionTopTitle", subscriberButtons);
        Messenger.addMessageListener("sendMessage", startSubscriber, false);

        ExtensionLayer.runInPageContext(function(){
            $J(document).on("click", ".es_subscriber", function(event){
                let method = $J(event.target).closest(".es_subscriber").data("method");
                let total = parseInt($J(".workshopBrowsePagingInfo").text().replace(/\d+-\d+/g, "").match(/\d+/g).join(""));
                Messenger.postMessage("sendMessage", { method, sessionId: g_sessionID, total });
            });
        });

        function startSubscriber(info) {
            let i = -1;

            ExtensionLayer.runInPageContext(`function(){
                var prompt = ShowConfirmDialog("${Localization.str[info.method + "_all"]}", \`${Localization.str[info.method + "_confirm"].replace("__count__", info.total)}\`);
                prompt.done(function(result) {
                    if (result == "OK") {
                        Messenger.postMessage("startSubscriber");
                    }
                });
            }`);

            function updateWaitDialog() {
                ExtensionLayer.runInPageContext(`function() {
                    if (window.dialog) {
                        window.dialog.Dismiss();
                    }

                    window.dialog = ShowBlockingWaitDialog("${Localization.str[info.method + "_all"]}", \`${Localization.str[info.method + "_loading"].replace("__i__", ++i).replace("__count__", info.total)}\`);
                }`)
            }

            function changeSubscription(id) {
                return new Promise(function(resolve) {
                    let formData = new FormData();
                    formData.append("sessionid", info.sessionId);
                    formData.append("appid", appid);
                    formData.append("id", id);

                    RequestData.post("https://steamcommunity.com/sharedfiles/" + info.method, formData, {
                        withCredentials: true
                    }).then(function() {
                        updateWaitDialog();
                        resolve();
                    });
                });
            }

            Messenger.addMessageListener("startSubscriber", async function() {
                updateWaitDialog();

                let workshopItems = [];
                for (let p = 1; p <= Math.ceil(info.total / 30); p++) {
                    let url = new URL(window.location.href);
                    url.searchParams.set("p", p);
                    url.searchParams.set("numperpage", 30);
    
                    let result = await RequestData.getHttp(url.toString());
                    let xmlDoc = new DOMParser().parseFromString(result, "text/html");
                    workshopItems = workshopItems.concat(Array.from(xmlDoc.querySelectorAll(".workshopItemPreviewHolder")).map(node => node.id.replace("sharedfile_", "")));
                }
    
                Promise.all(workshopItems.map(id => changeSubscription(id))).finally(() => {
                    location.reload();
                });
            }, true)
        }
    }

    return WorkshopBrowseClass;
})();

(async function(){
    let path = window.location.pathname.replace(/\/+/g, "/");

    await SyncedStorage.init().catch(err => console.error(err));
    await Promise.all([Localization, User, Currency]);

    Common.init();
    SpamCommentHandler.hideSpamComments();

    switch (true) {

        case /^\/(?:id|profiles)\/.+\/(home|myactivity)\/?$/.test(path):
            (new ProfileActivityPageClass());
            break;

        case /^\/(?:id|profiles)\/.+\/games/.test(path):
            (new GamesPageClass());
            break;

        case /^\/(?:id|profiles)\/.+\/edit/.test(path):
            (new ProfileEditPageClass());
            break;

        case /^\/(?:id|profiles)\/.+\/badges(?!\/[0-9]+$)/.test(path):
            (new BadgesPageClass());
            break;

        case /^\/(?:id|profiles)\/.+\/gamecards/.test(path):
            (new GameCardPageClass());
            break;

        case /^\/(?:id|profiles)\/.+\/friendsthatplay/.test(path):
            (new FriendsThatPlayPageClass());
            break;

        case /^\/(?:id|profiles)\/.+\/friends(?:[/#?]|$)/.test(path):
            (new FriendsPageClass());
            break;

        case /^\/(?:id|profiles)\/.+\/inventory/.test(path):
            (new InventoryPageClass());
            break;

        case /^\/market\/listings\/.*/.test(path):
            (new MarketListingPageClass());
            break;

        case /^\/market\/.*/.test(path):
            (new MarketPageClass());
            break;

        case /^\/(?:id|profiles)\/[^\/]+?\/?$/.test(path):
            (new ProfileHomePageClass());
            break;

        case /^\/app\/[^\/]*\/guides/.test(path):
            (new GuidesPageClass());
            break;

        case /^\/app\/.*/.test(path):
            (new CommunityAppPageClass());
            break;

        case /^\/(?:id|profiles)\/.+\/stats/.test(path):
            (new StatsPageClass());
            break;

        case /^\/sharedfiles\/.*/.test(path):
            (new WorkshopPageClass());
            break;

        case /^\/workshop\/browse/.test(path):
            (new WorkshopBrowseClass());
            break;

        case /^\/tradingcards\/boostercreator/.test(path):
            let gemWord = document.querySelector(".booster_creator_goostatus .goo_display")
                .textContent.trim().replace(/\d/g, "");

            ExtensionLayer.runInPageContext(`function() {
                $J("#booster_game_selector option").each(function(index) {
                    if ($J(this).val()) {
                        $J(this).append(" - " + CBoosterCreatorPage.sm_rgBoosterData[$J(this).val()].price + " ${gemWord}");
                    }
                });
            }`);
            break;
    }

    EnhancedSteam.hideTrademarkSymbol(true);

})();

