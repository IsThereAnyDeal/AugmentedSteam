import FMultiProductKeys from "./FMultiProductKeys";
import FKeepSSACheckboxState from "@Content/Features/Common/FKeepSSACheckboxState";
import Context from "@Content/Modules/Context/Context";
import ContextType from "@Content/Modules/Context/ContextType";

export default class CRegisterKey extends Context {

    constructor() {

        super(ContextType.REGISTER_KEY, [
            FMultiProductKeys,
            FKeepSSACheckboxState,
        ]);
    }
}
