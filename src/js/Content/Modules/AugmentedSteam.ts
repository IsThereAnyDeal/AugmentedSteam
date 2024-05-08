import BackgroundSender from "@Core/BackgroundSimple";
import {L} from "@Core/Localization/Localization";
import {__activate, __cart, __games, __reviews, __viewinclient, __wishlist,} from "@Strings/_strings";
import {Language} from "../../modulesCore";
import {DynamicStore} from "./Data/DynamicStore";
import Settings from "@Options/Data/Settings";
import HTML from "@Core/Html/Html";
import AugmentedSteamMenu from "@Content/Modules/Widgets/AugmentedSteamMenu.svelte";
import CacheApiFacade from "@Content/Modules/Facades/CacheApiFacade";
import AugmentedSteamWarnings from "@Content/Modules/Widgets/AugmentedSteamWarnings.svelte";
import LocalStorage from "@Core/Storage/LocalStorage";
import User from "@Content/Modules/User";

export default class AugmentedSteam {

    private static warningComponent: AugmentedSteamWarnings;

    private static addMenu() {
        const target = document.querySelector("#global_action_menu")!;
        (new AugmentedSteamMenu({
            target,
            anchor: target.firstElementChild!
        }));
    }

    private static addBackToTop() {
        if (!Settings.show_backtotop) { return; }

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

    private static bindLogout() {

        // TODO there should be a better detection of logout, probably
        const logoutNode = document.querySelector("a[href$='javascript:Logout();']");
        if (!logoutNode) { return; }

        logoutNode.addEventListener("click", () => {
            AugmentedSteam.clearCache();
        });
    }

    private static getWarningComponent(): AugmentedSteamWarnings {

        if (!this.warningComponent) {
            const header = document.querySelector("#global_header")!;
            this.warningComponent = new AugmentedSteamWarnings({
                target: header.parentElement!,
                anchor: header.nextElementSibling!
            });
        }
        return this.warningComponent;
    }

    /**
     * Display warning if browsing using a different language
     */
    private static addLanguageWarning() {
        if (!Settings.showlanguagewarning) { return; }

        const currentLanguage = Language.getCurrentSteamLanguage();
        if (!currentLanguage) { return; }

        if (!Settings.showlanguagewarninglanguage) {
            Settings.showlanguagewarninglanguage = currentLanguage;
        }

        const warningLanguage = Settings.showlanguagewarninglanguage;
        if (currentLanguage === warningLanguage) { return; }

        this.getWarningComponent().showLanguageWarning(currentLanguage, warningLanguage);
    }

    private static async addLoginWarning(type: string) {
        if (type !== "store" && type !== "community") {
            return;
        }

        if (await LocalStorage.get(`hide_login_warn_${type}`)) {
            return;
        }

        this.getWarningComponent().showLoginWarning(type);
        console.warn("Are you logged into %s?", type);
    }

    private static handleInstallSteamButton(): void {
        const option = Settings.installsteam;
        if (option === "show") { return; }

        const btn = document.querySelector<HTMLAnchorElement>("a.header_installsteam_btn");
        if (!btn) {
            console.error(`Couldn't find "Install Steam" button element.`);
            return;
        }

        if (option === "hide") {
            btn.remove();
        } else if (option === "replace") {
            btn.querySelector("div")!.textContent = L(__viewinclient);
            btn.href = `steam://openurl/${window.location.href}`;
            btn.classList.add("es_steamclient_btn");
        }
    }

    private static addUsernameSubmenuLinks(): void {
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

    private static cartLink(): void {
        // There are two menus; one for responsive (mobile) and one for "unresponsive" (desktop) design
        for (const wishlistLink of document.querySelectorAll(".submenu_store > .submenuitem[href='https://steamcommunity.com/my/wishlist/']")) {
            HTML.afterEnd(wishlistLink, `<a class="submenuitem" href="https://store.steampowered.com/cart/">${L(__cart)}</a>`);
        }
    }

    private static addRedeemLink(): void {
        HTML.beforeBegin(
            "#account_language_pulldown",
            `<a class="popup_menu_item" href="https://store.steampowered.com/account/registerkey">${L(__activate)}</a>`
        );
    }

    static clearCache(): Promise<void> {
        return CacheApiFacade.clearCache();
    }

    static init() {
        BackgroundSender.onError.subscribe((name, message) => {
            if (name === "LoginError" && message !== null) {
                this.addLoginWarning(message);
            }
        });

        this.addBackToTop();
        this.addMenu();
        this.addLanguageWarning();
        this.handleInstallSteamButton();
        this.cartLink();

        if (User.isSignedIn) {
            this.addUsernameSubmenuLinks();
            this.addRedeemLink();
            this.bindLogout();

            DynamicStore.invalidateCacheHandler();
        }
    }
}
