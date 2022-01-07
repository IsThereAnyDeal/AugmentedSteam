import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {CallbackFeature, ConfirmDialog} from "../../../modulesContent";

export default class FToggleComments extends CallbackFeature {

    setup() {
        this._btnEl = HTML.element('<span class="btn_grey_grey btn_small_thin as_comments_toggle"><span></span></span>');

        this.callback();
    }

    callback(parent = document) {

        const nodes = parent.querySelectorAll(".blotter_userstatus[id^=group_announcement]");
        const hide = SyncedStorage.get("hideannouncementcomments");

        for (const node of nodes) {

            const commentArea = node.querySelector(".commentthread_area");
            let btnEl = node.querySelector(".as_comments_toggle");

            if (!btnEl) {
                btnEl = this._btnEl.cloneNode(true);
                btnEl.addEventListener("click", () => this._clickHandler(commentArea, btnEl));
                node.querySelector(".blotter_viewallcomments_container").append(btnEl);
            }

            this._toggleComments(commentArea, btnEl, hide);
        }
    }

    _clickHandler(commentArea, btnEl) {

        if (!SyncedStorage.has("hideannouncementcomments")) {

            ConfirmDialog.openFeatureHint(Localization.str.options.hideannouncementcomments)
                .then(result => {
                    const hide = result === "OK";
                    SyncedStorage.set("hideannouncementcomments", hide);

                    if (hide) {
                        this.callback(); // Hide all currently visible comment areas
                    }
                });
        }

        this._toggleComments(commentArea, btnEl, !btnEl.classList.contains("as-comments-hidden"));
    }

    _toggleComments(commentArea, btnEl, hide) {
        commentArea.style.display = hide ? "none" : "";
        btnEl.classList.toggle("as-comments-hidden", hide);
        btnEl.querySelector("span").textContent = Localization.str[hide ? "show_comments" : "hide_comments"];
    }
}
