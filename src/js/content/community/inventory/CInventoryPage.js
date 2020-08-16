import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules/ASContext";

import {FInventoryMarketHelper} from "community/inventory/FInventoryMarketHelper";
import {FInventoryGoTo} from "community/inventory/FInventoryGoTo";

export class CInventoryPage extends CCommunityBase {

    constructor() {
        super([
            FInventoryMarketHelper,
            FInventoryGoTo,
        ]);

        this.type = ContextTypes.INVENTORY;

        this.triggerCallbacks();

        new MutationObserver(() => {
            this.triggerCallbacks();
        }).observe(document.querySelector("div.games_list_tabs"), {subtree: true, attributes: true});
    }
}
