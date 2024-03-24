import {GameId} from "../../../../modulesCore";
import {Background, ContextType, FeatureManager} from "../../../modulesContent";
import FMediaExpander from "../../Common/FMediaExpander";
import {CStoreBase} from "../Common/CStoreBase";
import FCustomizer from "../Common/FCustomizer";
import FDRMWarnings from "../Common/FDRMWarnings";
import FExtraLinks from "../Common/FExtraLinks";
import FITADPrices from "../Common/FITADPrices";
import FRegionalPricing from "../Common/FRegionalPricing";
import {UserNotes} from "../Common/UserNotes";
import FAchievementBar from "./FAchievementBar";
import FAStatsLink from "./FAStatsLink";
import FBadgeProgress from "./FBadgeProgress";
import FDemoAbovePurchase from "./FDemoAbovePurchase";
import FDLCCheckboxes from "./FDLCCheckboxes";
import FDLCInfo from "./FDLCInfo";
import FFamilySharingNotice from "./FFamilySharingNotice";
import FForceMP4 from "./FForceMP4";
import FFullscreenScreenshotView from "./FFullscreenScreenshotView";
import FHDPlayer from "./FHDPlayer";
import FHideReportedTags from "./FHideReportedTags";
import FHowLongToBeat from "./FHowLongToBeat";
import FMetacriticUserScore from "./FMetacriticUserScore";
import FNewQueue from "./FNewQueue";
import FOpenCritic from "./FOpenCritic";
import FOwnedActionsButtons from "./FOwnedActionsButtons";
import FOwnedElsewhere from "./FOwnedElsewhere";
import FPackageInfoButton from "./FPackageInfoButton";
import FPackBreakdown from "./FPackBreakdown";
import FPatchHighlightPlayer from "./FPatchHighlightPlayer";
import {FPlayers} from "./FPlayers.svelte";
import FPurchaseDate from "./FPurchaseDate";
import FRemoveBroadcasts from "./FRemoveBroadcasts";
import FRemoveDupeScreenshots from "./FRemoveDupeScreenshots";
import FReplaceDevPubLinks from "./FReplaceDevPubLinks";
import {FReviewToggleButton} from "./FReviewToggleButton.svelte";
import FSaveReviewFilters from "./FSaveReviewFilters";
import FShowCoupon from "./FShowCoupon";
import FSteamDeckCompatibility from "./FSteamDeckCompatibility";
import FSteamPeek from "./FSteamPeek";
import FSupportInfo from "./FSupportInfo";
import FUserNotes from "./FUserNotes";
import FWaitlistDropdown from "./FWaitlistDropdown";
import FWidescreenCertification from "./FWidescreenCertification";

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
            FPlayers,
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

        // FPackBreakdown skips purchase options with a package info button to avoid false positives
        FeatureManager.dependency(FPackageInfoButton, [FPackBreakdown, true]);

        // HDPlayer needs to wait for mp4 sources to be set
        FeatureManager.dependency(FPackageInfoButton, [FPackBreakdown, true]);
    }

    storePageDataPromise() {
        return Background.action("storepagedata", this.appid);
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
