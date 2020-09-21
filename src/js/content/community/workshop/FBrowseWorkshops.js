import {Feature} from "modules";

import {HTML, LocalStorage} from "core";
import {ExtensionLayer, RequestData} from "common";

export class FBrowseWorkshops extends Feature {
    
    apply() {

        let url = new URL(window.location.href);

        if (url.searchParams && url.searchParams.has("browsesort")) {
            LocalStorage.set("workshop_state", url.search);
            return;
        }

        let search = LocalStorage.get("workshop_state");
        url = new URL("https://steamcommunity.com/workshop/" + search);
        let query = url.searchParams.get("browsesort");
        this._changeTab(query);

        ExtensionLayer.runInPageContext(() => {
            $J(".browseOption").get().forEach(node => node.onclick = () => false);
        });

        document.querySelectorAll(".browseOption").forEach(tab => {
            tab.addEventListener("click", () => {
                let a = tab.querySelector("a[href]");
                let url = new URL("https://steamcommunity.com/workshop/" + a.href);
                let query = url.searchParams.get("browsesort");
                LocalStorage.set("workshop_state", url.search);
                window.history.pushState(null, null, url.search);
                this._changeTab(query);
            });
        });
    }

    async _changeTab(query, start = 0, count = 8) {
        let tab = document.querySelector(`.${query}`);
        if (tab.hasAttribute("disabled")) { return; }

        tab.setAttribute("disabled", "disabled");
        
        let image = document.querySelector(".browseOptionImage");
        tab.parentNode.insertAdjacentElement("afterbegin", image);

        document.querySelectorAll(".browseOption").forEach(tab => tab.classList.add("notSelected"));
        tab.classList.remove("notSelected");

        let container = document.querySelector("#workshop_appsRows");
        HTML.inner(container, '<div class="LoadingWrapper"><div class="LoadingThrobber" style="margin: 170px auto;"><div class="Bar Bar1"></div><div class="Bar Bar2"></div><div class="Bar Bar3"></div></div></div>');

        let url = `https://steamcommunity.com/sharedfiles/ajaxgetworkshops/render/?query=${query}&start=${start}&count=${count}`;
        let result = JSON.parse(await RequestData.getHttp(url));
        HTML.inner(container, result.results_html);
        tab.removeAttribute("disabled");

        ExtensionLayer.runInPageContext((query, totalCount, count) => {
            g_oSearchResults.m_iCurrentPage = 0;
            g_oSearchResults.m_strQuery = query;
            g_oSearchResults.m_cTotalCount = totalCount;
            g_oSearchResults.m_cPageSize = count;
            g_oSearchResults.UpdatePagingDisplay();
        }, [ query, result.total_count, count ]);
    };
}
