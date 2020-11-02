import {HTML} from "../Core/Html/Html";
import {ExtensionResources} from "../Core/ExtensionResources";
import {Localization} from "../Core/Localization/Localization";
import {SyncedStorage} from "../Core/Storage/SyncedStorage";
import {Language} from "../Core/Localization/Language";
import {LocalStorage} from "../Core/Storage/LocalStorage";
import {Background} from "./Background";
import {DOMHelper} from "./DOMHelper";
import {HorizontalScroller} from "./Widgets/HorizontalScroller";
import {DynamicStore} from "./Data/DynamicStore";
import {User} from "./User";
import {Page} from "../../Content/Page";

class AugmentedSteam {

    static _addMenu() {

        HTML.afterBegin("#global_action_menu",
            `<div id="es_menu">
                <span id="es_pulldown" class="pulldown global_action_link">Augmented Steam</span>
                <div id="es_popup" class="popup_block_new">
                    <div class="popup_body popup_menu">
                        <a class="popup_menu_item" target="_blank" href="${ExtensionResources.getURL("html/options.html")}">${Localization.str.thewordoptions}</a>
                        <a class="popup_menu_item" id="es_clear_cache" href="#clear_cache">${Localization.str.clear_cache}</a>
                        <div class="hr"></div>
                        <a class="popup_menu_item" target="_blank" href="https://github.com/tfedor/AugmentedSteam">${Localization.str.contribute}</a>
                        <a class="popup_menu_item" target="_blank" href="https://github.com/tfedor/AugmentedSteam/issues">${Localization.str.bug_feature}</a>
                        <div class="hr"></div>
                        <a class="popup_menu_item" target="_blank" href="https://es.isthereanydeal.com/">${Localization.str.website}</a>
                        <a class="popup_menu_item" target="_blank" href="https://isthereanydeal.com/">IsThereAnyDeal</a>
                        <a class="popup_menu_item" target="_blank" href="https://discord.gg/yn57q7f">Discord</a>
                    </div>
                </div>
            </div>`);

        const popup = document.querySelector("#es_popup");

        document.querySelector("#es_pulldown").addEventListener("click", () => {
            Page.runInPageContext(() => {
                window.SteamFacade.showMenu("es_pulldown", "es_popup", "right", "bottom", true);
            });
        });

        document.querySelector("#es_menu").addEventListener("click", (e) => {
            e.stopPropagation();
        });

        document.addEventListener("click", () => {
            popup.classList.remove("open");
        });

        document.querySelector("#es_clear_cache").addEventListener("click", e => {
            e.preventDefault();

            AugmentedSteam.clearCache();
            window.location.reload();
        });
    }

    static _addBackToTop() {
        if (!SyncedStorage.get("show_backtotop")) { return; }

        // Remove Steam's back-to-top button
        DOMHelper.remove("#BackToTop");

        const btn = document.createElement("div");
        btn.classList.add("es_btt");
        btn.textContent = "▲";
        btn.style.visibility = "hidden";

        document.body.append(btn);

        btn.addEventListener("click", () => {
            window.scroll({
                "top": 0,
                "left": 0,
                "behavior": "smooth"
            });
        });

        btn.addEventListener("transitionstart", () => {
            if (btn.style.visibility === "hidden") {
                btn.style.visibility = "visible";
            } else {

                // transition: opacity 200ms ease-in-out;
                setTimeout(() => {
                    btn.style.visibility = "hidden";
                }, 200);
            }
        });

        window.addEventListener("scroll", () => {
            btn.classList.toggle("is-visible", window.scrollY >= 400);
        });
    }

    static _bindLogout() {

        // TODO there should be a better detection of logout, probably
        const logoutNode = document.querySelector("a[href$='javascript:Logout();']");
        logoutNode.addEventListener("click", () => {
            AugmentedSteam.clearCache();
        });
    }

    static _addWarning(innerHTML, stopShowingHandler) {
        const el = HTML.element(
            `<div class="es_warn js-warn">
                <div class="es_warn__cnt">
                    <div>${innerHTML}</div>
                    <div class="es_warn__control">
                        <a class="es_warn__btn js-warn-close">${Localization.str.update.dont_show}</a>
                        <a class="es_warn__btn js-warn-hide">${Localization.str.hide}</a>
                    </div>
                </div>
            </div>`
        );

        el.querySelector(".js-warn-close").addEventListener("click", () => {
            if (stopShowingHandler) {
                stopShowingHandler();
            }
            el.closest(".js-warn").remove();
        });

        el.querySelector(".js-warn-hide").addEventListener("click", () => {
            el.closest(".js-warn").remove();
        });

        document.getElementById("global_header").insertAdjacentElement("afterend", el);
    }

