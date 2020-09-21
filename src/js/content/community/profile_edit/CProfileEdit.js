import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules";

import FBackgroundSelection from "./FBackgroundSelection";
import FStyleSelection from "./FStyleSelection";

import {ProfileData} from "community/common";

export class CProfileEdit extends CCommunityBase {

    constructor() {
        
        super([
            FBackgroundSelection,
            FStyleSelection,
        ]);

        this.type = ContextTypes.PROFILE_EDIT;
    }

    async applyFeatures() {

        await ProfileData.clearOwn();

        if (!document.querySelector(`[class^="profileeditshell_PageContent_"]`)) {
            await new Promise(resolve => {
                new MutationObserver((records, observer) => {
                    for (let {addedNodes} of records) {
                        for (let node of addedNodes) {
                            if (node.nodeType !== Node.ELEMENT_NODE || !node.querySelector(`[class^="profileeditshell_PageContent_"]`)) { continue; }
    
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
