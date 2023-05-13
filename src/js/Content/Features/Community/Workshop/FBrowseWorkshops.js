import {GameId, HTML, LocalStorage} from "../../../../modulesCore";
import {Feature, RequestData} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FBrowseWorkshops extends Feature {

    apply() {

        for (const tab of document.querySelectorAll(".browseOption")) {
            const a = tab.querySelector("a");
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

            const newTab = HTML.replace(tab, tab.outerHTML); // Sanitize click listeners

            newTab.addEventListener("click", () => {
                const url = new URL(href, "https://steamcommunity.com/workshop/");
                const query = url.searchParams.get("browsesort");
                LocalStorage.set("workshop_state", url.search);
                window.history.pushState(null, null, url.search);
                this._changeTab(query);
            });
        }

        let url = new URL(window.location.href);

        if (url.searchParams.has("browsesort")) {
            LocalStorage.set("workshop_state", url.search);
        } else {
            const search = LocalStorage.get("workshop_state");
            if (search) {
                url = new URL(search, "https://steamcommunity.com/workshop/");
                const query = url.searchParams.get("browsesort");
                this._changeTab(query);
            }
        }
    }

    async _changeTab(query, start = 0, count = 8) {
        const tab = document.querySelector(`.${query}`);
        if (tab.hasAttribute("disabled")) { return; }

        tab.setAttribute("disabled", "disabled");

        tab.before(document.querySelector(".browseOptionImage"));

        document.querySelectorAll(".browseOption").forEach(tab => tab.classList.add("notSelected"));
        tab.classList.remove("notSelected");

        const container = document.querySelector("#workshop_appsRows");
        HTML.inner(container,
            `<div class="LoadingWrapper">
                <div class="LoadingThrobber" style="margin: 170px auto;">
                    <div class="Bar Bar1"></div>
                    <div class="Bar Bar2"></div>
                    <div class="Bar Bar3"></div>
                </div>
            </div>`);

        const url = `https://steamcommunity.com/sharedfiles/ajaxgetworkshops/render/?query=${query}&start=${start}&count=${count}`;
        const result = JSON.parse(await RequestData.getHttp(url));
        HTML.inner(container, result.results_html);

        // Restore onclick attribute
        for (const img of document.querySelectorAll(".appCover img")) {
            const appid = GameId.getAppidImgSrc(img.src);
            img.closest(".app").addEventListener("click", () => {
                top.location.href = `https://steamcommunity.com/app/${appid}/workshop/`;
            });
        }

        tab.removeAttribute("disabled");

        Page.runInPageContext((query, totalCount, count) => {
            /* eslint-disable camelcase, no-undef, new-cap */
            g_oSearchResults.m_iCurrentPage = 0;
            g_oSearchResults.m_strQuery = query;
            g_oSearchResults.m_cTotalCount = totalCount;
            g_oSearchResults.m_cPageSize = count;
            g_oSearchResults.UpdatePagingDisplay();
            /* eslint-enable camelcase, no-undef, new-cap */
        }, [query, result.total_count, count]);
    }
}
