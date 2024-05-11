import type CCommunityBase from "@Content/Features/Community/CCommunityBase";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import SpamComments from "@Content/Modules/Community/SpamComments";

export default class FHideSpamComments extends Feature<CCommunityBase> {

    override checkPrerequisites(): boolean {
        return Settings.hidespamcomments;
    }

    override apply(): void {
        SpamComments.handleAllCommentThreads();

        // TODO this should be moved to CCommunityBase and support other features
        const modalWait = document.querySelector("#modalContentWait");
        if (!modalWait) { return; }

        new MutationObserver(() => {
            const modalContainer = document.querySelector("#modalContentFrameContainer");
            if (!modalContainer) { return; }

            const latestFrame = window.frames[window.frames.length - 1]; // Only check latest added frame
            if (latestFrame) {
                SpamComments.handleAllCommentThreads(latestFrame.document);
            }
        }).observe(modalWait, {"attributes": true});
    }

}
