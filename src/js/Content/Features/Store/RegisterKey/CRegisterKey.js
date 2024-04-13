import {ContextType} from "../../../modulesContent";
import {CStoreBase} from "../Common/CStoreBase";
import FMultiProductKeys from "./FMultiProductKeys";

export class CRegisterKey extends CStoreBase {

    constructor() {

        super(ContextType.REGISTER_KEY, [
            FMultiProductKeys,
        ]);
    }
}
