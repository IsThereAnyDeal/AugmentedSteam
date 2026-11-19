import Feature from "@Content/Modules/Context/Feature";
import type CBadges from "@Content/Features/Community/Badges/CBadges";
import HTML from "@Core/Html/Html";
import {mount} from "svelte";
import BadgeSort from "@Content/Features/Community/Badges/Components/BadgeSort.svelte";
import BadgeFilter from "@Content/Features/Community/Badges/Components/BadgeFilter.svelte";
import BadgeViewOptions from "@Content/Features/Community/Badges/Components/BadgeViewOptions.svelte";
import "./FBadgeSortAndFilter.css";

export default class FBadgeSortAndFilter extends Feature<CBadges> {
    // @ts-ignore

    #header: HTMLElement;
    #hasAllPagesLoaded: boolean = false;

    #binderLoaded: boolean = false;

    override async isEnabled(): Promise<boolean> {
        // FIXME settings
        return true;
    }

    override async apply(): Promise<string|null> {
        this.#header = document.querySelector<HTMLElement>(".profile_badges_header")!;

        this.#addSort();
        this.#addFilter();
        this.#addViewOptions();
        return null;
    }

    #addSort(): void {
        const isOwnProfile = this.context.myProfile;
        const sortOptions = this.#header.querySelector<HTMLElement>(".profile_badges_sortoptions");
        if (!sortOptions) {
            return;
        }
        sortOptions.style.display = "none";

        const native: Array<[string, string]> = [];
        for (const node of sortOptions.querySelectorAll("a")) {
            const sort = new URL(node.href).searchParams.get("sort");
            if (sort) {
                native.push([sort, node.textContent!.trim()]);
            }
        }

        const activeText = sortOptions.querySelector(".active")!.textContent!.trim();

        mount(BadgeSort, {
            target: this.#header,
            anchor: this.#header.firstElementChild ?? undefined,
            props: {
                isOwnProfile,
                native,
                activeText,
                ondrops: () => this.#sortBadgeRows(-1, (node: HTMLElement) => {
                    const dropCount = node.querySelector(".progress_info_bold");
                    if (!dropCount) { return 0; }

                    const drops = dropCount.textContent!.match(/\d+/);
                    if (!drops) { return 0; }

                    return Number(drops[0]);
                }),
                onremain: () => this.#sortBadgeRows(1, (node: HTMLElement) => {
                    const infoNode = node.querySelector<HTMLElement>(".badge_progress_info");
                    if (!infoNode) { return Infinity; }

                    const info = infoNode.textContent!.match(/\d+/g);
                    if (!info || info.length !== 2) { return Infinity; }
                    const [collected, total] = info.map(Number);

                    // Total comes before collected in some locales
                    return Math.abs((total ?? 0) - (collected ?? 0));
                })
            }
        });
    }

    async #sortBadgeRows(direction: -1|1, nodeValue: (node: HTMLElement) => number): Promise<void> {
        const sheetNode = document.querySelector<HTMLElement>(".badges_sheet");
        if (!sheetNode) {
            return;
        }

        if (this.context.hasMultiplePages) {
            await this.#loadAllPages();
        }

        // Remove script tags that'll get in the way of associating rows with their scroll elements
        for (const script of sheetNode.querySelectorAll(":scope > script")) {
            script.remove();
        }

        const badgeRows: [HTMLElement, number][] = [];
        for (const node of sheetNode.querySelectorAll<HTMLElement>(".badge_row")) {
            badgeRows.push([node, nodeValue(node)]);
        }

        badgeRows.sort(direction > 0
            ? (a, b) => a[1] - b[1]
            : (a, b) => b[1] - a[1]);

        for (const row of badgeRows) {
            sheetNode.append(row[0]);
        }
    }

    #addFilter(): void {
        if (!this.context.myProfile) { return; }

        mount(BadgeFilter, {
            target: this.#header,
            anchor: this.#header.firstElementChild ?? undefined,
            props: {
                onall: () => {
                    for (const node of document.querySelectorAll<HTMLElement>(".badge_row")) {
                        node.style.display = "";
                    }
                },
                ondrops: async () => {
                    if (this.context.hasMultiplePages) {
                        await this.#loadAllPages();
                    }

                    for (const node of document.querySelectorAll<HTMLElement>(".badge_row")) {
                        const stats = node.querySelector<HTMLElement>(".progress_info_bold");
                        if (!stats || !/\d+/.test(stats.textContent!)) {
                            node.style.display = "none";
                        } else if (node.querySelector(".badge_info_unlocked") && !node.querySelector(".badge_current")) {
                            node.style.display = "none";
                        }
                    }
                }
            }
        });
    }

    #addViewOptions(): void {
        mount(BadgeViewOptions, {
            target: this.#header,
            anchor: this.#header.firstElementChild ?? undefined,
            props: {
                ondefault: () => window.location.hash = "",
                onbinder: () => window.location.hash = "binderview"
            }
        });

        window.addEventListener("hashchange", () => { this.#toggleBinderView(); });
        this.#toggleBinderView();
    }

    async #loadAllPages(): Promise<void> {
        if (this.#hasAllPagesLoaded) {
            return;
        }
        this.#hasAllPagesLoaded = true;

        const sheetNode = document.querySelector(".badges_sheet");
        if (!sheetNode) {
            return;
        }

        for await (const dom of this.context.eachBadgePage()) {
            sheetNode.append(...(dom.querySelector(".badges_sheet")?.children ?? []));
            this.context.triggerPageUpdatedEvent();
        }

        for (const node of document.querySelectorAll<HTMLElement>(".profile_paging")) {
            node.style.display = "none";
            this.context.hasMultiplePages = false;
        }

        const nodes = sheetNode.querySelectorAll<HTMLImageElement>("[data-delayed-image]");
        for (const img of nodes) {
            img.loading = "lazy";
            img.src = img.dataset.delayedImage!;
        }
    }

    #toggleBinderView(): void {
        const mainNode = document.querySelector("div.maincontent")!;
        const isBinderView = window.location.hash === "#binderview";

        mainNode.classList.toggle("as_binder_view", isBinderView);

        if (isBinderView) {
            // Don't attempt changes again if already loaded
            if (!this.#binderLoaded) {
                this.#binderLoaded = true;

                for (const node of document.querySelectorAll(".badge_row")) {
                    const stats = node.querySelector<HTMLElement>(".progress_info_bold");
                    if (stats && /\d+/.test(stats.textContent ?? "")) {
                        HTML.beforeEnd(
                            node.querySelector(".badge_content"),
                            `<span class="as_game_stats">${stats.innerHTML}</span>`
                        );
                    }

                    const infoNode = node.querySelector<HTMLElement>(".badge_progress_info");
                    if (!infoNode) { continue; }

                    const card = infoNode.textContent?.match(/(\d+)\D*(\d+)/);
                    if (!card) { continue; }

                    HTML.beforeBegin(infoNode, `<div class="as_badge_progress_info">${card[1]} / ${card[2]}</div>`);
                }
            }

            // Triggers the loading of out-of-view badge images
            window.dispatchEvent(new Event("resize"));
        }

        // Add / Remove hash from pagination links
        for (const node of document.querySelectorAll<HTMLAnchorElement>("div.pageLinks a.pagelink, div.pageLinks a.pagebtn")) {
            node.href = isBinderView
                ? `${node.href}#binderview`
                : node.href.replace("#binderview", "");
        }
    }
}
