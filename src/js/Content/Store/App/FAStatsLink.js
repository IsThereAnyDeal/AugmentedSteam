import {Feature} from "../../../Modules/Content/Feature/Feature";
import {ExtensionResources, HTML, Localization, SyncedStorage} from "../../../core_modules";

// todo maybe integrate with other useful links?
export default class FAStatsLink extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("showastatslink") && this.context.hasAchievements();
    }

    apply() {
        const imgUrl = ExtensionResources.getURL("img/ico/astatsnl.png");
        const url = `https://astats.astats.nl/astats/Steam_Game_Info.php?AppID=${this.context.communityAppid}`;

        HTML.beforeEnd("#achievement_block",
            `<div class="game_area_details_specs">
                <div class="icon"><img class="astats_icon" src="${imgUrl}"></div>
                <a class="name" href="${url}" target="_blank">${Localization.str.view_astats}</a>
            </div>`);
    }
}
