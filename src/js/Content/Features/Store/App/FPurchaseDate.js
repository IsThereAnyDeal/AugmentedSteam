import {L} from "@Core/Localization/Localization";
import {__purchaseDate} from "@Strings/_strings";
import {Language, SyncedStorage} from "../../../../modulesCore";
import {Feature, User} from "../../../modulesContent";

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

        this._node.textContent += ` ${L(__purchaseDate, {date})}`;
    }
}
