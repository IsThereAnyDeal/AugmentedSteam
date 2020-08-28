let GroupID = (function(){

    let self = {};
    let _groupId = null;

    self.getGroupId = function() {
        if (_groupId) { return _groupId; }

        if (document.querySelector("#leave_group_form")) {
            _groupId = document.querySelector("input[name=groupId]").value;
        } else {
            _groupId = document.querySelector(".joinchat_bg").getAttribute("onclick").split('\'')[1];
        }

        return _groupId;
    };

    return self;
})();

let ProfileHomePageClass = (function(){

    function ProfileHomePageClass() {
        // If there is an error message, like profile does not exists. 
        if (document.querySelector("#message")) {
            return;
        }
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
        if (images !== "none") {
            iconType = images === "color" ? "color" : "gray";
        }

        let links = [
            {
                "id": "steamrep",
                "link": `https://steamrep.com/profiles/${steamId}`,
                "name": "SteamRep",
            },
            {
                "id": "steamdbcalc",
                "link": `https://steamdb.info/calculator/?player=${steamId}`,
                "name": "SteamDB",
            },
            {
                "id": "steamgifts",
                "link": `https://www.steamgifts.com/go/user/${steamId}`,
                "name": "SteamGifts",
            },
            {
                "id": "steamtrades",
                "link": `https://www.steamtrades.com/user/${steamId}`,
                "name": "SteamTrades",
            },
            {
                "id": "bartervg",
                "link": `//barter.vg/steam/${steamId}`,
                "name": "Barter.vg",
            },
            {
                "id": "astats",
                "link": `https://www.achievementstats.com/index.php?action=profile&playerId=${steamId}`,
                "name": "Achievement Stats",
            },
            {
                "id": "backpacktf",
                "link": `https://backpack.tf/profiles/${steamId}`,
                "name": "Backpack.tf",
            },
            {
                "id": "astatsnl",
                "link": `https://astats.astats.nl/astats/User_Info.php?steamID64=${steamId}`,
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

        for (let link of links) {
            if (!SyncedStorage.get("profile_" + link.id)) { continue; }
            htmlstr += CommunityCommon.makeProfileLink(link.id, link.link, link.name, iconType);
        }

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
            let icon;
            if (customLink.icon) {
                icon = "//" + HTML.escape(customLink.icon);
            } else {
                iconType = "none";
            }

            htmlstr += CommunityCommon.makeProfileLink("custom", link, name, iconType, icon);
        }

        // profile steamid
        if (SyncedStorage.get("profile_steamid")) {
            let dropdown = document.querySelector("#profile_action_dropdown .popup_body.popup_menu");
            if (dropdown) {
                HTML.beforeEnd(dropdown,
                    `<a class="popup_menu_item" id="es_steamid">
                        <img src="https://steamcommunity-a.akamaihd.net/public/images/skin_1/iconForums.png">&nbsp; ${Localization.str.view_steamid}
                    </a>`);
            } else {
                let actions = document.querySelector(".profile_header_actions");
                if (actions) {
                    HTML.beforeEnd(actions,
                        `<a class="btn_profile_action btn_medium" id="es_steamid">
                            <span>${Localization.str.view_steamid}</span>
                        </a>`);
                }
            }

            document.querySelector("#es_steamid").addEventListener("click", showSteamIdDialog);
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

        function copySteamId(e) {
            let elem = e.target.closest(".es-copy");
            if (!elem) { return; }

            Clipboard.set(elem.querySelector(".es-copy__id").innerText);

            let lastCopied = document.querySelector(".es-copy.is-copied");
            if (lastCopied) {
                lastCopied.classList.remove("is-copied");
            }

            elem.classList.add("is-copied");
            window.setTimeout(() => { elem.classList.remove("is-copied")}, 2000);
        }

        function showSteamIdDialog() {
            document.addEventListener("click", copySteamId);

            let imgUrl = ExtensionResources.getURL("img/clippy.svg");

            let steamId = new SteamId.Detail(SteamId.getSteamId());
            let ids = [
                steamId.id2,
                steamId.id3,
                steamId.id64,
                `https://steamcommunity.com/profiles/${steamId.id64}`
            ];

            let copied = Localization.str.copied;
            let html = "";
            for (let id of ids) {
                if (!id) { continue; }
                html += `<p><a class="es-copy"><span class="es-copy__id">${id}</span><img src='${imgUrl}' class="es-copy__icon"><span class="es-copy__copied">${copied}</span></a></p>`
            }

            ExtensionLayer.runInPageContext((steamidOfUser, html, close) => {
                HideMenu("profile_action_dropdown_link", "profile_action_dropdown");
                let dialog = ShowAlertDialog(steamidOfUser.replace("__user__", g_rgProfileData.personaname), html, close);

                return new Promise(resolve => { dialog.done(() => { resolve(); }); });
            },
            [
                Localization.str.steamid_of_user,
                html,
                Localization.str.close,
            ], "closeDialog")
            .then(() => { document.removeEventListener("click", copySteamId); });
        }
    };

    ProfileHomePageClass.prototype.addWishlistProfileLink = async function() {
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

            let wishlistNode = document.querySelector(`.gamecollector_showcase .showcase_stat[href$="/wishlist/"]`);
            let count = wishlistNode ? wishlistNode.textContent.match(/\d+(?:,\d+)?/)[0] : await Background.action("wishlists", window.location.pathname);

            document.querySelector("#es_wishlist_count").textContent = count;
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

            ExtensionLayer.runInPageContext(() => { SetupTooltips({ tooltipCSSClass: "community_tooltip" }); });
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

    ProfileHomePageClass.prototype.addSteamRepApi = function() {
        if (!SyncedStorage.get("showsteamrepapi")) { return; }

        ProfileData.promise().then(data => {
            if (!data.steamrep || data.steamrep.length === 0) { return; }

            let steamId = SteamId.getSteamId();
            if (!steamId) { return; }

            // Build reputation images regexp
            let repImgs = {
                "banned": /scammer|banned/gi,
                "valve": /valve admin/gi,
                "caution": /caution/gi,
                "okay": /admin|middleman/gi,
                "donate": /donator/gi
            };

            let html = "";

            for (let value of data.steamrep) {
                if (value.trim() === "") { continue; }
                for (let [img, regex] of Object.entries(repImgs)) {
                    if (!value.match(regex)) { continue; }

                    let imgUrl = ExtensionResources.getURL(`img/sr/${img}.png`);
                    let status;

                    switch (img) {
                        case "banned":
                            status = "bad";
                            break;
                        case "caution":
                            status = "caution";
                            break;
                        case "valve":
                        case "okay":
                            status = "good";
                            break;
                        case "donate":
                            status = "neutral";
                            break;
                    }

                    html += `<div class="${status}"><img src="${imgUrl}"><span> ${value}</span></div>`;
                }
            }

            if (html) {

                HTML.afterBegin(".profile_rightcol",
                    `<a id="es_steamrep" href="https://steamrep.com/profiles/${steamId}" target="_blank">
                        ${html}
                    </a>`);
            }
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
                    ExtensionLayer.runInPageContext(() => {
                        ShowNicknameModal();
                        HideMenu("profile_action_dropdown_link", "profile_action_dropdown" );
                    });
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
        ExtensionLayer.runInPageContext(() => { SetupTooltips({ tooltipCSSClass: "community_tooltip" }); });
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

                    DOMHelper.insertScript({ src: ExtensionResources.getURL("js/steam/holidayprofile.js") });
                    
                    break;
                case "clear":
                    document.body.classList.add("es_style_clear");
                    break;
                default:
                    let styleUrl = ExtensionResources.getURL("img/profile_styles/" + style + "/style.css");
                    let headerImg = ExtensionResources.getURL("img/profile_styles/" + style + "/header.jpg");
                    let showcase = ExtensionResources.getURL("img/profile_styles/" + style + "/showcase.png");

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

        HTML.replace(sendButton,
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

        document.querySelector("#btnWebChat").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(chatId => { OpenFriendChatInWebChat(chatId); }, [ chatId ]);
        });

        document.querySelector("#profile_chat_dropdown_link").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(() => { ShowMenu(document.querySelector("#profile_chat_dropdown_link"), "profile_chat_dropdown", "right"); });
        });
    };

    return ProfileHomePageClass;
})();


let GroupHomePageClass = (function(){

    function GroupHomePageClass() {
        this.groupId = GroupID.getGroupId();

        this.addGroupLinks();
        this.addFriendsInviteButton();
    }

    GroupHomePageClass.prototype.addGroupLinks = function() {

        let iconType = "none";
        let images = SyncedStorage.get("show_profile_link_images");
        if (images !== "none") {
            iconType = images === "color" ? "color" : "gray";
        }

        let links = [
            {
                "id": "steamgifts",
                "link": `https://www.steamgifts.com/go/group/${this.groupId}`,
                "name": "SteamGifts",
            }
        ];

        let html = "";
        for (let link of links) {
            if (!SyncedStorage.get(`group_${link.id}`)) { continue; }
            html += CommunityCommon.makeProfileLink(link.id, link.link, link.name, iconType);
        }

        if (html) {
            let node = document.querySelector(".responsive_hidden > .rightbox");
            if (node) {
                HTML.afterEnd(node.parentNode,
                    `<div class="rightbox_header"></div>
                    <div class="rightbox">
                        <div class="content">${html}</div>
                    </div>
                    <div class="rightbox_footer"></div>`);
            }
        }
    };

    GroupHomePageClass.prototype.addFriendsInviteButton = function() {
        if (!User.isSignedIn) { return; }

        let button = document.querySelector(".grouppage_join_area");
        if (button) { return; }

        HTML.afterEnd("#join_group_form", 
            `<div class="grouppage_join_area">
                <a class="btn_blue_white_innerfade btn_medium" href="https://steamcommunity.com/my/friends/?invitegid=${this.groupId}">
                    <span><img src="//steamcommunity-a.akamaihd.net/public/images/groups/icon_invitefriends.png">&nbsp; ${Localization.str.invite_friends}</span>
                </a>
            </div>`);
    };
    
    return GroupHomePageClass;
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
        this.showEntireDescriptions();
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

    async function sortBy(key, reversed) {
        let personal = document.querySelector("#personalAchieve");
        if (key === "time") {
            if (!_nodes.time.length) {
                await addSortMetaData(key, personal.querySelectorAll(".achieveRow"));
            }
        }
        
        for (let br of personal.querySelectorAll(":scope > br")) br.remove();
        for (let [, node] of _nodes[key]) {
            personal.insertAdjacentElement(reversed ? "afterbegin" : "beforeend", node);
        }
    }

    StatsPageClass.prototype.addAchievementSort = function() {
        let personal = document.querySelector("#personalAchieve");
        if (!personal) { return; }

        document.querySelector("#tabs").insertAdjacentElement("beforebegin", Sortbox.get(
            "achievements",
            [
                ["default", Localization.str.theworddefault],
                ["time", Localization.str.date_unlocked],
            ],
            "default",
            sortBy
        ));

        addSortMetaData("default", personal.querySelectorAll(".achieveRow"));
    };
    

    StatsPageClass.prototype.showEntireDescriptions = function() {
        // .ellipsis is only added by Steam on personal stats pages
        let nodes = document.querySelectorAll("h5.ellipsis");
        for (let node of nodes) {
            node.classList.remove("ellipsis");
        }
    };

    return StatsPageClass;
})();

let RecommendedPageClass = (function(){

    function RecommendedPageClass() {
        this.addReviewSort();
    }

    RecommendedPageClass.prototype.addReviewSort = async function() {
        let numReviewsNode = document.querySelector(".review_stat:nth-child(1) .giantNumber");
        if (!numReviewsNode) { return; }

        let numReviews = Number(numReviewsNode.innerText);
        if (isNaN(numReviews) || numReviews <= 1) { return; }

        let steamId = window.location.pathname.match(/\/((?:id|profiles)\/.+?)\//)[1];
        let params = new URLSearchParams(window.location.search);
        let curPage = params.get("p") || 1;
        let pageCount = 10;
        let reviews;

        async function getReviews() {

            let modalActive = false;

            // Delay half a second to avoid dialog flicker when grabbing cache
            let delayer = setTimeout(
                () => {
                    ExtensionLayer.runInPageContext(
                        (processing, wait) => { ShowBlockingWaitDialog(processing, wait); },
                        [
                            Localization.str.processing,
                            Localization.str.wait
                        ]);
                    modalActive = true;
                },
                500,                
            );

            try {
                reviews = await Background.action("reviews", steamId, numReviews);

                reviews.map((review, i) => {
                    review.default = i;
                    return review;
                });
            } finally {
                clearTimeout(delayer);

                if (modalActive) {
                    ExtensionLayer.runInPageContext(() => {
                        CModal.DismissActiveModal();
                    });
                }
            }
        }

        async function sortReviews(sortBy, reverse) {
            if (!reviews) {
                await getReviews();
            }

            for (let node of document.querySelectorAll(".review_box")) {
                node.remove();
            }

            let displayedReviews = reviews.sort((a, b) => {
                switch(sortBy) {
                    case "rating":
                    case "helpful":
                    case "funny":
                    case "length":
                    case "playtime":
                        return b[sortBy] - a[sortBy];
                    case "visibility":
                        a = a[sortBy].toLowerCase();
                        b = b[sortBy].toLowerCase();
                        if (a > b) { return -1; }
                        if (a < b) { return 1; }
                        return 0;
                    case "default":
                        return a[sortBy] - b[sortBy];
                }
            });

            if (reverse) {
                displayedReviews.reverse();
            }

            displayedReviews = displayedReviews.slice(pageCount * (curPage - 1), pageCount * curPage);

            let footer = document.querySelector("#leftContents > .workshopBrowsePaging:last-child");
            for (let { node } of displayedReviews) {
                footer.insertAdjacentElement("beforebegin", HTMLParser.htmlToElement(node));
            }

            // Add back sanitized event handlers
            ExtensionLayer.runInPageContext(ids => {
                Array.from(document.querySelectorAll(".review_box")).forEach((node, boxIndex) => {
                    let id = ids[boxIndex];

                    let containers = node.querySelectorAll(".dselect_container");

                    // Only exists when the requested profile is yours (these are the input fields where you can change visibility and language of the review)
                    if (containers.length) {
                        for (let container of node.querySelectorAll(".dselect_container")) {
                            let type = container.id.startsWith("ReviewVisibility") ? "Visibility" : "Language";
                            let input = container.querySelector("input");
                            let trigger = container.querySelector(".trigger");
                            let selections = Array.from(container.querySelectorAll(".dropcontainer a"));

                            input.onchange = () => { window[`OnReview${type}Change`](id, `Review${type}${id}`) };

                            trigger.href = "javascript:DSelectNoop();"
                            trigger.onfocus = () => DSelectOnFocus(`Review${type}${id}`);
                            trigger.onblur = () => DSelectOnBlur(`Review${type}${id}`);
                            trigger.onclick = () => DSelectOnTriggerClick(`Review${type}${id}`);

                            selections.forEach((selection, selIndex) => {
                                selection.href = "javascript:DSelectNoop();";
                                selection.onmouseover = () => DHighlightItem(`Review${type}${id}`, selIndex, false);
                                selection.onclick = () => DHighlightItem(`Review${type}${id}`, selIndex, true);
                            });
                        }
                    // Otherwise you have buttons to vote for the review (Was it helpful or not, was it funny?)
                    } else {
                        let controlBlock = node.querySelector(".control_block");

                        let btns = controlBlock.querySelectorAll("a");
                        let [ upvote, downvote, funny ] = btns;

                        for (let btn of btns) {
                            btn.href = "javascript:void(0)";
                        }

                        upvote.onclick = () => UserReviewVoteUp(id);
                        downvote.onclick = () => UserReviewVoteDown(id);
                        funny.onclick = () => UserReviewVoteTag(id, 1, `RecommendationVoteTagBtn${id}_1`);
                    }
                });
            }, [ displayedReviews.map(review => review.id) ]);
        }

        Messenger.addMessageListener("updateReview", id => {
            Background.action("updatereviewnode", steamId, document.querySelector(`[id$="${id}"`).closest(".review_box").outerHTML, numReviews).then(getReviews);
        });

        ExtensionLayer.runInPageContext(() => {
            $J(document).ajaxSuccess((event, xhr, { url }) => {
                let pathname = new URL(url).pathname;
                if (pathname.startsWith("/userreviews/rate/") || pathname.startsWith("/userreviews/votetag/") || pathname.startsWith("/userreviews/update/")) {
                    let id = pathname.split('/').pop();
                    Messenger.postMessage("updateReview", id);
                }
            });
        });

        document.querySelector(".review_list h1").insertAdjacentElement("beforebegin",
            Sortbox.get("reviews", [
                ["default", Localization.str.date],
                ["rating", Localization.str.rating],
                ["helpful", Localization.str.helpful],
                ["funny", Localization.str.funny],
                ["length", Localization.str.length],
                ["visibility", Localization.str.visibility],
                ["playtime", Localization.str.playtime],
            ], SyncedStorage.get("sortreviewsby"), sortReviews, "sortreviewsby")
        );
    };

    return RecommendedPageClass;
})();

let CommunityAppPageClass = (function(){

    function CommunityAppPageClass() {
        this.appid = GameId.getAppid(window.location.href);

        Highlights.addTitleHighlight(this.appid);

        this.addLinks();
        this.addAppPageWishlist();
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
        if (!User.isSignedIn || !SyncedStorage.get("wlbuttoncommunityapp")) { return; }
        await DynamicStore;

        let { owned, wishlisted } = await DynamicStore.getAppStatus(`app/${this.appid}`);
        if (owned) { return; }

        let inactiveStyle = "";
        let activeStyle = "display: none;";

        if (wishlisted) {
            inactiveStyle = "display: none;";
            activeStyle = "";
        }

        let parent = document.querySelector(".apphub_OtherSiteInfo");
        HTML.beforeEnd(parent,
            ` <a id="es_wishlist_add" class="btnv6_blue_hoverfade btn_medium" style="${inactiveStyle}">
                  <span>
                      <img class="es-loading-wl" src="//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif" style="display: none;">
                      ${Localization.str.add_to_wishlist}
                  </span>
              </a>
              <a id="es_wishlist_success" class="btnv6_blue_hoverfade btn_medium" style="${activeStyle}">
                  <span>
                      <img class="es-remove-wl" src="${ExtensionResources.getURL("img/remove.png")}" style="display: none;">
                      <img class="es-loading-wl" src="//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif" style="display: none;">
                      <img class="es-in-wl" src="//steamstore-a.akamaihd.net/public/images/v6/ico/ico_selected.png" border="0">
                      ${Localization.str.on_wishlist}
                  </span>
              </a>
              <div id="es_wishlist_fail" style="display: none;">
                  <b>${Localization.str.error}</b>
              </div>`);

        let addBtn = document.getElementById("es_wishlist_add");
        let successBtn = document.getElementById("es_wishlist_success");
        let failNode = document.getElementById("es_wishlist_fail");

        addBtn.addEventListener("click", handler);
        successBtn.addEventListener("click", handler);

        let that = this;
        async function handler(e) {
            e.preventDefault();

            if (parent.classList.contains("loading")) { return; }
            parent.classList.add("loading");
            failNode.style.display = "none";

            wishlisted = this === successBtn;
            let action = wishlisted ? "wishlist.remove" : "wishlist.add";

            try {
                await Background.action(action, that.appid);
                
                successBtn.style.display = wishlisted ? "none" : "";
                addBtn.style.display = wishlisted ? "" : "none";

                DynamicStore.clear();
            } catch(err) {
                /* We can't (easily) detect whether or not the user is logged in to the store,
                   therefore we're also not able to provide more details here */
                console.error("Failed to add to/remove from wishlist");
                failNode.style.display = "block";
            } finally {
                parent.classList.remove("loading");
            }
        }
    };

    function makeHeaderLink(cls, url, str) {
        return ` <a class="btnv6_blue_hoverfade btn_medium ${cls}" target="_blank" href="${url}">
                   <span><i class="ico16"></i>&nbsp;${str}</span>
               </a>`;
    }

    CommunityAppPageClass.prototype.addLinks = function() {
        let node = document.querySelector(".apphub_OtherSiteInfo");

        if (SyncedStorage.get("showsteamdb")) {
            HTML.beforeEnd(node, makeHeaderLink(
                "steamdb_ico",
                `https://steamdb.info/app/${this.appid}/`,
                "SteamDB"));
        }

        if (SyncedStorage.get("showitadlinks")) {
            HTML.beforeEnd(node, makeHeaderLink(
                "itad_ico",
                `https://isthereanydeal.com/steam/app/${this.appid}/`,
                "ITAD"));
        }

        if (SyncedStorage.get("showbartervg")) {
            HTML.beforeEnd(node, makeHeaderLink(
                "bartervg_ico",
                `https://barter.vg/steam/app/${this.appid}/`,
                "Barter.vg"));
        }
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

        let nodes = document.querySelectorAll("#rightContents .browseOption");
        for (let node of nodes) {
            let onclick = node.getAttribute("onclick");

            let linkNode = node.querySelector("a");
            linkNode.href = linkNode.href.replace(/requiredtags[^&]+/, "requiredtags[]=-1");

            if (onclick) {
                let url = linkNode.href;
                node.removeAttribute("onclick");
                node.addEventListener("click", function() {
                    window.location.href = url;
                });
            }
        }

        nodes = document.querySelectorAll(".guides_home_view_all_link > a, .guide_home_category_selection");
        for (let node of nodes) {
            node.href = node.href.replace(/&requiredtags[^&]+$/, "");
        }
    };

    return GuidesPageClass;
})();

class MyWorkshopClass {
    constructor() {
        MyWorkshopClass.addFileSizes();
        MyWorkshopClass.addTotalSizeButton();
    }

    static getFileSizeStr(size) {
        let units = ["TB", "GB", "MB", "KB"];

        let index = units.findIndex((unit, i) =>
            size / Math.pow(1000, units.length - (i + 1)) >= 1
        );
        return `${(size / Math.pow(1000, units.length - (index + 1))).toFixed(2)} ${units[index]}`;
    }

    static async addFileSizes() {
        for (let node of document.querySelectorAll(".workshopItemSubscription[id*=Subscription]")) {
            if (node.classList.contains("sized")) { continue; }
            
            let id = node.id.replace("Subscription", "");
            let size = await Background.action("workshopfilesize", id, true);
            if (typeof size !== "number") { continue; }

            let str = Localization.str.calc_workshop_size.file_size.replace("__size__", MyWorkshopClass.getFileSizeStr(size));
            let details = node.querySelector(".workshopItemSubscriptionDetails");
            HTML.beforeEnd(details, `<div class="workshopItemDate">${str}</div>`)
            node.classList.add("sized");
        }
    }

    static addTotalSizeButton() {
        let url = new URL(window.location.href);
        if (!url.searchParams || url.searchParams.get("browsefilter") !== "mysubscriptions") { return; }

        let panel = document.querySelector(".primary_panel");
        HTML.beforeEnd(panel,
            `<div class="menu_panel">
                <div class="rightSectionHolder">
                    <div class="rightDetailsBlock">
                        <span class="btn_grey_steamui btn_medium" id="es_calc_size">
                            <span>${Localization.str.calc_workshop_size.calc_size}</span>
                        </span>
                    </div>
                </div>
            </div>`);
        
        document.querySelector("#es_calc_size").addEventListener("click", async () => {
            ExtensionLayer.runInPageContext((calculating, totalSize) => {
                ShowBlockingWaitDialog(calculating, totalSize);
            },
            [
                Localization.str.calc_workshop_size.calculating,
                Localization.str.calc_workshop_size.total_size.replace("__size__", "0 KB"),
            ]);

            let totalStr = document.querySelector(".workshopBrowsePagingInfo").innerText.match(/\d+[,\d]*/g).pop();
            let total = Number(totalStr.replace(/,/g, ""));
            let parser = new DOMParser();
            let totalSize = 0;

            for (let p = 1; p <= Math.ceil(total / 30); p++) {
                url.searchParams.set("p", p);
                url.searchParams.set("numperpage", 30);

                let result = await RequestData.getHttp(url.toString()).catch(err => console.error(err));
                if (!result) {
                    console.error("Failed to request " + url.toString());
                    continue;
                }

                let doc = parser.parseFromString(result, "text/html");
                for (let item of doc.querySelectorAll(".workshopItemSubscription[id*=Subscription]")) {
                    let id = item.id.replace("Subscription", "");
                    let size;

                    try {
                        size = await Background.action("workshopfilesize", id);
                    } catch(err) {
                        console.group("Workshop file sizes");
                        console.error(`Couldn't get file size for item ID ${id}`);
                        console.error(err);
                        console.groupEnd();
                    }
    
                    if (!size) { continue; }

                    totalSize += size;
                    
                    ExtensionLayer.runInPageContext((calculating, totalSize) => {
                        CModal.DismissActiveModal();
                        ShowBlockingWaitDialog(calculating, totalSize);
                    },
                    [
                        Localization.str.calc_workshop_size.calculating,
                        Localization.str.calc_workshop_size.total_size.replace("__size__", MyWorkshopClass.getFileSizeStr(totalSize)),
                    ]);
                }
            }

            MyWorkshopClass.addFileSizes();
            ExtensionLayer.runInPageContext((finished, totalSize) => {
                CModal.DismissActiveModal();
                ShowAlertDialog(finished, totalSize);
            },
            [
                Localization.str.calc_workshop_size.finished,
                Localization.str.calc_workshop_size.total_size.replace("__size__", MyWorkshopClass.getFileSizeStr(totalSize)),
            ]);
        });
    };
}

class SharedFilesPageClass {
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
        if (!User.isSignedIn) { return; }

        let appid = GameId.getAppidUriQuery(window.location.search);
        if (!appid) { return; }

        let pagingInfo = document.querySelector(".workshopBrowsePagingInfo");
        if (!pagingInfo) { return; }

        let workshopStr = Localization.str.workshop;

        HTML.beforeBegin(".panel > .rightSectionTopTitle",
            `<div class="rightSectionTopTitle">${workshopStr.subscriptions}:</div>
            <div id="es_subscriber_container" class="rightDetailsBlock">
                <div style="position: relative;">
                    <div class="browseOption mostrecent">
                        <a class="es_subscriber" data-method="subscribe">${workshopStr.subscribe_all}</a>
                    </div>
                </div>
                <div style="position: relative;">
                    <div class="browseOption mostrecent">
                        <a class="es_subscriber" data-method="unsubscribe">${workshopStr.unsubscribe_all}</a>
                    </div>
                </div>
                <hr>
            </div>`);

        document.querySelector("#es_subscriber_container").addEventListener("click", e => {
            let method = e.target.closest(".es_subscriber").dataset.method;
            let total = Math.max(...pagingInfo.textContent.replace(/,/g, "").match(/\d+/g));

            startSubscriber(method, total);
        });

        async function startSubscriber(method, total) {
            let completed = 0;
            let failed = 0;

            let statusTitle = workshopStr[method + "_all"];
            let statusString = workshopStr[method + "_confirm"]
                .replace("__count__", total);

            function updateWaitDialog() {
                let statusString = workshopStr[method + "_loading"]
                    .replace("__i__", completed)
                    .replace("__count__", total);

                if (failed) {
                    statusString += workshopStr.failed.replace("__n__", failed);
                }

                let modal = document.querySelector(".newmodal_content");
                if (!modal) {
                    let statusTitle = workshopStr[method + "_all"];
                    ExtensionLayer.runInPageContext((title, progress) => {
                        if (window.dialog) {
                            window.dialog.Dismiss();
                        }
                        
                        window.dialog = ShowBlockingWaitDialog(title, progress);
                    }, [ statusTitle, statusString ]);
                } else {
                    modal.innerText = statusString;
                }
            }

            function showResults() {
                let statusTitle = workshopStr[method + "_all"];
                let statusString = workshopStr.finished
                    .replace("__success__", completed - failed)
                    .replace("__fail__", failed);

                ExtensionLayer.runInPageContext((title, finished) => {
                    if (window.dialog) {
                        window.dialog.Dismiss();
                    }
                    
                    window.dialog = ShowConfirmDialog(title, finished)
                        .done(result => {
                            if (result === "OK") {
                                window.location.reload();
                            }
                        });
                }, [ statusTitle, statusString ]);
            }

            function changeSubscription(id) {
                let formData = new FormData();
                formData.append("sessionid", User.getSessionId());
                formData.append("appid", appid);
                formData.append("id", id);

                return RequestData.post("https://steamcommunity.com/sharedfiles/" + method, formData, {
                    withCredentials: true
                }, true)
                .then(function(res) {
                    if (!res || !res.success) {
                        throw new Error("Bad response");
                    }
                })
                .catch(function(err) {
                    failed++;
                    console.error(err);
                })
                .finally(function() {
                    completed++;
                    updateWaitDialog();
                });
            }

            // todo reject when dialog closed
            await ExtensionLayer.runInPageContext((title, confirm) => {
                let prompt = ShowConfirmDialog(title, confirm);

                return new Promise(resolve => {
                    prompt.done(result => {
                        if (result === "OK") {
                            resolve();
                        }
                    });
                });
                
            }, [ statusTitle, statusString ], "startSubscriber");

            updateWaitDialog();

            function canSkip(method, node) {
                if (method === "subscribe") {
                    return node && node.style.display !== "none";
                }

                if (method === "unsubscribe") {
                    return !node || node.style.display === "none";
                }

                return false;
            }

            let parser = new DOMParser();
            let workshopItems = [];
            for (let p = 1; p <= Math.ceil(total / 30); p++) {
                let url = new URL(window.location.href);
                url.searchParams.set("p", p);
                url.searchParams.set("numperpage", 30);

                let result = await RequestData.getHttp(url.toString()).catch(err => console.error(err));
                if (!result) {
                    console.error("Failed to request " + url.toString());
                    continue;
                }

                let xmlDoc = parser.parseFromString(result, "text/html");
                for (let node of xmlDoc.querySelectorAll(".workshopItem")) {
                    let subNode = node.querySelector(".user_action_history_icon.subscribed");
                    if (canSkip(method, subNode)) { continue; }
                
                    node = node.querySelector(".workshopItemPreviewHolder");
                    workshopItems.push(node.id.replace("sharedfile_", ""))
                }
            }

            total = workshopItems.length;
            updateWaitDialog();

            return Promise.all(workshopItems.map(id => changeSubscription(id)))
                .finally(showResults);
        }
    };

    return WorkshopBrowseClass;
})();

let EditGuidePageClass = (function(){

    function EditGuidePageClass() {
        this.allowMultipleLanguages();
        this.addCustomTags();
        this.rememberTags();
    }

    function addTag(name, checked=true) {
        name = HTML.escape(name);
        let attr = checked ? " checked" : "";
        let tag = `<div><input type="checkbox" name="tags[]" value="${name}" class="inputTagsFilter"${attr}>${name}</div>`;
        HTML.beforeBegin("#es_add_tag", tag);
    }

    EditGuidePageClass.prototype.allowMultipleLanguages = function() {
        document.getElementsByName("tags[]").forEach(tag => tag.type = "checkbox");
    };

    EditGuidePageClass.prototype.addCustomTags = function() {
        let langSection = document.querySelector("#checkboxgroup_1");
        if (!langSection) { return; }

        Messenger.addMessageListener("addtag", name => {
            addTag(name, true);
        });
        
        HTML.afterEnd(langSection,
            `<div class="tag_category_container" id="checkboxgroup_2">
                <div class="tag_category_desc">${Localization.str.custom_tags}</div>
                <div><a style="margin-top: 8px;" class="btn_blue_white_innerfade btn_small_thin" id="es_add_tag">
                    <span>${Localization.str.add_tag}</span>
                </a></div>
            </div>`);

        ExtensionLayer.runInPageContext((customTags, enterTag) => {
            $J("#es_add_tag").on("click", () => {
                let Modal = ShowConfirmDialog(customTags, 
                    `<div class="commentthread_entry_quotebox">
                        <textarea placeholder="${enterTag}" class="commentthread_textarea es_tag" rows="1"></textarea>
                    </div>`);
                
                let elem = $J(".es_tag");
                let tag = elem.val();

                function done() {
                    if (tag.trim().length === 0) { return; }
                    tag = tag[0].toUpperCase() + tag.slice(1);
                    Messenger.postMessage("addtag", tag);
                }

                elem.on("keydown paste input", e => {
                    tag = elem.val();
                    if (e.key === "Enter") {
                        Modal.Dismiss();
                        done();
                    }
                });

                Modal.done(done);
            });
        }, [ Localization.str.custom_tags, Localization.str.enter_tag ]);
    };

    EditGuidePageClass.prototype.rememberTags = function() {
        let submitBtn = document.querySelector("[href*=SubmitGuide]");
        if (!submitBtn) { return; }

        let params = new URLSearchParams(window.location.search);
        let curId = params.get("id") || "recent";
        let savedTags = LocalStorage.get("es_guide_tags", {});
        if (!savedTags[curId]) {
            savedTags[curId] = savedTags.recent || [];
        }

        for (let id in savedTags) {
            for (let tag of savedTags[id]) {
                let node = document.querySelector(`[name="tags[]"][value="${tag.replace(/"/g, "\\\"")}"]`);
                if (node && curId == id) {
                    node.checked = true;
                } else if (!node) {
                    addTag(tag, curId == id);
                }
            }
        }

        submitBtn.removeAttribute("href");
        submitBtn.addEventListener("click", function() {
            savedTags.recent = [];
            savedTags[curId] = Array.from(document.querySelectorAll("[name='tags[]']:checked")).map(node => node.value);
            LocalStorage.set("es_guide_tags", savedTags);
            ExtensionLayer.runInPageContext(() => { SubmitGuide(); });
        });
    };

    return EditGuidePageClass;
})();

(async function(){
    
    switch (true) {

        case /^\/(?:id|profiles)\/[^\/]+?\/?$/.test(path):
            (new ProfileHomePageClass());
            break;

        case /^\/groups\/[^\/]+\/?$/.test(path):
            (new GroupHomePageClass());
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

        case /^\/(?:id|profiles)\/.+\/myworkshopfiles\/?$/.test(path):
            (new MyWorkshopClass());
            break;

        case /^\/sharedfiles\/filedetails\/?$/.test(path):
            (new SharedFilesPageClass());
            break;

        case /^\/workshop\/browse/.test(path):
            (new WorkshopBrowseClass());
            break;

        case /^\/sharedfiles\/editguide\/?$/.test(path):
            (new EditGuidePageClass());
            break;

        case /^\/(?:id|profiles)\/.+\/recommended/.test(path):
            (new RecommendedPageClass());
            break;

        case /^\/tradingcards\/boostercreator/.test(path):
            ExtensionLayer.runInPageContext(gemWord => {
                $J("#booster_game_selector option").each(function() {
                    if ($J(this).val()) {
                        $J(this).append(` - ${CBoosterCreatorPage.sm_rgBoosterData[$J(this).val()].price} ${gemWord}`);
                    }
                });
            }, [ document.querySelector(".booster_creator_goostatus .goo_display").textContent.trim().replace(/[\d]+,?/g, "") ]);
            break;
    }
})();
