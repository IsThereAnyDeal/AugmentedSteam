import {User} from "../../../Modules/User";
import {CallbackFeature} from "../../../Modules/Feature/CallbackFeature";
import FHighlightsTags from "../../Common/FHighlightsTags";

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
