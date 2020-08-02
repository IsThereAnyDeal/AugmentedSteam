import {ExtensionResources, GameId, HTML, SyncedStorage} from "core";
import {Background, SteamId, User} from "common";

export class ProfileData {

    static promise() {
        if (!this._promise) {
            let steamId = SteamId.getSteamId();

            _promise = Background.action("profile", steamId)
                .then(response => { _data = response; return _data; });
        }
        return _promise;
    };

    static then(onDone, onCatch) {
        return this.promise().then(onDone, onCatch);
    }

    static getBadges() {
        if (this._promise == null) { console.warn("ProfileData were not initialized"); }
        return this._data.badges;
    }

    static getSteamRep() {
        if (this._promise == null) { console.warn("ProfileData were not initialized"); }
        return this._data.steamrep;
    }

    static getStyle() {
        if (this._promise == null) { console.warn("ProfileData were not initialized"); }
        return this._data.style;
    }

    static getBgImg(width, height) {
        if (this._promise == null) { console.warn("ProfileData were not initialized"); }
        if (!this._data.bg || !this._data.bg.img) { return ""; }

        if (width && height) {
            return this._data.bg.img.replace("/\/+$/", "")+`/${width}x${height}`; // also possible ${width}fx${height}f
        }

        return this._data.bg.img;
    }

    static getBgImgUrl(width, height) {
        let img = this.getBgImg(width, height);
        if (!img) { return ""; }
        return `https://steamcommunity.com/economy/image/${img}`;
    }

    static getBgAppid() {
        if (this._promise == null) { console.warn("ProfileData were not initialized"); }
        return this._data.bg && this._data.bg.appid ? parseInt(this._data.bg.appid) : null;
    }

    static async clearOwn() {
        if (!User.isSignedIn) { return; }
        await Background.action("clearownprofile", User.steamId);
        this._promise = null;
        return this.promise();
    }
}

ProfileData._data = {};


export class CommunityCommon {
    
    static currentUserIsOwner() {
        if (!User.isSignedIn) { return false; }

        let badgeOwnerUrl = document.querySelector(".profile_small_header_texture > a").href + "/";

        return badgeOwnerUrl === User.profileUrl;
    }

    static makeProfileLink(id, link, name, iconType, iconUrl) {
        let mainType = iconUrl ? "none" : iconType;
        let html = `<div class="es_profile_link profile_count_link">
                   <a class="es_sites_icons es_${id}_icon es_${mainType}" href="${link}" target="_blank">`;

        if (iconType !== "none" && iconUrl) {
            html += `<i class="es_sites_custom_icon es_${iconType}" style="background-image: url('${iconUrl}');"></i>`;
        }

        html += `<span class="count_link_label">${name}</span>
                <span class="profile_count_link_total">&nbsp;</span></a></div>`; // Steam spacing

        return html;
    }
}
