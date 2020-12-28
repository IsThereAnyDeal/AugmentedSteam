import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {CallbackFeature} from "../../../modulesContent";
import {UserNotes} from "../Common/UserNotes";

export default class FWishlistUserNotes extends CallbackFeature {

    checkPrerequisites() {
        return this.context.myWishlist && SyncedStorage.get("showusernotes");
    }

    setup() {
        this._userNotes = new UserNotes();

        document.addEventListener("click", ({target}) => {
            if (!target.classList.contains("esi-note")) { return; }

            const row = target.closest(".wishlist_row");
            const appid = Number(row.dataset.appId);
            this._userNotes.showModalDialog(
                row.querySelector("a.title").textContent.trim(),
                appid,
                `.wishlist_row[data-app-id="${appid}"] div.esi-note`,
                (node, active) => {
                    node.classList.toggle("esi-empty-note", !active);
                    node.classList.toggle("esi-user-note", active);
                }
            );
        });
    }

    callback(nodes) {

        for (const node of nodes) {
            if (node.classList.contains("esi-has-note")) { continue; }

            const appid = Number(node.dataset.appId);
            let noteText;
            let cssClass;

            (async() => {
                const note = await this._userNotes.get(appid);

                if (note === null) {
                    noteText = Localization.str.user_note.add;
                    cssClass = "esi-empty-note";
                } else {
                    noteText = `"${note}"`;
                    cssClass = "esi-user-note";
                }

                HTML.afterEnd(node.querySelector(".mid_container"), `<div class="esi-note ${cssClass}">${noteText}</div>`);
                node.classList.add("esi-has-note");
            })();

        }
    }
}
