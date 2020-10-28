import {CCommunityBase} from "community/common/CCommunityBase";
import ContextType from "../../../Modules/Content/Context/ContextType";

import FWorkshopSubscriberButtons from "./FWorkshopSubscriberButtons";

export class CWorkshopBrowse extends CCommunityBase {

    constructor() {
        super([
            FWorkshopSubscriberButtons,
        ]);

        this.type = ContextType.WORKSHOP_BROWSE;
    }
}
