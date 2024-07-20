import HTMLParser from "@Core/Html/HtmlParser";
import {
    __badgesAll,
    __badgesDrops,
    __binderView,
    __cardsRemain,
    __dropsValue,
    __mostDrops,
    __show,
    __theworddefault,
    __view,
} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Feature from "@Content/Modules/Context/Feature";
import type CBadges from "@Content/Features/Community/Badges/CBadges";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import DOMHelper from "@Content/Modules/DOMHelper";
import HTML from "@Core/Html/Html";

// TODO this whole feature needs a proper big refactor - good start would be to split things out to components

export default class FBadgeSortAndFilter extends Feature<CBadges> {

    // @ts-ignore
    private _header: HTMLElement;
    private _hasAllPagesLoaded: boolean = false;

    override apply(): void {

        this._header = document.querySelector<HTMLElement>(".profile_badges_header")!;
        this._header.classList.add("as_flyout_menus");

        this._addSort();
        this._addFilter();
        this._addViewOptions();

        SteamFacade.bindAutoFlyoutEvents();
    }

    private _addSort() {
        const isOwnProfile = this.context.myProfile;
        const sortOptions = this._header.querySelector<HTMLElement>(".profile_badges_sortoptions");
        if (!sortOptions) {
            return;
        }

        // Build popup menu for Steam's sort options + our options
        let html = "";
        for (const node of sortOptions.querySelectorAll("a")) {
            const sort = new URL(node.href).searchParams.get("sort");
            html += `<a class="popup_menu_item" href="?sort=${sort}">${node.textContent!.trim()}</a>`;
        }
        if (isOwnProfile) {
            html += `<a class="popup_menu_item" id="es_badge_sort_drops">${L(__mostDrops)}</a>`;
            html += `<a class="popup_menu_item" id="es_badge_sort_value">${L(__dropsValue)}</a>`;
            html += `<a class="popup_menu_item" id="es_badge_sort_remain">${L(__cardsRemain)}</a>`;
        }

        const activeText = sortOptions.querySelector(".active")!.textContent!.trim();

        HTML.afterEnd(sortOptions.querySelector("span"),
            `<div class="store_nav">
                <div class="tab flyout_tab" data-flyout="es_sort_flyout" data-flyout-align="right" data-flyout-valign="bottom">
                    <span class="pulldown">
                        <div id="es_sort_active">${activeText}</div>
                        <span></span>
                    </span>
                </div>
            </div>
            <div id="es_sort_flyout" class="popup_block_new flyout_tab_flyout responsive_slidedown">
                <div class="popup_body popup_menu">${html}</div>
            </div>`);

        if (isOwnProfile) {
            document.querySelector("#es_badge_sort_drops")!
                .addEventListener("click", () => this._sortBadgeRows("drops"));

            document.querySelector("#es_badge_sort_value")!
                .addEventListener("click", () => this._sortBadgeRows("value"));

            document.querySelector("#es_badge_sort_remain")!
                .addEventListener("click", () => this._sortBadgeRows("remain"));
        }
    }

