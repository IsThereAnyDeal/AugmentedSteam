import {ContextType} from "../../../Modules/Context/ContextType";
import CCommunityBase from "../CCommunityBase";
import FBrowseWorkshops from "./FBrowseWorkshops";

export default class CWorkshop extends CCommunityBase {

    constructor() {
        super(ContextType.WORKSHOP, [
            FBrowseWorkshops,
        ]);
    }
}
