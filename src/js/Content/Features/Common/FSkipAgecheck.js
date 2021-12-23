import {SyncedStorage} from "../../../Core/Storage/SyncedStorage";
import {ContextType, Feature} from "../../modulesContent";
import {Page} from "../Page";

export default class FSkipAgecheck extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("send_age_info");
    }

    apply() {

        if (this.context.type === ContextType.AGECHECK) {

            Page.runInPageContext(() => {

                // Modified version of `HideAgeGate` from the page script
                function newHideAgeGate() {
                    const cookiePath = window.location.pathname.replace("/agecheck", "");
                    window.SteamFacade.vSetCookie("wants_mature_content", 1, 365, cookiePath);
                    window.location.replace(window.location.origin + cookiePath);
                }

                const ageYearNode = document.querySelector("#ageYear");
                if (ageYearNode) { // Game may contain content nsfw...
                    const myYear = Math.floor(Math.random() * 75) + 10;
                    ageYearNode.value = `19${myYear}`;

                    window.SteamFacade.checkAgeGateSubmit(newHideAgeGate);
                } else { // Game contains content you have asked not to see
                    // `CheckAgeGateSubmit` calls `HideAgeGate` on these pages, so bypass it completely
                    newHideAgeGate();
                }
            });
        } else {
            this._skipContentWarning();

            // Inline style changes to `display: block` if content warning is dismissed
            const node = document.querySelector(".responsive_page_template_content");
            if (node && node.style.display !== "block") {
                new MutationObserver((mutations, observer) => {
                    observer.disconnect();
                    this._skipContentWarning();
                }).observe(node, {"attributes": true});
            }
        }
    }

    _skipContentWarning() {
        const btn = document.querySelector("#age_gate_btn_continue");
        if (btn) {
            btn.click();
        }
    }
}
