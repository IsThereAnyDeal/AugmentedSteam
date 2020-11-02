import ContextType from "../../../Modules/Content/Context/ContextType";
import {CCommunityBase} from "../CCommunityBase";

import FWorkshopFileSizes from "./FWorkshopFileSizes";

export class CMyWorkshop extends CCommunityBase {

    constructor() {

        super(ContextType.MY_WORKSHOP, [
            FWorkshopFileSizes,
        ]);
    }
}
