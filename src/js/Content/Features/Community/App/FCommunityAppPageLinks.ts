import {SyncedStorage} from "../../../../modulesCore";
import {Feature} from "../../../Modules/Feature/Feature";

import CommunityAppPageLinks from "./CommunityAppPageLinks.svelte";

export default class FCommunityAppPageLinks extends Feature {

    _node: HTMLElement;

    checkPrerequisites() {
        return (SyncedStorage.get("showsteamdb") || SyncedStorage.get("showitadlinks") || SyncedStorage.get("showbartervg"))
            && (this._node = document.querySelector(".apphub_OtherSiteInfo")) !== null;
    }

    apply() {

        const node = this._node;

        new CommunityAppPageLinks({
            "target": node,
            "props": {"appid": this.context.appid},
        });
    }

    _makeHeaderLink(cls, url, str) {
        // First whitespace intended, separates buttons
        return ` <a class="btnv6_blue_hoverfade btn_medium ${cls}" target="_blank" href="${url}">
                   <span><i class="ico16"></i>&nbsp;${str}</span>
               </a>`;
    }
}
