import {SyncedStorage} from "../../../modulesCore";
import {Feature} from "../../modulesContent";

export default class FDisableLinkFilter extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("disablelinkfilter");
    }

    apply() {

        function removeLinkFilter(parent = document) {
            const selector = "a[href*='/linkfilter/']";

            for (const link of parent.querySelectorAll(selector)) {
                const params = new URLSearchParams(link.search);
                if (params.has("u")) {
                    link.href = params.get("u");
                } else if (params.has("url")) {
                    // TODO old param prior to 11/2023, remove after some time
                    link.href = params.get("url");
                }
            }
        }

        removeLinkFilter();

        new MutationObserver(mutations => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) { continue; }
                    removeLinkFilter(node);
                }
            }
        }).observe(document, {"childList": true, "subtree": true});
    }
}
