import Context from "@Content/Modules/Context/Context";
import FLicensesSummary from "./FLicensesSummary";
import {bootstrapLegacy, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import storeFeatures from "@Content/Features/Store/storeFeatures";

export default class CLicenses extends Context {}

/**
 * @contentScript
 * @match *://store.steampowered.com/account/licenses
 */
export async function run(): Promise<void> {
    const params = await bootstrapLegacy();
    const context: CLicenses = new CLicenses(params);
    await features(context, [
        ...commonFeatures(),
        ...storeFeatures(),
        FLicensesSummary
    ]);
}
