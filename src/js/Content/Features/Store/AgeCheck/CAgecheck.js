import {ContextType} from "../../../modulesContent";
import {CStoreBase} from "../Common/CStoreBase";
import FSkipAgecheck from "../../Common/FSkipAgecheck";

export class CAgeCheck extends CStoreBase {

    constructor() {

        super(ContextType.AGECHECK, [
            FSkipAgecheck,
        ]);
    }
}
