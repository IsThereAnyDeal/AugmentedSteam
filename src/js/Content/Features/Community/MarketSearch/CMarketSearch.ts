import {ContextType} from "../../../Modules/Context/ContextType";
import CCommunityBase from "../CCommunityBase";
import FHighlightMarketItems from "./FHighlightMarketItems";

export default class CMarketSearch extends CCommunityBase {

    constructor() {

        super(ContextType.MARKET_SEARCH, [
            FHighlightMarketItems,
        ]);
    }
}
