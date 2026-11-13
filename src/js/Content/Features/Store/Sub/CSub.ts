import SubId from "@Core/GameId/SubId";
import FDRMWarnings from "../Common/FDRMWarnings";
import FITADPrices from "../Common/FITADPrices";
import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import {bootstrapLegacy, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import storeFeatures from "@Content/Features/Store/storeFeatures";
import FPackageHighlights from "@Content/Features/Store/Common/FPackageHighlights";
import FExtraLinksSub from "@Content/Features/Store/Sub/FExtraLinksSub";
import FRegionalPricingSub from "@Content/Features/Store/Sub/FRegionalPricingSub";
import FBundleTitle from "@Content/Features/Store/Common/FBundleTitle";

export default class CSub extends Context {

    public readonly appid: null = null;
    public readonly subid: number;

    constructor(params: ContextParams) {
        super(params);
        this.subid = SubId.fromUrl(window.location.host + window.location.pathname)!;
    }
}


/**
 * @contentScript
 * @match *://*.steampowered.com/sub/*
 */
export async function run(): Promise<void> {
    const params = await bootstrapLegacy();
    const context = new CSub(params);

    await features(context, [
        ...commonFeatures(),
        ...storeFeatures(),
        FExtraLinksSub,
        FDRMWarnings,
        FITADPrices,
        FRegionalPricingSub,
        FPackageHighlights,
        FBundleTitle
    ]);
}