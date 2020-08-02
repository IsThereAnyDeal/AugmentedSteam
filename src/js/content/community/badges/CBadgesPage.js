import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules/ASContext";

import {FBadgeCompletionCost} from "community/badges/FBadgeCompletionCost";
import {FCardExchangeLinks} from "community/common/FCardExchangeLinks";
import {FBadgeSortAndFilter} from "community/badges/FBadgeSortAndFilter";

import {HTMLParser} from "core";
import {DOMHelper, RequestData} from "common";

export class CBadgesPage extends CCommunityBase {

    constructor() {

        super([
            FBadgeCompletionCost,
            FCardExchangeLinks,
            FBadgeSortAndFilter,
        ]);

        this.type = ContextTypes.BADGES;

        this.hasMultiplePages = document.querySelector(".pagebtn") !== null;

        /*this.addBadgeSort();
        this.addBadgeFilter();
        this.addBadgeViewOptions();

        this.triggerCallbacks();*/
    }

    async eachBadgePage(callback) {
        let baseUrl = "https://steamcommunity.com/" + window.location.pathname + "?p=";

        let skip = 1;
        let m = window.location.search.match("p=(\d+)");
        if (m) {
            skip = parseInt(m[1]);
        }

        let lastPage = parseInt(DOMHelper.selectLastNode(document, ".pagelink").textContent);
        for (let p = 1; p <= lastPage; p++) { // doing one page at a time to prevent too many requests at once
            if (p === skip) { continue; }
            try {
                let response = await RequestData.getHttp(baseUrl + p);

                let dom = HTMLParser.htmlToDOM(response);
                await callback(dom);

            } catch (exception) {
                console.error("Failed to load " + baseUrl + p + ": " + exception);
                return;
            }
        }
    }
}