    /**
     * Display warning if browsing using a different language
     */
    static _addLanguageWarning() {
        if (!SyncedStorage.get("showlanguagewarning")) { return; }

        const currentLanguage = Language.getCurrentSteamLanguage();
        if (!currentLanguage) { return; }

        if (!SyncedStorage.has("showlanguagewarninglanguage")) {
            SyncedStorage.set("showlanguagewarninglanguage", currentLanguage);
        }

        const warningLanguage = SyncedStorage.get("showlanguagewarninglanguage");

        if (currentLanguage === warningLanguage) { return; }

        Localization.loadLocalization(Language.getLanguageCode(warningLanguage)).then((strings) => {
            AugmentedSteam._addWarning(
                `${strings.using_language.replace("__current__", strings.options.lang[currentLanguage] || currentLanguage)}
                <a href="#" id="es_reset_language_code">
                ${strings.using_language_return.replace("__base__", strings.options.lang[warningLanguage] || warningLanguage)}
                </a>`,
                () => { SyncedStorage.set("showlanguagewarning", false); }
            );

            document.querySelector("#es_reset_language_code").addEventListener("click", (e) => {
                e.preventDefault();
                // eslint-disable-next-line no-undef, new-cap
                Page.runInPageContext(warningLanguage => { ChangeLanguage(warningLanguage); }, [warningLanguage]);
            });
        });
    }

    static _handleInstallSteamButton() {
        const option = SyncedStorage.get("installsteam");
        if (option === "hide") {
            DOMHelper.remove("div.header_installsteam_btn");
        } else if (option === "replace") {
            const btn = document.querySelector("div.header_installsteam_btn > a");
            btn.textContent = Localization.str.viewinclient;
            btn.href = `steam://openurl/${window.location.href}`;
            btn.classList.add("es_steamclient_btn");
        }
    }

    static _removeAboutLinks() {
        if (!SyncedStorage.get("hideaboutlinks")) { return; }

        DOMHelper.remove("#global_header a[href^='https://store.steampowered.com/about/']");
    }

    static _addUsernameSubmenuLinks() {
        const node = document.querySelector(".supernav_container .submenu_username");

        HTML.afterEnd(
            node.querySelector("a"),
            `<a class="submenuitem" href="//steamcommunity.com/my/games/">${Localization.str.games}</a>`
        );
        HTML.afterEnd(
            node.querySelector("a:nth-child(2)"),
            `<a class="submenuitem" href="//store.steampowered.com/wishlist/">${Localization.str.wishlist}</a>`
        );
        HTML.beforeEnd(
            node,
            `<a class="submenuitem" href="//steamcommunity.com/my/recommended/">${Localization.str.reviews}</a>`
        );
    }

