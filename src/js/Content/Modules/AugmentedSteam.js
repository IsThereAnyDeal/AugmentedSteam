import BackgroundSender from "@Core/BackgroundSimple";
import {L} from "@Core/Localization/Localization";
import {
    __activate,
    __bugFeature,
    __cart,
    __clearCache,
    __contribute,
    __games,
    __hide,
    __launchRandom,
    __loginWarning,
    __playGame,
    __reviews,
    __thewordoptions,
    __update_dontShow,
    __usingLanguage,
    __usingLanguageReturn,
    __viewinclient,
    __visitStore,
    __website,
    __wishlist,
} from "@Strings/_strings";
import Config from "../../config";
import {ExtensionResources, HTML, Language, Localization, LocalStorage, SyncedStorage} from "../../modulesCore";
import {Page} from "../Features/Page";
import {Background, User} from "../modulesContent";

import {DynamicStore} from "./Data/DynamicStore";

class AugmentedSteam {

    static _addMenu() {

        HTML.afterBegin("#global_action_menu",
            `<span id="es_pulldown" class="pulldown global_action_link">Augmented Steam</span>
            <div id="es_popup" class="popup_block_new">
                <div class="popup_body popup_menu">
                    <a class="popup_menu_item" target="_blank" href="${ExtensionResources.getURL("html/options.html")}">${L(__thewordoptions)}</a>
                    <a class="popup_menu_item" id="es_clear_cache" href="#clear_cache">${L(__clearCache)}</a>
                    <div class="hr"></div>
                    <a class="popup_menu_item" target="_blank" href="https://github.com/IsThereAnyDeal/AugmentedSteam">${L(__contribute)}</a>
                    <a class="popup_menu_item" target="_blank" href="https://github.com/IsThereAnyDeal/AugmentedSteam/issues">${L(__bugFeature)}</a>
                    <div class="hr"></div>
                    <a class="popup_menu_item" target="_blank" href="${Config.PublicHost}">${L(__website)}</a>
                    <a class="popup_menu_item" target="_blank" href="https://isthereanydeal.com/">IsThereAnyDeal</a>
                    <a class="popup_menu_item" target="_blank" href="${Config.ITADDiscord}">Discord</a>
                </div>
            </div>`);

        document.querySelector("#es_pulldown").addEventListener("click", () => {
            Page.runInPageContext(() => {
                window.SteamFacade.showMenu("es_pulldown", "es_popup", "right", "bottom", true);
            });
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

    static _addBackToTop() {
        if (!SyncedStorage.get("show_backtotop")) { return; }

        // Remove Steam's back-to-top button
        document.querySelector("#BackToTop")?.remove();

        const btn = document.createElement("div");
        btn.classList.add("es_btt");
        btn.textContent = "▲";

        document.body.append(btn);

        btn.addEventListener("click", () => {
            window.scroll({
                "top": 0,
                "left": 0,
                "behavior": "smooth"
            });
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
        const el = HTML.toElement(
            `<div class="es_warn js-warn">
                <div class="es_warn__cnt">
                    <div>${innerHTML}</div>
                    <div class="es_warn__control">
                        <a class="es_warn__btn js-warn-close">${L(__update_dontShow)}</a>
                        <a class="es_warn__btn js-warn-hide">${L(__hide)}</a>
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

        Localization.load(Language.getLanguageCode(warningLanguage)).then(locale => {
            const strings = locale.strings;
            AugmentedSteam._addWarning(
                `${strings[__usingLanguage].replace("__current__", strings[`options_lang_${currentLanguage}`] ?? currentLanguage)}
                <a href="#" id="es_reset_language_code">
                ${strings[__usingLanguageReturn].replace("__base__", strings[`options_lang_${warningLanguage}`] ?? warningLanguage)}
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
        if (option === "show") { return; }

        const btn = document.querySelector(".header_installsteam_btn");
        if (!btn) {
            console.error(`Couldn't find "Install Steam" button element.`);
            return;
        }

        if (option === "hide") {
            btn.remove();
        } else if (option === "replace") {
            btn.querySelector("div").textContent = L(__viewinclient);
            btn.href = `steam://openurl/${window.location.href}`;
            btn.classList.add("es_steamclient_btn");
        }
    }

    static _addUsernameSubmenuLinks() {
        // There are two menus; one for responsive (mobile) and one for "unresponsive" (desktop) design
        for (const node of document.querySelectorAll(".submenu_username")) {
            HTML.afterEnd(
                node.querySelector("a"),
                `<a class="submenuitem" href="//steamcommunity.com/my/games/">${L(__games)}</a>`
            );
            HTML.afterEnd(
                node.querySelector("a:nth-child(2)"),
                `<a class="submenuitem" href="//store.steampowered.com/wishlist/">${L(__wishlist)}</a>`
            );
            HTML.beforeEnd(
                node,
                `<a class="submenuitem" href="//steamcommunity.com/my/recommended/">${L(__reviews)}</a>`
            );
        }
    }

    static _cartLink() {
        // There are two menus; one for responsive (mobile) and one for "unresponsive" (desktop) design
        for (const wishlistLink of document.querySelectorAll(".submenu_store > .submenuitem[href='https://steamcommunity.com/my/wishlist/']")) {
            HTML.afterEnd(wishlistLink, `<a class="submenuitem" href="https://store.steampowered.com/cart/">${L(__cart)}</a>`);
        }
    }

    static _addRedeemLink() {
        HTML.beforeBegin(
            "#account_language_pulldown",
            `<a class="popup_menu_item" href="https://store.steampowered.com/account/registerkey">${L(__activate)}</a>`
        );
    }

    static _launchRandomButton() {

        HTML.beforeEnd(
            "#es_popup .popup_menu",
            `<div class="hr"></div><a id="es_random_game" class="popup_menu_item">${L(__launchRandom)}</a>`
        );

        document.querySelector("#es_random_game").addEventListener("click", async() => {
            const appid = await DynamicStore.getRandomApp();
            if (!appid) { return; }

            Background.action("appdetails", appid).then(response => {
                if (!response || !response.success) { return; }
                const data = response.data;

                const gameid = data.fullgame?.appid ?? appid;
                const gamename = data.fullgame?.name ?? data.name;

                Page.runInPageContext((playGameStr, gameid, visitStoreStr) => {
                    const prompt = window.SteamFacade.showConfirmDialog(
                        playGameStr,
                        `<img src="//cdn.cloudflare.steamstatic.com/steam/apps/${gameid}/header.jpg">`,
                        null,
                        null,
                        visitStoreStr
                    );

                    prompt.done(result => {
                        if (result === "OK") { window.location.assign(`steam://run/${gameid}`); }
                        if (result === "SECONDARY") { window.location.assign(`//store.steampowered.com/app/${gameid}`); }
                    });
                },
                [
                    L(__playGame, {gamename}),
                    gameid,
                    L(__visitStore),
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
            `${L(__loginWarning, {"link": `<a href="https://${host}/login/">${host}</a>`})}`,
            () => { LocalStorage.set(`hide_login_warn_${type}`, true); }
        );
        AugmentedSteam._loginWarningAdded = true;

        console.warn("Are you logged into %s?", host);
    }

    static clearCache() {
        return Background.action("cache.clear");
    }

    static init() {
        BackgroundSender.onError.subscribe((name, message) => {
            if (name === "LoginError") {
                AugmentedSteam.addLoginWarning(message);
            }
        });

        AugmentedSteam._addBackToTop();
        AugmentedSteam._addMenu();
        AugmentedSteam._addLanguageWarning();
        AugmentedSteam._handleInstallSteamButton();
        AugmentedSteam._cartLink();

        if (User.isSignedIn) {
            AugmentedSteam._addUsernameSubmenuLinks();
            AugmentedSteam._addRedeemLink();
            AugmentedSteam._launchRandomButton();
            AugmentedSteam._bindLogout();

            DynamicStore.invalidateCacheHandler();
        }
    }
}

export {AugmentedSteam};
