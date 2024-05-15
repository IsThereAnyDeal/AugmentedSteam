import {ContextType} from "../../../Modules/Context/ContextType";
import CCommunityBase from "../CCommunityBase";
import FWorkshopFileSizes from "./FWorkshopFileSizes";

export default class CMyWorkshop extends CCommunityBase {

    constructor() {

        super(ContextType.MY_WORKSHOP, [
            FWorkshopFileSizes,
        ]);
    }
}
