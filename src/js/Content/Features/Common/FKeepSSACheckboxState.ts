import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import type CBase from "@Content/Features/Common/CBase";
import type CRegisterKey from "@Content/Features/Store/RegisterKey/CRegisterKey";

export default class FKeepSSACheckboxState extends Feature<CBase|CRegisterKey> {

    override apply(): void {

        const selector = [
            "input#market_sell_dialog_accept_ssa",
            "input#market_buyorder_dialog_accept_ssa",
            "input#accept_ssa",
        ].join(",");

        for (const node of document.querySelectorAll<HTMLInputElement>(selector)) {
            node.checked = Settings.keepssachecked;

            node.addEventListener("click", () => {
                Settings.keepssachecked = node.checked;
            });
        }
    }
}
