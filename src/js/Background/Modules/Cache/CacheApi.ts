import IndexedDB from "@Background/Db/IndexedDB";
import type MessageHandlerInterface from "@Background/MessageHandlerInterface";
import LocalStorage from "@Core/Storage/LocalStorage";
import {EAction} from "@Background/EAction";
import {Unrecognized} from "@Background/background";

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

    handle(message: any): typeof Unrecognized|Promise<any> {

        switch (message.action) {
            case EAction.CacheClear: {
                return this.clearCache();
            }
        }

        return Unrecognized;
    }
}