    private async _sortBadgeRows(sortBy: string): Promise<void> {
        if (this.context.hasMultiplePages) {
            await this._loadAllPages();
        }

        const sheetNode = document.querySelector<HTMLElement>(".badges_sheet");
        if (!sheetNode) {
            return;
        }

        // Remove script tags that'll get in the way of associating rows with their scroll elements
        for (const script of sheetNode.querySelectorAll(":scope > script")) {
            script.remove();
        }

        let nodeValue: (node: HTMLElement) => number;
        let activeText: string;
        if (sortBy === "drops") {
            activeText = L(__mostDrops);

            nodeValue = (node: HTMLElement) => {
                const dropCount = node.querySelector(".progress_info_bold");
                if (!dropCount) { return 0; }

                const drops = dropCount.textContent!.match(/\d+/);
                if (!drops) { return 0; }

                return Number(drops[0]);
            }
        } else if (sortBy === "value") {
            activeText = L(__dropsValue);

            nodeValue = (node: HTMLElement) => {
                const dropWorth = node.querySelector<HTMLElement>("[data-es-card-worth]");
                return parseFloat(dropWorth?.dataset.esCardWorth ?? "0");
            };
        } else if (sortBy === "remain") {
            activeText = L(__cardsRemain);

            nodeValue = (node: HTMLElement) => {
                const infoNode = node.querySelector<HTMLElement>(".badge_progress_info");
                if (!infoNode) { return Infinity; }

                const info = infoNode.textContent!.match(/\d+/g);
                if (!info || info.length !== 2) { return Infinity; }

                const [collected, total] = info.map(Number);

                // Total comes before collected in some locales
                return Math.abs((total ?? 0) - (collected ?? 0));
            };
        } else {
            throw new Error();
        }

        const badgeRows: [[Element, HTMLElement], number][] = [];
        for (const node of sheetNode.querySelectorAll<HTMLElement>(".badge_row")) {
            const scrollEl = node.previousElementSibling;
            if (!scrollEl || !scrollEl.id.startsWith("image_group_")) { continue; }

            badgeRows.push([[scrollEl, node], nodeValue(node)]);
        }

        badgeRows.sort(sortBy === "remain"
            ? (a, b) => a[1] - b[1]
            : (a, b) => b[1] - a[1]);

        for (const row of badgeRows) {
            sheetNode.append(...row[0]);
        }

        document.querySelector<HTMLElement>("#es_sort_active")!.textContent = activeText;
        document.querySelector<HTMLElement>("#es_sort_flyout")!.style.display = "none";

        this._recalcLazyLoaderOffset();
    }

    private _addFilter(): void {
        if (!this.context.myProfile) { return; }

        HTML.afterBegin(this._header,
            `<div class="es_badge_filter">
                <span>${L(__show)}</span>
                <div class="store_nav">
                    <div class="tab flyout_tab" data-flyout="es_filter_flyout" data-flyout-align="right" data-flyout-valign="bottom">
                        <span class="pulldown">
                            <div id="es_filter_active">${L(__badgesAll)}</div>
                            <span></span>
                        </span>
                    </div>
                </div>
                <div class="popup_block_new flyout_tab_flyout responsive_slidedown" id="es_filter_flyout">
                    <div class="popup_body popup_menu">
                        <a class="popup_menu_item es_bg_filter" id="es_badge_all">${L(__badgesAll)}</a>
                        <a class="popup_menu_item es_bg_filter" id="es_badge_drops">${L(__badgesDrops)}</a>
                    </div>
                </div>
            </div>`);

        document.querySelector("#es_badge_all")!.addEventListener("click", () => {
            for (const node of document.querySelectorAll<HTMLElement>(".badge_row")) {
                node.style.display = "block";
            }

            document.querySelector("#es_filter_active")!.textContent = L(__badgesAll);
            document.querySelector<HTMLElement>("#es_filter_flyout")!.style.display = "none";

            this._recalcLazyLoaderOffset();
        });

        document.querySelector("#es_badge_drops")!.addEventListener("click", async e => {
            e.preventDefault();

            if (this.context.hasMultiplePages) {
                await this._loadAllPages();
            }

            for (const node of document.querySelectorAll<HTMLElement>(".badge_row")) {
                const stats = node.querySelector<HTMLElement>(".progress_info_bold");
                if (!stats || !/\d+/.test(stats.textContent!)) {
                    node.style.display = "none";
                } else if (node.querySelector(".badge_info_unlocked") && !node.querySelector(".badge_current")) {
                    node.style.display = "none";
                }
            }

            document.querySelector<HTMLElement>("#es_filter_active")!.textContent = L(__badgesDrops);
            document.querySelector<HTMLElement>("#es_filter_flyout")!.style.display = "none";

            this._recalcLazyLoaderOffset();
        });
    }

