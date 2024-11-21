import FSkipAgecheck from "../../Common/FSkipAgecheck";
import FCommunityAppPageLinks from "./FCommunityAppPageLinks";
import FCommunityAppPageWishlist from "./FCommunityAppPageWishlist";
import CCommunityBase from "@Content/Features/Community/CCommunityBase";
import ContextType from "@Content/Modules/Context/ContextType";
import AppId from "@Core/GameId/AppId";
import type Feature from "@Content/Modules/Context/Feature";
import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import HighlightsTagsUtils from "@Content/Modules/Highlights/HighlightsTagsUtils";

export default class CApp extends CCommunityBase {

    public appid: number|null;

    constructor(
        params: ContextParams,
        type: ContextType = ContextType.COMMUNITY_APP,
        features: (typeof Feature<Context>)[] = []
    ) {

        features.push(
            FCommunityAppPageLinks,
            FCommunityAppPageWishlist,
            FSkipAgecheck,
        );

        super(params, type, features);

        /**
         * Get appid from the "All" tab link (some pages don't have the appid in the pathname).
         * The value will be `null` for e.g. Greenlight items that don't have the tabs section.
         * Avoid using the "Store Page" button because it doesn't appear for unlisted apps.
         */
        this.appid = AppId.fromElement(document.querySelector("a.apphub_sectionTab"));
        if (this.appid) {
            HighlightsTagsUtils.highlightTitle(this.appid);
        }
    }
}
