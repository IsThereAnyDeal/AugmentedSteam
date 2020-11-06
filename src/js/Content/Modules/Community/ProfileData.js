import {SteamId} from "../SteamId";
import {Background} from "../Background";
import {User} from "../User";

export class ProfileData {

    static promise() {
        if (!this._promise) {
            const steamId = SteamId.getSteamId();

            this._promise = Background.action("profile", steamId)
                .then(response => {
                    this._data = response;
                    return this._data;
                });
        }
        return this._promise;
    }

    static then(onDone, onCatch) {
        return this.promise().then(onDone, onCatch);
    }

    static getBadges() {
        if (this._promise === null) { console.warn("ProfileData were not initialized"); }
        return this._data.badges;
    }

    static getSteamRep() {
        if (this._promise === null) { console.warn("ProfileData were not initialized"); }
        return this._data.steamrep;
    }

    static getStyle() {
        if (this._promise === null) { console.warn("ProfileData were not initialized"); }
        return this._data.style;
    }

    static getBgImg() {
        if (this._promise === null) { console.warn("ProfileData were not initialized"); }
        if (!this._data.bg || !this._data.bg.img) { return ""; }

        return this._data.bg.img;
    }

    static getBgImgUrl() {
        const img = this.getBgImg();
        if (!img) { return ""; }
        return `https://steamcommunity.com/economy/image/${img}`;
    }

    static getBgAppid() {
        if (this._promise === null) { console.warn("ProfileData were not initialized"); }
        return this._data.bg && this._data.bg.appid ? parseInt(this._data.bg.appid) : null;
    }

    static async clearOwn() {
        if (!User.isSignedIn) { return null; }
        await Background.action("clearownprofile", User.steamId);
        this._promise = null;
        return this.promise();
    }
}

ProfileData._data = {};
