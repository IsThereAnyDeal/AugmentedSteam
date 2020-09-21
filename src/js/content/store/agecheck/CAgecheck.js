import {Context, ContextTypes} from "modules";

import {FSkipAgecheck} from "common/FSkipAgecheck";

export class CAgecheck extends Context {

    constructor() {
        super([
            FSkipAgecheck,
        ]);

        this.type = ContextTypes.AGECHECK;
    }
}
