import {Feature} from "../../../Modules/Feature/Feature";
import {HTML, Localization} from "../../../../modulesCore";

export default class FBadgePageLink extends Feature {

    checkPrerequisites() {
        return this.context.appid === 753;
    }

    apply() {

        const gameAppId = parseInt(this.context.marketHashName);
        if (!gameAppId || gameAppId === 753) { return; }

        const cardType = /Foil(%20Trading%20Card)?%29/.test(this.context.marketHashName) ? "?border=1" : "";

        HTML.beforeEnd("div.market_listing_nav",
            `<a class="btn_grey_grey btn_medium" href="https://steamcommunity.com/my/gamecards/${gameAppId + cardType}" style="float: right; margin-top: -10px;" target="_blank">
            <span>
                <img src="https://store.steampowered.com/public/images/v6/ico/ico_cards.png" style="margin: 7px 0;" width="24" height="16" border="0" align="top">
                ${Localization.str.view_badge}
            </span>
        </a>`);
    }
}
