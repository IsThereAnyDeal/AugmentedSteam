import ContextType from "../../../Modules/Context/ContextType";
import {CCommunityBase} from "../CCommunityBase";
import FBrowseWorkshops from "./FBrowseWorkshops";

export class CWorkshop extends CCommunityBase {

    constructor() {
        super(ContextType.WORKSHOP, [
            FBrowseWorkshops,
        ]);
    }
}
