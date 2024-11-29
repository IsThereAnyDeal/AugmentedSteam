import ContextType from "@Content/Modules/Context/ContextType";
import CCommunityBase from "../CCommunityBase";
import FSoldAmountLastDay from "./FSoldAmountLastDay";
import FBackgroundPreviewLink from "./FBackgroundPreviewLink";
import FBadgePageLink from "./FBadgePageLink";
import FPriceHistoryZoomYear from "../FPriceHistoryZoomYear";
import type {ContextParams} from "@Content/Modules/Context/Context";

export default class CMarketListing extends CCommunityBase {

    public readonly appid: number;
    public readonly marketHashName: string;

    constructor(params: ContextParams) {
        super(params, ContextType.MARKET_LISTING, [
            FSoldAmountLastDay,
            FBackgroundPreviewLink,
            FBadgePageLink,
            FPriceHistoryZoomYear,
        ]);

        const m = window.location.pathname.match(/^\/market\/listings\/(\d+)\/([^/]+)/)!;
        this.appid = Number(m[1]);
        this.marketHashName = String(m[2]);
    }
}
