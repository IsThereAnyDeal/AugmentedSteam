import FCartHistoryLink from "./FCartHistoryLink";
import Context from "@Content/Modules/Context/Context";
import {bootstrapReact, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";

export default class CCart extends Context {}


/**
 * @contentScript
 * @match *://*.steampowered.com/cart[/*]
 */
export async function run(): Promise<void> {
    const params = await bootstrapReact();
    const context = new CCart(params);

    await features(context, [
        ...commonFeatures(),
        FCartHistoryLink,
    ]);
}