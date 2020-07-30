import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules/ASContext";

import {FBackgroundSelection} from "community/profile_edit/FBackgroundSelection";
import {FStyleSelection} from "community/profile_edit/FStyleSelection";

import {ProfileData} from "community/common";

export class CProfileEditPage extends CCommunityBase {

    constructor() {
        
        super([
            FBackgroundSelection,
            FStyleSelection,
        ]);

        this.type = ContextTypes.PROFILE_EDIT;
    }

    async applyFeatures() {
        if (window.location.pathname.includes("/settings")) {
            await ProfileData.clearOwn();
        }
        return super.applyFeatures();
    }
}
