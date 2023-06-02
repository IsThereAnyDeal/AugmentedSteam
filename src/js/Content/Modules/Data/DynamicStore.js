import {GameId} from "../../../Core/GameId";
import {Background} from "../Background";

class DynamicStore {

    static clear() {
        return Background.action("dynamicstore.clear");
    }

    static async getAppStatus(storeId) {
        const multiple = Array.isArray(storeId);
        const storeIds = multiple ? storeId : [storeId];
        const trimmedIds = storeIds.map(id => GameId.trimStoreId(id));

        const dsStatus = await Background.action("dynamicstore.status", trimmedIds);

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

    static getRandomApp() {
        return Background.action("dynamicstore.randomapp");
    }
}

export {DynamicStore};
