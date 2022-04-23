import {Feature} from "../../../Modules/Feature/Feature";
import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";

export default class FPackageInfoButton extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("show_package_info");
    }

    apply() {

        /**
         * Exclude
         * 1. free items (no form element to get subid, excluded by class selector)
         * 2. blurred out items (no purchase option thus no form element to get subid)
         * 3. subscriptions (no subid)
         * 4. bundles
         */
        for (const node of document.querySelectorAll(
            ".game_area_purchase_game_wrapper:not(.bundle_hidden_by_preferences, .game_purchase_sub_dropdown, .dynamic_bundle_description)"
        )) {

            const subid = node.querySelector("input[name=subid]");
            if (!subid) { continue; } // This should never happen; non-applicable items should ideally be excluded by the selector

            HTML.afterBegin(node.querySelector(".game_purchase_action"),
                `<div class="game_purchase_action_bg">
                    <div class="btn_addtocart btn_packageinfo">
                        <a class="btn_blue_steamui btn_medium" href="//store.steampowered.com/sub/${subid.value}/">
                            <span>${Localization.str.package_info}</span>
                        </a>
                    </div>
                </div>`);
        }
    }
}
