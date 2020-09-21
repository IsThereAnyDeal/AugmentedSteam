import {Context, ContextTypes} from "modules";

import {FTotalSpent} from "./FTotalSpent";

export class CAccount extends Context {

    constructor() {
        super([
            FTotalSpent,
        ]);

        this.type = ContextTypes.ACCOUNT;
    }
}
