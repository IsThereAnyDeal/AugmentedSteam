import {L} from "@Core/Localization/Localization";
import {__activate, __cart, __games, __reviews, __viewinclient, __wishlist,} from "@Strings/_strings";
import Settings from "@Options/Data/Settings";
import HTML from "@Core/Html/Html";
import AugmentedSteamMenu from "@Content/Modules/Widgets/AugmentedStaem/AugmentedSteamMenu.svelte";
import CacheApiFacade from "@Content/Modules/Facades/CacheApiFacade";
import AugmentedSteamWarnings from "@Content/Modules/Widgets/AugmentedStaem/AugmentedSteamWarnings.svelte";
import Language from "@Core/Localization/Language";
import type UserInterface from "@Core/User/UserInterface";
import BackToTop from "@Content/Modules/Widgets/AugmentedStaem/BackToTop.svelte";

export default class AugmentedSteam {

    private warningComponent: AugmentedSteamWarnings|undefined;

    private readonly language: Language;
    private readonly user: UserInterface;
    private readonly react: boolean;

    constructor(
        language: Language|null,
        user: UserInterface,
        react: boolean
    ) {
        this.language = language ?? new Language("english");
        this.user = user;
        this.react = react;
    }

    private addMenu(): void {
        const target = document.querySelector(this.react
            ? "header nav + div"
            : "#global_action_menu"
        )!;

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

        const node = document.querySelector<HTMLElement>(
            (this.react
                ? [
                    "input.Focusable" // Wishlist
                ] : [
                    "#store_nav_search_term", // Store pages
                    "input.discussionSearchText", // Community discussions
                    "#workshopSearchText", // Workshop
                    "#findItemsSearchBox", // Market
                    "input#filter_control", // Inventory
                    // TODO support dynamic pages e.g. groups/friends, Games page (React)
                ]).join(","));

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

    private addWarnings(): void {

        let target: Element;
        let anchor: Element|undefined;
        if (this.react) {
            target = document.querySelector("header ~ section")!;
            anchor = target.firstElementChild!;
        } else {
            const header = document.querySelector("#global_header")!
            target = header.parentElement!;
            anchor = header.nextElementSibling!;
        }

        new AugmentedSteamWarnings({
            target,
            anchor,
            props: {
                react: this.react,
                language: this.language
            }
        });
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
        this.addBackToTop();
        this.focusSearchBox();
        this.addMenu();
        this.addWarnings();
        /*
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
