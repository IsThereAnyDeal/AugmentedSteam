import {HTML, SyncedStorage} from "../../../core_modules";
import {Feature, Stats} from "../../../Modules/content";

export default class FAchievementBar extends Feature {

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
