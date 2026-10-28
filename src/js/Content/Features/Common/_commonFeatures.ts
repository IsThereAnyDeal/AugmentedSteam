import FBackToTop from "@Content/Features/Common/FBackToTop";
import FInstallSteamButton from "@Content/Features/Common/FInstallSteamButton";
import FFocusSearchBox from "@Content/Features/Common/FFocusSearchBox";

export default function commonFeatures() {
    return [
        FBackToTop,
        FInstallSteamButton,
        FFocusSearchBox,
        // FIXME FEarlyAccess,
        // FIXME FDisableLinkFilter,
        // FIXME FKeepSSACheckboxState,
        // FIXME FDefaultCommunityTab,
    ];
}