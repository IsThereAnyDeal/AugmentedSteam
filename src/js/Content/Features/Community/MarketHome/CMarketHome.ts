import {ContextType} from "../../../Modules/Context/ContextType";
import CCommunityBase from "../CCommunityBase";
import FMarketStats from "./FMarketStats";
import FHideActiveListings from "./FHideActiveListings";
import FMarketSort from "./FMarketSort";
import FPopularRefreshToggle from "./FPopularRefreshToggle";
import FMarketLowestPrice from "./FMarketLowestPrice";
import ASEventHandler from "@Content/Modules/ASEventHandler";

export default class CMarketHome extends CCommunityBase {

    public onMarketListings: ASEventHandler<void> = new ASEventHandler<void>();

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
                this.onMarketListings.dispatch();
            }).observe(
                document.getElementById("tabContentsMyListings")!,
                {"childList": true}
            );
        }
    }
}
