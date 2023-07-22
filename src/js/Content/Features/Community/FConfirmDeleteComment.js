import {Localization, SyncedStorage} from "../../../modulesCore";
import {Feature, Messenger, User} from "../../modulesContent";
import {Page} from "../Page";

export default class FConfirmDeleteComment extends Feature {

    checkPrerequisites() {
        return User.isSignedIn && SyncedStorage.get("confirmdeletecomment");
    }

    apply() {

        Messenger.onMessage("CCommentThread").then(isDefined => {
            if (isDefined) {
                Messenger.addMessageListener("noDeletionConfirm", () => SyncedStorage.set("confirmdeletecomment", false));
            }
        });

        Page.runInPageContext((promptStr, labelStr) => {
            // `CCommentThread` is defined in global.js
            if (typeof window.CCommentThread === "undefined") {
                window.Messenger.postMessage("CCommentThread", false);
                return;
            }

            window.Messenger.postMessage("CCommentThread", true);

            // https://github.com/SteamDatabase/SteamTracking/blob/18d1c0eed3dcedc81656e3d278b3896253cc5b84/steamcommunity.com/public/javascript/global.js#L2465
            const oldDeleteComment = window.CCommentThread.DeleteComment;

            window.CCommentThread.DeleteComment = function(id, gidcomment) {

                /**
                 * Forum topics have special handling and show a prompt already
                 * https://github.com/SteamDatabase/SteamTracking/blob/18d1c0eed3dcedc81656e3d278b3896253cc5b84/steamcommunity.com/public/javascript/forums.js#L1347
                 */
                if (id.startsWith("ForumTopic")) {
                    oldDeleteComment.call(this, id, gidcomment);
                    return;
                }

                const modal = window.SteamFacade.showConfirmDialog(
                    "Augmented Steam",
                    `${promptStr}<br><br>
                    <label><input type="checkbox">${labelStr}</label>`
                );

                let checked = false;

                document.querySelector(".newmodal input[type=checkbox]").addEventListener("change", e => {
                    checked = e.currentTarget.checked;
                });

                modal.done(() => {
                    if (checked) {

                        /*
                         * Restore old method if don't show is checked, so the prompt is not shown
                         * when deleting more comments on the same page
                         */
                        window.CCommentThread.DeleteComment = oldDeleteComment;

                        window.Messenger.postMessage("noDeletionConfirm");
                    }

                    oldDeleteComment.call(this, id, gidcomment);
                });
            };
        },
        [
            Localization.str.delete_comment_prompt,
            Localization.str.update.dont_show
        ]);
    }
}
