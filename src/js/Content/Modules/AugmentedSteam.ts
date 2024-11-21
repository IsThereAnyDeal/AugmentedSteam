import Localization, {L} from "@Core/Localization/Localization";
import {__activate, __cart, __games, __reviews, __viewinclient, __wishlist,} from "@Strings/_strings";
import Settings from "@Options/Data/Settings";
import HTML from "@Core/Html/Html";
import AugmentedSteamMenu from "@Content/Modules/Widgets/AugmentedStaem/AugmentedSteamMenu.svelte";
import CacheApiFacade from "@Content/Modules/Facades/CacheApiFacade";
import AugmentedSteamWarnings from "@Content/Modules/Widgets/AugmentedStaem/AugmentedSteamWarnings.svelte";
import LocalStorage from "@Core/Storage/LocalStorage";
import Language from "@Core/Localization/Language";
import type UserInterface from "@Core/User/UserInterface";
import BackToTop from "@Content/Modules/Widgets/AugmentedStaem/BackToTop.svelte";

export default class AugmentedSteam {

    private warningComponent: AugmentedSteamWarnings|undefined;

    private readonly language: string;
    private readonly user: UserInterface;
    private readonly react: boolean;

    constructor(
        language: Language|null,
        user: UserInterface,
        react: boolean
    ) {
        this.language = language?.name ?? "english";
        this.user = user;
        this.react = react;
    }

    private addMenu(): void {
        const target = document.querySelector("#global_action_menu")!;
        (new AugmentedSteamMenu({
            target,
            anchor: target.firstElementChild!,
            props: {
                user: this.user
            }
        }));
    }

    private addBackToTop(): void {
        if (!Settings.show_backtotop) { return; }

        const scrollTarget = this.react
            ? document.querySelector<HTMLElement>("#StoreTemplate")
            : null;

        (new BackToTop({
            target: document.body,
            props: {
                target: scrollTarget ?? undefined
            }
        }))
    }

    private focusSearchBox() {

        const node = document.querySelector<HTMLElement>([
            "#store_nav_search_term", // Store pages
            "input.discussionSearchText", // Community discussions
            "#wishlist_search", // Wishlist
            "#workshopSearchText", // Workshop
            "#findItemsSearchBox", // Market
            "input#filter_control", // Inventory
            // TODO support dynamic pages e.g. groups/friends, Games page (React)
        ].join(","));

        if (!node) { return; }

        function isContentEditable(el: Element): boolean {
            return el.tagName === "INPUT"
                || el.tagName === "TEXTAREA"
                || (el instanceof HTMLElement && el.isContentEditable);
        }

        document.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key !== "s" || e.ctrlKey || e.repeat) { return; }

            let el = document.activeElement;
            if (el && isContentEditable(el)) { return; }

            // Check if active element is within a shadow root, see #1623
            el = el?.shadowRoot?.activeElement ?? null;
            if (el && isContentEditable(el)) { return; }

            e.preventDefault();
            node.focus();
        });
    }

    private bindLogout() {

        // TODO there should be a better detection of logout, probably
        const logoutNode = document.querySelector("a[href$='javascript:Logout();']");
        if (!logoutNode) { return; }

        logoutNode.addEventListener("click", () => {
            CacheApiFacade.clearCache();
        });
    }

    private getWarningComponent(): AugmentedSteamWarnings {

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
    private async addLanguageWarning() {
        if (!Settings.showlanguagewarning) { return; }

        if (!Settings.showlanguagewarninglanguage) {
            Settings.showlanguagewarninglanguage = this.language;
        }

        const warningLanguage = Settings.showlanguagewarninglanguage;
        if (this.language === warningLanguage) { return; }

        let locale = await Localization.load((new Language(warningLanguage)).code ?? "en");
        const strings = locale.strings;

        this.getWarningComponent()
            .showLanguageWarning(strings, this.language, warningLanguage);
    }

    private async addLoginWarning(type: string) {
        if (type !== "store" && type !== "community") {
            return;
        }

        if (await LocalStorage.get(`hide_login_warn_${type}`)) {
            return;
        }

        this.getWarningComponent().showLoginWarning(type);
        console.warn("Are you logged into %s?", type);
    }

    private handleInstallSteamButton(): void {
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

    private addUsernameSubmenuLinks(): void {
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

    private cartLink(): void {
        // There are two menus; one for responsive (mobile) and one for "unresponsive" (desktop) design
        for (const wishlistLink of document.querySelectorAll(".submenu_store > .submenuitem[href='https://steamcommunity.com/my/wishlist/']")) {
            HTML.afterEnd(wishlistLink, `<a class="submenuitem" href="https://store.steampowered.com/cart/">${L(__cart)}</a>`);
        }
    }

    private addRedeemLink(): void {
        HTML.beforeBegin(
            "#account_language_pulldown",
            `<a class="popup_menu_item" href="https://store.steampowered.com/account/registerkey">${L(__activate)}</a>`
        );
    }

    build(): void {
        document.addEventListener("asRequestError", e => {
            const {detail} = e as CustomEvent;
            const name = detail.name ?? null;
            const message = detail.message ?? null;

            if (name === "LoginError" && message !== null) {
                this.addLoginWarning(message);
            }
        })

        this.addBackToTop();
        /*
        this.focusSearchBox();
        this.addMenu();
        this.addLanguageWarning();
        this.handleInstallSteamButton();
        this.cartLink();

        if (this.user.isSignedIn) {
            this.addUsernameSubmenuLinks();
            this.addRedeemLink();
            this.bindLogout();

            DynamicStore.invalidateCacheHandler();
        }
         */
    }
}
