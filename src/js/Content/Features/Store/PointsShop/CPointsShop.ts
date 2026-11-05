import FBackgroundPreviewLink from "./FBackgroundPreviewLink";
import Context from "@Content/Modules/Context/Context";
import {bootstrapLegacy, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";

export default class CPointsShop extends Context {}


/**
 * @contentScript
 * @match *://*.steampowered.com/points[/*]
 */
export async function run(): Promise<void> {
    const params = await bootstrapLegacy();
    const context = new CPointsShop(params);

    await features(context, [
        ...commonFeatures(),
        FBackgroundPreviewLink
    ]);
}