import {SyncedStorage} from "../../../modulesCore";
import {Background, User} from "../../modulesContent";

class Prices {

    async _getShops(params) {
        const excludedStores = SyncedStorage.get("excluded_stores");
        if (!SyncedStorage.get("showallstores") && excludedStores.length > 0) {
            const storeList = await Background.action("itad.storelist").catch(err => console.error(err));
            if (storeList) {
                return storeList.map(({id}) => id).filter(id => !excludedStores.includes(id)).join(",");
            }
        }
        return [];
    }

    async load(params) {
        const response = await Background.action("prices", {
            country: User.storeCountry ?? "US",
            apps: params.apps ?? [],
            subs: params.subs ?? [],
            bundles: params.bundles ?? [],
            voucher: SyncedStorage.get("showlowestpricecoupon") ?? false,
            shops: await this._getShops()
        });

        let result = {
            prices: [],
            bundles: []
        };
        for (const [gameId, data] of Object.entries(response.prices)) {
            const [type, id] = gameId.split("/");
            result.prices.push({type, id, data});
        }
        result.bundles = response.bundles;
        return result;
    }
}

export {Prices};
