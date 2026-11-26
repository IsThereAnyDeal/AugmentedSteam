import CCommunityBase from "../CCommunityBase";
import FSoldAmountLastDay from "./FSoldAmountLastDay";
import FBackgroundPreviewLink from "./FBackgroundPreviewLink";
import FBadgePageLink from "./FBadgePageLink";
import type {ContextParams} from "@Content/Modules/Context/Context";
import {bootstrapLegacy, bootstrapReact, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";

export default class CMarketListing extends CCommunityBase {

    public readonly appid: number;
    public readonly marketHashName: string;

    constructor(params: ContextParams) {
        super(params);

        const m = window.location.pathname.match(/^\/market\/listings\/(\d+)\/([^/]+)/)!;
        this.appid = Number(m[1]);
        this.marketHashName = String(m[2]);
    }
}


/**
 * @contentScript
 * @match *://steamcommunity.com/market/listings/*
 */
export async function run(): Promise<void> {
    const params = await bootstrapReact();
    const context = new CMarketListing(params);

    await features(context, [
        ...commonFeatures(),
        FSoldAmountLastDay,
        FBackgroundPreviewLink,
//        FBadgePageLink,
    ]);
}
