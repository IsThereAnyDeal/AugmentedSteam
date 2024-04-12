import {__viewBadgeProgress} from "../../../../../localization/compiled/_strings";
import {L} from "../../../../Core/Localization/Localization";
import {HTML} from "../../../../modulesCore";
import {CallbackFeature} from "../../../modulesContent";

export default class FBadgeProgressLink extends CallbackFeature {

    checkPrerequisites() {
        return this.context.myInventory;
    }

    callback({view, appid, itemType}) {

        if (itemType !== "booster") { return; }

        HTML.beforeEnd(`#iteminfo${view}_item_owner_actions`,
            `<a class="btn_small btn_grey_white_innerfade" href="//steamcommunity.com/my/gamecards/${appid}/">
                <span>${L(__viewBadgeProgress)}</span>
            </a>`);
    }
}
