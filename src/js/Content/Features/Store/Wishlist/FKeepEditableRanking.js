// import {SyncedStorage} from "../../../../Core/Storage/SyncedStorage";
import {CallbackFeature} from "../../../Modules/Feature/CallbackFeature";
import {Page} from "../../Page";

export default class FKeepEditableRanking extends CallbackFeature {

    checkPrerequisites() {
        return this.context.myWishlist;
    }

    setup() {
        document.querySelector("#wishlist_ctn").classList.add("as_show_order_input");

        Page.runInPageContext(() => {
            const globalAppInfo = window.g_rgAppInfo;
            const wishlist = window.g_Wishlist;
            const controller = window.CWishlistController.prototype;

            function sortByRank() {
                // Source: https://github.com/SteamDatabase/SteamTracking/blob/2ffc58d15afb8d7d25747ff32b0bf44032c36ad4/store.steampowered.com/public/javascript/wishlist.js#L784
                return Array.from(wishlist.rgAllApps).sort((a, b) => {
                    if (globalAppInfo[b].priority === globalAppInfo[a].priority) { return 0; }
                    if (globalAppInfo[b].priority === 0) { return -1; }
                    if (globalAppInfo[a].priority === 0) { return 1; }
                    return globalAppInfo[a].priority - globalAppInfo[b].priority;
                });
            }

            for (const fnName of ["MoveToPosition", "SaveOrder"]) {
                const oldFn = controller[fnName];

                /*
                 * MoveToPosition and SaveOrder assume that rgAllApps is sorted by "Your rank".
                 * Otherwise, the ranking would be overwritten by the currently displayed order,
                 * see https://github.com/IsThereAnyDeal/AugmentedSteam/issues/1293
                 */
                controller[fnName] = function(...args) {
                    oldFn.call(Object.assign(wishlist, {"rgAllApps": sortByRank()}), ...args);
                };
            }
        });
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
