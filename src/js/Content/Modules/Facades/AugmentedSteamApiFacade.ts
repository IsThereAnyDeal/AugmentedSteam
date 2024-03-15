import {BackgroundSender} from "../../../Core/BackgroundSimple";
import type {TFetchPricesMessage, TFetchPricesResponse} from "../../../Background/Modules/AugmentedSteam/_types";

export default class AugmentedSteamApiFacade {

    static fetchPrices(
        country: string,
        apps: number[],
        subs: number[],
        bundles: number[],
        voucher: boolean,
        shops: number[]
    ): Promise<TFetchPricesResponse> {
        return BackgroundSender.send<TFetchPricesMessage, TFetchPricesResponse>({
            action: "prices",
            params: {country, apps, subs, bundles, voucher, shops}
        });
    }
}
