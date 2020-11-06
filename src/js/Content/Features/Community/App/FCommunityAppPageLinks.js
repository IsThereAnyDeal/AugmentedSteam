import {HTML, SyncedStorage} from "../../../../modulesCore";
import {Feature} from "../../../Modules/Feature/Feature";

export default class FCommunityAppPageLinks extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("showsteamdb") || SyncedStorage.get("showitadlinks") || SyncedStorage.get("showbartervg");
    }

    apply() {

        const node = document.querySelector(".apphub_OtherSiteInfo");

        if (SyncedStorage.get("showsteamdb")) {
            HTML.beforeEnd(node, this._makeHeaderLink(
                "steamdb_ico",
                `https://steamdb.info/app/${this.context.appid}/`,
                "SteamDB"
            ));
        }

        if (SyncedStorage.get("showitadlinks")) {
            HTML.beforeEnd(node, this._makeHeaderLink(
                "itad_ico",
                `https://isthereanydeal.com/steam/app/${this.context.appid}/`,
                "ITAD"
            ));
        }

        if (SyncedStorage.get("showbartervg")) {
            HTML.beforeEnd(node, this._makeHeaderLink(
                "bartervg_ico",
                `https://barter.vg/steam/app/${this.context.appid}/`,
                "Barter.vg"
            ));
        }
    }

    _makeHeaderLink(cls, url, str) {
        return `<a class="btnv6_blue_hoverfade btn_medium ${cls}" target="_blank" href="${url}">
                   <span><i class="ico16"></i>&nbsp;${str}</span>
               </a>`;
    }
}
