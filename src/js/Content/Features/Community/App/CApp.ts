import FHighlightsTags from "../../Common/FHighlightsTags";
import FSkipAgecheck from "../../Common/FSkipAgecheck";
import {FCommunityAppPageLinks} from "./FCommunityAppPageLinks.svelte";
import {FCommunityAppPageWishlist} from "./FCommunityAppPageWishlist.svelte";
import CCommunityBase from "@Content/Features/Community/CCommunityBase";
import {ContextType} from "@Content/Modules/Context/ContextType";
import AppId from "@Core/GameId/AppId";
import type Feature from "@Content/Modules/Context/Feature";
import type Context from "@Content/Modules/Context/Context";

export default class CApp extends CCommunityBase {

    public appid: number|null;

    constructor(
        type: ContextType = ContextType.COMMUNITY_APP,
        features: (typeof Feature<Context>)[] = []
    ) {

        features.push(
            FCommunityAppPageLinks,
            FCommunityAppPageWishlist,
            FSkipAgecheck,
        );

        super(type, features);

        /**
         * Get appid from the "All" tab link (some pages don't have the appid in the pathname).
         * The value will be `null` for e.g. Greenlight items that don't have the tabs section.
         * Avoid using the "Store Page" button because it doesn't appear for unlisted apps.
         */
        this.appid = AppId.fromElement(document.querySelector("a.apphub_sectionTab"));
        if (this.appid) {
            FHighlightsTags.highlightTitle(this.appid);
        }
    }
}
