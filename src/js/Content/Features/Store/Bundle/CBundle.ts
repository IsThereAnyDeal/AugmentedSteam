import BundleId from "@Core/GameId/BundleId";
import FDRMWarnings from "../Common/FDRMWarnings";
import FITADPrices from "../Common/FITADPrices";
import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import FPackageHighlights from "@Content/Features/Store/Common/FPackageHighlights";
import {bootstrapLegacy, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import storeFeatures from "@Content/Features/Store/storeFeatures";
import FExtraLinksBundle from "@Content/Features/Store/Bundle/FExtraLinksBundle";
import FBundleTitle from "@Content/Features/Store/Bundle/FBundleTitle";

export default class CBundle extends Context {

    public readonly appid: null = null;
    public readonly bundleid: number;

    constructor(params: ContextParams) {
        super(params);
        this.bundleid = BundleId.fromUrl(window.location.host + window.location.pathname)!;
    }
}


/**
 * @contentScript *://*.steampowered.com/bundle/*
 * @match *://*.steampowered.com/bundle/*
 */
export async function run(): Promise<void> {
    const params = await bootstrapLegacy();
    const context = new CBundle(params);

    await features(context, [
        ...commonFeatures(),
        ...storeFeatures(),
        FExtraLinksBundle,
        FDRMWarnings,
        FITADPrices,
        FPackageHighlights,
        FBundleTitle
    ]);
}