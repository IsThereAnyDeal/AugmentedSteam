import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import {L} from "@Core/Localization/Localization";
import {
    __featureHint_desc, __featureHint_reminder,
    __hideComments,
    __options_hideannouncementcomments,
    __showComments, __thewordno, __thewordyes,
} from "../../../../../localization/compiled/_strings";
import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {CallbackFeature, ConfirmDialog} from "../../../modulesContent";

export default class FToggleComments extends CallbackFeature {

    setup() {
        this._btnEl = HTML.toElement('<span class="btn_grey_grey btn_small_thin as_comments_toggle"><span></span></span>');

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

            /* FIXME
            static openFeatureHint(optionStr, strTitle, strDescription, strOKButton, strCancelButton, strSecondaryActionButton) {

                const _strTitle = strTitle ? `Augmented Steam - ${strTitle}` : "Augmented Steam";

                const _strDescription = `${strDescription ? `${strDescription}<br><br>` : ""}
            ${L(__featureHint_desc)}<br><br>
            <span class="as_feature_hint_option">${L(optionStr)}</span><br><br>
            ${L(__featureHint_reminder)}`;

                const _strOKButton = strOKButton || L(__thewordyes);
                const _strCancelButton = strCancelButton || L(__thewordno);

                return SteamFacade.showConfirmDialog(_strTitle, _strDescription, _strOKButton, _strCancelButton, strSecondaryActionButton);
            }
            */

            openFeatureHint()
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
        btnEl.querySelector("span").textContent = L(hide ? __showComments : __hideComments);
    }
}
