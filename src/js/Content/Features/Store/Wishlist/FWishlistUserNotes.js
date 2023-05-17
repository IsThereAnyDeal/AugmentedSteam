import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {CallbackFeature} from "../../../modulesContent";
import {Page} from "../../Page";
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

        /**
         * While adding our notes information on demand may seem more efficient at first, it generates problems with Steam's
         * way of handling the dynamic rendering.
         * It's due to the unfortunate interplay between the OnScroll and OnResize functions:
         * 1. The row height of the top most currently visible row gets calculated in CWishlistController.prototype.Update https://github.com/SteamDatabase/SteamTracking/blob/bb5c883a235373a6d853b57466d2a13cd287bfce/store.steampowered.com/public/javascript/wishlist.js#LL925C1-L925C1
         * 2. CWishlistController.prototype.OnScroll loads new elements because the computed visible range of rows will be
         *  different from before.
         *  This is happening because our added note element changes the row height which is used in the calculation
         *  of the visible range. https://github.com/SteamDatabase/SteamTracking/blob/bb5c883a235373a6d853b57466d2a13cd287bfce/store.steampowered.com/public/javascript/wishlist.js#L593
         * 3. CWishlistController.prototype.OnResize is called, again calculating the row height of the top most currently
         *  visible row.
         *  It is different from the previously calculated row height because we haven't added our note information to this row yet.
         *  Due to this difference, CWishlistController.prototype.Update will be called again, and we start at step 1. https://github.com/SteamDatabase/SteamTracking/blob/bb5c883a235373a6d853b57466d2a13cd287bfce/store.steampowered.com/public/javascript/wishlist.js#L581
         *
         * Our solution to avoid this problem is to modify g_Wishlist.rgElements once, as this object is used for loading new rows
         * inside CWishlistController.prototype.LoadElement. https://github.com/SteamDatabase/SteamTracking/blob/bb5c883a235373a6d853b57466d2a13cd287bfce/store.steampowered.com/public/javascript/wishlist.js#L737
         * This ensures that at load time all rows already have the desired row height and further modifications of AS won't
         * change the height.
         */
        Page.runInPageContext(str => {
            for (const elements of Object.values(window.g_Wishlist.rgElements)) {
                const el = elements[0];

                const noteEl = document.createElement("div");
                noteEl.classList.add("esi-note", "esi-note--wishlist", "ellipsis");
                noteEl.innerText = str;

                el.querySelector(".mid_container").after(noteEl);
            }

            window.dispatchEvent(new Event("resize"));
        }, [Localization.str.user_note.add]);
    }

    async callback(nodes) {
        const newNodes = nodes.filter(node => !node.classList.contains("js-note-checked"));

        for (const node of newNodes) {
            node.classList.add("js-note-checked");
        }

        const appids = newNodes.map(node => Number(node.dataset.appId));
        const notes = await this._userNotes.get(appids);

        for (let i = 0; i < newNodes.length; i++) {
            const note = notes[appids[i]];

            if (typeof note !== "undefined") {
                const noteEl = newNodes[i].querySelector(".esi-note");
                noteEl.textContent = `"${note}"`;
                noteEl.classList.add("esi-has-note");
            }
        }
    }
}
