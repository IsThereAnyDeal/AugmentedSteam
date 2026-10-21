import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Store/App/CApp";
import Settings from "@Options/Data/Settings";
import {__viewinclient} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import {mount} from "svelte";
import ViewInLibraryButton from "@Content/Features/Store/App/OwnedActionsButtons/ViewInLibraryButton.svelte";
import GetHelpButton from "@Content/Features/Store/App/OwnedActionsButtons/GetHelpButton.svelte";

/**
 * Handles buttons in the owned section of app page
 * Optionally hides or replaces "Install Steam" button, adds "View in Library" button and "Get Help" button
 */
export default class FOwnedActionsButtons extends Feature<CApp> {

    override async checkPrerequisites(): Promise<boolean> {
        return (this.context.user.isSignedIn
                && (Settings.installsteam !== "show" || Settings.showviewinlibrary)
            )
            || true // FIXME "get help" button settings
        ;
    }

    override async apply(): Promise<void> {
        const node = document.querySelector(".game_area_play_stats .already_owned_actions")!;
        if (!node) {
            // wrong selector or not owned
            throw new Error("Node not found");
        }

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
            mount(ViewInLibraryButton, {
                target: node,
                anchor: node.firstElementChild ?? undefined,
                props: { appid }
            });
        }

        // add help button
        mount(GetHelpButton, {
            target: node.parentElement!,
            anchor: node.nextElementSibling ?? undefined,
            props: { appid }
        });
    }
}
