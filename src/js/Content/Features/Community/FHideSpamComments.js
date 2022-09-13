import {Localization, SyncedStorage} from "../../../modulesCore";
import {Feature} from "../../modulesContent";

export default class FHideSpamComments extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("hidespamcomments");
    }

    apply() {

        this._spamRgx = new RegExp(SyncedStorage.get("spamcommentregex"), "i");
        this.handleAllCommentThreads();

        // TODO this should be moved to CCommunityBase and support other features
        const modalWait = document.querySelector("#modalContentWait");
        if (!modalWait) { return; }

        new MutationObserver(() => {
            const modalContainer = document.querySelector("#modalContentFrameContainer");
            if (!modalContainer) { return; }

            const latestFrame = window.frames[window.frames.length - 1]; // Only check latest added frame
            this.handleAllCommentThreads(latestFrame.document);
        }).observe(modalWait, {"attributes": true});
    }

    handleAllCommentThreads(parent = document) {
        if (!SyncedStorage.get("hidespamcomments")) { return; }

        const nodes = parent.querySelectorAll(".commentthread_comment_container:not(.esi_commentthread)");
        for (const node of nodes) {
            this._updateCommentThread(node);
            this._addCommentThreadObserver(node);
        }
    }

    _addCommentThreadObserver(threadNode) {
        if (threadNode.dataset.esiCommentObserver) { return; }
        threadNode.dataset.esiCommentObserver = "1";

        new MutationObserver(() => { this._updateCommentThread(threadNode); })
            .observe(threadNode.querySelector(".commentthread_comments"), {"childList": true});
    }

    _updateCommentThread(node) {
        const countHidden = this._hideSpamComments(node);
        this._toggleHiddenCommentsButton(node, countHidden);
    }

    _toggleHiddenCommentsButton(threadNode, count) {
        threadNode.classList.add("esi_commentthread");

        let button = threadNode.querySelector(".esi_commentthread_button");

        if (count === 0) {
            if (button) {
                button.classList.add("esi-hidden");
            }
            return;
        }

        if (!button) {
            button = document.createElement("a");
            button.classList.add("esi_commentthread_button");
            threadNode.insertAdjacentElement("afterbegin", button);

            button.addEventListener("click", () => {
                threadNode.classList.add("esi_commentthread--showspam");
            });
        }

        button.classList.remove("esi-hidden");
        button.textContent = Localization.str.spam_comment_show.replace("__num__", count);
        threadNode.classList.remove("esi_commentthread--showspam");
    }

    _hideSpamComments(threadNode) {
        const nodes = threadNode.querySelectorAll(".commentthread_comment .commentthread_comment_text");
        let hiddenCount = 0;
        for (const node of nodes) {
            const commentText = node.textContent;
            if (!this._spamRgx.test(commentText)) { continue; }

            node.closest(".commentthread_comment").classList.add("esi_comment_hidden");
            hiddenCount++;
        }

        return hiddenCount;
    }
}
