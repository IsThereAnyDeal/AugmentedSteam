import self_ from "./FSoldAmountLastDay.svelte";
import Feature from "@Content/Modules/Context/Feature";
import type CMarketListing from "@Content/Features/Community/MarketListing/CMarketListing";
import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
import RequestData from "@Content/Modules/Data/RequestData";
import {MountTargetError} from "@Core/Errors/Errors";
import SelectorMap from "@Content/SelectorMap";
import {mount} from "svelte";

export default class FSoldAmountLastDay extends Feature<CMarketListing> {

    override async isEnabled(): Promise<boolean> {
        // FIXME setting
        return true;
    }

    override async apply(): Promise<string|null> {
        const target = document.querySelector<HTMLElement>(SelectorMap.market.listing.sellColumn);
        if (!target) {
            throw new MountTargetError();
        }

        const country = this.context.user.storeCountry;
        const currencyNumber = CurrencyManager.getCurrencyInfo(CurrencyManager.storeCurrency).id;

        const data = await RequestData.getJson<{
            success?: boolean,
            volume?: number
        }>(`https://steamcommunity.com/market/priceoverview/?appid=${this.context.appid}&country=${country}&currency=${currencyNumber}&market_hash_name=${this.context.marketHashName}`);
        if (!data.success) {
            throw new Error("Failed to load data");
        }

        mount(self_, {
            target,
            props: {
                volume: data.volume ?? 0
            }
        });
        return null;
    }
}
