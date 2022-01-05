import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {CallbackFeature} from "../../../modulesContent";
import {UserNotes} from "../Common/UserNotes";

export default class FWishlistUserNotes extends CallbackFeature {

    checkPrerequisites() {
        return this.context.myWishlist && SyncedStorage.get("user_notes_wishlist");
    }

    setup() {
        this._userNotes = new UserNotes();
        this._noteEl = HTML.element(`<div class="esi-note esi-note--wishlist ellipsis">${Localization.str.user_note.add}</div>`);
        this._color = SyncedStorage.get("user_notes_wishlist_color");

        document.addEventListener("click", ({target}) => {
            if (!target.classList.contains("esi-note")) { return; }

            const row = target.closest(".wishlist_row");
            this._userNotes.showModalDialog(
                row.querySelector("a.title").textContent.trim(),
                Number(row.dataset.appId),
                target,
                (node, active) => {
                    node.classList.toggle("esi-has-note", active);
                    node.style.color = active ? this._color : null;
                }
            );
        });
    }

    callback(nodes) {

        const lastNode = nodes[nodes.length - 1];

        for (const node of nodes) {
            if (node.classList.contains("esi-has-note")) { continue; }

            const noteEl = this._noteEl.cloneNode(true);
            const appid = Number(node.dataset.appId);

            (async() => {
                const note = await this._userNotes.get(appid);

                if (note !== null) {
                    noteEl.textContent = `"${note}"`;
                    noteEl.classList.add("esi-has-note");
                    noteEl.style.color = this._color;
                }

                node.querySelector(".mid_container").insertAdjacentElement("afterend", noteEl);
                node.classList.add("esi-has-note");

                if (node === lastNode) {
                    window.dispatchEvent(new Event("resize"));
                }
            })();
        }
    }
}
