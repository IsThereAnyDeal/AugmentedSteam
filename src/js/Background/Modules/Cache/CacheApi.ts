import IndexedDB from "../IndexedDB";
import type ApiHandlerInterface from "@Background/ApiHandlerInterface";
import LocalStorage from "@Core/Storage/LocalStorage";
import {EAction} from "@Background/EAction";

export default class CacheApi implements ApiHandlerInterface{

    private async clearCache(): Promise<void> {
        await LocalStorage.remove(
            "currency"
        );

        await IndexedDB.clear(
            "coupons",
            "giftsAndPasses",
            "items",
            "earlyAccessAppids",
            "purchases",
            "dynamicStore",
            "packages",
            "profiles",
            "rates",
            "collection",
            "waitlist",
            "itadImport",
            "workshopFileSizes",
            "reviews",
            "storeList",
            "expiries"
        );
    }

    async handle(message: any) {

        switch (message.action) {
            case EAction.CacheClear: {
                return await this.clearCache();
            }
        }

        return undefined;
    }
}
