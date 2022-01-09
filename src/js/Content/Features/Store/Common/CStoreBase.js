import {Context, ContextType} from "../../../modulesContent";
import FHideTrademarks from "../../Common/FHideTrademarks";
import FAlternativeLinuxIcon from "./FAlternativeLinuxIcon";
import FHighlightsAndEABanners from "./FHighlightsAndEABanners";

export class CStoreBase extends Context {

    constructor(type = ContextType.STORE_DEFAULT, features = []) {

        // TODO Split this up into the relevant contexts
        features.push(
            FAlternativeLinuxIcon,
            FHideTrademarks,
            FHighlightsAndEABanners,
        );

        super(type, features);
    }
}
