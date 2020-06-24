import {ASFeature} from "../../ASFeature.js";
import {User} from "../../common.js";
import {SyncedStorage} from "../../../core.js";
import {Language, Localization} from "../../../language.js";

export class FPurchaseDate extends ASFeature {

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
