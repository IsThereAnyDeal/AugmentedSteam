import FHideTrademarks from "./FHideTrademarks";
import FDisableLinkFilter from "./FDisableLinkFilter";
import FKeepSSACheckboxState from "./FKeepSSACheckboxState";
import FDefaultCommunityTab from "./FDefaultCommunityTab";
import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import ContextType from "@Content/Modules/Context/ContextType";
import type Feature from "@Content/Modules/Context/Feature";
import FEarlyAccess from "@Content/Features/Common/FEarlyAccess";

export default class CBase extends Context {

    constructor(
        params: ContextParams,
        type: ContextType,
        features: (typeof Feature<Context>)[] = []
    ) {

        features.push(
            FEarlyAccess,
            FHideTrademarks,
            FDisableLinkFilter,
            FKeepSSACheckboxState,
            FDefaultCommunityTab,
        );

        super(params, type, features);
    }
}
