import {Feature, User} from "../../../modulesContent";
import FHighlightsTags from "../../Common/FHighlightsTags";
import FEarlyAccess from "../../Common/FEarlyAccess";

export default class FMonitorStoreFront extends Feature {

    checkPrerequisites() {
        return User.isSignedIn; // TODO ITAD status
    }

    apply() {

        // Lazy-loaded sections
        const nodes = document.querySelectorAll(".recently_updated, #friends_carousel > .carousel_items");
        for (const node of nodes) {
            if (node.childElementCount === 0) {
                new MutationObserver((mutations, observer) => {
                    for (const {addedNodes} of mutations) {
                        const nodes = addedNodes[0].children;

                        FHighlightsTags.highlightAndTag(nodes);
                        FEarlyAccess.show(nodes);
                    }
                    observer.disconnect();
                }).observe(node, {"childList": true});
            }
        }

        // Monitor recommendations at the bottom
        const contentNode = document.querySelector("#content_more");
        if (contentNode) {
            new MutationObserver(mutations => {
                for (const {addedNodes} of mutations) {
                    for (const node of addedNodes) {
                        if (!(node instanceof Element)) { continue; }
                        const nodes = node.querySelectorAll(".home_content_item, .home_content.single");

                        FHighlightsTags.highlightAndTag(nodes);
                        FEarlyAccess.show(nodes);
                    }
                }
            }).observe(contentNode, {"childList": true});
        }
    }
}
