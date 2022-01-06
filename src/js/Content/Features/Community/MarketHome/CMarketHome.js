import ContextType from "../../../Modules/Context/ContextType";
import {CCommunityBase} from "../CCommunityBase";
import FMarketStats from "./FMarketStats";
import FHideActiveListings from "./FHideActiveListings";
import FMarketSort from "./FMarketSort";
import FPopularRefreshToggle from "./FPopularRefreshToggle";
import FMarketLowestPrice from "./FMarketLowestPrice";

export class CMarketHome extends CCommunityBase {

    constructor() {

        super(ContextType.MARKET_HOME, [
            FMarketStats,
            FHideActiveListings,
            FMarketSort,
            FPopularRefreshToggle,
            FMarketLowestPrice,
        ]);
    }
}
