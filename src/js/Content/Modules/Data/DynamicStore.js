import {GameId} from "../../../Core/GameId";
import {Background} from "../Background";
import {User} from "../User";

class DynamicStore {

    /*
     * FIXME
     *  1. Check usage of `await DynamicStore`, currently it does nothing
     *  2. getAppStatus() is not properly waiting for initialization of the DynamicStore
     *  3. There is no guarante that `User` is initialized before `_fetch()` is called
     *  4. getAppStatus() should probably be simplified if we force array even when only one storeId was requested
     */

    static clear() {
        return Background.action("dynamicstore.clear");
    }

    static async getAppStatus(storeId) {
        const multiple = Array.isArray(storeId);
        let promise;
        let trimmedIds;

        if (multiple) {
            trimmedIds = storeId.map(id => GameId.trimStoreId(id));
            promise = Background.action("dynamicstorestatus", trimmedIds);
        } else {
            promise = Background.action("dynamicstorestatus", GameId.trimStoreId(storeId));
        }

        let statusList;
        const dsStatusList = await promise;

        if (multiple) {
            statusList = {};
            for (let i = 0; i < storeId.length; ++i) {
                const trimmedId = trimmedIds[i];
                const id = storeId[i];
                statusList[id] = {
                    "ignored": dsStatusList[trimmedId].includes("ignored"),
                    "wishlisted": dsStatusList[trimmedId].includes("wishlisted"),
                };
                if (id.startsWith("app/")) {
                    statusList[id].owned = dsStatusList[trimmedId].includes("ownedApps");
                } else if (id.startsWith("sub/")) {
                    statusList[id].owned = dsStatusList[trimmedId].includes("ownedPackages");
                }
            }
        } else {
            statusList = {
                "ignored": dsStatusList.includes("ignored"),
                "wishlisted": dsStatusList.includes("wishlisted"),
            };
            if (storeId.startsWith("app/")) {
                statusList.owned = dsStatusList.includes("ownedApps");
            } else if (storeId.startsWith("sub/")) {
                statusList.owned = dsStatusList.includes("ownedPackages");
            }
        }

        return statusList;
    }

    static async getRandomApp() {
        await DynamicStore._fetch();
        return Background.action("dynamicStore.randomApp");
    }

    static _fetch() {
        if (!User.isSignedIn) {
            return DynamicStore.clear();
        }
        return Promise.resolve(null);
    }

    static then(onDone, onCatch) {
        if (!DynamicStore._promise) {
            DynamicStore._promise = DynamicStore._fetch();
        }
        return DynamicStore._promise.then(onDone, onCatch);
    }
}

export {DynamicStore};
