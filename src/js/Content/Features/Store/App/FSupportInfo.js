import {GameId, HTML, LocalStorage, Localization, SyncedStorage} from "../../../../modulesCore";
import {Background, Feature} from "../../../modulesContent";

export default class FSupportInfo extends Feature {

    async checkPrerequisites() {
        if (!SyncedStorage.get("showsupportinfo")) { return false; }

        let cache = LocalStorage.get("support_info");

        // todo IDB
        if (!cache || !cache.expiry || cache.expiry < Date.now()) {
            cache = {
                "data": {},
                "expiry": Date.now() + (31 * 86400 * 1000) // 31 days
            };
        }

        // Attempt to get appid of parent app first for DLCs and Soundtracks
        const appid = GameId.getAppid(document.querySelector(".glance_details a")) || this.context.appid;
        this._supportInfo = cache.data[appid];

        if (!this._supportInfo) {
            const response = await Background.action("appdetails", appid, "support_info");
            if (!response || !response.success) {
                console.warn("Failed to retrieve support info");
                return false;
            }

            this._supportInfo = response.data.support_info;

            cache.data[appid] = this._supportInfo;
            LocalStorage.set("support_info", cache);
        }

        return Boolean(this._supportInfo.url || this._supportInfo.email);
    }

    apply() {

        let {url, email} = this._supportInfo;
        const links = [];

        if (url) {
            url = /^https?:\/\//.test(url) ? url : `//${url}`;
            links.push(`<a href="${url}">${Localization.str.website}</a>`);
        }

        if (email) {

            // From https://emailregex.com/
            const emailRegex
                = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

            if (emailRegex.test(email)) {
                links.push(`<a href="mailto:${email}">${Localization.str.email}</a>`);
            } else {
                links.push(`<a href="${email}">${Localization.str.contact}</a>`);
            }
        }

        HTML.beforeEnd(".glance_ctn_responsive_left",
            `<div class="release_date" style="padding-bottom: 0;">
                <div class="subtitle column">${Localization.str.support}:</div>
                <div class="summary column">${links.join(", ")}</div>
            </div>`);
    }
}
