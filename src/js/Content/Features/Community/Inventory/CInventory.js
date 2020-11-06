import ContextType from "../../../Modules/Context/ContextType";
import {CCommunityBase} from "../CCommunityBase";
import FInventoryMarketHelper from "./FInventoryMarketHelper";
import FInventoryGoTo from "./FInventoryGoTo";

export class CInventory extends CCommunityBase {

    constructor() {
        super(ContextType.INVENTORY, [
            FInventoryMarketHelper,
            FInventoryGoTo,
        ]);
    }
}
