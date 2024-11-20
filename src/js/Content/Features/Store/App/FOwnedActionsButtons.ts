import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Store/App/CApp";
import Settings from "@Options/Data/Settings";
import HTML from "@Core/Html/Html";
import {__getHelp, __viewinclient, __viewInLibrary} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";

export default class FOwnedActionsButtons extends Feature<CApp> {

    override checkPrerequisites(): boolean {
        return this.context.user.isSignedIn
            && document.querySelector(".game_area_play_stats .already_owned_actions") !== null;
    }

    override apply(): void {

        const node = document.querySelector(".game_area_play_stats .already_owned_actions")!;
        const appid = this.context.appid;

        // handle Install Steam button
        const btn = node.querySelector<HTMLAnchorElement>("a[href^='https://store.steampowered.com/about/']")!;
        const option = Settings.installsteam;
        if (option === "hide") {
            btn.remove();
        } else if (option === "replace") {
            btn.querySelector("span")!.textContent = L(__viewinclient);
            btn.href = `steam://store/${appid}`;
        }

        // add view in library button
        if (Settings.showviewinlibrary) {
            HTML.afterBegin(node,
                `<div class="game_area_already_owned_btn">
                    <a class="btnv6_lightblue_blue btnv6_border_2px btn_medium" href="steam://nav/games/details/${appid}">
                        <span>${L(__viewInLibrary)}</span>
                    </a>
                </div>`);
        }

        // add help button
        HTML.afterEnd(node,
            `<div class="game_area_already_owned_btn">
                <a class="btnv6_lightblue_blue btnv6_border_2px btn_medium" href="//help.steampowered.com/wizard/HelpWithGame/?appid=${appid}">
                    <span>${L(__getHelp)}</span>
                </a>
            </div>`);
    }
}
