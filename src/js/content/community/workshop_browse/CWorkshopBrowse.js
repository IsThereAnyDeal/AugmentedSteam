import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules";

import {FWorkshopSubscriberButtons} from "./FWorkshopSubscriberButtons";

export class CWorkshopBrowse extends CCommunityBase {

    constructor() {
        super([
            FWorkshopSubscriberButtons,
        ]);

        this.type = ContextTypes.WORKSHOP_BROWSE;
    }
}