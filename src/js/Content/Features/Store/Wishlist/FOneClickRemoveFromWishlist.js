import {SyncedStorage} from "../../../../Core/Storage/SyncedStorage";
import {CallbackFeature} from "../../../Modules/Feature/CallbackFeature";
import {Page} from "../../Page";

export default class FOneClickRemoveFromWishlist extends CallbackFeature {

    checkPrerequisites() {
        return this.context.myWishlist && SyncedStorage.get("oneclickremovewl");
    }

    callback(nodes) {

        for (const node of nodes) {

            const deleteNode = node.querySelector(".delete");
            if (deleteNode.classList.contains("as-oneclickremove")) { continue; }

            // Replace the delete node in order to disable Steam's handlers
            const newDeleteNode = deleteNode.cloneNode(true);
            newDeleteNode.classList.add("as-oneclickremove");
            deleteNode.replaceWith(newDeleteNode);

            // eslint-disable-next-line no-loop-func
            newDeleteNode.addEventListener("click", () => {

                /*
                 * Modified version of fnRemoveFromWishlist from wishlist.js
                 * https://github.com/SteamDatabase/SteamTracking/blob/ca5145acba077bee42de2593f6b17a6ed045b5f6/store.steampowered.com/public/javascript/wishlist.js#L173
                 */
                Page.runInPageContext(appid => {

                    const f = window.SteamFacade;

                    f.jqPost(`${f.global("g_strWishlistBaseURL")}remove/`, {
                        appid,
                        "sessionid": f.global("g_sessionID")
                    });

                    f.dynamicStoreInvalidateCache();

                    f.jq("#wishlist_ctn").removeClass("sorting");

                    /* eslint-disable new-cap, no-undef, camelcase */
                    delete g_rgAppInfo[appid];
                    g_Wishlist.rgAllApps = Object.keys(g_rgAppInfo);
                    g_Wishlist.Update(true);
                    /* eslint-enable new-cap, no-undef, camelcase */
                }, [node.dataset.appId]);
            });
        }
    }
}
