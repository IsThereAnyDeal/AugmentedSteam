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

let ProfileData = (function(){

    let self = {};

    let _data = {};
    let _promise = null;
    self.promise = async function() {
        if (!_promise) {
            let steamId = SteamId.getSteamId();

            _promise = Background.action("profile", steamId)
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
        await Background.action("clearownprofile", User.steamId);
        _promise = null;
        return self.promise();
    };

    return self;
})();

let CommentHandler = (function(){

    let spamRegex = null;
    let self = {};

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

    function updateFavs(favs, emoticonPopup, favBox, favRemove, name) {
        LocalStorage.set("fav_emoticons", favs);

        if (name && favs.includes(name) && favs.length > 1) {
            HTML.beforeEnd(favBox, buildEmoticonOption(name));
            let node = favBox.querySelector(`[data-emoticon="${name}"]`);
            finalizeFav(node, emoticonPopup, favRemove);
        } else if (name && !favs.includes(name) && favs.length > 0) {
            let node = favBox.querySelector(`[data-emoticon="${name}"]`);
            if (!node) { return; }
            node.parentNode.removeChild(node);             
        } else {
            let favsHtml = buildFavBox(favs);
            HTML.inner(favBox, favsHtml);
            favBox.querySelectorAll(".emoticon_option").forEach(node => {
                finalizeFav(node, emoticonPopup, favRemove);
            });
        }
    }

    function finalizeFav(node, emoticonPopup, favRemove) {
        node.draggable = true;
        node.querySelector("img").draggable = false;
        node.addEventListener("dragstart", (ev) => dragFavEmoticon(ev));
        node.addEventListener("click", (ev) => clickFavEmoticon(ev, emoticonPopup, favRemove));
    }

    function dragFavEmoticon(ev) {
        ev.dataTransfer.setData("emoticon", ev.target.dataset.emoticon);
    }

    function clickFavEmoticon(ev, emoticonPopup, favRemove) {
        let name = ev.target.closest(".emoticon_option").dataset.emoticon;
        let noFav = emoticonPopup.querySelector(`[data-emoticon=${name}]:not(.es_fav)`);
        noFav.click();
    }

    function buildFavBox(favs=[]) {
        let favsHtml;
        if (!favs.length) {
            favsHtml = Localization.str.fav_emoticons_dragging;
        } else {
            favsHtml = favs.map(fav => buildEmoticonOption(fav)).join("");
        }
        return favsHtml;
    }

    function buildEmoticonOption(name) {
        return `<div class="emoticon_option es_fav" data-emoticon="${name}"><img src="https://steamcommunity-a.akamaihd.net/economy/emoticon/${name}" class="emoticon"></div>`;
    }

    self.addFavoriteEmoticons = function() {
        let observer = new MutationObserver(() => {
            let emoticonPopup = document.querySelector(".emoticon_popup:not(.es_emoticons)");
            if (!emoticonPopup) { return; }

            emoticonPopup.classList.add("es_emoticons");
            emoticonPopup.style.maxWidth = "352px";
            emoticonPopup.querySelectorAll(".emoticon_option").forEach(function(node) {
                node.draggable = true;
                node.querySelector("img").draggable = false;
                node.addEventListener("dragstart", ev => ev.dataTransfer.setData("emoticon", ev.target.dataset.emoticon));
            });
            
            let favs = LocalStorage.get("fav_emoticons", []);
            HTML.afterBegin(emoticonPopup, 
                `<div style="margin-bottom:10px;min-height:32px;line-height:32px;text-align:center;max-height:none;display:flex;" class="emoticon_popup_content">
                    <div style="width:10%;background-image:url(https://steamcommunity-a.akamaihd.net/economy/emoticon/remove);background-repeat:no-repeat;background-position:center center;" class="commentthread_entry_quotebox" id="es_fav_remove"></div>
                    <div style="width:90%;" class="commentthread_entry_quotebox" id="es_fav_emoticons"></div>
                </div>`);
                
            let favBox = emoticonPopup.querySelector("#es_fav_emoticons");
            let favRemove = emoticonPopup.querySelector("#es_fav_remove");
            updateFavs(favs, emoticonPopup, favBox, favRemove);

            favBox.addEventListener("dragover", function(ev) {
                ev.preventDefault();
                favBox.style.backgroundColor = "black";
            });

            favBox.addEventListener("dragenter", function(ev) {
                favBox.style.backgroundColor = "black";
            });

            favBox.addEventListener("dragleave", function(ev) {
                favBox.style.backgroundColor = null;
            });

            favBox.addEventListener("drop", function(ev) {
                ev.preventDefault();

                favBox.style.backgroundColor = null;
                let name = ev.dataTransfer.getData("emoticon");
                if (favs.includes(name)) { return; }

                favs.push(name);
                updateFavs(favs, emoticonPopup, favBox, favRemove, name);
            });

            favRemove.addEventListener("dragover", function(ev) {
                ev.preventDefault();
                favRemove.style.backgroundColor = "black";
            });
            
            favRemove.addEventListener("dragenter", function(ev) {
                favRemove.style.backgroundColor = "black";
            });

            favRemove.addEventListener("dragleave", function(ev) {
                favRemove.style.backgroundColor = null;
            });

            favRemove.addEventListener("drop", function(ev) {
                ev.preventDefault();

                favRemove.style.backgroundColor = null;
                let name = ev.dataTransfer.getData("emoticon");
                favs = favs.filter(fav => fav !== name);
                updateFavs(favs, emoticonPopup, favBox, favRemove, name);
            });
        });

        observer.observe(document.body, { childList: true });
    };

    return self;
})();

let CommunityCommon = (function() {
    let self = {};

    self.currentUserIsOwner = function() {
        if (!User.isSignedIn) { return false; }

        let badgeOwnerUrl = document.querySelector(".profile_small_header_texture > a").href + "/";

        return badgeOwnerUrl === User.profileUrl;
    };

    self.addCardExchangeLinks = function(game) {
        if (!SyncedStorage.get("steamcardexchange")) { return; }

        let ceImg = ExtensionResources.getURL("img/ico/steamcardexchange.png");

        for (let node of document.querySelectorAll(".badge_row:not(.es-has-ce-link")) {
            let appid = game || GameId.getAppidFromGameCard(node.querySelector(".badge_row_overlay").href);
            if (!appid) { continue; }

            HTML.afterBegin(node,
                `<div class="es_steamcardexchange_link">
                    <a href="https://www.steamcardexchange.net/index.php?gamepage-appid-${appid}/" target="_blank" title="Steam Card Exchange">
                        <img src="${ceImg}" alt="Steam Card Exchange">
                    </a>
                </div>`);

            node.classList.add("es-has-ce-link");
        }
    };

    self.makeProfileLink = function(id, link, name, iconType, iconUrl) {
        let mainType = iconUrl ? "none" : iconType;
        let html = `<div class="es_profile_link profile_count_link">
                   <a class="es_sites_icons es_${id}_icon es_${mainType}" href="${link}" target="_blank">`;

        if (iconType !== "none" && iconUrl) {
            html += `<i class="es_sites_custom_icon es_${iconType}" style="background-image: url('${iconUrl}');"></i>`;
        }

        html += `<span class="count_link_label">${name}</span>
                <span class="profile_count_link_total">&nbsp;</span></a></div>`; // Steam spacing

        return html;
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
        await Promise.all([DynamicStore, User]);

        let blotterBlocks = document.querySelectorAll(".blotter_block:not(.es_highlight_checked)");
        blotterBlocks.forEach(node => node.classList.add("es_highlight_checked"));

        let aNodes = Array.from(blotterBlocks).reduce((acc, cur) => {
            acc.push(...Array.from(cur.querySelectorAll("a:not(.blotter_gamepurchase_logo)")).filter(link =>
                (GameId.getAppid(link) && link.childElementCount <= 1)
                &&
                // https://github.com/tfedor/AugmentedSteam/pull/470#pullrequestreview-284928257
                (link.childElementCount !== 1 || !link.closest(".vote_header"))
            ));
            return acc;
        }, []);

        await Highlights.highlightAndTag(aNodes, false);

        if (!SyncedStorage.get("showcomparelinks")) { return; }
        blotterBlocks.forEach(blotter => {
            blotter.querySelectorAll("a.es_highlighted_owned").forEach(aNode => {
                addAchievementComparisonLink(aNode);
            })
        });
    };

    function addAchievementComparisonLink(node) {
        let blotter = node.closest(".blotter_daily_rollup_line");
        if (!blotter) { return; }

        if (node.parentNode.nextElementSibling.tagName !== "IMG") { return; }

        let friendProfileUrl = blotter.querySelector("a[data-miniprofile]").href + '/';
        if (friendProfileUrl === User.profileUrl) { return; }

        node.classList.add("es_achievements");

        let compareLink = friendProfileUrl + "/stats/" + GameId.getAppid(node) + "/compare/#es-compare";
        HTML.afterEnd(blotter.querySelector("span"), `<a class='es_achievement_compare' href='${compareLink}' target='_blank' style='line-height: 32px'>(${Localization.str.compare})</a>`);
    }

    ProfileActivityPageClass.prototype.observeChanges = function() {
        let that = this;
        let observer = new MutationObserver(() => {
            that.highlightFriendsActivity();
            EarlyAccess.showEarlyAccess();
            CommentHandler.hideSpamComments();
        });

        observer.observe(document.querySelector("#blotter_content"), { subtree: true, childList: true });
    };

    return ProfileActivityPageClass;
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


let GamesPageClass = (function(){

    function GamesPageClass() {
        // Prevent errors if "Game Details" is private
        if (!document.querySelector(".gameListRow")) {
            return;
        }
        // Only show stats on the "All Games" tab
        if (window.location.search.includes("?tab=all")) {
            this.computeStats();
            this.handleCommonGames();
            this.addGamelistAchievements();
        }
    }

    GamesPageClass.prototype.computeStats = function() {
        if (!SyncedStorage.get("showallstats")) { return; }

        let games = HTMLParser.getVariableFromDom("rgGames", "array");

        let countTotal = games.length;
        let countPlayed = 0;
        let countNeverPlayed = 0;

        let time = 0;
        for (let game of games) {
            if (!game['hours_forever']) {
                countNeverPlayed++;
                continue;
            }

            countPlayed++;
            time += parseFloat(game['hours_forever'].replace(",",""));
        }

        let totalTime = Localization.str.hours_short.replace("__hours__", time.toFixed(1));

        HTML.beforeBegin("#mainContents",
            `<div id="esi-collection-chart-content">
                <div class="esi-collection-stat"><span class="num">${totalTime}</span>${Localization.str.coll.total_time}</div>
                <div class="esi-collection-stat"><span class="num">${countTotal}</span>${Localization.str.coll.in_collection}</div>
                <div class="esi-collection-stat"><span class="num">${countPlayed}</span>${Localization.str.coll.played}</div>
                <div class="esi-collection-stat"><span class="num">${countNeverPlayed}</span>${Localization.str.coll.never_played}</div>
            </div>`);
    };

    let scrollTimeout = null;

    GamesPageClass.prototype.addGamelistAchievements = function() {
        if (!SyncedStorage.get("showallachievements")) { return; }

        // Path of profile in view to retrieve achievement stats
        let path = window.location.pathname.replace("/games", "");

        document.addEventListener("scroll", () => {
            if (scrollTimeout) { window.clearTimeout(scrollTimeout); }
            scrollTimeout = window.setTimeout(addAchievements, 500);
        });

        addAchievements();

        function addAchievements() {
            let nodes = document.querySelectorAll(".gameListRow:not(.es_achievements_checked)");
            let hadNodesInView = false;
            for (let node of nodes) {

                if (!Viewport.isElementInViewport(node)) {
                    if (hadNodesInView) { break; }
                    continue;
                }

                hadNodesInView = true;

                let appid = GameId.getAppidFromId(node.id);
                node.classList.add("es_achievements_checked");
                if (!node.innerHTML.match(/ico_stats\.png/)) { continue; }

                let hoursNode = node.querySelector("h5.hours_played");
                if (!hoursNode) { continue; }

                HTML.afterEnd(hoursNode, `<div class="es_recentAchievements" id="es_app_${appid}"></div>`);

                Stats.getAchievementBar(path, appid).then(achieveBar => {
                    if (!achieveBar) { return; }

                    HTML.inner(document.querySelector(`#es_app_${appid}`), achieveBar);
                }, err => {
                    console.error(err);
                });
            }
        }
    };

    let _commonGames = null;

    async function loadCommonGames() {
        if (_commonGames != null) { return; }

        let commonUrl = `${window.location.href}&games_in_common=1`;
        let data = await RequestData.getHttp(commonUrl);

        let games = HTMLParser.getVariableFromText(data, "rgGames", "array");
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
        if (!User.isSignedIn) { return; }

        let label = document.querySelector("label[for='show_common_games']");
        if (!label) { return; }

        HTML.afterEnd(label,
            `<label for="es_gl_show_common_games"><input type="checkbox" id="es_gl_show_common_games">${Localization.str.common_label}</label>
            <label for="es_gl_show_notcommon_games"><input type="checkbox" id="es_gl_show_notcommon_games">${Localization.str.notcommon_label}</label>`);

        let commonCheckbox = document.getElementById("es_gl_show_common_games");
        let notCommonCheckbox = document.getElementById("es_gl_show_notcommon_games");
        let rows = document.getElementById("games_list_rows");

        commonCheckbox.addEventListener("change", async function(e) {
            await loadCommonGames();
            rows.classList.toggle("esi-hide-notcommon", e.target.checked);
            ExtensionLayer.runInPageContext(() => { CScrollOffsetWatcher.ForceRecalc(); });
        });

        notCommonCheckbox.addEventListener("change", async function(e) {
            await loadCommonGames();
            rows.classList.toggle("esi-hide-common", e.target.checked);
            ExtensionLayer.runInPageContext(() => { CScrollOffsetWatcher.ForceRecalc(); });
        });
    };

    return GamesPageClass;
})();

let ProfileEditPageClass = (function(){

    function ProfileEditPageClass() {
        ProfileData.clearOwn().then(() => {
            if (!window.location.pathname.includes("/settings")) {
                this.addBackgroundSelection();
                this.addStyleSelection();
            }
        })
    }

    function showBgFormLoading() {
        document.querySelector("#es_bg .es_loading").style.display = "block";
    }

    function hideBgFormLoading() {
        document.querySelector("#es_bg .es_loading").style.display = "none";
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
        ExtensionLayer.runInPageContext(() => { SetupTooltips({ tooltipCSSClass: "community_tooltip" }); });

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
                            <option id='orange' value='orange'>Orange Theme</option>
                            <option id='pink' value='pink'>Pink Theme</option>
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

        ExtensionLayer.runInPageContext(() => { SetupTooltips({ tooltipCSSClass: "community_tooltip" }); });

        let styleSelectNode = document.querySelector("#es_style");

        let currentStyle = ProfileData.getStyle();
        if (currentStyle) {
            styleSelectNode.value = currentStyle;

            let imgNode = document.querySelector("#es_style_preview");
            imgNode.src = ExtensionResources.getURL("img/profile_styles/" + currentStyle + "/preview.png");

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
                imgNode.src = ExtensionResources.getURL("img/profile_styles/" + styleSelectNode.value + "/preview.png");
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

        let result = await Background.action("appdetails", giftAppid, "price_overview");
        if (!result || !result.success) { return; }

        let overview = result.data.price_overview;
        if (!overview) { return; }

        let discount = overview.discount_percent;
        let price = new Price(overview.final / 100, overview.currency);

        itemActions.style.display = "flex";
        itemActions.style.alignItems = "center";
        itemActions.style.justifyContent = "space-between";

        if (discount > 0) {
            let originalPrice = new Price(overview.initial / 100, overview.currency);
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

    function addOneClickGemsOption(item, appid, assetid) {
        if (!SyncedStorage.get("show1clickgoo")) { return; }

        let quickGrind = document.querySelector("#es_quickgrind");
        if (quickGrind) { quickGrind.parentNode.remove(); }

        let scrapActions = document.querySelector("#iteminfo" + item + "_item_scrap_actions");

        let divs = scrapActions.querySelectorAll("div");
        HTML.beforeBegin(divs[divs.length-1],
            `<div><a class='btn_small btn_green_white_innerfade' id='es_quickgrind'><span>${Localization.str.oneclickgoo}</span></div>`);

        // TODO: Add prompt?
        document.querySelector("#es_quickgrind").addEventListener("click", function(e) {
            ExtensionLayer.runInPageContext((appid, assetid) => {
                let rgAJAXParams = {
                    sessionid: g_sessionID,
                    appid,
                    assetid,
                    contextid: 6
                };

                let strActionURL = `${g_strProfileURL}/ajaxgetgoovalue/`;

                $J.get(strActionURL, rgAJAXParams).done(data => {
                    strActionURL = `${g_strProfileURL}/ajaxgrindintogoo/`;
                    rgAJAXParams.goo_value_expected = data.goo_value;

                    $J.post(strActionURL, rgAJAXParams).done(() => {
                        ReloadCommunityInventory();
                    });
                });
            });
        }, [ appid, assetid ]);
    }

    function makeMarketButton(id, tooltip) {
        return `<a class="item_market_action_button item_market_action_button_green" id="${id}" data-tooltip-text="${tooltip}" style="display:none">
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
            let diff = SyncedStorage.get("quickinv_diff");
            HTML.beforeEnd(marketActions, makeMarketButton("es_quicksell" + assetId, Localization.str.quick_sell_desc.replace("__modifier__", diff)));
            HTML.beforeEnd(marketActions, makeMarketButton("es_instantsell" + assetId, Localization.str.instant_sell_desc));

            ExtensionLayer.runInPageContext(() => { SetupTooltips({ tooltipCSSClass: "community_tooltip" }); });

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

                    let priceHigh = parseFloat(market.lowest_sell_order / 100) + parseFloat(diff);
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

                ExtensionLayer.runInPageContext((sellPrice, sessionID, global_id, contextID, assetID) => {
                    Messenger.postMessage("sendFee",
                        {
                            feeInfo: CalculateFeeAmount(sellPrice, 0.10),
                            sessionID,
                            global_id,
                            contextID,
                            assetID,
                        }
                    );
                },
                [
                    sellPrice,
                    sessionId,
                    globalId,
                    contextId,
                    assetId,
                ]);
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

        ExtensionLayer.runInPageContext(() => {

            $J(document).on("click", ".inventory_item_link, .newitem", () => {
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
        
        Messenger.addMessageListener("sendMessage", info => { inventoryMarketHelper(info) });

        Messenger.addMessageListener("sendFee", async ({ feeInfo, sessionID, global_id, contextID, assetID }) => {
            let sellPrice = feeInfo.amount - feeInfo.fees;
            let formData = new FormData();
            formData.append("sessionid", sessionID);
            formData.append("appid", global_id);
            formData.append("contextid", contextID);
            formData.append("assetid", assetID);
            formData.append("amount", 1);
            formData.append("price", sellPrice);

            /*
            * TODO test what we need to send in request, this is original:
            * mode: "cors", // CORS to cover requests sent from http://steamcommunity.com
            * credentials: "include",
            * headers: { origin: window.location.origin },
            * referrer: window.location.origin + window.location.pathname
            */

            await RequestData.post("https://steamcommunity.com/market/sellitem/", formData, { withCredentials: true });

            document.querySelector(`#es_instantsell${assetID}`).parentNode.style.display = "none";

            let node = document.querySelector(`[id="${global_id}_${contextID}_${assetID}"]`);
            node.classList.add("btn_disabled", "activeInfo");
            node.style.pointerEvents = "none";
        });
    }

    function addInventoryGoToPage(){
        if (!SyncedStorage.get("showinvnav")) { return; }

        // todo can this be circumvented?
        DOMHelper.remove("#es_gotopage");
        DOMHelper.remove("#pagebtn_first");
        DOMHelper.remove("#pagebtn_last");
        DOMHelper.remove("#es_pagego");

        DOMHelper.insertScript({ content:
            `g_ActiveInventory.GoToPage = function(page) {
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
            };

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
            }`
        }, "es_gotopage");

        // Go to first page
        HTML.afterEnd("#pagebtn_previous", "<a id='pagebtn_first' class='pagebtn pagecontrol_element disabled'>&lt;&lt;</a>");
        document.querySelector("#pagebtn_first").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(() => { InventoryFirstPage(); });
        });

        // Go to last page
        HTML.beforeBegin("#pagebtn_next", "<a id='pagebtn_last' class='pagebtn pagecontrol_element'>&gt;&gt;</a>");
        document.querySelector("#pagebtn_last").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(() => { InventoryLastPage(); });
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
        this.isMyProfile = CommunityCommon.currentUserIsOwner();
        this.hasMultiplePages = !!document.querySelector(".profile_paging");
        this.hasAllPagesLoaded = false;

        if (this.isMyProfile) {
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

        HTML.beforeEnd(document.querySelector(".profile_xp_block_mid"),
            `<div class="es_faq_cards">${xpBlockRight.innerHTML}</div>`);

        HTML.inner(xpBlockRight, '<div id="es_cards_worth"></div>');
    };

    // Display the cost estimate of crafting a game badge by purchasing unowned trading cards
    BadgesPageClass.prototype.addBadgeCompletionCost = async function() {
        if (!this.isMyProfile) { return; }

        let items = [];
        let appids = [];
        let foilAppids = [];

        for (let node of document.querySelectorAll(".badge_row.is_link:not(.esi-badge)")) {
            let link = node.querySelector("a.badge_row_overlay").href;

            let game = link.match(/gamecards\/(\d+)\//);
            if (!game) { continue; }
            let appid = parseInt(game[1]);

            let foil = link.includes("?border=1");
            items.push([appid, node, foil]);

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
        } catch (err) {
            console.error("Failed to retrieve average card prices", err);
            return;
        }

        let totalWorth = 0;
        for (let tuple of items) {
            let [appid, node, isFoil] = tuple;

            let key = isFoil ? "foil" : "regular";
            if (!data[appid] || !data[appid][key]) { continue; }

            let averagePrice = data[appid][key].average;

            let cost;
            let progressInfoNode = node.querySelector(".badge_progress_info");
            if (progressInfoNode) {
                let card = progressInfoNode.textContent.trim().match(/(\d+)\D*(\d+)/);
                if (card) {
                    let need = card[2] - card[1];
                    cost = new Price(averagePrice * need);
                }
            }

            // calculate total worth of regular cards
            if (!isFoil) {
                let progressBoldNode = node.querySelector(".progress_info_bold");
                if (progressBoldNode) {
                    let drops = progressBoldNode.textContent.match(/\d+/);
                    if (drops) {
                        let worth = new Price(drops[0] * averagePrice);

                        if (worth.value > 0) {
                            totalWorth += worth.value;

                            HTML.replace(node.querySelector(".how_to_get_card_drops"),
                                `<span class="es_card_drop_worth" data-es-card-worth="${worth.value}">${Localization.str.drops_worth_avg} ${worth}</span>`);
                        }
                    }
                }
            }

            if (cost) {
                let badgeNameBox = DOMHelper.selectLastNode(node, ".badge_empty_name");
                if (badgeNameBox) {
                    HTML.afterEnd(badgeNameBox, `<div class="badge_info_unlocked">${Localization.str.badge_completion_avg.replace("__cost__", cost)}</div>`);
                }
            }

            node.classList.add("esi-badge");
        }

        document.querySelector("#es_cards_worth").textContent = `${Localization.str.drops_worth_avg} ${new Price(totalWorth)}`;
    };

    async function eachBadgePage(callback) {
        let baseUrl = `https://steamcommunity.com/${window.location.pathname}?p=`;

        let params = new URLSearchParams(window.location.search);
        let skip = params.get("p") || 1;

        let lastPage = parseInt(DOMHelper.selectLastNode(document, "div.pageLinks a.pagelink").textContent);
        for (let p = 1; p <= lastPage; p++) { // doing one page at a time to prevent too many requests at once
            if (p === skip) { continue; }
            try {
                let response = await RequestData.getHttp(baseUrl + p);

                let dom = HTMLParser.htmlToDOM(response);
                await callback(dom);

            } catch (err) {
                console.error(`Failed to load page ${baseUrl + p}`, err);
                return;
            }
        }
    }

    BadgesPageClass.prototype.loadAllPages = async function() {
        if (this.hasAllPagesLoaded) { return; }
        this.hasAllPagesLoaded = true;

        let sheetNode = document.querySelector(".badges_sheet");

        // let images = Viewport.getVariableFromDom("g_rgDelayedLoadImages", "object");

        await eachBadgePage(async (dom) => {
            for (let node of dom.querySelectorAll(".badge_row")) {
                sheetNode.append(node);
            }

            CommunityCommon.addCardExchangeLinks();
            await this.addBadgeCompletionCost();

            // images = Object.assign(images, Viewport.getVariableFromDom("g_rgDelayedLoadImages", "object", dom));
        });

        for (let node of document.querySelectorAll(".profile_paging")) {
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
            for (let node of dom.querySelectorAll("span.progress_info_bold")) {
                let count = node.textContent.match(/\d+/);
                if (!count) { continue; }

                dropsGames++;
                dropsCount += parseInt(count[0]);
            }
        }

        async function addDropsCount() {
            HTML.inner("#es_calculations",
                `${Localization.str.card_drops_remaining.replace("__drops__", dropsCount)}
                <br>${Localization.str.games_with_drops.replace("__dropsgames__", dropsGames)}`);

            let response;
            try {
                response = await RequestData.getHttp("https://steamcommunity.com/my/ajaxgetboostereligibility/");
            } catch (err) {
                console.error("Failed to load booster eligibility", err);
                return;
            }

            let dummy = HTMLParser.htmlToDOM(response);
            let boosterCount = dummy.querySelectorAll(".booster_eligibility_game").length;

            HTML.beforeEnd("#es_calculations", `<br>${Localization.str.games_with_booster.replace("__boostergames__", boosterCount)}`);
        }

        countDropsFromDOM(document);

        if (this.hasMultiplePages) {
            HTML.afterBegin(".profile_xp_block_right",
                `<div id="es_calculations"><div class="btn_grey_black btn_small_thin"><span>${Localization.str.drop_calc}</span></div></div>`);

            document.querySelector("#es_calculations").addEventListener("click", async e => {
                if (completed) { return; }

                e.target.textContent = Localization.str.loading;

                await eachBadgePage(countDropsFromDOM);

                addDropsCount();
                completed = true;
            });

        } else {
            HTML.afterBegin(".profile_xp_block_right", '<div id="es_calculations"></div>');

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
        for (let node of document.querySelectorAll(".badge_row")) {
            badgeRows.push([node.outerHTML, nodeValueCallback(node)]);
            node.remove();
        }

        badgeRows.sort((a, b) => b[1] - a[1]);

        let sheetNode = document.querySelector(".badges_sheet");
        for (let row of badgeRows) {
            HTML.beforeEnd(sheetNode, row[0]);
        }

        resetLazyLoader();
        document.querySelector("#es_sort_active").textContent = activeText;
        document.querySelector("#es_sort_flyout").style.display = "none";
    }

    BadgesPageClass.prototype.addBadgeSort = function() {

        let sorts = ["c", "a", "r"];
        if (this.isMyProfile) {
            sorts.unshift("p");
        }

        // Steam's sort options, hidden by CSS
        let sortOptions = document.querySelector(".profile_badges_sortoptions");

        // Build dropdown links HTML
        let html = "";
        sortOptions.querySelectorAll("a").forEach((node, i) => {
            html += `<a class="popup_menu_item by_${sorts[i]}" data-sort-by="${sorts[i]}" href="?sort=${sorts[i]}">${node.textContent.trim()}</a>`;
        });
        if (this.isMyProfile) {
            html += `<a class="popup_menu_item by_d" data-sort-by="d" id="es_badge_sort_drops">${Localization.str.most_drops}</a>`;
            html += `<a class="popup_menu_item by_v" data-sort-by="v" id="es_badge_sort_value">${Localization.str.drops_value}</a>`;
        }

        let container = document.createElement("span");
        container.id = "wishlist_sort_options";
        DOMHelper.wrap(container, sortOptions);

        // Insert dropdown options links
        HTML.beforeEnd(sortOptions,
            `<div id="es_sort_flyout" class="popup_block_new flyout_tab_flyout responsive_slidedown">
                <div class="popup_body popup_menu">${html}</div>
            </div>`);

        let sorted = sortOptions.querySelector("a.badge_sort_option.active").search.replace("?sort=", "")
            || (this.isMyProfile ? "p" : "c");
        let activeText = sortOptions.querySelector(`#es_sort_flyout a.by_${sorted}`).textContent;

        // Insert dropdown button
        HTML.afterEnd(sortOptions.querySelector("span"),
            `<span id="wishlist_sort_options">
                <div class="store_nav">
                    <div id="es_sort_tab" class="tab flyout_tab" data-flyout="es_sort_flyout" data-flyout-align="right" data-flyout-valign="bottom">
                        <span class="pulldown">
                            <div id="es_sort_active">${activeText}</div>
                            <span></span>
                        </span>
                    </div>
                </div>
            </span>`);

        ExtensionLayer.runInPageContext(() => { BindAutoFlyoutEvents(); });

        if (this.isMyProfile) {
            document.querySelector("#es_badge_sort_drops").addEventListener("click", async e => {

                if (this.hasMultiplePages) {
                    await this.loadAllPages();
                }

                sortBadgeRows(e.target.textContent, (node) => {
                    let content = 0;
                    let dropCount = node.querySelector(".progress_info_bold");
                    if (dropCount) {
                        let drops = dropCount.textContent.match(/\d+/);
                        if (drops) {
                            content = parseInt(drops[0]);
                        }
                    }
                    return content;
                });
            });

            document.querySelector("#es_badge_sort_value").addEventListener("click", async e => {

                if (this.hasMultiplePages) {
                    await this.loadAllPages();
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
        if (!this.isMyProfile) { return; }

        HTML.afterBegin("#wishlist_sort_options", 
            `<div class="es_badge_filter"><span>${Localization.str.show}</span>
                <div class="store_nav">
                    <div id="es_filter_tab" class="tab flyout_tab" data-flyout="es_filter_flyout" data-flyout-align="right" data-flyout-valign="bottom">
                        <span class="pulldown">
                            <div id="es_filter_active">${Localization.str.badges_all}</div>
                            <span></span>
                        </span>
                    </div>
                </div>
                <div id="es_filter_flyout" class="popup_block_new flyout_tab_flyout responsive_slidedown">
                    <div class="popup_body popup_menu">
                        <a class="popup_menu_item es_bg_filter" id="es_badge_all">${Localization.str.badges_all}</a>
                        <a class="popup_menu_item es_bg_filter" id="es_badge_drops">${Localization.str.badges_drops}</a>
                    </div>
                </div>
            </div>`);

        document.querySelector("#es_badge_all").addEventListener("click", () => {
            for (let node of document.querySelectorAll(".badge_row")) {
                node.style.display = "block";
            }

            document.querySelector("#es_filter_active").textContent = Localization.str.badges_all;
            document.querySelector("#es_filter_flyout").style.display = "none";
            resetLazyLoader();
        });

        document.querySelector("#es_badge_drops").addEventListener("click", async e => {
            e.preventDefault();

            // Load additinal badge sections if multiple pages are present
            if (this.hasMultiplePages) {
                await this.loadAllPages();
            }

            for (let node of document.querySelectorAll(".badge_row")) {
                let stats = node.querySelector(".progress_info_bold");
                if (!stats || !/\d+/.test(stats.textContent)) {
                    node.style.display = "none";
                } else if (node.querySelector(".badge_info_unlocked") && !node.querySelector(".badge_current")) {
                    node.style.display = "none";
                }
            }

            document.querySelector("#es_filter_active").textContent = Localization.str.badges_drops;
            document.querySelector("#es_filter_flyout").style.display = "none";
            resetLazyLoader();
        });
    };

    BadgesPageClass.prototype.addBadgeViewOptions = function() {

        HTML.afterBegin("#wishlist_sort_options",
            `<div class="es_badge_view"><span>${Localization.str.view}</span>
                <div class="store_nav">
                    <div id="es_badgeview_tab" class="tab flyout_tab" data-flyout="es_badgeview_flyout" data-flyout-align="right" data-flyout-valign="bottom">
                        <span class="pulldown">
                            <div id="es_badgeview_active">${Localization.str.theworddefault}</div>
                            <span></span>
                        </span>
                    </div>
                </div>
                <div id="es_badgeview_flyout" class="popup_block_new flyout_tab_flyout responsive_slidedown">
                    <div class="popup_body popup_menu">
                        <a class="popup_menu_item es_bg_view" data-view="defaultview">${Localization.str.theworddefault}</a>
                        <a class="popup_menu_item es_bg_view" data-view="binderview">${Localization.str.binder_view}</a>
                    </div>
                </div>
            </div>`);

        // Change hash when selecting view
        document.querySelector("#es_badgeview_flyout").addEventListener("click", e => {
            let node = e.target.closest(".es_bg_view");
            if (!node) { return; }
            window.location.hash = node.dataset.view;
            e.currentTarget.style.display = "none";
        });

        // Monitor for hash changes
        window.addEventListener("hashchange", () => {
            toggleBinderView();
        });

        toggleBinderView();

        function toggleBinderView() {
            let mainNode = document.querySelector("div.maincontent");

            if (window.location.hash === "#binderview") {
                mainNode.classList.add("es_binder_view");

                // Don't attempt changes again if already loaded
                if (!mainNode.classList.contains("es_binder_loaded")) {
                    mainNode.classList.add("es_binder_loaded");

                    for (let node of document.querySelectorAll(".badge_row")) {
                        let stats = node.querySelector(".progress_info_bold");
                        if (stats && /\d+/.test(stats.textContent)) {
                            HTML.beforeEnd(node.querySelector(".badge_content"),
                                `<span class="es_game_stats">${stats.innerHTML}</span>`);
                        }

                        let infoNode = node.querySelector(".badge_progress_info");
                        if (infoNode) {
                            let card = infoNode.textContent.trim().match(/(\d+)\D*(\d+)/);
                            if (card) {
                                HTML.beforeBegin(infoNode,
                                    `<div class="es_badge_progress_info">${card[1]} / ${card[2]}</div>`);
                            }
                        }
                    }
                }

                // Add hash to pagination links
                let nodes = document.querySelectorAll("div.pageLinks a.pagelink, div.pageLinks a.pagebtn");
                for (let node of nodes) {
                    node.href += "#binderview";
                }

                // Triggers the loading of out-of-view badge images
                window.dispatchEvent(new Event("resize"));

                document.querySelector("#es_badgeview_active").textContent = Localization.str.binder_view;
            } else {
                mainNode.classList.remove("es_binder_view");

                // Remove hash from pagination links
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
        this.isFoil = window.location.search.includes("?border=1");

        CommunityCommon.addCardExchangeLinks(this.appid);
        this.addMarketLinks();
        this.addFoilLink();
        this.addStoreTradeForumLink();
    }

    GameCardPageClass.prototype.addMarketLinks = async function() {
        let cost = 0;

        let data;
        try {
            data = await Background.action("market.cardprices", {
                appid: this.appid,
                currency: Currency.storeCurrency,
            });
        } catch (err) {
            console.error("Failed to load card prices", err);
            return;
        }

        for (let node of document.querySelectorAll(".badge_card_set_card")) {
            let cardName = node
                .querySelector(".badge_card_set_text").textContent
                .replace(/&amp;/g, "&")
                .replace(/\(\d+\)/g, "").trim();
            let cardData = data[cardName] || data[cardName + " (Trading Card)"];
            if (this.isFoil) {
                cardData = data[cardName + " (Foil)"] || data[cardName + " (Foil Trading Card)"];
            }

            if (cardData) {
                let marketLink = `https://steamcommunity.com/market/listings/${cardData.url}`;
                let cardPrice = new Price(cardData.price);

                if (node.classList.contains("unowned")) {
                    cost += cardPrice.value;
                }

                if (marketLink && cardPrice) {
                    HTML.beforeEnd(node, `<a class="es_card_search" href="${marketLink}">${Localization.str.lowest_price} ${cardPrice}</a>`);
                }
            }
        }

        if (cost > 0 && CommunityCommon.currentUserIsOwner()) {
            cost = new Price(cost);
            HTML.afterEnd(
                DOMHelper.selectLastNode(document, ".badge_empty_name"),
                `<div class="badge_empty_name badge_info_unlocked">${Localization.str.badge_completion_cost.replace("__cost__", cost)}</div>`);

            document.querySelector(".badge_empty_right").classList.add("esi-badge");
        }
    };

    GameCardPageClass.prototype.addFoilLink = function() {
        let node = document.querySelector(".gamecards_inventorylink");
        if (!node) { return; }

        let url = window.location.href;
        let text;
        if (this.isFoil) {
            url = url.replace(/\?border=1/, "");
            text = Localization.str.view_normal_badge;
        } else {
            url += "?border=1";
            text = Localization.str.view_foil_badge;
        }

        HTML.beforeEnd(node,
            `<a class="btn_grey_grey btn_small_thin" href="${url}"><span>${text}</span></a>`);
    };

    GameCardPageClass.prototype.addStoreTradeForumLink = function() {
        // TODO certain cards e.g. sale event cards don't have valid forum links
        let node = document.querySelector(".gamecards_inventorylink");
        if (!node) { return; }

        HTML.beforeEnd(node,
            `<div style="float: right;">
                <a class="btn_grey_grey btn_medium" href="//store.steampowered.com/app/${this.appid}/">
                    <span>${Localization.str.visit_store}</span>
                </a>
                <a class="es_visit_tforum btn_grey_grey btn_medium" href="https://steamcommunity.com/app/${this.appid}/tradingforum/">
                    <span>${Localization.str.visit_trade_forum}</span>
                </a>
            </div>`);
    };

    return GameCardPageClass;
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
        let result = await Background.action("appuserdetails", this.appid);
        if (!result || !result.success || !result.data || !result.data.friendsown || !result.data.friendsown.length) { return; }

        let friendsData = await friendsPromise;
        let friendsHtml = HTMLParser.htmlToDOM(friendsData);

        let friendsOwn = result.data.friendsown;

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
        ExtensionLayer.runInPageContext(() => { InitMiniprofileHovers(); });
    };

    FriendsThatPlayPageClass.prototype.addFriendsPlayTimeSort = function() {

        let sorted = {};

        document.querySelector(".friendListSectionHeader").insertAdjacentElement("beforeend", Sortbox.get("friends_that_play", [
            ["default", Localization.str.theworddefault],
            ["playtime", Localization.str.playtime],
        ], "default", onChange));

        function onChange(key, reversed) {
            if (!sorted.default) {
                sorted.default = new Map();
                for (let block of document.querySelectorAll(".profile_friends")) {
                    if (block.querySelector(".friendBlockInnerLink")) {
                        sorted.default.set(block, Array.from(block.querySelectorAll(".friendBlock")));
                    }
                }
            }

            // This only happens for the first sort after playtime
            if (!sorted[key]) {
                if (key === "playtime") {
                    sorted[key] = new Map();
                    for (let [block, friends] of sorted.default) {
                        let friendsCopy = friends.slice();
                        friendsCopy.sort((a, b) =>
                            parseFloat(b.querySelector(".friendSmallText").textContent.match(/(\d+(\.\d+)?)/)[0]) -
                            parseFloat(a.querySelector(".friendSmallText").textContent.match(/(\d+(\.\d+)?)/)[0])
                        );
                        sorted[key].set(block, friendsCopy);
                    }
                }                
            }

            for (let [block, friends] of sorted[key]) {
                for (let friend of friends) {
                    if (reversed) {
                        block.insertAdjacentElement("afterbegin", friend);
                    } else {
                        block.closest(".profile_friends").querySelector(":scope > :last-child").insertAdjacentElement("beforebegin", friend);
                    }
                }
            }
        }
    };

    return FriendsThatPlayPageClass;
})();

let FriendsPageClass = (function(){

    function FriendsPageClass() {
        this.addSort();
        this.addFriendsInviteButton();
    }

    FriendsPageClass.prototype.addSort = function() {
        let offlineFriends = document.querySelectorAll(".friend_block_v2.persona.offline");
        if (offlineFriends.length === 0 || !document.querySelector("#manage_friends_control")) { return; }

        let friendsFetched = false;

        offlineFriends.forEach((friend, i) => friend.dataset.esSortDefault = i);

        async function sortFriends(sortBy, reversed) {
            sortBy = (sortBy === "lastonline" ? "lastonline" : "default");

            if (sortBy === "lastonline" && !friendsFetched) {
                
                friendsFetched = true;
                let data = await RequestData.getHttp("https://steamcommunity.com/my/friends/?ajax=1&l=english");
                let dom = HTMLParser.htmlToElement(data);

                for (let friend of dom.querySelectorAll(".friend_block_v2.persona.offline")) {
                    let lastOnline = friend.querySelector(".friend_last_online_text").textContent.match(/Last Online (?:(\d+) days)?(?:, )?(?:(\d+) hrs)?(?:, )?(?:(\d+) mins)? ago/);
                    let time = Infinity;
                    if (lastOnline) {
                        let days = parseInt(lastOnline[1]) || 0;
                        let hours = parseInt(lastOnline[2]) || 0;
                        let minutes = parseInt(lastOnline[3]) || 0;
                        let downtime = (days * 24 + hours) * 60 + minutes;
                        time = downtime;
                    }
                    document.querySelector(`.friend_block_v2.persona.offline[data-steamid="${friend.dataset.steamid}"]`).dataset.esSortTime = time;
                }
            }

            let offlineBlock = document.querySelector("#state_offline");
            let curOfflineFriends = Array.from(document.querySelectorAll(".friend_block_v2.persona.offline"));

            let property = `esSort${sortBy === "default" ? "Default" : "Time"}`;
            curOfflineFriends.sort((a, b) => Number(a.dataset[property]) - Number(b.dataset[property]));

            for (let friend of curOfflineFriends) {
                if (reversed) {
                    offlineBlock.insertAdjacentElement("afterend", friend);
                } else {
                    offlineBlock.parentElement.appendChild(friend);
                }
            }
        }

        let sortBy = SyncedStorage.get("sortfriendsby");
        document.querySelector("#manage_friends_control").insertAdjacentElement("beforebegin", Sortbox.get(
            "friends",
            [["default", Localization.str.theworddefault], ["lastonline", Localization.str.lastonline]],
            sortBy,
            sortFriends,
            "sortfriendsby")
        );
    };

    FriendsPageClass.prototype.addFriendsInviteButton = async function() {
        let params = new URLSearchParams(window.location.search);
        if (!params.has("invitegid")) { return; }

        HTML.afterBegin("#manage_friends > div:nth-child(2)", `<span class="manage_action btnv6_lightblue_blue btn_medium" id="invitetogroup"><span>${Localization.str.invite_to_group}</span></span>`);
        ExtensionLayer.runInPageContext(groupId => {
            ToggleManageFriends();
            $J("#invitetogroup").on("click", () => {
                let friends = GetCheckedAccounts("#search_results > .selectable.selected:visible");
                InviteUserToGroup(null, groupId, friends);
            });
        }, [ params.get("invitegid") ]);
    };

    return FriendsPageClass;
})();

class GroupsPageClass {

    constructor() {
        this._groups = Array.from(document.querySelectorAll(".group_block"));
        this._initSort = true;

        this._moveSearchBar();
        this._addSort();
        this._addManageBtn();
    }

    _moveSearchBar() {
        // move the search bar to the same position as on friends page
        let container = HTML.wrap("#search_text_box", '<div class="searchBarContainer"></div>');
        document.querySelector("#search_results").insertAdjacentElement("beforebegin", container);
    }

    _addSort() {
        document.querySelector("span.profile_groups.title").insertAdjacentElement("afterend", Sortbox.get(
            "groups",
            [
                ["default", Localization.str.theworddefault],
                ["members", Localization.str.members],
                ["names", Localization.str.name]
            ],
            SyncedStorage.get("sortgroupsby"),
            (sortBy, reversed) => { this._sortGroups(sortBy, reversed) },
            "sortgroupsby")
        );

        let sortbox = document.querySelector("div.es-sortbox");
        sortbox.style.flexGrow = "2";
        sortbox.style.marginRight = "20px";
        sortbox.style.marginTop = "0";
        sortbox.style.textAlign = "right";
    }

    _getSortFunc(sortBy) {
        let property = `esSort${sortBy}`;
        switch(sortBy) {
            case "default":
                return (a, b) => Number(a.dataset[property]) - Number(b.dataset[property]);
            case "members":
                return (a, b) => Number(b.dataset[property]) - Number(a.dataset[property]);
            case "names":
                return (a, b) => a.dataset[property].localeCompare(b.dataset[property]);
        }
    }

    _sortGroups(sortBy, reversed) {
        if (this._groups.length === 0) { return; }

        if (this._initSort) {

            let i = 0;
            for (let group of this._groups) {
                let name = group.querySelector(".groupTitle > a").textContent;
                let membercount = Number(group.querySelector(".memberRow > a").textContent.match(/\d+/g).join(""));
                group.dataset.esSortdefault = i.toString();
                group.dataset.esSortnames = name;
                group.dataset.esSortmembers = membercount.toString();
                i++;
            }

            this._initSort = false;
        }

        this._groups.sort(this._getSortFunc(sortBy, `esSort${sortBy}`));

        let searchResults = document.querySelector("#search_results_empty");
        for (let group of this._groups) {
            if (reversed) {
                searchResults.insertAdjacentElement("afterend", group);
            } else {
                searchResults.parentElement.appendChild(group);
            }
        }
    }

    _addManageBtn() {
        if (this._groups.length === 0) { return; }
        if (!this._groups[0].querySelector(".actions")) { return; }

        let groupsStr = Localization.str.groups;

        HTML.beforeEnd(".title_bar", 
            `<button id="manage_friends_control" class="profile_friends manage_link btnv6_blue_hoverfade btn_medium btn_uppercase">
                <span>${groupsStr.manage_groups}</span>
            </button>`);

        HTML.afterEnd(".title_bar",
            `<div id="manage_friends" class="manage_friends_panel">
                <div class="row">${groupsStr.action_groups}
                    <span class="row">
                        <span class="dimmed">${groupsStr.select}</span>
                        <span class="selection_type" id="es_select_all">${Localization.str.all}</span>
                        <span class="selection_type" id="es_select_none">${Localization.str.none}</span>
                        <span class="selection_type" id="es_select_inverse">${Localization.str.inverse}</span>
                    </span>
                </div>
                <div class="row">
                    <span class="manage_action anage_action btnv6_lightblue_blue btn_medium btn_uppercase" id="es_leave_groups">
                        <span>${groupsStr.leave}</span>
                    </span>
                    <span id="selected_msg_err" class="selected_msg error hidden"></span>
                    <span id="selected_msg" class="selected_msg hidden">${groupsStr.selected.replace("__n__", `<span id="selected_count"></span>`)}</span>
                </div>
                <div class="row"></div>
            </div>`);

        for (let group of this._groups) {
            group.classList.add("selectable");
            HTML.afterBegin(group, 
                `<div class="indicator select_friend">
                    <input class="select_friend_checkbox" type="checkbox">
                </div>`);
            group.querySelector(".select_friend").addEventListener("click", () => {
                group.classList.toggle("selected");
                group.querySelector(".select_friend_checkbox").checked = group.classList.contains("selected");
                ExtensionLayer.runInPageContext(() => { UpdateSelection(); });
            });    
        }

        document.querySelector("#manage_friends_control").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(() => { ToggleManageFriends(); });
        });

        document.querySelector("#es_select_all").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(() => { SelectAll(); });
        });

        document.querySelector("#es_select_none").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(() => { SelectNone(); });
        });

        document.querySelector("#es_select_inverse").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(() => { SelectInverse(); });
        });

        document.querySelector("#es_leave_groups").addEventListener("click", () => this._leaveGroups());
    };

    async _leaveGroups() {
        let selected = [];

        for (let group of this._groups) {
            if (!group.classList.contains("selected")) {
                continue;
            }

            let actions = group.querySelector(".actions");
            let admin = actions.querySelector("[href*='/edit']");
            let split = actions.querySelector("[onclick*=ConfirmLeaveGroup]")
                .getAttribute("onclick").split(/'|"/);
            let id = split[1];

            if (admin) {
                let name = split[3];

                let body = Localization.str.groups.leave_admin_confirm.replace("__name__", `<a href=\\"/gid/${id}\\" target=\\"_blank\\">${name}</a>`);
                let result = await ConfirmDialog.open(Localization.str.groups.leave, body);
                let cont = (result === "OK");
                if (!cont) {
                    group.querySelector(".select_friend").click();
                    continue;
                }
            }

            selected.push([id, group]);
        }

        if (selected.length > 0) {
            let body = Localization.str.groups.leave_groups_confirm.replace("__n__", selected.length);
            let result = await ConfirmDialog.open(Localization.str.groups.leave, body);

            if (result === "OK") {
                for (let tuple of selected) {
                    let [id, group] = tuple;
                    let res = await this._leaveGroup(id).catch(err => console.error(err));

                    if (!res || !res.success) {
                        console.error("Failed to leave group " + id);
                        continue;
                    }

                    group.style.opacity = "0.3";
                    group.querySelector(".select_friend").click();
                }
            }
        }
    }

    _leaveGroup(id) {
        let formData = new FormData();
        formData.append("sessionid", User.getSessionId());
        formData.append("steamid", User.steamId);
        formData.append("ajax", 1);
        formData.append("action", "leave_group");
        formData.append("steamids[]", id);

        return RequestData.post(User.profileUrl + "/friends/action", formData, {
            withCredentials: true
        }, "json");
    }
}

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
        let country = User.country;
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
            });
        });
    };

    return MarketListingPageClass;
})();

