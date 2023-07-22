import {SyncedStorage} from "../../../modulesCore";
import {ContextType, Feature} from "../../modulesContent";

export default class FSkipAgecheck extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("send_age_info");
    }

    apply() {

        if (this.context.type === ContextType.AGECHECK) {

            // Partially taken from https://github.com/SteamDatabase/BrowserExtension/blob/435b6fed85e487dcafcaff9f7353691c70511a05/scripts/store/agecheck.js
            const year = Math.floor(Math.random() * 35) + 50;
            const time = new Date(year, 0) / 1000; // Jan 01 19xx 00:00:00 GMT+0800

            let expiry = new Date();
            expiry.setFullYear(expiry.getFullYear() + 1);
            expiry = expiry.toUTCString();

            document.cookie = `birthtime=${time}; expires=${expiry}; path=/;`;
            document.cookie = `wants_mature_content=1; expires=${expiry}; path=/;`;

            // Make sure there's a valid age gate before redirecting
            if (document.querySelector("#app_agegate") !== null) {
                window.location.href = window.location.href.replace("/agecheck", "");
            }
        } else {
            document.querySelector(".contentcheck_desc_ctn button[onclick^=Proceed]")?.click();
        }
    }
}
