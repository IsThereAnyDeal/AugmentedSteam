import ContextType from "@Content/Modules/Context/ContextType";
import CCommunityBase from "../CCommunityBase";
import FHighlightMarketItems from "./FHighlightMarketItems";
import type {ContextParams} from "@Content/Modules/Context/Context";

export default class CMarketSearch extends CCommunityBase {

    constructor(params: ContextParams) {

        super(params, ContextType.MARKET_SEARCH, [
            FHighlightMarketItems,
        ]);
    }
}
