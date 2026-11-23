import FRemoveGuidesLangFilter from "./FRemoveGuidesLangFilter";
import {bootstrapLegacy, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import communityFeatures from "@Content/Features/Community/communityFeatures";
import FCommunityAppPageLinks from "@Content/Features/Community/App/FCommunityAppPageLinks";
import FCommunityAppPageWishlist from "@Content/Features/Community/App/FCommunityAppPageWishlist";
import FSkipAgecheck from "@Content/Features/Community/App/FSkipAgecheck";
import FAppTitleHighlight from "@Content/Features/Community/App/FAppTitleHighlight";
import Context, {ContextParams} from "@Content/Modules/Context/Context";
import AppId from "@Core/GameId/AppId";

export default class CGuides extends Context {

    public appid: number|null;

    constructor(params: ContextParams) {
        super(params);

        /**
         * Get appid from the "All" tab link (some pages don't have the appid in the pathname).
         * The value will be `null` for e.g. Greenlight items that don't have the tabs section.
         * Avoid using the "Store Page" button because it doesn't appear for unlisted apps.
         */
        this.appid = AppId.fromElement(document.querySelector("a.apphub_sectionTab"));
    }
}


/**
 * @contentScript
 * @match *://steamcommunity.com/app/*\/guides
 */
export async function run(): Promise<void> {
    const params = await bootstrapLegacy();
    const context = new CGuides(params);

    await features(context, [
        ...commonFeatures(),
        ...communityFeatures(),
        FCommunityAppPageLinks,
        FCommunityAppPageWishlist,
        FSkipAgecheck,
        FAppTitleHighlight,
        FRemoveGuidesLangFilter,
    ]);
}
