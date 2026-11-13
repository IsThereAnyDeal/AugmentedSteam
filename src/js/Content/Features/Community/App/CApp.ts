import FCommunityAppPageLinks from "./FCommunityAppPageLinks";
import FCommunityAppPageWishlist from "./FCommunityAppPageWishlist";
import AppId from "@Core/GameId/AppId";
import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import FSkipAgecheck from "@Content/Features/Community/App/FSkipAgecheck";
import {bootstrapLegacy, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import FAppTitleHighlight from "@Content/Features/Community/App/FAppTitleHighlight";

export default class CApp extends Context {

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
 * @match  *://steamcommunity.com/app/*
 * @exclude *://steamcommunity.com/app/*\/guides
 */
export async function run(): Promise<void> {
    const params = await bootstrapLegacy();
    const context = new CApp(params);

    await features(context, [
        ...commonFeatures(),
        FCommunityAppPageLinks,
        FCommunityAppPageWishlist,
        FSkipAgecheck,
        FAppTitleHighlight
    ]);
}