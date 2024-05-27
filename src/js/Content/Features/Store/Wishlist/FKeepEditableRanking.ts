import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Feature from "@Content/Modules/Context/Feature";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class FKeepEditableRanking extends Feature<CWishlist> {

    override checkPrerequisites(): boolean {
        return this.context.myWishlist;
    }

    override apply(): void {
        document.querySelector("#wishlist_ctn")!.classList.add("as_show_order_input");
        DOMHelper.insertScript("scriptlets/Store/Wishlist/rankSort.js");

        this.context.onWishlistUpdate.subscribe(e => {
            const nodes = e.data;

            for (const node of nodes) {

                // Clone the hover element in order to disable drag-and-drop while filtering is active
                const hoverHandle = node.querySelector<HTMLElement>(".hover_handle")!;
                const newHoverHandle = hoverHandle.cloneNode(true) as HTMLElement;
                newHoverHandle.classList.add("as_hover_handle");
                newHoverHandle.draggable = false;
                newHoverHandle.querySelector("img")!.remove();
                hoverHandle.insertAdjacentElement("afterend", newHoverHandle);

                const input = hoverHandle.querySelector<HTMLInputElement>(".order_input")!;
                const newInput = newHoverHandle.querySelector<HTMLInputElement>(".order_input")!;

                // Pass events to the old input to trigger Steam's handlers
                newInput.addEventListener("change", () => {
                    input.value = newInput.value;
                    input.dispatchEvent(new Event("change"));
                });

                // Select all text when focusing input field
                newInput.addEventListener("focus", () => {
                    newInput.select();
                });
            }
        })
    }
}
