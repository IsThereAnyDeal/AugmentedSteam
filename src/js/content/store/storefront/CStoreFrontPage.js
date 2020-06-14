import { CStoreBase } from "../common/CStoreBase.js";
import { FHighlightStoreFront } from "./FHighlightStoreFront.js";
import { FHomePageTab } from "./FHomePageTab.js";
import { FCustomizer } from "../common/FCustomizer.js";

export class CStoreFrontPage extends CStoreBase {

    constructor() {
        super([
            FHighlightStoreFront,
            FHomePageTab,
            FCustomizer,
        ]);

        this.applyFeatures();
    }
}
