import Context from "@Content/Modules/Context/Context";
import FUsefulLinks from "./FUsefulLinks";
import {bootstrapLegacy, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import storeFeatures from "@Content/Features/Store/storeFeatures";

export default class CAccount extends Context {}

/**
 * @contentScript
 * @match *://*.steampowered.com/account
 */
export async function run() {
    const params = await bootstrapLegacy();
    const context = new CAccount(params);
    await features(context, [
        ...commonFeatures(),
        ...storeFeatures(),
        FUsefulLinks
    ]);
}
