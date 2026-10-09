import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Community/App/CApp";
import type CAgeCheck from "@Content/Features/Store/AgeCheck/CAgecheck";
import Settings from "@Options/Data/Settings";

export default class FSkipAgecheckPage extends Feature<CApp|CAgeCheck> {

    override async checkPrerequisites(): Promise<boolean> {
        return Settings.send_age_info;
    }

    override async apply(): Promise<void> {
        // Partially taken from https://github.com/SteamDatabase/BrowserExtension/blob/435b6fed85e487dcafcaff9f7353691c70511a05/scripts/store/agecheck.js
        const year = Math.floor(Math.random() * 35) + 50;
        const time = (new Date(year, 0)).getTime() / 1000; // Jan 01 19xx 00:00:00 GMT+0800

        let expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 1);
        const expiryUTC = expiry.toUTCString();

        document.cookie = `birthtime=${time}; expires=${expiryUTC}; path=/;`;
        document.cookie = `wants_mature_content=1; expires=${expiryUTC}; path=/;`;

        // Make sure there's a valid age gate before redirecting
        if (document.querySelector("#app_agegate") !== null) {
            window.location.href = window.location.href.replace("/agecheck", "");
        }
    }
}
