import {__userNote_add} from "@Strings/_strings";
import Feature from "@Content/Modules/Context/Feature";
import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Settings from "@Options/Data/Settings";
import UserNotes from "@Content/Features/Store/Common/UserNotes/UserNotes";
import {L} from "@Core/Localization/Localization";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class FWishlistUserNotes extends Feature<CWishlist> {

    // @ts-ignore
    private _userNotes: UserNotes;

    override checkPrerequisites(): boolean {
        return this.context.myWishlist && Settings.user_notes_wishlist;
    }

    override apply(): void {
        this._userNotes = new UserNotes();

        document.addEventListener("click", e => {
            const target = e.target as HTMLElement;
            if (!target.classList.contains("esi-note")) { return; }

            const row = target.closest<HTMLElement>(".wishlist_row")!;
            this._userNotes.showModalDialog(
                row.querySelector<HTMLAnchorElement>("a.title")!.textContent!.trim(),
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
        DOMHelper.insertScript("scriptlets/Store/Wishlist/addNotes.js", {
            str: L(__userNote_add)
        });

        this.context.onWishlistUpdate.subscribe(async (e) => {
            const nodes = e.data;

            const appids = nodes.map(node => Number(node.dataset.appId));
            const notes = await this._userNotes.get(...appids);

            for (let i = 0; i < nodes.length; i++) {
                const appid: number = appids[i]!;
                const note = notes.get(appid) ?? null;

                if (note !== null) {
                    const noteEl = nodes[i]!.querySelector<HTMLElement>(".esi-note")!;
                    noteEl.textContent = `"${note}"`;
                    noteEl.classList.add("esi-has-note");
                }
            }
        });
    }
}
