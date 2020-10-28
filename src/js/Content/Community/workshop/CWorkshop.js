import {CCommunityBase} from "community/common/CCommunityBase";
import ContextType from "../../../Modules/Content/Context/ContextType";

import FBrowseWorkshops from "./FBrowseWorkshops";

export class CWorkshop extends CCommunityBase {

    constructor() {
        super([
            FBrowseWorkshops,
        ]);

        this.type = ContextType.WORKSHOP;
    }
}
