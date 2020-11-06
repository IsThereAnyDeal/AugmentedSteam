import ContextType from "../../../Modules/Context/ContextType";
import {CStoreBase} from "../Common/CStoreBase";
import FHighlightStoreFront from "./FHighlightStoreFront";
import FHomePageTab from "./FHomePageTab";
import FCustomizer from "../Common/FCustomizer";

export class CStoreFront extends CStoreBase {

    constructor() {
        super(ContextType.STORE_FRONT, [
            FHighlightStoreFront,
            FHomePageTab,
            FCustomizer,
        ]);
    }
}
