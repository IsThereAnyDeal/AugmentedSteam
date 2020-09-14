import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules/ASContext";

import {FWorkshopSubscriberButtons} from "./FWorkshopSubscriberButtons";

export class CWorkshopBrowsePage extends CCommunityBase {

    constructor() {
        super([
            FWorkshopSubscriberButtons,
        ]);

        this.type = ContextTypes.WORKSHOP_BROWSE;
    }
}