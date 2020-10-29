import ContextType from "../../../Modules/Content/Context/ContextType";
import {CCommunityBase} from "../common/CCommunityBase";
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
