import {L} from "@Core/Localization/Localization";
import {__purchaseDate, __seePurchaseDate} from "@Strings/_strings";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import SteamStoreApiFacade from "@Content/Modules/Facades/SteamStoreApiFacade";
import {DateTime} from "luxon";

export default class FPurchaseDate extends Feature<CApp> {

    private _node: HTMLElement|null = null

    override checkPrerequisites(): boolean {
        if (this.context.user.isSignedIn && Settings.purchase_dates) {
            this._node = document.querySelector(".game_area_already_owned .already_in_library");
        }
        return this._node !== null;
    }

    async apply() {
        const date = await SteamStoreApiFacade.getPurchaseDate(this.context.appid);

        if (date === 0) {
            const a = document.createElement("a");
            a.href = `https://help.steampowered.com/wizard/HelpWithGame?appid=${this.context.appid}`;
            a.innerText = ` (${L(__seePurchaseDate)})`

            this._node?.appendChild(a);
        } else {
            const datetime = DateTime.fromSeconds(date);

            this._node!.textContent += ` ${L(__purchaseDate, {
                date: datetime.toLocaleString({
                    dateStyle: "medium"
                }, {
                    locale: this.context.language?.code ?? undefined
                })
            })}`;
        }
    }
}
