import {Context} from "../../modulesContent";
import FEarlyAccess from "./FEarlyAccess";
import FHideTrademarks from "./FHideTrademarks";
import FKeepSSACheckboxState from "./FKeepSSACheckboxState";
import FDefaultCommunityTab from "./FDefaultCommunityTab";
import FFocusSearch from "./FFocusSearch";

export class CBase extends Context {

    constructor(type, features = []) {

        features.push(
            FEarlyAccess,
            FHideTrademarks,
            FKeepSSACheckboxState,
            FDefaultCommunityTab,
            FFocusSearch,
        );

        super(type, features);
    }
}
