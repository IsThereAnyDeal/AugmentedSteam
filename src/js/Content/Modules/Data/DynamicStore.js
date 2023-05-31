import {GameId} from "../../../Core/GameId";
import {Background} from "../Background";
import {User} from "../User";

class DynamicStore {

    /*
     * FIXME
     *  1. Check usage of `await DynamicStore`, currently it does nothing
     *  2. getAppStatus() is not properly waiting for initialization of the DynamicStore
     *  3. There is no guarante that `User` is initialized before `_fetch()` is called
     */

    static clear() {
        return Background.action("dynamicstore.clear");
    }

    static async getAppStatus(storeId) {
        const multiple = Array.isArray(storeId);
        const storeIds = multiple ? storeId : [storeId];
        const trimmedIds = storeIds.map(id => GameId.trimStoreId(id));

        const dsStatus = await Background.action("dynamicstorestatus", trimmedIds);

        const status = storeIds.reduce((acc, id, i) => {
            const trimmedId = trimmedIds[i];
            acc[id] = {
                "ignored": dsStatus[trimmedId].includes("ignored"),
                "wishlisted": dsStatus[trimmedId].includes("wishlisted"),
            };
            if (id.startsWith("app/")) {
                acc[id].owned = dsStatus[trimmedId].includes("ownedApps");
            } else if (id.startsWith("sub/")) {
                acc[id].owned = dsStatus[trimmedId].includes("ownedPackages");
            }
            return acc;
        }, {});

        return multiple ? status : status[storeId];
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
