import {Feature} from "../../../Modules/Content/Feature/Feature";
import {HTML, Localization} from "../../../core_modules";

export default class FBadgePageLink extends Feature {

    apply() {

        const gameAppId = parseInt((document.URL.match(/\/753\/([0-9]+)-/) || [0, 0])[1]);
        const cardType = document.URL.match("Foil(%20Trading%20Card)?%29") ? "?border=1" : "";
        if (!gameAppId || gameAppId === 753) { return; }

        HTML.beforeEnd("div.market_listing_nav",
            `<a class="btn_grey_grey btn_medium" href="https://steamcommunity.com/my/gamecards/${gameAppId + cardType}" style="float: right; margin-top: -10px;" target="_blank">
            <span>
                <img src="https://store.steampowered.com/public/images/v6/ico/ico_cards.png" style="margin: 7px 0;" width="24" height="16" border="0" align="top">
                ${Localization.str.view_badge}
            </span>
        </a>`);
    }
}
