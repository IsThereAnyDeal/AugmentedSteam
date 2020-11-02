import {Language, Localization, SyncedStorage} from "../../../core_modules";
import {Feature, User} from "../../../Modules/Content";

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
