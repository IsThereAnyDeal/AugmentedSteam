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

        // If there're page controls, observe the listings because Steam refreshes them after selecting a page size option
        if (document.getElementById("tabContentsMyActiveMarketListings_ctn") !== null) {
            new MutationObserver(() => {
                this.triggerCallbacks();
            }).observe(document.getElementById("tabContentsMyListings"), {"childList": true});
        }
    }
}
