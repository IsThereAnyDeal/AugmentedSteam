import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {CallbackFeature} from "../../../modulesContent";
import {UserNotes} from "../Common/UserNotes";

export default class FWishlistUserNotes extends CallbackFeature {

    checkPrerequisites() {
        return this.context.myWishlist && SyncedStorage.get("user_notes_wishlist");
    }

    setup() {
        this._userNotes = new UserNotes();
        this._noteEl = HTML.toElement(`<div class="esi-note esi-note--wishlist ellipsis">${Localization.str.user_note.add}</div>`);

        document.addEventListener("click", ({target}) => {
            if (!target.classList.contains("esi-note")) { return; }

            const row = target.closest(".wishlist_row");
            this._userNotes.showModalDialog(
                row.querySelector("a.title").textContent.trim(),
                Number(row.dataset.appId),
                target,
                (node, active) => {
                    node.classList.toggle("esi-has-note", active);
                }
            );
        });
    }

    callback(nodes) {

        for (const node of nodes) {
            if (node.classList.contains("esi-has-note")) { continue; }

            const noteEl = this._noteEl.cloneNode(true);
            node.querySelector(".mid_container").after(noteEl);
            node.classList.add("esi-has-note");

            const appid = Number(node.dataset.appId);

            (async() => {
                const note = await this._userNotes.get(appid);

                if (note !== null) {
                    noteEl.textContent = `"${note}"`;
                    noteEl.classList.add("esi-has-note");
                }
            })();
        }
    }
}
