import self_ from "./FBackgroundPreviewLink.svelte";
import type CMarketListing from "@Content/Features/Community/MarketListing/CMarketListing";
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
        if (this.context.appid !== 753 || !this.context.user.isSignedIn) {
            return null;
        }

        const target = await dynamicNode<HTMLImageElement>({
            // main content box, second column, trying to add button below "Add to Watchlist"
            selector: () => document.querySelector(SelectorMap.market.listing.addToWatchlistBox)
        });

        const previewNode = await dynamicNode<HTMLImageElement>({
            selector: () => document.querySelector(SelectorMap.market.listing.backgroundPreview)
        });

        const src = previewNode.src;

        let background: string|null = null;
        if (src.includes("/economy/image/")) {
            background = src.replace(/^(.+)(\/economy\/image\/)/, "$2")
        } else if (src.includes("/community_assets/images/items/")) {
            background = src.replace(/^(.+)\/community_assets\/images\/items\//, "");
        }

        if (!background) {
            throw new Error("Unknown image format");
        }

        mount(self_, {
            target,
            props: {
                profileUrl: this.context.user.profileUrl,
                background
            }
        });

        return null;
    }
}
