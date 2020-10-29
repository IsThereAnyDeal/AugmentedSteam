import ContextType from "../../../Modules/Content/Context/ContextType";
import {GameId} from "../../../Modules/Core/GameId";
import {CCommunityBase} from "../common/CCommunityBase";
import FSoldAmountLastDay from "./FSoldAmountLastDay";
import FBackgroundPreviewLink from "./FBackgroundPreviewLink";
import FBadgePageLink from "./FBadgePageLink";
import FPriceHistoryZoomControl from "./FPriceHistoryZoomControl";

export class CMarketListing extends CCommunityBase {

    constructor() {
        super(ContextType.MARKET_LISTING, [
            FSoldAmountLastDay,
            FBackgroundPreviewLink,
            FBadgePageLink,
            FPriceHistoryZoomControl,
        ]);

        this.appid = GameId.getAppid(window.location.href);
    }
}
