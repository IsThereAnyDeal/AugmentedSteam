import {HTML, Localization} from "../../../../modulesCore";
import {CallbackFeature} from "../../../modulesContent";

export default class FBadgeProgressLink extends CallbackFeature {

    checkPrerequisites() {
        return this.context.myInventory;
    }

    callback({view, appid, isBooster}) {

        if (!isBooster) { return; }

        HTML.beforeEnd(`#iteminfo${view}_item_owner_actions`,
            `<a class="btn_small btn_grey_white_innerfade" href="//steamcommunity.com/my/gamecards/${appid}/">
                <span>${Localization.str.view_badge_progress}</span>
            </a>`);
    }
}
