import FKeepSSACheckboxState from "../../Common/FKeepSSACheckboxState";
import FFocusSearch from "../../Common/FFocusSearch";
import FMultiProductKeys from "./FMultiProductKeys";
import Context from "@Content/Modules/Context/Context";
import {ContextType} from "@Content/Modules/Context/ContextType";

export default class CRegisterKey extends Context {

    constructor() {

        super(ContextType.REGISTER_KEY, [
            FKeepSSACheckboxState,
            FFocusSearch,
            FMultiProductKeys,
        ]);
    }
}
