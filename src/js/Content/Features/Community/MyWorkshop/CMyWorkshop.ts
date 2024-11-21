import ContextType from "@Content/Modules/Context/ContextType";
import CCommunityBase from "../CCommunityBase";
import FWorkshopFileSizes from "./FWorkshopFileSizes";
import type {ContextParams} from "@Content/Modules/Context/Context";

export default class CMyWorkshop extends CCommunityBase {

    constructor(params: ContextParams) {

        super(params, ContextType.MY_WORKSHOP, [
            FWorkshopFileSizes,
        ]);
    }
}
