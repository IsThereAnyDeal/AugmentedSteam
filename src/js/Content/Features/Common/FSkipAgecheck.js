import {SyncedStorage} from "../../../Core/Storage/SyncedStorage";
import {ContextType, Feature} from "../../modulesContent";

export default class FSkipAgecheck extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("send_age_info");
    }

    apply() {

        if (this.context.type === ContextType.AGECHECK) {

            const ageYearNode = document.querySelector("#ageYear");
            if (ageYearNode) {
                const myYear = Math.floor(Math.random() * 75) + 10;
                ageYearNode.value = `19${myYear}`;
            }

            const btn = document.querySelector(".agegate_text_container.btns > a");
            if (btn && btn.getAttribute("href") === "#") {
                btn.click();
            }
        } else {
            this._skipContentWarning();

            // display changes to none if content warning is shown
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
