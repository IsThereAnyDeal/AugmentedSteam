import ContextType from "../../../Modules/Content/Context/ContextType";
import {CStoreBase} from "../common/CStoreBase";
import FHighlightStoreFront from "./FHighlightStoreFront";
import FHomePageTab from "./FHomePageTab";
import FCustomizer from "../common/FCustomizer";

export class CStoreFront extends CStoreBase {

    constructor() {
        super(ContextType.STORE_FRONT, [
            FHighlightStoreFront,
            FHomePageTab,
            FCustomizer,
        ]);
    }
}
