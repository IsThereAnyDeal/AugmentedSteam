import {SyncedStorage} from "../../../Core/Storage/SyncedStorage";
import {Feature} from "../../Modules/Feature/Feature";

export default class FDefaultCommunityTab extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("community_default_tab") !== ""; // Default value is an empty string
    }

    apply() {

        const tab = SyncedStorage.get("community_default_tab");

        const links = document.querySelectorAll("a[href^='https://steamcommunity.com/app/']");
        for (const link of links) {
            if (link.classList.contains("apphub_sectionTab")) { continue; }
            if (!/^\/app\/[0-9]+\/?$/.test(link.pathname)) { continue; }
            if (!link.pathname.endsWith("/")) {
                link.pathname += "/";
            }
            link.pathname += `${tab}/`;
        }
    }
}
