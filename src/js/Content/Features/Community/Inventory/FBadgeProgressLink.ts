import {__viewBadgeProgress} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Feature from "@Content/Modules/Context/Feature";
import type CInventory from "@Content/Features/Community/Inventory/CInventory";
import HTML from "@Core/Html/Html";

export default class FBadgeProgressLink extends Feature<CInventory> {

    override checkPrerequisites(): boolean {
        return this.context.myInventory;
    }

    override apply(): void | Promise<void> {
        this.context.onMarketInfo.subscribe(e => {
            const {view, appid, itemType} = e.data;

            if (itemType !== "booster") { return; }

            HTML.beforeEnd(`#iteminfo${view}_item_owner_actions`,
                `<a class="btn_small btn_grey_white_innerfade" href="//steamcommunity.com/my/gamecards/${appid}/">
                <span>${L(__viewBadgeProgress)}</span>
            </a>`);
        });
    }
}
