import {L} from "@Core/Localization/Localization";
import {__purchaseDate} from "@Strings/_strings";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import User from "@Content/Modules/User";
import Language from "@Core/Localization/Language";
import Settings from "@Options/Data/Settings";

export default class FPurchaseDate extends Feature<CApp> {

    private _node: HTMLElement|null = null

    override checkPrerequisites(): boolean {
        if (User.isSignedIn && Settings.purchase_dates) {
            this._node = document.querySelector(".game_area_already_owned .already_in_library");
        }
        return this._node !== null;
    }

    async apply() {
        const lang = Language.getCurrentSteamLanguage();
        if (!lang) {
            console.warn("Unknown language");
            return;
        }

        const appname = this.context.appName.replace(/:/g, "").trim();
        const date = await User.getPurchaseDate(lang, appname);
        if (!date) {
            console.warn("Failed to retrieve purchase date");
            return;
        }

        this._node!.textContent += ` ${L(__purchaseDate, {date})}`;
    }
}
