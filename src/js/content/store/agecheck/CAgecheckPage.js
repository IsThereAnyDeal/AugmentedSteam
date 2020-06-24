import {ASContext, ContextTypes} from "../../ASContext.js";

import {FSkipAgecheck} from "../../common/FSkipAgecheck.js";

export class CAgecheckPage extends ASContext {

    constructor() {
        super([
            FSkipAgecheck,
        ]);

        this.type = ContextTypes.AGECHECK;
    }
}
