import {__viewBadge} from "../../../../../localization/compiled/_strings";
import {L} from "../../../../Core/Localization/Localization";
import {HTML} from "../../../../modulesCore";
import {Feature} from "../../../Modules/Feature/Feature";

export default class FBadgePageLink extends Feature {

    checkPrerequisites() {
        return this.context.appid === 753;
    }

    apply() {

        const gameAppId = parseInt(this.context.marketHashName);
        if (!gameAppId || gameAppId === 753) { return; }

        const cardType = /Foil(%20Trading%20Card)?%29/.test(this.context.marketHashName) ? "?border=1" : "";

        HTML.beforeEnd("#mainContents .market_listing_nav",
            `<a class="es_marketlistings_btn btn_grey_grey btn_medium" href="//steamcommunity.com/my/gamecards/${gameAppId + cardType}" target="_blank">
                <span>
                    <img src="//store.steampowered.com/public/images/v6/ico/ico_cards.png">
                    ${L(__viewBadge)}
                </span>
            </a>`);
    }
}
