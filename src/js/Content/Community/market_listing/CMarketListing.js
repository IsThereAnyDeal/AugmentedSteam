import {CCommunityBase} from "community/common/CCommunityBase";
import ContextType from "../../../Modules/Content/Context/ContextType";

import FSoldAmountLastDay from "./FSoldAmountLastDay";
import FBackgroundPreviewLink from "./FBackgroundPreviewLink";
import FBadgePageLink from "./FBadgePageLink";
import FPriceHistoryZoomControl from "./FPriceHistoryZoomControl";

import {GameId} from "../../../Modules/Core/GameId";

export class CMarketListing extends CCommunityBase {

    constructor() {
        super([
            FSoldAmountLastDay,
            FBackgroundPreviewLink,
            FBadgePageLink,
            FPriceHistoryZoomControl,
        ]);

        this.type = ContextType.MARKET_LISTING;

        this.appid = GameId.getAppid(window.location.href);
    }
}
