import {GameId, LocalStorage, SyncedStorage} from "../../../../modulesCore";
import {Background, ContextType, User} from "../../../modulesContent";
import FMediaExpander from "../../Common/FMediaExpander";
import FITADPrices from "../Common/FITADPrices";
import FDRMWarnings from "../Common/FDRMWarnings";
import FExtraLinks from "../Common/FExtraLinks";
import {UserNotes} from "../Common/UserNotes";
import {CStore} from "../Common/CStore";
import FReplaceDevPubLinks from "./FReplaceDevPubLinks";
import FRemoveFromWishlist from "./FRemoveFromWishlist";
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

export class CApp extends CStore {

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
            FRemoveFromWishlist,
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
        ]);

        this.appid = GameId.getAppid(window.location.host + window.location.pathname);
        this.storeid = `app/${this.appid}`;

        // Some games (e.g. 201270, 201271) have different appid in store page and community
        this.communityAppid = GameId.getAppidImgSrc(document.querySelector(".apphub_AppIcon img")?.getAttribute("src")) ?? this.appid;

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
         * Previous check for videos: document.querySelector(".game_area_purchase_game span[class*=streaming], div.series_seasons") !== null;
         */
        this.isVideoOrHardware = category === "992" || category === "993" || !document.querySelector(".sys_req");

        this.onWishAndWaitlistRemove = null;
        this.userNotes = new UserNotes();
        this.data = this.storePageDataPromise().catch(err => { console.error(err); });

        // FPackBreakdown skips purchase options with a package info button to avoid false positives
        FPackageInfoButton.dependencies = [FPackBreakdown];
        FPackageInfoButton.weakDependency = true;
    }

    storePageDataPromise() {
        return Background.action("storepagedata", this.appid, this.metalink, SyncedStorage.get("showoc"));
    }

    removeFromWishlist() {
        return Background.action("wishlist.remove", this.appid, User.sessionId);
    }

    removeFromWaitlist() {
        return Background.action("itad.removefromwaitlist", this.appid);
    }

    toggleVideoDefinition(videoControl, setHD) {
        let videoIsHD = false;

        const videoIsVisible = videoControl.parentNode.offsetHeight > 0 && videoControl.parentNode.offsetWidth > 0,
            loadedSrc = videoControl.classList.contains("es_loaded_src"),
            playInHD = LocalStorage.get("playback_hd") || videoControl.classList.contains("es_video_hd");

        const videoPosition = videoControl.currentTime || 0,
            videoPaused = videoControl.paused;

        /** @this {HTMLVideoElement} The video element */
        function onLoadedMetaData() {
            this.currentTime = videoPosition;
            if (!videoPaused && videoControl.play) {

                Promise.resolve(videoControl.play()).catch(() => {
                    // FIXME Why?

                    // If response is a promise, suppress any errors it throws
                });
            }
            videoControl.removeEventListener("loadedmetadata", onLoadedMetaData, false);
        }

        if (videoIsVisible) {
            videoControl.preload = "metadata";
            videoControl.addEventListener("loadedmetadata", onLoadedMetaData, false);
        }

        if ((!playInHD && typeof setHD === "undefined") || setHD === true) {
            videoIsHD = true;
            videoControl.src = videoControl.dataset.hdSrc;
        } else if (loadedSrc) {
            videoControl.src = videoControl.dataset.sdSrc;
        }

        if (videoIsVisible && loadedSrc) {
            videoControl.load();
        }

        videoControl.classList.add("es_loaded_src");
        videoControl.classList.toggle("es_video_sd", !videoIsHD);
        videoControl.classList.toggle("es_video_hd", videoIsHD);
        videoControl.parentNode.classList.toggle("es_playback_sd", !videoIsHD);
        videoControl.parentNode.classList.toggle("es_playback_hd", videoIsHD);

        return videoIsHD;
    }
}