let MarketPageClass = (function(){

    function MarketPageClass() {

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

        // TODO shouldn't this be global? Do we want to run on other pages?
        if (window.location.pathname.match(/^\/market\/$/)) {
            this.addMarketStats();
            this.minimizeActiveListings();
            this.addSort();
            this.marketPopularRefreshToggle();
            this.addLowestMarketPrice();
        }

    }

    async function loadMarketStats() {
        let { startListing, purchaseTotal, saleTotal } = LocalStorage.get("market_stats", { startListing: null, purchaseTotal: 0, saleTotal: 0 });
        let curStartListing = null;
        let transactions = new Set();
        let stop = false;

        // If startListing is missing, reset cached data to avoid inaccurate results.
        if (startListing === null && (purchaseTotal > 0 || saleTotal > 0)) {
            purchaseTotal = 0;
            saleTotal = 0;
        }

        function updatePrices(dom, start) {

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
                if (!curStartListing && start === 0) {
                    curStartListing = node.id;
                }
                // If reached cached data, then stop.
                if (node.id === startListing) {
                    stop = true;
                    break;
                }

                let priceNode = node.querySelector(".market_listing_price");
                if (!priceNode) { continue; }

                let price = Price.parseFromString(priceNode.textContent);

                if (isPurchase) {
                    purchaseTotal += price.value;
                } else {
                    saleTotal += price.value;
                }
            }

            let net = new Price(saleTotal - purchaseTotal);
            let color = "green";
            let netText = Localization.str.net_gain;
            if (net.value < 0) {
                color = "red";
                netText = Localization.str.net_spent;
            }

            let purchaseTotalPrice = new Price(purchaseTotal);
            let saleTotalPrice = new Price(saleTotal);
            HTML.inner(
                "#es_market_summary",
                `<div>${Localization.str.purchase_total} <span class='es_market_summary_item'>${purchaseTotalPrice}</span></div>
                <div>${Localization.str.sales_total} <span class='es_market_summary_item'>${saleTotalPrice}</span></div>
                <div>${netText}<span class='es_market_summary_item' style="color:${color}">${net}</span></div>`
            );
        }

        const pageSize = 500;
        let pages = -1;
        let currentPage = 0;
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
            while (pageRequests.length > 0 && !stop) {
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
            failedRequests += 1;
            console.error(err);
        }

        if (failedRequests === 0) {
            progressNode.textContent = '';
            LocalStorage.set("market_stats", { startListing: curStartListing, purchaseTotal, saleTotal });
            return true;
        }

        progressNode.textContent = Localization.str.transactionStatus.replace("__failed__", failedRequests).replace("__size__", transactions.size).replace("__total__", totalCount);
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
        HTML.inner(node, `<a class="btnv6_grey_black ico_hover btn_small_thin" id="es_market_summary_button"><span>${Localization.str.load_market_stats}</span></a>`);

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
        if (!User.isSignedIn || !SyncedStorage.get("showlowestmarketprice") || SyncedStorage.get("hideactivelistings")) { return; }

        let country = User.country;
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

            let myPrice = Price.parseFromString(node.querySelector(".market_listing_price span span").textContent);
            let lowPrice = Price.parseFromString(data['lowest_price']);

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
                        } catch(err) {
                            // Too Many Requests
                            if (err instanceof HTTPError && err.code === 429) {
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

        ExtensionLayer.runInPageContext(() => { SetupTooltips({ tooltipCSSClass: "community_tooltip" }); });

        function toggleRefresh(state) {
            document.querySelector("#es_popular_refresh_toggle").classList.toggle("es_refresh_off", !state);
            LocalStorage.set("popular_refresh", state);
            ExtensionLayer.runInPageContext(state => { g_bMarketWindowHidden = state; }, [ state ]);
        }
    };

    MarketPageClass.prototype.highlightMarketItems = async function() {
        if (!SyncedStorage.get("highlight_owned")) { return; }

        let nodes = document.querySelectorAll(".market_listing_row_link");
        for (let node of nodes) {
            let m = node.href.match(/market\/listings\/753\/(.+?)(\?|$)/);
            if (!m) { continue; }

            // todo Collect hashes and query them all at once
            if (await Inventory.hasInInventory6(decodeURIComponent(m[1]))) {
                Highlights.highlightOwned(node.querySelector("div"));
            }
        }
    };

    return MarketPageClass;
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

let WorkshopPageClass = (function(){

    function WorkshopPageClass() {
        this.loadLastState();
        this.initAjaxBrowse();
    }

    WorkshopPageClass.prototype.loadLastState = function() {
        let url = new URL(window.location.href);

        if (url.searchParams && url.searchParams.has("browsesort")) {
            LocalStorage.set("workshop_state", url.search);
            return;
        }

        let search = LocalStorage.get("workshop_state");
        url = new URL("https://steamcommunity.com/workshop/" + search);
        let query = url.searchParams.get("browsesort");
        this.changeTab(query);
    };

    WorkshopPageClass.prototype.initAjaxBrowse = function() {
        ExtensionLayer.runInPageContext(() => {
            $J(".browseOption").get().forEach(node => node.onclick = () => false);
        });

        document.querySelectorAll(".browseOption").forEach(tab => {
            tab.addEventListener("click", () => {
                let a = tab.querySelector("a[href]");
                let url = new URL("https://steamcommunity.com/workshop/" + a.href);
                let query = url.searchParams.get("browsesort");
                LocalStorage.set("workshop_state", url.search);
                window.history.pushState(null, null, url.search);
                this.changeTab(query);
            });
        });
    };

    WorkshopPageClass.prototype.changeTab = async function(query, start=0, count=8) {
        let tab = document.querySelector("." + query);
        if (tab.hasAttribute("disabled")) { return; }

        tab.setAttribute("disabled", "disabled");
        
        let image = document.querySelector(".browseOptionImage");
        tab.parentNode.insertAdjacentElement("afterbegin", image);

        document.querySelectorAll(".browseOption").forEach(tab => tab.classList.add("notSelected"));
        tab.classList.remove("notSelected");

        let container = document.querySelector("#workshop_appsRows");
        HTML.inner(container, '<div class="LoadingWrapper"><div class="LoadingThrobber" style="margin: 170px auto;"><div class="Bar Bar1"></div><div class="Bar Bar2"></div><div class="Bar Bar3"></div></div></div>');

        let url = `https://steamcommunity.com/sharedfiles/ajaxgetworkshops/render/?query=${query}&start=${start}&count=${count}`;
        let result = JSON.parse(await RequestData.getHttp(url));
        HTML.inner(container, result.results_html);
        tab.removeAttribute("disabled");

        ExtensionLayer.runInPageContext((query, totalCount, count) => {
            g_oSearchResults.m_iCurrentPage = 0;
            g_oSearchResults.m_strQuery = query;
            g_oSearchResults.m_cTotalCount = totalCount;
            g_oSearchResults.m_cPageSize = count;
            g_oSearchResults.UpdatePagingDisplay();
        }, [ query, result.total_count, count ]);
    };

    return WorkshopPageClass;
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
    if (!document.getElementById("global_header")) { return; }

    let path = window.location.pathname.replace(/\/+/g, "/");

    await SyncedStorage.init().catch(err => console.error(err));
    await Promise.all([Localization, User, Currency]);

    Common.init();
    CommentHandler.hideSpamComments();
    CommentHandler.addFavoriteEmoticons();

    switch (true) {

        case /^\/workshop\/?$/.test(path):
            (new WorkshopPageClass());
            break;

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

        case /^\/(?:id|profiles)\/.+\/groups(?:[/#?]|$)/.test(path):
            (new GroupsPageClass());
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

    AugmentedSteam.hideTrademarkSymbol(true);
})();
