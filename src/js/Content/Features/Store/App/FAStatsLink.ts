import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import ExtensionResources from "@Core/ExtensionResources";
import HTML from "@Core/Html/Html";
import {L} from "@Core/Localization/Localization";
import {__viewAstats} from "@Strings/_strings";
import Settings from "@Options/Data/Settings";

// todo maybe integrate with other useful links?
export default class FAStatsLink extends Feature<CApp> {

    override checkPrerequisites(): boolean {
        return Settings.showastatslink && this.context.hasAchievements;
    }

    override apply(): void {
        const imgUrl = ExtensionResources.getURL("img/ico/astatsnl.png");
        const url = `https://astats.astats.nl/astats/Steam_Game_Info.php?AppID=${this.context.communityAppid}`;

        HTML.beforeEnd("#achievement_block",
            `<div class="game_area_details_specs">
                <div class="icon"><img class="astats_icon" src="${imgUrl}"></div>
                <a class="name es_external_icon" href="${url}" target="_blank">${L(__viewAstats)}</a>
            </div>`);
    }
}
