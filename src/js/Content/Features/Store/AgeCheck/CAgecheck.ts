import FSkipAgecheck from "../../Common/FSkipAgecheck";
import FFocusSearch from "../../Common/FFocusSearch";
import Context from "@Content/Modules/Context/Context";
import {ContextType} from "@Content/Modules/Context/ContextType";

export default class CAgeCheck extends Context {

    constructor() {

        super(ContextType.AGECHECK, [
            FSkipAgecheck,
            FFocusSearch,
        ]);
    }
}
