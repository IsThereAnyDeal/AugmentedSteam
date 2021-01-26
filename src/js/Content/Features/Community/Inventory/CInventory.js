import ContextType from "../../../Modules/Context/ContextType";
import {CCommunityBase} from "../CCommunityBase";
import FInventoryMarketHelper from "./FInventoryMarketHelper";
import FInventoryGoTo from "./FInventoryGoTo";

export class CInventory extends CCommunityBase {

    constructor() {
        // Don't apply features on empty or private inventories
        if (document.getElementById("no_inventories")) {
            super(ContextType.INVENTORY);
            return;
        }

        super(ContextType.INVENTORY, [
            FInventoryMarketHelper,
            FInventoryGoTo,
        ]);
    }
}
