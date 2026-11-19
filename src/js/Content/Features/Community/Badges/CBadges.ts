import HTML from "@Core/Html/Html";
import CCommunityBase from "../CCommunityBase";
import CommunityUtils from "@Content/Modules/Community/CommunityUtils";
import DOMHelper from "@Content/Modules/DOM/DOMHelper";
import RequestData from "@Content/Modules/Data/RequestData";
import type {ContextParams} from "@Content/Modules/Context/Context";
import {bootstrapLegacy, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import ASEventHandler from "@Content/Modules/Events/ASEventHandler";
import FCardExchangeLinks from "@Content/Features/Community/Badges/FCardExchangeLinks";
import FBadgeSortAndFilter from "@Content/Features/Community/Badges/FBadgeSortAndFilter";
import BlockingWaitDialog from "@Core/Modals/BlockingWaitDialog";
import {L} from "@Core/Localization/Localization";
import {__loading} from "@Strings/_strings";
import FBadgeCalculations from "@Content/Features/Community/Badges/FBadgeCalculations";

export default class CBadges extends CCommunityBase {

    readonly myProfile: boolean;

    hasUnloadedPages: boolean;
    readonly pageUpdateEvent: ASEventHandler<void>

    constructor(params: ContextParams) {
        super(params);

        this.myProfile = CommunityUtils.userIsOwner(this.user);
        this.hasUnloadedPages = document.querySelector(".profile_paging") !== null;

        this.pageUpdateEvent = new ASEventHandler();
    }

    triggerPageUpdatedEvent(): void {
        this.pageUpdateEvent.dispatch();
    }

    async *eachBadgePage(): AsyncGenerator<DocumentFragment> {

        let loaded: number = 1;
        let pages: number = 0;

        const dialog = new BlockingWaitDialog(
            L(__loading),
            () => `${loaded}/${pages}`
        );

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
        pages = Number(lastPageNode.textContent);
        dialog.update();

        for (let p = 1; p <= pages; p++) {
            if (p === skip) { continue; }

            url.searchParams.set("p", String(p));

            try {
                const response = await RequestData.getText(url);
                const dom = HTML.toDom(response);
                yield dom;
            } catch (err) {
                console.error(`Failed to request ${url.toString()}: ${err}`);
            }
            loaded++;
            dialog.update();
        }
        dialog.dismiss();
    }
}


/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/badges
 */
export async function run(): Promise<void> {
    const params = await bootstrapLegacy();
    const context = new CBadges(params);

    await features(context, [
        ...commonFeatures(),
        FCardExchangeLinks,
        FBadgeSortAndFilter,
        FBadgeCalculations,
    ]);
}