class FWishlistHighlights extends CallbackFeature {

    checkPrerequisites() {
        return User.isSignedIn; // TODO ITAD status
    }

    callback(nodes) {

        let options = {};
        if (this.context.myWishlist) {
            options.wishlisted = false;
            options.waitlisted = false;
        }

        return FHighlightsTags.highlightAndTag(nodes, false, options);
    }
}