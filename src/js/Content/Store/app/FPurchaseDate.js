import {Feature} from "modules";

import {Language} from "../../../Core/Localization/Language";
import {Localization} from "../../../Core/Localization/Localization";
import {SyncedStorage} from "../../../Core/Storage/SyncedStorage";

import {User} from "common";

export default class FPurchaseDate extends Feature {

    checkPrerequisites() {
        if (User.isSignedIn && SyncedStorage.get("purchase_dates")) {
            this._node = document.querySelector(".game_area_already_owned .already_in_library");
            return this._node;
        }
        return false;
    }

    async apply() {
        const appname = this.context.appName.replace(/:/g, "").trim();
        const date = await User.getPurchaseDate(Language.getCurrentSteamLanguage(), appname);
        if (!date) {
            console.warn("Failed to retrieve purchase date");
            return;
        }

        this._node.textContent += ` ${Localization.str.purchase_date.replace("__date__", date)}`;
    }
}
