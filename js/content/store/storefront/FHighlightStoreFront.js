class FHighlightStoreFront extends ASFeature {

    checkPrerequisites() {
        return User.isSignedIn; // TODO ITAD status
    }

    apply() {

        let recentlyUpdated = document.querySelector(".recently_updated");

        if (recentlyUpdated) {
            let observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => FHighlightsTags.highlightAndTag(mutation.addedNodes[0].children));
                observer.disconnect();
            });
            observer.observe(recentlyUpdated, { childList: true });
        }

        // Monitor and highlight wishlishted recommendations at the bottom of Store's front page
        let contentNode = document.querySelector("#content_more");

        if (contentNode) {
            let observer = new MutationObserver(mutations => {
                mutations.forEach(mutation =>
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType !== Node.ELEMENT_NODE) { return; }
                        FHighlightsTags.highlightAndTag(node.querySelectorAll(".home_content_item, .home_content.single"));
                    })
                );
            });

            observer.observe(contentNode, {childList:true, subtree: true});
        }
    }
}