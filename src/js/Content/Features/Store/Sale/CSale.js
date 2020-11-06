import ContextType from "../../../Modules/Context/ContextType";
import {CStore} from "../Common/CStore";
import FRegionalPricing from "../Common/FRegionalPricing";

export class CSale extends CStore {

    constructor() {
        super(ContextType.SALE, [
            FRegionalPricing,
        ]);
    }
}
