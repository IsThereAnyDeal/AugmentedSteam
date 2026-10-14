import AppId from "@Core/GameId/AppId";
import FReplaceDevPubLinks from "./FReplaceDevPubLinks";
import FUserNotes from "./FUserNotes";
import AugmentedSteamApiFacade from "@Content/Modules/Facades/AugmentedSteamApiFacade";
import type {TStorePageData} from "@Background/Modules/AugmentedSteam/_types";
import FWaitlistToggle from "@Content/Features/Store/App/FWaitlistToggle";
import FNewQueue from "@Content/Features/Store/App/FNewQueue";
import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import {bootstrapLegacy, features} from "@Content/bootstrap";
import FITADPrices from "@Content/Features/Store/Common/FITADPrices";
import FDRMWarnings from "@Content/Features/Store/Common/FDRMWarnings";
import type IProductPageContext from "@Content/Features/Store/IProductPageContext";

export default class CApp extends Context implements IProductPageContext {

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

    constructor(params: ContextParams, isErrorPage: boolean) {
        super(params);

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


/**
 * @contentScript
 * @match *://*.steampowered.com/app/*
 */
export async function run(): Promise<void> {
    const params = await bootstrapLegacy();

    // Check if there's an error message (e.g. region-locked, age-gated)
    const isErrorPage = document.getElementById("error_box") !== null;
    const context = new CApp(params, isErrorPage);

    // TODO CBase features
    // TODO CStoreBase features
    await features(context, isErrorPage
        ? [
//            FExtraLinksAppError
        ] : [
//            FHighlightsTags,
            FReplaceDevPubLinks,
            FUserNotes,
            FWaitlistToggle,
            FNewQueue,
            FITADPrices,
            FDRMWarnings,
//            FMetacriticUserScore,
//            FOpenCritic,
//            FOwnedElsewhere,
//            FPurchaseDate,
//            FSteamPeek,
//            FWidescreenCertification,
//            FHowLongToBeat,
//            FExtraLinksApp,
//            FFamilySharingNotice,
//            FPackageInfoButton,
//            FPlayers,
//            FCustomizer,
//            FDLCCheckboxes,
//            FBadgeProgress,
//            FAchievementBar,
//            FRegionalPricing,
//            FReviewToggleButton,
//            FOwnedActionsButtons,
//            FSupportInfo,
//            FPreventVideoPause,
//            FDemoAbovePurchase,
//            FSaveReviewFilters,
//            FHideReportedTags,
//            FPatchHighlightPlayer,
//            FRemoveDupeScreenshots,
//            FHighlightTitle,
//            FAppTitle,
//            FHorizontalScrolling,
//            FVaporLensInsights,
//            FReleaseCountdown,
//            FRestorePriceCut
        ]);
}
