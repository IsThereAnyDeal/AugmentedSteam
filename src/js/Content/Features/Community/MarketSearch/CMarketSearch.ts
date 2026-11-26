import {bootstrapReact, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import FHighlightMarketItems from "@Content/Features/Community/MarketSearch/FHighlightMarketItems";

export default class CMarketSearch extends Context {}


/**
 * @contentScript
 * @match *://steamcommunity.com/market/search[/*]
 */
export async function run(): Promise<void> {
    const params = await bootstrapReact();

    const context = new CMarketSearch(params);

    await features(context, [
        ...commonFeatures(),
        FHighlightMarketItems
    ]);
}