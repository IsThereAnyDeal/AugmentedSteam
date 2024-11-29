import HTML from "@Core/Html/Html";
import HTMLParser from "@Core/Html/HtmlParser";
import CCommunityBase from "../CCommunityBase";
import FCardExchangeLinks from "../FCardExchangeLinks";
import FBadgeSortAndFilter from "./FBadgeSortAndFilter";
import FBadgeCalculations from "./FBadgeCalculations";
import ContextType from "@Content/Modules/Context/ContextType";
import CommunityUtils from "@Content/Modules/Community/CommunityUtils";
import DOMHelper from "@Content/Modules/DOMHelper";
import RequestData from "@Content/Modules/RequestData";
import type {ContextParams} from "@Content/Modules/Context/Context";

export default class CBadges extends CCommunityBase {

    public readonly appid = null;
    public readonly myProfile: boolean;
    public readonly hasMultiplePages: boolean;

    constructor(params: ContextParams) {

        super(params, ContextType.BADGES, [
            FCardExchangeLinks,
            FBadgeSortAndFilter,
            FBadgeCalculations,
        ]);

        this.myProfile = CommunityUtils.userIsOwner(this.user);
        this.hasMultiplePages = document.querySelector(".profile_paging") !== null;
    }

    triggerPageUpdatedEvent(): void {
        document.dispatchEvent(new CustomEvent("as_pageUpdated"));
    }

    async *eachBadgePage(): AsyncGenerator<[DocumentFragment, Record<string, any>|null]> {

        const url = new URL(window.location.origin + window.location.pathname);
        const params = new URLSearchParams(window.location.search);
        const sort = params.get("sort");
        if (sort) {
            url.searchParams.set("sort", sort);
        }

        const skip = Number(params.get("p") ?? 1);
        const lastPageNode = DOMHelper.selectLastNode(document, ".pagelink");
        if (!lastPageNode) {
            console.error("Couldn't find .pagelink");
            return;
        }
        const lastPage = Number(lastPageNode.textContent);

        for (let p = 1; p <= lastPage; p++) {
            if (p === skip) { continue; }

            url.searchParams.set("p", String(p));

            try {
                const response = await RequestData.getText(url);

                const delayedLoadImages = HTMLParser.getObjectVariable("g_rgDelayedLoadImages", response);
                const dom = HTML.toDom(response);

                yield [dom, delayedLoadImages];
            } catch (err) {
                console.error(`Failed to request ${url.toString()}: ${err}`);
            }
        }
    }
}
