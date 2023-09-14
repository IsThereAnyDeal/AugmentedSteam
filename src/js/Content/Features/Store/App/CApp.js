import {GameId, SyncedStorage} from "../../../../modulesCore";
import {Background, ContextType} from "../../../modulesContent";
import {CStoreBase} from "../Common/CStoreBase";
import {UserNotes} from "../Common/UserNotes";
import FMediaExpander from "../../Common/FMediaExpander";
import FITADPrices from "../Common/FITADPrices";
import FDRMWarnings from "../Common/FDRMWarnings";
import FExtraLinks from "../Common/FExtraLinks";
import FAddToCartNoRedirect from "../Common/FAddToCartNoRedirect";
import FReplaceDevPubLinks from "./FReplaceDevPubLinks";
import FForceMP4 from "./FForceMP4";
import FHDPlayer from "./FHDPlayer";
import FUserNotes from "./FUserNotes";
import FWaitlistDropdown from "./FWaitlistDropdown";
import FNewQueue from "./FNewQueue";
import FFullscreenScreenshotView from "./FFullscreenScreenshotView";
import FShowCoupon from "./FShowCoupon";
import FDLCInfo from "./FDLCInfo";
import FMetacriticUserScore from "./FMetacriticUserScore";
import FOpenCritic from "./FOpenCritic";
import FOwnedElsewhere from "./FOwnedElsewhere";
import FPurchaseDate from "./FPurchaseDate";
import FSteamPeek from "./FSteamPeek";
import FWidescreenCertification from "./FWidescreenCertification";
import FHowLongToBeat from "./FHowLongToBeat";
import FFamilySharingNotice from "./FFamilySharingNotice";
import FPackBreakdown from "./FPackBreakdown";
import FPackageInfoButton from "./FPackageInfoButton";
import FSteamChart from "./FSteamChart";
import FSteamSpy from "./FSteamSpy";
import FSurveyData from "./FSurveyData";
import FCustomizer from "../Common/FCustomizer";
import FDLCCheckboxes from "./FDLCCheckboxes";
import FBadgeProgress from "./FBadgeProgress";
import FAStatsLink from "./FAStatsLink";
import FAchievementBar from "./FAchievementBar";
import FRegionalPricing from "../Common/FRegionalPricing";
import FReviewToggleButton from "./FReviewToggleButton";
import FOwnedActionsButtons from "./FOwnedActionsButtons";
import FSupportInfo from "./FSupportInfo";
import FRemoveBroadcasts from "./FRemoveBroadcasts";
import FDemoAbovePurchase from "./FDemoAbovePurchase";
import FSaveReviewFilters from "./FSaveReviewFilters";
import FHideReportedTags from "./FHideReportedTags";
import FPatchHighlightPlayer from "./FPatchHighlightPlayer";
import FSteamDeckCompatibility from "./FSteamDeckCompatibility";
import FRemoveDupeScreenshots from "./FRemoveDupeScreenshots";

export class CApp extends CStoreBase {

