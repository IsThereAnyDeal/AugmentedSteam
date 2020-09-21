import {CallbackFeature} from "modules";

import {User} from "common";
import FHighlightsTags from "common/FHighlightsTags";

export default class FWishlistHighlights extends CallbackFeature {

    checkPrerequisites() {
        return User.isSignedIn; // TODO ITAD status
    }

    callback(nodes) {

        const options = {};
        if (this.context.myWishlist) {
            options.wishlisted = false;
            options.waitlisted = false;
        }

        return FHighlightsTags.highlightAndTag(nodes, false, options);
    }
}
