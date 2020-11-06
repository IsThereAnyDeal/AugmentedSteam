import {Context, ContextType} from "../../../modulesContent";
import FSkipAgecheck from "../../Common/FSkipAgecheck";

export class CAgeCheck extends Context {

    constructor() {
        super(ContextType.AGECHECK, [
            FSkipAgecheck,
        ]);
    }
}
