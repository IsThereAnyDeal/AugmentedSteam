import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules";

import FInventoryMarketHelper from "./FInventoryMarketHelper";
import FInventoryGoTo from "./FInventoryGoTo";

export class CInventory extends CCommunityBase {

    constructor() {
        super([
            FInventoryMarketHelper,
            FInventoryGoTo,
        ]);

        this.type = ContextTypes.INVENTORY;
    }
}