    constructor() {

        // Only add extra links if there's an error message (e.g. region-locked, age-gated)
        if (document.getElementById("error_box") !== null) {
            super(ContextType.APP, [FExtraLinks]);

            this.isErrorPage = true;
            this.appid = GameId.getAppid(window.location.host + window.location.pathname);

            return;
        }

        super(ContextType.APP, [
            FReplaceDevPubLinks,
            FForceMP4,
            FHDPlayer,
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
            FExtraLinks,
            FFamilySharingNotice,
            FPackBreakdown,
            FPackageInfoButton,
            FSteamChart,
            FSteamSpy,
            FSurveyData,
            FCustomizer,
            FDLCCheckboxes,
            FBadgeProgress,
            FAStatsLink,
            FAchievementBar,
            FRegionalPricing,
            FReviewToggleButton,
            FOwnedActionsButtons,
            FSupportInfo,
            FMediaExpander,
            FRemoveBroadcasts,
            FDemoAbovePurchase,
            FSaveReviewFilters,
            FHideReportedTags,
            FAddToCartNoRedirect,
            FPatchHighlightPlayer,
            FSteamDeckCompatibility,
            FRemoveDupeScreenshots,
        ]);

        this.appid = GameId.getAppid(window.location.host + window.location.pathname);
        this.storeid = `app/${this.appid}`;

        // Some games (e.g. 201270, 201271) have different appid in store page and community
        this.communityAppid = GameId.getAppidImgSrc(
            document.querySelector(".apphub_AppIcon img")?.getAttribute("src")
        ) ?? this.appid;

        this.appName = document.querySelector(".apphub_AppName")?.textContent ?? "";

        this.metalink = document.querySelector("#game_area_metalink a")?.getAttribute("href") ?? null;

        // TODO this check is unreliable; some apps and dlcs have card category yet no card, and vice versa
        this.hasCards = document.querySelector('#category_block img[src$="/ico_cards.png"]') !== null;

        // #achievement_block is also used for point shop items
        this.hasAchievements = document.querySelector(".communitylink_achievement_images") !== null;

        this.isOwned = document.querySelector(".game_area_already_owned") !== null;
        this.isOwnedAndPlayed = this.isOwned && document.querySelector("#my_activity") !== null;

        this.isDlc = document.querySelector(".game_area_dlc_bubble") !== null;
        this.isDlcLike = this.isDlc || document.querySelector(".game_area_soundtrack_bubble") !== null;

        const category = new URLSearchParams(document.querySelector(".breadcrumbs a")?.search).get("category1");

        /**
         * `true` for non-application items, or if system requirements section is missing (usually hardware)
         * Previous check for videos:
         * document.querySelector(".game_area_purchase_game span[class*=streaming], div.series_seasons") !== null;
         */
        this.isVideoOrHardware = category === "992" || category === "993" || !document.querySelector(".sys_req");

        this.userNotes = new UserNotes();
        this.data = this.storePageDataPromise().catch(err => { console.error(err); });

        // The customizer has to wait on this data to be added in order to find the HTML elements
        FCustomizer.dependencies = [FSteamSpy, FSteamChart, FSurveyData];
        FCustomizer.weakDependency = true;

        // FPackBreakdown skips purchase options with a package info button to avoid false positives
        FPackageInfoButton.dependencies = [FPackBreakdown];
        FPackageInfoButton.weakDependency = true;

        // HDPlayer needs to wait for mp4 sources to be set
        FHDPlayer.dependencies = [FForceMP4];
        FHDPlayer.weakDependency = true;
    }

    storePageDataPromise() {
        return Background.action("storepagedata", this.appid, this.metalink, SyncedStorage.get("showoc"));
    }

    /**
     * @param videoEl - the video element
     * @param {boolean} setHD - set HD or SD source
     * @param {boolean} [force] - force set source, only current use is in FForceMP4, where we need to set mp4 source regardless of HD
     */
    toggleVideoDefinition(videoEl, setHD, force = false) {
        const container = videoEl.parentNode;
        container.classList.toggle("es_playback_hd", setHD);

        // Return early if there's nothing to do, i.e. setting HD while the video is already in HD, and vice versa
        const isHD = videoEl.src === videoEl.dataset.hdSrc;
        if (!force && (setHD === isHD)) { return; }

        const useWebM = /\.webm/.test(videoEl.dataset.hdSrc); // `false` if browser doesn't support webm, or if "force mp4" feature is enabled
        const isVisible = container.offsetHeight > 0 && container.offsetWidth > 0;

        // https://github.com/SteamDatabase/SteamTracking/blob/4da99e29581ba6628ad5ce24c50856703aea71a2/store.steampowered.com/public/javascript/gamehighlightplayer.js#L1055-L1067
        const position = videoEl.currentTime || 0;
        videoEl.pause();
        videoEl.preload = "metadata";

        videoEl.addEventListener("loadedmetadata", () => {
            videoEl.currentTime = position;

            if (isVisible) {
                videoEl.play();
            }
        }, {"once": true});

        if (setHD) {
            videoEl.src = useWebM ? container.dataset.webmHdSource : container.dataset.mp4HdSource;
        } else {
            videoEl.src = useWebM ? container.dataset.webmSource : container.dataset.mp4Source;
        }

        videoEl.load();
    }
}
