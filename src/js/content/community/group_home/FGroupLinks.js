import {ASFeature} from "modules";

import {HTML, SyncedStorage} from "core";
import {CommunityCommon} from "community/common";

export class FGroupLinks extends ASFeature {

    apply() {

        let iconType = "none";
        let images = SyncedStorage.get("show_profile_link_images");
        if (images !== "none") {
            iconType = images === "color" ? "color" : "gray";
        }

        let links = [
            {
                "id": "steamgifts",
                "link": `https://www.steamgifts.com/go/group/${this.context.groupId}`,
                "name": "SteamGifts",
            }
        ];

        let html = "";
        for (let link of links) {
            if (!SyncedStorage.get(`group_${link.id}`)) { continue; }
            html += CommunityCommon.makeProfileLink(link.id, link.link, link.name, iconType);
        }

        if (html) {
            let node = document.querySelector(".responsive_hidden > .rightbox");
            if (node) {
                HTML.afterEnd(node.parentNode,
                    `<div class="rightbox_header"></div>
                    <div class="rightbox">
                        <div class="content">${html}</div>
                    </div>
                    <div class="rightbox_footer"></div>`);
            }
        }
    }
}
