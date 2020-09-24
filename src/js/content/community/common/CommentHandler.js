import {HTML, LocalStorage, Localization, SyncedStorage} from "core";

export class CommentHandler {

    static _toggleHiddenCommentsButton(threadNode, count) {
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

    static _addCommentThreadObserver(threadNode) {
        if (threadNode.dataset.esiCommentObserver) { return; }
        threadNode.dataset.esiCommentObserver = "1";

        const observer = new MutationObserver(() => {
            this._updateCommentThread(threadNode);
        });
        observer.observe(threadNode.querySelector(".commentthread_comments"), {"childList": true});
    }

    static _hideSpamComments(threadNode) {
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

    static _updateCommentThread(node) {
        const countHidden = this._hideSpamComments(node);
        this._toggleHiddenCommentsButton(node, countHidden);
    }

    static _handleAllCommentThreads(parent) {
        const nodes = parent.querySelectorAll(".commentthread_comment_container:not(.esi_commentthread)");
        for (const node of nodes) {
            this._updateCommentThread(node);
            this._addCommentThreadObserver(node);
        }
    }

    static hideSpamComments() {
        if (!SyncedStorage.get("hidespamcomments")) { return; }

        this._spamRgx = new RegExp(SyncedStorage.get("spamcommentregex"), "i");

        this._handleAllCommentThreads(document);

        /*
         * modal content
         * TODO(tomas.fedor) this should be handled in apphub page
         */
        const modalWait = document.querySelector("#modalContentWait");
        if (!modalWait) { return; }

        const observer = new MutationObserver(mutation => {
            const modalContainer = document.querySelector("#modalContentFrameContainer");
            if (!modalContainer) { return; }

            const latestFrame = window.frames[window.frames.length - 1]; // tomas.fedor Only check latest added frame
            this._handleAllCommentThreads(latestFrame.document);
        });
        observer.observe(modalWait, {"attributes": true});
    }

    static _updateFavs(favs, emoticonPopup, favBox, favRemove, name) {
        LocalStorage.set("fav_emoticons", favs);

        if (name && favs.includes(name) && favs.length > 1) {
            HTML.beforeEnd(favBox, this._buildEmoticonOption(name));
            const node = favBox.querySelector(`[data-emoticon="${name}"]`);
            this._finalizeFav(node, emoticonPopup, favRemove);
        } else if (name && !favs.includes(name) && favs.length > 0) {
            const node = favBox.querySelector(`[data-emoticon="${name}"]`);
            if (!node) { return; }
            node.parentNode.removeChild(node);
        } else {
            const favsHtml = this._buildFavBox(favs);
            HTML.inner(favBox, favsHtml);
            favBox.querySelectorAll(".emoticon_option").forEach(node => {
                this._finalizeFav(node, emoticonPopup, favRemove);
            });
        }
    }

    static _finalizeFav(node, emoticonPopup, favRemove) {
        node.draggable = true;
        node.querySelector("img").draggable = false;
        node.addEventListener("dragstart", (ev) => this._dragFavEmoticon(ev));
        node.addEventListener("click", (ev) => this._clickFavEmoticon(ev, emoticonPopup, favRemove));
    }

    static _dragFavEmoticon(ev) {
        ev.dataTransfer.setData("emoticon", ev.target.dataset.emoticon);
    }

    static _clickFavEmoticon(ev, emoticonPopup, favRemove) {
        const name = ev.target.closest(".emoticon_option").dataset.emoticon;
        const noFav = emoticonPopup.querySelector(`[data-emoticon=${name}]:not(.es_fav)`);
        noFav.click();
    }

    static _buildFavBox(favs = []) {
        let favsHtml;
        if (!favs.length) {
            favsHtml = Localization.str.fav_emoticons_dragging;
        } else {
            favsHtml = favs.map(fav => this._buildEmoticonOption(fav)).join("");
        }
        return favsHtml;
    }

    static _buildEmoticonOption(name) {
        return `<div class="emoticon_option es_fav" data-emoticon="${name}"><img src="https://steamcommunity-a.akamaihd.net/economy/emoticon/${name}" class="emoticon"></div>`;
    }

    static addFavoriteEmoticons() {
        const observer = new MutationObserver(() => {
            const emoticonPopup = document.querySelector(".emoticon_popup:not(.es_emoticons)");
            if (!emoticonPopup) { return; }

            emoticonPopup.classList.add("es_emoticons");
            emoticonPopup.style.maxWidth = "352px";
            emoticonPopup.querySelectorAll(".emoticon_option").forEach((node) => {
                node.draggable = true;
                node.querySelector("img").draggable = false;
                node.addEventListener("dragstart", ev => ev.dataTransfer.setData("emoticon", ev.target.dataset.emoticon));
            });

            let favs = LocalStorage.get("fav_emoticons", []);
            HTML.afterBegin(emoticonPopup,
                `<div style="margin-bottom:10px;min-height:32px;line-height:32px;text-align:center;max-height:none;display:flex;" class="emoticon_popup_content">
                    <div style="width:10%;background-image:url(https://steamcommunity-a.akamaihd.net/economy/emoticon/remove);background-repeat:no-repeat;background-position:center center;" class="commentthread_entry_quotebox" id="es_fav_remove"></div>
                    <div style="width:90%;" class="commentthread_entry_quotebox" id="es_fav_emoticons"></div>
                </div>`);

            const favBox = emoticonPopup.querySelector("#es_fav_emoticons");
            const favRemove = emoticonPopup.querySelector("#es_fav_remove");
            this._updateFavs(favs, emoticonPopup, favBox, favRemove);

            favBox.addEventListener("dragover", (ev) => {
                ev.preventDefault();
                favBox.style.backgroundColor = "black";
            });

            favBox.addEventListener("dragenter", (ev) => {
                favBox.style.backgroundColor = "black";
            });

            favBox.addEventListener("dragleave", (ev) => {
                favBox.style.backgroundColor = null;
            });

            favBox.addEventListener("drop", (ev) => {
                ev.preventDefault();

                favBox.style.backgroundColor = null;
                const name = ev.dataTransfer.getData("emoticon");
                if (favs.includes(name)) { return; }

                favs.push(name);
                this._updateFavs(favs, emoticonPopup, favBox, favRemove, name);
            });

            favRemove.addEventListener("dragover", (ev) => {
                ev.preventDefault();
                favRemove.style.backgroundColor = "black";
            });

            favRemove.addEventListener("dragenter", (ev) => {
                favRemove.style.backgroundColor = "black";
            });

            favRemove.addEventListener("dragleave", (ev) => {
                favRemove.style.backgroundColor = null;
            });

            favRemove.addEventListener("drop", (ev) => {
                ev.preventDefault();

                favRemove.style.backgroundColor = null;
                const name = ev.dataTransfer.getData("emoticon");
                favs = favs.filter(fav => fav !== name);
                this._updateFavs(favs, emoticonPopup, favBox, favRemove, name);
            });
        });

        observer.observe(document.body, {"childList": true});
    }
}
