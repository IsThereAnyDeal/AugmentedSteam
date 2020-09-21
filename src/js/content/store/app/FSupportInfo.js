import {ASFeature} from "modules";

import {HTML, LocalStorage, Localization, SyncedStorage} from "core";
import {Background} from "common";

export class FSupportInfo extends ASFeature {

    async checkPrerequisites() {
        if (this.context.isDlc() || !SyncedStorage.get("showsupportinfo")) { return false; }

        let cache = LocalStorage.get("support_info", null);

        // todo IDB
        if (!cache || !cache.expiry || cache.expiry < Date.now()) {
            cache = {
                "data": {},
                "expiry": Date.now() + (31 * 86400 * 1000) // 31 days
            };
        }

        const appid = this.context.appid;
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

        return this._supportInfo.url || this._supportInfo.email;
    }

    apply() {

        const url = this._supportInfo.url;
        const email = this._supportInfo.email;

        let support = "";
        if (url) {
            support += `<a href="${url}">${Localization.str.website}</a>`;
        }

        if (email) {
            if (url) {
                support += ", ";
            }

            // From https://emailregex.com/
            const emailRegex
                = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

            if (emailRegex.test(email)) {
                support += `<a href="mailto:${email}">${Localization.str.email}</a>`;
            } else {
                support += `<a href="${email}">${Localization.str.contact}</a>`;
            }
        }

        HTML.beforeEnd(".glance_ctn .user_reviews",
            `<div class="release_date">
                <div class="subtitle column">${Localization.str.support}:</div>
                <div class="summary column" id="es_support_list">${support}</div>
            </div>`);
    }
}
