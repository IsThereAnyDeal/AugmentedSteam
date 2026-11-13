import FBackToTop from "@Content/Features/Common/FBackToTop";
import FInstallSteamButton from "@Content/Features/Common/FInstallSteamButton";
import FFocusSearchBox from "@Content/Features/Common/FFocusSearchBox";
import FAddRedeemLink from "@Content/Features/Common/FAddRedeemLink";
import type Feature from "@Content/Modules/Context/Feature";
import type Context from "@Content/Modules/Context/Context";
import FDefaultCommunityTab from "@Content/Features/Common/FDefaultCommunityTab";

export default function commonFeatures(): Array<typeof Feature<Context>> {
    return [
        FBackToTop,
        FInstallSteamButton,
        FFocusSearchBox,
        FAddRedeemLink,
        FDefaultCommunityTab,
        // FIXME FEarlyAccess,
        // FIXME FDisableLinkFilter,
        // FIXME FKeepSSACheckboxState,
    ];
}