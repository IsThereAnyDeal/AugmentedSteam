import {CStoreBase} from "store/common/CStoreBase";
import {ContextTypes} from "modules";

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

        this.type = ContextTypes.STORE_FRONT;
    }
}
