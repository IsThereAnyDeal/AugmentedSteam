import FSkipAgecheck from "../../Common/FSkipAgecheck";
import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import ContextType from "@Content/Modules/Context/ContextType";

export default class CAgeCheck extends Context {

    constructor(params: ContextParams) {

        super(params, ContextType.AGECHECK, [
            FSkipAgecheck,
        ]);
    }
}
