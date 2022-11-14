import {SyncedStorage} from "../../../Core/Storage/SyncedStorage";
import {Feature} from "../../Modules/Feature/Feature";

export default class FKeepSSACheckboxState extends Feature {

    apply() {

        const selector = [
            "#market_sell_dialog_accept_ssa",
            "#market_buyorder_dialog_accept_ssa",
            "#accept_ssa",
        ].join(",");

        for (const node of document.querySelectorAll(selector)) {
            node.checked = SyncedStorage.get("keepssachecked");

            node.addEventListener("click", () => {
                SyncedStorage.set("keepssachecked", !SyncedStorage.get("keepssachecked"));
            });
        }
    }
}
