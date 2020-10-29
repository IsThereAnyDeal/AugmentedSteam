import ContextType from "../../../Modules/Content/Context/ContextType";
import {CCommunityBase} from "../common/CCommunityBase";
import FBrowseWorkshops from "./FBrowseWorkshops";

export class CWorkshop extends CCommunityBase {

    constructor() {
        super(ContextType.WORKSHOP, [
            FBrowseWorkshops,
        ]);
    }
}
