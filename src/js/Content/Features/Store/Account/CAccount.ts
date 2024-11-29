import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import FUsefulLinks from "./FUsefulLinks";
import ContextType from "@Content/Modules/Context/ContextType";

export default class CAccount extends Context {

    constructor(params: ContextParams) {

        super(params, ContextType.ACCOUNT, [
            FUsefulLinks,
        ]);
    }
}
