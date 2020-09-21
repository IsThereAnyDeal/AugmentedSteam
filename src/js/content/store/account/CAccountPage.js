import {Context, ContextTypes} from "modules";

import {FTotalSpent} from "store/account/FTotalSpent";

export class CAccountPage extends Context {

    constructor() {
        super([
            FTotalSpent,
        ]);

        this.type = ContextTypes.ACCOUNT;
    }
}
