import Context from "@Content/Modules/Context/Context";
import FUsefulLinks from "./FUsefulLinks";
import {bootstrapLegacy, features} from "@Content/bootstrap";

export default class CAccount extends Context {}

/**
 * @contentScript
 * @match *://*.steampowered.com/account
 */
export async function run() {
    const params = await bootstrapLegacy();
    const context = new CAccount(params);
    await features(context, [FUsefulLinks]);
}
