class FWishlistUserNotes extends CallbackFeature {

    _userNotes;

    checkPrerequisites() {
        return this.context.myWishlist && SyncedStorage.get("showusernotes");
    }

    apply() {
        this._userNotes = new UserNotes();

        document.addEventListener("click", ({ target }) => {
            if (!target.classList.contains("esi-note")) { return; }

            let row = target.closest(".wishlist_row");
            let appid = Number(row.dataset.appId);
            this._userNotes.showModalDialog(
                row.querySelector("a.title").textContent.trim(),
                appid,
                `.wishlist_row[data-app-id="${appid}"] div.esi-note`,
                (node, active) => {
                    if (active) {
                        node.classList.remove("esi-empty-note");
                        node.classList.add("esi-user-note");
                    } else {
                        node.classList.remove("esi-user-note");
                        node.classList.add("esi-empty-note");
                    }
                }
            );
        });

        super.apply();
    }

    callback(nodes) {

        for (let node of nodes) {
            if (node.classList.contains("esi-has-note")) { continue; }

            let appid = Number(node.dataset.appId);
            let noteText;
            let cssClass;

            if (this._userNotes.exists(appid)) {
                noteText = `"${this._userNotes.get(appid)}"`;
                cssClass = "esi-user-note";
            } else {
                noteText = Localization.str.user_note.add;
                cssClass = "esi-empty-note";
            }

            HTML.afterEnd(node.querySelector(".mid_container"), `<div class="esi-note ${cssClass}">${noteText}</div>`);
            node.classList.add("esi-has-note");
        }
    }
}