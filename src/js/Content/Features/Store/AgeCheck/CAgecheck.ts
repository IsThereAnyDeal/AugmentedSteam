import FSkipAgecheckPage from "./FSkipAgecheckPage";
import Context from "@Content/Modules/Context/Context";
import {bootstrapReact, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import storeFeatures from "@Content/Features/Store/storeFeatures";

export default class CAgeCheck extends Context {}

/**
 * @contentScript
 * @match *://*.steampowered.com/agecheck/*
 */
export async function run(): Promise<void> {
    const params = await bootstrapReact();
    const context = new CAgeCheck(params);
    await features(context, [
        ...commonFeatures(),
        ...storeFeatures(),
        FSkipAgecheckPage
    ]);
}
