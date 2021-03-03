import {HTMLParser} from "../../../../Core/Html/HtmlParser";
import {CommunityUtils, ContextType, DOMHelper, RequestData} from "../../../modulesContent";
import {CCommunityBase} from "../CCommunityBase";
import FCardExchangeLinks from "../FCardExchangeLinks";
import FBadgeSortAndFilter from "./FBadgeSortAndFilter";
import FBadgeCalculations from "./FBadgeCalculations";

export class CBadges extends CCommunityBase {

    constructor() {

        super(ContextType.BADGES, [
            FCardExchangeLinks,
            FBadgeSortAndFilter,
            FBadgeCalculations,
        ]);

        this.myProfile = CommunityUtils.currentUserIsOwner();
        this.hasMultiplePages = document.querySelector(".profile_paging") !== null;
    }

    // TODO Cache this somehow or apply both FBadgeDropsCount & FBadgeSortAndFilter at once when doing these requests
    async eachBadgePage(callback) {

        const url = new URL(window.location.origin + window.location.pathname);
        const skip = parseInt(new URLSearchParams(window.location.search).get("p")) || 1;
        const lastPage = parseInt(DOMHelper.selectLastNode(document, ".pagelink").textContent);

        for (let p = 1; p <= lastPage; p++) { // doing one page at a time to prevent too many requests at once
            if (p === skip) { continue; }

            url.searchParams.set("p", p);

            try {
                const response = await RequestData.getHttp(url.toString());

                const delayedLoadImages = HTMLParser.getVariableFromText(response, "g_rgDelayedLoadImages", "object");
                const dom = HTMLParser.htmlToDOM(response);

                await callback(dom, delayedLoadImages);

            } catch (err) {
                console.error(`Failed to request ${url.toString()}: ${err}`);
                continue;
            }
        }
    }
}