    private _addViewOptions(): void {

        HTML.afterBegin(this._header,
            `<div class="es_badge_view">
                <span>${L(__view)}</span>
                <div class="store_nav">
                    <div class="tab flyout_tab" data-flyout="es_badgeview_flyout" data-flyout-align="right" data-flyout-valign="bottom">
                        <span class="pulldown">
                            <div id="es_badgeview_active">${L(__theworddefault)}</div>
                            <span></span>
                        </span>
                    </div>
                </div>
                <div class="popup_block_new flyout_tab_flyout responsive_slidedown" id="es_badgeview_flyout">
                    <div class="popup_body popup_menu">
                        <a class="popup_menu_item es_bg_view" data-view="defaultview">${L(__theworddefault)}</a>
                        <a class="popup_menu_item es_bg_view" data-view="binderview">${L(__binderView)}</a>
                    </div>
                </div>
            </div>`);

        // Change hash when selecting view
        document.querySelector("#es_badgeview_flyout")!.addEventListener("click", e => {
            const target = e.target;
            if (!target) { return; }

            const node = (<HTMLElement>target).closest<HTMLElement>(".es_bg_view");
            if (!node) { return; }
            window.location.hash = node.dataset.view ?? "";

            const currentTarget = e.currentTarget;
            if (currentTarget) {
                (<HTMLElement>currentTarget).style.display = "none"; // Hide popup
            }
        });

        // Monitor for hash changes
        window.addEventListener("hashchange", () => { this._toggleBinderView(); });

        this._toggleBinderView();
    }

    private async _loadAllPages(): Promise<void> {
        if (this._hasAllPagesLoaded) {
            return;
        }
        this._hasAllPagesLoaded = true;

        const sheetNode = document.querySelector(".badges_sheet");
        if (!sheetNode) {
            return;
        }

        let images = HTMLParser.getObjectVariable("g_rgDelayedLoadImages") ?? {};

        for await (let [dom, delayedLoadImages] of this.context.eachBadgePage()) {
            sheetNode.append(...(dom.querySelector(".badges_sheet")?.children ?? []));
            images = Object.assign(images, delayedLoadImages ?? {});

            this.context.triggerPageUpdatedEvent();
        }

        for (const node of document.querySelectorAll<HTMLElement>(".profile_paging")) {
            node.style.display = "none";
        }

        DOMHelper.insertScript("scriptlets/Community/Badges/loadImages.js", {images});
    }


    private _recalcLazyLoaderOffset() {
        DOMHelper.insertScript("scriptlets/Community/Badges/recalcLazyLoaderOffset.js");
    }

    private _toggleBinderView(): void {
        const mainNode = document.querySelector("div.maincontent")!;
        const isBinderView = window.location.hash === "#binderview";

        mainNode.classList.toggle("es_binder_view", isBinderView);

        if (isBinderView) {
            // Don't attempt changes again if already loaded
            if (!mainNode.classList.contains("es_binder_loaded")) {
                mainNode.classList.add("es_binder_loaded");

                this._loadBinderView();
            }

            // Triggers the loading of out-of-view badge images
            window.dispatchEvent(new Event("resize"));
        }

        // Add / Remove hash from pagination links
        for (const node of document.querySelectorAll<HTMLAnchorElement>("div.pageLinks a.pagelink, div.pageLinks a.pagebtn")) {
            node.href = isBinderView ? `${node.href}#binderview` : node.href.replace("#binderview", "");
        }

        document.querySelector("#es_badgeview_active")!.textContent = L(isBinderView ? __binderView : __theworddefault);
    }

    private _loadBinderView(): void {
        for (const node of document.querySelectorAll(".badge_row")) {
            const stats = node.querySelector<HTMLElement>(".progress_info_bold");
            if (stats && /\d+/.test(stats.textContent ?? "")) {
                HTML.beforeEnd(
                    node.querySelector(".badge_content"),
                    `<span class="es_game_stats">${stats.innerHTML}</span>`
                );
            }

            const infoNode = node.querySelector<HTMLElement>(".badge_progress_info");
            if (!infoNode) { continue; }

            const card = infoNode.textContent?.match(/(\d+)\D*(\d+)/);
            if (!card) { continue; }

            HTML.beforeBegin(infoNode, `<div class="es_badge_progress_info">${card[1]} / ${card[2]}</div>`);
        }
    }
}
