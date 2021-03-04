import ContextType from "../../../Modules/Context/ContextType";
import {CCommunityBase} from "../CCommunityBase";
import FSoldAmountLastDay from "./FSoldAmountLastDay";
import FBackgroundPreviewLink from "./FBackgroundPreviewLink";
import FBadgePageLink from "./FBadgePageLink";
import FPriceHistoryZoomYear from "../FPriceHistoryZoomYear";

export class CMarketListing extends CCommunityBase {

    constructor() {
        super(ContextType.MARKET_LISTING, [
            FSoldAmountLastDay,
            FBackgroundPreviewLink,
            FBadgePageLink,
            FPriceHistoryZoomYear,
        ]);

        const m = window.location.pathname.match(/\/(\d+)\/(.+)$/);
        this.appid = Number(m[1]);
        this.marketHashName = m[2];
    }
}
