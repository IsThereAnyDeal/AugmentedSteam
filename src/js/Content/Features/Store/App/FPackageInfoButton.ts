import Feature from "@Content/Modules/Context/Feature";
import {__packageInfo} from "@Strings/_strings";
import type CApp from "@Content/Features/Store/App/CApp";
import Settings from "@Options/Data/Settings";
import HTML from "@Core/Html/Html";
import {L} from "@Core/Localization/Localization";

export default class FPackageInfoButton extends Feature<CApp> {

    override checkPrerequisites(): boolean {
        return Settings.show_package_info;
    }

    override apply(): void {
        const excluded = [
            ".bundle_hidden_by_preferences", // Bundles that are filtered due to preferences (e.g. no nudity)
            ".game_purchase_sub_dropdown", // Subscriptions (no subid)
            ".dynamic_bundle_description", // Bundles
        ].join(",");

        // Free items do not have the game_area_purchase_game_wrapper class
        for (const node of document.querySelectorAll(`.game_area_purchase_game_wrapper:not(${excluded})`)) {
            // Exclude entries that already have a "Package info" button
            if (node.querySelector(".btn_packageinfo")) { return; }

            const subid = node.querySelector<HTMLInputElement>("input[name=subid]");
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
