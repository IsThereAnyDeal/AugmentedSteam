import {SyncedStorage} from "../../../modulesCore";
import {User} from "../User";
import AugmentedSteamApiFacade from "../Facades/AugmentedSteamApiFacade";
import type {TBundle, TPriceOverview} from "@Background/Modules/AugmentedSteam/_types";
import ITADApiFacade from "../Facades/ITADApiFacade";
import Settings from "@Options/Data/Settings";

type TIdType = "app"|"sub"|"bundle";

interface TResponse {
    prices: {
        type: TIdType
        id: number,
        data: TPriceOverview
    }[],
    bundles: TBundle[]
}

class Prices {

    async _getShops(): Promise<number[]> {
        const excludedStores: number[] = Settings.excluded_stores;
        if (!Settings.showallstores && excludedStores.length > 0) {
            const storeList = await ITADApiFacade.getStoreList().catch(err => console.error(err));
            if (storeList) {
                return storeList
                    .map(({id}) => id)
                    .filter(id => !excludedStores.includes(id));
            }
        }
        return [];
    }

    async load(params: {apps?: number[], subs?: number[], bundles?: number[]}) {
        const response = await AugmentedSteamApiFacade.fetchPrices(
            User.storeCountry ?? "US",
            params.apps ?? [],
            params.subs ?? [],
            params.bundles ?? [],
            Settings.showlowestpricecoupon,
            await this._getShops()
        );

        let result: TResponse = {
            prices: [],
            bundles: []
        };
        for (const [gameId, data] of Object.entries(response.prices)) {
            const [type, id] = <[TIdType, string]>gameId.split("/");
            result.prices.push({type, id: Number(id), data});
        }
        result.bundles = response.bundles;
        return result;
    }
}

export {Prices};
