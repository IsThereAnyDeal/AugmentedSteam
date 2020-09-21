import {ASContext, ContextTypes} from "modules";

import {FSkipAgecheck} from "common/FSkipAgecheck";

export class CAgecheckPage extends ASContext {

    constructor() {
        super([
            FSkipAgecheck,
        ]);

        this.type = ContextTypes.AGECHECK;
    }
}
