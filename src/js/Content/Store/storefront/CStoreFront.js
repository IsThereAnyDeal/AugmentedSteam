import {CStoreBase} from "store/common/CStoreBase";
import ContextType from "../../../Modules/Content/Context/ContextType";

import FHighlightStoreFront from "./FHighlightStoreFront";
import FHomePageTab from "./FHomePageTab";
import FCustomizer from "store/common/FCustomizer";

export class CStoreFront extends CStoreBase {

    constructor() {
        super([
            FHighlightStoreFront,
            FHomePageTab,
            FCustomizer,
        ]);

        this.type = ContextType.STORE_FRONT;
    }
}
