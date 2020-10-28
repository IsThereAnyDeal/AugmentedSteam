import {CCommunityBase} from "community/common/CCommunityBase";
import ContextType from "../../../Modules/Content/Context/ContextType";
import FBackgroundSelection from "./FBackgroundSelection";
import FStyleSelection from "./FStyleSelection";

import {ProfileData} from "community/common";

export class CProfileEdit extends CCommunityBase {

    constructor() {

        super([
            FBackgroundSelection,
            FStyleSelection,
        ]);

        this.type = ContextType.PROFILE_EDIT;
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
