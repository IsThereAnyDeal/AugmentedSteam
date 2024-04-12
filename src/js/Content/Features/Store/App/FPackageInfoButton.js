import {__packageInfo} from "@Strings/_strings";
import {L} from "../../../../Core/Localization/Localization";
import {HTML, SyncedStorage} from "../../../../modulesCore";
import {Feature} from "../../../Modules/Feature/Feature";

export default class FPackageInfoButton extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("show_package_info");
    }

    apply() {
        const excluded = [
            ".bundle_hidden_by_preferences", // Bundles that are filtered due to preferences (e.g. no nudity)
            ".game_purchase_sub_dropdown", // Subscriptions (no subid)
            ".dynamic_bundle_description", // Bundles
        ].join(",");

        // Free items do not have the game_area_purchase_game_wrapper class
        for (const node of document.querySelectorAll(`.game_area_purchase_game_wrapper:not(${excluded})`)) {
            // Exclude entries that already have a "Package info" button
            if (node.querySelector(".btn_packageinfo")) { return; }

            const subid = node.querySelector("input[name=subid]");
            if (!subid) { continue; } // This should never happen; non-applicable items should ideally be excluded by the selector

            HTML.afterBegin(node.querySelector(".game_purchase_action"),
                `<div class="game_purchase_action_bg">
                    <div class="btn_addtocart btn_packageinfo">
                        <a class="btn_blue_steamui btn_medium" href="//store.steampowered.com/sub/${subid.value}/">
                            <span>${L(__packageInfo)}</span>
                        </a>
                    </div>
                </div>`);
        }
    }
}
