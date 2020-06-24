import {CallbackFeature} from "../../CallbackFeature.js";

import {User} from "../../common.js";
import {FHighlightsTags} from "../../common/FHighlightsTags.js";

export class FWishlistHighlights extends CallbackFeature {

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
