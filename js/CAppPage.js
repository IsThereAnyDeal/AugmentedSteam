class CAppPage extends CStorePage {
    constructor(features, url) {
        super(features);

        this.userNotes = new UserNotes();

        this.appid = GameId.getAppid(url);
        this.storeid = `app/${this.appid}`;

        this.onWishAndWaitlistRemove = null;

        // Some games (e.g. 201270, 201271) have different appid in store page and community
        let communityAppidSrc = document.querySelector(".apphub_AppIcon img").getAttribute("src");
        this.communityAppid = GameId.getAppidImgSrc(communityAppidSrc);
        if (!this.communityAppid) {
            this.communityAppid = this.appid;
        }

        let metalinkNode = document.querySelector("#game_area_metalink a");
        this.metalink = metalinkNode && metalinkNode.getAttribute("href");

        this.data = this.storePageDataPromise().catch(err => console.error(err));
        this.appName = document.querySelector(".apphub_AppName").textContent;

        this.applyFeatures();
    }

    storePageDataPromise() {
        return Background.action("storepagedata", this.appid, this.metalink, SyncedStorage.get("showoc"));
    }

    isOwned() {
        return Boolean(document.querySelector(".game_area_already_owned"));
    }

    removeFromWishlist() {
        return Background.action("wishlist.remove", this.appid, User.getSessionId());
    }

    removeFromWaitlist() {
        return Background.action("itad.removefromwaitlist", this.appid);
    }
}
