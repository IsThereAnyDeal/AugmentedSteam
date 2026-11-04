import Context from "@Content/Modules/Context/Context";
import {bootstrapLegacy, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import FCustomWallet from "@Content/Features/Store/Funds/FCustomWallet";

export default class CFunds extends Context {}


/**
 * @contentScript
 * @match *://*.steampowered.com/steamaccount/addfunds
 */
export async function run(): Promise<void> {
    const params = await bootstrapLegacy();
    const context = new CFunds(params);

    await features(context, [
        ...commonFeatures(),
        FCustomWallet
    ]);
}