import FMultiProductKeys from "./FMultiProductKeys";
import FKeepSSACheckboxState from "@Content/Features/Common/FKeepSSACheckboxState";
import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import ContextType from "@Content/Modules/Context/ContextType";

export default class CRegisterKey extends Context {

    constructor(params: ContextParams) {

        super(params, ContextType.REGISTER_KEY, [
            FMultiProductKeys,
            FKeepSSACheckboxState,
        ]);
    }
}
