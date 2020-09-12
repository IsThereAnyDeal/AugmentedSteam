import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules/ASContext";

import {FWorkshopFileSizes} from "./FWorkshopFileSizes";

export class CMyWorkshopPage extends CCommunityBase {

    constructor() {
        
        super([
            FWorkshopFileSizes,
        ]);

        this.type = ContextTypes.MY_WORKSHOP;
    }
}
