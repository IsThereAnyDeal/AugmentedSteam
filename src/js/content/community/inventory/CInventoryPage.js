import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules";

import {FInventoryMarketHelper} from "community/inventory/FInventoryMarketHelper";
import {FInventoryGoTo} from "community/inventory/FInventoryGoTo";

export class CInventoryPage extends CCommunityBase {

    constructor() {
        super([
            FInventoryMarketHelper,
            FInventoryGoTo,
        ]);

        this.type = ContextTypes.INVENTORY;
    }
}
