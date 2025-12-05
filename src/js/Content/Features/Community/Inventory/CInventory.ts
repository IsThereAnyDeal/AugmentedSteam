import CCommunityBase from "../CCommunityBase";
import FInventoryGoTo from "./FInventoryGoTo";
import FPriceHistoryZoomYear from "../FPriceHistoryZoomYear";
import ContextType from "@Content/Modules/Context/ContextType";
import CommunityUtils from "@Content/Modules/Community/CommunityUtils";
import DOMHelper from "@Content/Modules/DOMHelper";
import ASEventHandler from "@Content/Modules/ASEventHandler";
import type {ContextParams} from "@Content/Modules/Context/Context";
import FInventoryFeatures from "@Content/Features/Community/Inventory/FInventoryFeatures";

export interface MarketInfo {
    view: number,
    sessionId: string,
    marketAllowed: boolean,
    country: string,
    assetId: string,
    contextId: number,
    globalId: number,
    walletCurrency: number,
    marketable: boolean,
    hashName: string,
    publisherFee: number,
    lowestListingPrice: number,
    restriction: boolean,
    appid: number,
    itemType: string,
    hasGooOption: boolean
}

export default class CInventory extends CCommunityBase {

    public readonly myInventory: boolean = false;
    public readonly onMarketInfo: ASEventHandler<MarketInfo|null> = new ASEventHandler<MarketInfo|null>();

    constructor(params: ContextParams) {

        // Don't apply features on empty or private inventories
        const hasFeatures = document.getElementById("no_inventories") === null;

        super(params, ContextType.INVENTORY, hasFeatures ? [
                FInventoryGoTo,
                FPriceHistoryZoomYear,
                FInventoryFeatures
            ] : []);

        if (!hasFeatures) {
            return;
        }

        this.myInventory = CommunityUtils.userIsOwner(this.user);

        // @ts-ignore
        document.addEventListener("as_marketInfo", (e: CustomEvent<MarketInfo|null>) => {
            this.onMarketInfo.dispatch(e.detail);
        });

        DOMHelper.insertScript("scriptlets/Community/Inventory/marketInfo.js");
    }
}
