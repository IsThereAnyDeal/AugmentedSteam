import self_ from "./FBackgroundPreviewLink.svelte";
import CMarketListing, {EItemClass} from "@Content/Features/Community/MarketListing/CMarketListing";
import Feature from "@Content/Modules/Context/Feature";
import {mount} from "svelte";
import dynamicNode from "@Content/Modules/DOM/DynamicNode";
import SelectorMap from "@Content/SelectorMap";

export default class FBackgroundPreviewLink extends Feature<CMarketListing> {

    override async isEnabled(): Promise<boolean> {
        // FIXME setting
        return true;
    }

    override async apply(): Promise<string|null> {
        if (!this.context.user.isSignedIn) {
            return "Not signed in";
        }

        if (this.context.appid !== 753) {
            return "Wrong app type";
        }

        if (this.context.itemClass === null
            || this.context.itemClass !== String(EItemClass.Background)) {
            return `Wrong or unknown item class (${this.context.itemClass})`;
        }

        const url = this.context.item.icon_url;
        if (!url) {
            return "Image not found";
        }

        const target = await dynamicNode<HTMLElement>({
            // main content box, second column, trying to add button below "Add to Watchlist"
            selector: () => document.querySelector(SelectorMap.market.listing.addToWatchlistBox)
        });

        mount(self_, {
            target,
            props: {
                profileUrl: this.context.user.profileUrl,
                background: "/economy/image/"+url
            }
        });

        return null;
    }
}
