import {ASFeature} from "../../ASFeature.js";
import {User} from "../../common.js";
import {FHighlightsTags} from "../../common/FHighlightsTags.js";

export class FHighlightStoreFront extends ASFeature {

    checkPrerequisites() {
        return User.isSignedIn; // TODO ITAD status
    }

    apply() {

        const recentlyUpdated = document.querySelector(".recently_updated");

        if (recentlyUpdated) {
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => FHighlightsTags.highlightAndTag(mutation.addedNodes[0].children));
                observer.disconnect();
            });
            observer.observe(recentlyUpdated, {"childList": true});
        }

        // Monitor and highlight wishlishted recommendations at the bottom of Store's front page
        const contentNode = document.querySelector("#content_more");

        if (contentNode) {
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
                    if (node.nodeType !== Node.ELEMENT_NODE) { return; }
                    FHighlightsTags.highlightAndTag(node.querySelectorAll(".home_content_item, .home_content.single"));
                }));
            });

            observer.observe(contentNode, {"childList": true, "subtree": true});
        }
    }
}
