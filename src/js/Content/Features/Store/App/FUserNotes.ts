import {__userNote_add, __userNote_update} from "@Strings/_strings";
import Settings from "@Options/Data/Settings";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";
import {L} from "@Core/Localization/Localization";
import UserNotes from "@Content/Features/Store/Common/UserNotes/UserNotes";

export default class FUserNotes extends Feature<CApp> {

    override checkPrerequisites(): boolean {
        return this.context.user.isSignedIn && Settings.user_notes_app;
    }

    override async apply(): Promise<void> {

        HTML.beforeBegin(".queue_actions_ctn > :last-child",
            `<div id="esi-user-note-button" class="queue_control_button">
                <div class="esi-add-note btnv6_blue_hoverfade btn_medium">
                    <span>${L(__userNote_add)}</span>
                </div>
                <div class="esi-update-note btnv6_blue_hoverfade btn_medium">
                    <span>${L(__userNote_update)}</span>
                </div>
            </div>`);

        HTML.beforeEnd(".queue_actions_ctn",
            '<div id="esi-store-user-note" class="esi-note esi-note--store ellipsis"></div>');

        const button = document.querySelector("#esi-user-note-button")!;
        const noteEl = document.querySelector<HTMLDivElement>("#esi-store-user-note")!;

        const userNotes = new UserNotes();
        const note = (await userNotes.get(this.context.appid)).get(this.context.appid) ?? undefined;

        if (typeof note !== "undefined") {
            button.classList.add("esi-has-note");

            noteEl.textContent = `"${note}"`;
            noteEl.classList.add("esi-has-note");
        }

        const handler = () => {
            userNotes.showModalDialog(
                this.context.appName,
                this.context.appid,
                noteEl,
                (node, active) => {
                    button.classList.toggle("esi-has-note", active);
                    node.classList.toggle("esi-has-note", active);
                }
            );
        };

        button.addEventListener("click", handler);
        noteEl.addEventListener("click", handler);
    }
}
