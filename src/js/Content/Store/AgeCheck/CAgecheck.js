import {Context, ContextType} from "../../../Modules/Content";
import FSkipAgecheck from "../../Common/FSkipAgecheck";

export class CAgeCheck extends Context {

    constructor() {
        super(ContextType.AGECHECK, [
            FSkipAgecheck,
        ]);
    }
}
