import {SyncedStorage} from "../../../modulesCore";
import {Feature} from "../../modulesContent";

export default class FHideTrademarks extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("hidetmsymbols");
    }

    apply() {

        const symbolsRegex = /[\u00AE\u00A9\u2122]/g;
        const ignoreTags = new Set(["script", "style", "br", "hr", "link", "img", "video", "audio"]);
        const skipIds = new Set(["global_header", "footer", "game_area_legal", "app_reviews_hash"]);

        function replaceText(node) {
            const text = node.textContent;

            // Don't set textContent if there's nothing to replace to avoid infinite mutations loop on FF
            if (text.trim() !== "" && symbolsRegex.test(text)) {
                symbolsRegex.lastIndex = 0;
                node.textContent = text.replace(symbolsRegex, "");
            }
        }

        function walkTree(root = document.body) {
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
                acceptNode(node) {
                    if (node.nodeType === 1) {
                        if (ignoreTags.has(node.tagName.toLowerCase()) || skipIds.has(node.id)) {
                            return NodeFilter.FILTER_REJECT; // Skip walking children
                        }
                        return NodeFilter.FILTER_SKIP;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            });

            let node;
            while ((node = walker.nextNode()) !== null) {
                replaceText(node);
            }
        }

        walkTree();

        new MutationObserver(mutations => {
            for (const {addedNodes} of mutations) {
                for (const node of addedNodes) {
                    if (node.nodeType === 1) {
                        walkTree(node);
                    } else if (node.nodeType === 3) {
                        replaceText(node);
                    }
                }
            }
        }).observe(document.body, {"childList": true, "subtree": true});
    }
}
