import IndexedDB from "@Background/Db/IndexedDB";
import type MessageHandlerInterface from "@Background/MessageHandlerInterface";
import LocalStorage from "@Core/Storage/LocalStorage";
import {EAction} from "@Background/EAction";

export default class CacheApi implements MessageHandlerInterface{

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
            "storePageData",
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
