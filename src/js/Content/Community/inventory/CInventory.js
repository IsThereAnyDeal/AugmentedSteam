import {CCommunityBase} from "community/common/CCommunityBase";
import ContextType from "../../../Modules/Content/Context/ContextType";
import FInventoryMarketHelper from "./FInventoryMarketHelper";
import FInventoryGoTo from "./FInventoryGoTo";

export class CInventory extends CCommunityBase {

    constructor() {
        super([
            FInventoryMarketHelper,
            FInventoryGoTo,
        ]);

        this.type = ContextType.INVENTORY;
    }
}
