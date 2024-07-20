import {__oneclickgoo} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import type CInventory from "@Content/Features/Community/Inventory/CInventory";
import {type MarketInfo} from "@Content/Features/Community/Inventory/CInventory";
import Settings from "@Options/Data/Settings";
import Feature from "@Content/Modules/Context/Feature";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class FOneClickGemsOption extends Feature<CInventory> {

    override checkPrerequisites(): boolean {
        return this.context.myInventory && Settings.show1clickgoo;
    }

    override apply(): void | Promise<void> {
        this.context.onMarketInfo.subscribe(e => this.callback(e.data));
    }

    private callback(marketInfo: MarketInfo): void {
        const {view, sessionId, assetId, appid} = marketInfo;

        if (!appid) {
            return;
        }

        // scrap link is always present, replace the link to avoid attaching multiple listeners
        const scrapLink = document.getElementById(`iteminfo${view}_item_scrap_link`);
        if (!scrapLink) {
            return;
        }

        const newScrapLink = <HTMLElement>(scrapLink.cloneNode(true));
        scrapLink.replaceWith(newScrapLink);

        newScrapLink.querySelector<HTMLElement>("span")!.textContent = L(__oneclickgoo);

        newScrapLink.addEventListener("click", e => {
            e.preventDefault();
            DOMHelper.insertScript("scriptlets/Community/Inventory/oneClickGems.js", {sessionId, assetId, appid})
        });
    }
}
