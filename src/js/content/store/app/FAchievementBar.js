import {ASFeature} from "modules";
import {HTML, SyncedStorage} from "core";
import {Stats} from "common";

export class FAchievementBar extends ASFeature {

    checkPrerequisites() {
        return SyncedStorage.get("showachinstore") && this.context.hasAchievements() && document.getElementById("my_activity");
    }

    async apply() {
        const achieveBar = await Stats.getAchievementBar("/my", this.context.communityAppid);
        if (!achieveBar) {
            console.warn("Failed to retrieve achievement stats");
            return;
        }

        HTML.afterBegin("#my_activity", `<div class="es-achieveBar-store">${achieveBar}</div>`);
    }
}
