import { ASFeature } from "../../ASFeature.js";
import { HTML, SyncedStorage } from "../../../core.js";
import { Stats } from "../../common.js";

export class FAchievementBar extends ASFeature {

    checkPrerequisites() {
        return SyncedStorage.get("showachinstore") && this.context.hasAchievements() && document.getElementById("my_activity");
    }

    async apply() {
        let achieveBar = await Stats.getAchievementBar("/my", this.context.communityAppid);
        if (!achieveBar) {
            console.warn("Failed to retrieve achievement stats");
            return;
        }
        
        HTML.afterBegin("#my_activity", `<div class="es-achieveBar-store">${achieveBar}</div>`);
    }
}