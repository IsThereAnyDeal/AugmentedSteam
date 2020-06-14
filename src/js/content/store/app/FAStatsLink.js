import { ASFeature } from "../../ASFeature.js";
import { ExtensionResources, HTML, SyncedStorage } from "../../../core.js";
import { Localization } from "../../../language.js";

// todo maybe integrate with other useful links?
export class FAStatsLink extends ASFeature {

    checkPrerequisites() {
        return SyncedStorage.get("showastatslink") && this.context.hasAchievements();
    }

    apply() {
        let imgUrl = ExtensionResources.getURL("img/ico/astatsnl.png");
        let url = `https://astats.astats.nl/astats/Steam_Game_Info.php?AppID=${this.context.communityAppid}`;

        HTML.beforeEnd("#achievement_block",
            `<div class="game_area_details_specs">
                <div class="icon"><img class="astats_icon" src="${imgUrl}"></div>
                <a class="name" href="${url}" target="_blank">${Localization.str.view_astats}</a>
            </div>`);
    }
}
