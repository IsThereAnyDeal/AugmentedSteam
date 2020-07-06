import {ContextTypes} from "modules/ASContext";
import {CStorePage} from "store/common/CStorePage";

import {FReplaceDevPubLinks} from "store/app/FReplaceDevPubLinks";
import {FRemoveFromWishlist} from "store/app/FRemoveFromWishlist";
import {FForceMP4} from "store/app/FForceMP4";
import {FHDPlayer} from "store/app/FHDPlayer";
import {FUserNotes} from "store/app/FUserNotes";
import {FWaitlistDropdown} from "store/app/FWaitlistDropdown";
import {FNewQueue} from "store/app/FNewQueue";
import {FFullscreenScreenshotView} from "store/app/FFullscreenScreenshotView";
import {FShowCoupon} from "store/app/FShowCoupon";
import {FITADPrices} from "store/common/FITADPrices";
import {FDLCInfo} from "store/app/FDLCInfo";
import {FDRMWarnings} from "store/common/FDRMWarnings";
import {FMetacriticUserScore} from "store/app/FMetacriticUserScore";
import {FOpenCritic} from "store/app/FOpenCritic";
import {FOwnedElsewhere} from "store/app/FOwnedElsewhere";
import {FPurchaseDate} from "store/app/FPurchaseDate";
import {FYouTubeVideos} from "store/app/FYouTubeVideos";
import {FSteamPeek} from "store/app/FSteamPeek";
import {FWidescreenCertification} from "store/app/FWidescreenCertification";
import {FHowLongToBeat} from "store/app/FHowLongToBeat";
import {FExtraLinks} from "store/common/FExtraLinks";
import {FFamilySharingNotice} from "store/app/FFamilySharingNotice";
import {FPackBreakdown} from "store/app/FPackBreakdown";
import {FPackageInfoButton} from "store/app/FPackageInfoButton";
import {FSteamChart} from "store/app/FSteamChart";
import {FSteamSpy} from "store/app/FSteamSpy";
import {FSurveyData} from "store/app/FSurveyData";
import {FCustomizer} from "store/common/FCustomizer";
import {FDLCCheckboxes} from "store/app/FDLCCheckboxes";
import {FBadgeProgress} from "store/app/FBadgeProgress";
import {FAStatsLink} from "store/app/FAStatsLink";
import {FAchievementBar} from "store/app/FAchievementBar";
import {FRegionalPricing} from "store/common/FRegionalPricing";
import {FReviewToggleButton} from "store/app/FReviewToggleButton";
import {FOwnedActionsButtons} from "store/app/FOwnedActionsButtons";
import {FSupportInfo} from "store/app/FSupportInfo";
import {FMediaExpander} from "common/FMediaExpander";

import {GameId, LocalStorage, SyncedStorage} from "core";

import {Background, User} from "common";
import {UserNotes} from "store/common/UserNotes";

export class CAppPage extends CStorePage {

    constructor() {
        super([
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
            FYouTubeVideos,
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
        ]);

        this.type = ContextTypes.APP;

        this.userNotes = new UserNotes();

        this.appid = GameId.getAppid(window.location.host + window.location.pathname);
        this.storeid = `app/${this.appid}`;

        this.hasCards = document.querySelector("#category_block img[src$=\"/ico_cards.png\"]") !== null;

        this.onWishAndWaitlistRemove = null;

        // Some games (e.g. 201270, 201271) have different appid in store page and community
        const communityAppidSrc = document.querySelector(".apphub_AppIcon img").getAttribute("src");
        this.communityAppid = GameId.getAppidImgSrc(communityAppidSrc);
        if (!this.communityAppid) {
            this.communityAppid = this.appid;
        }

        const metalinkNode = document.querySelector("#game_area_metalink a");
        this.metalink = metalinkNode && metalinkNode.getAttribute("href");

        this.data = this.storePageDataPromise().catch(err => { console.error(err); });
        this.appName = document.querySelector(".apphub_AppName").textContent;

        // The customizer has to wait on this data to be added in order to find the HTML elements
        FCustomizer.dependencies = [FSteamSpy, FSteamChart, FSurveyData];

        FMediaExpander.dependencies = [FYouTubeVideos];
        FMediaExpander.weakDependency = true;
    }

    storePageDataPromise() {
        return Background.action("storepagedata", this.appid, this.metalink, SyncedStorage.get("showoc"));
    }

    // TODO(tfedor) maybe make properties instead of dynamic qheck of all of these "isXY"? Not sure
    isOwned() {
        return document.querySelector(".game_area_already_owned") !== null;
    }

    isDlc() {
        return document.querySelector("div.game_area_dlc_bubble") !== null;
    }

    isVideo() {
        return document.querySelector(".game_area_purchase_game span[class*=\"streaming\"], div.series_seasons") !== null;
    }

    hasAchievements() {
        return document.querySelector("#achievement_block") !== null;
    }

    removeFromWishlist() {
        return Background.action("wishlist.remove", this.appid, User.getSessionId());
    }

    removeFromWaitlist() {
        return Background.action("itad.removefromwaitlist", this.appid);
    }

    toggleVideoDefinition(videoControl, setHD) {
        let videoIsVisible = videoControl.parentNode.offsetHeight > 0 && videoControl.parentNode.offsetWidth > 0, // $J().is(':visible')
            videoIsHD = false,
            loadedSrc = videoControl.classList.contains("es_loaded_src"),
            playInHD = LocalStorage.get("playback_hd") || videoControl.classList.contains("es_video_hd");

        const videoPosition = videoControl.currentTime || 0,
            videoPaused = videoControl.paused;
        if (videoIsVisible) {
            videoControl.preload = "metadata";
            videoControl.addEventListener("loadedmetadata", onLoadedMetaData, false);
        }

        function onLoadedMetaData() {
            this.currentTime = videoPosition;
            if (!videoPaused && videoControl.play) {

                // if response is a promise, suppress any errors it throws
                Promise.resolve(videoControl.play()).catch(err => {});
            }
            videoControl.removeEventListener("loadedmetadata", onLoadedMetaData, false);
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
