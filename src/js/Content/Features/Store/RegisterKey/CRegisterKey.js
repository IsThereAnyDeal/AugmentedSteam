import {Context, ContextType} from "../../../modulesContent";
import FKeepSSACheckboxState from "../../Common/FKeepSSACheckboxState";
import FFocusSearch from "../../Common/FFocusSearch";
import FMultiProductKeys from "./FMultiProductKeys";

export class CRegisterKey extends Context {

    constructor() {

        super(ContextType.REGISTER_KEY, [
            FKeepSSACheckboxState,
            FFocusSearch,
            FMultiProductKeys,
        ]);
    }
}
