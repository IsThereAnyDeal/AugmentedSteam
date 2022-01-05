import {CommunityUtils, Feature} from "../../../modulesContent";
import {HTML, SyncedStorage} from "../../../../modulesCore";

export default class FGroupLinks extends Feature {

    apply() {

        const links = [
            {
                "id": "steamgifts",
                "link": `https://www.steamgifts.com/go/group/${this.context.groupId}`,
                "name": "SteamGifts",
            }
        ];

        let html = "";
        const iconType = SyncedStorage.get("show_profile_link_images");

        for (const {id, link, name} of links) {
            if (!SyncedStorage.get(`group_${id}`)) { continue; }
            html += CommunityUtils.makeProfileLink(id, link, name, iconType);
        }

        if (html) {
            const node = document.querySelector(".responsive_hidden > .rightbox");
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
