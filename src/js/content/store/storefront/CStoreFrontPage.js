import {CStoreBase} from "../common/CStoreBase.js";
import {ContextTypes} from "../../ASContext.js";

import {FHighlightStoreFront} from "./FHighlightStoreFront.js";
import {FHomePageTab} from "./FHomePageTab.js";
import {FCustomizer} from "../common/FCustomizer.js";

export class CStoreFrontPage extends CStoreBase {

    constructor() {
        super([
            FHighlightStoreFront,
            FHomePageTab,
            FCustomizer,
        ]);

        this.type = ContextTypes.STORE_FRONT;
    }
}
