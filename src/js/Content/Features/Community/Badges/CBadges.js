import {HTML, HTMLParser} from "../../../../modulesCore";
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

        // Sorting by "Complete" and "Rarity" only shows completed badges, so don't calculate drops or show drop-related options
        const sort = new URLSearchParams(window.location.search).get("sort");
        this.showDropOptions = this.myProfile && sort !== "c" && sort !== "r";
    }

    // TODO Cache this somehow or apply both FBadgeDropsCount & FBadgeSortAndFilter at once when doing these requests
    async eachBadgePage(callback) {

        const url = new URL(window.location.origin + window.location.pathname);
        const params = new URLSearchParams(window.location.search);
        if (params.has("sort")) {
            url.searchParams.set("sort", params.get("sort"));
        }

        const skip = Number(params.get("p") ?? 1);
        const lastPage = Number(DOMHelper.selectLastNode(document, ".pagelink").textContent);

        for (let p = 1; p <= lastPage; p++) {
            if (p === skip) { continue; }

            url.searchParams.set("p", p);

            try {
                const response = await RequestData.getHttp(url);

                const delayedLoadImages = HTMLParser.getVariableFromText(response, "g_rgDelayedLoadImages", "object");
                const dom = HTML.toDom(response);

                await callback(dom, delayedLoadImages);

            } catch (err) {
                console.error(`Failed to request ${url.toString()}: ${err}`);
                continue;
            }
        }
    }
}
