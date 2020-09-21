import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules";

import FBrowseWorkshops from "./FBrowseWorkshops";

export class CWorkshop extends CCommunityBase {

    constructor() {
        super([
            FBrowseWorkshops,
        ]);

        this.type = ContextTypes.WORKSHOP;
    }
}