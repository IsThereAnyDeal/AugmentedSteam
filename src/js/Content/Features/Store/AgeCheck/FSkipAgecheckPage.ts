import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Community/App/CApp";
import type CAgeCheck from "@Content/Features/Store/AgeCheck/CAgecheck";
import Settings from "@Options/Data/Settings";

export default class FSkipAgecheckPage extends Feature<CApp|CAgeCheck> {

    override async isEnabled(): Promise<boolean> {
        return Settings.send_age_info;
    }

    override async apply(): Promise<string|null> {
        let expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 1);
        const expiryUTC = expiry.toUTCString();

        if (!document.cookie.includes("birthtime=")) {
            document.cookie = `birthtime=${1006180000 + Math.floor(Math.random()*1000)}; expires=${expiryUTC}; path=/;`;
            document.cookie = `wants_mature_content=1; expires=${expiryUTC}; path=/;`;
            document.cookie = `lastagecheckage=1-January-1970; expires=${expiryUTC}; path=/;`;

            window.location.href = window.location.href.replace("/agecheck", "");
            return null;
        }

        return "Birthtime cookie already present";
    }
}
