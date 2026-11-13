import {__deleteCommentPrompt, __update_dontShow} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import DOMHelper from "@Content/Modules/DOM/DOMHelper";
import type Context from "@Content/Modules/Context/Context";

/**
 * TODO no idea if this still works, or for how long it will
 */
export default class FConfirmDeleteComment extends Feature<Context> {

    override async isEnabled(): Promise<boolean> {
        return Settings.confirmdeletecomment;
    }

    override async apply(): Promise<string|null> {
        if (!this.context.user.isSignedIn) {
            return "Must be logged in";
        }

        document.addEventListener("noDeletionConfirm", () => {
            Settings.confirmdeletecomment = false;
        });

        DOMHelper.insertScript("scriptlets/Community/confirmDeleteComments.js", {
            prompt: L(__deleteCommentPrompt),
            label: L(__update_dontShow)
        });
        return null;
    }
}
