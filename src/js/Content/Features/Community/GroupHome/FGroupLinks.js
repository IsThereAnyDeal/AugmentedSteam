import {CommunityUtils, Feature} from "../../../modulesContent";
import {HTML, SyncedStorage} from "../../../../modulesCore";

export default class FGroupLinks extends Feature {

    apply() {

        let iconType = "none";
        const images = SyncedStorage.get("show_profile_link_images");
        if (images !== "none") {
            iconType = images === "color" ? "color" : "gray";
        }

        const links = [
            {
                "id": "steamgifts",
                "link": `https://www.steamgifts.com/go/group/${this.context.groupId}`,
                "name": "SteamGifts",
            }
        ];

        let html = "";
        for (const link of links) {
            if (!SyncedStorage.get(`group_${link.id}`)) { continue; }
            html += CommunityUtils.makeProfileLink(link.id, link.link, link.name, iconType);
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
