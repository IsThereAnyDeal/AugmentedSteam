import {HTML, Localization, SyncedStorage} from "../../../core_modules";
import {Feature, User} from "../../../Modules/content";;

export default class FUserNotes extends Feature {

    checkPrerequisites() {
        return User.isSignedIn && SyncedStorage.get("showusernotes");
    }

    async apply() {
        const userNotes = this.context.userNotes;

        let noteText = "";
        let cssClass = "esi-note--hidden";

        let inactiveStyle = "";
        let activeStyle = "display:none;";

        if (await userNotes.exists(this.context.appid)) {
            noteText = `"${await userNotes.get(this.context.appid)}"`;
            cssClass = "";

            inactiveStyle = "display:none;";
            activeStyle = "";
        }

        HTML.beforeBegin(".queue_actions_ctn > :last-child",
            `<div class="queue_control_button js-user-note-button">
                <div id="es_add_note" class="btnv6_blue_hoverfade btn_medium queue_btn_inactive" style="${inactiveStyle}">
                    <span>${Localization.str.user_note.add}</span>
                </div>
                <div id="es_update_note" class="btnv6_blue_hoverfade btn_medium queue_btn_inactive" style="${activeStyle}">
                    <span>${Localization.str.user_note.update}</span>
                </div>
            </div>`);

        HTML.beforeEnd(".queue_actions_ctn",
            `<div id='esi-store-user-note' class='esi-note esi-note--store ${cssClass}'>${noteText}</div>`);

        function toggleState(node, active) {
            const button = document.querySelector(".js-user-note-button");
            button.querySelector("#es_add_note").style.display = active ? "none" : null;
            button.querySelector("#es_update_note").style.display = active ? null : "none";

            node.classList.toggle("esi-note--hidden", !active);
        }

        const handler = () => {
            userNotes.showModalDialog(this.context.appName, this.context.appid, "#esi-store-user-note", toggleState);
        };

        document.querySelector(".js-user-note-button").addEventListener("click", handler);
        document.querySelector("#esi-store-user-note").addEventListener("click", handler);
    }
}
