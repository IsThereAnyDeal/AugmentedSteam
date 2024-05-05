import ContextType from "../../../Modules/Context/ContextType";
import {GameId} from "@Core/GameId";
import {CCommunityBase} from "../CCommunityBase";
import FHighlightsTags from "../../Common/FHighlightsTags";
import FSkipAgecheck from "../../Common/FSkipAgecheck";
import FCommunityAppPageLinks from "./FCommunityAppPageLinks";
import FCommunityAppPageWishlist from "./FCommunityAppPageWishlist";

export class CApp extends CCommunityBase {

    constructor(type = ContextType.COMMUNITY_APP, features = []) {

        features.push(
            FCommunityAppPageLinks,
            FCommunityAppPageWishlist,
            FSkipAgecheck,
        );

        super(type, features);

        /*
         * Get appid from the "All" tab link (some pages don't have the appid in the pathname).
         * The value will be `null` for e.g. Greenlight items that don't have the tabs section.
         * Avoid using the "Store Page" button because it doesn't appear for unlisted apps.
         */
        this.appid = GameId.getAppid(document.querySelector("a.apphub_sectionTab"));

        FHighlightsTags.highlightTitle(this.appid);
    }
}
