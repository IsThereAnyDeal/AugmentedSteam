// import {SyncedStorage} from "../../../../Core/Storage/SyncedStorage";
import {CallbackFeature} from "../../../Modules/Feature/CallbackFeature";

export default class FKeepEditableRanking extends CallbackFeature {

    checkPrerequisites() {
        return this.context.myWishlist;
    }

    setup() {
        document.querySelector("#wishlist_ctn").classList.add("as_show_order_input");
    }

    callback(nodes) {

        for (const node of nodes) {

            if (node.querySelector(".as_hover_handle") !== null) { continue; }

            // Clone the hover element in order to disable drag-and-drop while filtering is active
            const hoverHandle = node.querySelector(".hover_handle");
            const newHoverHandle = hoverHandle.cloneNode(true);
            newHoverHandle.classList.add("as_hover_handle");
            newHoverHandle.draggable = false;
            newHoverHandle.querySelector("img").remove();
            hoverHandle.insertAdjacentElement("beforebegin", newHoverHandle);

            const input = hoverHandle.querySelector(".order_input");
            const newInput = newHoverHandle.querySelector(".order_input");

            // Pass events to the old input to trigger Steam's handlers
            newInput.addEventListener("change", () => {
                input.value = newInput.value;
                input.dispatchEvent(new Event("change"));
            });
        }
    }
}
