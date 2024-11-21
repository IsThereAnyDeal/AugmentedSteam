import ContextType from "@Content/Modules/Context/ContextType";
import CCommunityBase from "../CCommunityBase";
import FBrowseWorkshops from "./FBrowseWorkshops";
import type {ContextParams} from "@Content/Modules/Context/Context";

export default class CWorkshop extends CCommunityBase {

    constructor(params: ContextParams) {
        super(params, ContextType.WORKSHOP, [
            FBrowseWorkshops,
        ]);
    }
}
