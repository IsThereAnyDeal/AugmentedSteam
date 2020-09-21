import {CallbackFeature} from "modules";
import {SyncedStorage} from "core";

export default class FSkipAgecheck extends CallbackFeature {

    checkPrerequisites() {
        return SyncedStorage.get("send_age_info");
    }

    callback() {
        const ageYearNode = document.querySelector("#ageYear");
        if (ageYearNode) {
            const myYear = Math.floor(Math.random() * 75) + 10;
            ageYearNode.value = `19${myYear}`;
            document.querySelector(".btnv6_blue_hoverfade").click();
        } else {
            const btn = document.querySelector(".agegate_text_container.btns a");
            if (btn && btn.getAttribute("href") === "#") {
                btn.click();
            }
        }

        const continueNode = document.querySelector("#age_gate_btn_continue");
        if (continueNode) {
            continueNode.click();
        }
    }
}
