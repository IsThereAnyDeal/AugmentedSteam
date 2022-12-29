import {Context} from "../../modulesContent";
import FEarlyAccess from "./FEarlyAccess";
import FHideTrademarks from "./FHideTrademarks";
import FDisableLinkFilter from "./FDisableLinkFilter";
import FKeepSSACheckboxState from "./FKeepSSACheckboxState";
import FDefaultCommunityTab from "./FDefaultCommunityTab";
import FFocusSearch from "./FFocusSearch";

export class CBase extends Context {

    constructor(type, features = []) {

        features.push(
            FEarlyAccess,
            FHideTrademarks,
            FDisableLinkFilter,
            FKeepSSACheckboxState,
            FDefaultCommunityTab,
            FFocusSearch,
        );

        super(type, features);
    }
}
