import { ASContext, ContextTypes } from "../../ASContext.js";

import { FTotalSpent } from "./FTotalSpent.js";

export class CAccountPage extends ASContext {

    constructor() {
        super([
            FTotalSpent,
        ]);

        this.type = ContextTypes.ACCOUNT;
    }
}
