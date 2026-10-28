import FEarlyAccess from "@Content/Features/Common/FEarlyAccess";
import FDisableLinkFilter from "@Content/Features/Common/FDisableLinkFilter";
import FKeepSSACheckboxState from "@Content/Features/Common/FKeepSSACheckboxState";
import FDefaultCommunityTab from "@Content/Features/Common/FDefaultCommunityTab";
import FBackToTop from "@Content/Features/Common/FBackToTop.ts";

export default function commonFeatures() {
    return [
        FBackToTop,
        // FIXME FEarlyAccess,
        // FIXME FDisableLinkFilter,
        // FIXME FKeepSSACheckboxState,
        // FIXME FDefaultCommunityTab,
    ];
}