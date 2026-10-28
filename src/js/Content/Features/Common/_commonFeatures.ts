import FBackToTop from "@Content/Features/Common/FBackToTop";
import FInstallSteamButton from "@Content/Features/Common/FInstallSteamButton";
import FFocusSearchBox from "@Content/Features/Common/FFocusSearchBox";
import FAddRedeemLink from "@Content/Features/Common/FAddRedeemLink";

export default function commonFeatures() {
    return [
        FBackToTop,
        FInstallSteamButton,
        FFocusSearchBox,
        FAddRedeemLink,
        // FIXME FEarlyAccess,
        // FIXME FDisableLinkFilter,
        // FIXME FKeepSSACheckboxState,
        // FIXME FDefaultCommunityTab,
    ];
}