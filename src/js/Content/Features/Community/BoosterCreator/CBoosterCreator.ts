import FShowGemsCost from "./FShowGemsCost";
import {bootstrapLegacy, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import Context from "@Content/Modules/Context/Context";

export default class CBoosterCreator extends Context {}


/**
 * @contentScript
 * @match *://steamcommunity.com/tradingcards/boostercreator
 */
export async function run(): Promise<void> {
    const params = await bootstrapLegacy();
    const context = new CBoosterCreator(params);

    await features(context, [
        ...commonFeatures(),
        FShowGemsCost
    ]);
}