    static _disableLinkFilter() {
        if (!SyncedStorage.get("disablelinkfilter")) { return; }

        // TODO Way too nested
        function removeLinksFilter(mutations) {
            const selector = "a.bb_link[href*='/linkfilter/'], div.weblink a[href*='/linkfilter/']";
            if (mutations) {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            node.querySelectorAll(selector).forEach(matchedNode => {
                                matchedNode.setAttribute(
                                    "href",
                                    matchedNode.getAttribute("href").replace(/^.+?\/linkfilter\/\?url=/, "")
                                );
                            });
                        }
                    });
                });
            } else {
                document.querySelectorAll(selector).forEach(node => {
                    node.setAttribute("href", node.getAttribute("href").replace(/^.+?\/linkfilter\/\?url=/, ""));
                });
            }
        }

        removeLinksFilter();

        const observer = new MutationObserver(removeLinksFilter);
        observer.observe(document, {"childList": true, "subtree": true});
    }

    static _addRedeemLink() {
        HTML.beforeBegin(
            "#account_language_pulldown",
            `<a class="popup_menu_item" href="https://store.steampowered.com/account/registerkey">${Localization.str.activate}</a>`
        );
    }

    static _replaceAccountName() {
        if (!SyncedStorage.get("replaceaccountname")) { return; }

        const accountNameNode = document.querySelector("#account_pulldown");
        const accountName = accountNameNode.textContent.trim();
        const communityName = document.querySelector("#global_header .username").textContent.trim();

        // Present on https://store.steampowered.com/account/history/
        const pageHeader = document.querySelector("h2.pageheader");
        if (pageHeader) {
            pageHeader.textContent = pageHeader.textContent.replace(accountName, communityName);
        }

        accountNameNode.textContent = communityName;

        // Don't replace title on user pages that aren't mine
        const isUserPage = /.*(id|profiles)\/.+/g.test(location.pathname);
        if (!isUserPage || location.pathname.includes(User.profilePath)) {
            document.title = document.title.replace(accountName, communityName);
        }
    }

    static _launchRandomButton() {

        HTML.beforeEnd(
            "#es_popup .popup_menu",
            `<div class="hr"></div>
             <a id="es_random_game" class="popup_menu_item" style="cursor: pointer;">${Localization.str.launch_random}</a>`
        );

        document.querySelector("#es_random_game").addEventListener("click", async() => {
            const appid = await DynamicStore.getRandomApp();
            if (!appid) { return; }

            Background.action("appdetails", appid).then(response => {
                if (!response || !response.success) { return; }
                const data = response.data;

                let gameid = appid;
                let gamename;
                if (data.fullgame) {
                    gameid = data.fullgame.appid;
                    gamename = data.fullgame.name;
                } else {
                    gamename = data.name;
                }

                Page.runInPageContext((playGameStr, gameid, visitStore) => {
                    const prompt = window.SteamFacade.showConfirmDialog(
                        playGameStr,
                        `<img src="//steamcdn-a.akamaihd.net/steam/apps/${gameid}/header.jpg">`,
                        null,
                        null,
                        visitStore
                    );

                    prompt.done(result => {
                        if (result === "OK") { window.location.assign(`steam://run/${gameid}`); }
                        if (result === "SECONDARY") { window.location.assign(`//store.steampowered.com/app/${gameid}`); }
                    });
                },
                [
                    Localization.str.play_game.replace("__gamename__", gamename.replace("'", "").trim()),
                    gameid,
                    Localization.str.visit_store,
                ]);
            });
        });
    }

    static _skipGotSteam() {
        if (!SyncedStorage.get("skip_got_steam")) { return; }

        for (const node of document.querySelectorAll("a[href^='javascript:ShowGotSteamModal']")) {
            node.href = node.href.split("'")[1];
        }
    }

    static _keepSteamSubscriberAgreementState() {
        const nodes = document.querySelectorAll("#market_sell_dialog_accept_ssa,#market_buyorder_dialog_accept_ssa,#accept_ssa");
        for (const node of nodes) {
            node.checked = SyncedStorage.get("keepssachecked");

            node.addEventListener("click", () => {
                SyncedStorage.set("keepssachecked", !SyncedStorage.get("keepssachecked"));
            });
        }
    }

    static _defaultCommunityTab() {
        const tab = SyncedStorage.get("community_default_tab");
        if (!tab) { return; }

        const links = document.querySelectorAll("a[href^='https://steamcommunity.com/app/']");
        for (const link of links) {
            if (link.classList.contains("apphub_sectionTab")) { continue; }
            if (!/^\/app\/[0-9]+\/?$/.test(link.pathname)) { continue; }
            if (!link.pathname.endsWith("/")) {
                link.pathname += "/";
            }
            link.pathname += `${tab}/`;
        }
    }

    static _horizontalScrolling() {
        if (!SyncedStorage.get("horizontalscrolling")) { return; }

        for (const node of document.querySelectorAll(".slider_ctn:not(.spotlight)")) {
            HorizontalScroller.create(
                node.parentNode.querySelector("#highlight_strip, .store_horizontal_autoslider_ctn"),
                node.querySelector(".slider_left"),
                node.querySelector(".slider_right"),
            );
        }
    }

    static addLoginWarning(type) {
        if (AugmentedSteam._loginWarningAdded || LocalStorage.get(`hide_login_warn_${type}`)) { return; }

        let host;

        if (type === "store") {
            host = "store.steampowered.com";
        } else if (type === "community") {
            host = "steamcommunity.com";
        } else {
            console.warn("Unknown login warning type %s", type);
            return;
        }

        AugmentedSteam._addWarning(
            `${Localization.str.login_warning.replace("__link__", `<a href="https://${host}/login/">${host}</a>`)}`,
            () => { LocalStorage.set(`hide_login_warn_${type}`, true); }
        );
        AugmentedSteam._loginWarningAdded = true;

        console.warn("Are you logged into %s?", host);
    }

    static clearCache() {
        localStorage.clear();
        SyncedStorage.remove("user_currency");
        SyncedStorage.remove("store_sessionid");
        Background.action("cache.clear");
    }

    static init() {
        AugmentedSteam._addBackToTop();
        AugmentedSteam._addMenu();
        AugmentedSteam._addLanguageWarning();
        AugmentedSteam._handleInstallSteamButton();
        AugmentedSteam._removeAboutLinks();
        AugmentedSteam._disableLinkFilter();
        AugmentedSteam._skipGotSteam();
        AugmentedSteam._keepSteamSubscriberAgreementState();
        AugmentedSteam._defaultCommunityTab();
        AugmentedSteam._horizontalScrolling();

        if (User.isSignedIn) {
            AugmentedSteam._addUsernameSubmenuLinks();
            AugmentedSteam._addRedeemLink();
            AugmentedSteam._replaceAccountName();
            AugmentedSteam._launchRandomButton();
            AugmentedSteam._bindLogout();
        }
    }
}

export {AugmentedSteam};
