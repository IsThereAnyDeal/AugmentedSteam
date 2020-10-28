import {Context, ContextTypes} from "../../../Modules/content";
import FSkipAgecheck from "common/FSkipAgecheck";

export class CAgecheck extends Context {

    constructor() {
        super([
            FSkipAgecheck,
        ]);

        this.type = ContextTypes.AGECHECK;
    }
}
