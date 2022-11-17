import {HTML} from "../../Core/Html/Html";
import {ExtensionResources} from "../../Core/ExtensionResources";
import {Localization} from "../../Core/Localization/Localization";
import {SyncedStorage} from "../../Core/Storage/SyncedStorage";
import {Language} from "../../Core/Localization/Language";
import {LocalStorage} from "../../Core/Storage/LocalStorage";
import {Background} from "./Background";
import {DynamicStore} from "./Data/DynamicStore";
import {User} from "./User";
import {Page} from "../Features/Page";
import Config from "../../config";

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
                        <a class="popup_menu_item" target="_blank" href="https://github.com/IsThereAnyDeal/AugmentedSteam">${Localization.str.contribute}</a>
                        <a class="popup_menu_item" target="_blank" href="https://github.com/IsThereAnyDeal/AugmentedSteam/issues">${Localization.str.bug_feature}</a>
                        <div class="hr"></div>
                        <a class="popup_menu_item" target="_blank" href="${Config.PublicHost}">${Localization.str.website}</a>
                        <a class="popup_menu_item" target="_blank" href="https://isthereanydeal.com/">IsThereAnyDeal</a>
                        <a class="popup_menu_item" target="_blank" href="${Config.ITADDiscord}">Discord</a>
                    </div>
                </div>
            </div>`);

        document.querySelector("#es_pulldown").addEventListener("click", () => {
            Page.runInPageContext(() => {
                window.SteamFacade.showMenu("es_pulldown", "es_popup", "right", "bottom", true);
            });
        });

        document.querySelector("#es_menu").addEventListener("click", e => {
            e.stopPropagation();
        });

        document.querySelector("#es_popup").addEventListener("click", () => {
            Page.runInPageContext(() => {
                window.SteamFacade.hideMenu("es_pulldown", "es_popup");
            });
        });

        document.querySelector("#es_clear_cache").addEventListener("click", async e => {
            e.preventDefault();

            await AugmentedSteam.clearCache();
            window.location.reload();
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

            document.querySelector("#es_reset_language_code").addEventListener("click", e => {
                e.preventDefault();

                Page.runInPageContext(language => {
                    window.SteamFacade.changeLanguage(language);
                }, [warningLanguage]);
            });
        });
    }

    static _handleInstallSteamButton() {
        const option = SyncedStorage.get("installsteam");
        if (option === "hide") {
            document.querySelector("div.header_installsteam_btn")?.remove();
        } else if (option === "replace") {
            const btn = document.querySelector("div.header_installsteam_btn > a");
            btn.textContent = Localization.str.viewinclient;
            btn.href = `steam://openurl/${window.location.href}`;
            btn.classList.add("es_steamclient_btn");
        }
    }

    static _addUsernameSubmenuLinks() {
        // There are two menus; one for responsive (mobile) and one for "unresponsive" (desktop) design
        for (const node of document.querySelectorAll(".submenu_username")) {
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
    }

    static _cartLink() {
        // There are two menus; one for responsive (mobile) and one for "unresponsive" (desktop) design
        for (const wishlistLink of document.querySelectorAll(".submenu_store > .submenuitem[href='https://steamcommunity.com/my/wishlist/']")) {
            HTML.afterEnd(wishlistLink, `<a class="submenuitem" href="https://store.steampowered.com/cart/">${Localization.str.cart}</a>`);
        }
    }

    static _addRedeemLink() {
        HTML.beforeBegin(
            "#account_language_pulldown",
            `<a class="popup_menu_item" href="https://store.steampowered.com/account/registerkey">${Localization.str.activate}</a>`
        );
    }

    static _replaceAccountName() {
        if (!SyncedStorage.get("replaceaccountname")) { return; }

        const logoutNode = document.querySelector("#account_dropdown .persona.online");
        const accountName = logoutNode.textContent.trim();
        const communityName = document.querySelector("#account_pulldown").textContent.trim();

        logoutNode.textContent = communityName;

        // Replace page header on account related pages
        if (location.href.startsWith("https://store.steampowered.com/account")) {
            const pageHeader = document.querySelector("h2.pageheader");
            if (pageHeader) {
                pageHeader.textContent = pageHeader.textContent.replace(new RegExp(accountName, "i"), communityName);
            }
        }

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
                        `<img src="//cdn.cloudflare.steamstatic.com/steam/apps/${gameid}/header.jpg">`,
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
        return Background.action("cache.clear");
    }

    static init() {
        AugmentedSteam._addMenu();
        AugmentedSteam._addLanguageWarning();
        AugmentedSteam._handleInstallSteamButton();
        AugmentedSteam._cartLink();

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
