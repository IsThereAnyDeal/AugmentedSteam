import AppId from "@Core/GameId/AppId";
import type CWorkshop from "@Content/Features/Community/Workshop/CWorkshop";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";
import LocalStorage from "@Core/Storage/LocalStorage";
import RequestData from "@Content/Modules/RequestData";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class FBrowseWorkshops extends Feature<CWorkshop> {

    override async apply(): Promise<void> {

        for (const tab of document.querySelectorAll(".browseOption")) {
            const a = tab.querySelector("a");
            if (!a) {
                continue;
            }
            const href = a.href;
            a.removeAttribute("href");

            /**
             * The background image that indicates the currently selected tab is positioned before the tab div.
             * If this image is not wrapped by a relatively positioned div, it will be absolutely positioned
             * to the very left instead of being the background of the tab name.
             */
            if (tab.classList.contains("notSelected")) {
                HTML.wrap('<div style="position: relative;"></div>', tab);
            }

            const newTab = HTML.replace(tab, tab.outerHTML)!; // Sanitize click listeners

            newTab.addEventListener("click", () => {
                const url = new URL(href, "https://steamcommunity.com/workshop/");
                const query = url.searchParams.get("browsesort");
                LocalStorage.set("workshop_state", url.search);
                window.history.pushState(null, "", url.search);
                if (query) {
                    this._changeTab(query);
                }
            });
        }

        let url = new URL(window.location.href);

        if (url.searchParams.has("browsesort")) {
            LocalStorage.set("workshop_state", url.search);
        } else {
            const search = await LocalStorage.get("workshop_state") ?? "";
            if (search) {
                url = new URL(search, "https://steamcommunity.com/workshop/");
                const query = url.searchParams.get("browsesort");
                if (query) {
                    this._changeTab(query);
                }
            }
        }
    }

    private async _changeTab(query: string, start: number = 0, count: number = 8): Promise<void> {
        const tab = document.querySelector(`.${query}`);
        if (!tab || tab.hasAttribute("disabled")) { return; }

        tab.setAttribute("disabled", "disabled");

        tab.before(document.querySelector(".browseOptionImage")!);

        document.querySelectorAll(".browseOption").forEach(tab => tab.classList.add("notSelected"));
        tab.classList.remove("notSelected");

        const container = document.querySelector("#workshop_appsRows")!;
        HTML.inner(container,
            `<div class="LoadingWrapper">
                <div class="LoadingThrobber" style="margin: 170px auto;">
                    <div class="Bar Bar1"></div>
                    <div class="Bar Bar2"></div>
                    <div class="Bar Bar3"></div>
                </div>
            </div>`);

        const params = new URLSearchParams({
            query,
            start: String(start),
            count: String(count)
        });
        const result = await RequestData.getJson<{
            results_html: string,
            total_count: number
        }>(`https://steamcommunity.com/sharedfiles/ajaxgetworkshops/render/?${params}`);
        HTML.inner(container, result.results_html);

        // Restore onclick attribute
        for (const img of document.querySelectorAll<HTMLImageElement>(".appCover img")) {
            const appid = AppId.fromCDNUrl(img.src);
            img.closest(".app")!.addEventListener("click", () => {
                if (window.top) {
                    window.top.location.href = `https://steamcommunity.com/app/${appid}/workshop/`;
                }
            });
        }

        tab.removeAttribute("disabled");

        DOMHelper.insertScript("scriptlets/Community/Workshop/changeTab.js", {
            query,
            totalCount: result.total_count,
            count
        });
    }
}
