import CCommunityBase from "../CCommunityBase";
import FSoldAmountLastDay from "./FSoldAmountLastDay";
import FBackgroundPreviewLink from "./FBackgroundPreviewLink";
import FBadgePageLink from "./FBadgePageLink";
import type {ContextParams} from "@Content/Modules/Context/Context";
import {bootstrapReact, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import SteamFacade from "@Content/Facades/SteamFacade";

export const enum EItemClass {
    Card = "item_class_2",
    Background = "item_class_3",
    BoosterPack = "item_class_5"
}

// derived from CEconItem_Description
export interface TCEconItem_Description {
    appid: number,
    icon_url: string,
    icon_url_large: string,
    market_fee_app: number,
    market_hash_name: string,
    tags: Array<{
        category: string,
        internal_name: string
    }>
}

export default class CMarketListing extends CCommunityBase {

    // TODO add partial type based on usage
    public readonly item: TCEconItem_Description;
    public readonly itemClass: string|null;

    constructor(params: ContextParams, item: TCEconItem_Description) {
        super(params);
        this.item = item;

        let itemClass: string|null = null;
        for (const tag of item.tags) {
            if (tag.category === "item_class") {
                itemClass = tag.internal_name ?? null;
                break;
            }
        }
        this.itemClass = itemClass;
    }

    get appid(): number {
        return this.item.appid;
    }

    get marketHashName(): string {
        return this.item.market_hash_name;
    }
}


/**
 * @contentScript
 * @match *://steamcommunity.com/market/listings/*
 */
export async function run(): Promise<void> {
    const params = await bootstrapReact();

    const queryData = JSON.parse(await SteamFacade.global("SSR.renderContext.queryData"));

    let item: TCEconItem_Description;
    for (let query of queryData.queries) {
        const [a, b] = query.queryKey;
        if (a === "market" && b === "description") {
            item = query.state.data;
            break;
        }
    }

    const context = new CMarketListing(params, item!);

    await features(context, [
        ...commonFeatures(),
        FSoldAmountLastDay,
        FBackgroundPreviewLink,
        FBadgePageLink,
    ]);
}
