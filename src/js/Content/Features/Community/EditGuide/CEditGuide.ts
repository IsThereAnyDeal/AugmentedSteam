import Context from "@Content/Modules/Context/Context";
import FMaxLengthIndicator from "@Content/Features/Community/EditGuide/FMaxLengthIndicator";
import {bootstrapLegacy, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import CBoosterCreator from "@Content/Features/Community/BoosterCreator/CBoosterCreator";

export default class CEditGuide extends Context {}


/**
 * @contentScript
 * @match *://steamcommunity.com/sharedfiles/editguide[/]?*
 * @match *://steamcommunity.com/workshop/editguide[/]?*
 */
export async function run(): Promise<void> {
    const params = await bootstrapLegacy();
    const context = new CBoosterCreator(params);

    // Don't apply features if there's an error message (e.g. not your guide thus can't edit)
    const hasFeatures = document.getElementById("message") === null;

    await features(context, [
        ...commonFeatures(),
        ...(hasFeatures ? [
            FMaxLengthIndicator
        ] : [])
    ]);
}