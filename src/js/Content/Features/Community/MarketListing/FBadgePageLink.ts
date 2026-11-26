import self_ from "./FBadgePageLink.svelte";
import CMarketListing, {EItemClass} from "@Content/Features/Community/MarketListing/CMarketListing";
import Feature from "@Content/Modules/Context/Feature";
import {mount} from "svelte";
import dynamicNode from "@Content/Modules/DOM/DynamicNode";
import SelectorMap from "@Content/SelectorMap";

export default class FBadgePageLink extends Feature<CMarketListing> {

    override async isEnabled(): Promise<boolean> {
        // FIXME setting
        return true;
    }

    override async apply(): Promise<string|null> {
        if (this.context.appid !== 753) {
            return "Wrong app type";
        }

        if (this.context.itemClass === null
            || ![String(EItemClass.Card), String(EItemClass.BoosterPack)].includes(this.context.itemClass)) {
                return `Wrong or unknown item class (${this.context.itemClass})`;
        }

        const gameAppId = parseInt(this.context.marketHashName);
        if (!gameAppId) {
            return "Didn't find game appid";
        }

        const marketHashName = decodeURIComponent(this.context.marketHashName);
        let isFoil: boolean = false;
        for (const tag of this.context.item.tags) {
            if (tag.category === "cardborder") {
                isFoil = tag.internal_name === "cardborder_1";
                break;
            }
        }

        const target = await dynamicNode<HTMLElement>({
            // main content box, second column, trying to add button below "Add to Watchlist"
            selector: () => document.querySelector(SelectorMap.market.listing.addToWatchlistBox)
        });

        mount(self_, {
            target,
            props: {
                gameAppId,
                isFoil
            }
        });

        return null;
    }
}
