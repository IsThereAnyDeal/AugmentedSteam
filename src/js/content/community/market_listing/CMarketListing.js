import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules";

import {FSoldAmountLastDay} from "community/market_listing/FSoldAmountLastDay";
import {FBackgroundPreviewLink} from "community/market_listing/FBackgroundPreviewLink";
import {FBadgePageLink} from "community/market_listing/FBadgePageLink";
import {FPriceHistoryZoomControl} from "community/market_listing/FPriceHistoryZoomControl";

import {GameId} from "core";

export class CMarketListing extends CCommunityBase {

    constructor() {
        super([
            FSoldAmountLastDay,
            FBackgroundPreviewLink,
            FBadgePageLink,
            FPriceHistoryZoomControl,
        ]);

        this.type = ContextTypes.MARKET_LISTING;

        this.appid = GameId.getAppid(window.location.href);
    }
}
