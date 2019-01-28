
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

        add_gamelist_common();
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


(function(){
    let path = window.location.pathname.replace(/\/+/g, "/");

    SyncedStorage
        .load()
        .finally(() => Promise
            .all([Localization.promise(), User.promise(), Currency.promise()])
            .then(() => {

                Common.init();

                switch (true) {

                    case /^\/(?:id|profiles)\/(.+)\/games/.test(path):
                        (new GamesPageClass());
                        break;

                    case /^\/(?:id|profiles)\/.+\/edit/.test(path):
                        (new ProfileEditPageClass());
                        break;

                    case /^\/(?:id|profiles)\/[^\/]+?\/?[^\/]*$/.test(path):
                        (new ProfileHomePageClass());
                        break;

                    // TODO
                }
            })
    )

})();

