class CAppPage extends CStorePage {
    constructor(url) {
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
        ]);

        this.userNotes = new UserNotes();

        this.appid = GameId.getAppid(url);
        this.storeid = `app/${this.appid}`;

        this.hasCards = document.querySelector(`#category_block img[src$="/ico_cards.png"]`) !== null;

        this.onWishAndWaitlistRemove = null;

        // Some games (e.g. 201270, 201271) have different appid in store page and community
        let communityAppidSrc = document.querySelector(".apphub_AppIcon img").getAttribute("src");
        this.communityAppid = GameId.getAppidImgSrc(communityAppidSrc);
        if (!this.communityAppid) {
            this.communityAppid = this.appid;
        }

        let metalinkNode = document.querySelector("#game_area_metalink a");
        this.metalink = metalinkNode && metalinkNode.getAttribute("href");

        this.data = this.storePageDataPromise().catch(err => { console.error(err) });
        this.appName = document.querySelector(".apphub_AppName").textContent;

        // The customizer has to wait on this data to be added in order to find the HTML elements
        FCustomizer.deps = [ FSteamSpy, FSteamChart, FSurveyData ];

        this.applyFeatures();
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
        return document.querySelector(`.game_area_purchase_game span[class*="streaming"], div.series_seasons`) !== null;
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

        let videoPosition = videoControl.currentTime || 0,
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
