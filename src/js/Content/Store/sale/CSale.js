import ContextType from "../../../Modules/Content/Context/ContextType";
import {CStore} from "../common/CStore";
import FRegionalPricing from "../common/FRegionalPricing";

export class CSale extends CStore {

    constructor() {
        super(ContextType.SALE, [
            FRegionalPricing,
        ]);
    }
}
