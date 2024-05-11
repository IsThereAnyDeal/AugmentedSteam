import Settings from "@Options/Data/Settings";
import {L} from "@Core/Localization/Localization";
import {__spamCommentShow} from "@Strings/_strings";

export default class SpamComments {

    private static _spamRegex: RegExp|undefined;

    static handleAllCommentThreads(parent: HTMLElement|Document = document) {
        if (!Settings.hidespamcomments) { return; }

        if (this._spamRegex === undefined) {
            this._spamRegex = new RegExp(Settings.spamcommentregex, "i");
        }

        const nodes = parent.querySelectorAll<HTMLElement>(".commentthread_comment_container:not(.esi_commentthread)");
        for (const node of nodes) {
            this._updateCommentThread(node);
            this._addCommentThreadObserver(node);
        }
    }

    private static _addCommentThreadObserver(threadNode: HTMLElement): void {
        if (threadNode.dataset.esiCommentObserver) {
            return;
        }
        threadNode.dataset.esiCommentObserver = "1";

        const commentsThread = threadNode.querySelector(".commentthread_comments");
        if (!commentsThread) {
            return;
        }

        (new MutationObserver(() => {
            this._updateCommentThread(threadNode);
        })).observe(commentsThread, {"childList": true});
    }

    private static _updateCommentThread(threadNode: HTMLElement): void {
        const count = this._hideSpamComments(threadNode);

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
        button.textContent = L(__spamCommentShow, {"num": count});
        threadNode.classList.remove("esi_commentthread--showspam");
    }

    private static _hideSpamComments(threadNode: HTMLElement): number {
        if (!this._spamRegex) {
            return 0;
        }

        const nodes = threadNode.querySelectorAll(".commentthread_comment .commentthread_comment_text");
        let hiddenCount = 0;
        for (const node of nodes) {
            const commentText = node.textContent;
            if (!commentText || !this._spamRegex.test(commentText)) {
                continue;
            }

            const comment = node.closest(".commentthread_comment");
            if (comment) {
                comment.classList.add("esi_comment_hidden");
                hiddenCount++;
            }
        }

        return hiddenCount;
    }
}
