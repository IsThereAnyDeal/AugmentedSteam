import FMultiProductKeys from "./FMultiProductKeys";
import Context from "@Content/Modules/Context/Context";
import {bootstrapLegacy, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import storeFeatures from "@Content/Features/Store/storeFeatures";

export default class CRegisterKey extends Context {}


/**
 * @contentScript
 * @match *://*.steampowered.com/account/registerkey
 */
export async function run(): Promise<void> {
    const params = await bootstrapLegacy();
    const context = new CRegisterKey(params);

    await features(context, [
        ...commonFeatures(),
        ...storeFeatures(),
        FMultiProductKeys
    ]);
}