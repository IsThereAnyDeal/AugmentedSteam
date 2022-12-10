import {SyncedStorage} from "../../../Core/Storage/SyncedStorage";
import {Feature} from "../../Modules/Feature/Feature";

export default class FDisableLinkFilter extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("disablelinkfilter");
    }

    apply() {

        function removeLinkFilter(parent = document) {
            const selector = "a[href*='/linkfilter/']";

            for (const link of parent.querySelectorAll(selector)) {
                link.href = new URLSearchParams(link.search).get("url");
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
