import AppId from "@Core/GameId/AppId";
import FMediaExpander from "../../Common/FMediaExpander";
import FCustomizer from "../Common/FCustomizer";
import FDRMWarnings from "../Common/FDRMWarnings";
import FITADPrices from "../Common/FITADPrices";
import FRegionalPricing from "../Common/FRegionalPricing";
import FAchievementBar from "./FAchievementBar";
import FBadgeProgress from "./FBadgeProgress";
import FDemoAbovePurchase from "./FDemoAbovePurchase";
import FDLCCheckboxes from "./FDLCCheckboxes";
import FDLCInfo from "./FDLCInfo";
import FFamilySharingNotice from "./FFamilySharingNotice";
import FFullscreenScreenshotView from "./FFullscreenScreenshotView";
import FHideReportedTags from "./FHideReportedTags";
import FHowLongToBeat from "./FHowLongToBeat";
import FMetacriticUserScore from "./FMetacriticUserScore";
import FNewQueue from "./FNewQueue";
import FOpenCritic from "./FOpenCritic";
import FOwnedActionsButtons from "./FOwnedActionsButtons";
import FOwnedElsewhere from "./FOwnedElsewhere";
import FPackageInfoButton from "./FPackageInfoButton";
import FPatchHighlightPlayer from "./FPatchHighlightPlayer";
import FPlayers from "./FPlayers";
import FPurchaseDate from "./FPurchaseDate";
import FRemoveBroadcasts from "./FRemoveBroadcasts";
import FRemoveDupeScreenshots from "./FRemoveDupeScreenshots";
import FReplaceDevPubLinks from "./FReplaceDevPubLinks";
import FReviewToggleButton from "./FReviewToggleButton";
import FVaporLensInsights from "./FVaporLensInsights";
import FSaveReviewFilters from "./FSaveReviewFilters";
import FShowCoupon from "./FShowCoupon";
import FSteamPeek from "./FSteamPeek";
import FSupportInfo from "./FSupportInfo";
import FUserNotes from "./FUserNotes";
import FWidescreenCertification from "./FWidescreenCertification";
import ContextType from "@Content/Modules/Context/ContextType";
import FExtraLinksApp from "@Content/Features/Store/Common/FExtraLinksApp";
import FExtraLinksAppError from "@Content/Features/Store/Common/FExtraLinksAppError";
import CStoreBase from "@Content/Features/Store/Common/CStoreBase";
import AugmentedSteamApiFacade from "@Content/Modules/Facades/AugmentedSteamApiFacade";
import type {TStorePageData} from "@Background/Modules/AugmentedSteam/_types";
import FWaitlistDropdown from "@Content/Features/Store/App/FWaitlistDropdown";
import FHighlightTitle from "@Content/Features/Store/App/FHighlightTitle";
import type {ContextParams} from "@Content/Modules/Context/Context";
import FPreventVideoPause from "@Content/Features/Store/App/FPreventVideoPause";
import FAppTitle from "@Content/Features/Store/App/FAppTitle";

export default class CApp extends CStoreBase {

    public readonly appid: number;
    public readonly storeid: string;
    public readonly communityAppid: number = 0;
    public readonly appName: string = "";

    public readonly metalink: string|null = null;
    public readonly hasAchievements: boolean = false;

    public readonly isOwned: boolean = false;
    public readonly isOwnedAndPlayed: boolean = false;

    public readonly isDlc: boolean = false;
    public readonly isDlcLike: boolean = false;

    public readonly isVideoOrHardware: boolean = false;

    public readonly data: Promise<TStorePageData|null> = Promise.resolve(null);

    constructor(params: ContextParams) {

        // Check if there's an error message (e.g. region-locked, age-gated)
        const isErrorPage = document.getElementById("error_box") !== null;

        super(params, ContextType.APP, isErrorPage
            ? [
                FExtraLinksAppError
            ] : [
                FReplaceDevPubLinks,
                FUserNotes,
                FWaitlistDropdown,
                FNewQueue,
                FFullscreenScreenshotView,
                FShowCoupon,
                FITADPrices,
                FDLCInfo,
                FDRMWarnings,
                FMetacriticUserScore,
                FOpenCritic,
                FOwnedElsewhere,
                FPurchaseDate,
                FSteamPeek,
                FWidescreenCertification,
                FHowLongToBeat,
                FExtraLinksApp,
                FFamilySharingNotice,
                FPackageInfoButton,
                FPlayers,
                FCustomizer,
                FDLCCheckboxes,
                FBadgeProgress,
                FAchievementBar,
                FRegionalPricing,
                FReviewToggleButton,
                FVaporLensInsights,
                FOwnedActionsButtons,
                FSupportInfo,
                FRemoveBroadcasts,
                FPreventVideoPause,
                FDemoAbovePurchase,
                FSaveReviewFilters,
                FHideReportedTags,
                FPatchHighlightPlayer,
                FRemoveDupeScreenshots,
                FHighlightTitle,
                FAppTitle
            ]);

        this.appid = AppId.fromUrl(window.location.host + window.location.pathname)!;
        this.storeid = `app/${this.appid}`;

        if (isErrorPage) {
            return;
        }

        // Some games (e.g. 201270, 201271) have different appid in store page and community
        this.communityAppid = AppId.fromCDNUrl(
            document.querySelector<HTMLImageElement>(".apphub_AppIcon img")?.src ?? ""
        ) ?? this.appid;

        this.appName = document.querySelector(".apphub_AppName")?.textContent ?? "";

        this.metalink = document.querySelector<HTMLAnchorElement>("#game_area_metalink a")?.href ?? null;

        // #achievement_block is also used for point shop items
        this.hasAchievements = document.querySelector(".communitylink_achievement_images") !== null;

        this.isOwned = document.querySelector(".game_area_already_owned") !== null;
        this.isOwnedAndPlayed = this.isOwned && document.querySelector("#my_activity") !== null;

        this.isDlc = document.querySelector(".game_area_dlc_bubble") !== null;
        this.isDlcLike = this.isDlc || document.querySelector(".game_area_soundtrack_bubble") !== null;

        const category = new URLSearchParams(
            document.querySelector<HTMLAnchorElement>(".breadcrumbs a")?.search
        ).get("category1");

        /**
         * `true` for non-application items, or if system requirements section is missing (usually hardware)
         * Previous check for videos:
         * document.querySelector(".game_area_purchase_game span[class*=streaming], div.series_seasons") !== null;
         */
        this.isVideoOrHardware = category === "992" || category === "993" || !document.querySelector(".sys_req");

        this.data = AugmentedSteamApiFacade.getStorePageData(this.appid)
            .catch(e => {
                console.error(e);
                return null;
            });
    }
}
