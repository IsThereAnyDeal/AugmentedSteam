import Feature from "@Content/Modules/Context/Feature";
import FHighlightsTags from "../../Common/FHighlightsTags";
import Settings from "@Options/Data/Settings";
import type CMarketSearch from "@Content/Features/Community/MarketSearch/CMarketSearch";
import InventoryApiFacade from "@Content/Modules/Facades/InventoryApiFacade";
import HighlightsTagsUtils from "@Content/Modules/Highlights/HighlightsTagsUtils";

export default class FHighlightMarketItems extends Feature<CMarketSearch> {

    override checkPrerequisites(): boolean{
        return Settings.highlight_owned;
    }

    override apply(): void {
        new MutationObserver(() => {
            this.callback();
        }).observe(
            document.getElementById("searchResultsRows")!,
            {"childList": true}
        );

        this.callback();
    }

    private async callback(): Promise<void> {
        const hashNamesMap: Map<string, HTMLElement> = new Map();

        for (const node of document.querySelectorAll<HTMLElement>(".market_listing_row")) {
            if (node.dataset.appid === "753") {
                hashNamesMap.set(node.dataset.hashName!, node);
            }
        }

        if (hashNamesMap.size === 0) { return; }

        const hashNames: string[] = Array.from(hashNamesMap.keys());
        const ownedStatus = await InventoryApiFacade.hasItem(hashNames);

        for (const [hashName, node] of hashNamesMap.entries()) {
            if (ownedStatus[hashName]) {
                HighlightsTagsUtils.highlightOwned([node]);
            }
        }
    }
}
