import {ASContext, ContextTypes} from "modules";

import {FTotalSpent} from "store/account/FTotalSpent";

export class CAccountPage extends ASContext {

    constructor() {
        super([
            FTotalSpent,
        ]);

        this.type = ContextTypes.ACCOUNT;
    }
}
