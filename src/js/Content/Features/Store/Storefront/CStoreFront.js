import ContextType from "../../../Modules/Context/ContextType";
import {CStoreBase} from "../Common/CStoreBase";
import FCustomizer from "../Common/FCustomizer";
import FHomePageTab from "./FHomePageTab";

export class CStoreFront extends CStoreBase {

    constructor() {

        super(ContextType.STORE_FRONT, [
            FCustomizer,
            FHomePageTab,
        ]);
    }
}
