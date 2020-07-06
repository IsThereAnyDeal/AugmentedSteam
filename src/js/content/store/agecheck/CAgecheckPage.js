import {ASContext, ContextTypes} from "modules/ASContext";

import {FSkipAgecheck} from "common/FSkipAgecheck";

export class CAgecheckPage extends ASContext {

    constructor() {
        super([
            FSkipAgecheck,
        ]);

        this.type = ContextTypes.AGECHECK;
    }
}
