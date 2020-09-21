import {Feature} from "modules";

import {HTML, Localization} from "core";

export class FTradeForumLink extends Feature {

    checkPrerequisites() {
        return document.querySelector(".gamecards_inventorylink") !== null;
    }

    apply() {
        HTML.beforeEnd(".gamecards_inventorylink",
            `<div style="float: right;">
                <a class="btn_grey_grey btn_medium" href="//store.steampowered.com/app/${this.context.appid}/">
                    <span>${Localization.str.visit_store}</span>
                </a>
                <a class="es_visit_tforum btn_grey_grey btn_medium" href="https://steamcommunity.com/app/${this.context.appid}/tradingforum/">
                    <span>${Localization.str.visit_trade_forum}</span>
                </a>
            </div>`);
    }
}
