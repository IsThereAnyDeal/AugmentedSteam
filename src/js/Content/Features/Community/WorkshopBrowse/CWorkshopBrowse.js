import ContextType from "../../../Modules/Context/ContextType";
import {CCommunityBase} from "../CCommunityBase";
import FWorkshopSubscriberButtons from "./FWorkshopSubscriberButtons";

export class CWorkshopBrowse extends CCommunityBase {

    constructor() {
        super(ContextType.WORKSHOP_BROWSE, [
            FWorkshopSubscriberButtons,
        ]);
    }
}
