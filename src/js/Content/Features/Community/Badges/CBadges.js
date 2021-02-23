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
        const baseUrl = `https://steamcommunity.com/${window.location.pathname}?p=`;

        const skip = parseInt(new URL(window.location.href).searchParams.get("p")) || 1;

        const lastPage = parseInt(DOMHelper.selectLastNode(document, "a.pagelink").textContent);
        for (let p = 1; p <= lastPage; p++) { // doing one page at a time to prevent too many requests at once
            if (p === skip) { continue; }
            try {
                const response = await RequestData.getHttp(baseUrl + p);

                const dom = HTMLParser.htmlToDOM(response);
                await callback(dom);

            } catch (err) {
                console.error(`Failed to load ${baseUrl}${p}: ${err}`);
                return;
            }
        }
    }
}
