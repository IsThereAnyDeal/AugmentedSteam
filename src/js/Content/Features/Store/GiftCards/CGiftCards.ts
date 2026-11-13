import Context from "@Content/Modules/Context/Context";
import {bootstrapLegacy, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import FCustomGiftcard from "@Content/Features/Store/GiftCards/FCustomGiftcard";
import storeFeatures from "@Content/Features/Store/storeFeatures";

export default class CGiftCards extends Context {}


/**
 * @contentScript
 * @match *://*.steampowered.com/digitalgiftcards/selectgiftcard
 */
export async function run(): Promise<void> {
    const params = await bootstrapLegacy();
    const context = new CGiftCards(params);

    await features(context, [
        ...commonFeatures(),
        ...storeFeatures(),
        FCustomGiftcard
    ]);
}