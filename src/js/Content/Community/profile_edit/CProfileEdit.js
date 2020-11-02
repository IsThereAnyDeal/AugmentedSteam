import {ContextType, ProfileData} from "../../../Modules/content";
import {CCommunityBase} from "../common/CCommunityBase";
import FBackgroundSelection from "./FBackgroundSelection";
import FStyleSelection from "./FStyleSelection";

export class CProfileEdit extends CCommunityBase {

    constructor() {

        super(ContextType.PROFILE_EDIT, [
            FBackgroundSelection,
            FStyleSelection,
        ]);
    }

    async applyFeatures() {

        await ProfileData.clearOwn();

        if (!document.querySelector('[class^="profileeditshell_PageContent_"]')) {
            await new Promise(resolve => {
                new MutationObserver((records, observer) => {
                    for (const {addedNodes} of records) {
                        for (const node of addedNodes) {
                            if (node.nodeType !== Node.ELEMENT_NODE
                                || !node.querySelector('[class^="profileeditshell_PageContent_"]')) { continue; }

                            observer.disconnect();
                            resolve();
                        }
                    }
                }).observe(document.getElementById("application_root"), {"childList": true});
            });
        }

        return super.applyFeatures();
    }
}
