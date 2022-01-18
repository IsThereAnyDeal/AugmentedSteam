import {ContextType, User} from "../../../modulesContent";
import {CStoreBase} from "../Common/CStoreBase";
import FCustomizer from "../Common/FCustomizer";
import FHomePageTab from "./FHomePageTab";

export class CStoreFront extends CStoreBase {

    constructor() {

        super(ContextType.STORE_FRONT, [
            FCustomizer,
            FHomePageTab,
        ]);

        if (User.isSignedIn) { // TODO ITAD status
            this.monitorStoreFront();
        }
    }
}
