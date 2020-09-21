import {ASFeature} from "modules";

import {HTML, Localization, SyncedStorage} from "core";
import {User} from "common";

export class FOwnedActionsButtons extends ASFeature {

    checkPrerequisites() {
        return User.isSignedIn && document.querySelector(".game_area_play_stats .already_owned_actions");
    }

    apply() {

        const node = document.querySelector(".game_area_play_stats .already_owned_actions");
        const appid = this.context.appid;

        // handle Install Steam button
        const btn = node.querySelector("a[href^='https://store.steampowered.com/about/']");
        const option = SyncedStorage.get("installsteam");
        if (option === "hide") {
            btn.remove();
        } else if (option === "replace") {
            btn.querySelector("span").textContent = Localization.str.viewinclient;
            btn.href = `steam://store/${appid}`;
        }

        // add view in library button
        if (SyncedStorage.get("showviewinlibrary")) {
            HTML.afterBegin(node,
                `<div class="game_area_already_owned_btn">
                    <a class="btnv6_lightblue_blue btnv6_border_2px btn_medium" href="steam://nav/games/details/${appid}">
                        <span>${Localization.str.view_in_library}</span>
                    </a>
                </div>`);
        }

        // add help button
        HTML.afterEnd(node,
            `<div class="game_area_already_owned_btn">
                <a class="btnv6_lightblue_blue btnv6_border_2px btn_medium" href="//help.steampowered.com/wizard/HelpWithGame/?appid=${appid}">
                    <span>${Localization.str.get_help}</span>
                </a>
            </div>`);
    }
}
