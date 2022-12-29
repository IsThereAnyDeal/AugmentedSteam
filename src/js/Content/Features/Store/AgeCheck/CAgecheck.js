import {Context, ContextType} from "../../../modulesContent";
import FSkipAgecheck from "../../Common/FSkipAgecheck";
import FFocusSearch from "../../Common/FFocusSearch";

export class CAgeCheck extends Context {

    constructor() {

        super(ContextType.AGECHECK, [
            FSkipAgecheck,
            FFocusSearch,
        ]);
    }
}
