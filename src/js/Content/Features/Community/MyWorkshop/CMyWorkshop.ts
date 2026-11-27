import FWorkshopFileSizes from "./FWorkshopFileSizes";
import Context from "@Content/Modules/Context/Context";
import {bootstrapLegacy, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";

export default class CMyWorkshop extends Context {}


/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/myworkshopfiles[/]?*browsefilter=mysubscriptions*
 */
export async function run(): Promise<void> {
    const params = await bootstrapLegacy();

    const context = new CMyWorkshop(params);

    await features(context, [
        ...commonFeatures(),
        FWorkshopFileSizes
    ]);
}