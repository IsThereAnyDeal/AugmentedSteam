import {SyncedStorage} from "../../../Core/Storage/SyncedStorage";
import {ContextType, Feature} from "../../modulesContent";

export default class FSkipAgecheck extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("send_age_info");
    }

    apply() {

        if (this.context.type === ContextType.AGECHECK) {

            // Partially taken from https://github.com/SteamDatabase/BrowserExtension/blob/master/scripts/store/agecheck.js
            const year = Math.floor(Math.random() * 35) + 50;
            const time = new Date(year, 0) / 1000; // Jan 01 19xx 00:00:00 GMT+0800

            let expiry = new Date();
            expiry.setFullYear(expiry.getFullYear() + 1);
            expiry = expiry.toUTCString();

            document.cookie = `birthtime=${time}; expires=${expiry}; path=/;`;
            document.cookie = `wants_mature_content=1; expires=${expiry}; path=/;`;

            // Make sure there's a valid age gate before redirecting
            if (document.querySelector("#app_agegate")) {
                window.location.href = window.location.href.replace("/agecheck", "");
            }
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
        document.querySelector("#age_gate_btn_continue")?.click();
    }
}
