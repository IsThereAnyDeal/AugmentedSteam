import {L} from "@Core/Localization/Localization";
import {__activate, __viewinclient,} from "@Strings/_strings";
import Settings from "@Options/Data/Settings";
import AugmentedSteamMenu from "@Content/Modules/Widgets/AugmentedSteam/AugmentedSteamMenu.svelte";
import CacheApiFacade from "@Content/Modules/Facades/CacheApiFacade";
import AugmentedSteamWarnings from "@Content/Modules/Widgets/AugmentedSteam/AugmentedSteamWarnings.svelte";
import Language from "@Core/Localization/Language";
import type UserInterface from "@Core/User/UserInterface";
import BackToTop from "@Content/Modules/Widgets/AugmentedSteam/BackToTop.svelte";
import DynamicStore from "@Content/Modules/Data/DynamicStore";
import LocalStorage from "@Core/Storage/LocalStorage";

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

        const btn = document.querySelector<HTMLAnchorElement>(this.react
            ? "header nav ~ div a[href*='/about/']"
            : "a.header_installsteam_btn"
        );
        if (!btn) {
            console.error(`Couldn't find "Install Steam" button element.`);
            return;
        }

        if (option === "hide") {
            btn.remove();
        } else if (option === "replace") {

            if (this.react) {
                btn.textContent = L(__viewinclient);
                btn.classList.add("is-react");
            } else {
                btn.querySelector("div")!.textContent = L(__viewinclient);
            }

            btn.href = `steam://openurl/${window.location.href}`;
            btn.classList.add("es_steamclient_btn");

        }
    }

    private addRedeemLink(): void {

        let node: HTMLAnchorElement|null;

        node = document.querySelector(
            this.react
                ? "header a[href*='/addfunds/']"
                : "#account_dropdown a[href*='/addfunds/']"
        );
        if (!node) {
            console.error("Didn't find node to copy for adding redeem link");
            return;
        }

        const cloned = node.cloneNode(true) as HTMLAnchorElement;
        cloned.href = "https://store.steampowered.com/account/registerkey";
        cloned.textContent = L(__activate);

        node.insertAdjacentElement("beforebegin", cloned);
    }

    async build(): Promise<void> {

        const userId = this.user.steamId ?? "0";
        const cachedUser = await LocalStorage.get("cachedUser");

        if (cachedUser !== userId) {
            console.log(`Clear cache, old: ${cachedUser}, new: ${userId}`);
            await CacheApiFacade.clearCache();
            await LocalStorage.set("cachedUser", userId);
        }

        this.addBackToTop();
        this.focusSearchBox();
        this.addMenu();
        this.addWarnings();
        this.handleInstallSteamButton();

        if (this.user.isSignedIn) {
            this.addRedeemLink();

            // TODO probably doesn't used on React pages?
            DynamicStore.invalidateCacheHandler();
        }
    }
}
