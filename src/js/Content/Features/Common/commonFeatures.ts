import FEarlyAccess from "@Content/Features/Common/FEarlyAccess";
import FDisableLinkFilter from "@Content/Features/Common/FDisableLinkFilter";
import FKeepSSACheckboxState from "@Content/Features/Common/FKeepSSACheckboxState";
import FDefaultCommunityTab from "@Content/Features/Common/FDefaultCommunityTab";

export default function commonFeatuers() {
    return [
        FEarlyAccess,
        FDisableLinkFilter,
        FKeepSSACheckboxState,
        FDefaultCommunityTab,
    ];
}