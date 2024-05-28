import AppId from "@Core/GameId/AppId";
import {L} from "@Core/Localization/Localization";
import {__contact, __email, __support, __website} from "@Strings/_strings";
import type CApp from "@Content/Features/Store/App/CApp";
import Settings from "@Options/Data/Settings";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";
import LocalStorage from "@Core/Storage/LocalStorage";
import SteamStoreApiFacade from "@Content/Modules/Facades/SteamStoreApiFacade";
import type {TAppDetail} from "@Background/Modules/Store/_types";

export default class FSupportInfo extends Feature<CApp> {

    private _supportInfo: any = null; // TODO fix type

    override async checkPrerequisites(): Promise<boolean> {
        if (!Settings.showsupportinfo) { return false; }

        let cache = (await LocalStorage.get("support_info")) ?? null;

        // todo IDB
        if (!cache || !cache.expiry || cache.expiry < Date.now()) {
            cache = {
                data: {},
                expiry: Date.now() + (31 * 86400 * 1000) // 31 days
            };
        }

        // Attempt to get appid of parent app first for DLCs and Soundtracks
        const appid = AppId.fromElement(document.querySelector(".glance_details a")) || this.context.appid;
        this._supportInfo = cache.data[appid];

        if (!this._supportInfo) {
            const response: TAppDetail|null = await SteamStoreApiFacade.fetchAppDetails(appid, "support_info");
            if (!response) {
                console.warn("Failed to retrieve support info");
                return false;
            }

            this._supportInfo = response.support_info;

            cache.data[appid] = this._supportInfo;
            LocalStorage.set("support_info", cache);
        }

        return Boolean(this._supportInfo.url || this._supportInfo.email);
    }

    override apply(): void {

        let {url, email} = this._supportInfo;
        const links = [];

        if (url) {
            url = HTML.formatUrl(url);
            links.push(`<a href="${url}">${L(__website)}</a>`);
        }

        if (email) {

            // From https://emailregex.com/
            const emailRegex
                = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

            if (emailRegex.test(email)) {
                links.push(`<a href="mailto:${email}">${L(__email)}</a>`);
            } else {
                links.push(`<a href="${email}">${L(__contact)}</a>`);
            }
        }

        HTML.beforeEnd(".glance_ctn_responsive_left",
            `<div class="release_date" style="padding-bottom: 0;">
                <div class="subtitle column">${L(__support)}:</div>
                <div class="summary column">${links.join(", ")}</div>
            </div>`);
    }
}
