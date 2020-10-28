import {Context, ContextType} from "../../../Modules/content";
import FSkipAgecheck from "../../common/FSkipAgecheck";

export class CAgeCheck extends Context {

    constructor() {
        super([
            FSkipAgecheck,
        ]);

        this.type = ContextType.AGECHECK;
    }
}
