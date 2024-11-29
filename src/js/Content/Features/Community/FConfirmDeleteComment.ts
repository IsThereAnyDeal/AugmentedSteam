import {__deleteCommentPrompt, __update_dontShow} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Feature from "@Content/Modules/Context/Feature";
import type CCommunityBase from "@Content/Features/Community/CCommunityBase";
import Settings from "@Options/Data/Settings";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class FConfirmDeleteComment extends Feature<CCommunityBase> {

    override checkPrerequisites(): boolean {
        return this.context.user.isSignedIn && Settings.confirmdeletecomment;
    }

    override apply(): void {

        document.addEventListener("noDeletionConfirm", () => {
            Settings.confirmdeletecomment = false;
        });

        DOMHelper.insertScript("scriptlets/Community/confirmDeleteComments.js", {
            prompt: L(__deleteCommentPrompt),
            label: L(__update_dontShow)
        });
    }
}
