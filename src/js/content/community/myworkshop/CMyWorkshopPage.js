import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules";

import {FWorkshopFileSizes} from "./FWorkshopFileSizes";

export class CMyWorkshopPage extends CCommunityBase {

    constructor() {
        
        super([
            FWorkshopFileSizes,
        ]);

        this.type = ContextTypes.MY_WORKSHOP;
    }
}
