import FBackToTop from "@Content/Features/Common/FBackToTop";
import FInstallSteamButton from "@Content/Features/Common/FInstallSteamButton";
import FFocusSearchBox from "@Content/Features/Common/FFocusSearchBox";
import FAddRedeemLink from "@Content/Features/Common/FAddRedeemLink";
import type Feature from "@Content/Modules/Context/Feature";
import type Context from "@Content/Modules/Context/Context";

export default function commonFeatures(): Array<typeof Feature<Context>> {
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