import {CCommunityBase} from "community/common/CCommunityBase";
import ContextType from "../../../Modules/Content/Context/ContextType";

import FWorkshopFileSizes from "./FWorkshopFileSizes";

export class CMyWorkshop extends CCommunityBase {

    constructor() {

        super([
            FWorkshopFileSizes,
        ]);

        this.type = ContextType.MY_WORKSHOP;
    }
}
