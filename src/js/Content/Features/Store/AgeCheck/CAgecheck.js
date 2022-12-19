import {Context, ContextType} from "../../../modulesContent";
import FSkipAgecheck from "../../Common/FSkipAgecheck";
import FBackToTop from "../../Common/FBackToTop";
import FFocusSearch from "../../Common/FFocusSearch";

export class CAgeCheck extends Context {

    constructor() {

        super(ContextType.AGECHECK, [
            FSkipAgecheck,
            FBackToTop,
            FFocusSearch,
        ]);
    }
}
