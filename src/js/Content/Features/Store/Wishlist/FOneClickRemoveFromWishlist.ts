import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class FOneClickRemoveFromWishlist extends Feature<CWishlist> {

    override checkPrerequisites(): boolean {
        return this.context.myWishlist && Settings.oneclickremovewl;
    }

    override apply(): void {
        this.context.onWishlistUpdate.subscribe(e => {
            const nodes = e.data;

            for (const node of nodes) {
                const deleteNode = node.querySelector(".delete")!;

                // Replace the delete node in order to disable Steam's handlers
                const newDeleteNode = deleteNode.cloneNode(true);
                deleteNode.replaceWith(newDeleteNode);

                newDeleteNode.addEventListener("click", () => {
                    DOMHelper.insertScript("scriptlets/Store/Wishlist/removeFromWishlist.js", {
                        appid: node.dataset.appId
                    });
                });
            }
        })
    }
}
