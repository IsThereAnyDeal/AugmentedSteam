import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules";

import {FHighlightMarketItems} from "community/market/FHighlightMarketItems";
import {FMarketStats} from "community/market/FMarketStats";
import {FHideActiveListings} from "community/market/FHideActiveListings";
import {FMarketSort} from "community/market/FMarketSort";
import {FPopularRefreshToggle} from "community/market/FPopularRefreshToggle";
import {FMarketLowestPrice} from "community/market/FMarketLowestPrice";

export class CMarketPage extends CCommunityBase {

    constructor() {

        const features = [
            FHighlightMarketItems,
        ];

        // TODO This runs only on the homepage of the market, maybe this should be separated into two contexts?
        if (window.location.pathname.match(/^\/market\/$/)) {
            features.push(
                FMarketStats,
                FHideActiveListings,
                FMarketSort,
                FPopularRefreshToggle,
                FMarketLowestPrice,
            );
        }

        super(features);

        this.type = ContextTypes.MARKET;
    }
}
