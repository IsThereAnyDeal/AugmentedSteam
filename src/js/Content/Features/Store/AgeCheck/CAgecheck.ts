import FSkipAgecheckPage from "./FSkipAgecheckPage";
import Context from "@Content/Modules/Context/Context";
import {bootstrapLegacy, features} from "@Content/bootstrap";

export default class CAgeCheck extends Context {}

/**
 * @contentScript
 * @match *://*.steampowered.com/agecheck/*
 */
export async function run(): Promise<void> {
    const params = await bootstrapLegacy();
    const context = new CAgeCheck(params);
    await features(context, [FSkipAgecheckPage]);
}
