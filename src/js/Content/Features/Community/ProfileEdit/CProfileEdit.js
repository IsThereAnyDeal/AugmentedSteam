import {Background, ContextType, User} from "../../../modulesContent";
import {CCommunityBase} from "../CCommunityBase";
import FBackgroundSelection from "./FBackgroundSelection";
import FStyleSelection from "./FStyleSelection";

export class CProfileEdit extends CCommunityBase {

    constructor() {

        super(ContextType.PROFILE_EDIT, [
            FBackgroundSelection,
            FStyleSelection,
        ]);

        this.steamId = User.steamId;
        this.data = this.profileDataPromise().catch(err => console.error(err));
    }

    async applyFeatures() {

        const root = document.getElementById("react_root");
        if (root && !root.querySelector('[class^="profileeditshell_PageContent_"]')) {
            await new Promise(resolve => {
                new MutationObserver((_, observer) => {
                    if (root.querySelector('[class^="profileeditshell_PageContent_"]') !== null) {
                        observer.disconnect();
                        resolve();
                    }
                }).observe(root, {"childList": true});
            });
        }

        return super.applyFeatures();
    }

    profileDataPromise() {
        return Background.action("profile", this.steamId);
    }

    clearOwn() {
        return Background.action("clearownprofile", this.steamId);
    }
}
