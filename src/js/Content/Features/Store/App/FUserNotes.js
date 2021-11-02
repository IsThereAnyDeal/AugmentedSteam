import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {Feature, User} from "../../../modulesContent";

export default class FUserNotes extends Feature {

    checkPrerequisites() {
        return User.isSignedIn && SyncedStorage.get("user_notes_app");
    }

    async apply() {

        HTML.beforeBegin(".queue_actions_ctn > :last-child",
            `<div id="esi-user-note-button" class="queue_control_button">
                <div class="esi-add-note btnv6_blue_hoverfade btn_medium">
                    <span>${Localization.str.user_note.add}</span>
                </div>
                <div class="esi-update-note btnv6_blue_hoverfade btn_medium">
                    <span>${Localization.str.user_note.update}</span>
                </div>
            </div>`);

        HTML.beforeEnd(".queue_actions_ctn",
            '<div id="esi-store-user-note" class="esi-note esi-note--store ellipsis"></div>');

        const button = document.querySelector("#esi-user-note-button");
        const noteEl = document.querySelector("#esi-store-user-note");

        const userNotes = this.context.userNotes;
        const note = await userNotes.get(this.context.appid);

        if (note !== null) {
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
